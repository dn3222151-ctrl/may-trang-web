# Mây Trắng — Website thương mại điện tử & Dashboard quản trị

Bộ giao diện hoàn chỉnh cho thương hiệu mỹ phẩm **Mây Trắng**, gồm:

- **`index.html`** — website bán hàng: xem sản phẩm, chi tiết, giỏ hàng, thanh toán, tra cứu đơn, đánh giá, yêu thích.
- **`dashboard.html`** — hệ điều hành doanh nghiệp: doanh thu/lợi nhuận, đơn hàng, sản phẩm & kho, mô hình tài chính 3 năm, kênh bán, CRUD thành viên, giao việc Kanban, bằng chứng ảnh/văn bản, cổng thành viên.
- **`supabase/`** — schema PostgreSQL, RLS, Storage bucket, view báo cáo và dữ liệu seed sẵn sàng kết nối Supabase.
- **`assets/`** — CSS, JavaScript, hình ảnh sản phẩm/nguyên liệu được vẽ riêng cho thương hiệu (SVG, không phụ thuộc ảnh ngoài).

> Ứng dụng chạy **hoàn toàn offline** bằng HTML/CSS/JavaScript thuần, không cần build hay cài đặt. Mọi phép tính hoạt động ngay; Supabase là tùy chọn để đồng bộ cloud.

---

## 1. Chạy thử trong 30 giây

1. Mở thư mục dự án.
2. Nhấp đúp **`index.html`** để xem website.
3. Nhấp đúp **`dashboard.html`** để xem quản trị.

Dữ liệu mẫu (14 sản phẩm, 373 đơn hàng 12 tháng, 5 thành viên, 16 nhiệm vụ, 16 bằng chứng) tự sinh ở lần mở đầu tiên và lưu bằng `localStorage` của trình duyệt. Website và dashboard dùng chung một kho dữ liệu: đơn đặt trên website xuất hiện ngay trong dashboard.

**Trình duyệt khuyến nghị:** Chrome/Edge/CoccC mới. Nếu mở bằng `file://`, dữ liệu vẫn hoạt động bình thường; khi triển khai lên hosting tĩnh, mọi thứ tiếp tục chạy.

### Tài khoản & dữ liệu thử

| Mục | Giá trị |
|---|---|
| Mã giảm giá | `MAY10`, `FREESHIP`, `COMBO20`, `WELCOME50` |
| Thẻ test | `4242 4242 4242 4242` · `12/28` · `123` |
| Tra cứu đơn | Nhập mã đơn bất kỳ hoặc SĐT mẫu `0901234567` |
| Vai trò dashboard | Lại Trọng Việt — CEO (không có màn hình đăng nhập nội bộ) |

> Thanh toán là **mô phỏng** để trình diễn luồng nghiệp vụ. Không có tiền thật, không kết nối cổng thanh toán. Mã QR chuyển khoản là hình minh hoạ.

---

## 2. Chức năng website

### Mua sắm
- Trang chủ: hero slider, flash sale có đếm ngược thật, sản phẩm bán chạy, câu chuyện thương hiệu, nguyên liệu, chứng nhận, đánh giá, bài viết, đăng ký nhận tin.
- Danh sách sản phẩm: lọc theo danh mục, khoảng giá, loại da; sắp xếp theo giá/đánh giá/bán chạy/mới; tìm kiếm.
- **Chi tiết sản phẩm**: gallery nhiều ảnh, chọn phân loại, số lượng, tồn kho, thêm giỏ/mua ngay, mô tả, thành phần, hướng dẫn, đánh giá và form gửi đánh giá, sản phẩm liên quan.
- Giỏ hàng dạng drawer: tăng/giảm số lượng, xoá, thanh tiến độ freeship.
- Yêu thích: lưu sản phẩm, trang riêng.
- Tìm kiếm overlay với gợi ý trực tiếp.
- Bài viết: trang chi tiết bài viết.

### Thanh toán thật (mô phỏng)
1. **Thông tin** — họ tên, SĐT, email, tỉnh/thành, địa chỉ, ghi chú; kiểm tra dữ liệu tại chỗ.
2. **Vận chuyển** — tiêu chuẩn (miễn phí từ 299.000₫), giao nhanh, nhận tại showroom; phí theo khu vực.
3. **Thanh toán** — COD, chuyển khoản, thẻ (kiểm tra Luhn + hạn dùng + CVV), MoMo/ZaloPay (mô phỏng xử lý).
- Áp dụng/xoá mã giảm giá, tính lại tổng tiền ngay.
- Tạo mã đơn, trừ tồn kho, lưu khách hàng, xoá giỏ, chuyển tới trang thành công.
- Trang thành công: timeline trạng thái, hướng dẫn chuyển khoản + QR minh hoạ, nút “Tôi đã chuyển khoản”, in hoá đơn.
- **Tra cứu đơn** bằng mã đơn / số điện thoại / email; xem chi tiết, huỷ đơn khi còn ở trạng thái chờ/xác nhận.
- Đăng ký nhận tin, đánh giá sản phẩm được lưu lại.

---

## 3. Chức năng dashboard

### Tổng quan
- KPI doanh thu thuần, lợi nhuận ròng, đơn hàng, AOV; sparkline; so sánh kỳ trước.
- Biểu đồ doanh thu/lợi nhuận theo ngày/tuần/tháng tuỳ khoảng chọn.
- Tỷ trọng doanh thu theo kênh, mục tiêu doanh thu 12 tháng, cảnh báo việc quá hạn/đơn chờ/tồn kho thấp.
- Đơn gần đây, top sản phẩm, tiến độ đội ngũ.

### Đơn hàng
- Lọc theo trạng thái/kênh/tìm kiếm; phân trang; xuất CSV.
- Drawer chi tiết: khách hàng, sản phẩm, thanh toán, lịch sử.
- Chuyển trạng thái theo quy trình: chờ → xác nhận → đóng gói → giao → hoàn tất; huỷ đơn hoàn tồn kho.
- Ghi nhận thanh toán, in hoá đơn.

### Sản phẩm & kho
- Thêm/sửa/ngừng bán sản phẩm; chỉnh tồn nhanh ±1.
- Tính biên lợi nhuận trực tiếp trong form; giá bán/giá vốn/giá niêm yết.
- Lọc theo danh mục, tồn kho thấp/hết hàng/ngừng bán.
- Sản phẩm mới xuất hiện ngay trên website.

### Tài chính
- P&L theo kỳ: doanh thu, giá vốn, phí kênh, marketing, đóng gói/vận chuyển, lợi nhuận góp, cố định, thuế, lợi nhuận ròng.
- Cơ cấu chi phí, điểm hoà vốn, biên an toàn, chi phí cố định chi tiết.
- Xuất P&L CSV.

### Mô hình tài chính 3 năm
- Giả định tương tác: doanh thu năm 1, tăng trưởng, % giá vốn, marketing, phí kênh, ship, chi phí cố định, lạm phát, thuế, vốn đầu tư, tỷ lệ chiết khấu.
- Kết quả: doanh thu/lợi nhuận từng năm, NPV, IRR, ROI, thời điểm hoàn vốn, bảng độ nhạy giá bán × giá vốn.
- Kịch bản bi quan/cơ sở/lạc quan; lưu giả thuyết vào cài đặt.

### Kênh bán
- Doanh thu, đơn, AOV, phí, lợi nhuận góp, biên góp theo từng kênh.
- Chỉnh % phí kênh trực tiếp, tính lại báo cáo.
- Biểu đồ cột + vòng, gợi ý kênh dẫn đầu/cần tối ưu.

### Thành viên (CRUD đầy đủ)
- Thêm/sửa/xoá thành viên; họ tên, vai trò, email, điện thoại, trạng thái, cổ phần, giờ cam kết, KPI, kỹ năng, màu nhận diện.
- Kiểm tra trùng email, tổng cổ phần ≤ 100%.
- Xoá thành viên sẽ chuyển nhiệm vụ chưa xong về “Chưa phân công”.
- Thẻ hiệu suất: số việc, hoàn thành, đang mở, quá hạn, tiến độ, đúng hạn.

### Giao việc
- Kanban 4 cột: Cần làm / Đang làm / Chờ duyệt / Hoàn thành.
- Kéo-thả thẻ để đổi trạng thái; xem dạng bảng.
- Tạo/sửa/xoá nhiệm vụ: tiêu đề, mô tả, người phụ trách, ưu tiên, hạn, giờ ước tính, tiến độ, nhãn.
- Lọc theo thành viên/ưu tiên/tìm kiếm; thống kê quá hạn, tiến độ trung bình, số bằng chứng.

### Bằng chứng & cổng thành viên
- Drawer nhiệm vụ: cập nhật trạng thái/tiến độ, nộp **bằng chứng văn bản và ảnh** (nén tự động, xem trước, kéo-thả, xoá), xem lịch sử hoạt động.
- **Cổng thành viên**: chọn thành viên, xem việc của họ, nộp bằng chứng nhanh, xem dòng bằng chứng gần đây.
- Ảnh được nén về tối đa 1200px, JPEG ~72% để tiết kiệm dung lượng.
- Nếu cấu hình Supabase, bằng chứng có bảng riêng và Storage bucket; có thể đồng bộ lên cloud.

### Cài đặt
- Cửa hàng, ngân hàng, thông điệp đầu trang.
- Vận chuyển: ngưỡng freeship, phí khu vực, giao nhanh, đóng gói.
- Tài chính: chi phí cố định (thêm/xoá), marketing, thuế, mục tiêu, vốn, tăng trưởng.
- Mã giảm giá CRUD.
- Dữ liệu: xuất/nhập JSON, khôi phục dữ liệu mẫu, theo dõi dung lượng.
- Supabase: lưu URL/anon key, kiểm tra kết nối, đăng nhập admin, đẩy/tải dữ liệu.

---

## 4. Công thức tính toán

Mọi số liệu lấy từ đơn hàng thực trong kho dữ liệu (trừ đơn huỷ):

```
Doanh thu thuần = Σ(giá bán × SL) − giảm giá
Giá vốn (COGS)   = Σ(giá vốn × SL)
Phí kênh         = Doanh thu thuần × % phí kênh
Marketing        = Doanh thu thuần × % marketing
Đóng gói         = Số đơn × phí đóng gói
Vận chuyển ròng  = Chi phí ship thực tế − phí ship thu của khách
Lợi nhuận góp    = Doanh thu − COGS − phí kênh − marketing − đóng gói − vận chuyển ròng
Lợi nhuận trước thuế = Lợi nhuận góp − chi phí cố định (phân bổ theo số ngày)
Thuế             = max(0, Doanh thu − ngưỡng miễn thuế phân bổ) × (VAT + TNCN)
Lợi nhuận ròng   = Lợi nhuận trước thuế − thuế

Điểm hoà vốn/tháng = Chi phí cố định tháng ÷ biên lợi nhuận góp
NPV = −Vốn đầu tư + Σ(Lợi nhuận năm t ÷ (1 + r)^t)
IRR = nghiệm của NPV = 0 (tính bằng bisection)
Hoàn vốn = tháng đầu tiên luỹ kế lợi nhuận ≥ vốn đầu tư
```

Thuế mặc định theo hộ kinh doanh: VAT 1% + TNCN 0,5% trên phần doanh thu vượt ngưỡng miễn thuế (mặc định 200 triệu/năm). Tất cả thông số chỉnh được trong **Cài đặt → Tài chính**.

---

## 5. Cấu trúc dự án

```
Web/
├─ index.html                     Website bán hàng
├─ dashboard.html                 Dashboard quản trị
├─ Wed.html                       Bản thiết kế giao diện ban đầu (giữ nguyên)
├─ assets/
│  ├─ css/
│  │  ├─ storefront.css
│  │  └─ dashboard.css
│  ├─ js/
│  │  ├─ config.js                Cấu hình thương hiệu + Supabase
│  │  ├─ core/util.js             Định dạng, icon, toast, tiện ích
│  │  ├─ core/store.js            localStorage, giỏ hàng, nghiệp vụ đơn/task
│  │  ├─ core/finance.js          Engine P&L, hoà vốn, dự phóng, KPI
│  │  ├─ core/remote.js           Adapter Supabase
│  │  ├─ data/catalog.js          14 sản phẩm
│  │  ├─ data/content.js          Nguyên liệu, bài viết, đánh giá mẫu
│  │  ├─ data/seed.js             Sinh 373 đơn, 5 thành viên, 16 nhiệm vụ…
│  │  ├─ shop/app.js              Router, trang chủ, sản phẩm, giỏ, tìm kiếm
│  │  ├─ shop/checkout.js         Thanh toán, đơn hàng, tra cứu
│  │  ├─ dash/app.js              Khung dashboard, biểu đồ, modal/drawer
│  │  ├─ dash/overview.js
│  │  ├─ dash/sales.js            Đơn hàng + sản phẩm
│  │  ├─ dash/finance-views.js    P&L + mô hình + kênh
│  │  ├─ dash/team.js             Thành viên + giao việc + bằng chứng
│  │  └─ dash/settings.js         Cài đặt + Supabase
│  └─ img/
│     ├─ products/                Ảnh SVG sản phẩm (a/b)
│     ├─ ingredients/             Ảnh SVG nguyên liệu
│     └─ hero/                    Ảnh hero
├─ supabase/
│  ├─ schema.sql                  Bảng, RLS, index, trigger, storage, view
│  └─ seed.sql                    Dữ liệu mẫu 373 đơn + sản phẩm + đội ngũ
├─ tools/                         Script sinh ảnh & seed (chỉ dùng khi phát triển)
└─ README.md
```

---

## 6. Kết nối Supabase

### Bước 1 — Tạo project
Tạo project tại [supabase.com](https://supabase.com). Ghi lại **Project URL** và **anon public key** trong *Project Settings → API*.

### Bước 2 — Chạy schema
Mở **SQL Editor**, dán toàn bộ `supabase/schema.sql` và chạy. File này tạo:
- 12 bảng: `profiles`, `products`, `orders`, `order_items`, `members`, `tasks`, `task_evidence`, `task_activity`, `reviews`, `coupons`, `subscribers`, `settings`.
- RLS: khách chỉ đọc sản phẩm/đánh giá, gửi đánh giá/đăng ký; quản trị viên có toàn quyền.
- Storage bucket `task-evidence` (public read, admin write) cho ảnh bằng chứng.
- Trigger `updated_at`, `profiles` tự tạo khi có user mới.
- View `v_monthly_pl`, `v_channel_performance`.

### Bước 3 — Nạp dữ liệu mẫu
Chạy `supabase/seed.sql` (648 KB). File chứa 14 sản phẩm, 373 đơn + 786 dòng hàng, 5 thành viên, 16 nhiệm vụ, 16 bằng chứng, đánh giá, mã giảm giá và cài đặt.

### Bước 4 — Tạo tài khoản quản trị
- Vào **Authentication → Users → Add user**, tạo email/mật khẩu (ví dụ `admin@maytrang.vn`).
- Chạy SQL:
```sql
insert into public.profiles (id, email, full_name, role)
select id, email, 'Quản trị Mây Trắng', 'admin'
from auth.users where email = 'admin@maytrang.vn'
on conflict (id) do update set role = 'admin';
```

### Bước 5 — Cấu hình trong dashboard
Mở **Dashboard → Cài đặt → Supabase**:
1. Dán Project URL + anon key + bucket `task-evidence`, bấm **Lưu cấu hình**.
2. Bấm **Kiểm tra kết nối** — cần đọc được bảng `products`.
3. Bấm **Đăng nhập quản trị** bằng tài khoản ở bước 4.
4. Bấm **Đẩy dữ liệu lên** để upsert toàn bộ dữ liệu cục bộ.
5. **Tải dữ liệu về** sẽ thay thế dữ liệu cục bộ bằng dữ liệu cloud (nên sao lưu trước).

> Có thể cấu hình trực tiếp trong `assets/js/config.js` bằng cách điền `supabase.url` và `supabase.anonKey`. Cấu hình nhập trong dashboard được lưu ở `localStorage` và ưu tiên hơn.

### Bảo mật
- Chỉ dùng **anon key** ở trình duyệt. **Không** đưa `service_role` key vào code.
- RLS bảo vệ toàn bộ bảng ghi; website chỉ đọc sản phẩm/đánh giá.
- Muốn cho phép website ghi đơn trực tiếp lên Supabase, hãy thêm policy insert có kiểm soát và xác thực phía server (Edge Function) — bản demo cố ý không mở quyền ghi đơn công khai.
- Bằng chứng ảnh: dashboard hiện lưu data URL cục bộ; khi đồng bộ cloud, nên chuyển sang Storage bucket. Module `remote.js` đã có hàm `uploadEvidence(dataUrl, filename)` để mở rộng.

---

## 7. Dữ liệu & sao lưu

- Kho dữ liệu cục bộ dùng tiền tố `mt.v2.` trong `localStorage`, gồm: `orders`, `products` (inventory + customProducts), `members`, `tasks`, `reviews`, `coupons`, `subscribers`, `settings`, `cart`, `wishlist`, `customer`.
- Giới hạn ~5 MB/trình duyệt. Ảnh bằng chứng được nén trước khi lưu; nếu đầy, vào **Cài đặt → Dữ liệu** để xuất sao lưu và xoá bớt ảnh.
- **Xuất JSON** lưu toàn bộ dữ liệu; **Nhập JSON** thay thế dữ liệu hiện tại; **Khôi phục dữ liệu mẫu** reset về demo.
- Khi triển khai nhiều máy, nên dùng Supabase thay vì localStorage.

### Reset nhanh khi thử
Mở DevTools → Console:
```js
localStorage.clear(); location.reload();
```
Hoặc dùng nút trong **Cài đặt → Dữ liệu**.

---

## 8. Tùy chỉnh

| Muốn thay đổi | Sửa ở |
|---|---|
| Tên, hotline, email, địa chỉ, ngân hàng | Dashboard → Cài đặt → Cửa hàng |
| Phí ship, freeship, đóng gói | Cài đặt → Vận chuyển |
| Chi phí cố định, thuế, mục tiêu, vốn | Cài đặt → Tài chính |
| Mã giảm giá | Cài đặt → Mã giảm giá |
| Thông tin Supabase | `assets/js/config.js` hoặc Cài đặt → Supabase |
| Danh mục/sản phẩm gốc | `assets/js/data/catalog.js` (hoặc CRUD trong dashboard) |
| Bài viết, nguyên liệu, đánh giá mẫu | `assets/js/data/content.js` |
| Cấu trúc đơn/task mẫu | `assets/js/data/seed.js` |
| Màu sắc website | `assets/css/storefront.css` (`:root`) |
| Màu sắc dashboard | `assets/css/dashboard.css` (`:root`) |

### Công cụ phát triển (không bắt buộc)
- `tools/generate-product-images.mjs` — sinh lại 28 ảnh SVG sản phẩm.
- `tools/generate-art.mjs` — sinh 5 ảnh nguyên liệu + 3 ảnh hero.
- `tools/generate-supabase-seed.mjs` — sinh lại `supabase/seed.sql` từ dữ liệu ứng dụng.

Chạy bằng Node 18+:
```bash
node tools/generate-product-images.mjs
node tools/generate-art.mjs
node tools/generate-supabase-seed.mjs
```

---

## 9. Giới hạn đã biết

- **Thanh toán mô phỏng**: không có giao dịch thật. Khi triển khai thật, thay bước đặt hàng bằng API cổng thanh toán (VNPay, MoMo, Stripe…) và xác thực ở server.
- **QR minh hoạ**: không quét được; thay bằng VietQR/ảnh QR thật nếu dùng chuyển khoản thật.
- **Không có đăng nhập nội bộ**: dashboard mở tự do trong bản demo. Trước khi chạy production, thêm Supabase Auth và chặn route theo role.
- **Dữ liệu cục bộ**: mỗi trình duyệt một kho riêng; xoá dữ liệu trình duyệt sẽ mất dữ liệu (trừ khi đã đồng bộ Supabase).
- **Chart.js và Google Fonts** tải từ CDN; nếu offline, biểu đồ hiển thị thông báo thay thế và font fallback vẫn dùng được. Ảnh sản phẩm/nguyên liệu là SVG nội bộ nên luôn hiển thị.
- **Xuất/nhập JSON** không bao gồm giỏ hàng đang mở (chỉ dữ liệu nghiệp vụ).

---

## 10. Kiểm thử đã thực hiện

Đã chạy kiểm thử tự động bằng Chromium headless trên các luồng:
- Website: tải trang, lọc sản phẩm, mở chi tiết, thêm giỏ, thanh toán 3 bước (chuyển khoản), tạo đơn, xác nhận thanh toán, tra cứu đơn, đọc bài viết.
- Dashboard: tải tổng quan, biểu đồ, đơn hàng + đổi trạng thái, tạo sản phẩm, P&L, mô hình 3 năm, kênh bán, thêm thành viên, tạo nhiệm vụ, nộp bằng chứng văn bản + ảnh (nén), cổng thành viên, cài đặt, giao diện mobile.
- Không có lỗi console trong các luồng trên.

---

## 11. Ghi chú về file gốc

`Wed.html` là bản thiết kế giao diện website ban đầu do bạn cung cấp, được giữ nguyên để tham chiếu. Phiên bản đầy đủ, có nghiệp vụ là `index.html`.

Bản dashboard cũ được sao lưu tại `_backup/dashboard-v1.html` (nếu thư mục tồn tại) trước khi nâng cấp.

---

© 2026 Mây Trắng. Dự án demo phục vụ học tập và trình diễn nghiệp vụ.
