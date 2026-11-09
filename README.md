# Mây Trắng — Website thương mại điện tử, Dashboard & Cổng thành viên

Bộ ứng dụng hoàn chỉnh cho thương hiệu mỹ phẩm **Mây Trắng**:

- **`index.html`** — website bán hàng, tự động tải sản phẩm/đánh giá/mã giảm giá mới nhất từ Supabase.
- **`dashboard.html`** — quản trị doanh nghiệp: tài chính, đơn hàng, kho, đội ngũ, giao việc, bằng chứng, đồng bộ cloud tự động.
- **`member.html`** — cổng đăng nhập thành viên: nhận nhiệm vụ, cập nhật tiến độ, nộp bằng chứng lên Supabase.
- **`supabase/`** — schema, migration, seed, RLS, Storage, RPC, realtime.

> Chạy được **offline** bằng HTML/CSS/JavaScript thuần. Khi cấu hình Supabase, dữ liệu được đồng bộ cloud: dashboard tự đẩy thay đổi, website và cổng thành viên tự tải dữ liệu mới khi mở trang hoặc qua realtime.

---

## 1. Chạy thử

1. Mở thư mục dự án.
2. Nhấp đúp **`index.html`** để xem website.
3. Nhấp đúp **`dashboard.html`** để xem quản trị.
4. Mở **`member.html`** để vào cổng thành viên (cần tài khoản do admin cấp).

Nếu chưa cấu hình Supabase, dashboard chạy ở **chế độ cục bộ** (localStorage) với dữ liệu mẫu. Khi đã cấu hình, đăng nhập admin để bật đồng bộ.

### Tài khoản & dữ liệu thử

| Mục | Giá trị |
|---|---|
| CEO / quản trị | Nguyễn Tiến Dũng |
| Email đăng nhập admin gợi ý | `admin@maytrang.vn` (tài khoản tạo trong Supabase Auth) |
| Mã giảm giá | `MAY10`, `FREESHIP`, `COMBO20`, `WELCOME50` |
| Thẻ test | `4242 4242 4242 4242` · `12/28` · `123` |
| Tra cứu đơn | Mã đơn bất kỳ hoặc SĐT mẫu `0901234567` |

> Thanh toán là mô phỏng. Không có giao dịch thật; QR chuyển khoản là hình minh hoạ.

---

## 2. Website bán hàng

- Trang chủ, flash sale đếm ngược, sản phẩm bán chạy, nguyên liệu, đánh giá, bài viết, đăng ký nhận tin.
- Lọc theo danh mục/giá/loại da, sắp xếp, tìm kiếm.
- Chi tiết sản phẩm: gallery, phân loại, tồn kho, thêm giỏ/mua ngay, đánh giá, sản phẩm liên quan.
- Giỏ hàng drawer, mã giảm giá, thanh toán 3 bước (COD/chuyển khoản/thẻ/MoMo), tạo đơn, trừ tồn kho.
- Trang thành công, QR minh hoạ, xác nhận đã chuyển khoản, in hoá đơn, tra cứu/huỷ đơn.
- **Tự động cập nhật từ Supabase**: sản phẩm, giá, tồn kho, ảnh, đánh giá, mã giảm giá, cấu hình vận chuyển. Có realtime khi bảng đã bật publication; ngoài ra tự làm mới khi quay lại tab hoặc mỗi 45 giây.

---

## 3. Dashboard quản trị

### Tổng quan & tài chính
- KPI doanh thu, lợi nhuận, đơn hàng, AOV; so sánh kỳ trước; biểu đồ ngày/tuần/tháng.
- P&L theo kỳ: doanh thu, COGS, phí kênh, marketing, đóng gói/vận chuyển, lợi nhuận góp, cố định, thuế, lợi nhuận ròng.
- Điểm hoà vốn, biên an toàn, cơ cấu chi phí, xuất CSV.
- Mô hình 3 năm: NPV, IRR, ROI, hoàn vốn, phân tích độ nhạy, kịch bản.
- Kênh bán: doanh thu, phí, biên góp theo kênh; chỉnh phí trực tiếp.

### Vận hành
- **Đơn hàng**: lọc, đổi trạng thái, huỷ hoàn kho, in hoá đơn.
- **Sản phẩm & kho**: CRUD, biên lợi nhuận, chỉnh tồn nhanh.
- **Thành viên**: CRUD đầy đủ, cổ phần, giờ cam kết, KPI, hiệu suất, **cấp tài khoản đăng nhập**.
- **Giao việc**: Kanban 4 cột kéo-thả, CRUD nhiệm vụ, tiến độ, hạn, ưu tiên, bằng chứng.
- **Cổng thành viên nội bộ** (trong dashboard) và **cổng đăng nhập riêng** `member.html`.

### Đồng bộ cloud
- Thanh trạng thái trên topbar: `Cục bộ` / `Đăng nhập Supabase` / `Đang đồng bộ` / `Đã đồng bộ` / `Lỗi đồng bộ`.
- Tự đẩy thay đổi sau ~0,8 giây khi đã đăng nhập admin.
- Tự tải dữ liệu cloud khi mở dashboard nếu còn phiên đăng nhập.
- Banner nhắc đăng nhập hoặc thử lại khi đồng bộ lỗi.
- Vẫn có nút đẩy/tải thủ công trong **Cài đặt → Supabase**.

---

## 4. Tài khoản thành viên & cổng nhận việc

### Admin cấp tài khoản
1. Đăng nhập dashboard bằng tài khoản admin Supabase.
2. Vào **Thành viên**, sửa một thành viên (hoặc thêm mới).
3. Ở mục **Tài khoản đăng nhập**, nhập email + mật khẩu khởi tạo, giữ tick “Tạo tài khoản đăng nhập”.
4. Bấm lưu. Hệ thống tạo user Supabase Auth, gắn `members.auth_user_id`, cấp role `staff` trong `profiles`.
5. Gửi cho thành viên địa chỉ `member.html` và thông tin đăng nhập.

> Nếu Supabase Auth đang bật **Confirm email**, thành viên phải xác nhận email trước khi đăng nhập. Với demo, có thể tắt tạm trong *Authentication → Providers → Email*.
> Nếu đã có tài khoản, có thể dùng nút **Gửi email đặt lại mật khẩu** trong form thành viên.

### Thành viên sử dụng
- Mở `member.html`, đăng nhập bằng email/mật khẩu được cấp.
- Xem nhiệm vụ được giao, hạn, ưu tiên, tiến độ, bằng chứng.
- Cập nhật trạng thái/tiến độ; dữ liệu ghi qua RPC `member_update_task` (chỉ sửa nhiệm vụ của mình).
- Nộp báo cáo bằng chứng:
  - văn bản mô tả kết quả;
  - ảnh được nén client-side rồi upload lên bucket `task-evidence`;
  - bản ghi lưu vào `task_evidence` kèm `submitted_by`.
- Cổng tự làm mới khi admin thay đổi nhiệm vụ (realtime + polling 30 giây).
- RLS bảo đảm thành viên chỉ thấy nhiệm vụ, bằng chứng, lịch sử của chính mình.

---

## 5. Cơ chế đồng bộ (Push / Pull)

### Chiều dashboard → Supabase (Push)
- Mọi thay đổi dữ liệu phát sự kiện nội bộ; module `assets/js/core/sync.js` gom các bảng bị ảnh hưởng.
- Sau 750ms, gọi `MT.remote.pushTables()` để upsert đúng bảng: `products`, `members`, `tasks`, `task_evidence`, `task_activity`, `orders`, `order_items`, `coupons`, `reviews`, `subscribers`, `settings`.
- Đơn hàng được đẩy riêng theo `order.id` để tránh gửi lại toàn bộ 373 đơn.
- Ảnh bằng chứng dạng data URL được upload lên Storage rồi thay bằng public URL trước khi ghi DB.
- Nếu chưa đăng nhập, thay đổi được giữ trong hàng đợi và hiển thị “Chờ đăng nhập (n)”.

### Chiều Supabase → website / thành viên (Pull & Realtime)
- Website khi mở trang gọi `pullPublic()`: chỉ tải dữ liệu công khai (sản phẩm đang bán, đánh giá, mã giảm giá, cấu hình cửa hàng/vận chuyển qua RPC `public_store_settings`).
- Cổng thành viên tải nhiệm vụ của chính mình qua RLS.
- Bật Realtime cho các bảng liên quan (migration đã cấu hình publication); nếu chưa bật, vẫn có polling định kỳ.
- Dashboard khi mở lại và còn phiên admin sẽ tự `pull()` toàn bộ dữ liệu.

### Lần đầu kết nối
- Chạy `supabase/schema.sql` (mới) hoặc `migration-v2-auth-sync.sql` (nếu đã có schema cũ).
- Chạy `seed.sql` hoặc đăng nhập admin rồi bấm **Đẩy dữ liệu lên** một lần để đưa dữ liệu cục bộ lên cloud.
- Sau đó mọi thay đổi sẽ tự đồng bộ.

> Project Supabase hiện tại của bạn đã có dữ liệu sản phẩm/đánh giá. Website đã tự đọc được các bảng công khai. Để bật đầy đủ cài đặt, mã giảm giá, tài khoản thành viên và realtime, hãy chạy `supabase/migration-v2-auth-sync.sql` một lần trong SQL Editor.

---

## 6. Cài đặt Supabase

### Bước 1 — Tạo / mở project
Lấy **Project URL** và **anon/publishable key** trong *Project Settings → API*.

### Bước 2 — Schema
- Project mới: chạy `supabase/schema.sql`, sau đó `supabase/seed.sql`.
- Project đã có schema cũ: chạy `supabase/migration-v2-auth-sync.sql`.

Migration bổ sung:
- `members.auth_user_id` + index.
- RLS cho thành viên (chỉ đọc dữ liệu của mình).
- RPC `member_update_task` và `public_store_settings`.
- Quyền đọc mã giảm giá đang hoạt động.
- Storage policy cho thành viên upload ảnh.
- Realtime publication cho các bảng.
- Đổi tên CEO sang Nguyễn Tiến Dũng.

### Bước 3 — Tạo tài khoản admin
- Vào **Authentication → Users → Add user** (ví dụ `admin@maytrang.vn`).
- Chạy:
```sql
insert into public.profiles (id, email, full_name, role)
select id, email, 'Nguyễn Tiến Dũng', 'admin'
from auth.users where email = 'admin@maytrang.vn'
on conflict (id) do update set role = 'admin', full_name = 'Nguyễn Tiến Dũng';
```

### Bước 4 — Cấu hình ứng dụng
Mở **Dashboard → Cài đặt → Supabase**, nhập URL + key, lưu, kiểm tra kết nối, đăng nhập admin.

Hoặc điền trực tiếp trong `assets/js/config.js`:
```js
supabase: {
  url: 'https://xxxx.supabase.co',
  anonKey: 'sb_publishable_...',
  evidenceBucket: 'task-evidence',
}
```

> Chỉ dùng anon/publishable key ở client. Không đưa `service_role` vào code.

### Bước 5 — Cấp tài khoản thành viên
Xem mục 4. Thành viên đăng nhập tại `member.html`.

### Bảo mật
- RLS bật trên toàn bộ bảng.
- Admin: toàn quyền qua `profiles.role = 'admin'`.
- Thành viên: chỉ đọc task/evidence/activity của mình; cập nhật qua RPC có kiểm tra quyền.
- Khách: chỉ đọc sản phẩm/đánh giá/mã giảm giá đang hoạt động; gửi đánh giá/đăng ký nhận tin.
- Ảnh bằng chứng: bucket public read, admin ghi toàn bộ, thành viên ghi trong thư mục `members/{memberId}/...`.

---

## 7. Công thức tính toán

```
Doanh thu thuần = Σ(giá bán × SL) − giảm giá
Giá vốn (COGS)  = Σ(giá vốn × SL)
Phí kênh        = Doanh thu thuần × % phí kênh
Marketing       = Doanh thu thuần × % marketing
Đóng gói        = Số đơn × phí đóng gói
Vận chuyển ròng = Chi phí ship thực tế − phí ship thu của khách
Lợi nhuận góp   = Doanh thu − COGS − phí kênh − marketing − đóng gói − vận chuyển ròng
Thuế            = max(0, Doanh thu − ngưỡng miễn thuế phân bổ) × (VAT + TNCN)
Lợi nhuận ròng  = Lợi nhuận góp − chi phí cố định − thuế

Điểm hoà vốn/tháng = Chi phí cố định tháng ÷ biên lợi nhuận góp
NPV = −Vốn đầu tư + Σ(Lợi nhuận năm t ÷ (1 + r)^t)
IRR = nghiệm NPV = 0 (bisection)
Hoàn vốn = tháng đầu tiên luỹ kế lợi nhuận ≥ vốn đầu tư
```

Mặc định thuế hộ kinh doanh: VAT 1% + TNCN 0,5% trên doanh thu vượt ngưỡng 200 triệu/năm. Tất cả thông số chỉnh trong **Cài đặt → Tài chính**.

---

## 8. Cấu trúc dự án

```
Web/
├─ index.html                     Website bán hàng
├─ dashboard.html                 Dashboard quản trị
├─ member.html                    Cổng đăng nhập thành viên
├─ Wed.html                       Bản thiết kế ban đầu (giữ nguyên)
├─ assets/
│  ├─ css/
│  │  ├─ storefront.css
│  │  ├─ dashboard.css
│  │  └─ member.css
│  ├─ js/
│  │  ├─ config.js                Thương hiệu + Supabase URL/key
│  │  ├─ core/util.js             Định dạng, icon, toast…
│  │  ├─ core/store.js            localStorage + nghiệp vụ
│  │  ├─ core/finance.js          P&L, hoà vốn, dự phóng, KPI
│  │  ├─ core/remote.js           Supabase API (push/pull/auth/member)
│  │  ├─ core/sync.js             Tự động đẩy thay đổi
│  │  ├─ data/catalog.js          14 sản phẩm
│  │  ├─ data/content.js          Nội dung, đánh giá mẫu
│  │  ├─ data/seed.js             Sinh dữ liệu demo
│  │  ├─ shop/app.js              Storefront + cloud bootstrap
│  │  ├─ shop/checkout.js         Thanh toán/đơn/tra cứu
│  │  ├─ dash/app.js              Khung dashboard + auth + sync UI
│  │  ├─ dash/overview.js
│  │  ├─ dash/sales.js
│  │  ├─ dash/finance-views.js
│  │  ├─ dash/team.js             Thành viên + tài khoản + task/bằng chứng
│  │  ├─ dash/settings.js
│  │  └─ member.js                Cổng thành viên
│  └─ img/                        SVG sản phẩm/nguyên liệu/hero
├─ supabase/
│  ├─ schema.sql                  Schema đầy đủ (mới)
│  ├─ seed.sql                    Dữ liệu mẫu
│  └─ migration-v2-auth-sync.sql  Nâng cấp project đã có schema cũ
├─ tools/                         Script sinh ảnh & seed (dev)
└─ README.md
```

---

## 9. Dữ liệu & sao lưu

- LocalStorage tiền tố `mt.v2.`; Supabase là nguồn trung tâm khi đã đăng nhập.
- **Cài đặt → Dữ liệu**: xuất/nhập JSON, khôi phục dữ liệu mẫu, xem dung lượng và số ảnh bằng chứng.
- Ảnh bằng chứng được nén (tối đa 1200px, JPEG ~72%) trước khi lưu/upload.
- Nếu localStorage đầy, xuất sao lưu rồi xoá bớt bằng chứng cũ.
- Reset nhanh:
```js
localStorage.clear(); location.reload();
```

---

## 10. Tùy chỉnh

| Muốn thay đổi | Sửa ở |
|---|---|
| Thông tin cửa hàng/ngân hàng | Cài đặt → Cửa hàng |
| Phí ship/freeship | Cài đặt → Vận chuyển |
| Chi phí cố định/thuế/mục tiêu | Cài đặt → Tài chính |
| Mã giảm giá | Cài đặt → Mã giảm giá |
| Supabase URL/key | `assets/js/config.js` hoặc Cài đặt → Supabase |
| Danh mục/sản phẩm gốc | `assets/js/data/catalog.js` hoặc CRUD dashboard |
| Nội dung/nguyên liệu/bài viết | `assets/js/data/content.js` |
| Dữ liệu mẫu | `assets/js/data/seed.js` |
| Màu website | `assets/css/storefront.css` (`:root`) |
| Màu dashboard/member | `assets/css/dashboard.css`, `member.css` (`:root`) |

Công cụ phát triển:
```bash
node tools/generate-product-images.mjs
node tools/generate-art.mjs
node tools/generate-supabase-seed.mjs
```

---

## 11. Giới hạn & lưu ý

- Thanh toán mô phỏng, QR minh hoạ; muốn thật cần tích hợp cổng thanh toán phía server.
- Dashboard demo chưa chặn route; bảo mật dữ liệu dựa trên Supabase Auth + RLS. Khi production nên thêm guard hiển thị và xác thực server.
- Tạo tài khoản thành viên dùng `auth.signUp` với anon key, phụ thuộc cài đặt **Confirm email** của Supabase. Nếu bật, cần xác nhận email trước khi đăng nhập.
- Project Supabase cũ chưa chạy migration sẽ chưa có RPC `public_store_settings`, quyền đọc `coupons` và các bảng auth của thành viên. Khi đó website vẫn tự cập nhật sản phẩm/đánh giá; cài đặt/mã giảm giá và cổng thành viên cần migration.
- Realtime cần bảng nằm trong publication `supabase_realtime`; migration đã bật. Nếu chưa, ứng dụng tự polling.
- Ảnh bằng chứng cũ dạng data URL sẽ được upload lên Storage trong lần đẩy kế tiếp; cần bucket `task-evidence` và quyền Storage.
- Chart.js/Google Fonts tải từ CDN; ảnh sản phẩm là SVG nội bộ.

---

## 12. Kiểm thử

Đã kiểm thử bằng Chromium headless:
- Storefront: tải trang, tự pull sản phẩm từ Supabase, lọc, chi tiết, giỏ, thanh toán, tra cứu.
- Dashboard: KPI/biểu đồ, đơn hàng, CRUD sản phẩm/thành viên/nhiệm vụ/mã giảm giá, bằng chứng ảnh/text, cổng thành viên nội bộ.
- Tự động đẩy: sản phẩm, cài đặt, thành viên, nhiệm vụ, đơn hàng (mock).
- Đăng nhập admin, banner trạng thái, form cấp tài khoản thành viên.
- Cổng thành viên: màn hình đăng nhập, cấu hình, responsive.
- Không có lỗi console trên các luồng local/cloud-public.

---

Bản dashboard gốc được sao lưu tại `_backup/dashboard-v1.html` (nếu có). `Wed.html` là bản thiết kế ban đầu.

© 2026 Mây Trắng.
