/* ==========================================================================
   MÂY TRẮNG – Dashboard: Cài đặt, mã giảm giá, dữ liệu, Supabase
   ========================================================================== */
(function () {
  const MT = window.MT;
  const D = MT.dash;
  const U = MT.util;

  const ST = (D.settingsState = D.settingsState || { tab: 'store' });
  const TABS = [
    ['store', 'Cửa hàng', 'pin'],
    ['shipping', 'Vận chuyển', 'truck'],
    ['finance', 'Tài chính', 'wallet'],
    ['coupons', 'Mã giảm giá', 'gift'],
    ['data', 'Dữ liệu & sao lưu', 'download'],
    ['supabase', 'Supabase', 'globe'],
  ];

  const couponType = { percent: 'Giảm theo %', fixed: 'Giảm số tiền', shipping: 'Miễn phí ship' };

  function field(label, id, value, opts) {
    const o = opts || {};
    return '<div class="field"><label for="' + id + '">' + label + '</label>' +
      (o.textarea ? '<textarea class="textarea" id="' + id + '" rows="' + (o.rows || 3) + '">' + U.esc(value) + '</textarea>'
        : '<input class="input" id="' + id + '" ' + (o.type ? 'type="' + o.type + '"' : '') + ' value="' + U.esc(value) + '" ' + (o.placeholder ? 'placeholder="' + U.esc(o.placeholder) + '"' : '') + '>') +
      (o.hint ? '<span class="field-hint">' + o.hint + '</span>' : '') + '</div>';
  }

  /* ------------------------------- Store ---------------------------------- */
  function storePanel() {
    const s = MT.db.settings().store;
    return '<div class="settings-panel"><h3>Thông tin cửa hàng</h3><p class="panel-sub">Hiển thị trên website, hoá đơn và các tài liệu bán hàng.</p>' +
      '<div class="field-row">' + field('Tên thương hiệu', 'stName', s.name) + field('Tên pháp lý', 'stLegal', s.legal) + '</div>' +
      '<div class="field-row">' + field('Hotline', 'stHotline', s.hotline) + field('Email', 'stEmail', s.email, { type: 'email' }) + '</div>' +
      '<div class="field-row">' + field('Mã số thuế', 'stTax', s.taxCode) + field('Website', 'stWebsite', MT.config.brand.website) + '</div>' +
      field('Địa chỉ', 'stAddress', s.address) +
      field('Thông điệp chạy đầu trang', 'stAnnounce', s.announcement) +
      '<div class="settings-block"><h4>Thông tin ngân hàng nhận chuyển khoản</h4>' +
        '<div class="field-row field-row--3">' + field('Ngân hàng', 'stBankName', s.bank.name) + field('Số tài khoản', 'stBankNo', s.bank.no) + field('Chủ tài khoản', 'stBankHolder', s.bank.holder) + '</div>' +
      '</div>' +
      '<button class="btn btn-primary" type="button" id="saveStore">' + D.icon('check', 14) + ' Lưu thông tin</button>' +
    '</div>';
  }

  /* ------------------------------ Shipping -------------------------------- */
  function shippingPanel() {
    const s = MT.db.settings().shipping;
    const zones = [['hn', 'Hà Nội'], ['hcm', 'TP. Hồ Chí Minh'], ['north', 'Miền Bắc'], ['central', 'Miền Trung'], ['south', 'Miền Nam']];
    return '<div class="settings-panel"><h3>Vận chuyển &amp; đóng gói</h3><p class="panel-sub">Áp dụng cho đơn đặt trên website. Các sàn TMĐT dùng phí riêng của sàn.</p>' +
      '<div class="field-row field-row--3">' + field('Miễn phí ship từ', 'shFree', s.freeThreshold, { type: 'number', hint: 'VNĐ' }) +
        field('Phụ phí giao nhanh', 'shExpress', s.expressFee, { type: 'number', hint: 'VNĐ' }) +
        field('Phí nhận tại showroom', 'shPickup', s.pickupFee, { type: 'number', hint: 'VNĐ' }) + '</div>' +
      '<div class="settings-block"><h4>Phí giao tiêu chuẩn theo khu vực</h4><div class="fee-grid">' +
        zones.map(([k, l]) => field(l, 'shFee_' + k, s.fees[k], { type: 'number' })).join('') + '</div></div>' +
      '<div class="settings-block"><h4>Chi phí thực tế</h4><div class="field-row">' +
        field('Đóng gói / đơn', 'shPack', s.packagingPerOrder, { type: 'number', hint: 'VNĐ' }) +
        field('Cước ship trung bình / đơn', 'shShipCost', s.avgShipCost, { type: 'number', hint: 'VNĐ' }) + '</div></div>' +
      '<button class="btn btn-primary" type="button" id="saveShipping">' + D.icon('check', 14) + ' Lưu vận chuyển</button>' +
    '</div>';
  }

  /* ------------------------------- Finance -------------------------------- */
  function financePanel() {
    const f = MT.db.settings().finance;
    return '<div class="settings-panel"><h3>Thông số tài chính</h3><p class="panel-sub">Ảnh hưởng trực tiếp tới P&amp;L, điểm hoà vốn và mô hình 3 năm.</p>' +
      '<div class="settings-block"><h4>Chi phí cố định hằng tháng</h4><div id="fixedRows">' +
        f.monthlyFixed.map((x) => '<div class="fixed-cost-row" data-fixed-row="' + x.id + '"><input class="input" data-fixed-name value="' + U.esc(x.name) + '"><input class="input" data-fixed-amount type="number" step="100000" value="' + x.amount + '"><button class="btn btn-icon" type="button" data-fixed-remove>' + D.icon('trash', 13) + '</button></div>').join('') +
      '</div><div style="display:flex;justify-content:space-between;align-items:center;margin-top:.5rem"><button class="btn btn-sm" type="button" id="addFixed">' + D.icon('plus', 13) + ' Thêm khoản chi</button><span style="font-size:.72rem;color:var(--db-muted)">Tổng: <strong id="fixedTotal" style="color:var(--db-ink)">' + D.money(f.monthlyFixed.reduce((a, b) => a + b.amount, 0)) + '</strong>/tháng</span></div></div>' +
      '<div class="settings-block"><h4>Tỷ lệ &amp; mục tiêu</h4>' +
        '<div class="field-row field-row--3">' +
          field('Marketing / doanh thu', 'fMarket', f.marketingRatePct, { type: 'number', hint: '%' }) +
          field('Mục tiêu doanh thu năm', 'fTarget', f.targetRevenue, { type: 'number', hint: 'VNĐ' }) +
          field('Vốn đầu tư ban đầu', 'fInvest', f.initialInvestment, { type: 'number', hint: 'VNĐ' }) +
        '</div>' +
        '<div class="field-row field-row--3">' +
          field('Tăng trưởng năm 2', 'fG2', f.growthY2Pct, { type: 'number', hint: '%' }) +
          field('Tăng trưởng năm 3', 'fG3', f.growthY3Pct, { type: 'number', hint: '%' }) +
          field('Tỷ lệ chiết khấu', 'fDiscount', f.discountRatePct, { type: 'number', hint: '%' }) +
        '</div>' +
        '<div class="field-row field-row--3">' +
          field('Lạm phát giá vốn', 'fInflation', f.cogsInflationPct, { type: 'number', hint: '%/năm' }) +
          field('Tăng chi phí cố định', 'fFixedGrowth', f.fixedGrowthPct, { type: 'number', hint: '%/năm' }) +
          field('Tỷ lệ chuyển đổi web', 'fConversion', f.conversionRatePct, { type: 'number', hint: '%' }) +
        '</div>' +
      '</div>' +
      '<div class="settings-block"><h4>Thuế hộ kinh doanh</h4>' +
        '<label class="check" style="margin-bottom:.6rem"><input type="checkbox" id="taxEnabled" ' + (f.tax.enabled ? 'checked' : '') + '> Tính thuế trên doanh thu vượt ngưỡng miễn thuế</label>' +
        '<div class="field-row field-row--3">' +
          field('Ngưỡng miễn thuế / năm', 'taxThreshold', f.tax.threshold, { type: 'number', hint: 'VNĐ' }) +
          field('Thuế GTGT', 'taxVat', f.tax.vatPct, { type: 'number', hint: '%' }) +
          field('Thuế TNCN', 'taxPit', f.tax.pitPct, { type: 'number', hint: '%' }) +
        '</div>' +
        '<p style="font-size:.65rem;color:var(--db-muted)">Công thức: Thuế = (Doanh thu − ngưỡng miễn thuế) × (VAT + TNCN). Ngưỡng được phân bổ theo số ngày của kỳ báo cáo.</p>' +
      '</div>' +
      '<button class="btn btn-primary" type="button" id="saveFinance">' + D.icon('check', 14) + ' Lưu thông số tài chính</button>' +
    '</div>';
  }

  /* ------------------------------- Coupons -------------------------------- */
  function couponsPanel() {
    const coupons = MT.db.data.coupons || [];
    return '<div class="settings-panel"><div style="display:flex;justify-content:space-between;gap:.8rem;align-items:flex-start;flex-wrap:wrap"><div><h3>Mã giảm giá</h3><p class="panel-sub">Khách nhập mã tại bước thanh toán trên website.</p></div>' +
      '<button class="btn btn-primary btn-sm" type="button" id="addCoupon">' + D.icon('plus', 14) + ' Thêm mã</button></div>' +
      '<div class="table-wrap" style="border:1px solid var(--db-line);border-radius:10px"><table><thead><tr><th>Mã</th><th>Ưu đãi</th><th class="num">Đơn tối thiểu</th><th>Hết hạn</th><th class="num">Đã dùng</th><th>Trạng thái</th><th></th></tr></thead><tbody>' +
        (coupons.length ? coupons.map((c) => '<tr><td><strong style="letter-spacing:.04em">' + U.esc(c.code) + '</strong><div style="font-size:.62rem;color:var(--db-muted)">' + U.esc(couponType[c.type] || c.type) + '</div></td>' +
          '<td>' + U.esc(c.label) + (c.maxDiscount ? '<div style="font-size:.62rem;color:var(--db-muted)">Tối đa ' + D.money(c.maxDiscount) + '</div>' : '') + '</td>' +
          '<td class="num">' + D.money(c.minOrder) + '</td><td>' + (c.expires ? U.fmt.date(c.expires) : '—') + '</td><td class="num">' + U.fmt.num(c.usageCount || 0) + '</td>' +
          '<td><span class="badge badge-' + (c.active ? 'success' : 'gray') + '">' + (c.active ? 'Đang áp dụng' : 'Tắt') + '</span></td>' +
          '<td><div class="table-actions"><button class="btn btn-sm btn-icon" type="button" data-edit-coupon="' + c.id + '" title="Sửa">' + D.icon('edit', 13) + '</button>' +
          '<button class="btn btn-sm btn-icon" type="button" data-toggle-coupon="' + c.id + '" title="Bật/tắt">' + D.icon(c.active ? 'close' : 'check', 13) + '</button>' +
          '<button class="btn btn-sm btn-icon" type="button" data-del-coupon="' + c.id + '" title="Xoá">' + D.icon('trash', 13) + '</button></div></td></tr>').join('')
          : '<tr><td colspan="7"><div class="empty-state"><h3>Chưa có mã giảm giá</h3><p>Tạo mã để khuyến khích khách chốt đơn.</p></div></td></tr>') +
      '</tbody></table></div></div>';
  }

  function openCouponForm(id) {
    const c = id ? (MT.db.data.coupons || []).find((x) => x.id === id) : null;
    const body =
      '<div class="field-row"><div class="field"><label>Mã <span class="req">*</span></label><input class="input" id="cpCode" value="' + U.esc(c ? c.code : '') + '" placeholder="MAY10" style="text-transform:uppercase"><span class="field-error">Mã đã tồn tại hoặc không hợp lệ.</span></div>' +
      '<div class="field"><label>Loại ưu đãi</label><select class="select" id="cpType">' +
        Object.keys(couponType).map((k) => '<option value="' + k + '" ' + (c && c.type === k ? 'selected' : '') + '>' + couponType[k] + '</option>').join('') + '</select></div></div>' +
      '<div class="field-row field-row--3"><div class="field"><label>Giá trị</label><input class="input" id="cpValue" type="number" min="0" value="' + (c ? c.value : 10) + '"></div>' +
      '<div class="field"><label>Giảm tối đa</label><input class="input" id="cpMax" type="number" min="0" step="10000" value="' + (c ? c.maxDiscount : 100000) + '"></div>' +
      '<div class="field"><label>Đơn tối thiểu</label><input class="input" id="cpMin" type="number" min="0" step="10000" value="' + (c ? c.minOrder : 0) + '"></div></div>' +
      '<div class="field"><label>Mô tả hiển thị</label><input class="input" id="cpLabel" value="' + U.esc(c ? c.label : '') + '" placeholder="Giảm 10% tối đa 100.000đ"></div>' +
      '<div class="field-row"><div class="field"><label>Hết hạn</label><input class="input" type="date" id="cpExpires" value="' + (c && c.expires ? U.fmt.dateInput(c.expires) : U.fmt.dateInput(U.addDays(new Date(), 90))) + '"></div>' +
      '<div class="field"><label>Trạng thái</label><select class="select" id="cpActive"><option value="1" ' + (!c || c.active ? 'selected' : '') + '>Đang áp dụng</option><option value="0" ' + (c && !c.active ? 'selected' : '') + '>Tắt</option></select></div></div>';
    D.modal({
      title: c ? 'Sửa mã giảm giá' : 'Thêm mã giảm giá',
      body,
      footer: '<button class="btn" type="button" data-modal-close>Huỷ</button><button class="btn btn-primary" type="button" id="cpSubmit">Lưu mã</button>',
      onMount(el, close) {
        el.querySelector('#cpSubmit').addEventListener('click', () => {
          const code = el.querySelector('#cpCode').value.trim().toUpperCase();
          const fieldCode = el.querySelector('#cpCode').closest('.field');
          fieldCode.classList.remove('invalid');
          if (!/^[A-Z0-9_-]{3,20}$/.test(code) || (MT.db.data.coupons || []).some((x) => x.id !== id && x.code === code)) {
            fieldCode.classList.add('invalid'); return;
          }
          const data = {
            id: c ? c.id : U.uid('CP'),
            code,
            type: el.querySelector('#cpType').value,
            value: Number(el.querySelector('#cpValue').value) || 0,
            maxDiscount: Number(el.querySelector('#cpMax').value) || 0,
            minOrder: Number(el.querySelector('#cpMin').value) || 0,
            label: el.querySelector('#cpLabel').value.trim() || code,
            expires: el.querySelector('#cpExpires').value,
            active: el.querySelector('#cpActive').value === '1',
            usageCount: c ? c.usageCount || 0 : 0,
          };
          if (c) {
            const idx = MT.db.data.coupons.findIndex((x) => x.id === id);
            MT.db.data.coupons[idx] = data;
          } else {
            MT.db.data.coupons.push(data);
          }
          MT.db.save('coupons');
          D.toast(c ? 'Đã cập nhật mã giảm giá' : 'Đã thêm mã giảm giá', 'success');
          close(); D.refresh();
        });
      },
    });
  }

  /* --------------------------------- Data --------------------------------- */
  function dataPanel() {
    const size = MT.db.storageSize();
    const max = 5 * 1024 * 1024;
    const pct = Math.min(100, size / max * 100);
    const ev = MT.db.evidenceStats();
    const settings = MT.db.settings();
    return '<div class="settings-panel"><h3>Dữ liệu &amp; sao lưu</h3><p class="panel-sub">Toàn bộ dữ liệu demo đang lưu trên trình duyệt (localStorage). Hãy xuất bản sao lưu định kỳ.</p>' +
      '<div class="settings-block"><h4>Dung lượng lưu trữ</h4>' +
        '<div style="display:flex;justify-content:space-between;font-size:.74rem"><span>Đã dùng <strong>' + U.fmt.bytes(size) + '</strong></span><span class="text-muted">Giới hạn ~5 MB</span></div>' +
        '<div class="storage-bar"><span style="width:' + pct + '%"></span></div>' +
        '<div style="font-size:.68rem;color:var(--db-muted)">' + (pct > 80 ? 'Dung lượng gần đầy — nên xuất dữ liệu và xoá bớt ảnh bằng chứng.' : 'Còn ' + U.fmt.bytes(Math.max(0, max - size)) + ' trống.') + '</div>' +
        '<div class="grid grid-3" style="margin-top:.8rem;font-size:.72rem">' +
          '<div style="background:var(--db-line-soft);border-radius:9px;padding:.6rem"><span class="text-muted">Đơn hàng</span><strong style="display:block">' + MT.db.data.orders.length + '</strong></div>' +
          '<div style="background:var(--db-line-soft);border-radius:9px;padding:.6rem"><span class="text-muted">Nhiệm vụ</span><strong style="display:block">' + MT.db.data.tasks.length + '</strong></div>' +
          '<div style="background:var(--db-line-soft);border-radius:9px;padding:.6rem"><span class="text-muted">Bằng chứng</span><strong style="display:block">' + ev.texts + ' văn bản · ' + ev.images + ' ảnh</strong><span style="font-size:.62rem;color:var(--db-muted)">' + U.fmt.bytes(ev.bytes) + ' ảnh nén</span></div>' +
        '</div></div>' +
      '<div class="settings-block"><h4>Sao lưu &amp; phục hồi</h4>' +
        '<div style="display:flex;gap:.5rem;flex-wrap:wrap">' +
          '<button class="btn btn-primary" type="button" id="exportData">' + D.icon('download', 14) + ' Xuất toàn bộ (JSON)</button>' +
          '<label class="btn" style="position:relative;overflow:hidden">' + D.icon('upload', 14) + ' Nhập từ file<input type="file" id="importData" accept="application/json,.json" style="position:absolute;inset:0;opacity:0;cursor:pointer"></label>' +
          '<button class="btn" type="button" id="resetData" style="color:var(--db-danger)">' + D.icon('refresh', 14) + ' Khôi phục dữ liệu mẫu</button>' +
        '</div>' +
        '<p style="font-size:.66rem;color:var(--db-muted);margin-top:.6rem">File xuất bao gồm sản phẩm, đơn hàng, thành viên, nhiệm vụ, bằng chứng, đánh giá và cấu hình. Nhập file sẽ <strong>thay thế</strong> dữ liệu hiện tại.</p>' +
      '</div>' +
      '<div class="settings-block"><h4>Thông tin hệ thống</h4><div class="drawer-meta" style="font-size:.72rem">' +
        '<div><span>Phiên bản</span><strong>Mây Trắng ' + MT.config.version + '</strong></div>' +
        '<div><span>Môi trường</span><strong id="dbMode">LocalStorage</strong></div>' +
        '<div><span>Cập nhật gần nhất</span><strong>' + U.fmt.datetime(settings.updatedAt || new Date()) + '</strong></div>' +
        '<div><span>Supabase</span><strong>' + (MT.remote.isConfigured() ? 'Đã cấu hình' : 'Chưa kết nối') + '</strong></div>' +
      '</div></div></div>';
  }

  /* -------------------------------- Supabase ------------------------------ */
  function supabasePanel() {
    const cfg = MT.remote.getConfig();
    const status = MT.remote.status();
    return '<div class="settings-panel"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:.8rem;flex-wrap:wrap"><div><h3>Kết nối Supabase</h3><p class="panel-sub">Đồng bộ dữ liệu lên Postgres &amp; Storage khi bạn sẵn sàng. Ứng dụng vẫn hoạt động đầy đủ nếu chưa cấu hình.</p></div>' +
      '<span class="conn-status ' + (status.configured ? 'ok' : '') + '" id="supaStatus">' + (status.configured ? 'Đã cấu hình' : 'Chưa cấu hình') + '</span></div>' +
      '<div class="settings-block"><h4>Thông tin kết nối</h4>' +
        '<div class="field"><label>Project URL</label><input class="input" id="sbUrl" placeholder="https://xxxx.supabase.co" value="' + U.esc(cfg.url) + '"></div>' +
        '<div class="field"><label>Anon public key</label><input class="input" id="sbKey" placeholder="eyJhbGciOi…" value="' + U.esc(cfg.anonKey) + '"><span class="field-hint">Chỉ dùng anon key ở phía trình duyệt. Không dùng service_role key.</span></div>' +
        '<div class="field"><label>Storage bucket cho bằng chứng</label><input class="input" id="sbBucket" value="' + U.esc(cfg.evidenceBucket) + '"></div>' +
        '<div style="display:flex;gap:.5rem;flex-wrap:wrap"><button class="btn btn-primary" type="button" id="saveSupa">' + D.icon('check', 14) + ' Lưu cấu hình</button>' +
        '<button class="btn" type="button" id="testSupa">' + D.icon('activity', 14) + ' Kiểm tra kết nối</button>' +
        '<button class="btn" type="button" id="loginSupa">' + D.icon('user', 14) + ' ' + (status.signedIn ? U.esc(status.email) : 'Đăng nhập quản trị') + '</button></div>' +
      '</div>' +
      '<div class="settings-block"><h4>Đồng bộ dữ liệu</h4>' +
        '<p style="font-size:.76rem;color:var(--db-muted);margin-bottom:.7rem">Đẩy dữ liệu cục bộ lên Supabase hoặc tải dữ liệu trên cloud về máy. Cần đăng nhập tài khoản quản trị đã tạo trong bảng <code>profiles</code>.</p>' +
        '<div style="display:flex;gap:.5rem;flex-wrap:wrap"><button class="btn btn-primary" type="button" id="pushSupa">' + D.icon('upload', 14) + ' Đẩy dữ liệu lên</button>' +
        '<button class="btn" type="button" id="pullSupa">' + D.icon('download', 14) + ' Tải dữ liệu về</button></div>' +
        '<div style="font-size:.68rem;color:var(--db-muted);margin-top:.6rem">Ảnh bằng chứng đang lưu cục bộ dạng data URL. Khi đẩy lên cloud, nên cấu hình bucket <code>' + U.esc(cfg.evidenceBucket) + '</code> và dùng chức năng Storage (xem hướng dẫn trong README).</div>' +
      '</div>' +
      '<div class="settings-block"><h4>Hướng dẫn nhanh</h4>' +
        '<ol style="font-size:.76rem;color:var(--db-ink-2);padding-left:1.2rem;line-height:1.9">' +
          '<li>Tạo project tại <strong>supabase.com</strong>.</li>' +
          '<li>Project mới: mở SQL Editor, chạy <code>supabase/schema.sql</code> rồi <code>supabase/seed.sql</code>.</li><li>Project đã có bảng: chạy <code>supabase/migration-v2-auth-sync.sql</code> để bổ sung tài khoản thành viên, RLS và realtime.</li>' +
          '<li>Tạo user quản trị trong Authentication → Users, sau đó thêm bản ghi vào bảng <code>profiles</code> với role <code>admin</code>.</li>' +
          '<li>Dán Project URL và anon key vào ô phía trên, lưu cấu hình.</li>' +
          '<li>Đăng nhập và bấm “Đẩy dữ liệu lên”.</li><li>Tạo tài khoản cho thành viên trong mục <strong>Thành viên</strong>; thành viên đăng nhập tại <code>member.html</code>.</li>' +
        '</ol>' +
        '<div class="code-box">-- Kiểm tra nhanh sau khi cài đặt\nselect count(*) from products;\nselect count(*) from orders;</div>' +
      '</div>' +
      '<div class="settings-block"><h4>Trạng thái phiên</h4><div class="drawer-meta" style="font-size:.72rem">' +
        '<div><span>Tài khoản</span><strong>' + U.esc(status.email || 'Chưa đăng nhập') + '</strong></div>' +
        '<div><span>Chế độ dữ liệu</span><strong>' + (status.configured ? 'Local + Supabase' : 'LocalStorage') + '</strong></div>' +
      '</div>' +
      '<button class="btn btn-sm mt-2" type="button" id="logoutSupa"' + (status.signedIn ? '' : ' disabled') + '>Đăng xuất</button></div>' +
    '</div>';
  }

  /* -------------------------------- Render -------------------------------- */
  function panelHtml() {
    switch (ST.tab) {
      case 'shipping': return shippingPanel();
      case 'finance': return financePanel();
      case 'coupons': return couponsPanel();
      case 'data': return dataPanel();
      case 'supabase': return supabasePanel();
      default: return storePanel();
    }
  }

  function refreshPanel() {
    const host = document.getElementById('settingsPanelHost');
    if (!host) return;
    host.innerHTML = panelHtml();
    bindPanel();
  }

  function bindPanel() {
    const tab = ST.tab;
    if (tab === 'store') {
      const btn = document.getElementById('saveStore');
      if (btn) btn.addEventListener('click', () => {
        const get = (id) => document.getElementById(id).value.trim();
        MT.db.updateSettings((st) => {
          st.store.name = get('stName'); st.store.legal = get('stLegal'); st.store.hotline = get('stHotline');
          st.store.email = get('stEmail'); st.store.taxCode = get('stTax'); st.store.address = get('stAddress');
          st.store.announcement = get('stAnnounce');
          st.store.bank.name = get('stBankName'); st.store.bank.no = get('stBankNo'); st.store.bank.holder = get('stBankHolder');
        });
        D.toast('Đã lưu thông tin cửa hàng', 'success');
      });
    }
    if (tab === 'shipping') {
      const btn = document.getElementById('saveShipping');
      if (btn) btn.addEventListener('click', () => {
        const num = (id) => Number(document.getElementById(id).value) || 0;
        MT.db.updateSettings((st) => {
          st.shipping.freeThreshold = num('shFree');
          st.shipping.expressFee = num('shExpress');
          st.shipping.pickupFee = num('shPickup');
          st.shipping.packagingPerOrder = num('shPack');
          st.shipping.avgShipCost = num('shShipCost');
          ['hn', 'hcm', 'north', 'central', 'south'].forEach((k) => { st.shipping.fees[k] = num('shFee_' + k); });
        });
        D.toast('Đã lưu cấu hình vận chuyển', 'success');
      });
    }
    if (tab === 'finance') {
      const rows = document.getElementById('fixedRows');
      const updateTotal = () => {
        const total = U.sum(Array.from(rows.querySelectorAll('[data-fixed-amount]')), (i) => Number(i.value) || 0);
        const el = document.getElementById('fixedTotal');
        if (el) el.textContent = D.money(total);
      };
      if (rows) {
        rows.addEventListener('input', (e) => { if (e.target.matches('[data-fixed-amount]')) updateTotal(); });
        rows.querySelectorAll('[data-fixed-remove]').forEach((b) => b.addEventListener('click', () => {
          if (rows.querySelectorAll('[data-fixed-row]').length <= 1) { D.toast('Cần ít nhất một khoản chi phí', 'error'); return; }
          b.closest('[data-fixed-row]').remove(); updateTotal();
        }));
        const add = document.getElementById('addFixed');
        if (add) add.addEventListener('click', () => {
          const wrap = document.createElement('div');
          wrap.className = 'fixed-cost-row';
          wrap.dataset.fixedRow = U.uid('fx');
          wrap.innerHTML = '<input class="input" data-fixed-name placeholder="Tên khoản chi" value=""><input class="input" data-fixed-amount type="number" step="100000" value="0"><button class="btn btn-icon" type="button" data-fixed-remove>' + D.icon('trash', 13) + '</button>';
          rows.appendChild(wrap);
          wrap.querySelector('[data-fixed-remove]').addEventListener('click', () => { wrap.remove(); updateTotal(); });
          wrap.querySelector('[data-fixed-name]').focus();
        });
      }
      const btn = document.getElementById('saveFinance');
      if (btn) btn.addEventListener('click', () => {
        const num = (id) => Number(document.getElementById(id).value) || 0;
        const fixed = Array.from(rows.querySelectorAll('[data-fixed-row]')).map((r) => ({
          id: r.dataset.fixedRow,
          name: r.querySelector('[data-fixed-name]').value.trim(),
          amount: Number(r.querySelector('[data-fixed-amount]').value) || 0,
        })).filter((x) => x.name);
        MT.db.updateSettings((st) => {
          st.finance.monthlyFixed = fixed;
          st.finance.marketingRatePct = num('fMarket');
          st.finance.targetRevenue = num('fTarget');
          st.finance.initialInvestment = num('fInvest');
          st.finance.growthY2Pct = num('fG2');
          st.finance.growthY3Pct = num('fG3');
          st.finance.discountRatePct = num('fDiscount');
          st.finance.cogsInflationPct = num('fInflation');
          st.finance.fixedGrowthPct = num('fFixedGrowth');
          st.finance.conversionRatePct = num('fConversion');
          st.finance.tax.enabled = document.getElementById('taxEnabled').checked;
          st.finance.tax.threshold = num('taxThreshold');
          st.finance.tax.vatPct = num('taxVat');
          st.finance.tax.pitPct = num('taxPit');
        });
        D.toast('Đã lưu thông số tài chính', 'success');
        D.refresh();
      });
    }
    if (tab === 'coupons') {
      const add = document.getElementById('addCoupon');
      if (add) add.addEventListener('click', () => openCouponForm());
      document.querySelectorAll('[data-edit-coupon]').forEach((b) => b.addEventListener('click', () => openCouponForm(b.dataset.editCoupon)));
      document.querySelectorAll('[data-toggle-coupon]').forEach((b) => b.addEventListener('click', () => {
        const c = MT.db.data.coupons.find((x) => x.id === b.dataset.toggleCoupon);
        if (!c) return;
        c.active = !c.active; MT.db.save('coupons'); D.toast('Đã ' + (c.active ? 'bật' : 'tắt') + ' mã ' + c.code, 'success'); D.refresh();
      }));
      document.querySelectorAll('[data-del-coupon]').forEach((b) => b.addEventListener('click', async () => {
        const c = MT.db.data.coupons.find((x) => x.id === b.dataset.delCoupon);
        if (!c) return;
        const ok = await D.confirm({ title: 'Xoá mã ' + c.code + '?', message: 'Mã giảm giá sẽ không còn hiệu lực với khách hàng.', confirmText: 'Xoá', danger: true });
        if (!ok) return;
        MT.bus.emit('entity:delete', { table: 'coupons', id: c.id });
        MT.db.data.coupons = MT.db.data.coupons.filter((x) => x.id !== c.id);
        MT.db.save('coupons'); D.toast('Đã xoá mã giảm giá', 'success'); D.refresh();
      }));
    }
    if (tab === 'data') {
      const ex = document.getElementById('exportData');
      if (ex) ex.addEventListener('click', () => {
        U.download('maytrang-backup-' + U.todayISO() + '.json', JSON.stringify(MT.db.exportAll(), null, 2), 'application/json');
        D.toast('Đã xuất bản sao lưu', 'success');
      });
      const imp = document.getElementById('importData');
      if (imp) imp.addEventListener('change', async () => {
        const file = imp.files[0];
        if (!file) return;
        const text = await file.text();
        const ok = await D.confirm({ title: 'Nhập dữ liệu từ file?', message: 'Toàn bộ dữ liệu hiện tại sẽ bị thay thế bằng nội dung file “' + file.name + '”.', confirmText: 'Nhập dữ liệu', danger: true });
        if (!ok) { imp.value = ''; return; }
        try {
          MT.db.importAll(text);
          D.toast('Đã nhập dữ liệu thành công', 'success');
          D.refresh();
        } catch (e) { D.toast(e.message, 'error'); }
        imp.value = '';
      });
      const reset = document.getElementById('resetData');
      if (reset) reset.addEventListener('click', async () => {
        const ok = await D.confirm({ title: 'Khôi phục dữ liệu mẫu?', message: 'Toàn bộ đơn hàng, nhiệm vụ, thành viên và bằng chứng hiện tại sẽ bị xoá và thay bằng dữ liệu demo ban đầu.', confirmText: 'Khôi phục', danger: true });
        if (!ok) return;
        MT.db.reset();
        D.toast('Đã khôi phục dữ liệu mẫu', 'success');
        D.refresh();
      });
    }
    if (tab === 'supabase') {
      const getCfg = () => ({
        url: document.getElementById('sbUrl').value.trim(),
        anonKey: document.getElementById('sbKey').value.trim(),
        evidenceBucket: document.getElementById('sbBucket').value.trim() || 'task-evidence',
      });
      const save = document.getElementById('saveSupa');
      if (save) save.addEventListener('click', () => {
        const cfg = getCfg();
        if (!cfg.url || !cfg.anonKey) { D.toast('Nhập đủ Project URL và anon key', 'error'); return; }
        MT.remote.saveConfig(cfg);
        if (MT.sync) { MT.sync.refresh(); }
        if (D.updateCloudUI) D.updateCloudUI();
        D.toast('Đã lưu cấu hình Supabase', 'success');
        D.refresh();
      });
      const test = document.getElementById('testSupa');
      if (test) test.addEventListener('click', async () => {
        if (!MT.remote.isConfigured()) { D.toast('Lưu cấu hình trước khi kiểm tra', 'error'); return; }
        test.disabled = true; test.textContent = 'Đang kiểm tra…';
        try {
          await MT.remote.test();
          D.toast('Kết nối Supabase thành công', 'success');
          const pill = document.getElementById('supaStatus');
          if (pill) { pill.className = 'conn-status ok'; pill.textContent = 'Kết nối OK'; }
        } catch (e) {
          D.toast(e.message, 'error');
          const pill = document.getElementById('supaStatus');
          if (pill) { pill.className = 'conn-status err'; pill.textContent = 'Lỗi kết nối'; }
        } finally { test.disabled = false; test.innerHTML = D.icon('activity', 14) + ' Kiểm tra kết nối'; }
      });
      const login = document.getElementById('loginSupa');
      if (login) login.addEventListener('click', () => {
        if (!MT.remote.isConfigured()) { D.toast('Lưu cấu hình trước khi đăng nhập', 'error'); return; }
        D.openAdminLogin({ onSuccess: () => { D.refresh(); if (MT.sync) MT.sync.refresh(); } });
      });
      const push = document.getElementById('pushSupa');
      if (push) push.addEventListener('click', async () => {
        if (!MT.remote.isConfigured()) { D.toast('Chưa cấu hình Supabase', 'error'); return; }
        const ok = await D.confirm({ title: 'Đẩy dữ liệu lên Supabase?', message: 'Sản phẩm, đơn hàng, thành viên, nhiệm vụ, bằng chứng và cài đặt sẽ được upsert lên cloud. Thao tác có thể mất vài giây.', confirmText: 'Đẩy dữ liệu' });
        if (!ok) return;
        push.disabled = true; push.textContent = 'Đang đồng bộ…';
        try {
          await MT.remote.push();
          D.toast('Đồng bộ lên Supabase thành công', 'success');
        } catch (e) { D.toast(e.message, 'error', { duration: 6000 }); }
        finally { push.disabled = false; push.innerHTML = D.icon('upload', 14) + ' Đẩy dữ liệu lên'; }
      });
      const pull = document.getElementById('pullSupa');
      if (pull) pull.addEventListener('click', async () => {
        if (!MT.remote.isConfigured()) { D.toast('Chưa cấu hình Supabase', 'error'); return; }
        const ok = await D.confirm({ title: 'Tải dữ liệu từ Supabase?', message: 'Dữ liệu cục bộ hiện tại sẽ bị thay thế bằng dữ liệu trên cloud. Hãy sao lưu trước nếu cần.', confirmText: 'Tải về', danger: true });
        if (!ok) return;
        pull.disabled = true; pull.textContent = 'Đang tải…';
        try {
          const res = await MT.remote.pull();
          D.toast('Đã tải ' + res.orders + ' đơn, ' + res.tasks + ' nhiệm vụ từ Supabase', 'success');
          D.refresh();
        } catch (e) { D.toast(e.message, 'error', { duration: 6000 }); }
        finally { pull.disabled = false; pull.innerHTML = D.icon('download', 14) + ' Tải dữ liệu về'; }
      });
      const logout = document.getElementById('logoutSupa');
      if (logout) logout.addEventListener('click', async () => {
        await MT.remote.signOut();
        D.toast('Đã đăng xuất', 'success');
        D.refresh();
      });
    }
  }

  D.register('settings', {
    title: 'Cài đặt & dữ liệu',
    crumb: 'Mây Trắng · Hệ thống',
    noRange: true,
    render() {
      return '<div class="settings-layout">' +
        '<div class="settings-nav">' + TABS.map(([k, l, ic]) =>
          '<button type="button" data-settings-tab="' + k + '" class="' + (ST.tab === k ? 'active' : '') + '">' + D.icon(ic, 15) + ' ' + l + '</button>').join('') + '</div>' +
        '<div id="settingsPanelHost">' + panelHtml() + '</div>' +
      '</div>';
    },
    mount() {
      document.querySelectorAll('[data-settings-tab]').forEach((b) => b.addEventListener('click', () => {
        ST.tab = b.dataset.settingsTab;
        document.querySelectorAll('[data-settings-tab]').forEach((x) => x.classList.toggle('active', x === b));
        refreshPanel();
      }));
      bindPanel();
    },
  });
})();
