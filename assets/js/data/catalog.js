/* ==========================================================================
   MÂY TRẮNG – Danh mục sản phẩm (nguồn dữ liệu gốc)
   ========================================================================== */
window.MT = window.MT || {};

MT.catalog = (function () {
  const IMG = 'assets/img/products/';
  const ING = 'assets/img/ingredients/';
  const HERO = 'assets/img/hero/';
  const U = (id, w) => 'https://images.unsplash.com/' + id + '?auto=format&fit=crop&w=' + (w || 900) + '&q=80';

  const categories = [
    { id: 'all', name: 'Tất cả sản phẩm', short: 'Tất cả' },
    { id: 'skincare', name: 'Chăm sóc da', short: 'Chăm sóc da' },
    { id: 'makeup', name: 'Trang điểm', short: 'Trang điểm' },
    { id: 'suncare', name: 'Chống nắng', short: 'Chống nắng' },
    { id: 'body', name: 'Chăm sóc cơ thể', short: 'Cơ thể' },
    { id: 'combo', name: 'Combo ưu đãi', short: 'Combo' },
  ];

  const products = [
    {
      id: 'SP-001', slug: 'phan-phu-kiem-dau-may-trang', sku: 'MT-PP-001',
      name: 'Phấn phủ kiềm dầu Mây Trắng', cat: 'makeup', price: 289000, compareAt: 350000, cost: 112000,
      stock: 128, sold: 1248, rating: 4.9, reviewCount: 214, volume: '8g', weight: 60,
      badge: 'Bán chạy', featured: true, deal: true, dealQty: 40, dealSold: 31,
      short: 'Mỏng nhẹ như mây, kiềm dầu 8 giờ, finish trong veo tự nhiên.',
      description:
        '<p>Phấn phủ Mây Trắng được nghiền mịn từ bột khoáng và chiết xuất trà xanh, cho lớp phủ mỏng nhẹ như mây nhưng vẫn kiểm soát dầu hiệu quả suốt 8 giờ. Hạt phấn siêu mịn giúp che phủ lỗ chân lông, làm mờ khuyết điểm nhỏ mà không gây cảm giác nặng mặt.</p>' +
        '<p>Công thức không cồn, không hương liệu tổng hợp, phù hợp cả với làn da nhạy cảm. Finish lì nhẹ, tự nhiên, không bết dính khi thời tiết nóng ẩm.</p>',
      benefits: ['Kiềm dầu 8 giờ, giảm bóng nhờn', 'Che phủ tự nhiên, không bít lỗ chân lông', 'Bột khoáng dịu nhẹ, an toàn cho da nhạy cảm', 'Thiết kế hộp gương tiện mang theo'],
      ingredients: 'Mica, Silica, Zinc Oxide, Trà xanh (Camellia Sinensis), Vitamin E, Bisabolol. Không paraben, không hương liệu tổng hợp.',
      usage: ['Dùng sau bước kem lót/kem nền.', 'Lấy lượng vừa đủ, gõ nhẹ lên nắp để tán đều.', 'Phủ từ vùng chữ T ra ngoài, dặm thêm khi cần.'],
      skin: ['Da dầu', 'Da hỗn hợp', 'Da nhạy cảm'],
      images: [IMG + 'sp-001-a.svg', IMG + 'sp-001-b.svg', ING + 'tea.svg'],
      variants: [{ name: 'Sáng tự nhiên', sku: 'MT-PP-001-01' }, { name: 'Tự nhiên', sku: 'MT-PP-001-02' }, { name: 'Hồng đào', sku: 'MT-PP-001-03' }],
    },
    {
      id: 'SP-002', slug: 'kem-duong-am-sen-hong', sku: 'MT-KD-002',
      name: 'Kem dưỡng ẩm sen hồng', cat: 'skincare', price: 329000, compareAt: 390000, cost: 128000,
      stock: 96, sold: 986, rating: 4.8, reviewCount: 168, volume: '50ml', weight: 120,
      badge: '', featured: true, deal: false,
      short: 'Cấp ẩm sâu, làm dịu da nhạy cảm với chiết xuất sen hồng Việt Nam.',
      description:
        '<p>Kem dưỡng ẩm sen hồng kết hợp nước sen cô đặc, rau má và ceramide thực vật giúp phục hồi hàng rào ẩm, làm dịu cảm giác căng rát do khô hạn. Kết cấu gel-cream mỏng nhẹ, thấm nhanh, không gây bí da.</p>' +
        '<p>Sau 2 tuần sử dụng, làn da mềm mại hơn, giảm bong tróc và giữ ẩm tự nhiên suốt 24 giờ. Phù hợp dùng sáng và tối.</p>',
      benefits: ['Cấp ẩm 24 giờ, phục hồi hàng rào da', 'Làm dịu da đỏ, da yếu sau treatment', 'Kết cấu nhẹ, không gây bí da', 'Chiết xuất sen hồng trồng tại Đồng Tháp'],
      ingredients: 'Nước sen hồng, Glycerin, Rau má, Ceramide NP, Squalane, Panthenol, Hyaluronic Acid.',
      usage: ['Làm sạch và cân bằng da.', 'Lấy 2 hạt đậu kem, chấm đều 5 điểm.', 'Massage nhẹ theo chiều kim đồng hồ đến khi thấm.'],
      skin: ['Da khô', 'Da nhạy cảm', 'Mọi loại da'],
      images: [IMG + 'sp-002-a.svg', IMG + 'sp-002-b.svg', ING + 'lotus.svg'],
      variants: [],
    },
    {
      id: 'SP-003', slug: 'kem-nen-duong-da-nhe', sku: 'MT-KN-003',
      name: 'Kem nền dưỡng da nhẹ', cat: 'makeup', price: 359000, compareAt: 0, cost: 142000,
      stock: 74, sold: 642, rating: 4.7, reviewCount: 112, volume: '30ml', weight: 90,
      badge: 'Mới', featured: true, deal: false,
      short: 'Che phủ tự nhiên, dưỡng ẩm, không gây bít lỗ chân lông.',
      description:
        '<p>Kem nền Mây Trắng cho lớp nền mỏng nhẹ, che phủ trung bình mà vẫn giữ được độ trong tự nhiên của da. Công thức chứa niacinamide và chiết xuất trà xanh giúp làm đều màu, giảm thâm sau một thời gian dùng.</p>' +
        '<p>Chất kem dễ tán, không cakey, không oxy hoá. Có thể dùng tay, cọ hoặc mút ẩm mà vẫn cho finish đẹp.</p>',
      benefits: ['Che phủ trung bình, tự nhiên', 'Dưỡng da với niacinamide', 'Không gây bít lỗ chân lông', 'Bền màu 10 giờ'],
      ingredients: 'Nước tinh khiết, Titanium Dioxide, Niacinamide, Trà xanh, Glycerin, Squalane, Vitamin E.',
      usage: ['Lắc đều trước khi dùng.', 'Lấy một lượng bằng hạt đậu, tán đều từ giữa mặt.', 'Dặm thêm lớp mỏng ở vùng cần che phủ.'],
      skin: ['Da thường', 'Da hỗn hợp', 'Da dầu'],
      images: [IMG + 'sp-003-a.svg', IMG + 'sp-003-b.svg', ING + 'tea.svg'],
      variants: [{ name: 'Sáng 01', sku: 'MT-KN-003-01' }, { name: 'Tự nhiên 02', sku: 'MT-KN-003-02' }, { name: 'Be ấm 03', sku: 'MT-KN-003-03' }],
    },
    {
      id: 'SP-004', slug: 'kem-chong-nang-vo-co', sku: 'MT-CN-004',
      name: 'Kem chống nắng vô cơ', cat: 'suncare', price: 399000, compareAt: 450000, cost: 158000,
      stock: 82, sold: 721, rating: 4.8, reviewCount: 156, volume: '50ml', weight: 120,
      badge: '', featured: true, deal: true, dealQty: 30, dealSold: 19,
      short: 'Bảo vệ phổ rộng SPF50+ PA++++, nâng tông nhẹ, an toàn cho da nhạy cảm.',
      description:
        '<p>Kem chống nắng vô cơ sử dụng Zinc Oxide và Titanium Dioxide, tạo màng chắn vật lý trước tia UVA/UVB mà không gây kích ứng. Chỉ số SPF50+ PA++++ bảo vệ da trước tác động của nắng và ánh sáng xanh.</p>' +
        '<p>Kết cấu mỏng nhẹ, nâng tông tự nhiên, không vệt trắng. Phù hợp dùng hằng ngày, kể cả khi trang điểm.</p>',
      benefits: ['SPF50+ PA++++ phổ rộng', 'Nâng tông nhẹ, không bết dính', 'Không thấm vào da, an toàn cho da nhạy cảm', 'Kháng nước nhẹ, phù hợp khí hậu nóng ẩm'],
      ingredients: 'Zinc Oxide 18%, Titanium Dioxide 6%, Squalane, Trà xanh, Vitamin E, Glycerin.',
      usage: ['Dùng sau bước dưỡng ẩm, trước trang điểm.', 'Thoa lượng đủ 2 đốt ngón tay cho toàn mặt và cổ.', 'Thoa lại mỗi 2-3 giờ khi ở ngoài trời.'],
      skin: ['Da nhạy cảm', 'Da dầu', 'Mọi loại da'],
      images: [IMG + 'sp-004-a.svg', IMG + 'sp-004-b.svg', ING + 'centella.svg'],
      variants: [],
    },
    {
      id: 'SP-005', slug: 'sua-rua-mat-rau-ma', sku: 'MT-SRM-005',
      name: 'Sữa rửa mặt dịu nhẹ rau má', cat: 'skincare', price: 219000, compareAt: 0, cost: 76000,
      stock: 180, sold: 1420, rating: 4.7, reviewCount: 240, volume: '120ml', weight: 150,
      badge: 'Bán chạy', featured: true, deal: false,
      short: 'Làm sạch sâu mà không khô căng, chiết xuất rau má làm dịu da.',
      description:
        '<p>Sữa rửa mặt gốc amino acid nhẹ nhàng loại bỏ bụi bẩn, dầu thừa và kem chống nắng mà vẫn giữ được độ ẩm tự nhiên. Rau má và trà xanh giúp làm dịu các vùng da mẩn đỏ, giảm mụn ẩn.</p>' +
        '<p>Bọt mịn, không xà phòng, độ pH 5.5 cân bằng với da. Dùng được cho cả da dầu mụn và da nhạy cảm.</p>',
      benefits: ['Làm sạch sâu, không khô căng', 'pH 5.5 cân bằng', 'Rau má làm dịu, giảm mẩn đỏ', 'Phù hợp da dầu mụn'],
      ingredients: 'Nước rau má, Sodium Cocoyl Isethionate, Glycerin, Trà xanh, Panthenol, Allantoin.',
      usage: ['Làm ướt mặt, lấy lượng vừa đủ tạo bọt.', 'Massage 30-60 giây, tránh vùng mắt.', 'Rửa lại với nước ấm và lau khô.'],
      skin: ['Da dầu', 'Da mụn', 'Da nhạy cảm'],
      images: [IMG + 'sp-005-a.svg', IMG + 'sp-005-b.svg', ING + 'centella.svg'],
      variants: [],
    },
    {
      id: 'SP-006', slug: 'tay-trang-nuoc-hoa-hong', sku: 'MT-TT-006',
      name: 'Tẩy trang nước hoa hồng', cat: 'skincare', price: 249000, compareAt: 0, cost: 88000,
      stock: 110, sold: 640, rating: 4.6, reviewCount: 96, volume: '150ml', weight: 180,
      badge: '', featured: false, deal: false,
      short: 'Tan lớp trang điểm và kem chống nắng chỉ trong một lần lau.',
      description:
        '<p>Nước tẩy trang micellar với nước hoa hồng và micelle dịu nhẹ giúp loại bỏ hoàn toàn lớp trang điểm, kem chống nắng và dầu thừa mà không cần chà xát mạnh. Da sạch thoáng, mềm mại, không nhờn dính.</p>' +
        '<p>Không cồn, không hương liệu tổng hợp, an toàn cho vùng da quanh mắt.</p>',
      benefits: ['Sạch makeup và chống nắng chỉ 1 lần', 'Không cồn, không gây khô', 'Nước hoa hồng làm dịu da', 'Dùng được cho vùng mắt'],
      ingredients: 'Nước hoa hồng, Poloxamer 184, Glycerin, Panthenol, Sodium Hyaluronate.',
      usage: ['Thấm đủ ướt bông tẩy trang.', 'Giữ trên da 5-10 giây rồi lau nhẹ.', 'Rửa lại bằng sữa rửa mặt.'],
      skin: ['Mọi loại da', 'Da nhạy cảm'],
      images: [IMG + 'sp-006-a.svg', IMG + 'sp-006-b.svg', ING + 'lotus.svg'],
      variants: [],
    },
    {
      id: 'SP-007', slug: 'serum-vitamin-c-tra-xanh', sku: 'MT-SR-007',
      name: 'Serum vitamin C trà xanh', cat: 'skincare', price: 459000, compareAt: 520000, cost: 176000,
      stock: 58, sold: 423, rating: 4.8, reviewCount: 88, volume: '30ml', weight: 70,
      badge: 'Mới', featured: true, deal: false,
      short: 'Làm sáng da, mờ thâm và chống oxy hoá với 12% vitamin C.',
      description:
        '<p>Serum vitamin C nồng độ 12% kết hợp trà xanh và vitamin E giúp làm sáng da, mờ thâm nám và bảo vệ da trước gốc tự do. Công thức ổn định, không gây châm chích.</p>' +
        '<p>Dùng đều đặn mỗi sáng, làn da trở nên đều màu và rạng rỡ hơn sau 4 tuần.</p>',
      benefits: ['12% vitamin C làm sáng, mờ thâm', 'Chống oxy hoá với trà xanh', 'Kết cấu lỏng, thấm nhanh', 'Không cồn, không gây kích ứng'],
      ingredients: 'Ascorbic Acid 12%, Trà xanh, Vitamin E, Ferulic Acid, Glycerin, Hyaluronic Acid.',
      usage: ['Dùng sau toner, trước kem dưỡng.', 'Lấy 3-4 giọt, vỗ đều lên mặt.', 'Buổi sáng cần dùng kèm kem chống nắng.'],
      skin: ['Da thường', 'Da xỉn màu', 'Da dầu'],
      images: [IMG + 'sp-007-a.svg', IMG + 'sp-007-b.svg', ING + 'tea.svg'],
      variants: [],
    },
    {
      id: 'SP-008', slug: 'mat-na-dat-set-tra-xanh', sku: 'MT-MN-008',
      name: 'Mặt nạ đất sét trà xanh', cat: 'skincare', price: 189000, compareAt: 0, cost: 62000,
      stock: 140, sold: 890, rating: 4.5, reviewCount: 132, volume: '100g', weight: 140,
      badge: '', featured: false, deal: true, dealQty: 35, dealSold: 28,
      short: 'Hút dầu thừa, se khít lỗ chân lông, làm dịu da mụn.',
      description:
        '<p>Mặt nạ đất sét trà xanh kết hợp kaolin và bentonite giúp hút sạch dầu thừa, bụi bẩn trong lỗ chân lông. Trà xanh và rau má làm dịu vùng da mụn, giảm sưng đỏ.</p>' +
        '<p>Kết cấu mịn, dễ rửa, không làm khô căng da sau khi dùng.</p>',
      benefits: ['Hút dầu, se khít lỗ chân lông', 'Giảm mụn và mẩn đỏ', 'Không gây khô căng', 'Dùng 2 lần/tuần'],
      ingredients: 'Kaolin, Bentonite, Trà xanh, Rau má, Glycerin, Zinc PCA.',
      usage: ['Rửa mặt sạch và lau khô.', 'Thoa lớp mỏng, tránh vùng mắt và môi.', 'Để 10-12 phút rồi rửa sạch với nước ấm.'],
      skin: ['Da dầu', 'Da mụn', 'Da hỗn hợp'],
      images: [IMG + 'sp-008-a.svg', IMG + 'sp-008-b.svg', ING + 'tea.svg'],
      variants: [],
    },
    {
      id: 'SP-009', slug: 'xit-khoang-hoa-sen', sku: 'MT-XK-009',
      name: 'Xịt khoáng hoa sen', cat: 'skincare', price: 169000, compareAt: 0, cost: 52000,
      stock: 220, sold: 1130, rating: 4.6, reviewCount: 118, volume: '100ml', weight: 130,
      badge: '', featured: false, deal: false,
      short: 'Cấp ẩm tức thì, làm dịu da, dùng được cả khi đang trang điểm.',
      description:
        '<p>Xịt khoáng hoa sen với nước sen cất và khoáng vi lượng giúp cấp ẩm tức thì, làm dịu da khô và mẩn đỏ. Hạt xịt mịn, không làm trôi lớp trang điểm.</p>' +
        '<p>Mang theo bên mình để làm mới làn da bất cứ lúc nào trong ngày.</p>',
      benefits: ['Cấp ẩm tức thì', 'Làm dịu da nóng, mẩn đỏ', 'Không làm trôi trang điểm', 'Hương sen tự nhiên nhẹ'],
      ingredients: 'Nước hoa sen, Nước khoáng, Glycerin, Panthenol, Sodium PCA.',
      usage: ['Giữ cách mặt 20cm và xịt đều.', 'Vỗ nhẹ để thấm.', 'Dùng trước hoặc sau trang điểm khi cần.'],
      skin: ['Mọi loại da', 'Da khô', 'Da nhạy cảm'],
      images: [IMG + 'sp-009-a.svg', IMG + 'sp-009-b.svg', ING + 'lotus.svg'],
      variants: [],
    },
    {
      id: 'SP-010', slug: 'son-duong-dau-dua', sku: 'MT-SD-010',
      name: 'Son dưỡng dầu dừa', cat: 'makeup', price: 129000, compareAt: 0, cost: 38000,
      stock: 260, sold: 2050, rating: 4.7, reviewCount: 302, volume: '4g', weight: 30,
      badge: 'Yêu thích', featured: false, deal: false,
      short: 'Dưỡng môi mềm mịn với dầu dừa Bến Tre, màu tự nhiên.',
      description:
        '<p>Son dưỡng dầu dừa Bến Tre kết hợp bơ hạt mỡ và vitamin E giúp dưỡng môi mềm, giảm nứt nẻ, đặc biệt trong mùa hanh khô. Lớp finish bóng nhẹ, màu tự nhiên.</p>' +
        '<p>An toàn khi nuốt phải một lượng nhỏ, phù hợp dùng hằng ngày.</p>',
      benefits: ['Dưỡng ẩm môi suốt 6 giờ', 'Giảm nứt nẻ, mềm môi', 'Dầu dừa nguyên chất Bến Tre', 'Có thể dùng làm lớp lót son'],
      ingredients: 'Dầu dừa Bến Tre, Bơ hạt mỡ, Sáp ong, Vitamin E, Dầu jojoba.',
      usage: ['Thoa trực tiếp lên môi.', 'Dùng nhiều lần trong ngày khi môi khô.', 'Dùng làm lót trước khi đánh son màu.'],
      skin: ['Mọi loại da'],
      images: [IMG + 'sp-010-a.svg', IMG + 'sp-010-b.svg', ING + 'coconut.svg'],
      variants: [{ name: 'Không màu', sku: 'MT-SD-010-01' }, { name: 'Hồng nhạt', sku: 'MT-SD-010-02' }],
    },
    {
      id: 'SP-011', slug: 'combo-cham-soc-toan-dien', sku: 'MT-CB-011',
      name: 'Combo Chăm sóc toàn diện', cat: 'combo', price: 749000, compareAt: 927000, cost: 318000,
      stock: 45, sold: 512, rating: 4.9, reviewCount: 76, volume: '4 sản phẩm', weight: 520,
      badge: 'Tiết kiệm 20%', featured: true, deal: true, dealQty: 30, dealSold: 22,
      short: 'Sữa rửa mặt + Tẩy trang + Kem dưỡng + Chống nắng — trọn chu trình mỗi ngày.',
      description:
        '<p>Combo Chăm sóc toàn diện gồm 4 sản phẩm thiết yếu cho chu trình chăm da tối giản: Sữa rửa mặt rau má 120ml, Tẩy trang hoa hồng 150ml, Kem dưỡng sen hồng 50ml và Kem chống nắng vô cơ 50ml.</p>' +
        '<p>Tiết kiệm 178.000đ so với mua lẻ, đóng gói trong hộp quà tặng kèm thiệp viết tay.</p>',
      benefits: ['Tiết kiệm 178.000đ', 'Đủ 4 bước chăm da cơ bản', 'Hộp quà tặng kèm thiệp', 'Phù hợp làm quà tặng'],
      ingredients: 'Xem chi tiết từng sản phẩm trong bộ.',
      usage: ['Sáng: Rửa mặt → Kem dưỡng → Chống nắng.', 'Tối: Tẩy trang → Rửa mặt → Kem dưỡng.'],
      skin: ['Mọi loại da'],
      images: [IMG + 'sp-011-a.svg', IMG + 'sp-011-b.svg', ING + 'centella.svg'],
      variants: [],
    },
    {
      id: 'SP-012', slug: 'combo-tan-khach-hang', sku: 'MT-CB-012',
      name: 'Combo Tân khách hàng', cat: 'combo', price: 399000, compareAt: 548000, cost: 166000,
      stock: 60, sold: 738, rating: 4.8, reviewCount: 104, volume: '3 sản phẩm', weight: 380,
      badge: 'Best seller', featured: true, deal: true, dealQty: 50, dealSold: 41,
      short: 'Bộ trải nghiệm 3 món: rửa mặt, dưỡng ẩm và chống nắng mini.',
      description:
        '<p>Combo dành cho người mới bắt đầu: Sữa rửa mặt rau má 50ml, Kem dưỡng sen hồng 15ml và Kem chống nắng 15ml, đựng trong túi vải Mây Trắng.</p>' +
        '<p>Kích thước nhỏ gọn, phù hợp mang theo du lịch hoặc làm quà tặng thử sản phẩm.</p>',
      benefits: ['Trải nghiệm 3 sản phẩm best seller', 'Kích thước mini tiện lợi', 'Túi vải Mây Trắng kèm theo', 'Tiết kiệm 149.000đ'],
      ingredients: 'Xem chi tiết từng sản phẩm trong bộ.',
      usage: ['Dùng theo hướng dẫn trên từng sản phẩm.'],
      skin: ['Mọi loại da'],
      images: [IMG + 'sp-012-a.svg', IMG + 'sp-012-b.svg', ING + 'coconut.svg'],
      variants: [],
    },
    {
      id: 'SP-013', slug: 'bo-mini-trai-nghiem', sku: 'MT-CB-013',
      name: 'Bộ mini trải nghiệm', cat: 'combo', price: 259000, compareAt: 337000, cost: 96000,
      stock: 90, sold: 380, rating: 4.6, reviewCount: 62, volume: '4 sản phẩm mini', weight: 260,
      badge: '', featured: false, deal: false,
      short: '4 món mini gọn nhẹ cho chuyến đi, đủ bước làm sạch và dưỡng da.',
      description:
        '<p>Bộ mini gồm sữa rửa mặt, tẩy trang, kem dưỡng và son dưỡng dạng mini, đóng gói trong túi zip chống nước. Giải pháp chăm da gọn nhẹ khi đi du lịch hoặc công tác.</p>',
      benefits: ['4 món mini tiện lợi', 'Túi zip chống nước', 'Đủ bước làm sạch và dưỡng', 'Tiết kiệm 78.000đ'],
      ingredients: 'Xem chi tiết từng sản phẩm trong bộ.',
      usage: ['Dùng theo hướng dẫn trên từng sản phẩm.'],
      skin: ['Mọi loại da'],
      images: [IMG + 'sp-013-a.svg', IMG + 'sp-013-b.svg', ING + 'lotus.svg'],
      variants: [],
    },
    {
      id: 'SP-014', slug: 'bo-duong-the-dua-ben-tre', sku: 'MT-BT-014',
      name: 'Bơ dưỡng thể dừa Bến Tre', cat: 'body', price: 279000, compareAt: 320000, cost: 104000,
      stock: 70, sold: 290, rating: 4.7, reviewCount: 54, volume: '200ml', weight: 260,
      badge: '', featured: false, deal: false,
      short: 'Dưỡng thể mềm mịn với dầu dừa và bơ hạt mỡ, hương dừa nhẹ.',
      description:
        '<p>Bơ dưỡng thể dừa Bến Tre kết hợp dầu dừa nguyên chất, bơ hạt mỡ và vitamin E giúp dưỡng ẩm sâu, làm mềm vùng da khô như khuỷu tay, đầu gối. Thấm nhanh, không bết dính.</p>' +
        '<p>Hương dừa tự nhiên dịu nhẹ, mang lại cảm giác thư giãn sau mỗi lần tắm.</p>',
      benefits: ['Dưỡng ẩm sâu 24 giờ', 'Làm mềm da khô, sần', 'Thấm nhanh, không bết dính', 'Hương dừa tự nhiên'],
      ingredients: 'Dầu dừa Bến Tre, Bơ hạt mỡ, Glycerin, Vitamin E, Sáp ong.',
      usage: ['Dùng sau khi tắm, khi da còn ẩm.', 'Massage đều toàn thân, tập trung vùng khô.', 'Dùng 1-2 lần mỗi ngày.'],
      skin: ['Da khô', 'Mọi loại da'],
      images: [IMG + 'sp-014-a.svg', IMG + 'sp-014-b.svg', ING + 'coconut.svg'],
      variants: [],
    },
  ];

  const heroSlides = [
    {
      eyebrow: 'Bộ sưu tập mới 2026',
      title: 'Phấn phủ <em>Mây Trắng</em><br>mỏng nhẹ như mây',
      desc: 'Kết cấu tơ mịn, kiềm dầu dịu nhẹ, cho làn da khô thoáng và rạng rỡ suốt ngày dài. Thuần lành từ nguyên liệu thiên nhiên Việt Nam.',
      image: HERO + 'hero-1.svg',
      href: '#/san-pham/phan-phu-kiem-dau-may-trang',
      cta: 'Khám phá phấn phủ',
    },
    {
      eyebrow: 'Dưỡng da',
      title: 'Kem dưỡng <em>ẩm mây</em><br>dịu êm từng ngày',
      desc: 'Cấp ẩm sâu, phục hồi hàng rào da với chiết xuất sen hồng và rau má. Kết cấu mỏng nhẹ, thấm nhanh, không gây bí da.',
      image: HERO + 'hero-2.svg',
      href: '#/san-pham/kem-duong-am-sen-hong',
      cta: 'Khám phá kem dưỡng',
    },
    {
      eyebrow: 'Combo ưu đãi',
      title: 'Chạm nhẹ <em>mây</em><br>trọn vẹn chăm da',
      desc: 'Combo làm sạch – dưỡng ẩm – bảo vệ da, đầy đủ cho chu trình chăm sóc mỗi ngày. Tiết kiệm đến 20% trong tháng này.',
      image: HERO + 'hero-3.svg',
      href: '#/san-pham/combo-cham-soc-toan-dien',
      cta: 'Xem combo ưu đãi',
    },
  ];

  const byId = (id) => products.find((p) => p.id === id);
  const bySlug = (slug) => products.find((p) => p.slug === slug);
  const catName = (id) => (categories.find((c) => c.id === id) || {}).name || id;

  return { categories, products, heroSlides, byId, bySlug, catName };
})();
