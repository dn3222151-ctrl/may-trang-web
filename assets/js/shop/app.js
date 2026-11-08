/* ==========================================================================
   MÂY TRẮNG – Storefront application
   Router, trang chủ, danh sách, chi tiết sản phẩm, giỏ hàng, tìm kiếm.
   ========================================================================== */
(function () {
  const MT = window.MT;
  const U = MT.util;
  const esc = U.esc;
  const money = U.fmt.money;
  const icon = U.icon;

  const S = (MT.shop = MT.shop || {});
  S.views = S.views || {};
  S.register = (name, fn) => { S.views[name] = fn; };

  const state = S.state = {
    route: { name: 'home' },
    listing: { cat: 'all', q: '', sort: 'featured', price: 'all', skin: [] },
    detail: null,
    searchOpen: false,
    heroIndex: 0,
    heroTimer: null,
    dealEnd: null,
  };

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  const homeView = () => document.getElementById('homeView');
  const pageView = () => document.getElementById('pageView');

  /* ------------------------------- Helpers -------------------------------- */
  function productUrl(p) { return '#/san-pham/' + p.slug; }

  function discountPct(p) {
    if (!p.compareAt || p.compareAt <= p.price) return 0;
    return Math.round((1 - p.price / p.compareAt) * 100);
  }

  function priceHtml(p) {
    const off = discountPct(p);
    return '<div class="product__price">' +
      '<span class="price-now">' + money(p.price) + '</span>' +
      (off ? '<span class="price-was">' + money(p.compareAt) + '</span><span class="price-off">-' + off + '%</span>' : '') +
      '</div>';
  }

  function stockText(p) {
    const stock = Number(p.stock) || 0;
    if (stock <= 0) return '<span class="stock-hint out">Tạm hết hàng</span>';
    if (stock <= 10) return '<span class="stock-hint">Chỉ còn ' + stock + ' sản phẩm</span>';
    return '';
  }

  function ratingData(p) { return MT.products.rating(p); }

  function starsInline(rating, size) {
    return U.stars(rating, size);
  }

  function card(p, opts) {
    const o = opts || {};
    const rating = ratingData(p);
    const catName = MT.catalog.catName(p.cat);
    const off = discountPct(p);
    const active = MT.wishlist.has(p.id);
    const soldOut = (Number(p.stock) || 0) <= 0;
    let badges = '';
    if (p.badge) badges += '<span class="badge-pill">' + esc(p.badge) + '</span>';
    if (off && !p.badge) badges += '<span class="badge-pill badge-pill--dark">-' + off + '%</span>';
    const deal = o.deal && p.deal ? (function () {
      const pct = Math.min(100, Math.round(((p.dealSold || 0) / Math.max(1, p.dealQty || 1)) * 100));
      return '<div class="deal-stock"><div class="deal-stock__bar"><span style="width:' + pct + '%"></span></div>' +
        '<div class="deal-stock__text">Đã bán ' + (p.dealSold || 0) + '/' + (p.dealQty || 0) + ' suất ưu đãi</div></div>';
    })() : '';
    return '<article class="product" data-product-id="' + p.id + '">' +
      '<a class="product__media" href="' + productUrl(p) + '" aria-label="' + esc(p.name) + '">' +
        '<div class="product__badges">' + badges + '</div>' +
        '<img src="' + esc(p.images[0]) + '" alt="' + esc(p.name) + '" loading="lazy" data-fallback>' +
      '</a>' +
      '<button class="wish-btn ' + (active ? 'active' : '') + '" data-wish="' + p.id + '" aria-label="' + (active ? 'Bỏ yêu thích' : 'Thêm vào yêu thích') + '" aria-pressed="' + active + '">' + icon('heart', 17) + '</button>' +
      '<div class="product__quick"><button class="btn" type="button" data-quick-add="' + p.id + '" ' + (soldOut ? 'disabled' : '') + '>' +
        (soldOut ? 'Tạm hết hàng' : (p.variants.length ? 'Chọn phân loại' : 'Thêm vào giỏ')) + '</button></div>' +
      '<div class="product__info">' +
        '<span class="product__cat">' + esc(catName) + '</span>' +
        '<h3><a href="' + productUrl(p) + '">' + esc(p.name) + '</a></h3>' +
        '<div class="product__rating">' + starsInline(rating.value, 12) + '<span>' + rating.value.toFixed(1) + ' (' + rating.count + ')</span></div>' +
        '<p class="product__desc">' + esc(p.short) + '</p>' +
        priceHtml(p) + stockText(p) + deal +
      '</div>' +
    '</article>';
  }

  S.card = card;
  S.money = money;
  S.icon = icon;

  function bindFallbacks(root) {
    U.bindImgFallback(root || document);
  }

  /* ------------------------------ Chrome --------------------------------- */
  function refreshChrome() {
    const cartCount = MT.cart.count();
    const wishCount = MT.wishlist.count();
    const cc = document.getElementById('cartCount');
    const wc = document.getElementById('wishCount');
    if (cc) { cc.textContent = cartCount; cc.hidden = cartCount === 0; }
    if (wc) { wc.textContent = wishCount; wc.hidden = wishCount === 0; }
  }

  function renderCart() {
    const details = MT.cart.details();
    const itemsEl = document.getElementById('cartItems');
    const footEl = document.getElementById('cartFoot');
    const freeEl = document.getElementById('cartFreeShip');
    const countEl = document.getElementById('cartCountText');
    if (!itemsEl) return;
    const count = U.sum(details.items, (x) => x.qty);
    if (countEl) countEl.textContent = count + ' sản phẩm';
    if (!details.items.length) {
      itemsEl.innerHTML = '<div class="cart-empty">' +
        '<div class="cart-empty__icon">' + icon('cart', 30) + '</div>' +
        '<h4>Giỏ hàng đang trống</h4>' +
        '<p>Hãy chọn cho mình một sản phẩm dịu lành nhé.</p>' +
        '<a href="#/san-pham" class="btn btn--sm" data-close-cart>Mua sắm ngay</a>' +
        '</div>';
      if (footEl) footEl.hidden = true;
      if (freeEl) freeEl.innerHTML = 'Miễn phí giao hàng cho đơn từ <strong>' + money(MT.db.settings().shipping.freeThreshold) + '</strong>';
      refreshChrome();
      return;
    }
    itemsEl.innerHTML = details.items.map((it) => {
      const p = it.product;
      return '<div class="cart-item">' +
        '<a class="cart-item__img" href="' + productUrl(p) + '" data-close-cart><img src="' + esc(p.images[0]) + '" alt="' + esc(p.name) + '" data-fallback></a>' +
        '<div>' +
          '<a class="cart-item__name" href="' + productUrl(p) + '" data-close-cart>' + esc(p.name) + '</a>' +
          (it.variant ? '<div class="cart-item__variant">' + esc(it.variant) + '</div>' : '<div class="cart-item__variant">&nbsp;</div>') +
          '<div class="cart-item__row">' +
            '<div class="qty qty--sm">' +
              '<button type="button" data-cart-step="' + esc(it.key) + '" data-delta="-1" aria-label="Giảm số lượng">−</button>' +
              '<input type="text" value="' + it.qty + '" readonly aria-label="Số lượng">' +
              '<button type="button" data-cart-step="' + esc(it.key) + '" data-delta="1" aria-label="Tăng số lượng">+</button>' +
            '</div>' +
            '<span class="cart-item__price">' + money(it.lineTotal) + '</span>' +
            '<button class="cart-item__remove" type="button" data-cart-remove="' + esc(it.key) + '" aria-label="Xoá sản phẩm">' + icon('trash', 16) + '</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');
    const subtotal = U.sum(details.items, (x) => x.lineTotal);
    const totalQty = U.sum(details.items, (x) => x.qty);
    const threshold = MT.db.settings().shipping.freeThreshold;
    const remaining = Math.max(0, threshold - subtotal);
    const pct = Math.min(100, Math.round((subtotal / threshold) * 100));
    if (freeEl) {
      freeEl.innerHTML = remaining > 0
        ? 'Mua thêm <strong>' + money(remaining) + '</strong> để được miễn phí giao hàng' +
          '<div class="bar"><span style="width:' + pct + '%"></span></div>'
        : '<span style="color:var(--success);font-weight:800">' + icon('checkCircle', 14) + ' Bạn được miễn phí giao hàng toàn quốc</span>' +
          '<div class="bar"><span style="width:100%"></span></div>';
    }
    const subtotalEl = document.getElementById('cartSubtotal');
    if (subtotalEl) subtotalEl.textContent = money(subtotal);
    if (footEl) footEl.hidden = false;
    const checkoutBtn = document.getElementById('cartCheckoutBtn');
    if (checkoutBtn) checkoutBtn.innerHTML = 'Thanh toán · ' + money(subtotal) + ' <span class="arrow">→</span>';
    refreshChrome();
    bindFallbacks(itemsEl);
    void totalQty;
  }

  function openCart() {
    document.getElementById('cartOverlay').classList.add('open');
    const d = document.getElementById('cartDrawer');
    d.classList.add('open');
    d.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    renderCart();
  }

  function closeCart() {
    document.getElementById('cartOverlay').classList.remove('open');
    const d = document.getElementById('cartDrawer');
    d.classList.remove('open');
    d.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
  }

  S.openCart = openCart;
  S.closeCart = closeCart;
  S.refreshChrome = refreshChrome;
  S.renderCart = renderCart;

  function addToCart(productId, variant, qty, opts) {
    try {
      MT.cart.add(productId, variant, qty);
      const p = MT.products.get(productId);
      U.toast('Đã thêm “' + p.name + '” vào giỏ hàng', 'cart');
      if (!opts || opts.open !== false) openCart();
      renderCart();
      refreshChrome();
      return true;
    } catch (e) {
      U.toast(e.message, 'error');
      return false;
    }
  }

  /* -------------------------------- Router -------------------------------- */
  function parseHash() {
    const raw = location.hash.replace(/^#\/?/, '');
    const qi = raw.indexOf('?');
    const path = (qi >= 0 ? raw.slice(0, qi) : raw).replace(/\/+$/, '');
    const query = new URLSearchParams(qi >= 0 ? raw.slice(qi + 1) : '');
    return { segments: path.split('/').filter(Boolean), query };
  }

  function navigate(hash) {
    if (location.hash === hash) { router(); return; }
    location.hash = hash;
  }
  S.navigate = navigate;

  function setNav(name) {
    $$('.nav-links a').forEach((a) => a.classList.toggle('active', a.dataset.nav === name));
  }

  function scrollToSection(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const header = document.getElementById('siteHeader');
    const offset = (header ? header.offsetHeight : 0) + 14;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  function router() {
    const { segments, query } = parseHash();
    closeCart();
    closeSearch();
    closeMenu();

    if (segments.length === 0) {
      state.route = { name: 'home' };
      homeView().hidden = false;
      pageView().hidden = true;
      pageView().innerHTML = '';
      document.title = 'Mây Trắng – Mỹ phẩm thuần lành từ thiên nhiên Việt';
      setNav('home');
      window.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }

    const root = segments[0];
    let view = null;
    let title = 'Mây Trắng';

    if (root === 'san-pham' && segments[1]) {
      state.route = { name: 'product', slug: segments[1] };
      view = S.views.product(segments[1]);
      title = state.detail && state.detail.product ? state.detail.product.name : 'Sản phẩm';
      setNav('products');
    } else if (root === 'san-pham') {
      state.route = { name: 'listing' };
      const cat = query.get('cat') || 'all';
      const q = query.get('q') || '';
      state.listing.cat = MT.catalog.categories.some((c) => c.id === cat) ? cat : 'all';
      state.listing.q = q;
      view = S.views.listing();
      title = 'Sản phẩm' + (q ? ' – “' + q + '”' : '') + ' – Mây Trắng';
      setNav(q ? 'products' : (cat === 'combo' ? 'combo' : 'products'));
    } else if (root === 'thanh-toan') {
      state.route = { name: 'checkout' };
      view = S.views.checkout();
      title = 'Thanh toán – Mây Trắng';
      setNav('products');
    } else if (root === 'don-hang' && segments[1]) {
      state.route = { name: 'order', code: decodeURIComponent(segments[1]) };
      view = S.views.order(segments[1], query.get('new') === '1');
      title = 'Đơn hàng ' + segments[1] + ' – Mây Trắng';
    } else if (root === 'tra-cuu') {
      state.route = { name: 'lookup' };
      view = S.views.lookup();
      title = 'Tra cứu đơn hàng – Mây Trắng';
    } else if (root === 'yeu-thich') {
      state.route = { name: 'wishlist' };
      view = S.views.wishlist();
      title = 'Sản phẩm yêu thích – Mây Trắng';
    } else if (root === 'bai-viet' && segments[1]) {
      state.route = { name: 'article', slug: segments[1] };
      view = S.views.article(segments[1]);
      title = 'Bài viết – Mây Trắng';
    } else {
      state.route = { name: 'notfound' };
      view = S.views.notfound();
      title = 'Không tìm thấy trang – Mây Trắng';
    }

    homeView().hidden = true;
    pageView().hidden = false;
    pageView().innerHTML = view;
    document.title = title;
    window.scrollTo({ top: 0, behavior: 'auto' });
    bindFallbacks(pageView());
    afterPageRender();
  }
  S.router = router;

  function afterPageRender() {
    if (state.route.name === 'product') initProductPage();
    if (state.route.name === 'listing') initListingPage();
    if (state.route.name === 'checkout') initCheckoutPage();
    if (state.route.name === 'order') initOrderPage();
    if (state.route.name === 'lookup') initLookupPage();
  }

  /* ------------------------------ Home page ------------------------------- */
  function renderHome() {
    const catalog = MT.catalog;
    const content = MT.content;

    document.getElementById('heroSlides').innerHTML = catalog.heroSlides.map((slide, i) => (
      '<div class="hero__slide ' + (i === 0 ? 'active' : '') + '" data-slide="' + i + '">' +
        '<div class="hero__grid">' +
          '<div class="hero__text">' +
            '<p class="eyebrow">' + esc(slide.eyebrow) + '</p>' +
            '<h1>' + slide.title + '</h1>' +
            '<p>' + esc(slide.desc) + '</p>' +
            '<div class="hero__cta">' +
              '<a href="' + slide.href + '" class="btn">' + esc(slide.cta) + ' <span class="arrow">→</span></a>' +
              '<a href="#/san-pham" class="btn btn--ghost">Tất cả sản phẩm</a>' +
            '</div>' +
            '<div class="hero__meta">' +
              '<div><strong>32.000+</strong><span>Khách hàng tin dùng</span></div>' +
              '<div><strong>100%</strong><span>Nguyên liệu Việt</span></div>' +
              '<div><strong>30 ngày</strong><span>Đổi trả dễ dàng</span></div>' +
            '</div>' +
          '</div>' +
          '<div class="hero__visual">' +
            '<img src="' + slide.image + '" alt="' + esc(slide.cta) + '" data-fallback>' +
            '<div class="hero__float">' + U.stars(4.9, 13) + '<div><strong>4.9/5</strong><span>từ 1.248 đánh giá</span></div></div>' +
          '</div>' +
        '</div>' +
      '</div>'
    )).join('');

    document.getElementById('heroDots').innerHTML = catalog.heroSlides.map((_, i) =>
      '<button type="button" data-hero-dot="' + i + '" aria-label="Slide ' + (i + 1) + '" class="' + (i === 0 ? 'active' : '') + '"></button>'
    ).join('');

    document.getElementById('trustGrid').innerHTML = content.trust.map((t) =>
      '<div class="trust__item"><span class="trust__icon">' + icon(t.icon, 20) + '</span><div><strong>' + esc(t.title) + '</strong><span>' + esc(t.desc) + '</span></div></div>'
    ).join('');

    document.getElementById('flashPanel').style.display = '';
    document.getElementById('dealRail').innerHTML = MT.products.all()
      .filter((p) => p.deal)
      .slice(0, 4)
      .map((p) => card(p, { deal: true }))
      .join('');

    const featured = MT.products.all().filter((p) => p.featured).slice(0, 8);
    document.getElementById('homeGrid').innerHTML = (featured.length ? featured : MT.products.all().slice(0, 8)).map((p) => card(p)).join('');

    document.getElementById('homeCatChips').innerHTML = catalog.categories.filter((c) => c.id !== 'all').slice(0, 4).map((c) =>
      '<a class="chip" href="#/san-pham?cat=' + c.id + '">' + esc(c.name) + '</a>'
    ).join('');

    document.getElementById('brandStats').innerHTML = content.storyStats.map((s) =>
      '<div><strong>' + esc(s.value) + '</strong><span>' + esc(s.label) + '</span></div>'
    ).join('');

    document.getElementById('certsGrid').innerHTML = content.certifications.map((c) =>
      '<div class="cert"><div class="cert__icon">' + icon(c.icon, 28) + '</div>' +
      '<h3>' + esc(c.title) + '</h3><div class="sub">' + esc(c.sub) + '</div><p>' + esc(c.desc) + '</p></div>'
    ).join('');

    document.getElementById('ingredientsGrid').innerHTML = content.ingredients.map((ing) =>
      '<div class="ingredient"><img src="' + ing.image + '" alt="' + esc(ing.name) + '" loading="lazy" data-fallback>' +
      '<div class="ingredient__body"><span class="place">' + esc(ing.place) + '</span><h3>' + esc(ing.name) + '</h3><p>' + esc(ing.desc) + '</p></div></div>'
    ).join('');

    const allProducts = MT.products.all();
    let baseCount = 0, baseSum = 0;
    allProducts.forEach((p) => { baseCount += Number(p.reviewCount) || 0; baseSum += (Number(p.rating) || 0) * (Number(p.reviewCount) || 0); });
    const stored = MT.db.data.reviews || [];
    const avg = baseCount + stored.length ? (baseSum + U.sum(stored, (r) => r.rating)) / (baseCount + stored.length) : 0;
    document.getElementById('reviewSummary').innerHTML =
      '<div><span class="review-summary__score">' + avg.toFixed(1) + '</span></div>' +
      '<div>' + U.stars(avg, 15) + '<small>' + U.fmt.num(baseCount + stored.length) + ' đánh giá đã xác thực</small></div>';

    document.getElementById('testimonialsGrid').innerHTML = content.testimonials.map((t) =>
      '<div class="testimonial"><div class="stars">' + U.stars(t.rating, 14) + '</div><p>' + esc(t.text) + '</p>' +
      '<div class="testimonial__author"><span class="avatar-initial">' + U.initials(t.name) + '</span><div><strong>' + esc(t.name) + '</strong><span>' + esc(t.city) + '</span></div></div></div>'
    ).join('');

    document.getElementById('articlesGrid').innerHTML = content.articles.slice(0, 4).map((a) =>
      '<article class="article-card"><a href="#/bai-viet/' + a.slug + '" class="article-card__img"><img src="' + a.image + '" alt="' + esc(a.title) + '" loading="lazy" data-fallback></a>' +
      '<div class="article-card__body"><span class="article-card__meta">' + esc(a.tag) + ' · ' + a.read + '</span>' +
      '<h3><a href="#/bai-viet/' + a.slug + '">' + esc(a.title) + '</a></h3><p>' + esc(a.excerpt) + '</p>' +
      '<a class="article-card__link" href="#/bai-viet/' + a.slug + '">Đọc thêm ' + icon('arrowRight', 14) + '</a></div></article>'
    ).join('');

    document.getElementById('yearNow').textContent = new Date().getFullYear();
    bindFallbacks(document);
    initHero();
    initCountdown();
    observeReveals();
  }

  function initHero() {
    const slides = $$('.hero__slide');
    const dots = $$('[data-hero-dot]');
    if (!slides.length) return;
    function go(i) {
      state.heroIndex = (i + slides.length) % slides.length;
      slides.forEach((s, k) => s.classList.toggle('active', k === state.heroIndex));
      dots.forEach((d, k) => d.classList.toggle('active', k === state.heroIndex));
      const active = slides[state.heroIndex];
      if (active) {
        const img = active.querySelector('img');
        if (img && img.complete === false) img.loading = 'eager';
      }
    }
    function auto() {
      clearInterval(state.heroTimer);
      state.heroTimer = setInterval(() => go(state.heroIndex + 1), 6500);
    }
    dots.forEach((d) => d.addEventListener('click', () => { go(Number(d.dataset.heroDot)); auto(); }));
    const prev = document.getElementById('heroPrev');
    const next = document.getElementById('heroNext');
    if (prev) prev.addEventListener('click', () => { go(state.heroIndex - 1); auto(); });
    if (next) next.addEventListener('click', () => { go(state.heroIndex + 1); auto(); });
    const heroEl = document.getElementById('home');
    if (heroEl) {
      heroEl.addEventListener('mouseenter', () => clearInterval(state.heroTimer));
      heroEl.addEventListener('mouseleave', auto);
    }
    go(0);
    auto();
  }

  function initCountdown() {
    const now = new Date();
    const end = new Date(now);
    end.setHours(22, 0, 0, 0);
    if (end <= now) end.setDate(end.getDate() + 1);
    state.dealEnd = end;
    const tick = () => {
      const diff = Math.max(0, state.dealEnd - new Date());
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      const pad = (n) => String(n).padStart(2, '0');
      const hEl = document.getElementById('cdH');
      if (!hEl) { clearInterval(state.cdTimer); return; }
      hEl.innerHTML = pad(h) + '<small>giờ</small>';
      document.getElementById('cdM').innerHTML = pad(m) + '<small>phút</small>';
      document.getElementById('cdS').innerHTML = pad(s) + '<small>giây</small>';
    };
    clearInterval(state.cdTimer);
    tick();
    state.cdTimer = setInterval(tick, 1000);
  }

  function observeReveals() {
    const els = $$('#homeView .reveal');
    if (!('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('in')); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    els.forEach((el) => io.observe(el));
  }

  /* -------------------------------- Listing ------------------------------- */
  S.views.listing = function () {
    const st = state.listing;
    const cats = MT.catalog.categories;
    const cat = cats.find((c) => c.id === st.cat) || cats[0];
    const all = MT.products.all();
    const counts = {};
    cats.forEach((c) => { counts[c.id] = c.id === 'all' ? all.length : all.filter((p) => p.cat === c.id).length; });
    return '<div class="page"><div class="container">' +
      '<nav class="breadcrumb" aria-label="Breadcrumb"><a href="#/">Trang chủ</a><span class="sep">/</span><span>' + esc(cat.name) + '</span></nav>' +
      '<div class="page-head"><div><h1 class="page-title">' + esc(st.q ? 'Kết quả cho “' + st.q + '”' : cat.name) + '</h1>' +
      '<p class="page-sub">' + (st.q ? 'Tìm thấy sản phẩm phù hợp với từ khoá của bạn.' : 'Chọn sản phẩm phù hợp với làn da và chu trình của bạn.') + '</p></div>' +
      '<button class="btn btn--ghost filter-mobile-btn" type="button" id="openFilters">' + icon('filter', 16) + ' Bộ lọc</button>' +
      '</div>' +
      '<div class="catalog-layout">' +
        '<aside class="filters" id="filtersPanel">' +
          '<div style="display:flex;justify-content:space-between;align-items:center"><strong style="font-size:.9rem">Bộ lọc</strong>' +
          '<button class="icon-btn filter-close" type="button" id="closeFilters" aria-label="Đóng bộ lọc" style="display:none">' + icon('close', 18) + '</button></div>' +
          '<div class="filter-group"><h4>Danh mục</h4><div class="filter-list">' +
            cats.map((c) => '<label><input type="radio" name="cat" value="' + c.id + '" ' + (st.cat === c.id ? 'checked' : '') + '> ' + esc(c.name) + '<span class="num">' + counts[c.id] + '</span></label>').join('') +
          '</div></div>' +
          '<div class="filter-group"><h4>Khoảng giá</h4><div class="filter-list">' +
            [['all', 'Tất cả mức giá'], ['under200', 'Dưới 200.000₫'], ['200to350', '200.000 – 350.000₫'], ['350to500', '350.000 – 500.000₫'], ['over500', 'Trên 500.000₫']].map((p) =>
              '<label><input type="radio" name="price" value="' + p[0] + '" ' + (st.price === p[0] ? 'checked' : '') + '> ' + p[1] + '</label>').join('') +
          '</div></div>' +
          '<div class="filter-group"><h4>Loại da</h4><div class="filter-list">' +
            ['Da dầu', 'Da khô', 'Da nhạy cảm', 'Da hỗn hợp', 'Mọi loại da'].map((s) =>
              '<label><input type="checkbox" name="skin" value="' + esc(s) + '" ' + (st.skin.indexOf(s) >= 0 ? 'checked' : '') + '> ' + esc(s) + '</label>').join('') +
          '</div></div>' +
          '<button class="btn btn--ghost btn--block" type="button" id="clearFilters">Xoá bộ lọc</button>' +
          '<p style="font-size:.74rem;color:var(--may-ink-soft);margin-top:.4rem">Cần tư vấn? Gọi <strong>1900 6363</strong> (8:00–21:00)</p>' +
        '</aside>' +
        '<div>' +
          '<div class="catalog-toolbar">' +
            '<span class="count" id="listingCount"></span>' +
            '<label class="select-inline">Sắp xếp:' +
              '<select class="select" id="listingSort">' +
                [['featured', 'Nổi bật'], ['price-asc', 'Giá thấp → cao'], ['price-desc', 'Giá cao → thấp'], ['rating', 'Đánh giá cao'], ['sold', 'Bán chạy'], ['new', 'Mới nhất']].map((o) =>
                  '<option value="' + o[0] + '" ' + (st.sort === o[0] ? 'selected' : '') + '>' + o[1] + '</option>').join('') +
              '</select>' +
            '</label>' +
          '</div>' +
          '<div class="grid-products" id="listingGrid"></div>' +
          '<div id="listingEmpty"></div>' +
        '</div>' +
      '</div>' +
    '</div></div>';
  };

  function filteredProducts() {
    const st = state.listing;
    let list = MT.products.all();
    if (st.cat !== 'all') list = list.filter((p) => p.cat === st.cat);
    if (st.q) {
      const q = U.normalize(st.q);
      list = list.filter((p) => U.normalize([p.name, p.short, p.description, p.ingredients, MT.catalog.catName(p.cat), (p.tags || []).join(' ')].join(' ')).includes(q));
    }
    if (st.price !== 'all') {
      list = list.filter((p) => {
        if (st.price === 'under200') return p.price < 200000;
        if (st.price === '200to350') return p.price >= 200000 && p.price <= 350000;
        if (st.price === '350to500') return p.price > 350000 && p.price <= 500000;
        if (st.price === 'over500') return p.price > 500000;
        return true;
      });
    }
    if (st.skin.length) list = list.filter((p) => st.skin.some((s) => (p.skin || []).includes(s)));
    if (st.sort === 'price-asc') list = U.sortBy(list, (p) => p.price, 'asc');
    else if (st.sort === 'price-desc') list = U.sortBy(list, (p) => p.price, 'desc');
    else if (st.sort === 'rating') list = U.sortBy(list, (p) => ratingData(p).value, 'desc');
    else if (st.sort === 'sold') list = U.sortBy(list, (p) => p.sold || 0, 'desc');
    else if (st.sort === 'new') list = list.slice().reverse();
    return list;
  }

  function paintListing() {
    const list = filteredProducts();
    const grid = document.getElementById('listingGrid');
    const empty = document.getElementById('listingEmpty');
    if (!grid) return;
    grid.innerHTML = list.map((p) => card(p)).join('');
    const countEl = document.getElementById('listingCount');
    if (countEl) countEl.textContent = list.length + ' sản phẩm';
    if (empty) {
      empty.innerHTML = list.length ? '' : '<div class="empty" style="margin-top:1rem">' + icon('search', 30) +
        '<h3>Không tìm thấy sản phẩm phù hợp</h3><p>Thử bỏ bớt bộ lọc hoặc tìm với từ khoá khác.</p>' +
        '<button class="btn btn--sm" type="button" id="clearFilters2">Xoá bộ lọc</button></div>';
    }
    bindFallbacks(grid);
    const clear2 = document.getElementById('clearFilters2');
    if (clear2) clear2.addEventListener('click', () => {
      state.listing.price = 'all'; state.listing.skin = []; state.listing.cat = 'all'; state.listing.q = '';
      history.replaceState(null, '', '#/san-pham');
      router();
    });
  }

  function initListingPage() {
    paintListing();
    const filters = document.getElementById('filtersPanel');
    const openBtn = document.getElementById('openFilters');
    const closeBtn = document.getElementById('closeFilters');
    if (openBtn) openBtn.addEventListener('click', () => {
      filters.classList.add('open');
      document.body.classList.add('no-scroll');
      if (closeBtn) closeBtn.style.display = 'grid';
    });
    const closeFilters = () => {
      filters.classList.remove('open');
      document.body.classList.remove('no-scroll');
      if (closeBtn) closeBtn.style.display = 'none';
    };
    if (closeBtn) closeBtn.addEventListener('click', closeFilters);
    if (filters) filters.addEventListener('change', (e) => {
      const input = e.target;
      if (input.name === 'cat') { state.listing.cat = input.value; state.listing.q = ''; history.replaceState(null, '', '#/san-pham?cat=' + input.value); }
      if (input.name === 'price') state.listing.price = input.value;
      if (input.name === 'skin') {
        const s = input.value;
        if (input.checked) { if (!state.listing.skin.includes(s)) state.listing.skin.push(s); }
        else state.listing.skin = state.listing.skin.filter((x) => x !== s);
      }
      paintListing();
    });
    const sort = document.getElementById('listingSort');
    if (sort) sort.addEventListener('change', () => { state.listing.sort = sort.value; paintListing(); });
    const clear = document.getElementById('clearFilters');
    if (clear) clear.addEventListener('click', () => {
      state.listing.cat = 'all'; state.listing.q = ''; state.listing.price = 'all'; state.listing.skin = []; state.listing.sort = 'featured';
      history.replaceState(null, '', '#/san-pham');
      router();
    });
  }

  /* ---------------------------- Product detail ---------------------------- */
  S.views.product = function (slug) {
    const p = MT.products.all({ includeInactive: true }).find((x) => x.slug === slug);
    if (!p || p.active === false) return S.views.notfound('Sản phẩm không tồn tại hoặc đã ngừng bán.');
    state.detail = { product: p, image: 0, variant: p.variants[0] ? p.variants[0].name : '', qty: 1, rating: 5 };
    const rating = MT.products.rating(p);
    const reviews = rating.reviews.slice().sort((a, b) => new Date(b.at) - new Date(a.at));
    const catName = MT.catalog.catName(p.cat);
    const related = MT.products.all().filter((x) => x.id !== p.id && (x.cat === p.cat || x.cat === 'combo')).slice(0, 4);
    const off = discountPct(p);
    const stock = Number(p.stock) || 0;
    const stockCls = stock <= 0 ? 'out' : stock <= 10 ? 'low' : '';
    const stockLabel = stock <= 0 ? 'Tạm hết hàng' : stock <= 10 ? 'Chỉ còn ' + stock + ' sản phẩm' : 'Còn hàng · sẵn sàng giao';
    const sku = p.variants.length ? p.variants[0].sku : p.sku;
    const reviewBars = [5, 4, 3, 2, 1].map((n) => {
      const c = reviews.filter((r) => r.rating === n).length;
      const pct = reviews.length ? Math.round(c / reviews.length * 100) : 0;
      return '<div class="reviews__bar"><span>' + n + '★</span><div class="bar"><span style="width:' + pct + '%"></span></div><span>' + c + '</span></div>';
    }).join('');

    return '<div class="page"><div class="container">' +
      '<nav class="breadcrumb" aria-label="Breadcrumb"><a href="#/">Trang chủ</a><span class="sep">/</span><a href="#/san-pham?cat=' + p.cat + '">' + esc(catName) + '</a><span class="sep">/</span><span>' + esc(p.name) + '</span></nav>' +
      '<div class="pdp">' +
        '<div class="gallery">' +
          '<div class="gallery__main"><img id="pdpMainImg" src="' + esc(p.images[0]) + '" alt="' + esc(p.name) + '" data-fallback></div>' +
          '<div class="gallery__thumbs">' + p.images.map((img, i) =>
            '<button type="button" data-gallery="' + i + '" class="' + (i === 0 ? 'active' : '') + '" aria-label="Ảnh ' + (i + 1) + '"><img src="' + esc(img) + '" alt="" data-fallback></button>').join('') +
          '</div>' +
        '</div>' +
        '<div class="pdp__info">' +
          '<div class="product__badges" style="position:static;flex-direction:row;margin-bottom:.5rem">' +
            (p.badge ? '<span class="badge-pill">' + esc(p.badge) + '</span>' : '') +
            (off ? '<span class="badge-pill badge-pill--dark">Tiết kiệm ' + off + '%</span>' : '') +
          '</div>' +
          '<h1>' + esc(p.name) + '</h1>' +
          '<div class="pdp__rating">' + U.stars(rating.value, 15) + '<strong>' + rating.value.toFixed(1) + '</strong>' +
            '<a href="#reviewsTab" data-scroll-tab="reviews">' + rating.count + ' đánh giá</a><span>·</span><span>Đã bán ' + U.fmt.num(p.sold || 0) + '</span></div>' +
          '<div class="pdp__price"><span class="price-now">' + money(p.price) + '</span>' +
            (off ? '<span class="price-was">' + money(p.compareAt) + '</span><span class="price-off">-' + off + '%</span>' : '') + '</div>' +
          '<p class="pdp__short">' + esc(p.short) + '</p>' +
          '<div class="pdp__stock ' + stockCls + '"><span class="dot"></span>' + stockLabel + '</div>' +
          (p.variants.length ? '<div class="option-label">Phân loại <span>' + esc(state.detail.variant) + '</span></div>' +
            '<div class="variants" id="variantList">' + p.variants.map((v, i) =>
              '<button type="button" class="variant ' + (i === 0 ? 'active' : '') + '" data-variant="' + esc(v.name) + '">' + esc(v.name) + '</button>').join('') + '</div>' : '') +
          '<div class="option-label">Số lượng <span>' + (p.volume ? esc(p.volume) : '') + '</span></div>' +
          '<div class="purchase">' +
            '<div class="qty"><button type="button" data-qty-step="-1" aria-label="Giảm">−</button>' +
              '<input type="number" id="pdpQty" value="1" min="1" max="' + Math.max(1, stock) + '" aria-label="Số lượng">' +
              '<button type="button" data-qty-step="1" aria-label="Tăng">+</button></div>' +
            '<button type="button" class="btn" id="addToCartBtn" ' + (stock <= 0 ? 'disabled' : '') + '>' + icon('cart', 18) + ' Thêm vào giỏ</button>' +
          '</div>' +
          '<button type="button" class="btn btn--pink btn--block" id="buyNowBtn" ' + (stock <= 0 ? 'disabled' : '') + '>Mua ngay · ' + money(p.price) + '</button>' +
          '<div class="pdp__perks">' +
            '<div>' + icon('truck', 17) + ' Miễn phí giao từ 299.000₫</div>' +
            '<div>' + icon('refresh', 17) + ' Đổi trả 30 ngày</div>' +
            '<div>' + icon('shield', 17) + ' Kiểm nghiệm da liễu</div>' +
            '<div>' + icon('phone', 17) + ' Tư vấn 1900 6363</div>' +
          '</div>' +
          '<div class="accordion" id="pdpAccordion">' +
            '<div class="accordion__item"><button type="button" class="accordion__head">Thành phần<div>' + icon('chevronDown', 18) + '</div></button><div class="accordion__body"><p>' + esc(p.ingredients) + '</p></div></div>' +
            '<div class="accordion__item"><button type="button" class="accordion__head">Hướng dẫn sử dụng<div>' + icon('chevronDown', 18) + '</div></button><div class="accordion__body"><ol style="padding-left:1.1rem">' + p.usage.map((u) => '<li style="margin-bottom:.3rem">' + esc(u) + '</li>').join('') + '</ol></div></div>' +
            '<div class="accordion__item"><button type="button" class="accordion__head">Vận chuyển &amp; đổi trả<div>' + icon('chevronDown', 18) + '</div></button><div class="accordion__body"><p>Giao 1–2 ngày tại Hà Nội &amp; TP.HCM, 2–4 ngày toàn quốc. Miễn phí vận chuyển cho đơn từ 299.000₫. Đổi trả trong 30 ngày kể cả khi đã mở hộp (sản phẩm còn trên 70% dung tích).</p></div></div>' +
            '<div class="accordion__item"><button type="button" class="accordion__head">Mã sản phẩm<div>' + icon('chevronDown', 18) + '</div></button><div class="accordion__body"><p>SKU: ' + esc(sku) + ' · Thương hiệu: Mây Trắng · Xuất xứ: Việt Nam</p></div></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="pdp-tabs">' +
        '<div class="tabs-nav" role="tablist">' +
          '<button type="button" class="active" data-tab="desc" role="tab">Mô tả sản phẩm</button>' +
          '<button type="button" data-tab="reviews" role="tab">Đánh giá (' + rating.count + ')</button>' +
        '</div>' +
        '<div class="tab-panel active" data-panel="desc">' +
          '<div>' + p.description + '</div>' +
          '<h3>Vì sao bạn sẽ thích</h3><ul>' + p.benefits.map((b) => '<li>' + esc(b) + '</li>').join('') + '</ul>' +
          '<h3>Phù hợp với</h3><p>' + (p.skin || []).map(esc).join(' · ') + '</p>' +
        '</div>' +
        '<div class="tab-panel" data-panel="reviews">' +
          '<div class="reviews" id="reviewsTab">' +
            '<div class="reviews__summary"><div class="reviews__score">' + rating.value.toFixed(1) + '</div>' +
              U.stars(rating.value, 16) +
              '<p style="font-size:.78rem;color:var(--may-ink-soft)">Dựa trên ' + rating.count + ' đánh giá</p>' +
              '<div class="reviews__bars">' + reviewBars + '</div>' +
            '</div>' +
            '<div>' +
              '<div class="review-list">' + (reviews.length ? reviews.map((r) =>
                '<div class="review-item"><div class="review-item__head"><strong>' + esc(r.name) + '</strong>' +
                (r.verified ? '<span class="verified">' + icon('checkCircle', 11) + ' Đã mua</span>' : '') +
                U.stars(r.rating, 12) + '<time>' + U.fmt.date(r.at) + '</time></div><p>' + esc(r.text) + '</p></div>'
              ).join('') : '<p style="color:var(--may-ink-soft);font-size:.88rem">Chưa có đánh giá nào. Hãy là người đầu tiên chia sẻ cảm nhận.</p>') + '</div>' +
              '<form class="review-form" id="reviewForm" novalidate>' +
                '<h4>Viết đánh giá của bạn</h4>' +
                '<div class="rating-input" id="ratingInput">' + [1, 2, 3, 4, 5].map((n) =>
                  '<button type="button" data-star="' + n + '" class="' + (n <= 5 ? 'on' : '') + '" aria-label="' + n + ' sao">' + icon('star', 22) + '</button>').join('') + '</div>' +
                '<div class="form-row"><div class="field"><label for="rvName">Tên của bạn</label><input class="input" id="rvName" placeholder="Ví dụ: Ngọc Anh" required><span class="field-error">Vui lòng nhập tên.</span></div>' +
                '<div class="field"><label for="rvRatingView">Đánh giá</label><input class="input" id="rvRatingView" value="5 sao" readonly aria-label="Số sao đã chọn"></div></div>' +
                '<div class="field"><label for="rvContent">Nội dung đánh giá</label><textarea class="textarea" id="rvContent" placeholder="Sản phẩm dùng thế nào? Bạn thích điều gì nhất?" required></textarea><span class="field-error">Cần ít nhất 10 ký tự.</span></div>' +
                '<button class="btn btn--sm mt-2" type="submit">Gửi đánh giá</button>' +
              '</form>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="section" style="padding-bottom:0">' +
        '<div class="section__head"><div><span class="kicker">Gợi ý cho bạn</span><h2>Sản phẩm <em>liên quan</em></h2></div><a href="#/san-pham?cat=' + p.cat + '" class="link-arrow">Xem thêm →</a></div>' +
        '<div class="grid-products">' + related.map((x) => card(x)).join('') + '</div>' +
      '</div>' +
    '</div></div>';
  };

  function initProductPage() {
    const d = state.detail;
    if (!d) return;
    const p = d.product;
    const qtyInput = document.getElementById('pdpQty');
    const maxQty = Math.max(1, Number(p.stock) || 1);

    $$('[data-gallery]').forEach((btn) => btn.addEventListener('click', () => {
      d.image = Number(btn.dataset.gallery);
      document.getElementById('pdpMainImg').src = p.images[d.image];
      $$('[data-gallery]').forEach((b) => b.classList.toggle('active', b === btn));
    }));

    $$('[data-variant]').forEach((btn) => btn.addEventListener('click', () => {
      d.variant = btn.dataset.variant;
      $$('[data-variant]').forEach((b) => b.classList.toggle('active', b === btn));
      const label = $('.pdp__info .option-label span');
      if (label) label.textContent = d.variant;
    }));

    $$('[data-qty-step]').forEach((btn) => btn.addEventListener('click', () => {
      d.qty = U.clamp(d.qty + Number(btn.dataset.qtyStep), 1, maxQty);
      qtyInput.value = d.qty;
    }));
    if (qtyInput) qtyInput.addEventListener('change', () => {
      d.qty = U.clamp(Number(qtyInput.value) || 1, 1, maxQty);
      qtyInput.value = d.qty;
    });

    const add = () => {
      const qty = U.clamp(Number(qtyInput.value) || 1, 1, maxQty);
      return addToCart(p.id, d.variant, qty, { open: true });
    };
    const addBtn = document.getElementById('addToCartBtn');
    if (addBtn) addBtn.addEventListener('click', add);
    const buyBtn = document.getElementById('buyNowBtn');
    if (buyBtn) buyBtn.addEventListener('click', () => {
      if (addToCart(p.id, d.variant, U.clamp(Number(qtyInput.value) || 1, 1, maxQty), { open: false })) {
        navigate('#/thanh-toan');
      }
    });

    $$('.accordion__head').forEach((h) => h.addEventListener('click', () => {
      const item = h.parentElement;
      const open = item.classList.contains('open');
      $$('.accordion__item').forEach((x) => x.classList.remove('open'));
      if (!open) item.classList.add('open');
    }));

    $$('[data-tab]').forEach((btn) => btn.addEventListener('click', () => {
      $$('[data-tab]').forEach((b) => b.classList.toggle('active', b === btn));
      $$('.tab-panel').forEach((panel) => panel.classList.toggle('active', panel.dataset.panel === btn.dataset.tab));
    }));

    $$('[data-star]').forEach((btn) => btn.addEventListener('click', () => {
      d.rating = Number(btn.dataset.star);
      $$('[data-star]').forEach((b) => b.classList.toggle('on', Number(b.dataset.star) <= d.rating));
      const view = document.getElementById('rvRatingView');
      if (view) view.value = d.rating + ' sao';
    }));

    const reviewLink = document.querySelector('[data-scroll-tab="reviews"]');
    if (reviewLink) reviewLink.addEventListener('click', (e) => {
      e.preventDefault();
      const tabBtn = $('[data-tab="reviews"]');
      if (tabBtn) tabBtn.click();
      const reviewTab = document.getElementById('reviewsTab');
      if (reviewTab) reviewTab.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) reviewForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('rvName');
      const content = document.getElementById('rvContent');
      const fieldName = name.closest('.field');
      const fieldContent = content.closest('.field');
      let ok = true;
      fieldName.classList.remove('invalid');
      fieldContent.classList.remove('invalid');
      if (name.value.trim().length < 2) { fieldName.classList.add('invalid'); ok = false; }
      if (content.value.trim().length < 10) { fieldContent.classList.add('invalid'); ok = false; }
      if (!ok) return;
      try {
        MT.db.addReview({ productId: p.id, name: name.value, rating: d.rating, text: content.value, verified: false });
        U.toast('Cảm ơn bạn đã gửi đánh giá!', 'success');
        const slug = p.slug;
        pageView().innerHTML = S.views.product(slug);
        document.title = p.name + ' – Mây Trắng';
        bindFallbacks(pageView());
        initProductPage();
        const tabBtn = $('[data-tab="reviews"]');
        if (tabBtn) tabBtn.click();
        const reviewTab = document.getElementById('reviewsTab');
        if (reviewTab) reviewTab.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch (err) {
        U.toast(err.message, 'error');
      }
    });
  }

  /* -------------------------------- Wishlist ------------------------------ */
  S.views.wishlist = function () {
    const items = MT.wishlist.all().map((id) => MT.products.get(id)).filter(Boolean);
    return '<div class="page"><div class="container">' +
      '<nav class="breadcrumb"><a href="#/">Trang chủ</a><span class="sep">/</span><span>Yêu thích</span></nav>' +
      '<div class="page-head"><div><h1 class="page-title">Sản phẩm yêu thích</h1><p class="page-sub">' + (items.length ? items.length + ' sản phẩm bạn đã lưu.' : 'Lưu lại những sản phẩm bạn muốn thử.') + '</p></div></div>' +
      (items.length ? '<div class="grid-products">' + items.map((p) => card(p)).join('') + '</div>' :
        '<div class="empty">' + icon('heart', 32) + '<h3>Chưa có sản phẩm yêu thích</h3><p>Nhấn vào biểu tượng trái tim trên sản phẩm để lưu lại.</p><a href="#/san-pham" class="btn btn--sm">Khám phá sản phẩm</a></div>') +
    '</div></div>';
  };

  /* --------------------------------- Article ------------------------------ */
  S.views.article = function (slug) {
    const a = MT.content.articles.find((x) => x.slug === slug);
    if (!a) return S.views.notfound('Bài viết không tồn tại.');
    const others = MT.content.articles.filter((x) => x.slug !== slug).slice(0, 3);
    return '<div class="page"><div class="container"><div class="article-page">' +
      '<nav class="breadcrumb"><a href="#/">Trang chủ</a><span class="sep">/</span><a href="#/">Bài viết</a><span class="sep">/</span><span>' + esc(a.tag) + '</span></nav>' +
      '<div class="article-page__meta">' + esc(a.tag) + ' · ' + U.fmt.date(a.date) + ' · ' + a.read + ' đọc</div>' +
      '<h1>' + esc(a.title) + '</h1><p class="article-page__lead">' + esc(a.excerpt) + '</p>' +
      '<div class="article-page__hero"><img src="' + a.image + '" alt="' + esc(a.title) + '" data-fallback></div>' +
      '<div class="article-body">' + a.body + '</div>' +
      '<div class="mt-3"><a href="#/" class="btn btn--ghost">← Về trang chủ</a></div>' +
      '<div class="section" style="padding-bottom:0"><div class="section__head"><div><span class="kicker">Đọc tiếp</span><h2>Bài viết <em>khác</em></h2></div></div>' +
      '<div class="articles-grid">' + others.map((x) =>
        '<article class="article-card"><a href="#/bai-viet/' + x.slug + '" class="article-card__img"><img src="' + x.image + '" alt="" data-fallback></a>' +
        '<div class="article-card__body"><span class="article-card__meta">' + esc(x.tag) + '</span><h3><a href="#/bai-viet/' + x.slug + '">' + esc(x.title) + '</a></h3></div></article>').join('') +
      '</div></div>' +
    '</div></div></div>';
  };

  /* ---------------------------------- 404 --------------------------------- */
  S.views.notfound = function (message) {
    return '<div class="page"><div class="container"><div class="not-found">' +
      '<div class="big">404</div><h1>Trang này trôi theo mây mất rồi</h1>' +
      '<p>' + esc(message || 'Sản phẩm hoặc trang bạn tìm không tồn tại. Cùng quay lại gian hàng nhé.') + '</p>' +
      '<a href="#/san-pham" class="btn">Khám phá sản phẩm</a> <a href="#/" class="btn btn--ghost">Về trang chủ</a>' +
    '</div></div></div>';
  };

  /* --------------------------------- Search ------------------------------- */
  function renderSearchResults(q) {
    const host = document.getElementById('searchResults');
    if (!host) return;
    const all = MT.products.all();
    const query = String(q || '').trim();
    let list;
    if (!query) {
      host.innerHTML = '<p style="font-size:.8rem;color:var(--may-ink-soft);margin-bottom:.4rem">Sản phẩm nổi bật</p>' +
        all.filter((p) => p.featured).slice(0, 4).map(searchRow).join('');
      return;
    }
    const nq = U.normalize(query);
    list = all.filter((p) => U.normalize([p.name, p.short, p.ingredients, MT.catalog.catName(p.cat)].join(' ')).includes(nq)).slice(0, 6);
    host.innerHTML = list.length
      ? list.map(searchRow).join('') + '<a href="#/san-pham?q=' + encodeURIComponent(query) + '" class="search-result" data-close-search style="font-weight:800;color:var(--may-blue-deep)">Xem tất cả kết quả cho “' + esc(query) + '” →</a>'
      : '<div class="search-empty">Không tìm thấy sản phẩm cho “' + esc(query) + '”. Thử “kem dưỡng” hoặc “combo”.</div>';
  }

  function searchRow(p) {
    return '<a class="search-result" href="' + productUrl(p) + '" data-close-search>' +
      '<img src="' + esc(p.images[0]) + '" alt="" data-fallback>' +
      '<div><strong>' + esc(p.name) + '</strong><span>' + esc(MT.catalog.catName(p.cat)) + '</span></div>' +
      '<span class="price">' + money(p.price) + '</span></a>';
  }

  function openSearch() {
    const overlay = document.getElementById('searchOverlay');
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    renderSearchResults('');
    const input = document.getElementById('searchInput');
    setTimeout(() => input.focus(), 60);
  }
  function closeSearch() {
    const overlay = document.getElementById('searchOverlay');
    if (!overlay) return;
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    if (!document.getElementById('cartDrawer').classList.contains('open')) document.body.classList.remove('no-scroll');
  }

  function openMenu() {
    const menu = document.getElementById('mobileMenu');
    menu.classList.add('open');
    menu.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    document.getElementById('burgerBtn').setAttribute('aria-expanded', 'true');
  }
  function closeMenu() {
    const menu = document.getElementById('mobileMenu');
    if (!menu) return;
    menu.classList.remove('open');
    menu.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
    const b = document.getElementById('burgerBtn');
    if (b) b.setAttribute('aria-expanded', 'false');
  }

  /* ------------------------------- Checkout hook -------------------------- */
  function initCheckoutPage() {
    if (S.initCheckout) S.initCheckout();
  }
  function initOrderPage() {
    if (S.initOrder) S.initOrder();
  }
  function initLookupPage() {
    if (S.initLookup) S.initLookup();
  }

  /* ------------------------------ Global bind ----------------------------- */
  function bindGlobal() {
    document.getElementById('searchBtn').addEventListener('click', openSearch);
    document.getElementById('searchClose').addEventListener('click', closeSearch);
    document.getElementById('cartBtn').addEventListener('click', openCart);
    document.getElementById('burgerBtn').addEventListener('click', openMenu);
    $$('[data-close-cart]').forEach((el) => el.addEventListener('click', closeCart));
    $$('[data-close-menu]').forEach((el) => el.addEventListener('click', closeMenu));

    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', U.debounce(() => renderSearchResults(searchInput.value), 150));
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const q = searchInput.value.trim();
        closeSearch();
        navigate('#/san-pham' + (q ? '?q=' + encodeURIComponent(q) : ''));
      }
    });
    $$('[data-search-term]').forEach((btn) => btn.addEventListener('click', () => {
      searchInput.value = btn.dataset.searchTerm;
      renderSearchResults(searchInput.value);
      searchInput.focus();
    }));

    document.addEventListener('click', (e) => {
      const closeSearchEl = e.target.closest('[data-close-search]');
      if (closeSearchEl) closeSearch();

      const scrollEl = e.target.closest('[data-scroll]');
      if (scrollEl) {
        e.preventDefault();
        const id = scrollEl.dataset.scroll;
        closeMenu();
        if (state.route.name !== 'home') {
          navigate('#/');
          setTimeout(() => scrollToSection(id), 220);
        } else {
          scrollToSection(id);
        }
      }

      const wish = e.target.closest('[data-wish]');
      if (wish) {
        const active = MT.wishlist.toggle(wish.dataset.wish);
        U.toast(active ? 'Đã lưu vào yêu thích' : 'Đã bỏ khỏi yêu thích', active ? 'success' : 'info');
        $$('[data-wish="' + wish.dataset.wish + '"]').forEach((b) => {
          b.classList.toggle('active', active);
          b.setAttribute('aria-pressed', String(active));
          b.setAttribute('aria-label', active ? 'Bỏ yêu thích' : 'Thêm vào yêu thích');
        });
        refreshChrome();
        if (state.route.name === 'wishlist') {
          pageView().innerHTML = S.views.wishlist();
          bindFallbacks(pageView());
        }
        return;
      }

      const quick = e.target.closest('[data-quick-add]');
      if (quick) {
        const p = MT.products.get(quick.dataset.quickAdd);
        if (!p) return;
        if (p.variants.length > 1) navigate(productUrl(p));
        else addToCart(p.id, p.variants[0] ? p.variants[0].name : '', 1, { open: false });
        return;
      }

      const step = e.target.closest('[data-cart-step]');
      if (step) {
        const key = step.dataset.cartStep;
        const delta = Number(step.dataset.delta);
        const item = MT.cart.details().items.find((x) => x.key === key);
        if (item) MT.cart.setQty(key, item.qty + delta);
        renderCart();
        return;
      }
      const remove = e.target.closest('[data-cart-remove]');
      if (remove) {
        MT.cart.remove(remove.dataset.cartRemove);
        renderCart();
        U.toast('Đã xoá sản phẩm khỏi giỏ', 'info');
        return;
      }

      const copyBtn = e.target.closest('[data-copy]');
      if (copyBtn) {
        U.copy(copyBtn.dataset.copy).then((ok) => U.toast(ok ? 'Đã sao chép' : 'Không thể sao chép', ok ? 'success' : 'error'));
        return;
      }

      const payBtn = e.target.closest('[data-mark-paid]');
      if (payBtn) {
        U.confirm({
          title: 'Xác nhận đã chuyển khoản?',
          message: 'Hệ thống sẽ ghi nhận thanh toán cho đơn ' + payBtn.dataset.markPaid + ' và chuyển đơn sang trạng thái đã xác nhận.',
          confirmText: 'Tôi đã chuyển khoản',
        }).then((ok) => {
          if (!ok) return;
          try {
            MT.db.markPaid(payBtn.dataset.markPaid);
            U.toast('Đã ghi nhận thanh toán. Cảm ơn bạn!', 'success');
            router();
          } catch (err) { U.toast(err.message, 'error'); }
        });
        return;
      }

      const cancelBtn = e.target.closest('[data-cancel-order]');
      if (cancelBtn) {
        const code = cancelBtn.dataset.cancelOrder;
        U.confirm({
          title: 'Huỷ đơn hàng ' + code + '?',
          message: 'Đơn hàng sẽ được huỷ và tồn kho được hoàn lại. Thao tác này không thể hoàn tác.',
          confirmText: 'Huỷ đơn',
          danger: true,
        }).then((ok) => {
          if (!ok) return;
          try {
            const order = MT.db.findOrder(cancelBtn.dataset.cancelOrder);
            if (!order) { U.toast('Không tìm thấy đơn hàng', 'error'); return; }
            MT.db.setOrderStatus(order.id, 'cancelled', 'Khách huỷ từ trang đơn hàng');
            U.toast('Đã huỷ đơn hàng', 'success');
            router();
          } catch (err) { U.toast(err.message, 'error'); }
        });
        return;
      }

      const printBtn = e.target.closest('[data-print]');
      if (printBtn) { window.print(); return; }

      const tabBtn = e.target.closest('[data-tab]');
      if (tabBtn) return;
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeSearch(); closeCart(); closeMenu();
      }
    });

    document.getElementById('newsletterForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('newsletterEmail');
      try {
        const res = MT.db.addSubscriber(input.value);
        U.toast(res.existed ? 'Email này đã đăng ký nhận tin rồi.' : 'Cảm ơn bạn đã đăng ký nhận tin!', res.existed ? 'info' : 'success');
        input.value = '';
      } catch (err) {
        U.toast(err.message, 'error');
        input.focus();
      }
    });

    window.addEventListener('scroll', () => {
      const header = document.getElementById('siteHeader');
      if (header) header.classList.toggle('scrolled', window.scrollY > 10);
    }, { passive: true });

    document.addEventListener('click', (e) => {
      const navLink = e.target.closest('.nav-links a, .mobile-menu nav a');
      if (navLink) setNav(navLink.dataset.nav || '');
    });

    window.addEventListener('hashchange', router);

    MT.bus.on('cart:change', () => { renderCart(); refreshChrome(); });
    MT.bus.on('wishlist:change', () => refreshChrome());
    MT.bus.on('db:change', (p) => {
      if (p && p.name === 'reviews' && state.route.name === 'product') {
        // để form đánh giá tự render lại
      }
    });

    // Announcement xoay vòng
    const messages = [
      '✦ Miễn phí giao hàng toàn quốc cho hoá đơn từ 299.000đ ✦',
      '✦ Đổi trả trong 30 ngày, kể cả khi đã mở hộp ✦',
      '✦ Bộ sưu tập Tết 2027 — giảm đến 20% cho combo ✦',
    ];
    let mi = 0;
    setInterval(() => {
      const el = document.getElementById('announcementText');
      if (!el) return;
      el.classList.add('is-fading');
      setTimeout(() => { mi = (mi + 1) % messages.length; el.textContent = messages[mi]; el.classList.remove('is-fading'); }, 350);
    }, 5200);
  }

  /* ---------------------------------- Init -------------------------------- */
  function init() {
    renderHome();
    renderCart();
    refreshChrome();
    bindGlobal();
    // Điền email đã lưu
    const saved = MT.customer.get();
    if (saved.email) {
      const nl = document.getElementById('newsletterEmail');
      if (nl) nl.value = saved.email;
    }
    router();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
