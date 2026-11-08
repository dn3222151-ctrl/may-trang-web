/* ==========================================================================
   MÂY TRẮNG – Tiện ích dùng chung
   ========================================================================== */
(function () {
  const MT = window.MT;
  const nf0 = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });
  const nf1 = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 });

  const pad = (n) => String(n).padStart(2, '0');
  const escMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, (c) => escMap[c]);
  }

  function attr(v) {
    return esc(v).replace(/`/g, '&#96;');
  }

  function normalize(str) {
    return String(str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .trim();
  }

  const fmt = {
    num(n, digits) {
      const v = Number(n) || 0;
      return digits ? nf1.format(v) : nf0.format(Math.round(v));
    },
    money(n) {
      return nf0.format(Math.round(Number(n) || 0)) + ' ₫';
    },
    moneyShort(n) {
      const v = Number(n) || 0;
      const sign = v < 0 ? '-' : '';
      const a = Math.abs(v);
      if (a >= 1e9) return sign + (a / 1e9).toFixed(a >= 1e10 ? 0 : 1).replace('.', ',') + ' tỷ';
      if (a >= 1e6) return sign + (a / 1e6).toFixed(a >= 1e7 ? 0 : 1).replace('.', ',') + ' tr';
      if (a >= 1e3) return sign + Math.round(a / 1e3) + 'k';
      return sign + nf0.format(a);
    },
    compact(n) {
      const v = Number(n) || 0;
      if (Math.abs(v) >= 1e9) return (v / 1e9).toFixed(1).replace('.', ',') + ' tỷ';
      if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(1).replace('.', ',') + ' tr';
      if (Math.abs(v) >= 1e3) return nf0.format(v / 1e3) + 'k';
      return nf0.format(v);
    },
    pct(n, digits) {
      const d = digits == null ? 1 : digits;
      const v = Number(n) || 0;
      return v.toFixed(d).replace('.', ',') + '%';
    },
    date(v) {
      const d = v instanceof Date ? v : new Date(v);
      if (isNaN(d)) return '—';
      return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear();
    },
    dateInput(v) {
      const d = v instanceof Date ? v : new Date(v);
      if (isNaN(d)) return '';
      return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    },
    dateShort(v) {
      const d = v instanceof Date ? v : new Date(v);
      if (isNaN(d)) return '—';
      return pad(d.getDate()) + '/' + pad(d.getMonth() + 1);
    },
    month(v) {
      const d = v instanceof Date ? v : new Date(v);
      if (isNaN(d)) return '—';
      return 'Thg ' + (d.getMonth() + 1) + '/' + String(d.getFullYear()).slice(-2);
    },
    monthLong(v) {
      const d = v instanceof Date ? v : new Date(v);
      return 'Tháng ' + (d.getMonth() + 1) + ', ' + d.getFullYear();
    },
    datetime(v) {
      const d = v instanceof Date ? v : new Date(v);
      if (isNaN(d)) return '—';
      return fmt.date(d) + ' · ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    },
    time(v) {
      const d = v instanceof Date ? v : new Date(v);
      return pad(d.getHours()) + ':' + pad(d.getMinutes());
    },
    ago(v) {
      const d = new Date(v).getTime();
      if (isNaN(d)) return '—';
      const diff = Math.max(0, Date.now() - d);
      const m = Math.floor(diff / 60000);
      if (m < 1) return 'vừa xong';
      if (m < 60) return m + ' phút trước';
      const h = Math.floor(m / 60);
      if (h < 24) return h + ' giờ trước';
      const days = Math.floor(h / 24);
      if (days < 30) return days + ' ngày trước';
      return fmt.date(d);
    },
    bytes(b) {
      const n = Number(b) || 0;
      if (n < 1024) return n + ' B';
      if (n < 1048576) return (n / 1024).toFixed(0) + ' KB';
      return (n / 1048576).toFixed(1).replace('.', ',') + ' MB';
    },
    phone(p) {
      const s = String(p || '').replace(/\D/g, '');
      if (s.length === 10) return s.slice(0, 4) + ' ' + s.slice(4, 7) + ' ' + s.slice(7);
      return p || '—';
    },
  };

  const util = {
    esc,
    attr,
    normalize,
    fmt,
    $: (sel, root) => (root || document).querySelector(sel),
    $$: (sel, root) => Array.from((root || document).querySelectorAll(sel)),
    el(tag, attrs, html) {
      const node = document.createElement(tag);
      if (attrs) Object.keys(attrs).forEach((k) => {
        if (k === 'class') node.className = attrs[k];
        else if (k === 'text') node.textContent = attrs[k];
        else node.setAttribute(k, attrs[k]);
      });
      if (html != null) node.innerHTML = html;
      return node;
    },
    uid(prefix) {
      util._n = (util._n || 0) + 1;
      return (prefix || 'id') + '_' + Date.now().toString(36) + util._n.toString(36);
    },
    clamp(n, min, max) { return Math.min(max, Math.max(min, Number(n) || 0)); },
    round(n, d) {
      const f = Math.pow(10, d || 0);
      return Math.round((Number(n) || 0) * f) / f;
    },
    sum(arr, fn) {
      return (arr || []).reduce((s, x, i) => s + (Number(fn ? fn(x, i) : x) || 0), 0);
    },
    groupBy(arr, fn) {
      return (arr || []).reduce((acc, x) => {
        const k = fn(x);
        (acc[k] = acc[k] || []).push(x);
        return acc;
      }, {});
    },
    uniqBy(arr, fn) {
      const seen = new Set();
      return (arr || []).filter((x) => {
        const k = fn(x);
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    },
    sortBy(arr, fn, dir) {
      const d = dir === 'desc' ? -1 : 1;
      return (arr || []).slice().sort((a, b) => {
        const va = fn(a), vb = fn(b);
        if (va === vb) return 0;
        return (va > vb ? 1 : -1) * d;
      });
    },
    debounce(fn, ms) {
      let t;
      return function (...args) {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), ms || 250);
      };
    },
    throttle(fn, ms) {
      let last = 0, timer;
      return function (...args) {
        const now = Date.now();
        const wait = ms - (now - last);
        if (wait <= 0) {
          last = now;
          fn.apply(this, args);
        } else {
          clearTimeout(timer);
          timer = setTimeout(() => { last = Date.now(); fn.apply(this, args); }, wait);
        }
      };
    },
    wait(ms) { return new Promise((r) => setTimeout(r, ms)); },
    moneyInput(v) { return String(v == null ? '' : v).replace(/[^\d]/g, ''); },
    parseMoney(v) { return Number(String(v || '').replace(/[^\d-]/g, '')) || 0; },
    truncate(str, n) {
      const s = String(str || '');
      return s.length > n ? s.slice(0, n).trimEnd() + '…' : s;
    },
    nl2br(str) { return esc(str).replace(/\n/g, '<br>'); },
    initials(name) {
      return String(name || '?').trim().split(/\s+/).slice(-2).map((w) => w[0]).join('').toUpperCase();
    },
    pctChange(cur, prev) {
      if (!prev) return cur ? 100 : 0;
      return ((cur - prev) / Math.abs(prev)) * 100;
    },
    hashString(str) {
      let h = 2166136261;
      for (let i = 0; i < String(str).length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      return h >>> 0;
    },
    mulberry32(seed) {
      let a = seed >>> 0;
      return function () {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    },
    download(filename, content, mime) {
      const blob = content instanceof Blob ? content : new Blob(['\ufeff' + content], { type: mime || 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 500);
    },
    csv(rows) {
      return rows.map((row) => row.map((cell) => {
        const s = String(cell == null ? '' : cell);
        return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      }).join(',')).join('\r\n');
    },
    async copy(text) {
      try {
        await navigator.clipboard.writeText(String(text));
        return true;
      } catch (e) {
        const ta = document.createElement('textarea');
        ta.value = String(text);
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        let ok = false;
        try { ok = document.execCommand('copy'); } catch (err) {}
        ta.remove();
        return ok;
      }
    },
    /** Nén ảnh trước khi lưu vào localStorage để tránh tràn dung lượng. */
    async compressImage(file, maxPx, quality) {
      const max = maxPx || MT.config.limits.evidenceImageMaxPx;
      const q = quality || MT.config.limits.evidenceQuality;
      const dataUrl = await util.readAsDataURL(file);
      const img = await new Promise((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = dataUrl;
      });
      let { width, height } = img;
      const ratio = Math.min(1, max / Math.max(width, height));
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      return canvas.toDataURL('image/jpeg', q);
    },
    readAsDataURL(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    },
    placeholder(seed) {
      const h = util.hashString(seed || 'maytrang');
      const hue1 = 200 + (h % 25);
      const hue2 = 340 + (h % 15);
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
        <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="hsl(${hue1},45%,92%)"/><stop offset="1" stop-color="hsl(${hue2},45%,92%)"/>
        </linearGradient></defs>
        <rect width="800" height="1000" fill="url(#g)"/>
        <g fill="#ffffff" opacity=".65">
          <ellipse cx="300" cy="470" rx="130" ry="55"/><ellipse cx="420" cy="440" rx="100" ry="70"/>
          <ellipse cx="510" cy="480" rx="110" ry="50"/>
        </g>
        <text x="400" y="620" text-anchor="middle" font-family="Georgia,serif" font-size="46" fill="#6E9BB8">Mây Trắng</text>
        <text x="400" y="668" text-anchor="middle" font-family="Arial,sans-serif" font-size="20" fill="#9DB6C8" letter-spacing="6">NATURAL BEAUTY</text>
      </svg>`;
      return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    },
    bindImgFallback(root) {
      (root || document).querySelectorAll('img[data-fallback]').forEach((img) => {
        img.addEventListener('error', function () {
          if (this.dataset.failed) return;
          this.dataset.failed = '1';
          this.src = util.placeholder(this.alt || 'Mây Trắng');
        });
      });
    },
    todayISO() { const d = new Date(); return fmt.dateInput(d); },
    nowISO() { return new Date().toISOString(); },
    startOfDay(v) { const d = new Date(v); d.setHours(0, 0, 0, 0); return d; },
    endOfDay(v) { const d = new Date(v); d.setHours(23, 59, 59, 999); return d; },
    addDays(v, n) { const d = new Date(v); d.setDate(d.getDate() + n); return d; },
    startOfMonth(v) { const d = new Date(v); d.setDate(1); d.setHours(0, 0, 0, 0); return d; },
    daysInMonth(v) { const d = new Date(v); return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); },
    daysBetween(a, b) { return Math.max(1, Math.round((util.endOfDay(b) - util.startOfDay(a)) / 86400000) + 1); },
    monthKey(v) {
      const d = new Date(v);
      return d.getFullYear() + '-' + pad(d.getMonth() + 1);
    },
    isSameMonth(a, b) {
      const x = new Date(a), y = new Date(b);
      return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth();
    },
  };

  /* ------------------------------ Icons ------------------------------ */
  const icons = {
    cart: '<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h2.5l2.2 12.2a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L21 7H5.4"/>',
    heart: '<path d="M20.8 5.8a5.2 5.2 0 0 0-7.4 0L12 7.2l-1.4-1.4a5.2 5.2 0 1 0-7.4 7.4L12 21l8.8-7.8a5.2 5.2 0 0 0 0-7.4z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    check: '<path d="m4 12 5 5L20 6"/>',
    checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2-5.5-3-5.5 3 1-6.2L3 9.6l6.2-.9z"/>',
    truck: '<path d="M3 6h11v10H3zM14 9h4l3 3v4h-7z"/><circle cx="7" cy="18" r="1.6"/><circle cx="17.5" cy="18" r="1.6"/>',
    shield: '<path d="M12 3 4.5 6v6c0 4.4 3 7.6 7.5 9 4.5-1.4 7.5-4.6 7.5-9V6z"/><path d="m9 12 2 2 4-4"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 6.3"/><path d="M20 4v7h-7"/>',
    phone: '<path d="M5 3h4l2 5-2.5 1.5a12 12 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2.2 2A17 17 0 0 1 3 5.2 2 2 0 0 1 5 3z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    pin: '<path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    arrowRight: '<path d="M4 12h16M14 6l6 6-6 6"/>',
    arrowLeft: '<path d="M20 12H4M10 6l-6 6 6 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/><path d="M10 11v6M14 11v6"/>',
    filter: '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    chevronRight: '<path d="m9 6 6 6-6 6"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    chart: '<path d="M4 20V4M4 20h16"/><path d="M8 16v-4M12 16V8M16 16v-6M20 16v-2"/>',
    box: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/>',
    wallet: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/><circle cx="17" cy="14.5" r="1.2"/>',
    users: '<circle cx="9" cy="8" r="3.4"/><path d="M2.5 20c0-3.6 2.9-5.8 6.5-5.8s6.5 2.2 6.5 5.8"/><path d="M16 5.2a3.4 3.4 0 0 1 0 6.5M18 14.5c2.2.6 3.5 2.4 3.5 5.5"/>',
    tasks: '<path d="M9 5h11M9 12h11M9 19h11"/><path d="m4 5 1.2 1.2L7.5 4M4 12l1.2 1.2L7.5 11M4 19l1.2 1.2L7.5 18"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    bell: '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
    external: '<path d="M14 3h7v7M21 3l-9 9"/><path d="M19 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="m4 18 5-5 4 4 3-3 4 4"/>',
    file: '<path d="M6 2h8l4 4v16H6z"/><path d="M14 2v5h5M9 13h6M9 17h6"/>',
    edit: '<path d="M4 20h4L20 8l-4-4L4 16z"/><path d="m14 6 4 4"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    alert: '<path d="M12 3 2.5 20h19z"/><path d="M12 9v5M12 17.5v.1"/>',
    sparkles: '<path d="m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8zM5 2l.7 1.8L7.5 4.5 5.7 5.2 5 7l-.7-1.8L2.5 4.5l1.8-.7z"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3z"/>',
    dollar: '<path d="M12 2v20M17 6.5c0-2-2.2-3-5-3s-5 1-5 3.5S9.5 11 12 11.5s5 1.2 5 4-2.2 3.5-5 3.5-5-1-5-3"/>',
    percent: '<path d="M19 5 5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
    download: '<path d="M12 4v12M7 11l5 5 5-5"/><path d="M4 20h16"/>',
    printer: '<path d="M7 8V3h10v5"/><rect x="4" y="8" width="16" height="8" rx="2"/><path d="M7 16h10v5H7z"/>',
    eye: '<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    copy: '<rect x="9" y="9" width="11" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
    logout: '<path d="M9 21H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5"/><path d="M16 17l5-5-5-5M21 12H9"/>',
    play: '<path d="M8 5v14l11-7z"/>',
    activity: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.3"/>',
    gift: '<rect x="3" y="8" width="18" height="13" rx="1"/><path d="M12 8v13M3 12h18M8 8a2.5 2.5 0 1 1 0-5c2 0 4 5 4 5s2-5 4-5a2.5 2.5 0 1 1 0 5"/>',
    leaf: '<path d="M4 20C4 10 10 4 20 4c0 10-6 16-16 16z"/><path d="M4 20C8 14 12 10 18 6"/>',
    droplet: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    creditCard: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/><path d="M6 15h4"/>',
    bank: '<path d="M3 21h18M4 10h16M12 3 3 8h18zM6 10v8M10 10v8M14 10v8M18 10v8"/>',
    momo: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M7 15V9l3 3 3-3v6M17 9v6"/>',
    print: '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M6 17h12v4H6z"/>',
  };

  util.icon = function (name, size) {
    const body = icons[name] || icons.sparkles;
    return '<svg class="ic" width="' + (size || 20) + '" height="' + (size || 20) +
      '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + '</svg>';
  };

  const STAR_PATH = 'm12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2-5.5-3-5.5 3 1-6.2L3 9.6l6.2-.9z';

  util.stars = function (rating, size) {
    const r = Number(rating) || 0;
    let html = '<span class="stars" aria-label="' + fmt.pct(r, 1) + ' trên 5 sao">';
    for (let i = 1; i <= 5; i++) {
      const fill = r >= i - 0.25 ? 'currentColor' : 'none';
      html += '<svg width="' + (size || 14) + '" height="' + (size || 14) + '" viewBox="0 0 24 24" fill="' + fill +
        '" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="' + STAR_PATH + '"/></svg>';
    }
    return html + '</span>';
  };

  /* --------------------------- Meta / nhãn --------------------------- */
  const orderStatus = {
    pending:   { label: 'Chờ xác nhận', short: 'Chờ', cls: 'warn', step: 1, desc: 'Đơn mới, chưa xác nhận' },
    confirmed: { label: 'Đã xác nhận', short: 'Xác nhận', cls: 'info', step: 2, desc: 'Đã liên hệ xác nhận với khách' },
    packing:   { label: 'Đang đóng gói', short: 'Đóng gói', cls: 'blue', step: 3, desc: 'Đang chuẩn bị hàng' },
    shipping:  { label: 'Đang giao', short: 'Giao hàng', cls: 'purple', step: 4, desc: 'Đã bàn giao cho đơn vị vận chuyển' },
    completed: { label: 'Hoàn tất', short: 'Hoàn tất', cls: 'success', step: 5, desc: 'Giao thành công' },
    cancelled: { label: 'Đã huỷ', short: 'Huỷ', cls: 'danger', step: 0, desc: 'Đơn không được thực hiện' },
  };

  const paymentStatus = {
    unpaid:   { label: 'Chưa thanh toán', cls: 'warn' },
    paid:     { label: 'Đã thanh toán', cls: 'success' },
    refunded: { label: 'Đã hoàn tiền', cls: 'danger' },
  };

  const paymentMethods = {
    cod:  { label: 'Thanh toán khi nhận hàng (COD)', short: 'COD', icon: 'truck' },
    bank: { label: 'Chuyển khoản ngân hàng', short: 'Chuyển khoản', icon: 'bank' },
    card: { label: 'Thẻ ATM / Visa / Mastercard', short: 'Thẻ', icon: 'creditCard' },
    momo: { label: 'Ví MoMo / ZaloPay', short: 'Ví điện tử', icon: 'momo' },
    platform: { label: 'Thanh toán qua sàn TMĐT', short: 'Qua sàn', icon: 'wallet' },
  };

  const channels = {
    website:   { label: 'Website', short: 'Web', color: '#4F46E5', icon: 'globe' },
    shopee:    { label: 'Shopee', short: 'Shopee', color: '#EE4D2D', icon: 'cart' },
    tiktok:    { label: 'TikTok Shop', short: 'TikTok', color: '#0F172A', icon: 'play' },
    facebook:  { label: 'Facebook / Zalo', short: 'FB/Zalo', color: '#2563EB', icon: 'users' },
    event:     { label: 'Bán trực tiếp (Sân tập / CLB)', short: 'Trực tiếp', color: '#0EA5E9', icon: 'pin' },
    wholesale: { label: 'Bán sỉ CLB / Doanh nghiệp', short: 'Sỉ CLB', color: '#8B5CF6', icon: 'box' },
  };

  const taskStatus = {
    todo:  { label: 'Cần làm', color: '#64748B', cls: 'gray', pct: 0 },
    doing: { label: 'Đang làm', color: '#2563EB', cls: 'info', pct: 30 },
    review: { label: 'Chờ duyệt', color: '#F59E0B', cls: 'warn', pct: 80 },
    done:  { label: 'Hoàn thành', color: '#10B981', cls: 'success', pct: 100 },
  };

  const priority = {
    low: { label: 'Thấp', cls: 'gray', color: '#94A3B8' },
    medium: { label: 'Trung bình', cls: 'info', color: '#2563EB' },
    high: { label: 'Cao', cls: 'warn', color: '#F59E0B' },
    urgent: { label: 'Khẩn cấp', cls: 'danger', color: '#EF4444' },
  };

  const zones = {
    hn: { label: 'Hà Nội', fee: 22000 },
    hcm: { label: 'TP. Hồ Chí Minh', fee: 22000 },
    north: { label: 'Miền Bắc', fee: 30000 },
    central: { label: 'Miền Trung', fee: 35000 },
    south: { label: 'Miền Nam', fee: 30000 },
  };

  const provinces = [
    { name: 'Hà Nội', zone: 'hn' },
    { name: 'TP. Hồ Chí Minh', zone: 'hcm' },
    { name: 'Hải Phòng', zone: 'north' },
    { name: 'Quảng Ninh', zone: 'north' },
    { name: 'Bắc Ninh', zone: 'north' },
    { name: 'Nam Định', zone: 'north' },
    { name: 'Thái Nguyên', zone: 'north' },
    { name: 'Nghệ An', zone: 'central' },
    { name: 'Thanh Hoá', zone: 'central' },
    { name: 'Huế', zone: 'central' },
    { name: 'Đà Nẵng', zone: 'central' },
    { name: 'Quảng Nam', zone: 'central' },
    { name: 'Quảng Ngãi', zone: 'central' },
    { name: 'Bình Định', zone: 'central' },
    { name: 'Khánh Hoà', zone: 'central' },
    { name: 'Đắk Lắk', zone: 'central' },
    { name: 'Lâm Đồng', zone: 'central' },
    { name: 'Bình Dương', zone: 'south' },
    { name: 'Đồng Nai', zone: 'south' },
    { name: 'Bà Rịa - Vũng Tàu', zone: 'south' },
    { name: 'Long An', zone: 'south' },
    { name: 'Tiền Giang', zone: 'south' },
    { name: 'Cần Thơ', zone: 'south' },
    { name: 'An Giang', zone: 'south' },
    { name: 'Kiên Giang', zone: 'south' },
  ];

  /* ------------------------------ Toast ------------------------------ */
  function toastHost() {
    let host = document.getElementById('mt-toasts');
    if (!host) {
      host = document.createElement('div');
      host.id = 'mt-toasts';
      host.className = 'mt-toasts';
      host.setAttribute('role', 'status');
      host.setAttribute('aria-live', 'polite');
      document.body.appendChild(host);
    }
    return host;
  }

  util.toast = function (message, type, opts) {
    const options = opts || {};
    const host = toastHost();
    const node = document.createElement('div');
    node.className = 'mt-toast mt-toast--' + (type || 'info');
    const iconName = type === 'success' ? 'checkCircle' : type === 'error' ? 'alert' : type === 'cart' ? 'cart' : 'sparkles';
    node.innerHTML = '<span class="mt-toast__icon">' + util.icon(iconName, 18) + '</span>' +
      '<span class="mt-toast__text">' + esc(message) + '</span>' +
      '<button class="mt-toast__close" aria-label="Đóng">' + util.icon('close', 14) + '</button>';
    host.appendChild(node);
    requestAnimationFrame(() => node.classList.add('in'));
    const remove = () => {
      node.classList.remove('in');
      setTimeout(() => node.remove(), 260);
    };
    node.querySelector('.mt-toast__close').addEventListener('click', remove);
    setTimeout(remove, options.duration || 3800);
    return node;
  };

  /* --------------------------- Confirm box --------------------------- */
  util.confirm = function (opts) {
    const o = typeof opts === 'string' ? { message: opts } : (opts || {});
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'mt-confirm-overlay';
      overlay.innerHTML =
        '<div class="mt-confirm" role="dialog" aria-modal="true" aria-label="' + attr(o.title || 'Xác nhận') + '">' +
        '<div class="mt-confirm__icon">' + util.icon(o.danger ? 'alert' : 'checkCircle', 26) + '</div>' +
        '<h3>' + esc(o.title || 'Xác nhận thao tác') + '</h3>' +
        '<p>' + esc(o.message || 'Bạn có chắc chắn muốn tiếp tục?') + '</p>' +
        '<div class="mt-confirm__actions">' +
        '<button class="btn-plain" data-confirm="no">' + esc(o.cancelText || 'Huỷ') + '</button>' +
        '<button class="btn-solid ' + (o.danger ? 'btn-danger' : '') + '" data-confirm="yes">' + esc(o.confirmText || 'Đồng ý') + '</button>' +
        '</div></div>';
      document.body.appendChild(overlay);
      requestAnimationFrame(() => overlay.classList.add('in'));
      const done = (val) => {
        overlay.classList.remove('in');
        setTimeout(() => overlay.remove(), 200);
        document.removeEventListener('keydown', onKey);
        resolve(val);
      };
      const onKey = (e) => {
        if (e.key === 'Escape') done(false);
        if (e.key === 'Enter') done(true);
      };
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) done(false);
        const b = e.target.closest('[data-confirm]');
        if (b) done(b.dataset.confirm === 'yes');
      });
      document.addEventListener('keydown', onKey);
      setTimeout(() => overlay.querySelector('[data-confirm="yes"]').focus(), 50);
    });
  };

  util.placeholderAlt = util.placeholder;

  MT.util = util;
  MT.fmt = fmt;
  MT.icon = util.icon;
  MT.meta = { orderStatus, paymentStatus, paymentMethods, channels, taskStatus, priority, zones, provinces };
})();
