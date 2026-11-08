/* ==========================================================================
   MÂY TRẮNG – Supabase adapter (tùy chọn)
   Ứng dụng luôn chạy được với localStorage. Khi cấu hình Supabase, module này
   đồng bộ sản phẩm, đơn hàng, thành viên, nhiệm vụ và bằng chứng lên cloud.
   ========================================================================== */
(function () {
  const MT = window.MT;
  const U = MT.util;
  const CONFIG_KEY = 'mt.supabase.config';
  let sdkPromise = null;
  let client = null;
  let session = null;

  function getConfig() {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}') || {}; } catch (e) {}
    return {
      url: String(saved.url || MT.config.supabase.url || '').trim(),
      anonKey: String(saved.anonKey || MT.config.supabase.anonKey || '').trim(),
      evidenceBucket: String(saved.evidenceBucket || MT.config.supabase.evidenceBucket || 'task-evidence'),
    };
  }

  function saveConfig(cfg) {
    const next = {
      url: String(cfg.url || '').trim(),
      anonKey: String(cfg.anonKey || '').trim(),
      evidenceBucket: String(cfg.evidenceBucket || 'task-evidence').trim(),
    };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(next));
    client = null;
    session = null;
    return next;
  }

  function isConfigured() {
    const c = getConfig();
    return Boolean(c.url && c.anonKey);
  }

  function loadSdk() {
    if (window.supabase && window.supabase.createClient) return Promise.resolve(window.supabase);
    if (sdkPromise) return sdkPromise;
    sdkPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      s.async = true;
      s.onload = () => window.supabase ? resolve(window.supabase) : reject(new Error('Không tải được Supabase SDK.'));
      s.onerror = () => reject(new Error('Không tải được Supabase SDK. Kiểm tra kết nối mạng.'));
      document.head.appendChild(s);
    });
    return sdkPromise;
  }

  async function getClient() {
    if (client) return client;
    if (!isConfigured()) throw new Error('Chưa cấu hình Supabase URL và anon key.');
    const sdk = await loadSdk();
    const cfg = getConfig();
    client = sdk.createClient(cfg.url, cfg.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
    const { data } = await client.auth.getSession();
    session = data.session || null;
    return client;
  }

  async function test() {
    const c = await getClient();
    const { error } = await c.from('products').select('id', { count: 'exact', head: true }).limit(1);
    if (error) throw new Error(error.message);
    return true;
  }

  async function signIn(email, password) {
    const c = await getClient();
    const { data, error } = await c.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    session = data.session;
    return data.user;
  }

  async function signOut() {
    if (!client) return;
    await client.auth.signOut();
    session = null;
  }

  function currentSession() { return session; }

  function productRow(p) {
    return {
      id: p.id, slug: p.slug, name: p.name, sku: p.sku, category: p.cat,
      price: p.price, compare_at: p.compareAt || null, cost: p.cost, stock: p.stock,
      sold: p.sold || 0, rating: p.rating || 0, review_count: p.reviewCount || 0,
      volume: p.volume || '', weight: p.weight || 0, badge: p.badge || '',
      short_description: p.short || '', description: p.description || '',
      benefits: p.benefits || [], ingredients: p.ingredients || '',
      usage_steps: p.usage || [], skin_types: p.skin || [],
      images: p.images || [], variants: p.variants || [],
      active: p.active !== false,
      created_at: p.createdAt || new Date().toISOString(),
    };
  }

  function orderRow(o) {
    return {
      id: o.id, code: o.code, created_at: o.createdAt, channel: o.channel,
      customer: o.customer, subtotal: o.subtotal, discount: o.discount || 0,
      coupon_code: o.couponCode || '', shipping_fee: o.shippingFee || 0, total: o.total,
      payment_method: o.paymentMethod, payment_status: o.paymentStatus,
      status: o.status, shipping_method: o.shippingMethod || 'standard',
      source: o.source || 'web', timeline: o.timeline || [],
    };
  }

  function taskRow(t) {
    return {
      id: t.id, code: t.code, title: t.title, description: t.desc || '',
      assignee_id: t.assigneeId || null, priority: t.priority, status: t.status,
      progress: t.progress || 0, due_date: t.dueDate || null,
      estimate_hours: t.estimateHours || 0, actual_hours: t.actualHours || 0,
      tags: t.tags || [], created_at: t.createdAt || new Date().toISOString(),
      completed_at: t.completedAt || null, updated_at: t.updatedAt || new Date().toISOString(),
    };
  }

  function flattenEvidence() {
    const rows = [];
    (MT.db.data.tasks || []).forEach((t) => {
      (t.evidence || []).forEach((e) => {
        rows.push({
          id: e.id, task_id: t.id, type: e.type,
          text_content: e.text || null, url: e.url || null,
          file_name: e.name || null, note: e.note || null,
          submitted_by: e.by || null,
          created_at: e.at || new Date().toISOString(),
        });
      });
    });
    return rows;
  }

  function settingsRow() {
    return { id: 1, data: MT.db.settings(), updated_at: new Date().toISOString() };
  }

  async function push(opts) {
    const c = await getClient();
    if (!session) {
      const { data } = await c.auth.getSession();
      session = data.session;
    }
    const log = [];
    const step = async (label, fn) => {
      try { const r = await fn(); if (r && r.error) throw r.error; log.push({ label, ok: true }); }
      catch (e) { log.push({ label, ok: false, error: e.message || String(e) }); }
    };

    const products = MT.products.all({ includeInactive: true }).map(productRow);
    const members = (MT.db.data.members || []).map((m) => ({
      id: m.id, name: m.name, role: m.role, email: m.email, phone: m.phone,
      equity_pct: m.equityPct || 0, weekly_hours: m.weeklyHours || 0, status: m.status || 'active',
      joined_at: m.joinedAt || null, color: m.color || '#4F46E5', kpi_target: m.kpiTarget || 0,
      skills: m.skills || [], note: m.note || '',
    }));
    const tasks = (MT.db.data.tasks || []).map(taskRow);
    const orders = (MT.db.data.orders || []).map(orderRow);
    const items = [];
    (MT.db.data.orders || []).forEach((o) => {
      (o.items || []).forEach((it) => items.push({
        order_id: o.id, product_id: it.productId, name: it.name, variant: it.variant || '',
        price: it.price, cost: it.cost, qty: it.qty, image: it.image || '',
      }));
    });
    const evidence = flattenEvidence();
    const reviews = (MT.db.data.reviews || []).map((r) => ({
      id: r.id, product_id: r.productId, name: r.name, rating: r.rating, text: r.text,
      verified: !!r.verified, source: r.source || 'user', created_at: r.at,
    }));
    const coupons = (MT.db.data.coupons || []).map((x) => ({
      id: x.id, code: x.code, type: x.type, value: x.value, max_discount: x.maxDiscount || 0,
      min_order: x.minOrder || 0, label: x.label, active: !!x.active,
      expires: x.expires || null, usage_count: x.usageCount || 0,
    }));
    const subscribers = (MT.db.data.subscribers || []).map((s) => ({ email: s.email, created_at: s.at }));

    await step('Sản phẩm', () => c.from('products').upsert(products, { onConflict: 'id' }));
    await step('Thành viên', () => c.from('members').upsert(members, { onConflict: 'id' }));
    await step('Nhiệm vụ', () => c.from('tasks').upsert(tasks, { onConflict: 'id' }));
    await step('Đơn hàng', () => c.from('orders').upsert(orders, { onConflict: 'id' }));
    if (items.length) await step('Chi tiết đơn', () => c.from('order_items').upsert(items, { onConflict: 'order_id,product_id,variant' }));
    if (evidence.length) await step('Bằng chứng', () => c.from('task_evidence').upsert(evidence, { onConflict: 'id' }));
    if (reviews.length) await step('Đánh giá', () => c.from('reviews').upsert(reviews, { onConflict: 'id' }));
    if (coupons.length) await step('Mã giảm giá', () => c.from('coupons').upsert(coupons, { onConflict: 'id' }));
    if (subscribers.length) await step('Người đăng ký', () => c.from('subscribers').upsert(subscribers, { onConflict: 'email' }));
    await step('Cài đặt', () => c.from('settings').upsert(settingsRow(), { onConflict: 'id' }));

    const failed = log.filter((x) => !x.ok);
    if (failed.length) {
      throw new Error('Một số bảng chưa đồng bộ được: ' + failed.map((f) => f.label + ' (' + f.error + ')').join('; '));
    }
    return log;
  }

  async function pull() {
    const c = await getClient();
    const [products, members, tasks, orders, items, evidence, reviews, coupons, settings, activity] = await Promise.all([
      c.from('products').select('*'),
      c.from('members').select('*'),
      c.from('tasks').select('*'),
      c.from('orders').select('*').order('created_at', { ascending: true }),
      c.from('order_items').select('*'),
      c.from('task_evidence').select('*'),
      c.from('reviews').select('*'),
      c.from('coupons').select('*'),
      c.from('settings').select('*').eq('id', 1).maybeSingle(),
      c.from('task_activity').select('*').order('created_at', { ascending: true }),
    ]);
    for (const [name, res] of Object.entries({ products, members, tasks, orders, items, evidence, reviews, coupons, settings, activity })) {
      if (res.error) throw new Error('Không tải được ' + name + ': ' + res.error.message);
    }
    if (!products.data || !products.data.length) throw new Error('Cơ sở dữ liệu Supabase đang trống. Hãy chạy file seed.sql trước.');

    const inv = {};
    const custom = [];
    products.data.forEach((r) => {
      const base = MT.catalog.products.find((p) => p.id === r.id);
      if (base) {
        inv[r.id] = { stock: r.stock, price: Number(r.price), cost: Number(r.cost), active: r.active !== false };
      } else {
        custom.push({
          id: r.id, slug: r.slug, name: r.name, sku: r.sku, cat: r.category,
          price: Number(r.price), compareAt: Number(r.compare_at) || 0, cost: Number(r.cost),
          stock: r.stock, sold: r.sold, rating: Number(r.rating), reviewCount: r.review_count,
          volume: r.volume, weight: r.weight, badge: r.badge, short: r.short_description,
          description: r.description, benefits: r.benefits || [], ingredients: r.ingredients,
          usage: r.usage_steps || [], skin: r.skin_types || [], images: r.images || [],
          variants: r.variants || [], active: r.active !== false, custom: true,
          createdAt: r.created_at,
        });
      }
    });

    const taskMap = {};
    tasks.data.forEach((r) => {
      taskMap[r.id] = {
        id: r.id, code: r.code, title: r.title, desc: r.description, assigneeId: r.assignee_id || '',
        priority: r.priority, status: r.status, progress: r.progress, dueDate: r.due_date,
        estimateHours: Number(r.estimate_hours) || 0, actualHours: Number(r.actual_hours) || 0,
        tags: r.tags || [], createdAt: r.created_at, completedAt: r.completed_at,
        updatedAt: r.updated_at, evidence: [], activity: [],
      };
    });
    (evidence.data || []).forEach((r) => {
      const t = taskMap[r.task_id];
      if (!t) return;
      t.evidence.push({
        id: r.id, type: r.type, text: r.text_content || '', url: r.url || '',
        name: r.file_name || '', note: r.note || '', by: r.submitted_by || '', at: r.created_at,
      });
    });
    (activity.data || []).forEach((r) => {
      const t = taskMap[r.task_id];
      if (!t) return;
      t.activity.push({ at: r.created_at, text: r.text, by: r.by_member || '' });
    });

    const orderMap = {};
    orders.data.forEach((r) => {
      orderMap[r.id] = {
        id: r.id, code: r.code, createdAt: r.created_at, channel: r.channel,
        customer: r.customer, items: [], subtotal: Number(r.subtotal), discount: Number(r.discount),
        couponCode: r.coupon_code || '', shippingFee: Number(r.shipping_fee), total: Number(r.total),
        paymentMethod: r.payment_method, paymentStatus: r.payment_status, status: r.status,
        shippingMethod: r.shipping_method || 'standard', source: r.source || 'web',
        timeline: r.timeline || [],
      };
    });
    (items.data || []).forEach((r) => {
      const o = orderMap[r.order_id];
      if (!o) return;
      o.items.push({
        productId: r.product_id, name: r.name, variant: r.variant || '',
        price: Number(r.price), cost: Number(r.cost), qty: r.qty, image: r.image || '',
      });
    });

    const payload = {
      settings: settings.data ? settings.data.data : MT.db.settings(),
      orders: Object.values(orderMap),
      members: members.data.map((m) => ({
        id: m.id, name: m.name, role: m.role, email: m.email, phone: m.phone,
        equityPct: Number(m.equity_pct) || 0, weeklyHours: m.weekly_hours,
        status: m.status, joinedAt: m.joined_at, color: m.color,
        kpiTarget: Number(m.kpi_target) || 0, skills: m.skills || [], note: m.note || '',
      })),
      tasks: Object.values(taskMap),
      reviews: reviews.data.map((r) => ({
        id: r.id, productId: r.product_id, name: r.name, rating: r.rating,
        text: r.text, verified: r.verified, source: r.source, at: r.created_at,
      })),
      coupons: coupons.data.map((x) => ({
        id: x.id, code: x.code, type: x.type, value: Number(x.value),
        maxDiscount: Number(x.max_discount) || 0, minOrder: Number(x.min_order) || 0,
        label: x.label, active: x.active, expires: x.expires, usageCount: x.usage_count,
      })),
      subscribers: (MT.db.data.subscribers || []),
      inventory: inv,
      customProducts: custom,
    };
    MT.db.importAll(payload);
    return {
      products: products.data.length, orders: orders.data.length, members: members.data.length,
      tasks: tasks.data.length, evidence: (evidence.data || []).length,
    };
  }

  async function uploadEvidence(dataUrl, filename) {
    const c = await getClient();
    const cfg = getConfig();
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const safe = String(filename || 'evidence.jpg').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]/g, '-');
    const path = 'evidence/' + Date.now() + '-' + safe;
    const { error } = await c.storage.from(cfg.evidenceBucket).upload(path, blob, { contentType: blob.type, upsert: true });
    if (error) throw new Error(error.message);
    const { data } = c.storage.from(cfg.evidenceBucket).getPublicUrl(path);
    return data.publicUrl;
  }

  function status() {
    return {
      configured: isConfigured(),
      signedIn: Boolean(session),
      email: session && session.user ? session.user.email : '',
      config: getConfig(),
    };
  }

  MT.remote = {
    getConfig, saveConfig, isConfigured, getClient, test, signIn, signOut,
    currentSession, push, pull, uploadEvidence, status,
    CONFIG_KEY,
  };
})();
