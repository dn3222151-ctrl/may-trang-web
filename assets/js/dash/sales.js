/* ==========================================================================
   MÂY TRẮNG – Dashboard: Đơn hàng & Sản phẩm
   ========================================================================== */
(function () {
  const MT = window.MT;
  const D = MT.dash;
  const U = MT.util;

  const S = (D.sales = {
    orderPage: 1,
    orderSearch: '',
    orderStatus: 'all',
    orderChannel: 'all',
    orderSize: 12,
    productSearch: '',
    productCat: 'all',
    productStock: 'all',
  });

  /* ================================ ORDERS ================================= */
  function orderList() {
    let list = D.orders().slice();
    if (S.orderSearch) {
      const q = U.normalize(S.orderSearch);
      const digits = S.orderSearch.replace(/\D/g, '');
      list = list.filter((o) =>
        o.code.toLowerCase().includes(q) ||
        U.normalize(o.customer.name).includes(q) ||
        (digits && o.customer.phone.replace(/\D/g, '').includes(digits)) ||
        (o.customer.email && U.normalize(o.customer.email).includes(q))
      );
    }
    if (S.orderStatus !== 'all') list = list.filter((o) => o.status === S.orderStatus);
    if (S.orderChannel !== 'all') list = list.filter((o) => o.channel === S.orderChannel);
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  function ordersTable() {
    const all = orderList();
    const totalPages = Math.max(1, Math.ceil(all.length / S.orderSize));
    if (S.orderPage > totalPages) S.orderPage = totalPages;
    const start = (S.orderPage - 1) * S.orderSize;
    const rows = all.slice(start, start + S.orderSize);
    return {
      rows: rows.length ? rows.map((o) =>
        '<tr class="clickable" data-order-id="' + o.id + '">' +
          '<td><strong>' + U.esc(o.code) + '</strong><div style="font-size:.64rem;color:var(--db-muted)">' + U.fmt.datetime(o.createdAt) + '</div></td>' +
          '<td><div class="table-user"><span class="avatar avatar--sm" style="background:' + ((MT.meta.channels[o.channel] || {}).color || '#64748B') + '">' + U.initials(o.customer.name) + '</span>' +
            '<div><strong>' + U.esc(o.customer.name) + '</strong><span>' + U.esc(o.customer.phone) + ' · ' + U.esc(o.customer.province) + '</span></div></div></td>' +
          '<td><span class="badge badge-gray no-dot">' + U.esc((MT.meta.channels[o.channel] || {}).short || o.channel) + '</span></td>' +
          '<td class="num">' + o.items.reduce((s, x) => s + x.qty, 0) + '</td>' +
          '<td class="num"><strong>' + D.money(o.total) + '</strong></td>' +
          '<td>' + D.paymentBadge(o.paymentStatus) + '</td>' +
          '<td>' + D.statusBadge(o.status) + '</td>' +
          '<td><div class="table-actions"><button class="btn btn-sm btn-icon" type="button" data-open-order="' + o.id + '" title="Xem chi tiết">' + D.icon('eye', 14) + '</button></div></td>' +
        '</tr>').join('') : '<tr><td colspan="8"><div class="empty-state">' + D.icon('box', 30) + '<h3>Không có đơn hàng phù hợp</h3><p>Thử đổi bộ lọc hoặc khoảng thời gian.</p></div></td></tr>',
      total: all.length,
      page: S.orderPage,
      totalPages,
      start,
      html: '',
    };
  }

  function ordersTableHtml() {
    const t = ordersTable();
    return '<div class="table-wrap"><table><thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Kênh</th><th class="num">SL</th><th class="num">Giá trị</th><th>Thanh toán</th><th>Trạng thái</th><th></th></tr></thead><tbody>' + t.rows + '</tbody></table></div>' +
      '<div class="table-footer"><span>Hiển thị ' + (t.total ? t.start + 1 : 0) + '–' + Math.min(t.start + S.orderSize, t.total) + ' / ' + t.total + ' đơn</span>' +
      '<div class="pager">' +
        '<button type="button" data-page="prev" ' + (t.page <= 1 ? 'disabled' : '') + '>‹</button>' +
        Array.from({ length: Math.min(5, t.totalPages) }, (_, i) => {
          let p = t.page - 2 + i;
          if (p < 1) p = i + 1;
          if (p > t.totalPages) p = t.totalPages - (4 - i);
          if (p < 1) return '';
          return '<button type="button" data-page="' + p + '" class="' + (p === t.page ? 'active' : '') + '">' + p + '</button>';
        }).join('') +
        '<button type="button" data-page="next" ' + (t.page >= t.totalPages ? 'disabled' : '') + '>›</button>' +
      '</div></div>';
  }

  function refreshOrdersTable() {
    const host = document.getElementById('ordersTableHost');
    if (!host) return;
    host.innerHTML = ordersTableHtml();
    bindOrderTable(host);
  }

  function bindOrderTable(root) {
    root.querySelectorAll('[data-order-id]').forEach((row) => row.addEventListener('click', (e) => {
      if (e.target.closest('[data-open-order]')) return;
      D.openOrder(row.dataset.orderId);
    }));
    root.querySelectorAll('[data-open-order]').forEach((btn) => btn.addEventListener('click', (e) => {
      e.stopPropagation();
      D.openOrder(btn.dataset.openOrder);
    }));
    root.querySelectorAll('[data-page]').forEach((btn) => btn.addEventListener('click', () => {
      const p = btn.dataset.page;
      const total = Math.max(1, Math.ceil(orderList().length / S.orderSize));
      if (p === 'prev') S.orderPage = Math.max(1, S.orderPage - 1);
      else if (p === 'next') S.orderPage = Math.min(total, S.orderPage + 1);
      else S.orderPage = Number(p);
      refreshOrdersTable();
    }));
  }

  function exportOrders() {
    const rows = [['Mã đơn', 'Ngày', 'Khách hàng', 'Điện thoại', 'Tỉnh/Thành', 'Kênh', 'Số món', 'Tạm tính', 'Giảm giá', 'Ship', 'Tổng', 'Thanh toán', 'Trạng thái']];
    orderList().forEach((o) => rows.push([
      o.code, U.fmt.datetime(o.createdAt), o.customer.name, o.customer.phone, o.customer.province,
      (MT.meta.channels[o.channel] || {}).label || o.channel, o.items.length,
      o.subtotal, o.discount, o.shippingFee, o.total,
      (MT.meta.paymentStatus[o.paymentStatus] || {}).label || o.paymentStatus,
      (MT.meta.orderStatus[o.status] || {}).label || o.status,
    ]));
    D.exportCsv('maytrang-don-hang-' + U.todayISO() + '.csv', rows);
  }

  function openOrder(id) {
    const order = (MT.db.data.orders || []).find((o) => o.id === id || o.code === id);
    if (!order) { D.toast('Không tìm thấy đơn hàng', 'error'); return; }
    const next = MT.db.nextStatuses(order);
    const timeline = (order.timeline || []).slice().sort((a, b) => new Date(a.at) - new Date(b.at));
    const body =
      '<div class="drawer-section"><div style="display:flex;justify-content:space-between;gap:.6rem;align-items:flex-start;flex-wrap:wrap">' +
        '<div><div style="font-size:.7rem;color:var(--db-muted)">Mã đơn</div><div style="font-size:1.15rem;font-weight:700;letter-spacing:.02em">' + U.esc(order.code) + '</div>' +
        '<div style="font-size:.7rem;color:var(--db-muted);margin-top:.15rem">' + U.fmt.datetime(order.createdAt) + ' · ' + U.esc((MT.meta.channels[order.channel] || {}).label || order.channel) + '</div></div>' +
        '<div style="display:flex;gap:.35rem;flex-wrap:wrap">' + D.statusBadge(order.status) + D.paymentBadge(order.paymentStatus) + '</div></div></div>' +

      '<div class="drawer-section"><h4>Khách hàng &amp; giao hàng</h4><div class="drawer-meta">' +
        '<div><span>Người nhận</span><strong>' + U.esc(order.customer.name) + '</strong></div>' +
        '<div><span>Điện thoại</span><strong>' + U.esc(U.fmt.phone(order.customer.phone)) + '</strong></div>' +
        '<div><span>Email</span><strong>' + U.esc(order.customer.email || '—') + '</strong></div>' +
        '<div><span>Tỉnh / Thành phố</span><strong>' + U.esc(order.customer.province) + '</strong></div>' +
        '<div style="grid-column:1/-1"><span>Địa chỉ</span><strong>' + U.esc(order.customer.address) + '</strong></div>' +
        '<div><span>Vận chuyển</span><strong>' + (order.shippingMethod === 'pickup' ? 'Nhận tại showroom' : order.shippingMethod === 'express' ? 'Giao nhanh' : 'Tiêu chuẩn') + '</strong></div>' +
        '<div><span>Ghi chú</span><strong>' + U.esc(order.customer.note || '—') + '</strong></div>' +
      '</div></div>' +

      '<div class="drawer-section"><h4>Sản phẩm (' + order.items.length + ')</h4>' +
        '<div class="table-wrap"><table><tbody>' + order.items.map((it) =>
          '<tr><td><div class="table-product"><img src="' + U.esc(it.image || U.placeholder(it.name)) + '" alt="" data-fallback><div><strong>' + U.esc(it.name) + '</strong><span>' + U.esc(it.variant || '') + ' · ' + D.money(it.price) + '</span></div></div></td>' +
          '<td class="num">×' + it.qty + '</td><td class="num"><strong>' + D.money(it.price * it.qty) + '</strong></td></tr>').join('') +
        '</tbody></table></div>' +
        '<div style="margin-top:.7rem;padding-top:.6rem;border-top:1px solid var(--db-line);font-size:.78rem">' +
          '<div class="summary-line" style="display:flex;justify-content:space-between;margin-bottom:.3rem"><span>Tạm tính</span><strong>' + D.money(order.subtotal) + '</strong></div>' +
          (order.discount ? '<div style="display:flex;justify-content:space-between;margin-bottom:.3rem;color:var(--db-success)"><span>Giảm giá' + (order.couponCode ? ' (' + U.esc(order.couponCode) + ')' : '') + '</span><strong>−' + D.money(order.discount) + '</strong></div>' : '') +
          '<div style="display:flex;justify-content:space-between;margin-bottom:.3rem"><span>Vận chuyển</span><strong>' + D.money(order.shippingFee) + '</strong></div>' +
          '<div style="display:flex;justify-content:space-between;padding-top:.4rem;border-top:1px solid var(--db-line);font-size:1rem"><span>Tổng cộng</span><strong>' + D.money(order.total) + '</strong></div>' +
        '</div></div>' +

      '<div class="drawer-section"><h4>Thanh toán</h4><div class="drawer-meta">' +
        '<div><span>Phương thức</span><strong>' + U.esc((MT.meta.paymentMethods[order.paymentMethod] || {}).label || order.paymentMethod) + '</strong></div>' +
        '<div><span>Trạng thái</span><strong>' + U.esc((MT.meta.paymentStatus[order.paymentStatus] || {}).label || '') + '</strong></div>' +
      '</div>' + (order.paymentMethod === 'bank' && order.paymentStatus === 'unpaid' ?
        '<button class="btn btn-sm btn-primary" type="button" data-mark-paid style="margin-top:.6rem">' + D.icon('check', 13) + ' Ghi nhận đã thanh toán</button>' : '') + '</div>' +

      '<div class="drawer-section"><h4>Lịch sử đơn hàng</h4><div class="timeline">' + timeline.map((ev, i) =>
        '<div class="timeline__step ' + (i < timeline.length - 1 ? 'done' : 'current') + '" style="display:flex;gap:.6rem;padding-bottom:.8rem;position:relative">' +
        '<span style="width:10px;height:10px;border-radius:50%;background:' + (i < timeline.length - 1 ? 'var(--db-success)' : 'var(--db-primary)') + ';margin-top:.25rem;flex:none"></span>' +
        '<div><strong style="font-size:.74rem">' + U.esc(ev.label) + '</strong><div style="font-size:.64rem;color:var(--db-muted)">' + U.fmt.datetime(ev.at) + (ev.note ? ' · ' + U.esc(ev.note) : '') + '</div></div></div>'
      ).join('') + '</div></div>';

    const footer = '<div style="display:flex;gap:.4rem;flex-wrap:wrap">' +
      '<button class="btn btn-sm" type="button" data-print-order>' + D.icon('printer', 13) + ' In hoá đơn</button>' +
      '<button class="btn btn-sm" type="button" data-copy-order="' + U.esc(order.code) + '">' + D.icon('copy', 13) + ' Sao chép mã</button>' +
      '</div><div style="display:flex;gap:.4rem;flex-wrap:wrap">' +
      (order.paymentStatus === 'unpaid' && order.paymentMethod === 'bank' ? '<button class="btn btn-sm" type="button" data-mark-paid>Đã thu tiền</button>' : '') +
      (order.status === 'pending' || order.status === 'confirmed' || order.status === 'packing' ? '<button class="btn btn-sm btn-danger" type="button" data-cancel-order>Huỷ đơn</button>' : '') +
      (next.filter((x) => x !== 'cancelled').map((st) => {
        const label = st === 'completed' ? 'Hoàn tất đơn' : 'Chuyển: ' + (MT.meta.orderStatus[st] || {}).label;
        return '<button class="btn btn-sm btn-primary" type="button" data-next-status="' + st + '">' + label + '</button>';
      }).join('')) +
      '</div>';

    D.drawer({
      title: 'Chi tiết đơn hàng',
      body,
      footer,
      onMount(el, close) {
        el.querySelectorAll('[data-next-status]').forEach((btn) => btn.addEventListener('click', async () => {
          const st = btn.dataset.nextStatus;
          if (st === 'completed') {
            const ok = await D.confirm({ title: 'Hoàn tất đơn hàng?', message: 'Xác nhận đơn ' + order.code + ' đã giao thành công đến khách.', confirmText: 'Hoàn tất' });
            if (!ok) return;
          }
          try {
            MT.db.setOrderStatus(order.id, st);
            D.toast('Đã cập nhật: ' + (MT.meta.orderStatus[st] || {}).label, 'success');
            close(); D.refresh();
          } catch (e) { D.toast(e.message, 'error'); }
        }));
        el.querySelectorAll('[data-cancel-order]').forEach((btn) => btn.addEventListener('click', async () => {
          const ok = await D.confirm({ title: 'Huỷ đơn ' + order.code + '?', message: 'Đơn sẽ được huỷ, tồn kho được hoàn lại và khách hàng cần được thông báo.', confirmText: 'Huỷ đơn', danger: true });
          if (!ok) return;
          try {
            MT.db.setOrderStatus(order.id, 'cancelled', 'Huỷ bởi quản trị viên');
            D.toast('Đã huỷ đơn hàng', 'success');
            close(); D.refresh();
          } catch (e) { D.toast(e.message, 'error'); }
        }));
        el.querySelectorAll('[data-mark-paid]').forEach((btn) => btn.addEventListener('click', () => {
          try { MT.db.markPaid(order.id); D.toast('Đã ghi nhận thanh toán', 'success'); close(); D.refresh(); }
          catch (e) { D.toast(e.message, 'error'); }
        }));
        el.querySelectorAll('[data-print-order]').forEach((btn) => btn.addEventListener('click', () => D.printInvoice(order)));
        el.querySelectorAll('[data-copy-order]').forEach((btn) => btn.addEventListener('click', () => D.copy(btn.dataset.copyOrder)));
      },
    });
  }
  D.openOrder = openOrder;

  D.register('orders', {
    title: 'Quản lý đơn hàng',
    crumb: 'Mây Trắng · Kinh doanh',
    render() {
      const orders = orderList();
      const s = MT.finance.summarize(orders, D.range().days);
      const pending = orders.filter((o) => o.status === 'pending').length;
      const completed = orders.filter((o) => o.status === 'completed').length;
      return '' +
        '<div class="stat-strip">' +
          '<div class="stat"><span>Đơn trong kỳ</span><strong>' + U.fmt.num(orders.length) + ' <small>đơn</small></strong></div>' +
          '<div class="stat"><span>Chờ xác nhận</span><strong style="color:var(--db-warn)">' + pending + '</strong></div>' +
          '<div class="stat"><span>Đã hoàn tất</span><strong style="color:var(--db-success)">' + completed + '</strong></div>' +
          '<div class="stat"><span>Doanh thu ghi nhận</span><strong>' + D.money(s.netRevenue) + '</strong></div>' +
        '</div>' +
        '<div class="card card--flush"><div class="card__head"><div><div class="card__title">Danh sách đơn hàng</div><div class="card__sub">' + D.esc(D.rangeLabel()) + ' · ' + orders.length + ' đơn</div></div>' +
          '<div class="card__actions">' +
            '<div class="toolbar"><div class="search">' + D.icon('search', 14) + '<input class="input" id="orderSearch" placeholder="Mã đơn, tên, SĐT…" value="' + U.esc(S.orderSearch) + '"></div>' +
            '<select class="select" id="orderStatusFilter">' +
              '<option value="all">Mọi trạng thái</option>' +
              Object.keys(MT.meta.orderStatus).map((k) => '<option value="' + k + '" ' + (S.orderStatus === k ? 'selected' : '') + '>' + MT.meta.orderStatus[k].label + '</option>').join('') +
            '</select>' +
            '<select class="select" id="orderChannelFilter"><option value="all">Mọi kênh</option>' +
              Object.keys(MT.meta.channels).map((k) => '<option value="' + k + '" ' + (S.orderChannel === k ? 'selected' : '') + '>' + MT.meta.channels[k].short + '</option>').join('') +
            '</select>' +
            '<button class="btn btn-sm" type="button" id="exportOrders">' + D.icon('download', 13) + ' Xuất CSV</button></div>' +
          '</div></div>' +
          '<div id="ordersTableHost">' + ordersTableHtml() + '</div>' +
        '</div>';
    },
    mount() {
      const host = document.getElementById('ordersTableHost');
      if (host) bindOrderTable(host);
      const search = document.getElementById('orderSearch');
      if (search) {
        search.addEventListener('input', U.debounce(() => { S.orderSearch = search.value; S.orderPage = 1; refreshOrdersTable(); }, 200));
        search.addEventListener('keydown', (e) => { if (e.key === 'Enter') { S.orderSearch = search.value; refreshOrdersTable(); } });
      }
      const st = document.getElementById('orderStatusFilter');
      if (st) st.addEventListener('change', () => { S.orderStatus = st.value; S.orderPage = 1; refreshOrdersTable(); });
      const ch = document.getElementById('orderChannelFilter');
      if (ch) ch.addEventListener('change', () => { S.orderChannel = ch.value; S.orderPage = 1; refreshOrdersTable(); });
      const ex = document.getElementById('exportOrders');
      if (ex) ex.addEventListener('click', exportOrders);
    },
  });
  D.openOrders = () => D.go('orders');

  /* ================================ PRODUCTS =============================== */
  function productList() {
    let list = MT.products.all({ includeInactive: true });
    if (S.productSearch) {
      const q = U.normalize(S.productSearch);
      list = list.filter((p) => U.normalize(p.name + ' ' + p.sku + ' ' + MT.catalog.catName(p.cat)).includes(q));
    }
    if (S.productCat !== 'all') list = list.filter((p) => p.cat === S.productCat);
    if (S.productStock === 'low') list = list.filter((p) => p.active !== false && p.stock > 0 && p.stock <= 10);
    else if (S.productStock === 'out') list = list.filter((p) => p.active !== false && p.stock <= 0);
    else if (S.productStock === 'inactive') list = list.filter((p) => p.active === false);
    return list;
  }

  function productsRows() {
    const list = productList();
    const rows = list.map((p) => {
      const margin = p.price ? ((p.price - p.cost) / p.price) * 100 : 0;
      const stockCls = p.stock <= 0 ? 'badge-danger' : p.stock <= 10 ? 'badge-warn' : 'badge-success';
      return '<tr>' +
        '<td><div class="table-product"><img src="' + U.esc(p.images[0]) + '" alt="" data-fallback><div><strong>' + U.esc(p.name) + '</strong><span>' + U.esc(p.sku) + ' · ' + U.esc(MT.catalog.catName(p.cat)) + '</span></div></div></td>' +
        '<td class="num">' + D.money(p.price) + (p.compareAt > p.price ? '<div style="font-size:.62rem;color:var(--db-muted);text-decoration:line-through">' + D.money(p.compareAt) + '</div>' : '') + '</td>' +
        '<td class="num">' + D.money(p.cost) + '</td>' +
        '<td class="num"><strong style="color:' + (margin >= 50 ? 'var(--db-success)' : margin >= 30 ? 'var(--db-ink)' : 'var(--db-warn)') + '">' + U.fmt.pct(margin, 0) + '</strong></td>' +
        '<td style="min-width:120px"><div style="display:flex;align-items:center;gap:.35rem"><button class="btn btn-xs btn-icon" type="button" data-stock="' + p.id + '|-1" title="Giảm 1">−</button>' +
          '<span class="badge ' + stockCls + ' no-dot" style="min-width:52px;justify-content:center">' + U.fmt.num(p.stock) + '</span>' +
          '<button class="btn btn-xs btn-icon" type="button" data-stock="' + p.id + '|1" title="Tăng 1">+</button></div></td>' +
        '<td>' + (p.active === false ? '<span class="badge badge-gray">Ngừng bán</span>' : '<span class="badge badge-success">Đang bán</span>') + '</td>' +
        '<td><div class="table-actions"><button class="btn btn-sm btn-icon" type="button" data-edit-product="' + p.id + '" title="Sửa">' + D.icon('edit', 13) + '</button>' +
          '<button class="btn btn-sm btn-icon" type="button" data-delete-product="' + p.id + '" title="' + (p.active === false ? 'Bán lại' : 'Ngừng bán') + '">' + D.icon(p.active === false ? 'refresh' : 'trash', 13) + '</button></div></td>' +
      '</tr>';
    }).join('');
    return rows || '<tr><td colspan="7"><div class="empty-state">' + D.icon('grid', 30) + '<h3>Không có sản phẩm phù hợp</h3><p>Thử đổi bộ lọc hoặc thêm sản phẩm mới.</p></div></td></tr>';
  }

  function refreshProductsStats() {
    const host = document.getElementById('productsStats');
    if (!host) return;
    const all = MT.products.all({ includeInactive: true });
    const active = all.filter((p) => p.active !== false);
    host.innerHTML = productStats(all, active);
  }

  function productStats(all, active) {
    const units = U.sum(active, (p) => p.stock);
    const invValue = U.sum(active, (p) => p.stock * p.cost);
    const potential = U.sum(active, (p) => p.stock * p.price);
    return '<div class="stat"><span>Tổng SKU</span><strong>' + all.length + ' <small>sản phẩm</small></strong></div>' +
      '<div class="stat"><span>Đang bán</span><strong>' + active.length + ' <small>SKU</small></strong></div>' +
      '<div class="stat"><span>Tồn kho</span><strong>' + U.fmt.num(units) + ' <small>đơn vị</small></strong><span style="margin-top:.15rem">Giá vốn ' + D.money(invValue) + '</span></div>' +
      '<div class="stat"><span>Giá trị bán được</span><strong>' + D.money(potential) + '</strong><span style="margin-top:.15rem">Nếu bán hết tồn kho</span></div>';
  }

  function refreshProductsTable() {
    const body = document.getElementById('productsTableBody');
    if (body) { body.innerHTML = productsRows(); bindProductsBody(body); }
    const count = document.getElementById('productsCount');
    if (count) count.textContent = productList().length + ' sản phẩm';
    refreshProductsStats();
  }

  function bindProductsBody(root) {
    root.querySelectorAll('[data-edit-product]').forEach((btn) => btn.addEventListener('click', () => D.openProductForm(btn.dataset.editProduct)));
    root.querySelectorAll('[data-delete-product]').forEach((btn) => btn.addEventListener('click', () => toggleProduct(btn.dataset.deleteProduct)));
    root.querySelectorAll('[data-stock]').forEach((btn) => btn.addEventListener('click', () => {
      const [id, delta] = btn.dataset.stock.split('|');
      MT.products.adjustStock(id, Number(delta));
      refreshProductsTable();
    }));
  }

  async function toggleProduct(id) {
    const p = MT.products.get(id);
    if (!p) return;
    if (p.active === false) {
      try { MT.products.save(id, { active: true }); D.toast('Đã bán lại ' + p.name, 'success'); refreshProductsTable(); }
      catch (e) { D.toast(e.message, 'error'); }
      return;
    }
    const ok = await D.confirm({
      title: 'Ngừng bán sản phẩm?',
      message: '“' + p.name + '” sẽ bị ẩn khỏi website. Bạn có thể bán lại bất cứ lúc nào. Lịch sử đơn hàng được giữ nguyên.',
      confirmText: 'Ngừng bán', danger: true,
    });
    if (!ok) return;
    try {
      MT.products.remove(id);
      D.toast('Đã ngừng bán sản phẩm', 'success');
      D.refresh();
    } catch (e) { D.toast(e.message, 'error'); }
  }

  D.openProductForm = function (id) {
    const p = id ? MT.products.get(id) : null;
    const isNew = !p;
    const cats = MT.catalog.categories.filter((c) => c.id !== 'all');
    const body =
      '<div class="form-section"><div class="form-section__title">Thông tin cơ bản</div>' +
        '<div class="field"><label>Tên sản phẩm <span class="req">*</span></label><input class="input" id="pfName" value="' + U.esc(p ? p.name : '') + '" placeholder="Ví dụ: Kem dưỡng ẩm sen hồng"><span class="field-error">Vui lòng nhập tên sản phẩm.</span></div>' +
        '<div class="field-row">' +
          '<div class="field"><label>Danh mục</label><select class="select" id="pfCat">' + cats.map((c) => '<option value="' + c.id + '" ' + (p && p.cat === c.id ? 'selected' : '') + '>' + c.name + '</option>').join('') + '</select></div>' +
          '<div class="field"><label>Dung tích / quy cách</label><input class="input" id="pfVolume" value="' + U.esc(p ? p.volume : '') + '" placeholder="50ml"></div>' +
        '</div>' +
        '<div class="field"><label>Mô tả ngắn</label><input class="input" id="pfShort" value="' + U.esc(p ? p.short : '') + '" placeholder="Một câu mô tả nổi bật"></div>' +
        '<div class="field"><label>Nhãn hiển thị</label><input class="input" id="pfBadge" value="' + U.esc(p ? p.badge : '') + '" placeholder="Bán chạy, Mới…"></div>' +
        '<div class="field"><label>Đường dẫn ảnh</label><input class="input" id="pfImage" value="' + U.esc(p ? p.images[0] : '') + '" placeholder="assets/img/products/sp-001-a.svg"><span class="field-hint">Có thể dán URL ảnh hoặc đường dẫn file trong dự án.</span></div>' +
      '</div>' +
      '<div class="form-section"><div class="form-section__title">Giá &amp; tồn kho</div>' +
        '<div class="field-row field-row--3">' +
          '<div class="field"><label>Giá bán <span class="req">*</span></label><input class="input" id="pfPrice" type="number" min="0" step="1000" value="' + (p ? p.price : 0) + '"><span class="field-error">Giá bán phải lớn hơn 0.</span></div>' +
          '<div class="field"><label>Giá niêm yết</label><input class="input" id="pfCompare" type="number" min="0" step="1000" value="' + (p ? p.compareAt : 0) + '"></div>' +
          '<div class="field"><label>Giá vốn <span class="req">*</span></label><input class="input" id="pfCost" type="number" min="0" step="1000" value="' + (p ? p.cost : 0) + '"><span class="field-error">Giá vốn không hợp lệ.</span></div>' +
        '</div>' +
        '<div class="field-row">' +
          '<div class="field"><label>Tồn kho</label><input class="input" id="pfStock" type="number" min="0" step="1" value="' + (p ? p.stock : 0) + '"></div>' +
          '<div class="field"><label>Biên lợi nhuận dự kiến</label><div id="pfMargin" style="height:38px;display:flex;align-items:center;font-weight:700;color:var(--db-success)">—</div></div>' +
        '</div>' +
        '<label class="check"><input type="checkbox" id="pfActive" ' + (!p || p.active !== false ? 'checked' : '') + '> Đang bán trên website</label>' +
      '</div>' +
      (isNew ? '<div class="form-section"><div class="form-section__title">Mô tả chi tiết</div><div class="field"><label>Mô tả (HTML hoặc văn bản)</label><textarea class="textarea" id="pfDesc" rows="4" placeholder="<p>Mô tả sản phẩm…</p>"></textarea></div></div>' : '');

    const modal = D.modal({
      title: isNew ? 'Thêm sản phẩm mới' : 'Chỉnh sửa sản phẩm',
      size: 'lg',
      body,
      footer: '<button class="btn" type="button" data-modal-close>Huỷ</button><button class="btn btn-primary" type="button" id="pfSubmit">' + (isNew ? 'Tạo sản phẩm' : 'Lưu thay đổi') + '</button>',
      onMount(el, close) {
        const price = el.querySelector('#pfPrice');
        const cost = el.querySelector('#pfCost');
        const margin = el.querySelector('#pfMargin');
        const calc = () => {
          const p = Number(price.value) || 0, c = Number(cost.value) || 0;
          const m = p ? ((p - c) / p) * 100 : 0;
          margin.textContent = p ? U.fmt.pct(m) + ' · lãi ' + D.money(p - c) : '—';
          margin.style.color = m >= 40 ? 'var(--db-success)' : m >= 20 ? 'var(--db-warn)' : 'var(--db-danger)';
        };
        price.addEventListener('input', calc);
        cost.addEventListener('input', calc);
        calc();
        el.querySelector('#pfSubmit').addEventListener('click', () => {
          const name = el.querySelector('#pfName');
          const priceEl = el.querySelector('#pfPrice');
          const costEl = el.querySelector('#pfCost');
          let ok = true;
          [name.closest('.field'), priceEl.closest('.field'), costEl.closest('.field')].forEach((f) => f.classList.remove('invalid'));
          if (!name.value.trim()) { name.closest('.field').classList.add('invalid'); ok = false; }
          if (Number(priceEl.value) <= 0) { priceEl.closest('.field').classList.add('invalid'); ok = false; }
          if (Number(costEl.value) < 0) { costEl.closest('.field').classList.add('invalid'); ok = false; }
          if (!ok) return;
          const img = el.querySelector('#pfImage').value.trim();
          const data = {
            name: name.value.trim(),
            cat: el.querySelector('#pfCat').value,
            volume: el.querySelector('#pfVolume').value.trim(),
            short: el.querySelector('#pfShort').value.trim(),
            badge: el.querySelector('#pfBadge').value.trim(),
            price: Math.max(0, Math.round(Number(priceEl.value) || 0)),
            compareAt: Math.max(0, Math.round(Number(el.querySelector('#pfCompare').value) || 0)),
            cost: Math.max(0, Math.round(Number(costEl.value) || 0)),
            stock: Math.max(0, Math.round(Number(el.querySelector('#pfStock').value) || 0)),
            active: el.querySelector('#pfActive').checked,
            images: img ? [img] : (p && p.images.length ? p.images : [U.placeholder(name.value)]),
          };
          if (isNew) data.description = el.querySelector('#pfDesc').value.trim() || '<p>' + U.esc(data.short || data.name) + '</p>';
          try {
            MT.products.save(id || null, data);
            D.toast(isNew ? 'Đã thêm sản phẩm mới' : 'Đã cập nhật sản phẩm', 'success');
            close();
            D.refresh();
          } catch (e) { D.toast(e.message, 'error'); }
        });
      },
    });
    return modal;
  };

  D.register('products', {
    title: 'Sản phẩm & kho hàng',
    crumb: 'Mây Trắng · Kinh doanh',
    render() {
      const all = MT.products.all({ includeInactive: true });
      const active = all.filter((p) => p.active !== false);
      return '' +
        '<div class="stat-strip" id="productsStats">' + productStats(all, active) + '</div>' +
        '<div class="card card--flush"><div class="card__head"><div><div class="card__title">Danh mục sản phẩm <span class="text-muted" style="font-weight:500;font-size:.72rem" id="productsCount">' + all.length + ' sản phẩm</span></div><div class="card__sub">Giá, tồn kho và biên lợi nhuận từng SKU</div></div>' +
          '<div class="card__actions"><div class="toolbar">' +
            '<div class="search">' + D.icon('search', 14) + '<input class="input" id="productSearch" placeholder="Tên hoặc SKU…" value="' + U.esc(S.productSearch) + '"></div>' +
            '<select class="select" id="productCatFilter"><option value="all">Mọi danh mục</option>' +
              MT.catalog.categories.filter((c) => c.id !== 'all').map((c) => '<option value="' + c.id + '" ' + (S.productCat === c.id ? 'selected' : '') + '>' + c.name + '</option>').join('') + '</select>' +
            '<select class="select" id="productStockFilter">' +
              '<option value="all">Mọi tồn kho</option><option value="low" ' + (S.productStock === 'low' ? 'selected' : '') + '>Sắp hết (≤10)</option>' +
              '<option value="out" ' + (S.productStock === 'out' ? 'selected' : '') + '>Hết hàng</option>' +
              '<option value="inactive" ' + (S.productStock === 'inactive' ? 'selected' : '') + '>Ngừng bán</option></select>' +
            '<button class="btn btn-primary btn-sm" type="button" id="addProduct">' + D.icon('plus', 14) + ' Thêm sản phẩm</button>' +
          '</div></div></div>' +
          '<div class="table-wrap"><table><thead><tr><th>Sản phẩm</th><th class="num">Giá bán</th><th class="num">Giá vốn</th><th class="num">Biên LN</th><th>Tồn kho</th><th>Trạng thái</th><th></th></tr></thead>' +
          '<tbody id="productsTableBody">' + productsRows() + '</tbody></table></div>' +
        '</div>';
    },
    mount() {
      const body = document.getElementById('productsTableBody');
      if (body) bindProductsBody(body);
      const search = document.getElementById('productSearch');
      if (search) search.addEventListener('input', U.debounce(() => { S.productSearch = search.value; refreshProductsTable(); }, 180));
      const cat = document.getElementById('productCatFilter');
      if (cat) cat.addEventListener('change', () => { S.productCat = cat.value; refreshProductsTable(); });
      const stock = document.getElementById('productStockFilter');
      if (stock) stock.addEventListener('change', () => { S.productStock = stock.value; refreshProductsTable(); });
      const add = document.getElementById('addProduct');
      if (add) add.addEventListener('click', () => D.openProductForm());
    },
  });
})();
