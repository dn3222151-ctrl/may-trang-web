import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';

const BASE = 'C:/Users/dn322/Documents/deepseek-harness/default-workspace/maytrang-web';
const SRC = BASE + '/assets/js';
const files = ['config.js', 'core/util.js', 'data/catalog.js', 'data/content.js', 'data/seed.js', 'core/store.js', 'core/finance.js'];

const mem = new Map();
globalThis.window = globalThis;
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
  key: (i) => Array.from(mem.keys())[i] ?? null,
  get length() { return mem.size; },
};
globalThis.document = {
  getElementById: () => null,
  createElement: () => ({ style: {}, classList: { add() {}, remove() {} }, setAttribute() {}, appendChild() {}, addEventListener() {}, remove() {} }),
  querySelectorAll: () => [], querySelector: () => null, body: { appendChild() {} }, addEventListener() {}, removeEventListener() {},
};
Object.defineProperty(globalThis, 'navigator', { value: { clipboard: { writeText: async () => {} } }, configurable: true });
globalThis.addEventListener = () => {};

for (const f of files) {
  const p = path.join(SRC, f);
  vm.runInThisContext(fs.readFileSync(p, 'utf8'), { filename: p });
}

const MT = globalThis.MT;
const data = MT.db.data;
const products = MT.products.all({ includeInactive: true });

function q(v) {
  if (v === null || v === undefined || v === '') return 'null';
  return "'" + String(v).replace(/'/g, "''") + "'";
}
function s(v) {
  if (v === null || v === undefined) return 'null';
  return "'" + String(v).replace(/'/g, "''") + "'";
}
function j(v) {
  return '$json$' + JSON.stringify(v == null ? null : v) + '$json$::jsonb';
}

const out = [];
out.push('-- ============================================================================');
out.push('-- MÂY TRẮNG – Seed dữ liệu mẫu cho Supabase');
out.push('-- Chạy SAU schema.sql. Dữ liệu sinh tự động từ ứng dụng, ngày: ' + new Date().toISOString());
out.push('-- Có thể chạy lại: các bản ghi trùng sẽ được bỏ qua (không ghi đè).');
out.push('-- ============================================================================');
out.push('begin;');
out.push('');

// Settings
out.push('-- Cài đặt');
out.push('insert into public.settings (id, data, updated_at) values (1, ' + j(data.settings) + ', ' + s(data.settings.updatedAt || new Date().toISOString()) + ')');
out.push('on conflict (id) do update set data = excluded.data, updated_at = now();');
out.push('');

// Products
out.push('-- Sản phẩm (' + products.length + ')');
for (const p of products) {
  const cols = ['id', 'slug', 'name', 'sku', 'category', 'price', 'compare_at', 'cost', 'stock', 'sold', 'rating', 'review_count', 'volume', 'weight', 'badge', 'short_description', 'description', 'benefits', 'ingredients', 'usage_steps', 'skin_types', 'images', 'variants', 'active', 'created_at'];
  const vals = [
    s(p.id), s(p.slug), s(p.name), s(p.sku), s(p.cat), p.price, p.compareAt ? p.compareAt : 'null', p.cost, p.stock,
    p.sold || 0, p.rating || 0, p.reviewCount || 0, s(p.volume), p.weight || 0, s(p.badge),
    s(p.short), s(p.description), j(p.benefits || []), s(p.ingredients), j(p.usage || []),
    j(p.skin || []), j(p.images || []), j(p.variants || []), p.active !== false,
    s(p.createdAt || new Date().toISOString()),
  ];
  out.push('insert into public.products (' + cols.join(', ') + ') values (' + vals.join(', ') + ') on conflict (id) do nothing;');
}
out.push('');

// Members
out.push('-- Thành viên (' + data.members.length + ')');
for (const m of data.members) {
  out.push('insert into public.members (id, name, role, email, phone, equity_pct, weekly_hours, status, joined_at, color, kpi_target, skills, note) values (' + [
    s(m.id), s(m.name), s(m.role), s(m.email), s(m.phone), m.equityPct || 0, m.weeklyHours || 0,
    s(m.status || 'active'), q(m.joinedAt), s(m.color || '#4F46E5'), m.kpiTarget || 0, j(m.skills || []), s(m.note || ''),
  ].join(', ') + ') on conflict (id) do nothing;');
}
out.push('');

// Tasks + evidence + activity
out.push('-- Nhiệm vụ (' + data.tasks.length + ')');
for (const t of data.tasks) {
  out.push('insert into public.tasks (id, code, title, description, assignee_id, priority, status, progress, due_date, estimate_hours, actual_hours, tags, created_at, completed_at) values (' + [
    s(t.id), s(t.code), s(t.title), s(t.desc || ''), q(t.assigneeId), s(t.priority), s(t.status), t.progress || 0,
    q(t.dueDate), t.estimateHours || 0, t.actualHours || 0, j(t.tags || []),
    s(t.createdAt || new Date().toISOString()), q(t.completedAt),
  ].join(', ') + ') on conflict (id) do nothing;');
  (t.evidence || []).forEach((e) => {
    out.push('insert into public.task_evidence (id, task_id, type, text_content, url, file_name, note, submitted_by, created_at) values (' + [
      s(e.id), s(t.id), s(e.type), q(e.text), q(e.url), q(e.name), q(e.note), q(e.by), s(e.at || new Date().toISOString()),
    ].join(', ') + ') on conflict (id) do nothing;');
  });
  (t.activity || []).forEach((a) => {
    out.push('insert into public.task_activity (task_id, text, by_member, created_at) values (' + [
      s(t.id), s(a.text), q(a.by), s(a.at || new Date().toISOString()),
    ].join(', ') + ') on conflict (task_id, created_at, text) do nothing;');
  });
}
out.push('');

// Coupons
out.push('-- Mã giảm giá');
for (const c of data.coupons) {
  out.push('insert into public.coupons (id, code, type, value, max_discount, min_order, label, active, expires, usage_count) values (' + [
    s(c.id), s(c.code), s(c.type), c.value, c.maxDiscount || 0, c.minOrder || 0, s(c.label), !!c.active, q(c.expires), c.usageCount || 0,
  ].join(', ') + ') on conflict (id) do nothing;');
}
out.push('');

// Reviews
out.push('-- Đánh giá (' + data.reviews.length + ')');
for (const r of data.reviews) {
  out.push('insert into public.reviews (id, product_id, name, rating, text, verified, source, created_at) values (' + [
    s(r.id), s(r.productId), s(r.name), r.rating, s(r.text), !!r.verified, s(r.source || 'user'), s(r.at),
  ].join(', ') + ') on conflict (id) do nothing;');
}
out.push('');

// Subscribers
out.push('-- Người đăng ký nhận tin');
for (const sub of data.subscribers) {
  out.push('insert into public.subscribers (email, created_at) values (' + s(sub.email) + ', ' + s(sub.at) + ') on conflict (email) do nothing;');
}
out.push('');

// Orders
out.push('-- Đơn hàng (' + data.orders.length + ')');
for (const o of data.orders) {
  out.push('insert into public.orders (id, code, created_at, channel, customer, subtotal, discount, coupon_code, shipping_fee, total, payment_method, payment_status, status, shipping_method, source, timeline) values (' + [
    s(o.id), s(o.code), s(o.createdAt), s(o.channel), j(o.customer), o.subtotal, o.discount || 0,
    q(o.couponCode), o.shippingFee || 0, o.total, s(o.paymentMethod), s(o.paymentStatus), s(o.status),
    s(o.shippingMethod || 'standard'), s(o.source || 'seed'), j(o.timeline || []),
  ].join(', ') + ') on conflict (id) do nothing;');
  (o.items || []).forEach((it) => {
    out.push('insert into public.order_items (order_id, product_id, name, variant, price, cost, qty, image) values (' + [
      s(o.id), q(it.productId), s(it.name), s(it.variant || ''), it.price, it.cost, it.qty, q(it.image),
    ].join(', ') + ') on conflict (order_id, product_id, variant) do nothing;');
  });
}
out.push('');
out.push('commit;');
out.push('');
out.push('-- ============================================================================');
out.push('-- Sau khi chạy seed, tạo tài khoản quản trị (xem cuối schema.sql) rồi đăng nhập');
out.push('-- trong Dashboard > Cài đặt > Supabase và bấm "Đẩy dữ liệu lên".');
out.push('-- ============================================================================');

fs.writeFileSync(BASE + '/supabase/seed.sql', out.join('\n'), 'utf8');
console.log('seed.sql written:', out.length, 'lines,', (fs.statSync(BASE + '/supabase/seed.sql').size / 1024).toFixed(0), 'KB');
