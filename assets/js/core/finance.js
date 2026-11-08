/* ==========================================================================
   MÂY TRẮNG – Engine tính toán tài chính & hiệu suất
   Tất cả số liệu trên dashboard đều được tính từ đơn hàng thật trong CSDL.
   ========================================================================== */
(function () {
  const MT = window.MT;
  const U = MT.util;
  const DAYS_YEAR = 365.25;
  const DAYS_MONTH = 30.4375;

  function settings() { return MT.db.settings(); }

  function channelFeeRate(channel) {
    const fees = settings().finance.channelFees || {};
    return Number(fees[channel] != null ? fees[channel] : 0) || 0;
  }

  function fixedMonthly() {
    return U.sum(settings().finance.monthlyFixed || [], (x) => Number(x.amount) || 0);
  }

  function fixedFor(days) {
    return fixedMonthly() * (Number(days) || 0) / DAYS_MONTH;
  }

  function taxFor(revenue, days) {
    const tax = settings().finance.tax || {};
    if (!tax.enabled) return 0;
    const threshold = Math.max(0, (Number(tax.threshold) || 0) * (Number(days) || 0) / DAYS_YEAR);
    const taxable = Math.max(0, (Number(revenue) || 0) - threshold);
    return taxable * ((Number(tax.vatPct) || 0) + (Number(tax.pitPct) || 0)) / 100;
  }

  /** Tổng hợp P&L cho một tập đơn hàng. `days` dùng để phân bổ chi phí cố định & thuế. */
  function summarize(orders, days) {
    const st = settings();
    const all = orders || [];
    const valid = all.filter((o) => o.status !== 'cancelled');
    const cancelled = all.filter((o) => o.status === 'cancelled');
    let gross = 0, cogs = 0, discount = 0, shippingCollected = 0, units = 0;
    let channelFees = 0;
    const byChannel = {};

    valid.forEach((o) => {
      const orderRevenue = Math.max(0, (Number(o.subtotal) || 0) - (Number(o.discount) || 0));
      gross += Number(o.subtotal) || 0;
      discount += Number(o.discount) || 0;
      shippingCollected += Number(o.shippingFee) || 0;
      const fee = orderRevenue * channelFeeRate(o.channel) / 100;
      channelFees += fee;
      const bc = byChannel[o.channel] = byChannel[o.channel] || { revenue: 0, orders: 0, cogs: 0, fees: 0 };
      bc.revenue += orderRevenue;
      bc.orders += 1;
      bc.fees += fee;
      (o.items || []).forEach((it) => {
        const qty = Number(it.qty) || 0;
        units += qty;
        cogs += (Number(it.cost) || 0) * qty;
        bc.cogs += (Number(it.cost) || 0) * qty;
      });
    });

    const netRevenue = Math.max(0, gross - discount);
    const packaging = valid.length * (Number(st.shipping.packagingPerOrder) || 0);
    const shippedOrders = valid.filter((o) => o.shippingMethod !== 'pickup').length;
    const shippingCost = shippedOrders * (Number(st.shipping.avgShipCost) || 0);
    const netShipping = shippingCost - shippingCollected;
    const marketing = netRevenue * (Number(st.finance.marketingRatePct) || 0) / 100;
    const contribution = netRevenue - cogs - channelFees - marketing - packaging - netShipping;
    const fixed = fixedFor(days || 365);
    const ebit = contribution - fixed;
    const tax = taxFor(netRevenue, days || 365);
    const netProfit = ebit - tax;

    const metrics = {
      orders: valid.length,
      cancelled: cancelled.length,
      units,
      grossRevenue: gross,
      discount,
      netRevenue,
      cogs,
      channelFees,
      marketing,
      packaging,
      shippingCollected,
      shippingCost,
      netShipping,
      contribution,
      fixedCosts: fixed,
      ebit,
      tax,
      netProfit,
      aov: valid.length ? netRevenue / valid.length : 0,
      cogsPct: netRevenue ? cogs / netRevenue * 100 : 0,
      grossMarginPct: netRevenue ? (netRevenue - cogs) / netRevenue * 100 : 0,
      contributionMarginPct: netRevenue ? contribution / netRevenue * 100 : 0,
      netMarginPct: netRevenue ? netProfit / netRevenue * 100 : 0,
      totalCost: cogs + channelFees + marketing + packaging + netShipping + fixed + tax,
      byChannel,
      days: days || 365,
      fixedMonthly: fixedMonthly(),
      breakEvenRevenue: 0,
      breakEvenOrders: 0,
      breakEvenMonthly: 0,
      contributionPerOrder: valid.length ? contribution / valid.length : 0,
    };
    const cmRatio = netRevenue > 0 ? contribution / netRevenue : 0;
    metrics.breakEvenRevenue = cmRatio > 0 ? fixed / cmRatio : 0;
    metrics.breakEvenMonthly = cmRatio > 0 ? fixedMonthly() / cmRatio : 0;
    metrics.breakEvenOrders = cmRatio > 0 ? fixed / Math.max(1, metrics.contributionPerOrder) : 0;
    return metrics;
  }

  function ordersInRange(orders, from, to) {
    const a = U.startOfDay(from).getTime();
    const b = U.endOfDay(to).getTime();
    return (orders || []).filter((o) => {
      const t = new Date(o.createdAt).getTime();
      return t >= a && t <= b;
    });
  }

  function daysOf(from, to) {
    return Math.max(1, Math.round((U.endOfDay(to) - U.startOfDay(from)) / 86400000) + 1);
  }

  function byMonth(orders, count, endDate) {
    const end = endDate ? new Date(endDate) : new Date();
    const n = count || 12;
    const out = [];
    for (let i = n - 1; i >= 0; i--) {
      const start = new Date(end.getFullYear(), end.getMonth() - i, 1);
      const isCurrent = i === 0;
      const finish = isCurrent ? end : new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59);
      const days = daysOf(start, finish);
      const list = ordersInRange(orders, start, finish);
      const s = summarize(list, days);
      out.push({
        key: U.monthKey(start),
        date: start,
        label: U.fmt.month(start),
        monthLabel: 'Tháng ' + (start.getMonth() + 1),
        ...s,
        fixedCosts: fixedMonthly() * (isCurrent ? days / DAYS_MONTH : 1),
      });
    }
    return out;
  }

  function channelBreakdown(orders, days) {
    const s = summarize(orders, days);
    const st = settings();
    const list = (orders || []).filter((o) => o.status !== 'cancelled');
    return Object.keys(MT.meta.channels).map((key) => {
      const subset = list.filter((o) => o.channel === key);
      const ss = summarize(subset, days);
      const revenue = ss.netRevenue;
      return {
        key,
        ...MT.meta.channels[key],
        orders: ss.orders,
        units: ss.units,
        revenue,
        cogs: ss.cogs,
        fees: ss.channelFees,
        marketing: revenue * (Number(st.finance.marketingRatePct) || 0) / 100,
        shipping: ss.netShipping,
        contribution: ss.contribution,
        marginPct: revenue ? ss.contribution / revenue * 100 : 0,
        aov: ss.orders ? revenue / ss.orders : 0,
        sharePct: s.netRevenue ? revenue / s.netRevenue * 100 : 0,
        feeRate: channelFeeRate(key),
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }

  function productBreakdown(orders) {
    const map = {};
    (orders || []).filter((o) => o.status !== 'cancelled').forEach((o) => {
      (o.items || []).forEach((it) => {
        const key = it.productId;
        const item = map[key] = map[key] || {
          productId: key, name: it.name, units: 0, revenue: 0, cogs: 0, orders: new Set(),
        };
        item.units += Number(it.qty) || 0;
        item.revenue += (Number(it.price) || 0) * (Number(it.qty) || 0);
        item.cogs += (Number(it.cost) || 0) * (Number(it.qty) || 0);
        item.orders.add(o.id);
      });
    });
    const total = U.sum(Object.values(map), (x) => x.revenue);
    return Object.values(map).map((x) => ({
      ...x,
      orders: x.orders.size,
      profit: x.revenue - x.cogs,
      marginPct: x.revenue ? (x.revenue - x.cogs) / x.revenue * 100 : 0,
      sharePct: total ? x.revenue / total * 100 : 0,
      product: MT.products.get(x.productId),
    })).sort((a, b) => b.revenue - a.revenue);
  }

  function topCustomers(orders) {
    const map = {};
    (orders || []).filter((o) => o.status !== 'cancelled').forEach((o) => {
      const key = o.customer.phone;
      const c = map[key] = map[key] || { name: o.customer.name, phone: key, email: o.customer.email, orders: 0, revenue: 0, last: o.createdAt };
      c.orders++;
      c.revenue += Math.max(0, o.total - o.shippingFee);
      if (new Date(o.createdAt) > new Date(c.last)) { c.last = o.createdAt; c.name = o.customer.name; }
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }

  function projection(base, actual) {
    const st = settings();
    const f = st.finance;
    const rev1 = (base && base.netRevenue) || (actual && actual.netRevenue) || (Number(f.targetRevenue) || 500000000) * 0.9;
    const b = base || {};
    const cogsRatio = b.netRevenue ? b.cogs / b.netRevenue : 0.4;
    const feeRatio = b.netRevenue ? b.channelFees / b.netRevenue : 0.04;
    const marketRatio = (Number(f.marketingRatePct) || 0) / 100;
    const packRatio = b.netRevenue ? (b.packaging + b.netShipping) / b.netRevenue : 0.04;
    const fixedY1 = fixedMonthly() * 12;
    const growth2 = (Number(f.growthY2Pct) || 0) / 100;
    const growth3 = (Number(f.growthY3Pct) || 0) / 100;
    const fixedGrowth = (Number(f.fixedGrowthPct) || 0) / 100;
    const inflation = (Number(f.cogsInflationPct) || 0) / 100;
    const investment = Number(f.initialInvestment) || 0;
    const rate = (Number(f.discountRatePct) || 0) / 100;

    const years = [];
    let revenue = rev1;
    for (let y = 1; y <= 3; y++) {
      if (y === 2) revenue = rev1 * (1 + growth2);
      if (y === 3) revenue = rev1 * (1 + growth2) * (1 + growth3);
      const cogs = revenue * cogsRatio * Math.pow(1 + inflation, y - 1);
      const fees = revenue * feeRatio;
      const marketing = revenue * marketRatio;
      const packaging = revenue * packRatio;
      const fixed = fixedY1 * Math.pow(1 + fixedGrowth, y - 1);
      const tax = taxFor(revenue, DAYS_YEAR);
      const contribution = revenue - cogs - fees - marketing - packaging;
      const ebit = contribution - fixed;
      const profit = ebit - tax;
      years.push({
        year: y, revenue, cogs, fees, marketing, packaging, fixed, contribution, ebit, tax, profit,
        marginPct: revenue ? profit / revenue * 100 : 0,
        growthPct: y === 1 ? 0 : ((revenue / years[y - 2].revenue) - 1) * 100,
      });
    }
    const totalProfit = U.sum(years, (y) => y.profit);
    let cumulative = 0;
    let paybackMonth = null;
    for (let i = 0; i < years.length; i++) {
      const monthly = years[i].profit / 12;
      for (let m = 1; m <= 12; m++) {
        cumulative += monthly;
        if (paybackMonth == null && cumulative >= investment) paybackMonth = i * 12 + m;
      }
    }
    // Dòng tiền: năm 0 = -vốn đầu tư
    const flows = [-investment].concat(years.map((y) => y.profit));
    let npv = -investment;
    years.forEach((y) => { npv += y.profit / Math.pow(1 + rate, y.year); });
    const irr = irrOf(flows);
    return {
      years, investment, rate, npv, irr,
      totalProfit,
      roiPct: investment ? totalProfit / investment * 100 : 0,
      paybackMonth,
      paybackLabel: paybackMonth ? 'Tháng ' + paybackMonth + ' (năm ' + (Math.floor((paybackMonth - 1) / 12) + 1) + ')' : 'Chưa hoàn vốn trong 36 tháng',
      cogsRatio, feeRatio, marketingRatio: marketRatio, packRatio,
    };
  }

  function npvOf(flows, rate) {
    return flows.reduce((acc, v, i) => acc + v / Math.pow(1 + rate, i), 0);
  }

  function irrOf(flows) {
    let lo = -0.95, hi = 3;
    let flo = npvOf(flows, lo), fhi = npvOf(flows, hi);
    if (isNaN(flo) || isNaN(fhi) || flo * fhi > 0) return null;
    for (let i = 0; i < 200; i++) {
      const mid = (lo + hi) / 2;
      const fmid = npvOf(flows, mid);
      if (Math.abs(fmid) < 1) return mid;
      if (flo * fmid < 0) { hi = mid; fhi = fmid; } else { lo = mid; flo = fmid; }
    }
    return (lo + hi) / 2;
  }

  function sensitivity(base) {
    const st = settings();
    const f = st.finance;
    const prices = [0.9, 1, 1.1];
    const costFactors = [0.95, 1, 1.05];
    const fixed = fixedMonthly() * 12;
    const feeRatio = base.feeRatio, marketRatio = base.marketingRatio, packRatio = base.packRatio;
    return prices.map((pm) => costFactors.map((cm) => {
      const revenue = base.revenue * pm;
      const cogs = base.cogs * cm;
      const variable = revenue * (feeRatio + marketRatio + packRatio);
      const tax = taxFor(revenue, DAYS_YEAR);
      const profit = revenue - cogs - variable - fixed - tax;
      return { priceFactor: pm, costFactor: cm, revenue, profit, marginPct: revenue ? profit / revenue * 100 : 0 };
    }));
  }

  function taskAnalytics(tasks, members) {
    const today = U.startOfDay(new Date());
    const byStatus = { todo: 0, doing: 0, review: 0, done: 0 };
    const byPriority = { low: 0, medium: 0, high: 0, urgent: 0 };
    (tasks || []).forEach((t) => {
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;
      byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
    });
    const perMember = (members || []).map((m) => {
      const list = (tasks || []).filter((t) => t.assigneeId === m.id);
      const done = list.filter((t) => t.status === 'done');
      const overdue = list.filter((t) => t.status !== 'done' && t.dueDate && new Date(t.dueDate) < today);
      const onTime = done.filter((t) => !t.completedAt || !t.dueDate || new Date(t.completedAt) <= U.endOfDay(t.dueDate));
      return {
        member: m,
        total: list.length,
        done: done.length,
        active: list.length - done.length,
        overdue: overdue.length,
        progress: list.length ? Math.round(U.sum(list, (t) => t.progress) / list.length) : 0,
        onTimeRate: done.length ? Math.round(onTime.length / done.length * 100) : 0,
        evidence: U.sum(list, (t) => (t.evidence || []).length),
        estimateHours: U.sum(list, (t) => t.estimateHours || 0),
        actualHours: U.sum(list, (t) => t.actualHours || 0),
        capacityPct: m.weeklyHours ? Math.min(100, Math.round((U.sum(list.filter((t) => t.status !== 'done'), (t) => t.estimateHours || 0) / Math.max(1, m.weeklyHours * 4)) * 100)) : 0,
      };
    });
    return {
      total: (tasks || []).length,
      byStatus, byPriority, perMember,
      completionPct: (tasks || []).length ? Math.round(byStatus.done / (tasks || []).length * 100) : 0,
      overdue: (tasks || []).filter((t) => t.status !== 'done' && t.dueDate && new Date(t.dueDate) < today).length,
      evidence: U.sum(tasks || [], (t) => (t.evidence || []).length),
    };
  }

  /** So sánh kỳ hiện tại với kỳ trước có cùng độ dài. */
  function compare(orders, from, to) {
    const days = daysOf(from, to);
    const prevTo = U.addDays(from, -1);
    const prevFrom = U.addDays(prevTo, -(days - 1));
    const current = summarize(ordersInRange(orders, from, to), days);
    const previous = summarize(ordersInRange(orders, prevFrom, prevTo), days);
    return {
      days, current, previous,
      from, to, prevFrom, prevTo,
      delta: {
        revenue: U.pctChange(current.netRevenue, previous.netRevenue),
        profit: U.pctChange(current.netProfit, previous.netProfit),
        orders: U.pctChange(current.orders, previous.orders),
        aov: U.pctChange(current.aov, previous.aov),
        margin: current.netMarginPct - previous.netMarginPct,
      },
    };
  }

  MT.finance = {
    summarize, byMonth, channelBreakdown, productBreakdown, topCustomers,
    projection, sensitivity, taskAnalytics, compare, ordersInRange, daysOf,
    fixedMonthly, fixedFor, taxFor, channelFeeRate, npvOf, irrOf,
    DAYS_MONTH, DAYS_YEAR,
  };
})();
