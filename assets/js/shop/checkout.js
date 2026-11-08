/* ==========================================================================
   MÂY TRẮNG – Checkout, thanh toán, đơn hàng, tra cứu
   ========================================================================== */
(function () {
  const MT = window.MT;
  const S = MT.shop;
  const U = MT.util;
  const esc = U.esc;
  const money = U.fmt.money;
  const icon = U.icon;
  let co = null;

  const pageView = () => document.getElementById('pageView');
  const provinceList = MT.meta.provinces;

  function statusBadge(status) {
    const meta = MT.meta.orderStatus[status] || { label: status, cls: 'warn' };
    return '<span class="status-badge st-' + meta.cls + '">' + esc(meta.label) + '</span>';
  }

  function paymentLabel(method) {
    return (MT.meta.paymentMethods[method] || { short: method }).short;
  }

  function checkoutState() {
    const saved = MT.customer.get();
    return {
      step: 1,
      customer: {
        name: saved.name || '',
        phone: saved.phone || '',
        email: saved.email || '',
        province: saved.province || 'Hà Nội',
        address: saved.address || '',
        note: '',
      },
      shippingMethod: 'standard',
      paymentMethod: 'cod',
      terms: false,
      card: { number: '', name: '', expiry: '', cvv: '' },
      coupon: MT.cart.data().coupon || '',
      error: {},
      couponError: '',
      processing: false,
    };
  }

  function totalsFor(state, details) {
    return MT.pricing.totals(details.items, {
      couponCode: state.coupon,
      shippingMethod: state.shippingMethod,
      province: state.customer.province,
    });
  }

  function stepHeader(step) {
    const steps = [['Thông tin', 1], ['Vận chuyển', 2], ['Thanh toán', 3]];
    return '<div class="checkout-steps">' + steps.map(([label, n], i) => {
      const cls = step === n ? 'active' : step > n ? 'done' : '';
      return (i ? '<span class="step-line"></span>' : '') +
        '<div class="step ' + cls + '"><span class="num">' + (step > n ? '✓' : n) + '</span><span class="label">' + label + '</span></div>';
    }).join('') + '</div>';
  }

  function summaryHtml(details, t) {
    return '<aside class="summary">' +
      '<div class="summary__head"><h3>Đơn hàng của bạn</h3><span class="text-muted" style="font-size:.75rem">' + t.count + ' sản phẩm</span></div>' +
      '<div class="summary__items">' + details.items.map((it) =>
        '<div class="summary-item"><img src="' + esc(it.product.images[0]) + '" alt="" data-fallback>' +
        '<div><div class="summary-item__name">' + esc(it.product.name) + '</div>' +
        '<div class="summary-item__meta">' + (it.variant ? esc(it.variant) + ' · ' : '') + 'SL ' + it.qty + '</div></div>' +
        '<span class="summary-item__price">' + money(it.lineTotal) + '</span></div>').join('') + '</div>' +
      '<div class="summary__body">' +
        '<div class="coupon-row"><input class="input" id="couponInput" placeholder="Mã giảm giá" value="' + esc(co.coupon) + '" aria-label="Mã giảm giá">' +
        '<button class="btn" type="button" id="applyCoupon">Áp dụng</button></div>' +
        (co.couponError ? '<p class="coupon-msg err">' + esc(co.couponError) + '</p>' : '') +
        (!co.couponError && t.coupon ? '<p class="coupon-msg ok">' + icon('checkCircle', 12) + ' ' + esc(t.coupon.label) + ' <button type="button" id="removeCoupon" style="background:none;border:none;color:var(--may-ink-soft);text-decoration:underline;font-size:.72rem">Bỏ</button></p>' : '') +
        '<div class="summary-line"><span>Tạm tính</span><strong>' + money(t.subtotal) + '</strong></div>' +
        (t.discount ? '<div class="summary-line discount"><span>Giảm giá</span><strong>−' + money(t.discount) + '</strong></div>' : '') +
        '<div class="summary-line"><span>Vận chuyển</span><strong>' + (t.shippingFee ? money(t.shippingFee) : 'Miễn phí') + '</strong></div>' +
        (t.freeShipRemaining > 0 && !t.discount ? '<p style="font-size:.7rem;color:var(--may-ink-soft);margin:.2rem 0 .5rem">Mua thêm ' + money(t.freeShipRemaining) + ' để được miễn phí giao hàng</p>' : '') +
        '<div class="summary-total"><span>Tổng cộng</span><strong>' + money(t.total) + '</strong></div>' +
        '<p class="summary__secure">' + icon('shield', 13) + ' ' + esc(MT.db.settings().storefront.installmentNote) + '</p>' +
      '</div></aside>';
  }

  function checkoutHtml() {
    const details = MT.cart.details();
    if (!details.items.length) {
      return '<div class="page"><div class="container"><div class="empty" style="max-width:560px;margin:3rem auto">' +
        '<div class="cart-empty__icon" style="width:74px;height:74px;border-radius:50%;display:grid;place-items:center;background:var(--may-bg-soft);color:var(--may-blue-deep);margin:0 auto 1rem">' + icon('cart', 30) + '</div>' +
        '<h3>Giỏ hàng đang trống</h3><p>Thêm sản phẩm vào giỏ trước khi thanh toán nhé.</p>' +
        '<a href="#/san-pham" class="btn btn--sm">Khám phá sản phẩm</a></div></div></div>';
    }
    const t = totalsFor(co, details);
    const err = co.error || {};
    const e = (k) => (err[k] ? ' invalid' : '');

    let stepContent = '';
    if (co.step === 1) {
      stepContent =
        '<div class="checkout-card"><h3>Thông tin giao hàng</h3><p class="sub">Chúng tôi chỉ dùng thông tin này để giao hàng và liên hệ xác nhận.</p>' +
          '<div class="form-row">' +
            '<div class="field' + e('name') + '"><label for="coName">Họ và tên *</label><input class="input" id="coName" data-co="name" value="' + esc(co.customer.name) + '" placeholder="Nguyễn Ngọc Anh" autocomplete="name"><span class="field-error">' + esc(err.name || 'Vui lòng nhập họ tên.') + '</span></div>' +
            '<div class="field' + e('phone') + '"><label for="coPhone">Số điện thoại *</label><input class="input" id="coPhone" data-co="phone" value="' + esc(co.customer.phone) + '" placeholder="0901 234 567" inputmode="tel" autocomplete="tel"><span class="field-error">' + esc(err.phone || 'Số điện thoại chưa hợp lệ.') + '</span></div>' +
          '</div>' +
          '<div class="field' + e('email') + '"><label for="coEmail">Email <span class="text-muted" style="font-weight:400">(không bắt buộc)</span></label><input class="input" id="coEmail" data-co="email" type="email" value="' + esc(co.customer.email) + '" placeholder="ban@email.com" autocomplete="email"><span class="field-error">' + esc(err.email || 'Email chưa hợp lệ.') + '</span></div>' +
          '<div class="form-row">' +
            '<div class="field' + e('province') + '"><label for="coProvince">Tỉnh / Thành phố *</label><select class="select" id="coProvince" data-co="province" style="width:100%">' +
              provinceList.map((p) => '<option value="' + esc(p.name) + '" ' + (co.customer.province === p.name ? 'selected' : '') + '>' + esc(p.name) + '</option>').join('') +
            '</select><span class="field-error">' + esc(err.province || 'Chọn tỉnh/thành.') + '</span></div>' +
            '<div class="field' + e('address') + '"><label for="coAddress">Địa chỉ nhận hàng *</label><input class="input" id="coAddress" data-co="address" value="' + esc(co.customer.address) + '" placeholder="Số nhà, đường, phường/xã, quận/huyện" autocomplete="street-address"><span class="field-error">' + esc(err.address || 'Vui lòng nhập địa chỉ.') + '</span></div>' +
          '</div>' +
          '<div class="field"><label for="coNote">Ghi chú cho người bán</label><textarea class="textarea" id="coNote" data-co="note" placeholder="Ví dụ: giao giờ hành chính, gọi trước khi giao…">' + esc(co.customer.note) + '</textarea></div>' +
          '<div class="checkout-actions"><span style="font-size:.76rem;color:var(--may-ink-soft)">* Trường bắt buộc</span><button class="btn" type="button" id="coNext">Tiếp tục: Vận chuyển <span class="arrow">→</span></button></div>' +
        '</div>';
    } else if (co.step === 2) {
      const feeStandard = MT.pricing.shipping('standard', co.customer.province, t.afterDiscount);
      const feeExpress = MT.pricing.shipping('express', co.customer.province, t.afterDiscount);
      stepContent =
        '<div class="checkout-card"><h3>Phương thức vận chuyển</h3><p class="sub">Giao đến ' + esc(co.customer.province) + ' · ' + esc(co.customer.address) + '</p>' +
          '<div class="option-cards">' +
            '<label class="option-card ' + (co.shippingMethod === 'standard' ? 'active' : '') + '"><input type="radio" name="shipping" value="standard" ' + (co.shippingMethod === 'standard' ? 'checked' : '') + '>' +
              '<span style="color:var(--may-blue-deep)">' + icon('truck', 20) + '</span>' +
              '<div class="option-card__body"><strong>Giao hàng tiêu chuẩn</strong><span>' + feeStandard.label + ' · 2–4 ngày làm việc</span></div>' +
              '<span class="option-card__fee">' + (feeStandard.fee ? money(feeStandard.fee) : 'Miễn phí') + '</span></label>' +
            '<label class="option-card ' + (co.shippingMethod === 'express' ? 'active' : '') + '"><input type="radio" name="shipping" value="express" ' + (co.shippingMethod === 'express' ? 'checked' : '') + '>' +
              '<span style="color:var(--may-blue-deep)">' + icon('activity', 20) + '</span>' +
              '<div class="option-card__body"><strong>Giao nhanh</strong><span>Nội thành Hà Nội & TP.HCM trong 24 giờ</span></div>' +
              '<span class="option-card__fee">' + money(feeExpress.fee) + '</span></label>' +
            '<label class="option-card ' + (co.shippingMethod === 'pickup' ? 'active' : '') + '"><input type="radio" name="shipping" value="pickup" ' + (co.shippingMethod === 'pickup' ? 'checked' : '') + '>' +
              '<span style="color:var(--may-blue-deep)">' + icon('pin', 20) + '</span>' +
              '<div class="option-card__body"><strong>Nhận tại showroom Mây Trắng</strong><span>Số 18 Nguyễn Văn Huyên, Cầu Giấy, Hà Nội · 8:00–21:00</span></div>' +
              '<span class="option-card__fee">Miễn phí</span></label>' +
          '</div>' +
          '<div class="checkout-actions"><button class="back" type="button" id="coBack">← Quay lại thông tin</button><button class="btn" type="button" id="coNext">Tiếp tục: Thanh toán <span class="arrow">→</span></button></div>' +
        '</div>';
    } else {
      stepContent =
        '<div class="checkout-card"><h3>Phương thức thanh toán</h3><p class="sub">Chọn cách thanh toán thuận tiện nhất với bạn.</p>' +
          '<div class="option-cards">' +
            '<label class="option-card ' + (co.paymentMethod === 'cod' ? 'active' : '') + '"><input type="radio" name="payment" value="cod" ' + (co.paymentMethod === 'cod' ? 'checked' : '') + '>' +
              '<span style="color:var(--may-blue-deep)">' + icon('truck', 20) + '</span><div class="option-card__body"><strong>Thanh toán khi nhận hàng (COD)</strong><span>Kiểm tra hàng rồi mới thanh toán cho nhân viên giao.</span></div></label>' +
            '<label class="option-card ' + (co.paymentMethod === 'bank' ? 'active' : '') + '"><input type="radio" name="payment" value="bank" ' + (co.paymentMethod === 'bank' ? 'checked' : '') + '>' +
              '<span style="color:var(--may-blue-deep)">' + icon('bank', 20) + '</span><div class="option-card__body"><strong>Chuyển khoản ngân hàng</strong><span>Quét QR hoặc chuyển khoản, đơn xác nhận trong 5–10 phút.</span></div></label>' +
            '<label class="option-card ' + (co.paymentMethod === 'card' ? 'active' : '') + '"><input type="radio" name="payment" value="card" ' + (co.paymentMethod === 'card' ? 'checked' : '') + '>' +
              '<span style="color:var(--may-blue-deep)">' + icon('creditCard', 20) + '</span><div class="option-card__body"><strong>Thẻ ATM / Visa / Mastercard</strong><span>Thanh toán bảo mật qua cổng thanh toán.</span></div></label>' +
            '<label class="option-card ' + (co.paymentMethod === 'momo' ? 'active' : '') + '"><input type="radio" name="payment" value="momo" ' + (co.paymentMethod === 'momo' ? 'checked' : '') + '>' +
              '<span style="color:var(--may-blue-deep)">' + icon('momo', 20) + '</span><div class="option-card__body"><strong>Ví MoMo / ZaloPay</strong><span>Quét mã QR trong ứng dụng ví điện tử.</span></div></label>' +
          '</div>' +
          (co.paymentMethod === 'bank' ? '<div class="bank-info"><strong>Thông tin chuyển khoản</strong><dl class="mt-1">' +
            '<dt>Ngân hàng</dt><dd>' + esc(MT.db.settings().store.bank.name) + '</dd>' +
            '<dt>Số tài khoản</dt><dd>' + esc(MT.db.settings().store.bank.no) + '</dd>' +
            '<dt>Chủ tài khoản</dt><dd>' + esc(MT.db.settings().store.bank.holder) + '</dd>' +
            '<dt>Nội dung</dt><dd>Mã đơn hàng (hiển thị sau khi đặt)</dd></dl></div>' : '') +
          (co.paymentMethod === 'card' ? '<div class="card-fields">' +
            '<div class="field' + e('cardNumber') + '"><label> Số thẻ *</label><input class="input" id="cardNumber" data-card="number" value="' + esc(co.card.number) + '" placeholder="4242 4242 4242 4242" inputmode="numeric" maxlength="19"><span class="field-error">' + esc(err.cardNumber || 'Số thẻ không hợp lệ.') + '</span></div>' +
            '<div class="form-row"><div class="field' + e('cardName') + '"><label>Tên trên thẻ *</label><input class="input" data-card="name" value="' + esc(co.card.name) + '" placeholder="NGUYEN THI A"><span class="field-error">' + esc(err.cardName || 'Nhập tên trên thẻ.') + '</span></div>' +
            '<div class="field' + e('cardExpiry') + '"><label>Hết hạn *</label><input class="input" data-card="expiry" value="' + esc(co.card.expiry) + '" placeholder="MM/YY" inputmode="numeric" maxlength="5"><span class="field-error">' + esc(err.cardExpiry || 'Ngày hết hạn không hợp lệ.') + '</span></div>' +
            '<div class="field' + e('cardCvv') + '"><label>CVV *</label><input class="input" data-card="cvv" value="' + esc(co.card.cvv) + '" placeholder="123" inputmode="numeric" maxlength="4"><span class="field-error">' + esc(err.cardCvv || 'CVV không hợp lệ.') + '</span></div></div>' +
            '<p style="font-size:.72rem;color:var(--may-ink-soft)">Thử nghiệm: <strong>4242 4242 4242 4242</strong> · 12/28 · 123. Không nhập thông tin thẻ thật.</p></div>' : '') +
          '<label class="terms"><input type="checkbox" id="coTerms" ' + (co.terms ? 'checked' : '') + '><span>Tôi đã đọc và đồng ý với <a href="#/" onclick="return false">chính sách bán hàng, chính sách đổi trả 30 ngày</a> và cho phép Mây Trắng liên hệ xác nhận đơn.</span></label>' +
          (err.terms ? '<p class="coupon-msg err">Vui lòng đồng ý với chính sách bán hàng.</p>' : '') +
          '<div class="checkout-actions"><button class="back" type="button" id="coBack">← Quay lại vận chuyển</button><button class="btn btn--lg" type="button" id="coPlace" ' + (co.processing ? 'disabled' : '') + '>' + (co.processing ? 'Đang xử lý…' : 'Đặt hàng · ' + money(t.total)) + '</button></div>' +
          '<p style="font-size:.72rem;color:var(--may-ink-soft);text-align:right;margin-top:.6rem">' + icon('shield', 12) + ' Giao dịch được mã hoá và bảo mật</p>' +
        '</div>';
    }

    return '<div class="checkout-page"><div class="container">' +
      '<nav class="breadcrumb"><a href="#/">Trang chủ</a><span class="sep">/</span><a href="#/san-pham">Sản phẩm</a><span class="sep">/</span><span>Thanh toán</span></nav>' +
      stepHeader(co.step) +
      '<div class="checkout-grid"><div>' + stepContent +
        '<div class="checkout-card" style="display:flex;gap:1rem;align-items:flex-start;background:var(--may-bg-soft)">' +
          '<span style="color:var(--may-blue-deep)">' + icon('phone', 20) + '</span>' +
          '<div><strong style="font-size:.86rem">Cần hỗ trợ đặt hàng?</strong><p style="font-size:.8rem;color:var(--may-ink-soft);margin-top:.1rem">Gọi <strong>1900 6363</strong> (8:00–21:00) hoặc nhắn Zalo <strong>maytrang.vn</strong>. Đội ngũ Mây Trắng sẵn sàng tư vấn.</p></div>' +
        '</div>' +
      '</div>' + summaryHtml(details, t) + '</div>' +
    '</div></div>';
  }

  function rerenderCheckout() {
    const y = window.scrollY;
    pageView().innerHTML = checkoutHtml();
    U.bindImgFallback(pageView());
    S.initCheckout();
    window.scrollTo({ top: y, behavior: 'auto' });
  }

  function validateInfo() {
    const c = co.customer;
    const err = {};
    if (!c.name || c.name.trim().length < 2) err.name = 'Vui lòng nhập họ tên (ít nhất 2 ký tự).';
    const digits = String(c.phone || '').replace(/\D/g, '');
    if (!/^(0\d{9}|\+84\d{9})$/.test(String(c.phone || '').replace(/\s/g, '')) && !(digits.length === 9 && String(c.phone).startsWith('0'))) {
      err.phone = 'Số điện thoại 10 số chưa hợp lệ (ví dụ 0901234567).';
    }
    if (c.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c.email)) err.email = 'Email chưa hợp lệ.';
    if (!c.province) err.province = 'Vui lòng chọn tỉnh/thành.';
    if (!c.address || c.address.trim().length < 5) err.address = 'Địa chỉ cần chi tiết hơn (ít nhất 5 ký tự).';
    co.error = err;
    return Object.keys(err).length === 0;
  }

  function luhn(num) {
    let sum = 0;
    let alt = false;
    for (let i = num.length - 1; i >= 0; i--) {
      let n = Number(num[i]);
      if (alt) { n *= 2; if (n > 9) n -= 9; }
      sum += n;
      alt = !alt;
    }
    return sum % 10 === 0;
  }

  function validatePayment() {
    const err = {};
    if (!co.terms) err.terms = 'Chưa đồng ý chính sách.';
    if (co.paymentMethod === 'card') {
      const num = co.card.number.replace(/\s/g, '');
      if (num.length < 15 || num.length > 16 || !luhn(num)) err.cardNumber = 'Số thẻ không hợp lệ. Dùng 4242 4242 4242 4242 để thử.';
      if (co.card.name.trim().length < 3) err.cardName = 'Nhập tên in trên thẻ.';
      const m = /^(\d{2})\/(\d{2})$/.exec(co.card.expiry.trim());
      if (!m) err.cardExpiry = 'Định dạng MM/YY.';
      else {
        const expMonth = Number(m[1]), expYear = 2000 + Number(m[2]);
        const now = new Date();
        const exp = new Date(expYear, expMonth, 1);
        if (expMonth < 1 || expMonth > 12 || exp <= new Date(now.getFullYear(), now.getMonth(), 1)) err.cardExpiry = 'Thẻ đã hết hạn.';
      }
      if (!/^\d{3,4}$/.test(co.card.cvv)) err.cardCvv = 'CVV gồm 3–4 số.';
    }
    co.error = err;
    return Object.keys(err).length === 0;
  }

  function showProcessing() {
    const el = document.createElement('div');
    el.className = 'processing-overlay';
    el.id = 'processingOverlay';
    el.innerHTML = '<div class="processing-box"><span class="spinner"></span><strong>Đang xử lý thanh toán…</strong><p>Vui lòng không đóng cửa sổ này.</p></div>';
    document.body.appendChild(el);
  }
  function hideProcessing() {
    const el = document.getElementById('processingOverlay');
    if (el) el.remove();
  }

  S.views.checkout = function () {
    if (!co) co = checkoutState();
    return checkoutHtml();
  };

  S.initCheckout = function () {
    const root = pageView();
    if (!root) return;

    root.querySelectorAll('[data-co]').forEach((input) => {
      input.addEventListener('input', () => {
        co.customer[input.dataset.co] = input.value;
        if (input.dataset.co === 'province') {
          co.customer.province = input.value;
          const t = totalsFor(co, MT.cart.details());
          const summary = root.querySelector('.summary');
          if (summary) {
            summary.outerHTML = summaryHtml(MT.cart.details(), t);
            bindCoupon();
          }
        }
      });
      if (input.dataset.co === 'province') {
        input.addEventListener('change', () => {
          co.customer.province = input.value;
          const t = totalsFor(co, MT.cart.details());
          const summary = root.querySelector('.summary');
          if (summary) { summary.outerHTML = summaryHtml(MT.cart.details(), t); bindCoupon(); }
        });
      }
    });

    const terms = document.getElementById('coTerms');
    if (terms) terms.addEventListener('change', () => { co.terms = terms.checked; });

    root.querySelectorAll('input[name="shipping"]').forEach((r) => r.addEventListener('change', () => {
      co.shippingMethod = r.value;
      const t = totalsFor(co, MT.cart.details());
      const summary = root.querySelector('.summary');
      if (summary) { summary.outerHTML = summaryHtml(MT.cart.details(), t); bindCoupon(); }
      root.querySelectorAll('.option-card').forEach((c) => {
        const input = c.querySelector('input[name="shipping"]');
        if (input) c.classList.toggle('active', input.checked);
      });
    }));

    root.querySelectorAll('input[name="payment"]').forEach((r) => r.addEventListener('change', () => {
      co.paymentMethod = r.value;
      co.error = {};
      rerenderCheckout();
    }));

    const cardNumber = document.getElementById('cardNumber');
    if (cardNumber) cardNumber.addEventListener('input', () => {
      let v = cardNumber.value.replace(/\D/g, '').slice(0, 16);
      v = v.replace(/(\d{4})(?=\d)/g, '$1 ');
      cardNumber.value = v;
      co.card.number = v;
    });
    const cardExpiry = root.querySelector('[data-card="expiry"]');
    if (cardExpiry) cardExpiry.addEventListener('input', () => {
      let v = cardExpiry.value.replace(/\D/g, '').slice(0, 4);
      if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
      cardExpiry.value = v;
      co.card.expiry = v;
    });
    root.querySelectorAll('[data-card]').forEach((input) => {
      if (input.dataset.card === 'expiry' || input.dataset.card === 'number') return;
      input.addEventListener('input', () => {
        co.card[input.dataset.card] = input.value;
        if (input.dataset.card === 'cvv') { input.value = input.value.replace(/\D/g, '').slice(0, 4); co.card.cvv = input.value; }
      });
    });

    const next = document.getElementById('coNext');
    if (next) next.addEventListener('click', () => {
      if (co.step === 1) {
        if (!validateInfo()) { rerenderCheckout(); focusFirstError(); return; }
        co.step = 2;
      } else if (co.step === 2) {
        co.step = 3;
      }
      co.error = {};
      rerenderCheckout();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    const back = document.getElementById('coBack');
    if (back) back.addEventListener('click', () => {
      co.step = Math.max(1, co.step - 1);
      co.error = {};
      rerenderCheckout();
    });

    const place = document.getElementById('coPlace');
    if (place) place.addEventListener('click', placeOrder);

    bindCoupon();
  };

  function focusFirstError() {
    const el = pageView().querySelector('.field.invalid input, .field.invalid select, .field.invalid textarea');
    if (el) el.focus();
  }

  function bindCoupon() {
    const apply = document.getElementById('applyCoupon');
    if (apply) apply.addEventListener('click', () => {
      const input = document.getElementById('couponInput');
      const code = (input.value || '').trim().toUpperCase();
      const details = MT.cart.details();
      if (!code) {
        co.coupon = ''; co.couponError = ''; MT.cart.setCoupon(''); rerenderCheckout(); return;
      }
      const test = MT.pricing.coupon(code, U.sum(details.items, (x) => x.lineTotal));
      if (!test.ok) {
        co.coupon = code; co.couponError = test.message; rerenderCheckout(); return;
      }
      co.coupon = code;
      co.couponError = '';
      MT.cart.setCoupon(code);
      rerenderCheckout();
      U.toast('Đã áp dụng mã ' + code, 'success');
    });
    const remove = document.getElementById('removeCoupon');
    if (remove) remove.addEventListener('click', () => {
      co.coupon = ''; co.couponError = ''; MT.cart.setCoupon(''); rerenderCheckout();
    });
  }

  function placeOrder() {
    if (co.processing) return;
    if (!validatePayment()) {
      rerenderCheckout();
      const el = pageView().querySelector('.coupon-msg.err');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const details = MT.cart.details();
    if (!details.items.length) { U.toast('Giỏ hàng đang trống', 'error'); return; }
    const payload = {
      customer: Object.assign({}, co.customer),
      items: details.items.map((it) => ({ productId: it.product.id, variant: it.variant, qty: it.qty })),
      couponCode: co.coupon,
      shippingMethod: co.shippingMethod,
      paymentMethod: co.paymentMethod,
    };
    co.processing = true;
    const isOnline = co.paymentMethod === 'card' || co.paymentMethod === 'momo';
    if (isOnline) showProcessing();
    const placeBtn = document.getElementById('coPlace');
    if (placeBtn) { placeBtn.disabled = true; placeBtn.textContent = 'Đang xử lý…'; }
    setTimeout(() => {
      try {
        const order = MT.db.createOrder(payload);
        MT.customer.save({
          name: co.customer.name, phone: co.customer.phone, email: co.customer.email,
          province: co.customer.province, address: co.customer.address,
        });
        MT.cart.clear();
        co = null;
        S.co = null;
        hideProcessing();
        S.navigate('#/don-hang/' + order.code + '?new=1');
        U.toast('Đặt hàng thành công! Mã đơn ' + order.code, 'success', { duration: 5000 });
      } catch (err) {
        hideProcessing();
        co.processing = false;
        if (placeBtn) { placeBtn.disabled = false; placeBtn.textContent = 'Đặt hàng'; }
        U.toast(err.message || 'Không thể tạo đơn hàng.', 'error', { duration: 5000 });
      }
    }, isOnline ? 1100 : 350);
  }

  /* -------------------------------- Order --------------------------------- */
  function findOrderByCode(code) {
    const c = String(code || '').trim().toLowerCase();
    return (MT.db.data.orders || []).find((o) => String(o.code || '').toLowerCase() === c) || null;
  }

  S.views.order = function (code, isNew) {
    const order = findOrderByCode(code);
    if (!order) return S.views.notfound('Không tìm thấy đơn hàng “' + code + '”. Vui lòng kiểm tra lại mã đơn.');
    const meta = MT.meta.orderStatus[order.status] || {};
    const canCancel = order.status === 'pending' || order.status === 'confirmed';
    const isBankUnpaid = order.paymentMethod === 'bank' && order.paymentStatus === 'unpaid';
    const bank = MT.db.settings().store.bank;
    const created = new Date(order.createdAt);
    const eta = U.addDays(created, 4);
    const timeline = (order.timeline || []).slice().sort((a, b) => new Date(a.at) - new Date(b.at));

    return '<div class="page"><div class="container">' +
      '<nav class="breadcrumb no-print"><a href="#/">Trang chủ</a><span class="sep">/</span><a href="#/tra-cuu">Tra cứu đơn</a><span class="sep">/</span><span>' + esc(order.code) + '</span></nav>' +
      '<div class="order-hero">' +
        (isNew ? '<div class="success-mark">' + icon('check', 36) + '</div>' : '<div class="success-mark" style="background:var(--may-bg-soft);color:var(--may-blue-deep)">' + icon('box', 34) + '</div>') +
        '<h1>' + (isNew ? 'Đặt hàng thành công!' : 'Chi tiết đơn hàng') + '</h1>' +
        '<p>' + (isNew ? 'Cảm ơn bạn đã tin chọn Mây Trắng. Chúng tôi sẽ liên hệ xác nhận trong thời gian sớm nhất.' : 'Mã đơn ' + esc(order.code) + ' · ' + U.fmt.datetime(order.createdAt)) + '</p>' +
        '<div class="order-code">' + esc(order.code) + '<button type="button" data-copy="' + esc(order.code) + '" aria-label="Sao chép mã đơn">' + icon('copy', 15) + '</button>' +
          '<span style="margin-left:.3rem">' + statusBadge(order.status) + '</span></div>' +
      '</div>' +
      '<div class="order-layout">' +
        '<div>' +
          '<div class="order-panel"><div class="order-panel__head"><h3>Trạng thái đơn hàng</h3><span class="text-muted" style="font-size:.75rem">Dự kiến giao ' + U.fmt.date(eta) + '</span></div>' +
            '<div class="order-panel__body"><div class="timeline">' + timeline.map((ev, i) => {
              const done = i < timeline.length - 1;
              return '<div class="timeline__step ' + (done ? 'done' : 'current') + '"><div class="timeline__dot"></div><div class="timeline__body"><strong>' + esc(ev.label) + '</strong><span>' + U.fmt.datetime(ev.at) + (ev.note ? ' · ' + esc(ev.note) : '') + '</span></div></div>';
            }).join('') + '</div></div>' +
          '</div>' +
          '<div class="order-panel"><div class="order-panel__head"><h3>Sản phẩm (' + order.items.length + ')</h3><span class="text-muted" style="font-size:.75rem">' + order.items.reduce((s, x) => s + x.qty, 0) + ' món</span></div><div class="order-panel__body">' +
            order.items.map((it) =>
              '<div class="order-item"><img src="' + esc(it.image || U.placeholder(it.name)) + '" alt="" data-fallback>' +
              '<div><div class="order-item__name">' + esc(it.name) + '</div><div class="order-item__meta">' + (it.variant ? esc(it.variant) + ' · ' : '') + 'SL ' + it.qty + ' × ' + money(it.price) + '</div></div>' +
              '<span class="order-item__price">' + money(it.price * it.qty) + '</span></div>').join('') +
          '</div></div>' +
          '<div class="order-panel"><div class="order-panel__head"><h3>Thanh toán &amp; giao hàng</h3></div><div class="order-panel__body">' +
            '<div class="payment-box">' +
              '<h4>' + paymentLabel(order.paymentMethod) + ' · ' +
                '<span style="color:' + (order.paymentStatus === 'paid' ? 'var(--success)' : order.paymentStatus === 'refunded' ? 'var(--sale)' : 'var(--warn)') + '">' +
                (MT.meta.paymentStatus[order.paymentStatus] || {}).label + '</span></h4>' +
              (isBankUnpaid ?
                '<p style="font-size:.82rem;color:var(--may-ink-soft)">Quét mã QR bên dưới hoặc chuyển khoản đúng số tiền và nội dung. Đơn sẽ được xác nhận trong 5–10 phút làm việc.</p>' +
                '<div class="qr-wrap"><div style="text-align:center"><canvas id="orderQr" width="150" height="150" data-code="' + esc(order.code) + '" data-amount="' + order.total + '"></canvas>' +
                '<div style="font-size:.63rem;color:#9AA9B4;margin-top:.2rem">QR minh hoạ cho bản demo</div></div>' +
                '<div style="font-size:.8rem"><div class="amount">' + money(order.total) + '</div>' +
                '<div class="text-muted">' + esc(bank.name) + '</div><div><strong>' + esc(bank.no) + '</strong></div>' +
                '<div class="text-muted">' + esc(bank.holder) + '</div><div class="text-muted">Nội dung: <strong>' + esc(order.code) + '</strong></div>' +
                '<button class="btn btn--sm mt-2 no-print" type="button" data-mark-paid="' + esc(order.code) + '">Tôi đã chuyển khoản</button></div></div>' :
                '<p style="font-size:.82rem;color:var(--may-ink-soft)">' +
                  (order.paymentStatus === 'paid' ? 'Thanh toán đã được ghi nhận. Cảm ơn bạn!' :
                    order.paymentMethod === 'cod' ? 'Bạn sẽ thanh toán ' + money(order.total) + ' cho nhân viên giao hàng khi nhận.' : 'Vui lòng hoàn tất thanh toán theo hướng dẫn.') +
                '</p>') +
            '</div>' +
            '<div class="order-info-list mt-3">' +
              '<div><span>Người nhận</span><strong>' + esc(order.customer.name) + '</strong></div>' +
              '<div><span>Điện thoại</span><strong>' + esc(U.fmt.phone(order.customer.phone)) + '</strong></div>' +
              (order.customer.email ? '<div><span>Email</span><strong>' + esc(order.customer.email) + '</strong></div>' : '') +
              '<div><span>Địa chỉ</span><strong>' + esc(order.customer.address) + ', ' + esc(order.customer.province) + '</strong></div>' +
              '<div><span>Vận chuyển</span><strong>' + (order.shippingMethod === 'pickup' ? 'Nhận tại showroom' : order.shippingMethod === 'express' ? 'Giao nhanh' : 'Giao tiêu chuẩn') + '</strong></div>' +
              (order.customer.note ? '<div><span>Ghi chú</span><strong>' + esc(order.customer.note) + '</strong></div>' : '') +
            '</div>' +
          '</div></div>' +
        '</div>' +
        '<div>' +
          '<div class="order-panel"><div class="order-panel__head"><h3>Tóm tắt thanh toán</h3></div><div class="order-panel__body">' +
            '<div class="summary-line"><span>Tạm tính</span><strong>' + money(order.subtotal) + '</strong></div>' +
            (order.discount ? '<div class="summary-line discount"><span>Giảm giá' + (order.couponCode ? ' (' + esc(order.couponCode) + ')' : '') + '</span><strong>−' + money(order.discount) + '</strong></div>' : '') +
            '<div class="summary-line"><span>Vận chuyển</span><strong>' + (order.shippingFee ? money(order.shippingFee) : 'Miễn phí') + '</strong></div>' +
            '<div class="summary-total"><span>Tổng cộng</span><strong>' + money(order.total) + '</strong></div>' +
          '</div></div>' +
          '<div class="order-panel"><div class="order-panel__head"><h3>Bạn cần hỗ trợ?</h3></div><div class="order-panel__body">' +
            '<p style="font-size:.83rem;color:var(--may-ink-soft)">Gọi <strong>1900 6363</strong> hoặc email <strong>hello@maytrang.vn</strong>. Đọc mã đơn <strong>' + esc(order.code) + '</strong> để được hỗ trợ nhanh.</p>' +
            '<div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.8rem">' +
              '<button class="btn btn--ghost btn--sm" type="button" data-print>' + icon('printer', 14) + ' In đơn</button>' +
              (canCancel ? '<button class="btn btn--ghost btn--sm" type="button" data-cancel-order="' + esc(order.code) + '" style="color:var(--sale)">Huỷ đơn</button>' : '') +
            '</div>' +
          '</div></div>' +
          (isNew ? '<a href="#/san-pham" class="btn btn--block">Tiếp tục mua sắm</a><a href="#/tra-cuu" class="btn btn--ghost btn--block mt-1">Tra cứu đơn hàng</a>' : '<a href="#/tra-cuu" class="btn btn--ghost btn--block">Tra cứu đơn khác</a>') +
        '</div>' +
      '</div>' +
    '</div></div>';
  };

  S.initOrder = function () {
    const canvas = document.getElementById('orderQr');
    if (canvas) drawFakeQr(canvas, canvas.dataset.code || '', Number(canvas.dataset.amount) || 0);
  };

  function drawFakeQr(canvas, code, amount) {
    const ctx = canvas.getContext('2d');
    const size = 29;
    const quiet = 2;
    const cell = Math.floor(canvas.width / (size + quiet * 2));
    const offset = Math.floor((canvas.width - cell * size) / 2);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#2E3A44';
    const rnd = U.mulberry32(U.hashString(code + '|' + amount));
    const finder = (x, y) => {
      for (let i = 0; i < 7; i++) {
        for (let j = 0; j < 7; j++) {
          const edge = i === 0 || i === 6 || j === 0 || j === 6;
          const inner = i >= 2 && i <= 4 && j >= 2 && j <= 4;
          if (edge || inner) ctx.fillRect(offset + (x + i) * cell, offset + (y + j) * cell, cell, cell);
        }
      }
    };
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const inFinder = (x < 8 && y < 8) || (x > size - 9 && y < 8) || (x < 8 && y > size - 9);
        if (inFinder) continue;
        if (rnd() > 0.52) ctx.fillRect(offset + x * cell, offset + y * cell, cell, cell);
      }
    }
    finder(0, 0); finder(size - 7, 0); finder(0, size - 7);
    ctx.fillStyle = 'rgba(255,255,255,.92)';
    ctx.fillRect(canvas.width / 2 - 24, canvas.height / 2 - 12, 48, 24);
    ctx.fillStyle = '#6E9BB8';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('MÂY TRẮNG', canvas.width / 2, canvas.height / 2 + 3);
  }

  /* -------------------------------- Lookup -------------------------------- */
  S.views.lookup = function () {
    return '<div class="page"><div class="container">' +
      '<nav class="breadcrumb"><a href="#/">Trang chủ</a><span class="sep">/</span><span>Tra cứu đơn hàng</span></nav>' +
      '<div class="lookup-box">' +
        '<div class="text-center mb-3"><div class="cart-empty__icon" style="width:64px;height:64px;border-radius:50%;display:grid;place-items:center;background:var(--may-bg-soft);color:var(--may-blue-deep);margin:0 auto .8rem">' + icon('box', 28) + '</div>' +
        '<h1 class="page-title" style="font-size:1.8rem">Tra cứu đơn hàng</h1><p class="page-sub">Nhập mã đơn hoặc số điện thoại đã dùng khi đặt hàng.</p></div>' +
        '<form class="lookup-form" id="lookupForm" novalidate><input class="input" id="lookupInput" placeholder="Ví dụ: MT26110001 hoặc 0901234567" aria-label="Mã đơn hoặc số điện thoại" autocomplete="off"><button class="btn" type="submit">' + icon('search', 16) + ' Tra cứu</button></form>' +
        '<p style="font-size:.74rem;color:var(--may-ink-soft);margin-top:.7rem">Bạn có thể thử với số điện thoại mẫu <strong>0901234567</strong> hoặc mã đơn bất kỳ trong lịch sử mua hàng.</p>' +
        '<div class="lookup-results" id="lookupResults"></div>' +
      '</div>' +
      '<div class="text-center mt-3"><a href="#/san-pham" class="link-arrow">← Tiếp tục mua sắm</a></div>' +
    '</div></div>';
  };

  S.initLookup = function () {
    const form = document.getElementById('lookupForm');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = (document.getElementById('lookupInput').value || '').trim();
      const host = document.getElementById('lookupResults');
      if (!q) { host.innerHTML = '<p class="coupon-msg err">Vui lòng nhập mã đơn hoặc số điện thoại.</p>'; return; }
      const orders = MT.db.searchOrders(q).slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      if (!orders.length) {
        host.innerHTML = '<div class="empty" style="border:none;padding:1.6rem 0">' + icon('search', 28) +
          '<h3>Không tìm thấy đơn hàng</h3><p>Kiểm tra lại mã đơn hoặc số điện thoại. Nếu vẫn không thấy, vui lòng gọi 1900 6363.</p></div>';
        return;
      }
      host.innerHTML = '<p style="font-size:.8rem;color:var(--may-ink-soft);margin-bottom:.5rem">Tìm thấy ' + orders.length + ' đơn hàng</p>' +
        orders.slice(0, 10).map((o) =>
          '<a class="lookup-result" href="#/don-hang/' + esc(o.code) + '">' +
            '<div><div class="lookup-result__code">' + esc(o.code) + '</div>' +
            '<div class="lookup-result__meta">' + U.fmt.datetime(o.createdAt) + ' · ' + esc(o.customer.name) + ' · ' + o.items.length + ' sản phẩm</div></div>' +
            '<div style="margin-left:auto;text-align:right"><div class="lookup-result__total">' + money(o.total) + '</div>' + statusBadge(o.status) + '</div>' +
          '</a>').join('');
    });
  };
})();
