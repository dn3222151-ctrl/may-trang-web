/* ==========================================================================
   MÂY TRẮNG – Nội dung biên tập: nguyên liệu, bài viết, đánh giá, FAQ
   ========================================================================== */
window.MT = window.MT || {};

MT.content = (function () {
  const IMG = 'assets/img/products/';
  const ING = 'assets/img/ingredients/';
  const U = (id, w) => 'https://images.unsplash.com/' + id + '?auto=format&fit=crop&w=' + (w || 900) + '&q=80';

  const trust = [
    { icon: 'truck', title: 'Miễn phí giao hàng', desc: 'Cho đơn từ 299.000đ' },
    { icon: 'refresh', title: 'Đổi trả 30 ngày', desc: 'Kể cả khi đã mở hộp' },
    { icon: 'shield', title: 'Chính hãng 100%', desc: 'Kiểm nghiệm da liễu' },
    { icon: 'phone', title: 'Tư vấn miễn phí', desc: 'Hotline 1900 6363' },
  ];

  const certifications = [
    { icon: 'leaf', title: 'Thuần chay', sub: 'Vegan Friendly', desc: 'Không thành phần từ động vật, không thử nghiệm trên động vật.' },
    { icon: 'heart', title: 'Không thử nghiệm', sub: 'Cruelty Free', desc: 'Cam kết không thử nghiệm trên động vật trong suốt quá trình sản xuất.' },
    { icon: 'shield', title: 'Da liễu kiểm nghiệm', sub: 'Dermatologically Tested', desc: 'Đã kiểm nghiệm trên da nhạy cảm, an toàn cho mọi loại da.' },
  ];

  const ingredients = [
    {
      name: 'Sen hồng', place: 'Đồng Tháp', image: ING + 'lotus.svg',
      desc: 'Cánh sen hồng được thu hoạch lúc sáng sớm, chiết xuất lạnh để giữ trọn dưỡng chất làm dịu và chống oxy hoá.',
      used: 'Kem dưỡng ẩm sen hồng, Xịt khoáng hoa sen',
    },
    {
      name: 'Rau má', place: 'Trà Vinh', image: ING + 'centella.svg',
      desc: 'Rau má giàu triterpenoid giúp làm dịu mẩn đỏ, hỗ trợ phục hồi da mụn và giảm thâm sau viêm.',
      used: 'Sữa rửa mặt rau má, Mặt nạ đất sét',
    },
    {
      name: 'Trà xanh', place: 'Thái Nguyên', image: ING + 'tea.svg',
      desc: 'Búp trà xanh Thái Nguyên chứa EGCG — chất chống oxy hoá mạnh, giúp kiềm dầu và bảo vệ da trước ánh sáng xanh.',
      used: 'Serum vitamin C, Phấn phủ, Mặt nạ đất sét',
    },
    {
      name: 'Dừa Bến Tre', place: 'Bến Tre', image: ING + 'coconut.svg',
      desc: 'Dầu dừa ép lạnh nguyên chất giàu axit lauric, dưỡng ẩm sâu và tạo lớp màng bảo vệ tự nhiên cho da và môi.',
      used: 'Son dưỡng dầu dừa, Bơ dưỡng thể',
    },
    {
      name: 'Nghệ Hưng Yên', place: 'Hưng Yên', image: ING + 'turmeric.svg',
      desc: 'Curcumin từ nghệ vàng giúp làm sáng, giảm thâm và kháng viêm nhẹ — nguyên liệu quen thuộc của phụ nữ Việt.',
      used: 'Mặt nạ đất sét, Serum vitamin C',
    },
  ];

  const articles = [
    {
      slug: '5-buoc-cham-da-mua-hanh-kho',
      tag: 'Chăm sóc da', date: '2026-06-12', read: '5 phút',
      title: '5 bước chăm da mùa hanh khô cùng Mây Trắng',
      excerpt: 'Giữ làn da ẩm mịn, không bong tróc trong những ngày gió lạnh với chu trình tối giản.',
      image: ING + 'tea.svg',
      body:
        '<p>Mùa hanh khô khiến độ ẩm không khí giảm mạnh, da mất nước nhanh hơn và dễ bong tróc. Bạn không cần một chu trình 10 bước — chỉ cần 5 bước đúng và đủ.</p>' +
        '<h3>1. Làm sạch dịu nhẹ</h3><p>Chọn sữa rửa mặt gốc amino acid, tránh xà phòng có độ pH cao. Rửa mặt với nước ấm, không quá 60 giây.</p>' +
        '<h3>2. Cấp ẩm ngay khi da còn ẩm</h3><p>Sau khi rửa, thấm khô nhẹ và thoa kem dưỡng trong vòng 1 phút để khóa nước. Kem dưỡng sen hồng với ceramide là lựa chọn phù hợp.</p>' +
        '<h3>3. Đừng bỏ qua kem chống nắng</h3><p>Tia UV vẫn hiện diện trong ngày lạnh, thậm chí mạnh hơn khi trời trong. Dùng kem chống nắng vô cơ SPF50+ mỗi sáng.</p>' +
        '<h3>4. Dưỡng môi và vùng mắt</h3><p>Đây là hai vùng da mỏng, dễ nứt nẻ nhất. Son dưỡng dầu dừa và một lớp kem dưỡng mỏng là đủ.</p>' +
        '<h3>5. Uống đủ nước và ngủ đủ giấc</h3><p>Không có mỹ phẩm nào thay thế được giấc ngủ. 7-8 tiếng mỗi đêm giúp da phục hồi tốt nhất.</p>',
    },
    {
      slug: 'chon-phan-phu-phu-hop-tung-loai-da',
      tag: 'Trang điểm', date: '2026-06-09', read: '4 phút',
      title: 'Chọn phấn phủ phù hợp với từng loại da',
      excerpt: 'Da dầu, da khô hay da hỗn hợp — mỗi loại da cần một loại phấn khác nhau. Cùng tìm hiểu.',
      image: IMG + 'sp-001-a.svg',
      body:
        '<p>Phấn phủ không chỉ để "khô mặt" mà còn quyết định độ bền của lớp trang điểm. Chọn sai, lớp nền sẽ cakey hoặc bóng dầu chỉ sau 2 giờ.</p>' +
        '<h3>Da dầu</h3><p>Ưu tiên phấn khoáng dạng nén, hạt mịn, có silica hoặc kaolin hút dầu. Tránh phấn có shimmer toàn mặt.</p>' +
        '<h3>Da khô</h3><p>Chọn phấn dạng bột siêu mịn, dùng lượng rất ít và tập trung vùng chữ T. Trước đó cần kem dưỡng đủ ẩm.</p>' +
        '<h3>Da hỗn hợp</h3><p>Dùng phấn kiềm dầu ở vùng chữ T, để vùng má tự nhiên hoặc chỉ dặm rất nhẹ.</p>' +
        '<h3>Mẹo chọn tông</h3><p>Thử phấn ở đường viền hàm, dưới ánh sáng tự nhiên. Tông phấn nên gần với màu cổ hơn là màu mặt.</p>',
    },
    {
      slug: 'sen-hong-than-duoc-da-nhay-cam',
      tag: 'Nguyên liệu', date: '2026-06-02', read: '6 phút',
      title: 'Sen hồng — "thần dược" làm dịu da nhạy cảm',
      excerpt: 'Vì sao sen hồng được xem là nguyên liệu vàng cho làn da nhạy cảm? Cùng khám phá.',
      image: ING + 'lotus.svg',
      body:
        '<p>Trong y học cổ truyền Việt Nam, sen hồng được dùng để thanh nhiệt, an thần. Trong mỹ phẩm hiện đại, chiết xuất sen hồng được chứng minh có khả năng làm dịu và chống oxy hoá.</p>' +
        '<h3>Hoạt chất quý</h3><p>Cánh sen chứa flavonoid, alkaloid và polysaccharide — những hợp chất giúp giảm viêm, làm dịu da đỏ và hỗ trợ phục hồi hàng rào da.</p>' +
        '<h3>Vì sao phù hợp da nhạy cảm</h3><p>Sen hồng có tính làm dịu cao, ít gây kích ứng, phù hợp cả với da đang treatment hoặc sau nặn mụn.</p>' +
        '<h3>Cách Mây Trắng sử dụng</h3><p>Chúng tôi thu hoạch sen tại Đồng Tháp vào sáng sớm, chiết xuất lạnh trong 24 giờ để giữ tối đa hoạt chất, sau đó phối hợp cùng rau má và ceramide.</p>',
    },
    {
      slug: 'chong-nang-dung-cach-cho-da-viet',
      tag: 'Chống nắng', date: '2026-05-28', read: '5 phút',
      title: 'Chống nắng đúng cách cho làn da Việt',
      excerpt: 'SPF cao chưa đủ — cách thoa và thoa lại mới quyết định hiệu quả bảo vệ.',
      image: IMG + 'sp-004-a.svg',
      body:
        '<p>Khí hậu nóng ẩm của Việt Nam khiến việc chống nắng trở nên khó hơn: mồ hôi, độ ẩm và thói quen thoa thiếu lượng khiến hiệu quả bảo vệ giảm đáng kể.</p>' +
        '<h3>Lượng thoa đủ</h3><p>Khoảng 2mg/cm² tương đương 2 đốt ngón tay cho mặt và cổ. Hầu hết chúng ta chỉ thoa 1/3 lượng cần thiết.</p>' +
        '<h3>Thoa lại đúng lúc</h3><p>Cứ 2-3 giờ khi ở ngoài trời, hoặc ngay sau khi ra mồ hôi nhiều, bơi lội.</p>' +
        '<h3>Chọn loại phù hợp</h3><p>Da nhạy cảm nên chọn chống nắng vô cơ (zinc oxide, titanium dioxide). Da dầu có thể chọn dạng gel hoặc fluid.</p>' +
        '<h3>Đừng quên những vùng dễ bỏ sót</h3><p>Tai, gáy, mu bàn tay và mí mắt là những vùng thường bị bỏ quên nhưng dễ lão hoá sớm.</p>',
    },
  ];

  const testimonials = [
    { name: 'Ngọc Anh', city: 'Hà Nội', rating: 5, text: 'Phấn phủ mịn thật sự, da mình dầu mà đến chiều vẫn không bóng. Hộp đẹp, giao nhanh.' },
    { name: 'Thu Hà', city: 'TP.HCM', rating: 5, text: 'Kem dưỡng sen hồng dùng rất thích, thấm nhanh, mùi nhẹ. Da mình nhạy cảm mà không bị kích ứng.' },
    { name: 'Minh Trang', city: 'Đà Nẵng', rating: 4, text: 'Combo tân khách hàng đáng tiền, đủ dùng thử. Sẽ mua full size sau khi dùng hết.' },
  ];

  const reviewsSeed = [
    { productId: 'SP-001', name: 'Ngọc Anh', rating: 5, daysAgo: 6, verified: true, text: 'Da mình dầu nặng mà dùng phấn này đến chiều vẫn khô thoáng. Hạt phấn rất mịn, không bị cakey.' },
    { productId: 'SP-001', name: 'Lan Phương', rating: 5, daysAgo: 14, verified: true, text: 'Màu tự nhiên, hợp da trung bình. Đóng gói xinh, có gương tiện mang theo.' },
    { productId: 'SP-001', name: 'Hồng Nhung', rating: 4, daysAgo: 22, verified: true, text: 'Che phủ ổn với khuyết điểm nhỏ. Mùa hè cần dặm lại sau 5-6 tiếng.' },
    { productId: 'SP-002', name: 'Thu Hà', rating: 5, daysAgo: 3, verified: true, text: 'Kem thấm nhanh, không bết. Da mình bị đỏ sau treatment dùng rất dịu, hết căng rát.' },
    { productId: 'SP-002', name: 'Mai Chi', rating: 4, daysAgo: 18, verified: true, text: 'Mùi sen nhẹ dễ chịu. Hơi lỏng so với kem dưỡng mình từng dùng nhưng thấm tốt.' },
    { productId: 'SP-003', name: 'Minh Trang', rating: 5, daysAgo: 8, verified: true, text: 'Lớp nền mỏng tự nhiên, không bị oxy hoá. Dùng kèm phấn phủ là đủ cho cả ngày.' },
    { productId: 'SP-004', name: 'Bảo Ngọc', rating: 5, daysAgo: 11, verified: true, text: 'Chống nắng vô cơ mà không bị vệt trắng, nâng tông rất nhẹ. Da nhạy cảm dùng ổn.' },
    { productId: 'SP-005', name: 'Kim Ngân', rating: 5, daysAgo: 2, verified: true, text: 'Rửa xong không khô, bọt mịn. Mụn ẩn giảm rõ sau 2 tuần.' },
    { productId: 'SP-005', name: 'Phương Thảo', rating: 4, daysAgo: 25, verified: true, text: 'Dịu nhẹ, hợp da dầu. Tuýp hơi nhỏ so với giá nhưng chất lượng tốt.' },
    { productId: 'SP-007', name: 'Hà My', rating: 5, daysAgo: 9, verified: true, text: 'Serum thấm nhanh, không dính. Sau 3 tuần da sáng hơn rõ, thâm mờ dần.' },
    { productId: 'SP-008', name: 'Quỳnh Anh', rating: 4, daysAgo: 16, verified: true, text: 'Mặt nạ hút dầu tốt, rửa dễ. Hơi khô nhẹ nên mình chỉ dùng vùng chữ T.' },
    { productId: 'SP-010', name: 'Trà My', rating: 5, daysAgo: 5, verified: true, text: 'Son dưỡng mềm môi, mùi dừa thơm nhẹ. Mình dùng làm lót son rất hợp.' },
    { productId: 'SP-011', name: 'Diệu Linh', rating: 5, daysAgo: 7, verified: true, text: 'Combo đóng hộp quà rất đẹp, mình mua tặng mẹ. Đủ 4 bước, tiết kiệm hơn mua lẻ.' },
    { productId: 'SP-012', name: 'Hoàng Yến', rating: 5, daysAgo: 13, verified: true, text: 'Bộ mini xinh, đủ dùng thử 2 tuần. Túi vải đựng rất tiện mang đi du lịch.' },
    { productId: 'SP-006', name: 'Thanh Huyền', rating: 5, daysAgo: 4, verified: true, text: 'Tẩy trang sạch cả mascara chống nước, không cay mắt. Rất đáng tiền.' },
    { productId: 'SP-009', name: 'Vy', rating: 4, daysAgo: 20, verified: true, text: 'Xịt mịn, không làm trôi makeup. Mùi sen nhẹ, mùa hè dùng rất mát.' },
    { productId: 'SP-014', name: 'Bích Ngọc', rating: 5, daysAgo: 15, verified: true, text: 'Bơ dưỡng thể thơm dừa, thấm nhanh không bết. Da mình khô mà dùng rất mềm.' },
  ];

  const faqs = [
    { q: 'Sản phẩm Mây Trắng có phù hợp với da nhạy cảm không?', a: 'Phần lớn sản phẩm của Mây Trắng đều được kiểm nghiệm da liễu và không chứa cồn khô, hương liệu tổng hợp. Với da đang treatment hoặc dị ứng, bạn nên thử một lượng nhỏ ở vùng xương hàm trong 24 giờ trước khi dùng toàn mặt.' },
    { q: 'Bao lâu thì tôi nhận được hàng?', a: 'Nội thành Hà Nội và TP.HCM: 1-2 ngày làm việc. Các tỉnh thành khác: 2-4 ngày làm việc. Đơn hàng trước 15h sẽ được xử lý trong ngày.' },
    { q: 'Tôi có được đổi trả nếu sản phẩm không phù hợp?', a: 'Có. Mây Trắng hỗ trợ đổi trả trong 30 ngày kể cả khi đã mở hộp, với điều kiện sản phẩm còn tối thiểu 70% dung tích. Liên hệ hotline 1900 6363 để được hỗ trợ.' },
    { q: 'Đơn hàng từ 299.000đ có thực sự được miễn phí vận chuyển?', a: 'Đúng vậy. Miễn phí vận chuyển tiêu chuẩn cho mọi đơn hàng có giá trị sau giảm giá từ 299.000đ. Phương thức giao nhanh vẫn có phụ phí 15.000đ.' },
    { q: 'Tôi có thể tra cứu đơn hàng mà không cần tài khoản?', a: 'Có. Vào mục "Tra cứu đơn" trên thanh điều hướng, nhập mã đơn hoặc số điện thoại đã dùng khi đặt hàng để xem trạng thái và chi tiết đơn.' },
    { q: 'Thanh toán bằng chuyển khoản có an toàn không?', a: 'Có. Bạn chuyển khoản theo đúng nội dung mã đơn hàng hiển thị sau khi đặt. Đơn sẽ được xác nhận tự động trong 5-10 phút làm việc. Chúng tôi không lưu thông tin thẻ ngân hàng của khách.' },
  ];

  const storyStats = [
    { value: '2019', label: 'Khởi nguồn từ xưởng nhỏ tại Hà Nội' },
    { value: '32.000+', label: 'Khách hàng tin dùng' },
    { value: '5', label: 'Vùng nguyên liệu tại Việt Nam' },
    { value: '100%', label: 'Không thử nghiệm trên động vật' },
  ];

  return { trust, certifications, ingredients, articles, testimonials, reviewsSeed, faqs, storyStats };
})();
