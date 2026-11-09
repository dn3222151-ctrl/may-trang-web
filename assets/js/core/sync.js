/* ==========================================================================
   MÂY TRẮNG – Tự động đẩy thay đổi lên Supabase & realtime subscribe
   Lắng nghe mọi thay đổi dữ liệu trong dashboard, gom lại và upsert cloud.
   ========================================================================== */
(function () {
  const MT = window.MT;
  const S = (MT.sync = MT.sync || {});
  let dirty = new Set();
  let orderIds = new Set();
  const deletes = { members: new Set(), tasks: new Set(), coupons: new Set(), products: new Set() };
  let timer = null;
  let running = false;
  let suspended = 0;
  const listeners = [];

  function pendingCount() {
    return dirty.size + orderIds.size + Object.keys(deletes).reduce((s, k) => s + deletes[k].size, 0);
  }

  const state = (S.state = {
    mode: 'local', pending: 0, lastSync: null, error: '', running: false, signedIn: false,
  });

  function configured() { return Boolean(MT.remote && MT.remote.isConfigured()); }
  function signedIn() { return Boolean(MT.remote && MT.remote.isSignedIn()); }

  function snapshot() {
    return {
      mode: state.mode,
      pending: pendingCount(),
      lastSync: state.lastSync,
      error: state.error,
      running: running,
      signedIn: signedIn(),
      configured: configured(),
    };
  }

  function notify() {
    const s = snapshot();
    listeners.forEach((fn) => { try { fn(s); } catch (e) {} });
  }

  function refreshMode() {
    if (!configured()) state.mode = 'local';
    else if (!signedIn()) state.mode = 'signedout';
    else if (running) state.mode = 'syncing';
    else if (state.error) state.mode = 'error';
    else state.mode = 'synced';
    notify();
  }

  function mapTable(name) {
    if (name === 'inventory' || name === 'customProducts') return 'products';
    if (name === 'settings' || name === 'members' || name === 'tasks' || name === 'coupons'
      || name === 'reviews' || name === 'subscribers' || name === 'orders') return name;
    return null;
  }

  function mark(name) {
    if (name === 'orders') { dirty.add('orders'); return; }
    const t = mapTable(name);
    if (t) dirty.add(t);
  }

  function schedule(ms) {
    if (suspended) return;
    if (!configured()) { refreshMode(); return; }
    clearTimeout(timer);
    timer = setTimeout(() => { flush(); }, ms == null ? 750 : ms);
  }

  async function flush() {
    if (suspended) return;
    if (!configured()) { state.mode = 'local'; state.error = ''; notify(); return; }
    if (!signedIn()) {
      state.mode = 'signedout';
      state.pending = pendingCount();
      notify();
      return;
    }
    if (MT.remote.isPulling()) return;
    if (running) { schedule(1200); return; }
    if (!dirty.size && !orderIds.size && pendingCount() === 0) { refreshMode(); return; }

    const tables = Array.from(dirty);
    const ids = Array.from(orderIds);
    const deleted = {};
    Object.keys(deletes).forEach((k) => {
      if (deletes[k].size) deleted[k] = Array.from(deletes[k]);
      deletes[k].clear();
    });
    dirty.clear();
    orderIds.clear();
    running = true;
    state.running = true;
    state.mode = 'syncing';
    state.error = '';
    notify();

    try {
      const delTables = Object.keys(deleted);
      for (const table of delTables) {
        await MT.remote.deleteRows(table, deleted[table]);
      }
      if (ids.length) {
        for (const id of ids) await MT.remote.pushOrder(id);
      }
      if (tables.length) {
        await MT.remote.pushTables(tables);
      }
      state.lastSync = Date.now();
      state.mode = 'synced';
    } catch (e) {
      tables.forEach((t) => dirty.add(t));
      ids.forEach((id) => orderIds.add(id));
      Object.keys(deleted).forEach((table) => deleted[table].forEach((id) => deletes[table].add(id)));
      state.mode = 'error';
      state.error = e.message || String(e);
      console.warn('[sync]', e);
    } finally {
      running = false;
      state.running = false;
      state.pending = pendingCount();
      notify();
      if (pendingCount() > 0) schedule(5000);
    }
  }

  S.init = function () {
    if (S._inited) return;
    S._inited = true;

    MT.bus.on('db:change', (p) => {
      if (suspended) return;
      if (MT.remote && MT.remote.isPulling()) return;
      const name = p && p.name;
      if (name === 'all') {
        ['products', 'members', 'tasks', 'orders', 'reviews', 'coupons', 'subscribers', 'settings'].forEach((t) => dirty.add(t));
      } else if (name === 'orders') {
        // orders:change sẽ bắt bản ghi cụ thể; bỏ qua để tránh đẩy toàn bộ
      } else {
        mark(name);
      }
      schedule();
    });

    MT.bus.on('orders:change', (p) => {
      if (suspended || (MT.remote && MT.remote.isPulling())) return;
      if (p && p.order && p.order.id) orderIds.add(p.order.id);
      else dirty.add('orders');
      schedule();
    });

    MT.bus.on('db:reset', () => {
      if (suspended || (MT.remote && MT.remote.isPulling())) return;
      ['products', 'members', 'tasks', 'orders', 'reviews', 'coupons', 'subscribers', 'settings'].forEach((t) => dirty.add(t));
      schedule(400);
    });

    MT.bus.on('members:change', () => {
      if (suspended) return;
      dirty.add('members');
      schedule();
    });

    MT.bus.on('tasks:change', () => {
      if (suspended) return;
      dirty.add('tasks');
      schedule();
    });

    MT.bus.on('entity:delete', (p) => {
      if (suspended || !p || !deletes[p.table]) return;
      deletes[p.table].add(p.id);
      schedule(300);
    });

    refreshMode();
    notify();
  };

  S.onChange = function (fn) {
    listeners.push(fn);
    try { fn(snapshot()); } catch (e) {}
    return () => {
      const i = listeners.indexOf(fn);
      if (i >= 0) listeners.splice(i, 1);
    };
  };

  S.suspend = function () { suspended += 1; };
  S.resume = function () { suspended = Math.max(0, suspended - 1); schedule(200); };
  S.flushNow = async function () {
    clearTimeout(timer);
    if (running) return;
    await flush();
  };
  S.pendingCount = function () { return pendingCount(); };
  S.clearPending = function () {
    dirty.clear();
    orderIds.clear();
    Object.keys(deletes).forEach((k) => deletes[k].clear());
    state.pending = 0;
    notify();
  };
  S.discardPending = S.clearPending;
  S.setError = function (msg) {
    state.error = msg || '';
    state.mode = msg ? 'error' : (signedIn() ? 'synced' : 'signedout');
    notify();
  };
  S.markSynced = function () {
    state.lastSync = Date.now();
    state.error = '';
    state.mode = signedIn() ? 'synced' : 'local';
    notify();
  };
  S.status = snapshot;
  S.markAll = function () {
    ['products', 'members', 'tasks', 'orders', 'reviews', 'coupons', 'subscribers', 'settings'].forEach((t) => dirty.add(t));
    schedule(200);
  };
  S.refresh = function () { refreshMode(); };
})();