/* ==========================================================================
   MÂY TRẮNG – Dashboard: Tổng quan
   ========================================================================== */
(function () {
  const MT = window.MT;
  const D = MT.dash;
  const U = MT.util;

  function kpiCard(o) {
    return '<div class="kpi-card ' + (o.accent ? 'kpi-card--accent' : '') + '">' +
      '<div class="kpi-card__top"><span class="kpi-card__label">' + U.esc(o.label) + '</span>' +
      '<span class="kpi-card__icon" style="' + (o.accent ? '' : 'background:' + o.soft + ';color:' + o.color) + '">' + D.icon(o.icon, 17) + '</span></div>' +
      '<div class="kpi-card__value">' + o.value + '</div>' +
      '<div class="kpi-card__sub">' + o.sub + '</div>' +
      (o.spark || '') +
    '</div>';
  }

  function render() {
    const range = D.range();
    const orders = D.orders();
    const s = MT.finance.summarize(orders, range.days);
    const prev = MT.finance.summarize(D.prevOrders(), range.days);
    const series = D.series(range.from, range.to);
    const tasks = MT.finance.taskAnalytics(MT.db.data.tasks, MT.db.data.members);
    const channels = MT.finance.channelBreakdown(orders, range.days).filter((c) => c.revenue > 0);
    const products = MT.products.all();
    const invUnits = U.sum(products, (p) => p.stock);
    const invValue = U.sum(products, (p) => (Number(p.stock) || 0) * (Number(p.cost) || 0));
    const lowStock = products.filter((p) => p.stock >= 0 && p.stock <= 10);
    const last365 = MT.finance.summarize(MT.finance.ordersInRange(MT.db.data.orders, U.addDays(new Date(), -364), new Date()), 365);
    const target = Number(MT.db.settings().finance.targetRevenue) || 500000000;
    const goalPct = target ? (last365.netRevenue / target) * 100 : 0;
    const remaining = Math.max(0, target - last365.netRevenue);
    const topProducts = MT.finance.productBreakdown(orders).slice(0, 6);
    const recent = orders.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6);
    const pendingOrders = orders.filter((o) => o.status === 'pending').length;
    const alerts = [];
    if (tasks.overdue) alerts.push('<strong>' + tasks.overdue + ' nhiệm vụ quá hạn</strong> cần xử lý');
    if (pendingOrders) alerts.push('<strong>' + pendingOrders + ' đơn chờ xác nhận</strong>');
    if (lowStock.length) alerts.push('<strong>' + lowStock.length + ' SKU sắp hết hàng</strong> (≤10)');

    const sparkColor = '#FFFFFF';
    const hasPrev = prev.orders > 0;
    const trend = (cur, old) => hasPrev ? D.trendHtml(U.pctChange(cur, old)) : '<span class="trend flat">—</span>';
    const compare = hasPrev ? 'so với kỳ trước' : 'chưa có dữ liệu kỳ trước';
    return '' +
      '<div class="kpi-grid">' +
        kpiCard({
          label: 'Doanh thu thuần', value: D.money(s.netRevenue), accent: true, icon: 'wallet',
          sub: trend(s.netRevenue, prev.netRevenue) + ' <span>' + compare + (hasPrev ? ' · ' + D.esc(range.days) + ' ngày' : '') + '</span>',
          spark: D.miniSpark(series.map((x) => x.revenue), sparkColor),
        }) +
        kpiCard({
          label: 'Lợi nhuận ròng', value: D.money(s.netProfit), icon: 'chart', color: s.netProfit >= 0 ? '#10B981' : '#EF4444', soft: s.netProfit >= 0 ? '#E7F8F2' : '#FEECEC',
          sub: trend(s.netProfit, prev.netProfit) + ' <span>biên ' + U.fmt.pct(s.netMarginPct) + '</span>',
          spark: D.miniSpark(series.map((x) => x.profit), s.netProfit >= 0 ? '#10B981' : '#EF4444'),
        }) +
        kpiCard({
          label: 'Đơn hàng', value: U.fmt.num(s.orders), icon: 'box', color: '#3B82F6', soft: '#EAF2FE',
          sub: trend(s.orders, prev.orders) + ' <span>· ' + U.fmt.num(s.units) + ' sản phẩm</span>',
          spark: D.miniSpark(series.map((x) => x.orders), '#3B82F6'),
        }) +
        kpiCard({
          label: 'Giá trị đơn TB (AOV)', value: D.money(s.aov), icon: 'target', color: '#D99AA6', soft: '#FDF1F3',
          sub: trend(s.aov, prev.aov) + ' <span>· biên góp ' + U.fmt.pct(s.contributionMarginPct) + '</span>',
          spark: D.miniSpark(series.map((x) => x.orders ? x.revenue / x.orders : 0), '#D99AA6'),
        }) +
      '</div>' +

      (alerts.length ? '<div class="alert-banner">' + D.icon('alert', 17) + '<div>' + alerts.join(' · ') + '. <a href="#tasks" data-go="tasks" style="font-weight:700;text-decoration:underline">Xem ngay</a></div></div>' : '') +

      '<div class="stat-strip">' +
        '<div class="stat"><span>Tồn kho hiện tại</span><strong>' + U.fmt.num(invUnits) + ' <small>sản phẩm</small></strong><span style="margin-top:.15rem">Giá trị vốn ' + D.money(invValue) + '</span></div>' +
        '<div class="stat"><span>Nhiệm vụ đang thực hiện</span><strong>' + (tasks.byStatus.doing + tasks.byStatus.review) + ' <small>/ ' + tasks.total + ' việc</small></strong><span style="margin-top:.15rem">' + tasks.overdue + ' việc quá hạn</span></div>' +
        '<div class="stat"><span>Tỷ lệ hoàn thành</span><strong>' + U.fmt.pct(tasks.completionPct, 0) + '</strong><span style="margin-top:.15rem">' + tasks.byStatus.done + ' việc đã xong · ' + tasks.evidence + ' bằng chứng</span></div>' +
        '<div class="stat"><span>Điểm hoà vốn / tháng</span><strong>' + D.money(s.breakEvenMonthly) + '</strong><span style="margin-top:.15rem">Chi phí cố định ' + D.money(s.fixedMonthly) + '/tháng</span></div>' +
      '</div>' +

      '<div class="charts-grid">' +
        '<div class="card"><div class="card__head"><div><div class="card__title">Doanh thu &amp; lợi nhuận</div><div class="card__sub">' + D.esc(U.fmt.date(range.from) + ' – ' + U.fmt.date(range.to)) + '</div></div>' +
          '<div class="card__actions"><span class="badge badge-blue no-dot">' + D.esc(D.rangeLabel()) + '</span></div></div>' +
          '<div class="card__body"><div class="chart-box"><canvas id="chartRevenue"></canvas></div></div></div>' +
        '<div class="card"><div class="card__head"><div><div class="card__title">Doanh thu theo kênh</div><div class="card__sub">Tỷ trọng trong kỳ đã chọn</div></div></div>' +
          '<div class="card__body"><div class="chart-box" style="height:225px"><canvas id="chartChannel"></canvas>' +
          '<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;padding-bottom:1.6rem"><span style="font-size:.62rem;color:#64748B">Tổng doanh thu</span><strong style="font-size:1rem;letter-spacing:-.01em">' + D.money(s.netRevenue) + '</strong></div></div>' +
          '<div class="legend-list" id="channelLegend"></div></div></div>' +
      '</div>' +

      '<div class="grid grid-2-1" style="margin-bottom:1rem">' +
        '<div class="card card--flush"><div class="card__head"><div><div class="card__title">Đơn hàng gần đây</div><div class="card__sub">Cập nhật mới nhất từ website và các kênh</div></div>' +
          '<button class="btn btn-sm" type="button" data-go="orders">Xem tất cả ' + D.icon('chevronRight', 13) + '</button></div>' +
          '<div class="table-wrap"><table><thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Kênh</th><th>Trạng thái</th><th class="num">Giá trị</th></tr></thead><tbody>' +
            (recent.length ? recent.map((o) =>
              '<tr class="clickable" data-order-id="' + o.id + '"><td><strong>' + U.esc(o.code) + '</strong></td>' +
              '<td><div class="table-user"><span class="avatar avatar--sm" style="background:' + (o.channel === 'website' ? '#4F46E5' : '#64748B') + '">' + U.initials(o.customer.name) + '</span><div><strong>' + U.esc(o.customer.name) + '</strong><span>' + U.fmt.dateShort(o.createdAt) + ' · ' + o.items.length + ' món</span></div></div></td>' +
              '<td><span class="badge badge-gray no-dot">' + U.esc((MT.meta.channels[o.channel] || {}).short || o.channel) + '</span></td>' +
              '<td>' + D.statusBadge(o.status) + '</td><td class="num"><strong>' + D.money(o.total) + '</strong></td></tr>'
            ).join('') : '<tr><td colspan="5"><div class="empty-state"><h3>Chưa có đơn hàng</h3><p>Đơn mới từ website sẽ xuất hiện tại đây.</p></div></td></tr>') +
          '</tbody></table></div></div>' +

        '<div class="card"><div class="card__head"><div><div class="card__title">Mục tiêu doanh thu</div><div class="card__sub">12 tháng gần nhất</div></div><span class="badge badge-' + (goalPct >= 100 ? 'success' : 'warn') + '">' + (goalPct >= 100 ? 'Đạt mục tiêu' : 'Đang tăng tốc') + '</span></div>' +
          '<div class="card__body"><div class="goal-ring">' + D.ring(goalPct, 98, goalPct >= 100 ? '#10B981' : '#4F46E5') +
            '<div class="goal-ring__text"><strong>' + D.money(last365.netRevenue) + '</strong><span>trên mục tiêu ' + D.money(target) + '</span>' +
            '<div style="margin-top:.5rem;font-size:.7rem;color:var(--db-muted)">' + (remaining > 0 ? 'Còn ' + D.money(remaining) + ' để đạt mục tiêu' : 'Đã vượt mục tiêu ' + D.money(-remaining)) + '</div></div></div>' +
            '<div style="margin-top:1rem;display:grid;gap:.55rem">' +
              '<div class="progress-row"><span style="font-size:.68rem;color:var(--db-muted);width:78px">Biên lợi nhuận</span>' + D.progress(Math.max(0, last365.netMarginPct), last365.netMarginPct >= 0 ? 'success' : 'danger') + '<strong>' + U.fmt.pct(last365.netMarginPct) + '</strong></div>' +
              '<div class="progress-row"><span style="font-size:.68rem;color:var(--db-muted);width:78px">Hoàn thành việc</span>' + D.progress(tasks.completionPct, 'success') + '<strong>' + tasks.completionPct + '%</strong></div>' +
            '</div>' +
            '<div style="margin-top:1rem;padding-top:.85rem;border-top:1px solid var(--db-line);font-size:.7rem;color:var(--db-muted)">Mục tiêu năm đặt tại <a href="#settings" data-go="settings" style="color:var(--db-primary);font-weight:600">Cài đặt → Tài chính</a></div>' +
          '</div></div>' +
      '</div>' +

      '<div class="grid grid-2">' +
        '<div class="card card--flush"><div class="card__head"><div><div class="card__title">Sản phẩm đóng góp doanh thu</div><div class="card__sub">Top 6 theo doanh thu trong kỳ</div></div>' +
          '<button class="btn btn-sm" type="button" data-go="products">Quản lý kho</button></div>' +
          '<div class="table-wrap"><table><thead><tr><th>Sản phẩm</th><th class="num">Đã bán</th><th class="num">Doanh thu</th><th style="width:120px">Tỷ trọng</th></tr></thead><tbody>' +
            (topProducts.length ? topProducts.map((p) =>
              '<tr><td><div class="table-product"><img src="' + U.esc(p.product ? p.product.images[0] : U.placeholder(p.name)) + '" alt="" data-fallback><div><strong>' + U.esc(p.name) + '</strong><span>' + U.fmt.num(p.units) + ' sản phẩm · ' + (p.product ? MT.catalog.catName(p.product.cat) : '') + '</span></div></div></td>' +
              '<td class="num">' + U.fmt.num(p.units) + '</td><td class="num">' + D.money(p.revenue) + '</td>' +
              '<td><div class="progress-row">' + D.progress(p.sharePct, '') + '<strong>' + U.fmt.pct(p.sharePct, 0) + '</strong></div></td></tr>'
            ).join('') : '<tr><td colspan="4"><div class="empty-state"><h3>Chưa có dữ liệu bán hàng</h3><p>Doanh thu sản phẩm sẽ xuất hiện khi có đơn hàng.</p></div></td></tr>') +
          '</tbody></table></div></div>' +

        '<div class="card"><div class="card__head"><div><div class="card__title">Tiến độ đội ngũ</div><div class="card__sub">' + tasks.total + ' nhiệm vụ · ' + tasks.evidence + ' bằng chứng</div></div>' +
          '<button class="btn btn-sm" type="button" data-go="tasks">Mở bảng việc</button></div>' +
          '<div class="card__body">' +
            '<div style="display:flex;gap:.4rem;margin-bottom:1rem;flex-wrap:wrap">' +
              '<span class="badge badge-gray">Cần làm ' + tasks.byStatus.todo + '</span>' +
              '<span class="badge badge-info">Đang làm ' + tasks.byStatus.doing + '</span>' +
              '<span class="badge badge-warn">Chờ duyệt ' + tasks.byStatus.review + '</span>' +
              '<span class="badge badge-success">Xong ' + tasks.byStatus.done + '</span></div>' +
            tasks.perMember.slice().sort((a, b) => b.active - a.active).map((m) =>
              '<div style="margin-bottom:.8rem"><div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.3rem">' + D.avatar(m.member, 'sm') +
              '<div style="flex:1;min-width:0"><div style="display:flex;justify-content:space-between;gap:.5rem"><strong style="font-size:.74rem">' + U.esc(m.member.name) + '</strong><span style="font-size:.66rem;color:var(--db-muted)">' + m.active + ' đang làm · ' + m.overdue + ' quá hạn</span></div>' +
              D.progress(m.progress, m.overdue ? 'warn' : 'success') + '</div></div></div>'
            ).join('') +
            '<div style="margin-top:1rem;padding-top:.85rem;border-top:1px solid var(--db-line)"><div class="progress-row"><span style="font-size:.7rem;color:var(--db-muted)">Hoàn thành tổng thể</span>' + D.progress(tasks.completionPct, 'success') + '<strong>' + tasks.completionPct + '%</strong></div></div>' +
          '</div></div>' +
      '</div>';
  }

  function mount() {
    const r = D.range();
    const orders = D.orders();
    const s = MT.finance.summarize(orders, r.days);
    const series = D.series(r.from, r.to);
    const channels = MT.finance.channelBreakdown(orders, r.days).filter((c) => c.revenue > 0);

    D.chart('chartRevenue', {
      type: 'bar',
      data: {
        labels: series.map((x) => x.label),
        datasets: [
          { label: 'Doanh thu', data: series.map((x) => Math.round(x.revenue)), backgroundColor: 'rgba(79,70,229,.82)', hoverBackgroundColor: '#4338CA', borderRadius: 4, barPercentage: .62, categoryPercentage: .72, order: 2 },
          { label: 'Lợi nhuận', data: series.map((x) => Math.round(x.profit)), type: 'line', borderColor: '#D99AA6', backgroundColor: 'rgba(217,154,166,.12)', borderWidth: 2, tension: .35, pointRadius: 2, pointHoverRadius: 4, fill: true, yAxisID: 'y1', order: 1 },
        ],
      },
      options: {
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top', align: 'end' },
          tooltip: {
            callbacks: {
              label: (ctx) => ctx.dataset.label + ': ' + D.money(ctx.parsed.y),
            },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { maxTicksLimit: 9, maxRotation: 0 } },
          y: { beginAtZero: true, border: { display: false }, grid: { color: '#F1F5F9' }, ticks: { callback: (v) => D.short(v) } },
          y1: { position: 'right', border: { display: false }, grid: { display: false }, ticks: { callback: (v) => D.short(v) } },
        },
      },
    });

    D.chart('chartChannel', {
      type: 'doughnut',
      data: {
        labels: channels.map((c) => c.label),
        datasets: [{
          data: channels.map((c) => Math.round(c.revenue)),
          backgroundColor: channels.map((c, i) => c.color || D.palette[i % D.palette.length]),
          borderWidth: 3,
          borderColor: '#fff',
          hoverOffset: 5,
        }],
      },
      options: {
        cutout: '70%',
        layout: { padding: 6 },
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => ctx.label + ': ' + D.money(ctx.parsed) } } },
      },
    });

    const legend = document.getElementById('channelLegend');
    if (legend) legend.innerHTML = channels.slice(0, 5).map((c) =>
      '<div class="legend-item"><span class="swatch" style="background:' + c.color + '"></span>' + U.esc(c.short) + '<strong>' + U.fmt.pct(c.sharePct, 0) + '</strong></div>'
    ).join('');

    document.querySelectorAll('#view [data-go]').forEach((el) => el.addEventListener('click', (e) => {
      e.preventDefault();
      D.go(el.dataset.go);
    }));
    document.querySelectorAll('#view [data-order-id]').forEach((row) => row.addEventListener('click', () => {
      if (D.openOrder) D.openOrder(row.dataset.orderId);
    }));
    void s;
  }

  D.register('overview', {
    title: 'Tổng quan kinh doanh',
    crumb: 'Mây Trắng · Phân tích',
    render,
    mount,
  });
})();
