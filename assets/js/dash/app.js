/* ==========================================================================
   MÂY TRẮNG – Dashboard core: state, range, UI helpers, charts, routing
   ========================================================================== */
(function () {
  const MT = window.MT;
  const U = MT.util;
  const D = (MT.dash = MT.dash || {});
  D.views = {};
  D.register = function (name, view) { D.views[name] = view; };

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  D.state = {
    view: 'overview',
    rangeKey: localStorage.getItem('mt.dash.range') || '365',
  };

  D.money = U.fmt.money;
  D.short = U.fmt.moneyShort;
  D.num = U.fmt.num;
  D.pct = U.fmt.pct;
  D.icon = U.icon;
  D.esc = U.esc;
  D.avatar = function (member, size) {
    const m = typeof member === 'string' ? D.member(member) : member;
    const cls = 'avatar' + (size ? ' avatar--' + size : '');
    return '<span class="' + cls + '" style="background:' + (m.color || '#64748B') + '">' + U.initials(m.name || 'NA') + '</span>';
  };
  D.member = function (id) {
    if (!id) return { id: '', name: 'Chưa phân công', color: '#94A3B8', role: '' };
    return MT.db.members.get(id) || { id, name: 'Không xác định', color: '#94A3B8', role: '' };
  };
  D.memberOptions = function (selected, placeholder) {
    return (placeholder ? '<option value="">' + U.esc(placeholder) + '</option>' : '') +
      MT.db.data.members.map((m) => '<option value="' + m.id + '" ' + (m.id === selected ? 'selected' : '') + '>' + U.esc(m.name) + ' — ' + U.esc(m.role) + '</option>').join('');
  };
  D.orderStatus = (s) => MT.meta.orderStatus[s] || { label: s, cls: 'gray' };
  D.statusBadge = function (status) {
    const m = D.orderStatus(status);
    return '<span class="badge badge-' + m.cls + '">' + U.esc(m.label) + '</span>';
  };
  D.paymentBadge = function (status) {
    const m = MT.meta.paymentStatus[status] || { label: status, cls: 'gray' };
    return '<span class="badge badge-' + m.cls + '">' + U.esc(m.label) + '</span>';
  };
  D.priority = function (p) {
    const m = MT.meta.priority[p] || MT.meta.priority.medium;
    return '<span class="priority ' + p + '"><span class="dot"></span>' + m.label + '</span>';
  };
  D.trendHtml = function (delta) {
    if (delta == null || isNaN(delta)) return '<span class="trend flat">—</span>';
    const dir = delta > 0.05 ? 'up' : delta < -0.05 ? 'down' : 'flat';
    const arrow = dir === 'up' ? '↑' : dir === 'down' ? '↓' : '→';
    return '<span class="trend ' + dir + '">' + arrow + ' ' + U.fmt.pct(Math.abs(delta)) + '</span>';
  };

  /* -------------------------------- Range --------------------------------- */
  D.range = function () {
    const key = D.state.rangeKey;
    const now = new Date();
    let from;
    if (key === 'all') {
      const dates = (MT.db.data.orders || []).map((o) => new Date(o.createdAt).getTime());
      from = dates.length ? U.startOfDay(new Date(Math.min.apply(null, dates))) : U.startOfDay(U.addDays(now, -364));
    } else {
      const days = Number(key) || 365;
      from = U.startOfDay(U.addDays(now, -(days - 1)));
    }
    const to = U.endOfDay(now);
    return { key, from, to, days: U.daysBetween(from, to) };
  };
  D.rangeLabel = function () {
    const r = D.range();
    if (r.key === 'all') return U.fmt.date(r.from) + ' – ' + U.fmt.date(r.to);
    return r.days + ' ngày qua';
  };
  D.setRange = function (key) {
    D.state.rangeKey = key;
    localStorage.setItem('mt.dash.range', key);
    const sel = document.getElementById('rangeSelect');
    if (sel) sel.value = key;
    D.refresh();
  };
  D.orders = function (from, to) {
    const r = D.range();
    return MT.finance.ordersInRange(MT.db.data.orders, from || r.from, to || r.to);
  };
  D.prevOrders = function () {
    const r = D.range();
    const to = U.addDays(r.from, -1);
    const from = U.addDays(to, -(r.days - 1));
    return MT.finance.ordersInRange(MT.db.data.orders, from, to);
  };
  D.summary = function (orders, days) {
    return MT.finance.summarize(orders || D.orders(), days || D.range().days);
  };
  D.previousSummary = function () {
    return MT.finance.summarize(D.prevOrders(), D.range().days);
  };

  /** Chuỗi thời gian linh hoạt: ngày / tuần / tháng tùy độ dài kỳ. */
  D.series = function (from, to) {
    const start = U.startOfDay(from || D.range().from);
    const end = U.endOfDay(to || D.range().to);
    const days = U.daysBetween(start, end);
    const out = [];
    if (days <= 35) {
      for (let i = 0; i < days; i++) {
        const d = U.addDays(start, i);
        const list = MT.finance.ordersInRange(MT.db.data.orders, d, d);
        const s = MT.finance.summarize(list, 1);
        out.push({ label: U.fmt.dateShort(d), date: d, orders: s.orders, revenue: s.netRevenue, profit: s.netProfit, cogs: s.cogs, contribution: s.contribution });
      }
    } else if (days <= 120) {
      const weeks = Math.ceil(days / 7);
      for (let i = 0; i < weeks; i++) {
        const a = U.addDays(start, i * 7);
        const b = U.endOfDay(U.addDays(a, 6)) > end ? end : U.endOfDay(U.addDays(a, 6));
        const list = MT.finance.ordersInRange(MT.db.data.orders, a, b);
        const s = MT.finance.summarize(list, U.daysBetween(a, b));
        out.push({ label: U.fmt.dateShort(a), date: a, orders: s.orders, revenue: s.netRevenue, profit: s.netProfit, cogs: s.cogs, contribution: s.contribution });
      }
    } else {
      let cursor = U.startOfMonth(start);
      while (cursor <= end) {
        const a = cursor < start ? start : cursor;
        const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
        const b = U.endOfDay(monthEnd > end ? end : monthEnd);
        const list = MT.finance.ordersInRange(MT.db.data.orders, a, b);
        const s = MT.finance.summarize(list, U.daysBetween(a, b));
        out.push({ label: U.fmt.month(cursor), date: cursor, orders: s.orders, revenue: s.netRevenue, profit: s.netProfit, cogs: s.cogs, contribution: s.contribution });
        cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
      }
    }
    return out;
  };

  /* -------------------------------- Charts -------------------------------- */
  const palette = ['#4F46E5', '#0EA5E9', '#D99AA6', '#10B981', '#F59E0B', '#8B5CF6', '#3B82F6'];
  D.palette = palette;

  if (window.Chart) {
    Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
    Chart.defaults.font.size = 11;
    Chart.defaults.color = '#64748B';
    Chart.defaults.borderColor = '#EEF2F7';
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.plugins.legend.labels.boxWidth = 8;
    Chart.defaults.plugins.tooltip.backgroundColor = '#0F172A';
    Chart.defaults.plugins.tooltip.padding = 10;
    Chart.defaults.plugins.tooltip.cornerRadius = 8;
    Chart.defaults.plugins.tooltip.titleFont = { size: 11, weight: '600' };
    Chart.defaults.plugins.tooltip.bodyFont = { size: 11 };
  }

  D.chart = function (id, config) {
    const el = typeof id === 'string' ? document.getElementById(id) : id;
    if (!el) return null;
    if (!window.Chart) {
      const parent = el.parentElement;
      if (parent) parent.insertAdjacentHTML('beforeend', '<div class="chart-empty">Không tải được thư viện biểu đồ.<br>Kiểm tra kết nối mạng và tải lại trang.</div>');
      return null;
    }
    const existing = Chart.getChart(el);
    if (existing) existing.destroy();
    const opts = config.options || {};
    opts.responsive = true;
    opts.maintainAspectRatio = false;
    opts.animation = { duration: 500 };
    config.options = opts;
    return new Chart(el, config);
  };

  D.gradient = function (ctx, area, color) {
    if (!ctx || !area) return color;
    const g = ctx.createLinearGradient(0, area.top, 0, area.bottom);
    g.addColorStop(0, color + '55');
    g.addColorStop(1, color + '05');
    return g;
  };

  /* --------------------------------- UI ----------------------------------- */
  D.modal = function (opts) {
    const o = opts || {};
    const root = document.getElementById('modalRoot');
    if (root._closeTimer) { clearTimeout(root._closeTimer); root._closeTimer = null; }
    root.innerHTML = '';
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML =
      '<div class="modal ' + (o.size ? 'modal--' + o.size : '') + '" role="dialog" aria-modal="true" aria-label="' + U.esc(o.title || 'Hộp thoại') + '">' +
      '<div class="modal__head"><h3>' + U.esc(o.title || '') + '</h3>' +
      '<button class="icon-btn" type="button" data-modal-close aria-label="Đóng">' + D.icon('close', 18) + '</button></div>' +
      '<div class="modal__body">' + (o.body || '') + '</div>' +
      (o.footer ? '<div class="modal__foot">' + o.footer + '</div>' : '') +
      '</div>';
    root.appendChild(overlay);
    document.body.classList.add('no-scroll');
    requestAnimationFrame(() => overlay.classList.add('open'));
    const close = () => {
      overlay.classList.remove('open');
      document.body.classList.remove('no-scroll');
      setTimeout(() => { overlay.remove(); }, 220);
      if (D.closeModal === close) D.closeModal = null;
      if (o.onClose) o.onClose();
    };
    D.closeModal = close;
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target.closest('[data-modal-close]')) close();
    });
    const onKey = (e) => { if (e.key === 'Escape') { document.removeEventListener('keydown', onKey); close(); } };
    document.addEventListener('keydown', onKey);
    if (o.onMount) o.onMount(overlay.querySelector('.modal'), close);
    return { close, overlay, el: overlay.querySelector('.modal') };
  };

  D.drawer = function (opts) {
    const o = opts || {};
    const root = document.getElementById('drawerRoot');
    if (root._closeTimer) { clearTimeout(root._closeTimer); root._closeTimer = null; }
    root.innerHTML = '';
    const el = document.createElement('div');
    el.className = 'drawer';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.innerHTML =
      '<div class="drawer__head"><h2>' + (o.title || '') + '</h2>' +
      '<button class="icon-btn" type="button" data-drawer-close aria-label="Đóng">' + D.icon('close', 18) + '</button></div>' +
      '<div class="drawer__body">' + (o.body || '') + '</div>' +
      (o.footer ? '<div class="drawer__foot">' + o.footer + '</div>' : '');
    root.appendChild(el);
    const overlay = document.getElementById('drawerOverlay');
    overlay.classList.add('open');
    document.body.classList.add('no-scroll');
    requestAnimationFrame(() => el.classList.add('open'));
    const close = () => {
      el.classList.remove('open');
      overlay.classList.remove('open');
      document.body.classList.remove('no-scroll');
      if (root._closeTimer) clearTimeout(root._closeTimer);
      root._closeTimer = setTimeout(() => { root.innerHTML = ''; root._closeTimer = null; }, 340);
      if (o.onClose) o.onClose();
    };
    D.closeDrawer = close;
    el.addEventListener('click', (e) => { if (e.target.closest('[data-drawer-close]')) close(); });
    if (o.onMount) o.onMount(el, close);
    return { close, el };
  };

  D.lightbox = function (src) {
    const root = document.getElementById('overlayRoot');
    const el = document.createElement('div');
    el.className = 'image-lightbox';
    el.innerHTML = '<img src="' + U.esc(src) + '" alt="Bằng chứng"><button type="button" aria-label="Đóng">' + D.icon('close', 20) + '</button>';
    root.appendChild(el);
    const close = () => el.remove();
    el.addEventListener('click', (e) => { if (e.target === el || e.target.closest('button')) close(); });
    const onKey = (e) => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey); } };
    document.addEventListener('keydown', onKey);
  };

  D.toast = U.toast;
  D.confirm = U.confirm;

  D.copy = async function (text) {
    const ok = await U.copy(text);
    U.toast(ok ? 'Đã sao chép' : 'Không thể sao chép', ok ? 'success' : 'error');
  };

  D.exportCsv = function (filename, rows) {
    U.download(filename, U.csv(rows), 'text/csv;charset=utf-8');
    U.toast('Đã xuất file ' + filename, 'success');
  };

  D.miniSpark = function (values, color) {
    const vals = values.slice(-12);
    if (!vals.length) return '';
    const w = 92, h = 36;
    const max = Math.max.apply(null, vals), min = Math.min.apply(null, vals);
    const span = max - min || 1;
    const pts = vals.map((v, i) => {
      const x = (i / Math.max(1, vals.length - 1)) * w;
      const y = h - ((v - min) / span) * (h - 6) - 3;
      return x.toFixed(1) + ',' + y.toFixed(1);
    }).join(' ');
    const area = '0,' + h + ' ' + pts + ' ' + w + ',' + h;
    return '<svg class="kpi-spark" viewBox="0 0 92 36" preserveAspectRatio="none" aria-hidden="true">' +
      '<polygon points="' + area + '" fill="' + color + '18"></polygon>' +
      '<polyline points="' + pts + '" fill="none" stroke="' + color + '" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></polyline></svg>';
  };

  D.ring = function (pct, size, color) {
    const s = size || 92;
    const r = (s - 10) / 2;
    const c = 2 * Math.PI * r;
    const p = U.clamp(pct, 0, 100);
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 ' + s + ' ' + s + '" aria-hidden="true">' +
      '<circle cx="' + s / 2 + '" cy="' + s / 2 + '" r="' + r + '" fill="none" stroke="#EEF2F7" stroke-width="8"/>' +
      '<circle cx="' + s / 2 + '" cy="' + s / 2 + '" r="' + r + '" fill="none" stroke="' + (color || '#4F46E5') + '" stroke-width="8" stroke-linecap="round" stroke-dasharray="' + c + '" stroke-dashoffset="' + (c - (p / 100) * c) + '" transform="rotate(-90 ' + s / 2 + ' ' + s / 2 + ')"/>' +
      '<text x="50%" y="52%" text-anchor="middle" dominant-baseline="middle" font-family="Inter" font-size="' + (s / 5) + '" font-weight="700" fill="#1E293B">' + Math.round(p) + '%</text></svg>';
  };

  D.progress = function (pct, cls) {
    return '<div class="progress ' + (cls ? 'progress--' + cls : '') + '"><span style="width:' + U.clamp(pct, 0, 100) + '%"></span></div>';
  };

  /* ------------------------------- Invoice -------------------------------- */
  D.printInvoice = function (order) {
    const s = MT.db.settings().store;
    const meta = MT.meta.orderStatus[order.status] || {};
    const rows = order.items.map((it) =>
      '<tr><td>' + U.esc(it.name) + (it.variant ? '<br><small>' + U.esc(it.variant) + '</small>' : '') + '</td>' +
      '<td class="num">' + it.qty + '</td><td class="num">' + D.money(it.price) + '</td>' +
      '<td class="num">' + D.money(it.price * it.qty) + '</td></tr>').join('');
    const sheet = document.createElement('div');
    sheet.className = 'print-sheet';
    sheet.innerHTML =
      '<h1>HOÁ ĐƠN BÁN HÀNG</h1><div>' + U.esc(s.legal) + ' · MST: ' + U.esc(s.taxCode) + '</div>' +
      '<div>' + U.esc(s.address) + ' · ' + U.esc(s.hotline) + '</div><hr>' +
      '<div><strong>Mã đơn:</strong> ' + U.esc(order.code) + ' &nbsp; <strong>Ngày:</strong> ' + U.fmt.datetime(order.createdAt) + '</div>' +
      '<div><strong>Khách hàng:</strong> ' + U.esc(order.customer.name) + ' · ' + U.esc(order.customer.phone) + '</div>' +
      '<div><strong>Địa chỉ:</strong> ' + U.esc(order.customer.address) + ', ' + U.esc(order.customer.province) + '</div>' +
      '<div><strong>Thanh toán:</strong> ' + U.esc((MT.meta.paymentMethods[order.paymentMethod] || {}).label || '') + ' · ' + U.esc((MT.meta.paymentStatus[order.paymentStatus] || {}).label || '') + '</div>' +
      '<div><strong>Trạng thái:</strong> ' + U.esc(meta.label || '') + '</div>' +
      '<table><thead><tr><th>Sản phẩm</th><th class="num">SL</th><th class="num">Đơn giá</th><th class="num">Thành tiền</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<table><tbody>' +
      '<tr class="num"><td style="text-align:right">Tạm tính</td><td class="num">' + D.money(order.subtotal) + '</td></tr>' +
      (order.discount ? '<tr><td style="text-align:right">Giảm giá</td><td class="num">-' + D.money(order.discount) + '</td></tr>' : '') +
      '<tr><td style="text-align:right">Vận chuyển</td><td class="num">' + D.money(order.shippingFee) + '</td></tr>' +
      '<tr class="total-row"><td style="text-align:right">Tổng cộng</td><td class="num">' + D.money(order.total) + '</td></tr>' +
      '</tbody></table>' +
      '<p style="margin-top:18px">Cảm ơn quý khách đã mua hàng tại Mây Trắng!</p>';
    document.body.appendChild(sheet);
    setTimeout(() => {
      window.print();
      setTimeout(() => sheet.remove(), 400);
    }, 80);
  };

  /* ------------------------------ Global UI ------------------------------- */
  function syncRangeSelect() {
    const sel = document.getElementById('rangeSelect');
    if (sel) sel.value = D.state.rangeKey;
  }

  function render() {
    const name = D.state.view;
    const view = D.views[name] || D.views.overview;
    const root = document.getElementById('view');
    if (!root || !view) return;
    document.getElementById('pageTitle').textContent = view.title || 'Dashboard';
    document.getElementById('pageCrumb').textContent = view.crumb || 'Mây Trắng · Dashboard';
    $$('.side-link').forEach((b) => b.classList.toggle('active', b.dataset.view === name));
    const rangeSel = document.getElementById('rangeSelect');
    if (rangeSel) rangeSel.style.display = view.noRange ? 'none' : '';
    try {
      root.innerHTML = view.render();
      if (view.mount) view.mount(root);
    } catch (e) {
      console.error(e);
      root.innerHTML = '<div class="card"><div class="card__body"><div class="empty-state">' +
        D.icon('alert', 30) + '<h3>Không tải được màn hình</h3><p>' + U.esc(e.message) + '</p>' +
        '<button class="btn btn-primary" type="button" onclick="MT.dash.refresh()">Thử lại</button></div></div></div>';
    }
    refreshCounts();
    refreshNotifications();
    document.querySelectorAll('#view img[data-fallback]').forEach((img) => {
      img.addEventListener('error', function () {
        if (this.dataset.failed) return;
        this.dataset.failed = '1';
        this.src = U.placeholder(this.alt || 'Mây Trắng');
      });
    });
  }

  D.go = function (name, opts) {
    if (!D.views[name]) name = 'overview';
    if (D.closeModal) { D.closeModal(); D.closeModal = null; }
    if (D.closeDrawer) { D.closeDrawer(); D.closeDrawer = null; }
    D.state.view = name;
    closeSidebar();
    if (location.hash.slice(1) !== name) {
      if (opts && opts.replace) history.replaceState(null, '', '#' + name);
      else location.hash = name;
      // hashchange sẽ render
      if (opts && opts.replace) render();
    } else {
      render();
    }
  };

  D.refresh = function () { render(); };

  function refreshCounts() {
    const pending = (MT.db.data.orders || []).filter((o) => o.status === 'pending').length;
    const overdue = (MT.db.data.tasks || []).filter((t) => t.status !== 'done' && t.dueDate && new Date(t.dueDate) < U.startOfDay(new Date())).length;
    const oc = document.getElementById('navOrdersCount');
    const tc = document.getElementById('navTasksCount');
    if (oc) oc.textContent = pending;
    if (tc) tc.textContent = overdue;
  }

  function notifItems() {
    const items = [];
    const pending = (MT.db.data.orders || []).filter((o) => o.status === 'pending');
    if (pending.length) items.push({ icon: 'box', color: '#F59E0B', title: pending.length + ' đơn hàng chờ xác nhận', sub: 'Cần xử lý để giao đúng hẹn', view: 'orders' });
    const overdue = (MT.db.data.tasks || []).filter((t) => t.status !== 'done' && t.dueDate && new Date(t.dueDate) < U.startOfDay(new Date()));
    if (overdue.length) items.push({ icon: 'alert', color: '#EF4444', title: overdue.length + ' nhiệm vụ quá hạn', sub: overdue.slice(0, 2).map((t) => t.title).join(' · '), view: 'tasks' });
    const low = MT.products.all().filter((p) => p.stock > 0 && p.stock <= 10);
    if (low.length) items.push({ icon: 'box', color: '#F59E0B', title: low.length + ' sản phẩm sắp hết hàng', sub: low.slice(0, 2).map((p) => p.name).join(' · '), view: 'products' });
    const recentReviews = (MT.db.data.reviews || []).filter((r) => new Date(r.at) > U.addDays(new Date(), -7));
    if (recentReviews.length) items.push({ icon: 'star', color: '#D99AA6', title: recentReviews.length + ' đánh giá mới trong 7 ngày', sub: 'Xem phản hồi của khách hàng', view: 'overview' });
    return items;
  }

  function refreshNotifications() {
    const dot = document.getElementById('notifDot');
    if (dot) dot.hidden = notifItems().length === 0;
  }

  function showNotif() {
    const pop = document.getElementById('notifPopover');
    if (!pop) return;
    if (!pop.classList.contains('hidden')) { pop.classList.add('hidden'); return; }
    const items = notifItems();
    pop.innerHTML = '<div class="popover__head"><strong>Thông báo</strong><span class="text-muted" style="font-size:.66rem">' + items.length + ' mục</span></div>' +
      '<div class="popover__body">' + (items.length ? items.map((n, i) =>
        '<div class="notif-item" data-notif-view="' + n.view + '" style="cursor:pointer">' +
        '<span class="notif-item__icon" style="background:' + n.color + '18;color:' + n.color + '">' + D.icon(n.icon, 15) + '</span>' +
        '<div><strong style="font-size:.74rem">' + U.esc(n.title) + '</strong><span>' + U.esc(n.sub) + '</span></div></div>'
      ).join('') : '<div class="search-empty">Không có thông báo mới.</div>') + '</div>';
    pop.classList.remove('hidden');
    pop.querySelectorAll('[data-notif-view]').forEach((el) => el.addEventListener('click', () => {
      pop.classList.add('hidden');
      D.go(el.dataset.notifView);
    }));
  }

  /* ------------------------------- Search --------------------------------- */
  function renderSearch(q) {
    const box = document.getElementById('searchDropdown');
    if (!box) return;
    const s = String(q || '').trim();
    if (s.length < 1) { box.classList.add('hidden'); return; }
    const n = U.normalize(s);
    const orders = (MT.db.data.orders || []).filter((o) => o.code.toLowerCase().includes(n) || o.customer.name.toLowerCase().includes(n) || o.customer.phone.includes(s)).slice(0, 4);
    const products = MT.products.all().filter((p) => U.normalize(p.name + ' ' + p.sku).includes(n)).slice(0, 4);
    const tasks = (MT.db.data.tasks || []).filter((t) => U.normalize(t.title + ' ' + t.code).includes(n)).slice(0, 4);
    const members = (MT.db.data.members || []).filter((m) => U.normalize(m.name + ' ' + m.role).includes(n)).slice(0, 3);
    let html = '';
    if (orders.length) html += '<div class="search-group-title">Đơn hàng</div>' + orders.map((o) =>
      '<div class="search-item" data-search-order="' + o.id + '">' + D.icon('box', 14) + '<strong>' + U.esc(o.code) + '</strong> — ' + U.esc(o.customer.name) + '<span>' + D.money(o.total) + '</span></div>').join('');
    if (products.length) html += '<div class="search-group-title">Sản phẩm</div>' + products.map((p) =>
      '<div class="search-item" data-search-product="' + p.id + '">' + D.icon('grid', 14) + '<strong>' + U.esc(p.name) + '</strong><span>' + D.money(p.price) + '</span></div>').join('');
    if (tasks.length) html += '<div class="search-group-title">Nhiệm vụ</div>' + tasks.map((t) =>
      '<div class="search-item" data-search-task="' + t.id + '">' + D.icon('tasks', 14) + '<strong>' + U.esc(t.title) + '</strong><span>' + (MT.meta.taskStatus[t.status] || {}).label + '</span></div>').join('');
    if (members.length) html += '<div class="search-group-title">Thành viên</div>' + members.map((m) =>
      '<div class="search-item" data-search-member="' + m.id + '">' + D.icon('users', 14) + '<strong>' + U.esc(m.name) + '</strong><span>' + U.esc(m.role) + '</span></div>').join('');
    box.innerHTML = html || '<div class="search-empty">Không tìm thấy kết quả cho “' + U.esc(s) + '”.</div>';
    box.classList.remove('hidden');
    box.querySelectorAll('[data-search-order]').forEach((el) => el.addEventListener('click', () => {
      box.classList.add('hidden');
      D.state.view = 'orders';
      D.go('orders');
      setTimeout(() => { if (D.openOrder) D.openOrder(el.dataset.searchOrder); }, 260);
    }));
    box.querySelectorAll('[data-search-product]').forEach((el) => el.addEventListener('click', () => {
      box.classList.add('hidden');
      D.go('products');
      setTimeout(() => { if (D.openProductForm) D.openProductForm(el.dataset.searchProduct); }, 300);
    }));
    box.querySelectorAll('[data-search-task]').forEach((el) => el.addEventListener('click', () => {
      box.classList.add('hidden');
      D.go('tasks');
      setTimeout(() => { if (D.openTask) D.openTask(el.dataset.searchTask); }, 300);
    }));
    box.querySelectorAll('[data-search-member]').forEach((el) => el.addEventListener('click', () => {
      box.classList.add('hidden');
      D.go('members');
      setTimeout(() => { if (D.openMemberForm) D.openMemberForm(el.dataset.searchMember); }, 300);
    }));
  }

  /* ------------------------------- Sidebar -------------------------------- */
  function openSidebar() {
    document.getElementById('sidebar').classList.add('open');
    const ov = document.getElementById('sidebarOverlay');
    if (ov) ov.classList.add('open');
    document.body.classList.add('no-scroll');
  }
  function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    const ov = document.getElementById('sidebarOverlay');
    if (ov) ov.classList.remove('open');
    document.body.classList.remove('no-scroll');
  }

  /* ------------------------------ Cloud UI -------------------------------- */
  function fmtLastSync(ts) {
    if (!ts) return 'chưa đồng bộ';
    return U.fmt.datetime(ts);
  }

  function updateCloudUI(s) {
    const st = s || (MT.sync ? MT.sync.status() : {});
    const configured = Boolean(MT.remote && MT.remote.isConfigured());
    const signedIn = Boolean(MT.remote && MT.remote.isSignedIn());
    const pill = document.getElementById('syncPill');
    const text = document.getElementById('syncText');
    const banner = document.getElementById('cloudBanner');
    if (!pill || !text) return;

    let cls = 'local';
    let label = 'Cục bộ';
    if (configured) {
      if (!signedIn) {
        cls = 'off';
        label = st.pending ? 'Chờ đăng nhập (' + st.pending + ')' : 'Đăng nhập Supabase';
      } else if (st.running) {
        cls = 'syncing';
        label = 'Đang đồng bộ…';
      } else if (st.error) {
        cls = 'error';
        label = 'Lỗi đồng bộ';
      } else if (st.pending) {
        cls = 'off';
        label = 'Chờ đồng bộ (' + st.pending + ')';
      } else {
        cls = 'on';
        label = 'Đã đồng bộ';
      }
    }
    pill.className = 'sync-pill ' + cls;
    text.textContent = label;
    pill.title = !configured
      ? 'Chưa cấu hình Supabase — dữ liệu lưu cục bộ'
      : !signedIn
        ? 'Đăng nhập tài khoản quản trị để bật đồng bộ cloud'
        : 'Lần đồng bộ gần nhất: ' + fmtLastSync(st.lastSync);

    if (!banner) return;
    if (!configured) { banner.classList.add('hidden'); return; }
    let html = '';
    let danger = false;
    let action = null;
    if (!signedIn) {
      html = D.icon('globe', 17) + '<div class="grow"><strong>Chế độ cục bộ.</strong> Đăng nhập Supabase để thay đổi trên dashboard được tự động đẩy lên cloud và hiển thị trên các máy khác.</div><button class="btn btn-sm btn-primary" type="button" data-cloud-action="login">Đăng nhập</button>';
      action = 'login';
    } else if (st.error) {
      danger = true;
      html = D.icon('alert', 17) + '<div class="grow"><strong>Đồng bộ thất bại.</strong> ' + U.esc(st.error) + '</div><button class="btn btn-sm" type="button" data-cloud-action="retry">Thử lại</button><button class="btn btn-sm" type="button" data-cloud-action="settings">Cài đặt</button>';
      action = 'retry';
    } else if (st.pending) {
      html = D.icon('activity', 17) + '<div class="grow"><strong>' + st.pending + ' thay đổi chưa đồng bộ.</strong> Dữ liệu sẽ được đẩy lên Supabase trong giây lát.</div><button class="btn btn-sm btn-primary" type="button" data-cloud-action="sync">Đồng bộ ngay</button>';
      action = 'sync';
    } else {
      banner.classList.add('hidden');
      return;
    }
    banner.className = 'cloud-banner' + (danger ? ' danger' : '');
    banner.innerHTML = html;
    void action;
    const btn = banner.querySelector('[data-cloud-action]');
    if (btn) {
      btn.addEventListener('click', () => {
        const a = btn.dataset.cloudAction;
        if (a === 'login') D.openAdminLogin();
        else if (a === 'retry' || a === 'sync') MT.sync.flushNow().then(() => updateCloudUI());
        else if (a === 'settings') D.go('settings');
      });
    }
  }
  D.updateCloudUI = updateCloudUI;

  async function pullCloud(successMessage) {
    try {
      const res = await MT.remote.pull();
      if (MT.sync) MT.sync.markSynced();
      D.refresh();
      if (successMessage) {
        U.toast(successMessage + ' · ' + res.orders + ' đơn, ' + res.tasks + ' nhiệm vụ', 'success', { duration: 4200 });
      }
      updateCloudUI();
      return res;
    } catch (e) {
      if (MT.sync) MT.sync.setError(e.message);
      updateCloudUI();
      U.toast('Không tải được dữ liệu Supabase: ' + e.message, 'error', { duration: 6000 });
      throw e;
    }
  }

  async function afterAdminLogin() {
    updateCloudUI();
    if (MT.sync) MT.sync.refresh();
    const pending = MT.sync ? MT.sync.pendingCount() : 0;
    if (!pending) {
      try { await pullCloud('Đã tải dữ liệu mới nhất từ Supabase'); } catch (e) {}
      return;
    }
    D.modal({
      title: 'Đồng bộ dữ liệu sau khi đăng nhập',
      body: '<p style="font-size:.82rem;line-height:1.65">Bạn đang có <strong>' + pending + ' thay đổi cục bộ chưa đồng bộ</strong>. Bạn muốn đẩy các thay đổi này lên Supabase hay tải dữ liệu mới nhất từ cloud?</p>' +
        '<div class="alert-banner" style="margin:0">' + D.icon('alert', 16) + '<div>Tải từ cloud sẽ thay thế dữ liệu cục bộ hiện tại. Đẩy lên cloud sẽ ghi đè dữ liệu tương ứng trên cloud.</div></div>',
      footer: '<button class="btn" type="button" data-modal-close>Để sau</button>' +
        '<button class="btn" type="button" id="choosePull">Tải từ cloud</button>' +
        '<button class="btn btn-primary" type="button" id="choosePush">Đẩy cục bộ lên</button>',
      onMount(el, close) {
        el.querySelector('#choosePull').addEventListener('click', async () => {
          close();
          MT.sync.clearPending();
          try { await pullCloud('Đã tải dữ liệu mới nhất từ Supabase'); } catch (e) {}
        });
        el.querySelector('#choosePush').addEventListener('click', async () => {
          close();
          try {
            await MT.sync.flushNow();
            if (MT.sync.pendingCount()) throw new Error('Vẫn còn thay đổi chưa đẩy được. Kiểm tra quyền admin và kết nối.');
            U.toast('Đã đẩy thay đổi cục bộ lên Supabase', 'success');
          } catch (e) { U.toast(e.message, 'error', { duration: 6000 }); }
          updateCloudUI();
        });
      },
    });
  }

  D.openAdminLogin = function (opts) {
    const o = opts || {};
    if (!MT.remote || !MT.remote.isConfigured()) {
      U.toast('Chưa cấu hình Supabase. Hãy nhập Project URL và anon key trong Cài đặt.', 'error', { duration: 5000 });
      D.go('settings');
      return;
    }
    D.modal({
      title: 'Đăng nhập quản trị Supabase',
      body: '<div class="field"><label>Email quản trị</label><input class="input" id="adminEmail" type="email" value="' + U.esc(MT.config.admin.demoEmail) + '" autocomplete="username"></div>' +
        '<div class="field"><label>Mật khẩu</label><input class="input" id="adminPassword" type="password" placeholder="••••••••" autocomplete="current-password"></div>' +
        '<p style="font-size:.7rem;color:var(--db-muted);background:var(--db-line-soft);border-radius:8px;padding:.55rem .65rem">Tài khoản cần có <code>role = admin</code> trong bảng <code>profiles</code>. Sau khi đăng nhập, dashboard sẽ tự tải dữ liệu cloud và bật đồng bộ tự động.</p>',
      footer: '<button class="btn" type="button" data-modal-close>Huỷ</button><button class="btn btn-primary" type="button" id="adminLoginBtn">Đăng nhập</button>',
      onMount(el, close) {
        const submit = async () => {
          const email = el.querySelector('#adminEmail').value.trim();
          const pass = el.querySelector('#adminPassword').value;
          if (!email || !pass) { U.toast('Nhập email và mật khẩu', 'error'); return; }
          const btn = el.querySelector('#adminLoginBtn');
          btn.disabled = true; btn.textContent = 'Đang đăng nhập…';
          try {
            await MT.remote.signInAdmin(email, pass);
            close();
            U.toast('Đăng nhập quản trị thành công', 'success');
            if (MT.sync) MT.sync.refresh();
            updateCloudUI();
            if (o.onSuccess) o.onSuccess();
            else afterAdminLogin();
          } catch (e) {
            U.toast(e.message, 'error', { duration: 6000 });
            btn.disabled = false; btn.textContent = 'Đăng nhập';
          }
        };
        el.querySelector('#adminLoginBtn').addEventListener('click', submit);
        el.querySelector('#adminPassword').addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
        setTimeout(() => el.querySelector('#adminEmail').focus(), 60);
      },
    });
  };

  function openSyncPanel() {
    const s = MT.sync ? MT.sync.status() : {};
    const st = MT.remote.status();
    const account = st.signedIn ? U.esc(st.email || 'admin') : 'Chưa đăng nhập';
    D.modal({
      title: 'Đồng bộ Supabase',
      body: '<div class="drawer-meta" style="font-size:.76rem">' +
          '<div><span>Tài khoản</span><strong>' + account + '</strong></div>' +
          '<div><span>Vai trò</span><strong>' + (st.role === 'admin' ? 'Quản trị viên' : (st.role || '—')) + '</strong></div>' +
          '<div><span>Trạng thái</span><strong>' + (s.running ? 'Đang đồng bộ' : s.error ? 'Có lỗi' : s.pending ? 'Chờ đồng bộ' : 'Đã đồng bộ') + '</strong></div>' +
          '<div><span>Chờ đẩy</span><strong>' + (s.pending || 0) + ' thay đổi</strong></div>' +
          '<div><span>Lần cuối</span><strong>' + fmtLastSync(s.lastSync) + '</strong></div>' +
          '<div><span>Bucket bằng chứng</span><strong>' + U.esc(st.config.evidenceBucket || 'task-evidence') + '</strong></div>' +
        '</div>' +
        (s.error ? '<div class="alert-banner alert-banner--danger" style="margin-top:.8rem">' + D.icon('alert', 16) + '<div>' + U.esc(s.error) + '</div></div>' : '') +
        '<p style="font-size:.7rem;color:var(--db-muted);margin-top:.8rem">Thay đổi trên dashboard được tự động đẩy sau ~0,8 giây. Website và cổng thành viên tải dữ liệu mới khi mở trang hoặc qua realtime.</p>',
      footer: '<button class="btn" type="button" data-modal-close>Đóng</button>' +
        '<button class="btn" type="button" id="syncOpenSettings">Cài đặt</button>' +
        '<button class="btn" type="button" id="syncPull">Tải từ cloud</button>' +
        '<button class="btn btn-primary" type="button" id="syncNow">Đồng bộ ngay</button>',
      onMount(el, close) {
        el.querySelector('#syncNow').addEventListener('click', async () => {
          close();
          try {
            await MT.sync.flushNow();
            if (MT.sync.pendingCount()) throw new Error('Còn thay đổi chưa đẩy được.');
            U.toast('Đã đồng bộ lên Supabase', 'success');
          } catch (e) { U.toast(e.message, 'error', { duration: 5000 }); }
          updateCloudUI();
        });
        el.querySelector('#syncPull').addEventListener('click', async () => {
          close();
          const ok = await D.confirm({ title: 'Tải dữ liệu từ Supabase?', message: 'Dữ liệu cục bộ sẽ bị thay thế bằng dữ liệu cloud mới nhất.', confirmText: 'Tải về', danger: true });
          if (!ok) return;
          MT.sync.clearPending();
          try { await pullCloud('Đã tải dữ liệu từ Supabase'); } catch (e) {}
        });
        el.querySelector('#syncOpenSettings').addEventListener('click', () => { close(); D.go('settings'); });
      },
    });
  }

  async function cloudBootstrap() {
    updateCloudUI();
    if (!MT.remote || !MT.remote.isConfigured()) return;
    try {
      const session = await MT.remote.restoreSession();
      if (!session) { updateCloudUI(); return; }
      if (!MT.remote.isCurrentUserAdmin()) {
        await MT.remote.signOut();
        U.toast('Tài khoản này không có quyền quản trị dashboard.', 'error', { duration: 5000 });
        updateCloudUI();
        return;
      }
      if (MT.sync) MT.sync.refresh();
      updateCloudUI();
      await pullCloud('Đã đồng bộ dữ liệu từ Supabase');
    } catch (e) {
      console.warn('[cloud bootstrap]', e);
      if (MT.sync) MT.sync.setError(e.message);
      updateCloudUI();
    }
  }

  /* -------------------------------- Init ---------------------------------- */
  function bind() {
    $$('.side-link').forEach((btn) => btn.addEventListener('click', () => D.go(btn.dataset.view)));
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) menuToggle.addEventListener('click', openSidebar);
    const sideOverlay = document.getElementById('sidebarOverlay');
    if (sideOverlay) sideOverlay.addEventListener('click', closeSidebar);

    const range = document.getElementById('rangeSelect');
    if (range) {
      range.value = D.state.rangeKey;
      range.addEventListener('change', () => D.setRange(range.value));
    }

    const syncPill = document.getElementById('syncPill');
    if (syncPill) syncPill.addEventListener('click', () => {
      if (!MT.remote.isConfigured()) { D.go('settings'); return; }
      if (!MT.remote.isSignedIn()) { D.openAdminLogin(); return; }
      openSyncPanel();
    });

    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) profileBtn.addEventListener('click', async () => {
      if (!MT.remote.isConfigured()) { D.go('settings'); return; }
      if (!MT.remote.isSignedIn()) { D.openAdminLogin(); return; }
      const st = MT.remote.status();
      const ok = await D.confirm({
        title: 'Tài khoản quản trị',
        message: 'Đang đăng nhập: ' + (st.email || 'admin') + '. Bạn có muốn đăng xuất khỏi Supabase? Dữ liệu cục bộ vẫn được giữ lại.',
        confirmText: 'Đăng xuất', danger: true,
      });
      if (!ok) return;
      await MT.remote.signOut();
      if (MT.sync) MT.sync.refresh();
      updateCloudUI();
      U.toast('Đã đăng xuất khỏi Supabase', 'success');
    });

    const search = document.getElementById('globalSearch');
    if (search) {
      search.addEventListener('input', U.debounce(() => renderSearch(search.value), 120));
      search.addEventListener('focus', () => { if (search.value.trim()) renderSearch(search.value); });
      search.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { search.blur(); document.getElementById('searchDropdown').classList.add('hidden'); }
        if (e.key === 'Enter') {
          const first = document.querySelector('#searchDropdown [data-search-order], #searchDropdown [data-search-product], #searchDropdown [data-search-task], #searchDropdown [data-search-member]');
          if (first) first.click();
        }
      });
    }

    document.addEventListener('click', (e) => {
      const dd = document.getElementById('searchDropdown');
      if (dd && !e.target.closest('.topbar-search')) dd.classList.add('hidden');
      const pop = document.getElementById('notifPopover');
      if (pop && !e.target.closest('#notifBtn') && !e.target.closest('#notifPopover')) pop.classList.add('hidden');
    });

    const notif = document.getElementById('notifBtn');
    if (notif) notif.addEventListener('click', showNotif);

    const overlay = document.getElementById('drawerOverlay');
    if (overlay) overlay.addEventListener('click', () => { if (D.closeDrawer) D.closeDrawer(); });

    window.addEventListener('hashchange', () => {
      if (D.closeModal) { D.closeModal(); D.closeModal = null; }
      if (D.closeDrawer) { D.closeDrawer(); D.closeDrawer = null; }
      const name = location.hash.slice(1);
      if (D.views[name] && name !== D.state.view) {
        D.state.view = name;
        render();
      } else if (D.views[name]) {
        render();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const dd = document.getElementById('searchDropdown');
        if (dd) dd.classList.add('hidden');
        const pop = document.getElementById('notifPopover');
        if (pop) pop.classList.add('hidden');
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (search) search.focus();
      }
    });

    MT.bus.on('db:change', () => { refreshCounts(); refreshNotifications(); });
    MT.bus.on('db:reset', () => D.refresh());
    MT.bus.on('db:external', () => D.refresh());
  }

  function init() {
    const hash = location.hash.slice(1);
    if (D.views[hash]) D.state.view = hash;
    if (MT.sync) {
      MT.sync.init();
      MT.sync.onChange(updateCloudUI);
    }
    bind();
    render();
    refreshNotifications();
    updateCloudUI();
    // Đồng bộ khi tab khác thay đổi dữ liệu
    window.addEventListener('storage', U.debounce(() => D.refresh(), 400));
    cloudBootstrap();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
