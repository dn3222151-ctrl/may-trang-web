/* ==========================================================================
   MÂY TRẮNG – Lớp lưu trữ & nghiệp vụ (localStorage, sẵn sàng cho Supabase)
   Mọi thao tác đọc/ghi dữ liệu của website và dashboard đều đi qua đây.
   ========================================================================== */
(function () {
  const MT = window.MT;
  const U = MT.util;
  const PREFIX = MT.config.storagePrefix;
  const KEYS = ['settings', 'orders', 'members', 'tasks', 'reviews', 'coupons', 'subscribers', 'inventory', 'customProducts'];
  const memory = {};
  let storageOK = true;

  /* ------------------------------- Event bus ------------------------------- */
  const listeners = {};
  MT.bus = {
    on(evt, fn) {
      (listeners[evt] = listeners[evt] || []).push(fn);
      return () => MT.bus.off(evt, fn);
    },
    off(evt, fn) {
      listeners[evt] = (listeners[evt] || []).filter((f) => f !== fn);
    },
    emit(evt, payload) {
      (listeners[evt] || []).forEach((fn) => {
        try { fn(payload); } catch (e) { console.warn('[bus]', evt, e); }
      });
    },
  };

  /* ------------------------------ Storage core ----------------------------- */
  const storage = {
    get(key) {
      try {
        const raw = localStorage.getItem(PREFIX + key);
        return raw ? JSON.parse(raw) : undefined;
      } catch (e) {
        storageOK = false;
        return Object.prototype.hasOwnProperty.call(memory, key) ? memory[key] : undefined;
      }
    },
    set(key, value) {
      memory[key] = value;
      try {
        localStorage.setItem(PREFIX + key, JSON.stringify(value));
        return true;
      } catch (e) {
        storageOK = false;
        if (e && (e.name === 'QuotaExceededError' || e.code === 22)) {
          U.toast('Bộ nhớ trình duyệt đã đầy. Hãy xoá bớt ảnh bằng chứng cũ trong Cài đặt.', 'error', { duration: 6000 });
        }
        return false;
      }
    },
    del(key) {
      try { localStorage.removeItem(PREFIX + key); } catch (e) {}
      delete memory[key];
    },
  };

  const db = {
    data: null,
    ready: false,
    storageOK: () => storageOK,
  };

  function buildInventory() {
    const inv = {};
    MT.catalog.products.forEach((p) => {
      inv[p.id] = { stock: p.stock, price: p.price, cost: p.cost, active: true };
    });
    return inv;
  }

  function init() {
    const seedVersion = MT.config.seedVersion;
    let seeded = null;
    const ensure = (key) => {
      if (db.data[key] != null) return;
      if (!seeded) seeded = MT.seed.build();
      const value = key === 'inventory' ? buildInventory() : key === 'customProducts' ? [] : seeded[key];
      db.data[key] = value;
      storage.set(key, value);
    };

    db.data = {};
    KEYS.forEach((k) => { db.data[k] = storage.get(k); });
    ensure('settings');
    ensure('orders');
    ensure('members');
    ensure('tasks');
    ensure('reviews');
    ensure('coupons');
    ensure('subscribers');
    ensure('inventory');
    ensure('customProducts');

    // Bổ sung SKU mới vào inventory nếu danh mục code có thêm sản phẩm
    let inventoryDirty = false;
    MT.catalog.products.forEach((p) => {
      if (!db.data.inventory[p.id]) {
        db.data.inventory[p.id] = { stock: p.stock, price: p.price, cost: p.cost, active: true };
        inventoryDirty = true;
      }
    });
    if (inventoryDirty) storage.set('inventory', db.data.inventory);

    // Nâng cấp dữ liệu cũ: đổi tên CEO theo yêu cầu
    const ceo = (db.data.members || []).find((m) => m.id === 'MB-01');
    if (ceo && ceo.name === 'Lại Trọng Việt') {
      ceo.name = 'Nguyễn Tiến Dũng';
      if (!ceo.email || ceo.email === 'viet@maytrang.vn') ceo.email = 'dung@maytrang.vn';
      ceo.note = 'CEO — phụ trách vận hành và phát triển kênh CLB.';
      storage.set('members', db.data.members);
    }
    let tasksDirty = false;
    (db.data.tasks || []).forEach((t) => {
      (t.activity || []).forEach((a) => {
        if (a.text && a.text.indexOf('Lại Trọng Việt') >= 0) {
          a.text = a.text.replace(/Lại Trọng Việt/g, 'Nguyễn Tiến Dũng');
          tasksDirty = true;
        }
      });
    });
    if (tasksDirty) storage.set('tasks', db.data.tasks);

    storage.set('meta', { seedVersion, initializedAt: new Date().toISOString(), appVersion: MT.config.version });
    db.ready = true;
    MT.bus.emit('db:ready');
  }

  db.save = function (name) {
    if (!db.data) return false;
    const ok = storage.set(name, db.data[name]);
    MT.bus.emit('db:change', { name });
    return ok;
  };

  /** Ghi localStorage không phát sự kiện (dùng khi đồng bộ cloud tránh vòng lặp). */
  db.saveQuiet = function (name) {
    if (!db.data) return false;
    return storage.set(name, db.data[name]);
  };

  db.saveMany = function (names) {
    let ok = true;
    names.forEach((n) => { ok = db.save(n) && ok; });
    return ok;
  };

  db.reload = function () {
    KEYS.forEach((k) => {
      const val = storage.get(k);
      if (val !== undefined) db.data[k] = val;
    });
    MT.bus.emit('db:external');
  };

  db.reset = function () {
    const seed = MT.seed.build();
    db.data.settings = seed.settings;
    db.data.orders = seed.orders;
    db.data.members = seed.members;
    db.data.tasks = seed.tasks;
    db.data.reviews = seed.reviews;
    db.data.coupons = seed.coupons;
    db.data.subscribers = seed.subscribers;
    db.data.inventory = buildInventory();
    db.data.customProducts = [];
    KEYS.forEach((k) => storage.set(k, db.data[k]));
    storage.set('meta', { seedVersion: MT.config.seedVersion, resetAt: new Date().toISOString() });
    MT.bus.emit('db:reset');
    MT.bus.emit('db:change', { name: 'all' });
  };

  db.exportAll = function () {
    const payload = {
      app: 'MayTrang',
      version: MT.config.version,
      exportedAt: new Date().toISOString(),
    };
    KEYS.forEach((k) => { payload[k] = db.data[k]; });
    return payload;
  };

  db.importAll = function (json) {
    let payload;
    try { payload = typeof json === 'string' ? JSON.parse(json) : json; }
    catch (e) { throw new Error('File JSON không hợp lệ.'); }
    if (!payload || !Array.isArray(payload.orders) || !Array.isArray(payload.members) || !Array.isArray(payload.tasks)) {
      throw new Error('File không đúng cấu trúc dữ liệu Mây Trắng.');
    }
    KEYS.forEach((k) => {
      if (payload[k] != null) {
        db.data[k] = payload[k];
        storage.set(k, payload[k]);
      }
    });
    MT.bus.emit('db:reset');
    MT.bus.emit('db:change', { name: 'all' });
    return true;
  };

  db.storageSize = function () {
    let bytes = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.indexOf(PREFIX) === 0) {
          bytes += key.length + (localStorage.getItem(key) || '').length;
        }
      }
    } catch (e) {}
    return bytes * 2; // UTF-16 xấp xỉ
  };

  db.evidenceStats = function () {
    let images = 0, texts = 0, bytes = 0;
    (db.data.tasks || []).forEach((t) => {
      (t.evidence || []).forEach((ev) => {
        if (ev.type === 'image') {
          images++;
          if (String(ev.url || '').startsWith('data:')) bytes += String(ev.url).length;
        } else texts++;
      });
    });
    return { images, texts, bytes };
  };

  /* -------------------------------- Settings ------------------------------- */
  db.settings = function () { return db.data.settings; };

  db.updateSettings = function (mutator) {
    mutator(db.data.settings);
    db.data.settings.updatedAt = new Date().toISOString();
    db.save('settings');
    MT.bus.emit('settings:change');
    return db.data.settings;
  };

  db.fixedMonthlyTotal = function () {
    return U.sum(db.data.settings.finance.monthlyFixed, (x) => x.amount);
  };

  /* -------------------------------- Products ------------------------------- */
  const products = {
    all(opts) {
      const o = opts || {};
      const inv = db.data.inventory || {};
      const base = MT.catalog.products.map((p) => {
        const ov = inv[p.id] || {};
        return Object.assign({}, p, {
          price: ov.price != null ? ov.price : p.price,
          cost: ov.cost != null ? ov.cost : p.cost,
          stock: ov.stock != null ? ov.stock : p.stock,
          active: ov.active !== false,
          name: ov.name || p.name,
          cat: ov.cat || p.cat,
          short: ov.short != null ? ov.short : p.short,
          badge: ov.badge != null ? ov.badge : p.badge,
          volume: ov.volume != null ? ov.volume : p.volume,
          compareAt: ov.compareAt != null ? ov.compareAt : p.compareAt,
          images: ov.images && ov.images.length ? ov.images : p.images,
          description: ov.description != null ? ov.description : p.description,
          custom: false,
        });
      });
      const custom = (db.data.customProducts || []).map((p) => Object.assign({ active: true }, p, { custom: true }));
      let list = base.concat(custom);
      if (!o.includeInactive) list = list.filter((p) => p.active !== false);
      return list;
    },
    get(id) {
      return products.all({ includeInactive: true }).find((p) => p.id === id || p.slug === id) || null;
    },
    stockOf(id) {
      const p = products.get(id);
      return p ? Number(p.stock) || 0 : 0;
    },
    setStock(id, stock) {
      const p = products.get(id);
      if (!p) return false;
      if (p.custom) {
        const cp = db.data.customProducts.find((x) => x.id === id);
        if (cp) cp.stock = Math.max(0, Math.round(stock));
        db.save('customProducts');
      } else {
        db.data.inventory[id] = Object.assign({}, db.data.inventory[id], { stock: Math.max(0, Math.round(stock)) });
        db.save('inventory');
      }
      MT.bus.emit('products:change');
      return true;
    },
    adjustStock(id, delta) {
      const p = products.get(id);
      if (!p) return false;
      return products.setStock(id, (Number(p.stock) || 0) + delta);
    },
    save(id, patch) {
      if (id) {
        const p = products.get(id);
        if (!p) throw new Error('Không tìm thấy sản phẩm.');
        if (p.custom) {
          const cp = db.data.customProducts.find((x) => x.id === id);
          Object.assign(cp, patch);
          db.save('customProducts');
        } else {
          const prev = db.data.inventory[id] || {};
          const allowed = ['price', 'cost', 'stock', 'active', 'name', 'cat', 'short', 'badge', 'volume', 'compareAt', 'images', 'description'];
          const ov = Object.assign({}, prev);
          allowed.forEach((k) => { if (patch[k] !== undefined) ov[k] = patch[k]; });
          db.data.inventory[id] = ov;
          db.save('inventory');
        }
        MT.bus.emit('products:change');
        return products.get(id);
      }
      let n = 1;
      const existingIds = new Set((db.data.customProducts || []).map((x) => x.id));
      while (existingIds.has('SP-C' + String(n).padStart(2, '0'))) n += 1;
      const newId = 'SP-C' + String(n).padStart(2, '0');
      const item = Object.assign({
        id: newId,
        slug: U.normalize(patch.name).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'san-pham-' + n,
        sku: 'MT-NEW-' + String(n).padStart(3, '0'),
        cat: 'skincare',
        price: 0, compareAt: 0, cost: 0, stock: 0, sold: 0, rating: 0, reviewCount: 0,
        volume: '', weight: 100, badge: 'Mới', featured: false, deal: false,
        short: '', description: '', benefits: [], ingredients: '', usage: [], skin: [],
        images: [U.placeholder('new-product-' + n)], variants: [], active: true, createdAt: new Date().toISOString(),
      }, patch, { id: newId });
      if (!db.data.customProducts) db.data.customProducts = [];
      db.data.customProducts.push(item);
      db.save('customProducts');
      MT.bus.emit('products:change');
      return item;
    },
    remove(id) {
      const p = products.get(id);
      if (!p) return false;
      if (p.custom) {
        db.data.customProducts = db.data.customProducts.filter((x) => x.id !== id);
        db.save('customProducts');
        MT.bus.emit('entity:delete', { table: 'products', id });
      } else {
        db.data.inventory[id] = Object.assign({}, db.data.inventory[id], { active: false });
        db.save('inventory');
      }
      MT.bus.emit('products:change');
      return true;
    },
    rating(product) {
      const list = (db.data.reviews || []).filter((r) => r.productId === product.id);
      const baseCount = Number(product.reviewCount) || 0;
      const baseRating = Number(product.rating) || 0;
      const total = baseCount + list.length;
      const sum = baseRating * baseCount + U.sum(list, (r) => r.rating);
      return {
        value: total ? Math.round((sum / total) * 10) / 10 : 0,
        count: total,
        reviews: list,
      };
    },
  };
  MT.products = products;

  /* --------------------------------- Pricing ------------------------------- */
  const pricing = {
    coupon(code, subtotal) {
      const c = (db.data.coupons || []).find((x) => String(x.code).toUpperCase() === String(code || '').toUpperCase());
      if (!c) return { ok: false, message: 'Mã giảm giá không tồn tại.' };
      if (!c.active) return { ok: false, message: 'Mã giảm giá đã ngừng áp dụng.' };
      if (c.expires && new Date(c.expires) < U.startOfDay(new Date())) return { ok: false, message: 'Mã giảm giá đã hết hạn.' };
      if (subtotal < (c.minOrder || 0)) {
        return { ok: false, message: 'Đơn hàng tối thiểu ' + U.fmt.money(c.minOrder) + ' để dùng mã này.' };
      }
      let discount = 0;
      let freeShipping = false;
      if (c.type === 'percent') discount = Math.min(Math.round(subtotal * c.value / 100), c.maxDiscount || Infinity);
      else if (c.type === 'fixed') discount = c.value;
      else if (c.type === 'shipping') freeShipping = true;
      discount = Math.min(discount, subtotal);
      return { ok: true, coupon: c, discount, freeShipping, message: 'Đã áp dụng ' + c.code + ' — ' + c.label };
    },
    zoneOf(province) {
      const p = MT.meta.provinces.find((x) => x.name === province);
      return p ? p.zone : 'central';
    },
    shipping(method, province, afterDiscount) {
      const ship = db.data.settings.shipping;
      if (method === 'pickup') return { fee: 0, label: 'Nhận tại showroom' };
      const zone = pricing.zoneOf(province);
      const base = ship.fees[zone] != null ? ship.fees[zone] : 30000;
      if (method === 'express') return { fee: base + ship.expressFee, label: 'Giao nhanh 1-2 ngày' };
      const free = afterDiscount >= ship.freeThreshold;
      return { fee: free ? 0 : base, label: free ? 'Miễn phí vận chuyển' : 'Giao tiêu chuẩn 2-4 ngày' };
    },
    totals(items, opts) {
      const o = opts || {};
      const priceOf = (it) => Number(it.price != null ? it.price : (it.product ? it.product.price : 0)) || 0;
      const subtotal = U.sum(items, (it) => priceOf(it) * (Number(it.qty) || 0));
      let discount = 0, freeShipping = false, couponData = null, couponError = '';
      if (o.couponCode) {
        const c = pricing.coupon(o.couponCode, subtotal);
        if (c.ok) { discount = c.discount; freeShipping = c.freeShipping; couponData = c.coupon; }
        else couponError = c.message;
      }
      const afterDiscount = Math.max(0, subtotal - discount);
      let ship = { fee: 0, label: '' };
      if (o.shippingMethod) {
        ship = pricing.shipping(o.shippingMethod, o.province, afterDiscount);
        if (freeShipping && o.shippingMethod !== 'pickup') ship = { fee: 0, label: 'Miễn phí vận chuyển (mã ' + (couponData ? couponData.code : '') + ')' };
      }
      const total = Math.max(0, afterDiscount + ship.fee);
      const freeShipRemaining = Math.max(0, db.data.settings.shipping.freeThreshold - afterDiscount);
      return {
        subtotal, discount, shippingFee: ship.fee, shippingLabel: ship.label,
        total, afterDiscount, freeShipRemaining, coupon: couponData, couponError,
        count: U.sum(items, (it) => it.qty),
      };
    },
  };
  MT.pricing = pricing;

  /* --------------------------------- Orders -------------------------------- */
  function nextOrderCode(date) {
    const d = date ? new Date(date) : new Date();
    const prefix = 'MT' + String(d.getFullYear()).slice(-2) + String(d.getMonth() + 1).padStart(2, '0');
    let max = 0;
    (db.data.orders || []).forEach((o) => {
      const n = parseInt(String(o.code || '').slice(-4), 10);
      if (n > max) max = n;
    });
    return prefix + String(max + 1).padStart(4, '0');
  }

  function resolveItems(lines) {
    const resolved = [];
    (lines || []).forEach((line) => {
      const p = products.get(line.productId);
      if (!p) throw new Error('Sản phẩm không còn tồn tại.');
      if (p.active === false) throw new Error(p.name + ' đã ngừng bán.');
      const qty = Math.max(1, Math.round(Number(line.qty) || 1));
      if (qty > (Number(p.stock) || 0)) throw new Error(p.name + ' chỉ còn ' + p.stock + ' sản phẩm.');
      const variant = line.variant || (p.variants && p.variants[0] ? p.variants[0].name : '');
      resolved.push({
        productId: p.id, name: p.name, variant, price: p.price, cost: p.cost,
        qty, image: p.images && p.images[0] ? p.images[0] : U.placeholder(p.name),
      });
    });
    return resolved;
  }

  db.createOrder = function (payload) {
    const p = payload || {};
    if (!p.customer || !p.customer.name || !p.customer.phone) throw new Error('Thiếu thông tin khách hàng.');
    const items = resolveItems(p.items);
    const totals = pricing.totals(items, {
      couponCode: p.couponCode,
      shippingMethod: p.shippingMethod || 'standard',
      province: p.customer.province,
    });
    if (!items.length) throw new Error('Giỏ hàng đang trống.');
    const now = new Date();
    const method = p.paymentMethod || 'cod';
    const paymentStatus = method === 'bank' ? 'unpaid' : (method === 'card' || method === 'momo' ? 'paid' : 'unpaid');
    const order = {
      id: 'OD-' + Date.now().toString(36).toUpperCase(),
      code: nextOrderCode(now),
      createdAt: now.toISOString(),
      channel: p.channel || 'website',
      customer: {
        name: p.customer.name.trim(),
        phone: p.customer.phone.trim(),
        email: (p.customer.email || '').trim(),
        address: (p.customer.address || '').trim(),
        province: p.customer.province || '',
        note: (p.customer.note || '').trim(),
      },
      items,
      subtotal: totals.subtotal,
      discount: totals.discount,
      couponCode: totals.coupon ? totals.coupon.code : '',
      shippingFee: totals.shippingFee,
      total: totals.total,
      paymentMethod: method,
      paymentStatus,
      status: 'pending',
      shippingMethod: p.shippingMethod || 'standard',
      source: 'web',
      timeline: [{ status: 'pending', label: 'Khách đặt hàng', at: now.toISOString(), note: 'Đơn được tạo từ website' }],
    };
    db.data.orders.push(order);
    // Trừ tồn kho
    items.forEach((it) => {
      const prod = products.get(it.productId);
      if (prod) products.setStock(prod.id, (Number(prod.stock) || 0) - it.qty);
    });
    if (totals.coupon) {
      const c = db.data.coupons.find((x) => x.code === totals.coupon.code);
      if (c) { c.usageCount = (c.usageCount || 0) + 1; db.save('coupons'); }
    }
    db.save('orders');
    MT.bus.emit('orders:change', { type: 'create', order });
    return order;
  };

  db.nextStatuses = function (order) {
    if (!order || order.status === 'cancelled' || order.status === 'completed') return [];
    const map = { pending: ['confirmed'], confirmed: ['packing'], packing: ['shipping'], shipping: ['completed'] };
    return (map[order.status] || []).concat(order.status === 'shipping' ? [] : ['cancelled']);
  };

  db.setOrderStatus = function (id, status, note) {
    const order = db.data.orders.find((o) => o.id === id || o.code === id);
    if (!order) throw new Error('Không tìm thấy đơn hàng.');
    if (order.status === status) return order;
    if (order.status === 'cancelled' && status !== 'cancelled') throw new Error('Đơn đã huỷ, không thể chuyển trạng thái.');
    if (status === 'cancelled' && (order.status === 'shipping' || order.status === 'completed')) {
      throw new Error('Đơn đã bàn giao vận chuyển, không thể huỷ. Hãy xử lý hoàn hàng sau khi giao.');
    }
    const wasCancelled = order.status === 'cancelled';
    order.status = status;
    order.timeline = order.timeline || [];
    order.timeline.push({
      status,
      label: (MT.meta.orderStatus[status] || {}).label || status,
      at: new Date().toISOString(),
      note: note || '',
    });
    if (status === 'cancelled' && !wasCancelled) {
      (order.items || []).forEach((it) => {
        const p = products.get(it.productId);
        if (p) products.setStock(p.id, (Number(p.stock) || 0) + it.qty);
      });
      if (order.paymentStatus === 'paid') order.paymentStatus = 'refunded';
    }
    if (status === 'completed' && order.paymentMethod === 'cod') order.paymentStatus = 'paid';
    db.save('orders');
    MT.bus.emit('orders:change', { type: 'status', order });
    return order;
  };

  db.markPaid = function (id) {
    const order = db.data.orders.find((o) => o.id === id || o.code === id);
    if (!order) throw new Error('Không tìm thấy đơn hàng.');
    order.paymentStatus = 'paid';
    order.timeline.push({ status: 'payment', label: 'Khách xác nhận đã thanh toán', at: new Date().toISOString() });
    if (order.status === 'pending') {
      order.status = 'confirmed';
      order.timeline.push({ status: 'confirmed', label: 'Đã xác nhận đơn', at: new Date().toISOString() });
    }
    db.save('orders');
    MT.bus.emit('orders:change', { type: 'paid', order });
    return order;
  };

  db.findOrder = function (q) {
    const s = String(q || '').trim().toLowerCase();
    if (!s) return null;
    return (db.data.orders || []).find((o) =>
      o.code.toLowerCase() === s ||
      o.customer.phone.replace(/\s/g, '') === s.replace(/\s/g, '') ||
      (o.customer.email && o.customer.email.toLowerCase() === s)
    ) || null;
  };

  db.searchOrders = function (q) {
    const s = String(q || '').trim().toLowerCase();
    if (!s) return [];
    const digits = s.replace(/\D/g, '');
    return (db.data.orders || []).filter((o) =>
      o.code.toLowerCase().includes(s) ||
      o.customer.name.toLowerCase().includes(s) ||
      (digits && o.customer.phone.replace(/\D/g, '').includes(digits)) ||
      (o.customer.email && o.customer.email.toLowerCase().includes(s))
    );
  };

  /* ------------------------------- Reviews --------------------------------- */
  db.addReview = function (payload) {
    const name = String(payload.name || '').trim();
    const text = String(payload.text || '').trim();
    const rating = U.clamp(Math.round(payload.rating), 1, 5);
    if (name.length < 2) throw new Error('Vui lòng nhập tên của bạn.');
    if (text.length < 10) throw new Error('Nội dung đánh giá cần ít nhất 10 ký tự.');
    if (!payload.productId) throw new Error('Thiếu sản phẩm.');
    const review = {
      id: U.uid('RV'), productId: payload.productId, name, rating, text,
      verified: !!payload.verified, at: new Date().toISOString(), source: 'user',
    };
    db.data.reviews.unshift(review);
    db.save('reviews');
    MT.bus.emit('reviews:change', review);
    return review;
  };

  /* ------------------------------ Subscribers ------------------------------ */
  db.addSubscriber = function (email) {
    const e = String(email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) throw new Error('Email không hợp lệ.');
    if ((db.data.subscribers || []).some((s) => s.email === e)) return { existed: true };
    db.data.subscribers.push({ email: e, at: new Date().toISOString() });
    db.save('subscribers');
    return { existed: false };
  };

  /* -------------------------------- Members -------------------------------- */
  const members = {
    all() { return db.data.members || []; },
    get(id) { return members.all().find((m) => m.id === id) || null; },
    stats(memberId) {
      const list = (db.data.tasks || []).filter((t) => t.assigneeId === memberId);
      const done = list.filter((t) => t.status === 'done');
      const today = U.startOfDay(new Date());
      const overdue = list.filter((t) => t.status !== 'done' && t.dueDate && new Date(t.dueDate) < today);
      const onTime = done.filter((t) => !t.completedAt || !t.dueDate || new Date(t.completedAt) <= U.endOfDay(t.dueDate));
      return {
        total: list.length, done: done.length,
        active: list.filter((t) => t.status !== 'done').length,
        overdue: overdue.length,
        progress: list.length ? Math.round(U.sum(list, (t) => t.progress) / list.length) : 0,
        onTimeRate: done.length ? Math.round((onTime.length / done.length) * 100) : 0,
        evidence: U.sum(list, (t) => (t.evidence || []).length),
        hours: U.sum(list, (t) => t.estimateHours || 0),
      };
    },
    save(id, data) {
      if (id) {
        const m = members.get(id);
        if (!m) throw new Error('Không tìm thấy thành viên.');
        Object.assign(m, data);
      } else {
        const n = members.all().length + 1;
        const member = Object.assign({
          id: 'MB-' + String(n).padStart(2, '0') + (members.all().some((x) => x.id === 'MB-' + String(n).padStart(2, '0')) ? '-' + Date.now().toString(36) : ''),
          color: ['#4F46E5', '#0EA5E9', '#D99AA6', '#10B981', '#F59E0B', '#8B5CF6'][n % 6],
          status: 'active', joinedAt: U.todayISO(), skills: [], kpiTarget: 0,
        }, data);
        db.data.members.push(member);
      }
      db.save('members');
      MT.bus.emit('members:change');
      return id ? members.get(id) : db.data.members[db.data.members.length - 1];
    },
    remove(id) {
      const m = members.get(id);
      if (!m) return false;
      db.data.members = db.data.members.filter((x) => x.id !== id);
      (db.data.tasks || []).forEach((t) => {
        if (t.assigneeId === id) {
          t.assigneeId = '';
          t.activity = t.activity || [];
          t.activity.push({ at: new Date().toISOString(), text: 'Thành viên phụ trách đã rời nhóm — cần phân công lại', by: 'system' });
        }
      });
      db.saveMany(['members', 'tasks']);
      MT.bus.emit('entity:delete', { table: 'members', id });
      MT.bus.emit('members:change');
      MT.bus.emit('tasks:change');
      return true;
    },
  };
  db.members = members;

  /* --------------------------------- Tasks --------------------------------- */
  const tasks = {
    all() { return db.data.tasks || []; },
    get(id) { return tasks.all().find((t) => t.id === id) || null; },
    save(id, data) {
      if (id) {
        const t = tasks.get(id);
        if (!t) throw new Error('Không tìm thấy nhiệm vụ.');
        const before = t.status;
        Object.assign(t, data);
        t.activity = t.activity || [];
        if (data.status && data.status !== before) {
          t.activity.push({ at: new Date().toISOString(), text: 'Chuyển trạng thái: ' + (MT.meta.taskStatus[before] || {}).label + ' → ' + (MT.meta.taskStatus[data.status] || {}).label, by: data.updatedBy || 'MB-01' });
          if (data.status === 'done') {
            t.progress = 100;
            t.completedAt = new Date().toISOString();
          } else if (before === 'done') {
            t.completedAt = null;
          }
        }
        if (data.progress != null && data.progress >= 100 && t.status !== 'done') {
          t.status = 'done';
          t.completedAt = new Date().toISOString();
        }
        t.updatedAt = new Date().toISOString();
        db.save('tasks');
        MT.bus.emit('tasks:change');
        return t;
      }
      const n = tasks.all().length + 1;
      const task = Object.assign({
        id: U.uid('TK'), code: 'CV-' + String(n).padStart(3, '0'),
        status: 'todo', progress: 0, priority: 'medium', desc: '',
        createdAt: new Date().toISOString(), evidence: [], activity: [],
        estimateHours: 0, actualHours: 0, tags: [],
      }, data);
      task.activity.push({ at: new Date().toISOString(), text: 'Tạo nhiệm vụ' + (data.assigneeId ? ' và giao cho thành viên' : ''), by: data.createdBy || 'MB-01' });
      db.data.tasks.push(task);
      db.save('tasks');
      MT.bus.emit('tasks:change');
      return task;
    },
    remove(id) {
      const t = tasks.get(id);
      if (!t) return false;
      db.data.tasks = db.data.tasks.filter((x) => x.id !== id);
      db.save('tasks');
      MT.bus.emit('entity:delete', { table: 'tasks', id });
      MT.bus.emit('tasks:change');
      return true;
    },
    addEvidence(id, evidence) {
      const t = tasks.get(id);
      if (!t) throw new Error('Không tìm thấy nhiệm vụ.');
      const item = Object.assign({
        id: U.uid('EV'), at: new Date().toISOString(), by: evidence.by || t.assigneeId || 'MB-01',
      }, evidence);
      t.evidence = t.evidence || [];
      t.evidence.unshift(item);
      t.activity = t.activity || [];
      t.activity.push({
        at: item.at,
        text: item.type === 'image' ? 'Nộp bằng chứng hình ảnh: ' + (item.name || 'ảnh') : 'Nộp bằng chứng văn bản',
        by: item.by,
      });
      if (t.progress < 30 && t.status === 'todo') t.status = 'doing';
      t.updatedAt = new Date().toISOString();
      db.save('tasks');
      MT.bus.emit('tasks:change');
      return item;
    },
    removeEvidence(taskId, evidenceId) {
      const t = tasks.get(taskId);
      if (!t) return false;
      t.evidence = (t.evidence || []).filter((e) => e.id !== evidenceId);
      db.save('tasks');
      MT.bus.emit('tasks:change');
      return true;
    },
    stats() {
      const list = tasks.all();
      const today = U.startOfDay(new Date());
      return {
        total: list.length,
        todo: list.filter((t) => t.status === 'todo').length,
        doing: list.filter((t) => t.status === 'doing').length,
        review: list.filter((t) => t.status === 'review').length,
        done: list.filter((t) => t.status === 'done').length,
        overdue: list.filter((t) => t.status !== 'done' && t.dueDate && new Date(t.dueDate) < today).length,
        progress: list.length ? Math.round(U.sum(list, (t) => t.progress) / list.length) : 0,
        evidence: U.sum(list, (t) => (t.evidence || []).length),
      };
    },
  };
  db.tasks = tasks;

  /* ------------------------------ Cart & shop ------------------------------ */
  const cart = {
    _data() {
      return storage.get('cart') || { items: [], coupon: '', updatedAt: null };
    },
    _write(data) {
      data.updatedAt = new Date().toISOString();
      storage.set('cart', data);
      MT.bus.emit('cart:change', data);
      return data;
    },
    data() { return cart._data(); },
    details() {
      const data = cart._data();
      const items = [];
      (data.items || []).forEach((line) => {
        const p = products.get(line.productId);
        if (!p || p.active === false) return;
        items.push({
          key: line.key,
          product: p,
          variant: line.variant || '',
          qty: Math.min(line.qty, Math.max(1, Number(p.stock) || 1)),
          lineTotal: p.price * line.qty,
        });
      });
      return { items, coupon: data.coupon || '' };
    },
    add(productId, variant, qty) {
      const p = products.get(productId);
      if (!p) throw new Error('Sản phẩm không tồn tại.');
      if (p.active === false) throw new Error('Sản phẩm đã ngừng bán.');
      const stock = Number(p.stock) || 0;
      if (stock <= 0) throw new Error('Sản phẩm đã hết hàng.');
      const q = Math.max(1, Math.round(Number(qty) || 1));
      const data = cart._data();
      const v = variant || (p.variants && p.variants[0] ? p.variants[0].name : '');
      const key = p.id + '::' + v;
      const existing = data.items.find((x) => x.key === key);
      const current = existing ? existing.qty : 0;
      const next = Math.min(stock, MT.config.limits.maxCartQty, current + q);
      if (existing) existing.qty = next;
      else data.items.push({ key, productId: p.id, variant: v, qty: Math.min(q, stock) });
      return cart._write(data);
    },
    setQty(key, qty) {
      const data = cart._data();
      const item = data.items.find((x) => x.key === key);
      if (!item) return data;
      const p = products.get(item.productId);
      const stock = p ? Number(p.stock) : 1;
      const q = Math.round(Number(qty) || 0);
      if (q <= 0) data.items = data.items.filter((x) => x.key !== key);
      else item.qty = Math.min(q, stock, MT.config.limits.maxCartQty);
      return cart._write(data);
    },
    remove(key) {
      const data = cart._data();
      data.items = data.items.filter((x) => x.key !== key);
      return cart._write(data);
    },
    clear() {
      return cart._write({ items: [], coupon: '', updatedAt: new Date().toISOString() });
    },
    setCoupon(code) {
      const data = cart._data();
      data.coupon = code || '';
      return cart._write(data);
    },
    count() {
      return U.sum(cart._data().items || [], (x) => x.qty);
    },
  };
  MT.cart = cart;

  const wishlist = {
    all() { return storage.get('wishlist') || []; },
    has(id) { return wishlist.all().includes(id); },
    toggle(id) {
      let list = wishlist.all();
      if (list.includes(id)) list = list.filter((x) => x !== id);
      else list.push(id);
      storage.set('wishlist', list);
      MT.bus.emit('wishlist:change', list);
      return list.includes(id);
    },
    count() { return wishlist.all().length; },
  };
  MT.wishlist = wishlist;

  const customer = {
    get() { return storage.get('customer') || {}; },
    save(data) { storage.set('customer', Object.assign({}, customer.get(), data)); },
  };
  MT.customer = customer;

  /* ------------------------------- Cross-tab ------------------------------- */
  window.addEventListener('storage', (e) => {
    if (e.key && e.key.indexOf(PREFIX) === 0) {
      db.reload();
      MT.bus.emit('cart:change', cart.data());
    }
  });

  MT.db = db;
  init();
})();
