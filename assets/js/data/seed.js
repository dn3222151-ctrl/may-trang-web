/* ==========================================================================
   MÂY TRẮNG – Dữ liệu khởi tạo (demo 12 tháng, thành viên, nhiệm vụ)
   Sinh dữ liệu có tính xác định để biểu đồ và phép tính luôn ổn định.
   ========================================================================== */
window.MT = window.MT || {};

MT.seed = (function () {
  const util = MT.util;
  const rand = util.mulberry32(20261107);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const int = (min, max) => Math.floor(rand() * (max - min + 1)) + min;
  const chance = (p) => rand() < p;

  const U = (id, w) => 'https://images.unsplash.com/' + id + '?auto=format&fit=crop&w=' + (w || 900) + '&q=80';

  const memberSeeds = [
    {
      id: 'MB-01', name: 'Lại Trọng Việt', role: 'Quản lý / Vận hành', email: 'viet@maytrang.vn',
      phone: '0987654321', equityPct: 25, weeklyHours: 20, status: 'active',
      joinedAt: '2026-01-05', color: '#4F46E5', kpiTarget: 150000000,
      skills: ['Vận hành', 'Đàm phán', 'Bán sỉ'], note: 'Phụ trách vận hành và phát triển kênh CLB.',
    },
    {
      id: 'MB-02', name: 'Vũ Tiến Thiện Lam', role: 'Nguồn hàng & TMĐT', email: 'lam@maytrang.vn',
      phone: '0912345678', equityPct: 18.75, weeklyHours: 12, status: 'active',
      joinedAt: '2026-01-05', color: '#0EA5E9', kpiTarget: 120000000,
      skills: ['Nguồn hàng', 'Shopee', 'TikTok Shop'], note: 'Quản lý nhà cung cấp và vận hành sàn TMĐT.',
    },
    {
      id: 'MB-03', name: 'Hoàng Thu Hương', role: 'Nhân viên Bán hàng', email: 'huong@maytrang.vn',
      phone: '0977888999', equityPct: 12.5, weeklyHours: 12, status: 'active',
      joinedAt: '2026-02-10', color: '#D99AA6', kpiTarget: 90000000,
      skills: ['Tư vấn', 'Chăm sóc khách hàng', 'Livestream'], note: 'Phụ trách bán lẻ và chăm sóc khách hàng.',
    },
    {
      id: 'MB-04', name: 'Nguyễn Thị Hà Anh', role: 'Quản lý Tài chính', email: 'hanh@maytrang.vn',
      phone: '0909090909', equityPct: 12.5, weeklyHours: 12, status: 'active',
      joinedAt: '2026-01-15', color: '#10B981', kpiTarget: 0,
      skills: ['Kế toán', 'Thuế', 'Phân tích'], note: 'Theo dõi dòng tiền, thuế và báo cáo tài chính.',
    },
    {
      id: 'MB-05', name: 'Đỗ Minh Khang', role: 'Content & Marketing', email: 'khang@maytrang.vn',
      phone: '0933445566', equityPct: 6.25, weeklyHours: 10, status: 'active',
      joinedAt: '2026-03-01', color: '#F59E0B', kpiTarget: 80000000,
      skills: ['Content', 'Quay dựng', 'Ads'], note: 'Sản xuất nội dung và chạy quảng cáo.',
    },
  ];

  function baseSettings() {
    const brand = MT.config.brand;
    return {
      store: {
        name: brand.name,
        legal: brand.legal,
        hotline: brand.hotline,
        email: brand.email,
        address: brand.address,
        taxCode: brand.taxCode,
        announcement: 'Miễn phí giao hàng toàn quốc cho hoá đơn từ 299.000đ',
        bank: {
          bankId: MT.config.payment.bankId,
          name: MT.config.payment.bankName,
          no: MT.config.payment.accountNo,
          holder: MT.config.payment.accountName,
        },
      },
      shipping: {
        freeThreshold: 299000,
        expressFee: 15000,
        pickupFee: 0,
        fees: { hn: 22000, hcm: 22000, north: 30000, central: 35000, south: 30000 },
        packagingPerOrder: 4000,
        avgShipCost: 26000,
      },
      finance: {
        monthlyFixed: [
          { id: 'rent', name: 'Mặt bằng & kho', amount: 3000000 },
          { id: 'salary', name: 'Lương đội ngũ', amount: 6000000 },
          { id: 'ads', name: 'Marketing cố định', amount: 2000000 },
          { id: 'tools', name: 'Công cụ & phần mềm', amount: 800000 },
          { id: 'depreciation', name: 'Khấu hao thiết bị', amount: 500000 },
          { id: 'other', name: 'Chi phí khác', amount: 800000 },
        ],
        marketingRatePct: 8,
        tax: { enabled: true, threshold: 200000000, vatPct: 1, pitPct: 0.5 },
        channelFees: { website: 1.2, shopee: 11.5, tiktok: 9.5, facebook: 2.5, event: 1.5, wholesale: 0 },
        targetRevenue: 500000000,
        initialInvestment: 80000000,
        discountRatePct: 12,
        growthY2Pct: 35,
        growthY3Pct: 28,
        fixedGrowthPct: 8,
        cogsInflationPct: 3,
        conversionRatePct: 2.8,
        sessionsPerMonth: 9200,
      },
      storefront: {
        returnDays: 30,
        installmentNote: 'Thanh toán an toàn, thông tin thẻ không được lưu trên hệ thống.',
      },
      updatedAt: new Date().toISOString(),
    };
  }

  const couponSeeds = [
    { id: 'CP-01', code: 'MAY10', type: 'percent', value: 10, maxDiscount: 100000, minOrder: 300000, label: 'Giảm 10% tối đa 100.000đ', active: true, expires: '2027-12-31', usageCount: 84 },
    { id: 'CP-02', code: 'FREESHIP', type: 'shipping', value: 0, maxDiscount: 0, minOrder: 299000, label: 'Miễn phí vận chuyển', active: true, expires: '2027-12-31', usageCount: 131 },
    { id: 'CP-03', code: 'COMBO20', type: 'percent', value: 20, maxDiscount: 180000, minOrder: 700000, label: 'Giảm 20% tối đa 180.000đ', active: true, expires: '2027-03-31', usageCount: 26 },
    { id: 'CP-04', code: 'WELCOME50', type: 'fixed', value: 50000, maxDiscount: 0, minOrder: 199000, label: 'Giảm 50.000đ cho khách mới', active: true, expires: '2027-06-30', usageCount: 58 },
    { id: 'CP-05', code: 'SUMMER26', type: 'percent', value: 15, maxDiscount: 120000, minOrder: 400000, label: 'Ưu đãi hè 2026 (đã hết hạn)', active: false, expires: '2026-08-31', usageCount: 210 },
  ];

  const customerSeeds = [
    { name: 'Nguyễn Ngọc Anh', phone: '0901234567', email: 'ngocanh@gmail.com', address: 'Số 12 ngõ 34 Cầu Giấy', province: 'Hà Nội' },
    { name: 'Trần Thu Hà', phone: '0912345678', email: 'thuha@gmail.com', address: '45 Lê Lợi, Quận 1', province: 'TP. Hồ Chí Minh' },
    { name: 'Lê Minh Trang', phone: '0987654321', email: 'minhtrang@gmail.com', address: '78 Nguyễn Văn Linh, Hải Châu', province: 'Đà Nẵng' },
    { name: 'Phạm Mai Chi', phone: '0977123456', email: 'maichi@gmail.com', address: '23 Trần Hưng Đạo', province: 'Hải Phòng' },
    { name: 'Hoàng Bảo Ngọc', phone: '0934567890', email: 'baongoc@gmail.com', address: '56 Pasteur, Quận 3', province: 'TP. Hồ Chí Minh' },
    { name: 'Vũ Kim Ngân', phone: '0945678901', email: 'kimngan@gmail.com', address: '12 Điện Biên Phủ', province: 'Nghệ An' },
    { name: 'Đặng Phương Thảo', phone: '0956789012', email: 'phuongthao@gmail.com', address: '89 Nguyễn Trãi', province: 'Thanh Hoá' },
    { name: 'Bùi Hà My', phone: '0967890123', email: 'hamy@gmail.com', address: '34 Hùng Vương', province: 'Huế' },
    { name: 'Ngô Quỳnh Anh', phone: '0923456789', email: 'quynhanh@gmail.com', address: '67 Lý Thường Kiệt', province: 'Bắc Ninh' },
    { name: 'Dương Trà My', phone: '0937890123', email: 'tramy@gmail.com', address: '15 Nguyễn Văn Cừ', province: 'Cần Thơ' },
    { name: 'Lý Diệu Linh', phone: '0918765432', email: 'dieulinh@gmail.com', address: '90 Trần Phú', province: 'Khánh Hoà' },
    { name: 'Trịnh Hoàng Yến', phone: '0909876543', email: 'hoangyen@gmail.com', address: '22 Phan Chu Trinh', province: 'Đồng Nai' },
    { name: 'Đỗ Thanh Huyền', phone: '0987123456', email: 'thanhhuyen@gmail.com', address: '41 Nguyễn Du', province: 'Hà Nội' },
    { name: 'Phan Bích Ngọc', phone: '0976234511', email: 'bichngoc@gmail.com', address: '8 Trường Chinh', province: 'Bình Dương' },
    { name: 'Võ Thu Hương', phone: '0903555777', email: 'thuhuong@gmail.com', address: '19 Bạch Đằng', province: 'Đà Nẵng' },
    { name: 'Nguyễn Thanh Tâm', phone: '0919222333', email: 'thanhtam@gmail.com', address: '72 Võ Văn Kiệt', province: 'TP. Hồ Chí Minh' },
    { name: 'Trần Gia Hân', phone: '0938111222', email: 'giahan@gmail.com', address: '5 Nguyễn Thị Minh Khai', province: 'Hà Nội' },
    { name: 'Lê Thuỳ Dương', phone: '0947333444', email: 'thuyduong@gmail.com', address: '28 Trần Quốc Toản', province: 'Nam Định' },
    { name: 'Hồ Mai Phương', phone: '0968555666', email: 'maiphuong@gmail.com', address: '63 Lê Duẩn', province: 'Quảng Nam' },
    { name: 'Đinh Khánh Ly', phone: '0981777888', email: 'khanhly@gmail.com', address: '101 Nguyễn Huệ', province: 'Thái Nguyên' },
  ];

  const orgSeeds = [
    { name: 'CLB Yoga Sen Xanh', phone: '0912000111', email: 'senxanh@club.vn', address: '18 Trần Duy Hưng', province: 'Hà Nội' },
    { name: 'CLB Thể hình Mây Hồng', phone: '0913000222', email: 'mayhong@club.vn', address: '77 Nguyễn Xiển', province: 'Hà Nội' },
    { name: 'Spa An Nhiên', phone: '0914000333', email: 'annhien@spa.vn', address: '25 Lê Văn Việt, Quận 9', province: 'TP. Hồ Chí Minh' },
    { name: 'CLB Dưỡng sinh Bình An', phone: '0915000444', email: 'binhan@club.vn', address: '9 Nguyễn Tất Thành', province: 'Đà Nẵng' },
    { name: 'Trung tâm Fitness GreenLife', phone: '0916000555', email: 'greenlife@gym.vn', address: '33 Phạm Văn Đồng', province: 'Hà Nội' },
    { name: 'CLB Pickleball Sông Hồng', phone: '0917000666', email: 'songhong@club.vn', address: '2 Võ Thị Sáu', province: 'Hải Phòng' },
  ];

  function buildOrders(settings) {
    const now = new Date();
    const orders = [];
    let seq = 0;
    const channelPool = [
      ['website', 40], ['shopee', 17], ['tiktok', 12], ['facebook', 14], ['event', 17],
    ];
    const pickChannel = () => {
      const total = util.sum(channelPool, (c) => c[1]);
      let r = rand() * total;
      for (const [name, w] of channelPool) {
        if (r < w) return name;
        r -= w;
      }
      return 'website';
    };

    const feeFor = (province) => {
      const meta = MT.meta.provinces.find((p) => p.name === province) || { zone: 'central' };
      return settings.shipping.fees[meta.zone] || 30000;
    };

    for (let back = 11; back >= 0; back--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - back, 1);
      const isCurrent = back === 0;
      const days = isCurrent ? now.getDate() : util.daysInMonth(monthDate);
      const base = 17 + (11 - back) * 2.8;
      let count = Math.round(base * (0.88 + rand() * 0.28));
      if (isCurrent) count = Math.max(2, Math.round((count * days) / 30));

      for (let i = 0; i < count; i++) {
        seq += 1;
        const day = int(1, days);
        const createdAt = new Date(monthDate.getFullYear(), monthDate.getMonth(), day, int(8, 21), int(0, 59), 0);
        const channel = pickChannel();
        const customer = chance(0.28) ? pick(customerSeeds) : customerSeeds[(seq * 7) % customerSeeds.length];
        const itemCount = channel === 'event' ? int(2, 3) : int(1, 3);
        const chosen = [];
        while (chosen.length < itemCount) {
          const product = pick(MT.catalog.products.filter((p) => p.cat !== 'combo' || chance(0.35)));
          if (!chosen.some((x) => x.product.id === product.id)) chosen.push({ product, qty: chance(0.75) ? 1 : 2 });
        }
        const items = chosen.map(({ product, qty }) => ({
          productId: product.id,
          name: product.name,
          variant: product.variants.length ? pick(product.variants).name : '',
          price: product.price,
          cost: product.cost,
          qty,
          image: product.images[0],
        }));
        const subtotal = util.sum(items, (it) => it.price * it.qty);
        let discount = 0;
        let couponCode = '';
        if (channel === 'website' && chance(0.32)) {
          couponCode = pick(['MAY10', 'FREESHIP', 'WELCOME50', 'COMBO20']);
          if (couponCode === 'MAY10') discount = Math.min(Math.round(subtotal * 0.1), 100000);
          else if (couponCode === 'WELCOME50') discount = 50000;
          else if (couponCode === 'COMBO20') discount = Math.min(Math.round(subtotal * 0.2), 180000);
        } else if (channel !== 'website' && chance(0.08)) {
          discount = Math.round(subtotal * 0.05);
        }
        const afterDiscount = subtotal - discount;
        let shippingFee = 0;
        if (channel === 'website' || channel === 'facebook') {
          shippingFee = afterDiscount >= settings.shipping.freeThreshold ? 0 : feeFor(customer.province);
        }
        const total = afterDiscount + shippingFee;
        let paymentMethod = 'cod';
        if (channel === 'shopee' || channel === 'tiktok') paymentMethod = 'platform';
        else if (channel === 'event') paymentMethod = pick(['card', 'cod', 'momo']);
        else paymentMethod = pick(['cod', 'cod', 'bank', 'card', 'momo']);

        const ageDays = Math.max(0, Math.round((now - createdAt) / 86400000));
        let status = 'completed';
        if (ageDays > 25) status = chance(0.95) ? 'completed' : (chance(0.5) ? 'shipping' : 'cancelled');
        else if (ageDays > 10) {
          const r = rand();
          status = r < 0.7 ? 'completed' : r < 0.9 ? 'shipping' : r < 0.95 ? 'packing' : r < 0.98 ? 'confirmed' : 'cancelled';
        } else if (ageDays > 3) {
          const r = rand();
          status = r < 0.36 ? 'shipping' : r < 0.66 ? 'packing' : r < 0.9 ? 'completed' : r < 0.96 ? 'confirmed' : 'cancelled';
        } else {
          const r = rand();
          status = r < 0.18 ? 'pending' : r < 0.62 ? 'confirmed' : r < 0.87 ? 'packing' : r < 0.94 ? 'shipping' : 'cancelled';
        }
        if (channel === 'shopee' || channel === 'tiktok') status = status === 'pending' ? 'confirmed' : status;

        let paymentStatus = 'unpaid';
        if (paymentMethod === 'platform' || paymentMethod === 'bank' || paymentMethod === 'card' || paymentMethod === 'momo') {
          paymentStatus = status === 'cancelled' ? (chance(0.5) ? 'refunded' : 'unpaid') : 'paid';
        } else if (status === 'completed') paymentStatus = 'paid';

        orders.push({
          id: 'OD-' + seq, code: 'MT' + String(createdAt.getFullYear()).slice(-2) + String(createdAt.getMonth() + 1).padStart(2, '0') + String(seq).padStart(4, '0'),
          createdAt: createdAt.toISOString(),
          channel,
          customer: {
            name: customer.name, phone: customer.phone, email: customer.email,
            address: customer.address, province: customer.province, note: chance(0.18) ? pick(['Giao giờ hành chính', 'Gọi trước khi giao', 'Để hàng ở bảo vệ', '']): '',
          },
          items, subtotal, discount, couponCode,
          shippingFee, total, paymentMethod, paymentStatus, status,
          source: 'seed',
          timeline: buildTimeline(createdAt, status, paymentMethod, paymentStatus),
        });
      }

      // Đơn sỉ cho CLB / doanh nghiệp
      const wholesaleCount = back === 0 ? (days > 10 ? 1 : 0) : int(1, 3);
      for (let j = 0; j < wholesaleCount; j++) {
        seq += 1;
        const org = pick(orgSeeds);
        const product = pick(MT.catalog.products.filter((p) => ['SP-011', 'SP-012', 'SP-002', 'SP-005'].includes(p.id)));
        const qty = int(8, 22);
        const createdAt = new Date(monthDate.getFullYear(), monthDate.getMonth(), int(1, days), int(9, 17), int(0, 59), 0);
        const items = [{
          productId: product.id, name: product.name, variant: '', price: product.price,
          cost: product.cost, qty, image: product.images[0],
        }];
        const subtotal = product.price * qty;
        const discount = Math.round(subtotal * (0.12 + rand() * 0.06));
        const total = subtotal - discount;
        const status = back > 1 ? 'completed' : (chance(0.7) ? 'completed' : 'shipping');
        orders.push({
          id: 'OD-' + seq, code: 'MT' + String(createdAt.getFullYear()).slice(-2) + String(createdAt.getMonth() + 1).padStart(2, '0') + String(seq).padStart(4, '0'),
          createdAt: createdAt.toISOString(), channel: 'wholesale',
          customer: { name: org.name, phone: org.phone, email: org.email, address: org.address, province: org.province, note: 'Đơn sỉ CLB — xuất hoá đơn bán hàng' },
          items, subtotal, discount, couponCode: '', shippingFee: 0, total,
          paymentMethod: 'bank', paymentStatus: 'paid', status, source: 'seed',
          timeline: buildTimeline(createdAt, status, 'bank', 'paid'),
        });
      }
    }
    return util.sortBy(orders, (o) => new Date(o.createdAt), 'asc');
  }

  function buildTimeline(createdAt, status, paymentMethod, paymentStatus) {
    const steps = [
      ['pending', 'Khách đặt hàng'],
      ['confirmed', 'Đã xác nhận đơn'],
      ['packing', 'Đang đóng gói'],
      ['shipping', 'Bàn giao vận chuyển'],
      ['completed', 'Giao hàng thành công'],
    ];
    if (status === 'cancelled') {
      return [
        { status: 'pending', label: 'Khách đặt hàng', at: createdAt.toISOString() },
        { status: 'cancelled', label: 'Đơn đã huỷ', at: new Date(new Date(createdAt).getTime() + 3600000 * 6).toISOString() },
      ];
    }
    const idx = steps.findIndex((s) => s[0] === status);
    const out = [];
    for (let i = 0; i <= idx; i++) {
      const at = new Date(new Date(createdAt).getTime() + i * 3600000 * 13);
      out.push({ status: steps[i][0], label: steps[i][1], at: at.toISOString() });
    }
    if (paymentStatus === 'paid') {
      out.push({ status: 'payment', label: paymentMethod === 'cod' ? 'Đã thu tiền khi giao' : 'Đã thanh toán', at: new Date(new Date(createdAt).getTime() + 3600000 * 2).toISOString() });
    }
    return out;
  }

  function buildTasks(now) {
    const d = (n) => util.fmt.dateInput(util.addDays(now, n));
    const at = (daysAgo, hour) => new Date(util.addDays(now, -daysAgo).setHours(hour || 10, 30, 0, 0)).toISOString();
    const ev = (id, type, extra) => Object.assign({ id, type, by: 'MB-01', at: at(2, 14) }, extra || {});

    return [
      {
        id: 'TK-01', code: 'CV-001', title: 'Chốt đơn sỉ CLB Yoga Sen Xanh',
        desc: 'Gặp Ban chủ nhiệm, trình bày bảng giá sỉ 15 CLB và chốt đơn tối thiểu 30 bộ Combo Tân khách hàng. Ghi lại phản hồi về mức chiết khấu.',
        assigneeId: 'MB-01', priority: 'high', status: 'doing', progress: 60,
        dueDate: d(2), createdAt: at(6), estimateHours: 6, actualHours: 4, tags: ['Bán sỉ', 'CLB'],
        evidence: [
          ev('EV-01', 'text', { text: 'Đã gặp chị Hạnh (chủ nhiệm CLB) lúc 15h. CLB đồng ý lấy 32 bộ, đề nghị chiết khấu 17% và giao trước 25/11. Đang chờ xác nhận lại bằng tin nhắn.', at: at(1, 16) }),
          ev('EV-02', 'image', { url: U('photo-1556761175-b413da4baf72', 900), name: 'buoi-gap-clb.jpg', note: 'Ảnh tại buổi làm việc với Ban chủ nhiệm', at: at(1, 16) }),
        ],
        activity: [
          { at: at(6), text: 'Giao việc cho Lại Trọng Việt', by: 'MB-01' },
          { at: at(2), text: 'Cập nhật tiến độ 40%', by: 'MB-01' },
          { at: at(1, 16), text: 'Nộp bằng chứng: ảnh buổi làm việc', by: 'MB-01' },
        ],
      },
      {
        id: 'TK-02', code: 'CV-002', title: 'Quay video review Combo Tân khách hàng',
        desc: 'Sản xuất 3 video ngắn 30-45 giây cho TikTok và Reels: unbox, texture, routine 3 bước. Có phụ đề tiếng Việt và nhạc trending.',
        assigneeId: 'MB-05', priority: 'urgent', status: 'review', progress: 85,
        dueDate: d(1), createdAt: at(8), estimateHours: 10, actualHours: 11, tags: ['Content', 'TikTok'],
        evidence: [
          ev('EV-03', 'text', { text: 'Đã dựng xong 3 clip, đang chờ duyệt caption. Clip 1 đã đăng nháp, đạt 12.4k view sau 18 giờ.', at: at(0, 9) }),
          ev('EV-04', 'image', { url: U('photo-1611162617213-7d7a39e9b1d7', 900), name: 'storyboard-tiktok.jpg', note: 'Storyboard 3 clip', at: at(0, 9) }),
        ],
        activity: [
          { at: at(8), text: 'Giao việc cho Đỗ Minh Khang', by: 'MB-01' },
          { at: at(1), text: 'Chuyển sang Chờ duyệt', by: 'MB-05' },
        ],
      },
      {
        id: 'TK-03', code: 'CV-003', title: 'Đối soát doanh thu Shopee tháng 10',
        desc: 'Đối chiếu doanh thu, phí sàn, phí ship và tiền hoàn trả. Xuất bảng đối soát và xác nhận số tiền Shopee sẽ chuyển về.',
        assigneeId: 'MB-04', priority: 'high', status: 'done', progress: 100,
        dueDate: d(-3), createdAt: at(15), completedAt: at(4), estimateHours: 4, actualHours: 3.5, tags: ['Tài chính', 'Shopee'],
        evidence: [
          ev('EV-05', 'text', { text: 'Doanh thu Shopee tháng 10: 38.640.000đ. Phí sàn 4.443.600đ, phí ship 1.120.000đ. Số tiền về tài khoản: 33.076.400đ. Khớp với sao kê ngày 05/11.', at: at(4, 11) }),
        ],
        activity: [{ at: at(15), text: 'Giao việc cho Nguyễn Thị Hà Anh', by: 'MB-01' }, { at: at(4), text: 'Hoàn thành nhiệm vụ', by: 'MB-04' }],
      },
      {
        id: 'TK-04', code: 'CV-004', title: 'Bổ sung ảnh thực tế cho landing phấn phủ',
        desc: 'Chụp 6 ảnh: texture phấn, swatch 3 tông, ảnh model, ảnh hộp sản phẩm. Upload vào thư mục website/assets.',
        assigneeId: 'MB-05', priority: 'medium', status: 'doing', progress: 40,
        dueDate: d(4), createdAt: at(5), estimateHours: 5, actualHours: 2, tags: ['Content', 'Website'],
        evidence: [
          ev('EV-06', 'image', { url: U('photo-1596462502278-27bfdc403348', 900), name: 'swatch-3-tong.jpg', note: 'Swatch 3 tông dưới ánh sáng tự nhiên', at: at(1, 15) }),
        ],
        activity: [{ at: at(5), text: 'Giao việc cho Đỗ Minh Khang', by: 'MB-01' }, { at: at(1), text: 'Cập nhật tiến độ 40%', by: 'MB-05' }],
      },
      {
        id: 'TK-05', code: 'CV-005', title: 'Nhập lô serum vitamin C đợt 2',
        desc: 'Liên hệ nhà cung cấp, xác nhận giá và thời gian giao 200 chai. Kiểm tra hạn sử dụng tối thiểu 18 tháng.',
        assigneeId: 'MB-02', priority: 'high', status: 'todo', progress: 0,
        dueDate: d(5), createdAt: at(2), estimateHours: 3, tags: ['Nguồn hàng'],
        evidence: [], activity: [{ at: at(2), text: 'Giao việc cho Vũ Tiến Thiện Lam', by: 'MB-01' }],
      },
      {
        id: 'TK-06', code: 'CV-006', title: 'Chốt bảng giá sỉ cho 15 CLB',
        desc: 'Hoàn thiện bảng giá 3 mức theo số lượng, kèm chính sách đổi trả và quà tặng. Xuất PDF gửi Ban chủ nhiệm.',
        assigneeId: 'MB-01', priority: 'high', status: 'review', progress: 90,
        dueDate: d(2), createdAt: at(10), estimateHours: 5, actualHours: 4, tags: ['Bán sỉ', 'CLB'],
        evidence: [
          ev('EV-07', 'text', { text: 'Đã hoàn thiện 3 mức giá: 10-20 bộ (10%), 21-40 bộ (15%), từ 41 bộ (18%). Chờ chị Hà Anh kiểm tra lại biên lợi nhuận.', at: at(1, 10) }),
        ],
        activity: [{ at: at(10), text: 'Giao việc cho Lại Trọng Việt', by: 'MB-01' }, { at: at(1), text: 'Chuyển sang Chờ duyệt', by: 'MB-01' }],
      },
      {
        id: 'TK-07', code: 'CV-007', title: 'Chạy thử nghiệm ads TikTok 3 ngày',
        desc: 'Ngân sách 1.500.000đ/ngày. Nhắm 2 nhóm: nữ 22-34 quan tâm skincare và phụ huynh mua quà. Đo CPM, CTR, CPA.',
        assigneeId: 'MB-05', priority: 'high', status: 'doing', progress: 55,
        dueDate: d(3), createdAt: at(4), estimateHours: 6, actualHours: 3, tags: ['Marketing', 'TikTok'],
        evidence: [
          ev('EV-08', 'text', { text: 'Ngày 1: 4.2tr impressions, CTR 1.8%, CPA 92k — cao hơn mục tiêu 70k. Đang thử đổi hook 3 giây đầu.', at: at(0, 8) }),
        ],
        activity: [{ at: at(4), text: 'Giao việc cho Đỗ Minh Khang', by: 'MB-01' }, { at: at(0), text: 'Cập nhật tiến độ 55%', by: 'MB-05' }],
      },
      {
        id: 'TK-08', code: 'CV-008', title: 'Cập nhật tồn kho sau kiểm kê',
        desc: 'Kiểm kê thực tế toàn bộ SKU, đối chiếu với hệ thống và điều chỉnh chênh lệch. Ghi nhận hàng lỗi, hàng hết hạn.',
        assigneeId: 'MB-02', priority: 'medium', status: 'done', progress: 100,
        dueDate: d(-5), createdAt: at(12), completedAt: at(5), estimateHours: 4, actualHours: 5, tags: ['Kho vận'],
        evidence: [
          ev('EV-09', 'image', { url: U('photo-1586528116311-ad8dd3c8310d', 900), name: 'kiem-ke-kho.jpg', note: 'Biên bản kiểm kê có chữ ký 2 thành viên', at: at(5, 17) }),
          ev('EV-10', 'text', { text: 'Chênh lệch 3 chai serum (hết hạn), 2 hộp phấn móp. Đã điều chỉnh giảm kho và tạo phiếu xuất huỷ.', at: at(5, 17) }),
        ],
        activity: [{ at: at(12), text: 'Giao việc cho Vũ Tiến Thiện Lam', by: 'MB-01' }, { at: at(5), text: 'Hoàn thành nhiệm vụ', by: 'MB-02' }],
      },
      {
        id: 'TK-09', code: 'CV-009', title: 'Gửi báo cáo tài chính tháng 10',
        desc: 'Tổng hợp P&L, dòng tiền, công nợ và thuế. Gửi trước ngày 05/11 cho ban điều hành.',
        assigneeId: 'MB-04', priority: 'high', status: 'done', progress: 100,
        dueDate: d(-6), createdAt: at(16), completedAt: at(6), estimateHours: 5, actualHours: 4, tags: ['Tài chính'],
        evidence: [{ id: 'EV-11', type: 'text', text: 'Đã gửi báo cáo 04/11. Doanh thu 42.8tr, lợi nhuận ròng 3.1tr, dòng tiền dương 6.4tr. File lưu tại drive tài chính.', by: 'MB-04', at: at(6, 9) }],
        activity: [{ at: at(16), text: 'Giao việc cho Nguyễn Thị Hà Anh', by: 'MB-01' }, { at: at(6), text: 'Hoàn thành nhiệm vụ', by: 'MB-04' }],
      },
      {
        id: 'TK-10', code: 'CV-010', title: 'Tuyển CTV bán hàng thời vụ Tết',
        desc: 'Đăng tuyển 5 CTV cho mùa Tết 2027, phỏng vấn và đào tạo quy trình tư vấn, chốt đơn.',
        assigneeId: 'MB-03', priority: 'medium', status: 'todo', progress: 0,
        dueDate: d(9), createdAt: at(3), estimateHours: 8, tags: ['Nhân sự', 'Tết'],
        evidence: [], activity: [{ at: at(3), text: 'Giao việc cho Hoàng Thu Hương', by: 'MB-01' }],
      },
      {
        id: 'TK-11', code: 'CV-011', title: 'Thiết kế banner Tết 2027',
        desc: 'Thiết kế banner website và ảnh bìa fanpage chủ đề Tết, tông đỏ son — hồng đào, có logo Mây Trắng.',
        assigneeId: 'MB-05', priority: 'medium', status: 'todo', progress: 15,
        dueDate: d(-1), createdAt: at(9), estimateHours: 6, tags: ['Thiết kế', 'Tết'],
        evidence: [{ id: 'EV-12', type: 'text', by: 'MB-05', text: 'Đã phác 2 hướng màu, đang chờ duyệt hướng đỏ son.', at: at(1, 11) }],
        activity: [{ at: at(9), text: 'Giao việc cho Đỗ Minh Khang', by: 'MB-01' }],
      },
      {
        id: 'TK-12', code: 'CV-012', title: 'Gọi lại 20 khách hàng chưa chốt',
        desc: 'Danh sách khách đã thêm giỏ nhưng chưa thanh toán trong 14 ngày. Tư vấn, gửi mã ưu đãi WELCOME50.',
        assigneeId: 'MB-03', priority: 'high', status: 'doing', progress: 45,
        dueDate: d(1), createdAt: at(3), estimateHours: 4, actualHours: 2, tags: ['Bán hàng', 'CRM'],
        evidence: [
          ev('EV-13', 'text', { text: 'Đã gọi 9/20 khách, 3 khách chốt đơn (tổng 1.240.000đ). 4 khách hẹn gọi lại cuối tuần, 2 khách không nghe máy.', at: at(0, 11) }),
        ],
        activity: [{ at: at(3), text: 'Giao việc cho Hoàng Thu Hương', by: 'MB-01' }, { at: at(0), text: 'Cập nhật tiến độ 45%', by: 'MB-03' }],
      },
      {
        id: 'TK-13', code: 'CV-013', title: 'Hoàn thiện hồ sơ thuế hộ kinh doanh',
        desc: 'Chuẩn bị hồ sơ khai thuế quý IV, đối chiếu doanh thu trên hoá đơn và sổ sách. Nộp trước 20/01/2027.',
        assigneeId: 'MB-04', priority: 'high', status: 'review', progress: 80,
        dueDate: d(12), createdAt: at(7), estimateHours: 5, actualHours: 4, tags: ['Thuế', 'Pháp lý'],
        evidence: [
          ev('EV-14', 'text', { text: 'Đã chuẩn bị đủ: tờ khai, bảng kê doanh thu, chứng từ chi phí. Còn thiếu xác nhận của kế toán dịch vụ.', at: at(1, 9) }),
        ],
        activity: [{ at: at(7), text: 'Giao việc cho Nguyễn Thị Hà Anh', by: 'MB-01' }, { at: at(1), text: 'Chuyển sang Chờ duyệt', by: 'MB-04' }],
      },
      {
        id: 'TK-14', code: 'CV-014', title: 'Kiểm tra feedback 1-2 sao trên Shopee',
        desc: 'Phản hồi toàn bộ đánh giá dưới 3 sao trong 30 ngày, phân loại nguyên nhân và đề xuất cải thiện đóng gói.',
        assigneeId: 'MB-03', priority: 'medium', status: 'done', progress: 100,
        dueDate: d(-2), createdAt: at(8), completedAt: at(2), estimateHours: 2, actualHours: 2, tags: ['CSKH', 'Shopee'],
        evidence: [
          ev('EV-15', 'text', { text: 'Có 7 đánh giá dưới 3 sao: 4 do giao chậm, 2 do hộp móp, 1 do kỳ vọng màu. Đã phản hồi 100%, tặng voucher cho 3 khách.', at: at(2, 16) }),
        ],
        activity: [{ at: at(8), text: 'Giao việc cho Hoàng Thu Hương', by: 'MB-01' }, { at: at(2), text: 'Hoàn thành nhiệm vụ', by: 'MB-03' }],
      },
      {
        id: 'TK-15', code: 'CV-015', title: 'Chuẩn bị booth bán tại sân tập',
        desc: 'Đăng ký booth cuối tuần, chuẩn bị bàn, standee, máy POS và 50 bộ Combo Tân khách hàng. Phân công 2 bạn trực.',
        assigneeId: 'MB-01', priority: 'medium', status: 'todo', progress: 0,
        dueDate: d(3), createdAt: at(2), estimateHours: 5, tags: ['Sự kiện', 'Bán hàng'],
        evidence: [], activity: [{ at: at(2), text: 'Giao việc cho Lại Trọng Việt', by: 'MB-01' }],
      },
      {
        id: 'TK-16', code: 'CV-016', title: 'Chụp ảnh bộ sản phẩm mới',
        desc: 'Chụp 5 SKU mới trên nền trắng và nền lifestyle, xuất file 2000px cho website và sàn TMĐT.',
        assigneeId: 'MB-05', priority: 'medium', status: 'done', progress: 100,
        dueDate: d(-4), createdAt: at(14), completedAt: at(4), estimateHours: 7, actualHours: 6, tags: ['Content', 'Nhiếp ảnh'],
        evidence: [
          ev('EV-16', 'image', { url: U('photo-1522335789203-aabd1fc54bc9', 900), name: 'bo-anh-san-pham.jpg', note: 'Preview ảnh bộ sản phẩm mới', at: at(4, 15) }),
        ],
        activity: [{ at: at(14), text: 'Giao việc cho Đỗ Minh Khang', by: 'MB-01' }, { at: at(4), text: 'Hoàn thành nhiệm vụ', by: 'MB-05' }],
      },
    ];
  }

  function buildReviews(now) {
    return MT.content.reviewsSeed.map((r, i) => ({
      id: 'RV-' + String(i + 1).padStart(3, '0'),
      productId: r.productId,
      name: r.name,
      rating: r.rating,
      text: r.text,
      verified: r.verified,
      at: new Date(new Date(now).setDate(now.getDate() - r.daysAgo)).toISOString(),
      source: 'seed',
    }));
  }

  function build() {
    const now = new Date();
    const settings = baseSettings();
    return {
      settings,
      orders: buildOrders(settings),
      members: memberSeeds.map((m) => Object.assign({}, m)),
      tasks: buildTasks(now),
      reviews: buildReviews(now),
      coupons: couponSeeds.map((c) => Object.assign({}, c)),
      subscribers: [
        { email: 'ngocanh@gmail.com', at: new Date(now.getTime() - 86400000 * 12).toISOString() },
        { email: 'thuha@gmail.com', at: new Date(now.getTime() - 86400000 * 8).toISOString() },
        { email: 'maichi@gmail.com', at: new Date(now.getTime() - 86400000 * 3).toISOString() },
      ],
    };
  }

  return { build, baseSettings, customerSeeds, orgSeeds };
})();
