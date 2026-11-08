/* ==========================================================================
   MÂY TRẮNG – Dashboard: Tài chính, mô hình 3 năm, kênh bán
   ========================================================================== */
(function () {
  const MT = window.MT;
  const D = MT.dash;
  const U = MT.util;

  /* ================================ FINANCE =============================== */
  function financeMonths() {
    const r = D.range();
    if (r.days <= 45) {
      const s = D.summary();
      return [Object.assign({ label: 'Kỳ đã chọn', date: r.from, _summary: true }, s)];
    }
    const count = Math.min(12, Math.max(2, Math.ceil(r.days / 30.44)));
    return MT.finance.byMonth(MT.db.data.orders, count, r.to).filter((m) => m.date >= U.startOfMonth(r.from) || m.key === U.monthKey(r.from));
  }

  function totalsOf(rows) {
    const keys = ['netRevenue', 'grossRevenue', 'discount', 'cogs', 'channelFees', 'marketing', 'packaging', 'netShipping', 'contribution', 'fixedCosts', 'tax', 'netProfit', 'orders', 'units', 'shippingCollected'];
    const out = {};
    keys.forEach((k) => { out[k] = U.sum(rows, (r) => Number(r[k]) || 0); });
    out.aov = out.orders ? out.netRevenue / out.orders : 0;
    out.netMarginPct = out.netRevenue ? out.netProfit / out.netRevenue * 100 : 0;
    out.contributionMarginPct = out.netRevenue ? out.contribution / out.netRevenue * 100 : 0;
    return out;
  }

  function pnlTable(rows) {
    const t = totalsOf(rows);
    return '<div class="table-wrap"><table><thead><tr>' +
      '<th>Kỳ</th><th class="num">Doanh thu</th><th class="num">Giá vốn</th><th class="num">Phí kênh</th><th class="num">Marketing</th><th class="num">Ship &amp; gói</th><th class="num">Lợi nhuận góp</th><th class="num">Cố định</th><th class="num">Thuế</th><th class="num">Lợi nhuận ròng</th></tr></thead><tbody>' +
      rows.map((m) => {
        const ship = (m.packaging || 0) + (m.netShipping || 0);
        return '<tr><td><strong>' + U.esc(m.label) + '</strong><div style="font-size:.62rem;color:var(--db-muted)">' + m.orders + ' đơn</div></td>' +
          '<td class="num">' + D.money(m.netRevenue) + '</td>' +
          '<td class="num">' + D.money(m.cogs) + '</td>' +
          '<td class="num">' + D.money(m.channelFees) + '</td>' +
          '<td class="num">' + D.money(m.marketing) + '</td>' +
          '<td class="num">' + D.money(ship) + '</td>' +
          '<td class="num"><strong>' + D.money(m.contribution) + '</strong><div style="font-size:.6rem;color:var(--db-muted)">' + U.fmt.pct(m.netRevenue ? m.contribution / m.netRevenue * 100 : 0) + '</div></td>' +
          '<td class="num">' + D.money(m.fixedCosts) + '</td>' +
          '<td class="num">' + D.money(m.tax) + '</td>' +
          '<td class="num"><strong style="color:' + (m.netProfit >= 0 ? 'var(--db-success)' : 'var(--db-danger)') + '">' + D.money(m.netProfit) + '</strong></td></tr>';
      }).join('') +
      '<tr style="background:#F8FAFD;font-weight:700"><td>Tổng cộng</td><td class="num">' + D.money(t.netRevenue) + '</td><td class="num">' + D.money(t.cogs) + '</td><td class="num">' + D.money(t.channelFees) + '</td><td class="num">' + D.money(t.marketing) + '</td><td class="num">' + D.money(t.packaging + t.netShipping) + '</td><td class="num">' + D.money(t.contribution) + '</td><td class="num">' + D.money(t.fixedCosts) + '</td><td class="num">' + D.money(t.tax) + '</td><td class="num" style="color:' + (t.netProfit >= 0 ? 'var(--db-success)' : 'var(--db-danger)') + '">' + D.money(t.netProfit) + '</td></tr>' +
      '</tbody></table></div>';
  }

  function exportPnl() {
    const rows = [['Kỳ', 'Doanh thu', 'Giá vốn', 'Phí kênh', 'Marketing', 'Đóng gói & ship', 'Lợi nhuận góp', 'Chi phí cố định', 'Thuế', 'Lợi nhuận ròng', 'Số đơn']];
    financeMonths().forEach((m) => rows.push([
      m.label, Math.round(m.netRevenue), Math.round(m.cogs), Math.round(m.channelFees), Math.round(m.marketing),
      Math.round((m.packaging || 0) + (m.netShipping || 0)), Math.round(m.contribution), Math.round(m.fixedCosts),
      Math.round(m.tax), Math.round(m.netProfit), m.orders,
    ]));
    D.exportCsv('maytrang-pnl-' + U.todayISO() + '.csv', rows);
  }

  D.register('finance', {
    title: 'Doanh thu & lợi nhuận',
    crumb: 'Mây Trắng · Tài chính',
    render() {
      const s = D.summary();
      const rows = financeMonths();
      const t = totalsOf(rows);
      const fixed = MT.db.settings().finance.monthlyFixed;
      const costParts = [
        { label: 'Giá vốn hàng bán', value: s.cogs, color: '#4F46E5' },
        { label: 'Phí kênh & thanh toán', value: s.channelFees, color: '#0EA5E9' },
        { label: 'Marketing biến đổi', value: s.marketing, color: '#8B5CF6' },
        { label: 'Đóng gói & vận chuyển', value: s.packaging + s.netShipping, color: '#D99AA6' },
        { label: 'Chi phí cố định', value: s.fixedCosts, color: '#F59E0B' },
        { label: 'Thuế', value: s.tax, color: '#EF4444' },
      ].filter((x) => x.value > 0);
      const cm = s.contributionMarginPct;
      return '' +
        '<div class="kpi-grid">' +
          '<div class="kpi-card"><div class="kpi-card__top"><span class="kpi-card__label">Doanh thu thuần</span><span class="kpi-card__icon" style="background:#EEF2FF;color:#4F46E5">' + D.icon('wallet', 17) + '</span></div><div class="kpi-card__value">' + D.money(s.netRevenue) + '</div><div class="kpi-card__sub">' + s.orders + ' đơn · AOV ' + D.money(s.aov) + '</div></div>' +
          '<div class="kpi-card"><div class="kpi-card__top"><span class="kpi-card__label">Lợi nhuận góp</span><span class="kpi-card__icon" style="background:#EAF2FE;color:#3B82F6">' + D.icon('chart', 17) + '</span></div><div class="kpi-card__value">' + D.money(s.contribution) + '</div><div class="kpi-card__sub">Biên góp ' + U.fmt.pct(cm) + ' · sau chi phí biến đổi</div></div>' +
          '<div class="kpi-card"><div class="kpi-card__top"><span class="kpi-card__label">Lợi nhuận ròng</span><span class="kpi-card__icon" style="background:' + (s.netProfit >= 0 ? '#E7F8F2;color:#10B981' : '#FEECEC;color:#EF4444') + '">' + D.icon('dollar', 17) + '</span></div><div class="kpi-card__value" style="color:' + (s.netProfit >= 0 ? 'var(--db-success)' : 'var(--db-danger)') + '">' + D.money(s.netProfit) + '</div><div class="kpi-card__sub">Biên ròng ' + U.fmt.pct(s.netMarginPct) + ' · thuế ' + D.money(s.tax) + '</div></div>' +
          '<div class="kpi-card"><div class="kpi-card__top"><span class="kpi-card__label">Điểm hoà vốn / tháng</span><span class="kpi-card__icon" style="background:#FEF5E7;color:#F59E0B">' + D.icon('target', 17) + '</span></div><div class="kpi-card__value">' + D.money(s.breakEvenMonthly) + '</div><div class="kpi-card__sub">≈ ' + Math.ceil(s.breakEvenOrders) + ' đơn/tháng theo AOV hiện tại</div></div>' +
        '</div>' +

        '<div class="charts-grid">' +
          '<div class="card"><div class="card__head"><div><div class="card__title">Doanh thu &amp; lợi nhuận theo kỳ</div><div class="card__sub">Đơn vị: VNĐ · ' + D.esc(D.rangeLabel()) + '</div></div>' +
            '<button class="btn btn-sm" type="button" id="exportPnl">' + D.icon('download', 13) + ' Xuất P&amp;L</button></div>' +
            '<div class="card__body"><div class="chart-box"><canvas id="pnlChart"></canvas></div></div></div>' +
          '<div class="card"><div class="card__head"><div><div class="card__title">Cơ cấu chi phí</div><div class="card__sub">Tỷ trọng trên tổng chi phí</div></div></div>' +
            '<div class="card__body"><div class="chart-box" style="height:230px"><canvas id="costChart"></canvas></div>' +
            '<div class="legend-list">' + costParts.slice(0, 6).map((c) =>
              '<div class="legend-item"><span class="swatch" style="background:' + c.color + '"></span>' + U.esc(c.label) + '<strong>' + D.money(c.value) + '</strong></div>').join('') + '</div>' +
            '</div></div>' +
        '</div>' +

        '<div class="card card--flush" style="margin-bottom:1rem"><div class="card__head"><div><div class="card__title">Báo cáo lãi lỗ (P&amp;L)</div><div class="card__sub">' + rows.length + ' kỳ · ' + D.esc(D.rangeLabel()) + '</div></div>' +
          '<div class="card__actions"><span class="badge badge-' + (t.netProfit >= 0 ? 'success' : 'danger') + '">' + (t.netProfit >= 0 ? 'Có lãi' : 'Đang lỗ') + '</span></div></div>' +
          pnlTable(rows) + '</div>' +

        '<div class="grid grid-2">' +
          '<div class="card"><div class="card__head"><div><div class="card__title">Điểm hoà vốn &amp; an toàn</div><div class="card__sub">Dựa trên chi phí cố định hiện tại</div></div></div><div class="card__body">' +
            '<div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">' + D.ring(cm > 0 ? Math.min(100, cm * 2) : 0, 92, '#4F46E5') +
            '<div><strong style="font-size:1.15rem">' + D.money(s.breakEvenMonthly) + '/tháng</strong><div style="font-size:.7rem;color:var(--db-muted)">Doanh thu tối thiểu để hoà vốn</div>' +
            '<div style="font-size:.7rem;color:var(--db-muted);margin-top:.25rem">Biên góp ' + U.fmt.pct(cm) + ' · Cố định ' + D.money(s.fixedMonthly) + '/tháng</div></div></div>' +
            '<div style="margin-top:1rem;display:grid;grid-template-columns:1fr 1fr;gap:.6rem">' +
              '<div style="background:var(--db-line-soft);border-radius:9px;padding:.6rem"><span style="font-size:.62rem;color:var(--db-muted)">Doanh thu kỳ này</span><strong style="display:block;font-size:.92rem">' + D.money(s.netRevenue) + '</strong></div>' +
              '<div style="background:var(--db-line-soft);border-radius:9px;padding:.6rem"><span style="font-size:.62rem;color:var(--db-muted)">Biên an toàn</span><strong style="display:block;font-size:.92rem">' + (s.netRevenue >= s.breakEvenRevenue ? '+' : '') + D.money(s.netRevenue - s.breakEvenRevenue) + '</strong></div>' +
              '<div style="background:var(--db-line-soft);border-radius:9px;padding:.6rem"><span style="font-size:.62rem;color:var(--db-muted)">Lợi nhuận góp / đơn</span><strong style="display:block;font-size:.92rem">' + D.money(s.contributionPerOrder) + '</strong></div>' +
              '<div style="background:var(--db-line-soft);border-radius:9px;padding:.6rem"><span style="font-size:.62rem;color:var(--db-muted)">Thuế ước tính</span><strong style="display:block;font-size:.92rem">' + D.money(s.tax) + '</strong></div>' +
            '</div></div></div>' +
          '<div class="card"><div class="card__head"><div><div class="card__title">Chi phí cố định hằng tháng</div><div class="card__sub">Tổng ' + D.money(s.fixedMonthly) + ' / tháng</div></div><button class="btn btn-sm" type="button" data-go="settings">Chỉnh sửa</button></div><div class="card__body">' +
            '<div class="table-wrap"><table><tbody>' + fixed.map((f) =>
              '<tr><td>' + U.esc(f.name) + '</td><td class="num"><strong>' + D.money(f.amount) + '</strong></td><td class="num" style="color:var(--db-muted)">' + U.fmt.pct(s.fixedMonthly ? f.amount / s.fixedMonthly * 100 : 0, 0) + '</td></tr>').join('') +
              '<tr style="background:#F8FAFD"><td><strong>Tổng cộng</strong></td><td class="num"><strong>' + D.money(s.fixedMonthly) + '</strong></td><td></td></tr>' +
            '</tbody></table></div>' +
            '<p style="font-size:.66rem;color:var(--db-muted);margin-top:.6rem">Thuế hộ kinh doanh: ' + U.fmt.pct((MT.db.settings().finance.tax.vatPct || 0) + (MT.db.settings().finance.tax.pitPct || 0)) + ' trên doanh thu vượt ngưỡng ' + D.money(MT.db.settings().finance.tax.threshold) + '/năm.</p>' +
          '</div></div>' +
        '</div>';
    },
    mount() {
      const rows = financeMonths();
      const labels = rows.map((m) => m.label);
      const revenues = rows.map((m) => Math.round(m.netRevenue));
      const profits = rows.map((m) => Math.round(m.netProfit));
      D.chart('pnlChart', {
        type: 'bar',
        data: {
          labels,
          datasets: [
            { label: 'Doanh thu', data: revenues, backgroundColor: 'rgba(79,70,229,.8)', borderRadius: 4, barPercentage: .62 },
            { label: 'Lợi nhuận ròng', data: profits, type: 'line', borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,.12)', borderWidth: 2, tension: .35, pointRadius: 3, fill: true },
          ],
        },
        options: {
          plugins: { legend: { position: 'top', align: 'end' }, tooltip: { callbacks: { label: (c) => c.dataset.label + ': ' + D.money(c.parsed.y) } } },
          scales: {
            x: { grid: { display: false } },
            y: { beginAtZero: true, grid: { color: '#F1F5F9' }, ticks: { callback: (v) => D.short(v) } },
          },
        },
      });
      const s = D.summary();
      const parts = [
        { label: 'Giá vốn', value: s.cogs, color: '#4F46E5' },
        { label: 'Phí kênh', value: s.channelFees, color: '#0EA5E9' },
        { label: 'Marketing', value: s.marketing, color: '#8B5CF6' },
        { label: 'Ship & gói', value: s.packaging + s.netShipping, color: '#D99AA6' },
        { label: 'Cố định', value: s.fixedCosts, color: '#F59E0B' },
        { label: 'Thuế', value: s.tax, color: '#EF4444' },
      ].filter((x) => x.value > 0);
      D.chart('costChart', {
        type: 'doughnut',
        data: { labels: parts.map((x) => x.label), datasets: [{ data: parts.map((x) => Math.round(x.value)), backgroundColor: parts.map((x) => x.color), borderWidth: 3, borderColor: '#fff' }] },
        options: { cutout: '66%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => c.label + ': ' + D.money(c.parsed) } } } },
      });
      const ex = document.getElementById('exportPnl');
      if (ex) ex.addEventListener('click', exportPnl);
      document.querySelectorAll('#view [data-go]').forEach((el) => el.addEventListener('click', (e) => { e.preventDefault(); D.go(el.dataset.go); }));
    },
  });

  /* ================================= MODEL ================================ */
  const modelState = { inputs: null };

  function defaultModelInputs() {
    const r = D.range();
    const yearOrders = MT.finance.ordersInRange(MT.db.data.orders, U.addDays(new Date(), -364), new Date());
    const base = MT.finance.summarize(yearOrders, 365);
    const f = MT.db.settings().finance;
    return {
      revenue: Math.round(base.netRevenue) || 350000000,
      growth2: Number(f.growthY2Pct) || 35,
      growth3: Number(f.growthY3Pct) || 28,
      cogsPct: U.round(base.netRevenue ? base.cogs / base.netRevenue * 100 : 40, 1),
      marketingPct: Number(f.marketingRatePct) || 8,
      feePct: U.round(base.netRevenue ? base.channelFees / base.netRevenue * 100 : 3, 1),
      shipPct: U.round(base.netRevenue ? (base.packaging + base.netShipping) / base.netRevenue * 100 : 4, 1),
      fixedMonthly: MT.finance.fixedMonthly(),
      fixedGrowth: Number(f.fixedGrowthPct) || 8,
      inflation: Number(f.cogsInflationPct) || 3,
      taxRate: (Number(f.tax.vatPct) || 0) + (Number(f.tax.pitPct) || 0),
      taxThreshold: Number(f.tax.threshold) || 200000000,
      investment: Number(f.initialInvestment) || 80000000,
      discountRate: Number(f.discountRatePct) || 12,
    };
  }

  function calcModel(inp) {
    const years = [];
    let revenue = inp.revenue;
    for (let y = 1; y <= 3; y++) {
      if (y === 2) revenue = inp.revenue * (1 + inp.growth2 / 100);
      if (y === 3) revenue = inp.revenue * (1 + inp.growth2 / 100) * (1 + inp.growth3 / 100);
      const cogs = revenue * inp.cogsPct / 100 * Math.pow(1 + inp.inflation / 100, y - 1);
      const fees = revenue * inp.feePct / 100;
      const marketing = revenue * inp.marketingPct / 100;
      const shipping = revenue * inp.shipPct / 100;
      const contribution = revenue - cogs - fees - marketing - shipping;
      const fixed = inp.fixedMonthly * 12 * Math.pow(1 + inp.fixedGrowth / 100, y - 1);
      const taxable = Math.max(0, revenue - inp.taxThreshold);
      const tax = taxable * inp.taxRate / 100;
      const profit = contribution - fixed - tax;
      years.push({ year: y, revenue, cogs, fees, marketing, shipping, contribution, fixed, tax, profit, marginPct: revenue ? profit / revenue * 100 : 0, growthPct: y === 1 ? 0 : (revenue / years[y - 2].revenue - 1) * 100 });
    }
    const flows = [-inp.investment].concat(years.map((y) => y.profit));
    let npv = -inp.investment;
    years.forEach((y) => { npv += y.profit / Math.pow(1 + inp.discountRate / 100, y.year); });
    const irr = MT.finance.irrOf(flows);
    let cumulative = 0, paybackMonth = null;
    for (let i = 0; i < 3; i++) {
      const monthly = years[i].profit / 12;
      for (let m = 1; m <= 12; m++) {
        cumulative += monthly;
        if (paybackMonth == null && cumulative >= inp.investment) paybackMonth = i * 12 + m;
      }
    }
    const totalProfit = U.sum(years, (y) => y.profit);
    return {
      years, npv, irr, paybackMonth,
      paybackLabel: paybackMonth ? 'Tháng ' + paybackMonth : 'Sau 36 tháng',
      roiPct: inp.investment ? totalProfit / inp.investment * 100 : 0,
      totalProfit,
    };
  }

  function sensitivity(inp) {
    const prices = [0.9, 1, 1.1];
    const costs = [0.95, 1, 1.05];
    return prices.map((pm) => costs.map((cm) => {
      const revenue = inp.revenue * pm;
      const cogs = inp.revenue * inp.cogsPct / 100 * cm;
      const variable = revenue * (inp.feePct + inp.marketingPct + inp.shipPct) / 100;
      const fixed = inp.fixedMonthly * 12;
      const tax = Math.max(0, revenue - inp.taxThreshold) * inp.taxRate / 100;
      const profit = revenue - cogs - variable - fixed - tax;
      return { profit, marginPct: revenue ? profit / revenue * 100 : 0 };
    }));
  }

  function modelOutputHtml(inp, r) {
    const sens = sensitivity(inp);
    return '<div class="grid grid-4" style="margin-bottom:1rem">' +
        '<div class="kpi-card"><div class="kpi-card__label">Doanh thu năm 1</div><div class="kpi-card__value" style="font-size:1.25rem">' + D.money(r.years[0].revenue) + '</div><div class="kpi-card__sub">' + U.fmt.pct(r.years[0].growthPct) + ' so với năm trước</div></div>' +
        '<div class="kpi-card"><div class="kpi-card__label">Lợi nhuận năm 3</div><div class="kpi-card__value" style="font-size:1.25rem;color:' + (r.years[2].profit >= 0 ? 'var(--db-success)' : 'var(--db-danger)') + '">' + D.money(r.years[2].profit) + '</div><div class="kpi-card__sub">Biên ' + U.fmt.pct(r.years[2].marginPct) + '</div></div>' +
        '<div class="kpi-card"><div class="kpi-card__label">NPV @ ' + inp.discountRate + '%</div><div class="kpi-card__value" style="font-size:1.25rem;color:' + (r.npv >= 0 ? 'var(--db-success)' : 'var(--db-danger)') + '">' + D.money(r.npv) + '</div><div class="kpi-card__sub">Vốn đầu tư ' + D.money(inp.investment) + '</div></div>' +
        '<div class="kpi-card"><div class="kpi-card__label">IRR &amp; hoàn vốn</div><div class="kpi-card__value" style="font-size:1.25rem">' + (r.irr != null ? U.fmt.pct(r.irr * 100) : '—') + '</div><div class="kpi-card__sub">' + r.paybackLabel + ' · ROI ' + U.fmt.pct(r.roiPct, 0) + '</div></div>' +
      '</div>' +
      '<div class="card" style="margin-bottom:1rem"><div class="card__head"><div><div class="card__title">Dự phóng 3 năm</div><div class="card__sub">Doanh thu, lợi nhuận và biên lợi nhuận</div></div></div>' +
        '<div class="card__body"><div class="chart-box"><canvas id="modelChart"></canvas></div></div></div>' +
      '<div class="card card--flush" style="margin-bottom:1rem"><div class="card__head"><div><div class="card__title">Báo cáo dự phóng</div><div class="card__sub">Giả định có thể điều chỉnh ở cột bên trái</div></div></div>' +
        '<div class="table-wrap"><table><thead><tr><th>Chỉ tiêu</th><th class="num">Năm 1</th><th class="num">Năm 2</th><th class="num">Năm 3</th></tr></thead><tbody>' +
          '<tr><td><strong>Doanh thu</strong></td>' + r.years.map((y) => '<td class="num"><strong>' + D.money(y.revenue) + '</strong></td>').join('') + '</tr>' +
          '<tr><td>Giá vốn hàng bán</td>' + r.years.map((y) => '<td class="num">' + D.money(y.cogs) + '</td>').join('') + '</tr>' +
          '<tr><td>Phí kênh &amp; thanh toán</td>' + r.years.map((y) => '<td class="num">' + D.money(y.fees) + '</td>').join('') + '</tr>' +
          '<tr><td>Marketing</td>' + r.years.map((y) => '<td class="num">' + D.money(y.marketing) + '</td>').join('') + '</tr>' +
          '<tr><td>Đóng gói &amp; vận chuyển</td>' + r.years.map((y) => '<td class="num">' + D.money(y.shipping) + '</td>').join('') + '</tr>' +
          '<tr style="background:#F8FAFD"><td><strong>Lợi nhuận góp</strong></td>' + r.years.map((y) => '<td class="num"><strong>' + D.money(y.contribution) + '</strong></td>').join('') + '</tr>' +
          '<tr><td>Chi phí cố định</td>' + r.years.map((y) => '<td class="num">' + D.money(y.fixed) + '</td>').join('') + '</tr>' +
          '<tr><td>Thuế</td>' + r.years.map((y) => '<td class="num">' + D.money(y.tax) + '</td>').join('') + '</tr>' +
          '<tr style="background:#EEF2FF"><td><strong>Lợi nhuận ròng</strong></td>' + r.years.map((y) => '<td class="num"><strong style="color:' + (y.profit >= 0 ? 'var(--db-success)' : 'var(--db-danger)') + '">' + D.money(y.profit) + '</strong></td>').join('') + '</tr>' +
          '<tr><td>Biên lợi nhuận</td>' + r.years.map((y) => '<td class="num">' + U.fmt.pct(y.marginPct) + '</td>').join('') + '</tr>' +
        '</tbody></table></div></div>' +
      '<div class="card"><div class="card__head"><div><div class="card__title">Phân tích độ nhạy</div><div class="card__sub">Lợi nhuận năm 1 khi giá bán và giá vốn thay đổi</div></div></div>' +
        '<div class="table-wrap"><table><thead><tr><th>Giá vốn ↓ / Giá bán →</th><th class="num">−10%</th><th class="num">Cơ sở</th><th class="num">+10%</th></tr></thead><tbody>' +
          sens.map((row, i) => '<tr><td><strong>' + ['−5%', 'Cơ sở', '+5%'][i] + '</strong></td>' + row.map((cell) =>
            '<td class="num" style="color:' + (cell.profit >= 0 ? 'var(--db-success)' : 'var(--db-danger)') + '">' + D.money(cell.profit) + '</td>').join('') + '</tr>').join('') +
        '</tbody></table></div>' +
        '<div class="card__body" style="border-top:1px solid var(--db-line);font-size:.7rem;color:var(--db-muted)">Công thức: LN = Doanh thu − Giá vốn − Phí kênh − Marketing − Vận chuyển − Chi phí cố định − Thuế. Thuế = (Doanh thu − ngưỡng miễn thuế) × thuế suất.</div></div>';
  }

  function modelInputsHtml(inp) {
    const field = (key, label, suffix) =>
      '<div class="field"><label>' + label + '</label><div class="input-group"><input class="input" type="number" step="any" data-model="' + key + '" value="' + inp[key] + '"><span style="padding:.55rem .6rem;background:var(--db-line-soft);border:1px solid var(--db-line);border-left:none;border-radius:0 9px 9px 0;font-size:.68rem;color:var(--db-muted);white-space:nowrap">' + suffix + '</span></div></div>';
    return '<div class="card"><div class="card__head"><div><div class="card__title">Giả định mô hình</div><div class="card__sub">Thay đổi để xem kết quả cập nhật ngay</div></div></div><div class="card__body">' +
      '<div class="form-section"><div class="form-section__title">Tăng trưởng</div>' +
        field('revenue', 'Doanh thu năm 1', 'VNĐ') +
        '<div class="field-row">' + field('growth2', 'Tăng trưởng năm 2', '%') + field('growth3', 'Tăng trưởng năm 3', '%') + '</div>' +
      '</div>' +
      '<div class="form-section"><div class="form-section__title">Cơ cấu chi phí</div>' +
        '<div class="field-row">' + field('cogsPct', 'Giá vốn / doanh thu', '%') + field('feePct', 'Phí kênh', '%') + '</div>' +
        '<div class="field-row">' + field('marketingPct', 'Marketing', '%') + field('shipPct', 'Ship &amp; đóng gói', '%') + '</div>' +
        field('fixedMonthly', 'Chi phí cố định / tháng', 'VNĐ') +
        field('fixedGrowth', 'Tăng chi phí cố định', '%/năm') +
        field('inflation', 'Lạm phát giá vốn', '%/năm') +
      '</div>' +
      '<div class="form-section"><div class="form-section__title">Thuế &amp; đầu tư</div>' +
        '<div class="field-row">' + field('taxRate', 'Thuế suất', '%') + field('taxThreshold', 'Ngưỡng miễn thuế', 'VNĐ') + '</div>' +
        '<div class="field-row">' + field('investment', 'Vốn đầu tư ban đầu', 'VNĐ') + field('discountRate', 'Tỷ lệ chiết khấu', '%') + '</div>' +
      '</div>' +
      '<div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-top:.4rem">' +
        '<button class="btn btn-sm" type="button" data-scenario="down">Bi quan</button>' +
        '<button class="btn btn-sm" type="button" data-scenario="base">Cơ sở</button>' +
        '<button class="btn btn-sm" type="button" data-scenario="up">Lạc quan</button>' +
      '</div>' +
      '<button class="btn btn-soft mt-2" type="button" id="saveModel" style="width:100%;margin-top:.7rem">' + D.icon('check', 14) + ' Lưu giả thuyết vào cài đặt</button>' +
      '<p style="font-size:.64rem;color:var(--db-muted);margin-top:.7rem">Mô hình chỉ mang tính dự báo, không phải cam kết tài chính.</p>' +
    '</div></div>';
  }

  D.register('model', {
    title: 'Mô hình tài chính 3 năm',
    crumb: 'Mây Trắng · Tài chính',
    render() {
      if (!modelState.inputs) modelState.inputs = defaultModelInputs();
      const inp = modelState.inputs;
      const r = calcModel(inp);
      return '<div class="grid grid-1-2" style="align-items:start">' +
        modelInputsHtml(inp) +
        '<div id="modelOutput">' + modelOutputHtml(inp, r) + '</div>' +
      '</div>';
    },
    mount() {
      const inp = modelState.inputs;
      const update = () => {
        const r = calcModel(inp);
        const host = document.getElementById('modelOutput');
        if (host) {
          host.innerHTML = modelOutputHtml(inp, r);
          D.chart('modelChart', {
            type: 'bar',
            data: {
              labels: ['Năm 1', 'Năm 2', 'Năm 3'],
              datasets: [
                { label: 'Doanh thu', data: r.years.map((y) => Math.round(y.revenue)), backgroundColor: 'rgba(79,70,229,.8)', borderRadius: 4, barPercentage: .55 },
                { label: 'Lợi nhuận ròng', data: r.years.map((y) => Math.round(y.profit)), type: 'line', borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,.1)', borderWidth: 2, tension: .3, pointRadius: 3, fill: true },
              ],
            },
            options: {
              plugins: { legend: { position: 'top', align: 'end' }, tooltip: { callbacks: { label: (c) => c.dataset.label + ': ' + D.money(c.parsed.y) } } },
              scales: { y: { beginAtZero: true, grid: { color: '#F1F5F9' }, ticks: { callback: (v) => D.short(v) } }, x: { grid: { display: false } } },
            },
          });
        }
      };
      setTimeout(update, 30);
      const inputs = document.querySelectorAll('#view [data-model]');
      inputs.forEach((el) => el.addEventListener('input', U.debounce(() => {
        const k = el.dataset.model;
        inp[k] = Number(el.value) || 0;
        update();
      }, 250)));
      document.querySelectorAll('#view [data-scenario]').forEach((btn) => btn.addEventListener('click', () => {
        const sc = btn.dataset.scenario;
        if (sc === 'down') Object.assign(inp, { growth2: 10, growth3: 8, cogsPct: inp.cogsPct + 4, marketingPct: inp.marketingPct + 3, fixedGrowth: 12 });
        else if (sc === 'up') Object.assign(inp, { growth2: 45, growth3: 35, cogsPct: Math.max(20, inp.cogsPct - 2), marketingPct: Math.max(2, inp.marketingPct - 2), fixedGrowth: 5 });
        else Object.assign(inp, defaultModelInputs());
        document.querySelectorAll('#view [data-model]').forEach((el) => { if (inp[el.dataset.model] != null) el.value = inp[el.dataset.model]; });
        update();
        D.toast('Đã áp dụng kịch bản ' + (sc === 'down' ? 'bi quan' : sc === 'up' ? 'lạc quan' : 'cơ sở'), 'success');
      }));
      const save = document.getElementById('saveModel');
      if (save) save.addEventListener('click', () => {
        MT.db.updateSettings((st) => {
          st.finance.growthY2Pct = inp.growth2;
          st.finance.growthY3Pct = inp.growth3;
          st.finance.marketingRatePct = inp.marketingPct;
          st.finance.fixedGrowthPct = inp.fixedGrowth;
          st.finance.cogsInflationPct = inp.inflation;
          st.finance.initialInvestment = inp.investment;
          st.finance.discountRatePct = inp.discountRate;
          st.finance.targetRevenue = Math.round(inp.revenue);
        });
        D.toast('Đã lưu giả thuyết vào cài đặt tài chính', 'success');
      });
    },
  });

  /* =============================== CHANNELS =============================== */
  D.register('channels', {
    title: 'Hiệu quả kênh bán hàng',
    crumb: 'Mây Trắng · Kinh doanh',
    render() {
      const s = D.summary();
      const list = MT.finance.channelBreakdown(D.orders(), D.range().days);
      const active = list.filter((c) => c.orders > 0);
      const bestRevenue = active.slice().sort((a, b) => b.revenue - a.revenue)[0];
      const bestMargin = active.slice().sort((a, b) => b.marginPct - a.marginPct)[0];
      const worstMargin = active.filter((c) => c.revenue > 0).slice().sort((a, b) => a.marginPct - b.marginPct)[0];
      return '' +
        '<div class="stat-strip">' +
          '<div class="stat"><span>Doanh thu kỳ này</span><strong>' + D.money(s.netRevenue) + '</strong></div>' +
          '<div class="stat"><span>Kênh đang bán</span><strong>' + active.length + ' <small>kênh</small></strong></div>' +
          '<div class="stat"><span>Dẫn đầu doanh thu</span><strong style="font-size:.88rem">' + U.esc(bestRevenue ? bestRevenue.label : '—') + '</strong><span style="margin-top:.15rem">' + (bestRevenue ? D.money(bestRevenue.revenue) : '') + '</span></div>' +
          '<div class="stat"><span>Biên góp tốt nhất</span><strong style="font-size:.88rem">' + U.esc(bestMargin ? bestMargin.label : '—') + '</strong><span style="margin-top:.15rem">' + (bestMargin ? U.fmt.pct(bestMargin.marginPct) : '') + '</span></div>' +
        '</div>' +
        '<div class="charts-grid">' +
          '<div class="card"><div class="card__head"><div><div class="card__title">Doanh thu theo kênh</div><div class="card__sub">' + D.esc(D.rangeLabel()) + '</div></div></div><div class="card__body"><div class="chart-box"><canvas id="channelBar"></canvas></div></div></div>' +
          '<div class="card"><div class="card__head"><div><div class="card__title">Tỷ trọng doanh thu</div><div class="card__sub">Trên tổng doanh thu thuần</div></div></div><div class="card__body"><div class="chart-box" style="height:245px"><canvas id="channelDonut"></canvas><div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;padding-bottom:1.5rem"><span style="font-size:.62rem;color:var(--db-muted)">Doanh thu</span><strong style="font-size:.92rem">' + D.money(s.netRevenue) + '</strong></div></div></div></div>' +
        '</div>' +
        '<div class="card card--flush"><div class="card__head"><div><div class="card__title">Chi tiết hiệu quả từng kênh</div><div class="card__sub">Phí kênh có thể chỉnh trực tiếp · áp dụng ngay vào báo cáo</div></div></div>' +
          '<div class="table-wrap"><table><thead><tr><th>Kênh</th><th class="num">Đơn</th><th class="num">Doanh thu</th><th class="num">Tỷ trọng</th><th class="num">AOV</th><th class="num">Phí kênh</th><th class="num">Lợi nhuận góp</th><th class="num">Biên góp</th><th style="width:110px">Phí %</th></tr></thead><tbody>' +
            list.map((c) => '<tr><td><div class="table-user"><span class="avatar avatar--sm" style="background:' + c.color + '">' + U.initials(c.label) + '</span><div><strong>' + U.esc(c.label) + '</strong><span>' + U.fmt.num(c.units) + ' sản phẩm</span></div></div></td>' +
              '<td class="num">' + c.orders + '</td><td class="num">' + D.money(c.revenue) + '</td>' +
              '<td class="num"><div class="progress-row">' + D.progress(c.sharePct, '') + '<strong>' + U.fmt.pct(c.sharePct, 0) + '</strong></div></td>' +
              '<td class="num">' + D.money(c.aov) + '</td><td class="num">' + D.money(c.fees) + '</td>' +
              '<td class="num"><strong>' + D.money(c.contribution) + '</strong></td>' +
              '<td class="num"><span class="badge badge-' + (c.marginPct >= 40 ? 'success' : c.marginPct >= 30 ? 'warn' : 'danger') + ' no-dot">' + U.fmt.pct(c.marginPct) + '</span></td>' +
              '<td><div class="input-group"><input class="input" style="padding:.3rem .4rem;font-size:.72rem" type="number" step="0.1" min="0" max="40" data-fee="' + c.key + '" value="' + c.feeRate + '"><span style="padding:.3rem .4rem;background:var(--db-line-soft);border:1px solid var(--db-line);border-left:none;border-radius:0 6px 6px 0;font-size:.66rem;color:var(--db-muted)">%</span></div></td></tr>').join('') +
          '</tbody></table></div></div>' +
        '<div class="grid grid-3" style="margin-top:1rem">' +
          '<div class="card"><div class="card__body"><div style="font-size:.68rem;color:var(--db-muted);margin-bottom:.3rem">Kênh doanh thu lớn nhất</div><strong style="font-size:.95rem">' + U.esc(bestRevenue ? bestRevenue.label : '—') + '</strong><div style="font-size:.72rem;color:var(--db-muted);margin-top:.2rem">' + (bestRevenue ? D.money(bestRevenue.revenue) + ' · ' + U.fmt.pct(bestRevenue.sharePct, 0) + ' tỷ trọng' : '') + '</div></div></div>' +
          '<div class="card"><div class="card__body"><div style="font-size:.68rem;color:var(--db-muted);margin-bottom:.3rem">Kênh có biên tốt nhất</div><strong style="font-size:.95rem">' + U.esc(bestMargin ? bestMargin.label : '—') + '</strong><div style="font-size:.72rem;color:var(--db-muted);margin-top:.2rem">' + (bestMargin ? U.fmt.pct(bestMargin.marginPct) + ' biên góp' : '') + '</div></div></div>' +
          '<div class="card"><div class="card__body"><div style="font-size:.68rem;color:var(--db-muted);margin-bottom:.3rem">Cần tối ưu</div><strong style="font-size:.95rem">' + U.esc(worstMargin ? worstMargin.label : '—') + '</strong><div style="font-size:.72rem;color:var(--db-muted);margin-top:.2rem">' + (worstMargin ? 'Biên ' + U.fmt.pct(worstMargin.marginPct) + ' · phí ' + U.fmt.pct(worstMargin.feeRate) : '') + '</div></div></div>' +
        '</div>';
    },
    mount() {
      const list = MT.finance.channelBreakdown(D.orders(), D.range().days).filter((c) => c.revenue > 0);
      D.chart('channelBar', {
        type: 'bar',
        data: {
          labels: list.map((c) => c.short),
          datasets: [
            { label: 'Doanh thu', data: list.map((c) => Math.round(c.revenue)), backgroundColor: list.map((c) => c.color + 'CC'), borderRadius: 4, barPercentage: .6 },
            { label: 'Lợi nhuận góp', data: list.map((c) => Math.round(c.contribution)), backgroundColor: 'rgba(16,185,129,.55)', borderRadius: 4, barPercentage: .6 },
          ],
        },
        options: {
          plugins: { legend: { position: 'top', align: 'end' }, tooltip: { callbacks: { label: (c) => c.dataset.label + ': ' + D.money(c.parsed.y) } } },
          scales: { x: { grid: { display: false } }, y: { beginAtZero: true, grid: { color: '#F1F5F9' }, ticks: { callback: (v) => D.short(v) } } },
        },
      });
      D.chart('channelDonut', {
        type: 'doughnut',
        data: { labels: list.map((c) => c.label), datasets: [{ data: list.map((c) => Math.round(c.revenue)), backgroundColor: list.map((c) => c.color), borderWidth: 3, borderColor: '#fff', hoverOffset: 4 }] },
        options: { cutout: '70%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 8, padding: 12, font: { size: 10 } } }, tooltip: { callbacks: { label: (c) => c.label + ': ' + D.money(c.parsed) } } } },
      });
      document.querySelectorAll('#view [data-fee]').forEach((input) => input.addEventListener('change', () => {
        const key = input.dataset.fee;
        const val = U.clamp(Number(input.value) || 0, 0, 40);
        MT.db.updateSettings((st) => { st.finance.channelFees[key] = val; });
        D.toast('Đã cập nhật phí kênh ' + key + ' = ' + U.fmt.pct(val), 'success');
        D.refresh();
      }));
    },
  });
})();
