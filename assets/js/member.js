/* ==========================================================================
   MÂY TRẮNG – Member portal
   Đăng nhập bằng tài khoản admin cấp, nhận nhiệm vụ, cập nhật tiến độ,
   nộp bằng chứng văn bản/ảnh lên Supabase.
   ========================================================================== */
(function () {
  const MT = window.MT;
  const U = MT.util;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const S = {
    member: null,
    tasks: [],
    filter: 'active',
    activeTaskId: null,
    files: [],
    channel: null,
    timer: null,
    modalTimer: null,
    loading: false,
  };

  const statusMeta = (s) => MT.meta.taskStatus[s] || { label: s, cls: 'gray' };
  const priorityMeta = (p) => MT.meta.priority[p] || MT.meta.priority.medium;

  function show(view) {
    ['bootView', 'configView', 'loginView', 'portalView'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.classList.toggle('hidden', id !== view);
    });
  }

  function showLoginError(msg) {
    const el = document.getElementById('loginError');
    if (!el) return;
    let text = msg || '';
    if (/auth_user_id|column .* does not exist|schema cache/i.test(text)) {
      text = 'Cơ sở dữ liệu chưa được nâng cấp cho cổng thành viên. Quản trị viên cần chạy file supabase/migration-v2-auth-sync.sql trong SQL Editor, sau đó thử lại.';
    }
    el.textContent = text;
    el.classList.toggle('show', Boolean(text));
  }

  function isOverdue(t) {
    return t.status !== 'done' && t.dueDate && new Date(t.dueDate) < U.startOfDay(new Date());
  }

  function taskStats() {
    const list = S.tasks;
    return {
      total: list.length,
      active: list.filter((t) => t.status !== 'done').length,
      done: list.filter((t) => t.status === 'done').length,
      overdue: list.filter(isOverdue).length,
      evidence: U.sum(list, (t) => (t.evidence || []).length),
      progress: list.length ? Math.round(U.sum(list, (t) => Number(t.progress) || 0) / list.length) : 0,
    };
  }

  /* --------------------------------- Auth --------------------------------- */
  async function boot() {
    show('bootView');
    if (!MT.remote || !MT.remote.isConfigured()) { show('configView'); return; }
    try {
      await MT.remote.restoreSession();
      if (!MT.remote.isSignedIn()) { show('loginView'); return; }
      await loadMember();
    } catch (e) {
      show('loginView');
      showLoginError(e.message || String(e));
    }
  }

  async function login(email, password) {
    const btn = document.getElementById('loginSubmit');
    btn.disabled = true;
    btn.textContent = 'Đang đăng nhập…';
    showLoginError('');
    try {
      await MT.remote.signIn(email, password);
      await loadMember();
    } catch (e) {
      showLoginError(e.message || String(e));
      await MT.remote.signOut().catch(() => {});
    } finally {
      btn.disabled = false;
      btn.textContent = 'Đăng nhập';
    }
  }

  async function loadMember() {
    const member = await MT.remote.getMyMember();
    if (!member) {
      await MT.remote.signOut().catch(() => {});
      show('loginView');
      showLoginError('Tài khoản này chưa được liên kết với hồ sơ thành viên. Vui lòng liên hệ quản trị viên.');
      return;
    }
    S.member = member;
    renderHeader();
    show('portalView');
    await loadTasks();
    subscribe();
    if (S.timer) clearInterval(S.timer);
    S.timer = setInterval(() => {
      if (document.visibilityState === 'visible' && Date.now() - S.lastLoad > 30000) loadTasks(true);
    }, 30000);
  }

  async function loadTasks(silent) {
    if (!S.member || S.loading) return;
    S.loading = true;
    try {
      S.tasks = await MT.remote.memberTasks(S.member.id);
      S.lastLoad = Date.now();
      if (!S.activeTaskId) renderAll();
      renderHeader();
      $('#mpUpdated').textContent = 'Dữ liệu Supabase · cập nhật ' + U.fmt.datetime(new Date());
    } catch (e) {
      U.toast('Không tải được nhiệm vụ: ' + e.message, 'error', { duration: 5000 });
    } finally {
      S.loading = false;
    }
  }

  function subscribe() {
    if (!S.member || S.channel) return;
    try {
      MT.remote.subscribeMember(S.member.id, U.debounce(() => {
        if (document.visibilityState === 'visible') loadTasks(true);
      }, 1000)).then((ch) => {
        S.channel = ch;
        const live = document.getElementById('mpLive');
        if (live) {
          live.classList.toggle('off', !ch);
          live.textContent = ch ? 'Realtime' : 'Supabase';
        }
      }).catch(() => {});
    } catch (e) {}
  }

  /* -------------------------------- Render -------------------------------- */
  function renderHeader() {
    const m = S.member;
    if (!m) return;
    const av = document.getElementById('mpAvatar');
    av.textContent = U.initials(m.name);
    av.style.background = m.color || '#4F46E5';
    document.getElementById('mpName').textContent = m.name;
    document.getElementById('mpRole').textContent = (m.role || 'Thành viên') + ' · Mây Trắng';
    document.getElementById('mpGreeting').textContent = 'Xin chào, ' + m.name.split(' ').slice(-2).join(' ');
    document.getElementById('mpDate').textContent = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  }

  function renderAll() {
    renderStats();
    renderTasks();
    renderProfile();
    renderEvidence();
  }

  function renderStats() {
    const st = taskStats();
    const host = document.getElementById('mpStats');
    if (!host) return;
    host.innerHTML =
      '<div class="mp-stat"><span>Nhiệm vụ được giao</span><strong>' + st.total + '</strong><small>' + st.active + ' đang thực hiện</small></div>' +
      '<div class="mp-stat"><span>Đã hoàn thành</span><strong style="color:var(--db-success)">' + st.done + '</strong><small>Tiến độ TB ' + st.progress + '%</small></div>' +
      '<div class="mp-stat"><span>Quá hạn</span><strong style="color:' + (st.overdue ? 'var(--db-danger)' : 'var(--db-ink)') + '">' + st.overdue + '</strong><small>Cần xử lý sớm</small></div>' +
      '<div class="mp-stat"><span>Bằng chứng đã nộp</span><strong>' + st.evidence + '</strong><small>Ảnh và văn bản</small></div>';
  }

  function filteredTasks() {
    let list = S.tasks.slice();
    if (S.filter === 'active') list = list.filter((t) => t.status !== 'done');
    else if (S.filter === 'done') list = list.filter((t) => t.status === 'done');
    else if (S.filter === 'overdue') list = list.filter(isOverdue);
    return list.sort((a, b) => {
      if (isOverdue(a) !== isOverdue(b)) return isOverdue(a) ? -1 : 1;
      if ((a.status === 'done') !== (b.status === 'done')) return a.status === 'done' ? 1 : -1;
      return new Date(a.dueDate || 8640000000000000) - new Date(b.dueDate || 8640000000000000);
    });
  }

  function renderTasks() {
    const host = document.getElementById('mpTasks');
    if (!host) return;
    const list = filteredTasks();
    const st = taskStats();
    const count = document.getElementById('mpTaskCount');
    if (count) count.textContent = list.length + ' nhiệm vụ · ' + st.active + ' đang mở';
    if (!list.length) {
      host.innerHTML = '<div class="mp-empty">' + MT.icon('checkCircle', 28) + '<div>' +
        (S.filter === 'active' ? 'Bạn đã hoàn thành tất cả nhiệm vụ được giao.' : 'Không có nhiệm vụ trong mục này.') +
        '</div></div>';
      return;
    }
    host.innerHTML = list.map((t) => {
      const stMeta = statusMeta(t.status);
      const pm = priorityMeta(t.priority);
      return '<article class="mp-task ' + (t.status === 'done' ? 'mp-task--done' : '') + '" data-task-id="' + U.esc(t.id) + '" data-priority="' + U.esc(t.priority) + '" tabindex="0">' +
        '<div class="mp-task__top"><span class="mp-task__code">' + U.esc(t.code) + '</span>' +
          '<span class="badge badge-' + stMeta.cls + '">' + stMeta.label + '</span>' +
          '<span class="priority ' + t.priority + '"><span class="dot"></span>' + pm.label + '</span>' +
          (isOverdue(t) ? '<span class="badge badge-danger">Quá hạn</span>' : '') +
        '</div>' +
        '<h3>' + U.esc(t.title) + '</h3>' +
        '<div class="mp-task__meta">' +
          '<span>' + MT.icon('calendar', 11) + ' ' + (t.dueDate ? U.fmt.date(t.dueDate) : 'Không hạn') + '</span>' +
          '<span>' + MT.icon('clock', 11) + ' ' + (t.estimateHours || 0) + ' giờ</span>' +
          '<span>' + MT.icon('image', 11) + ' ' + (t.evidence || []).length + ' bằng chứng</span>' +
        '</div>' +
        '<div class="mp-task__foot">' + '<div class="progress progress--' + (t.status === 'done' ? 'success' : isOverdue(t) ? 'warn' : '') + '" style="flex:1"><span style="width:' + Math.max(0, Math.min(100, Number(t.progress) || 0)) + '%"></span></div><strong>' + (t.progress || 0) + '%</strong>' +
          '<button class="btn btn-sm btn-soft" type="button" data-report="' + U.esc(t.id) + '">' + MT.icon('upload', 12) + ' Báo cáo</button>' +
        '</div>' +
      '</article>';
    }).join('');
    $$('[data-task-id]', host).forEach((el) => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('[data-report]')) { openTask(el.dataset.taskId); return; }
        openTask(el.dataset.taskId);
      });
      el.addEventListener('keydown', (e) => { if (e.key === 'Enter') openTask(el.dataset.taskId); });
    });
  }

  function renderProfile() {
    const m = S.member;
    const host = document.getElementById('mpProfile');
    if (!host || !m) return;
    host.innerHTML =
      '<span class="avatar avatar--xl" style="background:' + (m.color || '#4F46E5') + ';margin:0 auto">' + U.initials(m.name) + '</span>' +
      '<h2>' + U.esc(m.name) + '</h2><p>' + U.esc(m.role || '') + '</p>' +
      '<div class="mp-profile__rows">' +
        '<div class="mp-profile__row"><span>Email</span><strong>' + U.esc(m.email || '—') + '</strong></div>' +
        '<div class="mp-profile__row"><span>Điện thoại</span><strong>' + U.esc(m.phone || '—') + '</strong></div>' +
        '<div class="mp-profile__row"><span>Cổ phần</span><strong>' + U.fmt.pct(m.equityPct || 0) + '</strong></div>' +
        '<div class="mp-profile__row"><span>Cam kết</span><strong>' + (m.weeklyHours || 0) + ' giờ/tuần</strong></div>' +
        (m.kpiTarget ? '<div class="mp-profile__row"><span>Mục tiêu</span><strong>' + U.fmt.money(m.kpiTarget) + '</strong></div>' : '') +
        '<div class="mp-profile__row"><span>Trạng thái</span><strong>' + (m.status === 'active' ? 'Đang hoạt động' : m.status === 'probation' ? 'Thử việc' : 'Tạm nghỉ') + '</strong></div>' +
      '</div>' +
      ((m.skills || []).length ? '<div style="margin-top:.6rem;display:flex;gap:.25rem;flex-wrap:wrap">' + m.skills.map((s) => '<span class="tag">' + U.esc(s) + '</span>').join('') + '</div>' : '');
  }

  function flattenEvidence() {
    const out = [];
    S.tasks.forEach((t) => (t.evidence || []).forEach((e) => out.push(Object.assign({}, e, { task: t }))));
    return out.sort((a, b) => new Date(b.at) - new Date(a.at));
  }

  function renderEvidence() {
    const host = document.getElementById('mpEvidence');
    if (!host) return;
    const list = flattenEvidence();
    const count = document.getElementById('mpEvidenceCount');
    if (count) count.textContent = list.length + ' mục';
    if (!list.length) {
      host.innerHTML = '<div class="mp-empty">' + MT.icon('image', 26) + '<div>Chưa có bằng chứng nào. Mở một nhiệm vụ để báo cáo kết quả.</div></div>';
      return;
    }
    host.innerHTML = '<div class="mp-evidence">' + list.slice(0, 8).map((e) =>
      '<div class="mp-evidence__item"><div class="mp-evidence__head"><strong>' + U.esc(e.task.code) + '</strong><span>' + U.fmt.ago(e.at) + '</span></div>' +
      (e.type === 'image' && e.url ? '<img src="' + U.esc(e.url) + '" alt="Bằng chứng" data-lightbox="' + U.esc(e.url) + '" loading="lazy">' : '<p>' + U.esc(e.text || '') + '</p>') +
      '<div style="font-size:.6rem;color:var(--db-muted);margin-top:.2rem">' + U.esc(e.task.title) + '</div></div>'
    ).join('') + '</div>';
    $$('[data-lightbox]', host).forEach((img) => img.addEventListener('click', () => lightbox(img.dataset.lightbox)));
  }

  /* -------------------------------- Modal --------------------------------- */
  function closeModal() {
    const root = document.getElementById('memberModalRoot');
    const overlay = $('.mp-overlay', root);
    if (!overlay) return;
    overlay.classList.remove('open');
    if (S.modalTimer) clearTimeout(S.modalTimer);
    S.modalTimer = setTimeout(() => { root.innerHTML = ''; S.modalTimer = null; }, 200);
    S.activeTaskId = null;
    S.files = [];
  }

  function openTask(id) {
    const task = S.tasks.find((t) => t.id === id);
    if (!task) return;
    if (S.modalTimer) { clearTimeout(S.modalTimer); S.modalTimer = null; }
    S.activeTaskId = id;
    S.files = [];
    const stMeta = statusMeta(task.status);
    const pm = priorityMeta(task.priority);
    const activity = (task.activity || []).slice().reverse().slice(0, 8);
    const evidence = (task.evidence || []).slice().sort((a, b) => new Date(b.at) - new Date(a.at));
    const root = document.getElementById('memberModalRoot');
    root.innerHTML =
      '<div class="mp-overlay" role="dialog" aria-modal="true" aria-label="Chi tiết nhiệm vụ">' +
        '<div class="mp-modal">' +
          '<div class="mp-modal__head"><h2>Chi tiết nhiệm vụ</h2><button class="btn btn-sm btn-icon" type="button" data-mp-close aria-label="Đóng">' + MT.icon('close', 16) + '</button></div>' +
          '<div class="mp-modal__body">' +
            '<div class="mp-section"><div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:.4rem">' +
              '<span class="mp-task__code">' + U.esc(task.code) + '</span><span class="badge badge-' + stMeta.cls + '">' + stMeta.label + '</span>' +
              '<span class="priority ' + task.priority + '"><span class="dot"></span>' + pm.label + '</span>' +
              (isOverdue(task) ? '<span class="badge badge-danger">Quá hạn</span>' : '') + '</div>' +
              '<h2 style="font-size:1rem;line-height:1.4;margin-bottom:.5rem">' + U.esc(task.title) + '</h2>' +
              '<div class="mp-meta"><div><span>Hạn hoàn thành</span><strong>' + (task.dueDate ? U.fmt.date(task.dueDate) : 'Không hạn') + '</strong></div>' +
              '<div><span>Ước tính</span><strong>' + (task.estimateHours || 0) + ' giờ</strong></div>' +
              '<div><span>Bằng chứng</span><strong>' + evidence.length + ' mục</strong></div>' +
              '<div><span>Cập nhật</span><strong>' + U.fmt.datetime(task.updatedAt || task.createdAt) + '</strong></div></div>' +
            '</div>' +
            '<div class="mp-section"><h4>Mô tả công việc</h4><div class="mp-desc">' + (task.desc ? U.esc(task.desc) : '<span class="text-muted">Chưa có mô tả.</span>') + '</div>' +
              ((task.tags || []).length ? '<div style="margin-top:.5rem;display:flex;gap:.25rem;flex-wrap:wrap">' + task.tags.map((x) => '<span class="tag">' + U.esc(x) + '</span>').join('') + '</div>' : '') +
            '</div>' +
            '<div class="mp-section"><h4>Tiến độ của bạn</h4>' +
              '<div style="display:flex;align-items:center;gap:.6rem"><div class="progress" style="flex:1"><span id="mpProgressFill" style="width:' + (task.progress || 0) + '%"></span></div><strong id="mpProgressText" style="font-size:.8rem">' + (task.progress || 0) + '%</strong></div>' +
              '<input class="mp-range" type="range" id="mpProgressRange" min="0" max="100" step="5" value="' + (task.progress || 0) + '">' +
              '<div class="mp-status-row">' + ['todo', 'doing', 'review', 'done'].map((s) =>
                '<button class="btn btn-sm ' + (task.status === s ? 'btn-primary' : '') + '" type="button" data-mp-status="' + s + '">' + statusMeta(s).label + '</button>').join('') +
              '</div>' +
              '<button class="btn btn-sm btn-soft" type="button" id="mpSaveProgress" style="margin-top:.55rem">' + MT.icon('check', 12) + ' Cập nhật tiến độ</button>' +
            '</div>' +
            '<div class="mp-section"><h4>Báo cáo bằng chứng</h4>' +
              '<textarea class="textarea" id="mpEvidenceText" rows="3" placeholder="Mô tả kết quả, số liệu, phản hồi khách hàng…"></textarea>' +
              '<div class="mp-upload" id="mpDropzone">' + MT.icon('upload', 20) + '<div>Kéo thả ảnh hoặc <strong>bấm để chọn ảnh</strong></div><div style="font-size:.6rem;margin-top:.1rem">Ảnh được nén và tải lên Supabase Storage</div></div>' +
              '<input type="file" id="mpFiles" accept="image/*" multiple style="display:none">' +
              '<div class="mp-thumbs" id="mpThumbs"></div>' +
              '<button class="btn btn-primary btn-sm" type="button" id="mpSubmitEvidence" style="margin-top:.55rem">' + MT.icon('upload', 12) + ' Gửi báo cáo</button>' +
            '</div>' +
            '<div class="mp-section"><h4>Bằng chứng đã nộp (' + evidence.length + ')</h4>' +
              (evidence.length ? '<div class="mp-evidence">' + evidence.map((e) =>
                '<div class="mp-evidence__item"><div class="mp-evidence__head"><strong>' + U.esc(e.by ? 'Thành viên' : 'Hệ thống') + '</strong><span>' + U.fmt.datetime(e.at) + '</span></div>' +
                (e.text ? '<p>' + U.esc(e.text) + '</p>' : '') +
                (e.type === 'image' && e.url ? '<img src="' + U.esc(e.url) + '" alt="Bằng chứng" data-lightbox="' + U.esc(e.url) + '" loading="lazy">' : '<p>' + U.esc(e.text || '') + '</p>') +
                '</div>').join('') + '</div>' : '<div class="mp-empty" style="padding:1rem">Chưa có bằng chứng.</div>') +
            '</div>' +
            (activity.length ? '<div class="mp-section"><h4>Lịch sử hoạt động</h4>' +
              activity.map((a) => '<div style="display:flex;gap:.45rem;padding:.3rem 0;font-size:.7rem"><span style="color:var(--db-muted);white-space:nowrap">' + U.fmt.dateShort(a.at) + '</span><span>' + U.esc(a.text) + '</span></div>').join('') +
            '</div>' : '') +
          '</div>' +
          '<div class="mp-modal__foot"><button class="btn" type="button" data-mp-close>Đóng</button></div>' +
        '</div>' +
      '</div>';
    const overlay = $('.mp-overlay', root);
    requestAnimationFrame(() => overlay.classList.add('open'));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target.closest('[data-mp-close]')) closeModal();
    });
    $$('[data-lightbox]', root).forEach((img) => img.addEventListener('click', () => lightbox(img.dataset.lightbox)));

    const range = document.getElementById('mpProgressRange');
    range.addEventListener('input', () => {
      document.getElementById('mpProgressFill').style.width = range.value + '%';
      document.getElementById('mpProgressText').textContent = range.value + '%';
    });
    $$('[data-mp-status]', root).forEach((btn) => btn.addEventListener('click', () => updateTask(task, btn.dataset.mpStatus, btn.dataset.mpStatus === 'done' ? 100 : Number(range.value))));
    document.getElementById('mpSaveProgress').addEventListener('click', () => updateTask(task, null, Number(range.value)));

    const drop = document.getElementById('mpDropzone');
    const fileInput = document.getElementById('mpFiles');
    const thumbs = document.getElementById('mpThumbs');
    const renderThumbs = () => {
      thumbs.innerHTML = S.files.map((f, i) =>
        '<div class="thumb"><img src="' + f.url + '" alt=""><button type="button" data-rm="' + i + '">' + MT.icon('close', 10) + '</button></div>').join('');
      $$('[data-rm]', thumbs).forEach((b) => b.addEventListener('click', () => { S.files.splice(Number(b.dataset.rm), 1); renderThumbs(); }));
    };
    const addFiles = async (files) => {
      for (const file of Array.from(files || [])) {
        if (!file.type.startsWith('image/')) { U.toast('Chỉ hỗ trợ file ảnh', 'error'); continue; }
        if (file.size > MT.config.limits.evidenceFileMaxMB * 1024 * 1024) { U.toast('Ảnh quá lớn: ' + file.name, 'error'); continue; }
        try {
          const url = await U.compressImage(file);
          S.files.push({ url, name: file.name });
          renderThumbs();
        } catch (e) { U.toast('Không đọc được ảnh ' + file.name, 'error'); }
      }
    };
    drop.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => { addFiles(fileInput.files); fileInput.value = ''; });
    drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('dragover'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('dragover'));
    drop.addEventListener('drop', (e) => { e.preventDefault(); drop.classList.remove('dragover'); addFiles(e.dataTransfer.files); });

    document.getElementById('mpSubmitEvidence').addEventListener('click', async () => {
      const text = document.getElementById('mpEvidenceText').value.trim();
      if (!text && !S.files.length) { U.toast('Nhập nội dung hoặc chọn ảnh trước khi gửi', 'error'); return; }
      const btn = document.getElementById('mpSubmitEvidence');
      btn.disabled = true;
      btn.textContent = 'Đang gửi…';
      try {
        if (text) await MT.remote.memberAddTextEvidence(task.id, text, S.member.id);
        for (const f of S.files) await MT.remote.memberAddImageEvidence(task.id, f.url, f.name, S.member.id);
        U.toast('Đã gửi báo cáo thành công', 'success');
        closeModal();
        await loadTasks();
        openTask(task.id);
      } catch (e) {
        U.toast('Chưa gửi được: ' + e.message, 'error', { duration: 6000 });
        btn.disabled = false;
        btn.textContent = 'Gửi báo cáo';
      }
    });
  }

  async function updateTask(task, status, progress) {
    try {
      await MT.remote.memberUpdateTask(task.id, { status: status || null, progress });
      U.toast('Đã cập nhật nhiệm vụ', 'success');
      closeModal();
      await loadTasks();
      openTask(task.id);
    } catch (e) {
      U.toast('Không cập nhật được: ' + e.message, 'error', { duration: 6000 });
    }
  }

  function lightbox(src) {
    const el = document.createElement('div');
    el.className = 'mp-lightbox';
    el.innerHTML = '<img src="' + U.esc(src) + '" alt="Bằng chứng"><button type="button" style="position:absolute;top:1rem;right:1rem;width:38px;height:38px;border-radius:50%;border:none;background:rgba(255,255,255,.15);color:#fff;display:grid;place-items:center">' + MT.icon('close', 20) + '</button>';
    document.body.appendChild(el);
    const close = () => el.remove();
    el.addEventListener('click', (e) => { if (e.target === el || e.target.closest('button')) close(); });
    const onKey = (e) => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey); } };
    document.addEventListener('keydown', onKey);
  }

  /* -------------------------------- Events -------------------------------- */
  function bind() {
    document.getElementById('loginForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const pass = document.getElementById('loginPassword').value;
      if (!email || !pass) { showLoginError('Vui lòng nhập email và mật khẩu.'); return; }
      login(email, pass);
    });
    document.getElementById('logoutBtn').addEventListener('click', async () => {
      await MT.remote.signOut().catch(() => {});
      S.member = null;
      S.tasks = [];
      if (S.channel) { try { S.channel.unsubscribe(); } catch (e) {} S.channel = null; }
      if (S.timer) clearInterval(S.timer);
      show('loginView');
      showLoginError('');
      U.toast('Đã đăng xuất', 'success');
    });
    document.getElementById('mpFilter').addEventListener('change', (e) => {
      S.filter = e.target.value;
      renderTasks();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && S.activeTaskId) closeModal(); });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && S.member && Date.now() - S.lastLoad > 20000) loadTasks(true);
    });
  }

  bind();
  boot();
})();