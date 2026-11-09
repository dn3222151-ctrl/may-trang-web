/* ==========================================================================
   MÂY TRẮNG – Supabase cloud adapter
   - Tự động đẩy thay đổi từ dashboard (qua sync.js)
   - Tự động tải dữ liệu công khai khi mở website
   - Đăng nhập admin / thành viên, tạo tài khoản thành viên
   - Cổng thành viên: nhận việc, cập nhật tiến độ, nộp bằng chứng lên Storage
   ========================================================================== */
(function () {
  const MT = window.MT;
  const CONFIG_KEY = 'mt.supabase.config';
  const DEFAULT_BUCKET = 'task-evidence';
  let sdkPromise = null;
  let client = null;
  let session = null;
  let profile = null;
  let pulling = false;

  /* ------------------------------- Config -------------------------------- */
  function getConfig() {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}') || {}; } catch (e) {}
    return {
      url: String(saved.url || MT.config.supabase.url || '').trim(),
      anonKey: String(saved.anonKey || MT.config.supabase.anonKey || '').trim(),
      evidenceBucket: String(saved.evidenceBucket || MT.config.supabase.evidenceBucket || DEFAULT_BUCKET).trim(),
    };
  }

  function saveConfig(cfg) {
    const next = {
      url: String(cfg.url || '').trim(),
      anonKey: String(cfg.anonKey || '').trim(),
      evidenceBucket: String(cfg.evidenceBucket || DEFAULT_BUCKET).trim(),
    };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(next));
    client = null;
    session = null;
    profile = null;
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
    const page = (location.pathname.split('/').pop() || '').toLowerCase();
    const storageKey = page === 'member.html' ? 'maytrang-member-auth'
      : page === 'dashboard.html' ? 'maytrang-admin-auth'
        : 'maytrang-public-auth';
    client = sdk.createClient(cfg.url, cfg.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey },
    });
    const { data } = await client.auth.getSession();
    session = data.session || null;
    return client;
  }

  async function fetchProfile(c) {
    if (!session || !session.user) return null;
    const { data, error } = await c.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
    if (error) throw new Error(error.message);
    return data || null;
  }

  async function restoreSession() {
    if (!isConfigured()) return null;
    const c = await getClient();
    const { data } = await c.auth.getSession();
    session = data.session || null;
    if (session) {
      try { profile = await fetchProfile(c); } catch (e) { profile = null; }
    }
    return session;
  }

  async function signIn(email, password) {
    const c = await getClient();
    const { data, error } = await c.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    session = data.session;
    profile = null;
    try { profile = await fetchProfile(c); } catch (e) { profile = null; }
    return data.user;
  }

  async function signInAdmin(email, password) {
    const user = await signIn(email, password);
    if (!profile || profile.role !== 'admin') {
      await signOut();
      throw new Error('Tài khoản này không có quyền quản trị. Hãy dùng tài khoản admin đã đặt role = admin trong bảng profiles.');
    }
    return user;
  }

  async function signOut() {
    if (client) {
      try { await client.auth.signOut(); } catch (e) {}
    }
    session = null;
    profile = null;
  }

  function currentSession() { return session; }
  function currentUser() { return session && session.user ? session.user : null; }
  function currentProfile() { return profile; }
  function isSignedIn() { return Boolean(session); }
  function isCurrentUserAdmin() { return Boolean(profile && profile.role === 'admin'); }
  function isPulling() { return pulling; }

  function status() {
    return {
      configured: isConfigured(),
      signedIn: Boolean(session),
      email: session && session.user ? session.user.email : '',
      role: profile ? profile.role : '',
      name: profile ? profile.full_name : '',
      config: getConfig(),
    };
  }

  async function test() {
    const c = await getClient();
    const { error } = await c.from('products').select('id', { count: 'exact', head: true }).limit(1);
    if (error) throw new Error(error.message);
    return true;
  }

  /* ------------------------------- Mapping -------------------------------- */
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

  function memberRow(m) {
    return {
      id: m.id, name: m.name, role: m.role, email: m.email || null, phone: m.phone || null,
      equity_pct: m.equityPct || 0, weekly_hours: m.weeklyHours || 0, status: m.status || 'active',
      joined_at: m.joinedAt || null, color: m.color || '#4F46E5', kpi_target: m.kpiTarget || 0,
      skills: m.skills || [], note: m.note || '',
      auth_user_id: m.authUserId || null,
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

  function orderItemRows(order) {
    return (order.items || []).map((it) => ({
      order_id: order.id, product_id: it.productId, name: it.name, variant: it.variant || '',
      price: it.price, cost: it.cost, qty: it.qty, image: it.image || '',
    }));
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

  function evidenceRows() {
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

  function activityRows() {
    const rows = [];
    (MT.db.data.tasks || []).forEach((t) => {
      (t.activity || []).forEach((a) => {
        if (!a.at || !a.text) return;
        rows.push({ task_id: t.id, text: a.text, by_member: a.by || null, created_at: a.at });
      });
    });
    return rows;
  }

  function couponRows() {
    return (MT.db.data.coupons || []).map((x) => ({
      id: x.id, code: x.code, type: x.type, value: x.value, max_discount: x.maxDiscount || 0,
      min_order: x.minOrder || 0, label: x.label, active: !!x.active,
      expires: x.expires || null, usage_count: x.usageCount || 0,
    }));
  }

  function reviewRows() {
    return (MT.db.data.reviews || []).map((r) => ({
      id: r.id, product_id: r.productId, name: r.name, rating: r.rating, text: r.text,
      verified: !!r.verified, source: r.source || 'user', created_at: r.at,
    }));
  }

  function settingsRow() {
    return { id: 1, data: MT.db.settings(), updated_at: new Date().toISOString() };
  }

  /* --------------------------- Evidence upload ---------------------------- */
  function safeName(name) {
    return String(name || 'evidence.jpg').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '-').slice(-80);
  }

  async function uploadEvidence(dataUrl, filename, folder) {
    const c = await getClient();
    const cfg = getConfig();
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const path = (folder ? folder.replace(/\/+$/, '') + '/' : '') + Date.now() + '-' + safeName(filename);
    const { error } = await c.storage.from(cfg.evidenceBucket).upload(path, blob, {
      contentType: blob.type || 'image/jpeg', upsert: false,
    });
    if (error) throw new Error('Không tải được ảnh lên Storage: ' + error.message);
    const { data } = c.storage.from(cfg.evidenceBucket).getPublicUrl(path);
    return data.publicUrl;
  }

  /** Đưa ảnh bằng chứng data URL (lưu cục bộ) lên Storage trước khi đẩy task. */
  async function uploadLocalEvidence() {
    let changed = false;
    for (const t of (MT.db.data.tasks || [])) {
      for (const e of (t.evidence || [])) {
        if (e.type !== 'image' || !e.url || !String(e.url).startsWith('data:')) continue;
        e.url = await uploadEvidence(e.url, e.name || 'evidence.jpg', 'evidence/' + (t.assigneeId || 'team'));
        changed = true;
      }
    }
    if (changed) MT.db.saveQuiet('tasks');
    return changed;
  }

  /* -------------------------------- Push ---------------------------------- */
  async function ensureSession() {
    const c = await getClient();
    if (!session) {
      const { data } = await c.auth.getSession();
      session = data.session || null;
    }
    if (!session) throw new Error('Cần đăng nhập tài khoản quản trị Supabase để đồng bộ.');
    return c;
  }

  async function pushOrder(orderId) {
    const c = await ensureSession();
    const order = (MT.db.data.orders || []).find((o) => o.id === orderId || o.code === orderId);
    if (!order) return false;
    const { error } = await c.from('orders').upsert(orderRow(order), { onConflict: 'id' });
    if (error) throw new Error('Đơn hàng: ' + error.message);
    const items = orderItemRows(order);
    if (items.length) {
      const r = await c.from('order_items').upsert(items, { onConflict: 'order_id,product_id,variant' });
      if (r.error) throw new Error('Chi tiết đơn: ' + r.error.message);
    }
    return true;
  }

  async function pushTables(tables) {
    const c = await ensureSession();
    const set = new Set(tables || []);
    const log = [];
    const run = async (label, fn) => {
      try {
        const r = await fn();
        if (r && r.error) throw new Error(r.error.message);
        log.push({ label, ok: true });
      } catch (e) {
        log.push({ label, ok: false, error: e.message || String(e) });
      }
    };

    if (set.has('products')) {
      await run('Sản phẩm', () => c.from('products').upsert(MT.products.all({ includeInactive: true }).map(productRow), { onConflict: 'id' }));
    }
    if (set.has('members')) {
      const members = MT.db.data.members || [];
      const anyAuth = members.some((m) => m.authUserId);
      const rows = members.map((m) => {
        const row = memberRow(m);
        // Chỉ gửi cột auth_user_id khi schema đã được migrate (có ít nhất 1 liên kết)
        // và luôn có key đồng nhất cho mọi dòng để PostgREST bulk upsert chấp nhận.
        if (anyAuth) row.auth_user_id = m.authUserId || null;
        return row;
      });
      await run('Thành viên', () => c.from('members').upsert(rows, { onConflict: 'id' }));
    }
    if (set.has('tasks')) {
      await uploadLocalEvidence();
      await run('Nhiệm vụ', () => c.from('tasks').upsert((MT.db.data.tasks || []).map(taskRow), { onConflict: 'id' }));
      const ev = evidenceRows();
      if (ev.length) await run('Bằng chứng', () => c.from('task_evidence').upsert(ev, { onConflict: 'id' }));
      const act = activityRows();
      if (act.length) await run('Lịch sử việc', () => c.from('task_activity').upsert(act, { onConflict: 'task_id,created_at,text' }));
    }
    if (set.has('orders')) {
      const orders = (MT.db.data.orders || []).map(orderRow);
      await run('Đơn hàng', () => c.from('orders').upsert(orders, { onConflict: 'id' }));
      const items = [];
      (MT.db.data.orders || []).forEach((o) => orderItemRows(o).forEach((x) => items.push(x)));
      if (items.length) await run('Chi tiết đơn', () => c.from('order_items').upsert(items, { onConflict: 'order_id,product_id,variant' }));
    }
    if (set.has('reviews')) {
      const rows = reviewRows();
      if (rows.length) await run('Đánh giá', () => c.from('reviews').upsert(rows, { onConflict: 'id' }));
    }
    if (set.has('coupons')) {
      const rows = couponRows();
      if (rows.length) await run('Mã giảm giá', () => c.from('coupons').upsert(rows, { onConflict: 'id' }));
    }
    if (set.has('subscribers')) {
      const rows = (MT.db.data.subscribers || []).map((s) => ({ email: s.email, created_at: s.at }));
      if (rows.length) await run('Người đăng ký', () => c.from('subscribers').upsert(rows, { onConflict: 'email' }));
    }
    if (set.has('settings')) {
      await run('Cài đặt', () => c.from('settings').upsert(settingsRow(), { onConflict: 'id' }));
    }
    const failed = log.filter((x) => !x.ok);
    if (failed.length) {
      throw new Error('Không đồng bộ được: ' + failed.map((f) => f.label + ' (' + f.error + ')').join('; '));
    }
    return log;
  }

  async function push() {
    await ensureSession();
    return pushTables(['products', 'members', 'tasks', 'orders', 'reviews', 'coupons', 'subscribers', 'settings']);
  }

  /** Xoá bản ghi trên cloud khi dashboard xoá cục bộ. */
  async function deleteRows(table, ids) {
    if (!ids || !ids.length) return true;
    const allowed = ['members', 'tasks', 'coupons', 'products'];
    if (allowed.indexOf(table) < 0) return true;
    const c = await ensureSession();
    const { error } = await c.from(table).delete().in('id', ids);
    if (error) throw new Error('Xoá ' + table + ': ' + error.message);
    return true;
  }

  /* -------------------------------- Pull ---------------------------------- */
  function mapTask(r, evidence, activity) {
    return {
      id: r.id, code: r.code, title: r.title, desc: r.description, assigneeId: r.assignee_id || '',
      priority: r.priority, status: r.status, progress: r.progress, dueDate: r.due_date,
      estimateHours: Number(r.estimate_hours) || 0, actualHours: Number(r.actual_hours) || 0,
      tags: r.tags || [], createdAt: r.created_at, completedAt: r.completed_at,
      updatedAt: r.updated_at, evidence: evidence || [], activity: activity || [],
    };
  }

  function mapEvidence(r) {
    return {
      id: r.id, type: r.type, text: r.text_content || '', url: r.url || '',
      name: r.file_name || '', note: r.note || '', by: r.submitted_by || '', at: r.created_at,
    };
  }

  function mapMember(m) {
    const isCeo = m.id === 'MB-01';
    return {
      id: m.id,
      name: isCeo && m.name === 'Lại Trọng Việt' ? 'Nguyễn Tiến Dũng' : m.name,
      role: m.role,
      email: isCeo && (!m.email || m.email === 'viet@maytrang.vn') ? 'dung@maytrang.vn' : m.email,
      phone: m.phone,
      equityPct: Number(m.equity_pct) || 0, weeklyHours: m.weekly_hours,
      status: m.status, joinedAt: m.joined_at, color: m.color,
      kpiTarget: Number(m.kpi_target) || 0, skills: m.skills || [], note: m.note || '',
      authUserId: m.auth_user_id || '',
    };
  }

  function mapReview(r) {
    return {
      id: r.id, productId: r.product_id, name: r.name, rating: r.rating,
      text: r.text, verified: r.verified, source: r.source, at: r.created_at,
    };
  }

  function mapCoupon(x) {
    return {
      id: x.id, code: x.code, type: x.type, value: Number(x.value),
      maxDiscount: Number(x.max_discount) || 0, minOrder: Number(x.min_order) || 0,
      label: x.label, active: x.active, expires: x.expires, usageCount: x.usage_count,
    };
  }

  async function pull() {
    const c = await getClient();
    const [products, members, tasks, orders, items, evidence, reviews, coupons, subscribers, settings, activity] = await Promise.all([
      c.from('products').select('*'),
      c.from('members').select('*'),
      c.from('tasks').select('*'),
      c.from('orders').select('*').order('created_at', { ascending: true }),
      c.from('order_items').select('*'),
      c.from('task_evidence').select('*'),
      c.from('reviews').select('*'),
      c.from('coupons').select('*'),
      c.from('subscribers').select('*'),
      c.from('settings').select('*').eq('id', 1).maybeSingle(),
      c.from('task_activity').select('*').order('created_at', { ascending: true }),
    ]);
    for (const [name, res] of Object.entries({ products, members, tasks, orders, items, evidence, reviews, coupons, subscribers, settings, activity })) {
      if (res.error) throw new Error('Không tải được ' + name + ': ' + res.error.message);
    }
    if (!products.data || !products.data.length) throw new Error('Supabase chưa có sản phẩm. Hãy chạy seed.sql hoặc đẩy dữ liệu cục bộ lên trước.');

    const inv = {};
    const custom = [];
    products.data.forEach((r) => {
      const base = MT.catalog.products.find((p) => p.id === r.id);
      const override = {
        stock: r.stock, price: Number(r.price), cost: Number(r.cost), active: r.active !== false,
        name: r.name, cat: r.category, short: r.short_description, badge: r.badge,
        volume: r.volume, compareAt: Number(r.compare_at) || 0, images: r.images || [],
        description: r.description,
      };
      if (base) inv[r.id] = override;
      else {
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
    tasks.data.forEach((r) => { taskMap[r.id] = mapTask(r); });
    (evidence.data || []).forEach((r) => {
      if (taskMap[r.task_id]) taskMap[r.task_id].evidence.push(mapEvidence(r));
    });
    (activity.data || []).forEach((r) => {
      if (taskMap[r.task_id]) taskMap[r.task_id].activity.push({ at: r.created_at, text: String(r.text || '').replace(/Lại Trọng Việt/g, 'Nguyễn Tiến Dũng'), by: r.by_member || '' });
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
      members: members.data.map(mapMember),
      tasks: Object.values(taskMap),
      reviews: reviews.data.map(mapReview),
      coupons: coupons.data.map(mapCoupon),
      subscribers: subscribers.data.map((s) => ({ email: s.email, at: s.created_at })),
      inventory: inv,
      customProducts: custom,
    };
    pulling = true;
    try {
      MT.db.importAll(payload);
    } finally {
      pulling = false;
    }
    return {
      products: products.data.length, orders: orders.data.length, members: members.data.length,
      tasks: tasks.data.length, evidence: (evidence.data || []).length,
    };
  }

  /** Chỉ tải dữ liệu công khai cho website (không cần đăng nhập). */
  async function pullPublic() {
    const c = await getClient();
    const products = await c.from('products').select('*').eq('active', true);
    if (products.error) throw new Error('Không tải được sản phẩm: ' + products.error.message);
    // Các bảng phụ có thể chưa được migrate; không chặn cập nhật sản phẩm.
    let settings = null;
    let reviews = null;
    let coupons = null;
    try {
      const r = await c.rpc('public_store_settings');
      if (r.error) console.warn('[cloud] public_store_settings:', r.error.message);
      else settings = r;
    } catch (e) { console.warn('[cloud] public_store_settings:', e.message); }
    try {
      const r = await c.from('reviews').select('*');
      if (r.error) console.warn('[cloud] reviews:', r.error.message);
      else reviews = r;
    } catch (e) { console.warn('[cloud] reviews:', e.message); }
    try {
      const r = await c.from('coupons').select('*').eq('active', true);
      if (r.error) console.warn('[cloud] coupons:', r.error.message);
      else coupons = r;
    } catch (e) { console.warn('[cloud] coupons:', e.message); }
    if (!products.data || !products.data.length) throw new Error('Supabase chưa có sản phẩm công khai.');

    // Ẩn toàn bộ SKU gốc trước, sau đó bật lại các SKU đang bán trên cloud.
    const inv = {};
    Object.keys(MT.db.data.inventory || {}).forEach((id) => {
      inv[id] = Object.assign({}, MT.db.data.inventory[id], { active: false });
    });
    const custom = [];
    products.data.forEach((r) => {
      const existing = inv[r.id] || {};
      if (MT.catalog.products.some((p) => p.id === r.id)) {
        inv[r.id] = Object.assign({}, existing, {
          stock: r.stock, price: Number(r.price), cost: Number(r.cost), active: true,
          name: r.name, cat: r.category, short: r.short_description, badge: r.badge,
          volume: r.volume, compareAt: Number(r.compare_at) || 0, images: r.images || [],
          description: r.description,
        });
      } else {
        custom.push({
          id: r.id, slug: r.slug, name: r.name, sku: r.sku, cat: r.category,
          price: Number(r.price), compareAt: Number(r.compare_at) || 0, cost: Number(r.cost),
          stock: r.stock, sold: r.sold, rating: Number(r.rating), reviewCount: r.review_count,
          volume: r.volume, weight: r.weight, badge: r.badge, short: r.short_description,
          description: r.description, benefits: r.benefits || [], ingredients: r.ingredients,
          usage: r.usage_steps || [], skin: r.skin_types || [], images: r.images || [],
          variants: r.variants || [], active: true, custom: true, createdAt: r.created_at,
        });
      }
    });

    MT.db.data.inventory = inv;
    MT.db.data.customProducts = custom;
    let settingsChanged = false;
    if (settings && settings.data) {
      const cur = MT.db.data.settings || {};
      MT.db.data.settings = Object.assign({}, cur, {
        store: Object.assign({}, cur.store || {}, settings.data.store || {}),
        shipping: Object.assign({}, cur.shipping || {}, settings.data.shipping || {}),
        storefront: Object.assign({}, cur.storefront || {}, settings.data.storefront || {}),
      });
      settingsChanged = true;
    }
    if (reviews && reviews.data) MT.db.data.reviews = reviews.data.map(mapReview);
    if (coupons && coupons.data) MT.db.data.coupons = coupons.data.map(mapCoupon);
    MT.db.save('inventory');
    MT.db.save('customProducts');
    if (settingsChanged) MT.db.save('settings');
    if (reviews && reviews.data) MT.db.save('reviews');
    if (coupons && coupons.data) MT.db.save('coupons');
    return {
      products: products.data.length,
      reviews: reviews && reviews.data ? reviews.data.length : 0,
      coupons: coupons && coupons.data ? coupons.data.length : 0,
      settings: settingsChanged,
    };
  }

  async function subscribePublic(onChange) {
    if (!isConfigured()) return null;
    const c = await getClient();
    try {
      const channel = c.channel('maytrang-public-' + Date.now());
      ['products', 'settings', 'coupons', 'reviews'].forEach((table) => {
        channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => onChange(table));
      });
      channel.subscribe();
      return channel;
    } catch (e) {
      return null;
    }
  }

  /* --------------------------- Member accounts ---------------------------- */
  async function createMemberAccount(memberId, opts) {
    const c = await getClient();
    if (!session) throw new Error('Cần đăng nhập quản trị Supabase để tạo tài khoản.');
    if (!profile || profile.role !== 'admin') throw new Error('Chỉ quản trị viên mới được tạo tài khoản thành viên.');
    const email = String(opts.email || '').trim().toLowerCase();
    const password = String(opts.password || '');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new Error('Email không hợp lệ.');
    if (password.length < 6) throw new Error('Mật khẩu cần ít nhất 6 ký tự.');

    const sdk = await loadSdk();
    const cfg = getConfig();
    const tmp = sdk.createClient(cfg.url, cfg.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    let createdSession = null;
    try {
      const { data, error } = await tmp.auth.signUp({
        email, password, options: { data: { full_name: opts.fullName || '' } },
      });
      if (error) throw new Error(error.message);
      const user = data.user;
      if (!user) throw new Error('Không tạo được tài khoản.');
      if (Array.isArray(user.identities) && user.identities.length === 0) {
        throw new Error('Email này đã có tài khoản. Hãy dùng email khác hoặc liên kết tài khoản cũ.');
      }
      createdSession = data.session || null;
      const p = await c.from('profiles').upsert({
        id: user.id, email, full_name: opts.fullName || '', role: 'staff',
      }, { onConflict: 'id' });
      if (p.error) throw new Error('Tạo hồ sơ: ' + p.error.message);
      const m = await c.from('members').update({ auth_user_id: user.id, email }).eq('id', memberId).select('id');
      if (m.error) throw new Error('Liên kết thành viên: ' + m.error.message);
      if (!m.data || !m.data.length) throw new Error('Không tìm thấy thành viên để liên kết.');
      const local = MT.db.members.get(memberId);
      if (local) {
        local.authUserId = user.id;
        local.email = email;
        MT.db.save('members');
      }
      return { userId: user.id, email, needsConfirmation: !createdSession };
    } finally {
      try { await tmp.auth.signOut({ scope: 'local' }); } catch (e) {}
    }
  }

  async function resetMemberPassword(email) {
    const c = await getClient();
    const base = location.protocol.indexOf('http') === 0
      ? location.origin + location.pathname.replace(/[^/]+$/, '') + 'member.html'
      : undefined;
    const { error } = await c.auth.resetPasswordForEmail(email, base ? { redirectTo: base } : {});
    if (error) throw new Error(error.message);
    return true;
  }

  /* ---------------------------- Member portal ----------------------------- */
  async function getAuthUser() {
    const c = await getClient();
    const { data, error } = await c.auth.getUser();
    if (error) throw new Error(error.message);
    return data.user || null;
  }

  async function getMyMember() {
    const c = await getClient();
    const user = await getAuthUser();
    if (!user) return null;
    const { data, error } = await c.from('members').select('*').eq('auth_user_id', user.id).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapMember(data) : null;
  }

  async function memberTasks(memberId) {
    const c = await getClient();
    const [tasks, evidence, activity] = await Promise.all([
      c.from('tasks').select('*').eq('assignee_id', memberId).order('due_date', { ascending: true, nullsFirst: false }),
      c.from('task_evidence').select('*').order('created_at', { ascending: false }),
      c.from('task_activity').select('*').order('created_at', { ascending: true }),
    ]);
    for (const [name, res] of Object.entries({ tasks, evidence, activity })) {
      if (res.error) throw new Error('Không tải được ' + name + ': ' + res.error.message);
    }
    const map = {};
    (tasks.data || []).forEach((r) => { map[r.id] = mapTask(r); });
    (evidence.data || []).forEach((r) => { if (map[r.task_id]) map[r.task_id].evidence.push(mapEvidence(r)); });
    (activity.data || []).forEach((r) => { if (map[r.task_id]) map[r.task_id].activity.push({ at: r.created_at, text: String(r.text || '').replace(/Lại Trọng Việt/g, 'Nguyễn Tiến Dũng'), by: r.by_member || '' }); });
    return Object.values(map);
  }

  async function memberUpdateTask(taskId, patch) {
    const c = await getClient();
    const { error } = await c.rpc('member_update_task', {
      p_task_id: taskId,
      p_progress: patch.progress == null ? null : Math.max(0, Math.min(100, Math.round(patch.progress))),
      p_status: patch.status || null,
    });
    if (error) throw new Error(error.message);
    return true;
  }

  async function memberAddTextEvidence(taskId, text, memberId) {
    const c = await getClient();
    if (!String(text || '').trim()) throw new Error('Nội dung bằng chứng đang trống.');
    const id = 'EV_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const { error } = await c.from('task_evidence').insert({
      id, task_id: taskId, type: 'text', text_content: String(text).trim(),
      submitted_by: memberId, created_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    return id;
  }

  async function memberAddImageEvidence(taskId, dataUrl, filename, memberId) {
    const url = await uploadEvidence(dataUrl, filename, 'members/' + memberId + '/' + taskId);
    const c = await getClient();
    const id = 'EV_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const { error } = await c.from('task_evidence').insert({
      id, task_id: taskId, type: 'image', url, file_name: filename || 'evidence.jpg',
      submitted_by: memberId, created_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    return url;
  }

  async function subscribeMember(memberId, onChange) {
    if (!isConfigured()) return null;
    const c = await getClient();
    try {
      const channel = c.channel('maytrang-member-' + memberId + '-' + Date.now());
      channel.on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: 'assignee_id=eq.' + memberId }, () => onChange('tasks'));
      channel.on('postgres_changes', { event: '*', schema: 'public', table: 'task_evidence' }, () => onChange('evidence'));
      channel.on('postgres_changes', { event: '*', schema: 'public', table: 'task_activity' }, () => onChange('activity'));
      channel.subscribe();
      return channel;
    } catch (e) {
      return null;
    }
  }

  MT.remote = {
    getConfig, saveConfig, isConfigured, getClient, loadSdk, test,
    signIn, signInAdmin, signOut, restoreSession, currentSession, currentUser, currentProfile,
    isSignedIn, isCurrentUserAdmin, isPulling, status,
    push, pushTables, pushOrder, deleteRows, pull, pullPublic, subscribePublic,
    uploadEvidence, createMemberAccount, resetMemberPassword,
    getAuthUser, getMyMember, memberTasks, memberUpdateTask,
    memberAddTextEvidence, memberAddImageEvidence, subscribeMember,
    CONFIG_KEY,
  };
})();
