/* ==========================================================================
   MÂY TRẮNG – Dashboard: Thành viên, giao việc, bằng chứng, cổng thành viên
   ========================================================================== */
(function () {
  const MT = window.MT;
  const D = MT.dash;
  const U = MT.util;

  const T = (D.team = D.team || {
    taskView: 'board',
    filterAssignee: 'all',
    filterPriority: 'all',
    filterStatus: 'all',
    search: '',
    workspaceMember: '',
  });
  let workspaceFiles = [];

  const STATUSES = ['todo', 'doing', 'review', 'done'];
  const orderMeta = (s) => MT.meta.taskStatus[s] || { label: s, color: '#64748B', pct: 0 };

  function memberStats(id) { return MT.db.members.stats(id); }
  function totalEquity(excludeId) {
    return U.sum(MT.db.data.members.filter((m) => m.id !== excludeId), (m) => Number(m.equityPct) || 0);
  }

  /* ================================ MEMBERS ================================ */
  D.openMemberForm = function (id) {
    const m = id ? MT.db.members.get(id) : null;
    const isNew = !m;
    const body =
      '<div class="form-section"><div class="form-section__title">Thông tin thành viên</div>' +
        '<div class="field"><label>Họ và tên <span class="req">*</span></label><input class="input" id="mfName" value="' + U.esc(m ? m.name : '') + '" placeholder="Nguyễn Văn A"><span class="field-error">Vui lòng nhập họ tên.</span></div>' +
        '<div class="field-row"><div class="field"><label>Vai trò <span class="req">*</span></label><input class="input" id="mfRole" value="' + U.esc(m ? m.role : '') + '" placeholder="Nhân viên bán hàng"><span class="field-error">Vui lòng nhập vai trò.</span></div>' +
        '<div class="field"><label>Trạng thái</label><select class="select" id="mfStatus">' +
          [['active', 'Đang hoạt động'], ['probation', 'Thử việc'], ['leave', 'Tạm nghỉ']].map(([v, l]) => '<option value="' + v + '" ' + (m && m.status === v ? 'selected' : '') + '>' + l + '</option>').join('') +
        '</select></div></div>' +
        '<div class="field-row"><div class="field"><label>Email</label><input class="input" id="mfEmail" type="email" value="' + U.esc(m ? m.email : '') + '" placeholder="ten@maytrang.vn"><span class="field-error">Email không hợp lệ hoặc đã được dùng.</span></div>' +
        '<div class="field"><label>Số điện thoại</label><input class="input" id="mfPhone" value="' + U.esc(m ? m.phone : '') + '" placeholder="09xx xxx xxx"></div></div>' +
      '</div>' +
      '<div class="form-section"><div class="form-section__title">Cam kết &amp; KPI</div>' +
        '<div class="field-row field-row--3">' +
          '<div class="field"><label>Vốn góp / cổ phần (%)</label><input class="input" id="mfEquity" type="number" min="0" max="100" step="0.25" value="' + (m ? m.equityPct : 0) + '"><span class="field-error">Tổng cổ phần không được vượt 100%.</span></div>' +
          '<div class="field"><label>Giờ cam kết / tuần</label><input class="input" id="mfHours" type="number" min="0" max="80" step="1" value="' + (m ? m.weeklyHours : 12) + '"></div>' +
          '<div class="field"><label>Mục tiêu doanh thu</label><input class="input" id="mfKpi" type="number" min="0" step="1000000" value="' + (m ? m.kpiTarget : 0) + '"></div>' +
        '</div>' +
        '<div class="field"><label>Kỹ năng (phân cách bằng dấu phẩy)</label><input class="input" id="mfSkills" value="' + U.esc(m ? (m.skills || []).join(', ') : '') + '" placeholder="Bán hàng, Content, Kế toán"></div>' +
        '<div class="field"><label>Ghi chú</label><textarea class="textarea" id="mfNote" rows="2">' + U.esc(m ? m.note : '') + '</textarea></div>' +
        '<div class="field"><label>Màu nhận diện</label><div style="display:flex;gap:.4rem;flex-wrap:wrap" id="mfColors">' +
          ['#4F46E5', '#0EA5E9', '#D99AA6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'].map((c) =>
            '<button type="button" class="avatar" data-color="' + c + '" style="background:' + c + ';width:26px;height:26px;border:none;outline:' + (m && m.color === c ? '2px solid #1E293B' : 'none') + ';outline-offset:2px" aria-label="Màu ' + c + '"></button>').join('') +
        '</div><input type="hidden" id="mfColor" value="' + U.esc(m ? m.color : '#4F46E5') + '"></div>' +
      '</div>' +
      '<p style="font-size:.68rem;color:var(--db-muted);background:var(--db-line-soft);border-radius:8px;padding:.5rem .6rem">Cổ phần còn lại (quỹ dự phòng): <strong>' + U.fmt.pct(Math.max(0, 100 - totalEquity(id))) + '</strong></p>';

    D.modal({
      title: isNew ? 'Thêm thành viên' : 'Chỉnh sửa thành viên',
      size: 'lg',
      body,
      footer: '<button class="btn" type="button" data-modal-close>Huỷ</button><button class="btn btn-primary" type="button" id="mfSubmit">' + (isNew ? 'Thêm thành viên' : 'Lưu thay đổi') + '</button>',
      onMount(el, close) {
        let color = m ? m.color : '#4F46E5';
        el.querySelectorAll('[data-color]').forEach((b) => b.addEventListener('click', () => {
          color = b.dataset.color;
          el.querySelector('#mfColor').value = color;
          el.querySelectorAll('[data-color]').forEach((x) => { x.style.outline = 'none'; });
          b.style.outline = '2px solid #1E293B';
          b.style.outlineOffset = '2px';
        }));
        el.querySelector('#mfSubmit').addEventListener('click', () => {
          const name = el.querySelector('#mfName');
          const role = el.querySelector('#mfRole');
          const email = el.querySelector('#mfEmail');
          let ok = true;
          [name, role, email].forEach((inp) => inp.closest('.field').classList.remove('invalid'));
          if (name.value.trim().length < 2) { name.closest('.field').classList.add('invalid'); ok = false; }
          if (!role.value.trim()) { role.closest('.field').classList.add('invalid'); ok = false; }
          const emailVal = email.value.trim().toLowerCase();
          if (emailVal && (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailVal) || MT.db.data.members.some((x) => x.id !== id && x.email && x.email.toLowerCase() === emailVal))) {
            email.closest('.field').classList.add('invalid'); ok = false;
          }
          const equity = Number(el.querySelector('#mfEquity').value) || 0;
          if (equity < 0 || equity > 100 || totalEquity(id) + equity > 100) {
            el.querySelector('#mfEquity').closest('.field').classList.add('invalid'); ok = false;
            D.toast('Tổng cổ phần vượt 100%. Còn lại ' + U.fmt.pct(Math.max(0, 100 - totalEquity(id))) + '.', 'error');
          }
          if (!ok) return;
          const data = {
            name: name.value.trim(), role: role.value.trim(), email: emailVal,
            phone: el.querySelector('#mfPhone').value.trim(),
            status: el.querySelector('#mfStatus').value,
            equityPct: equity,
            weeklyHours: Number(el.querySelector('#mfHours').value) || 0,
            kpiTarget: Number(el.querySelector('#mfKpi').value) || 0,
            skills: el.querySelector('#mfSkills').value.split(',').map((s) => s.trim()).filter(Boolean),
            note: el.querySelector('#mfNote').value.trim(),
            color,
          };
          try {
            MT.db.members.save(id || null, data);
            D.toast(isNew ? 'Đã thêm thành viên' : 'Đã cập nhật thành viên', 'success');
            close();
            D.refresh();
          } catch (e) { D.toast(e.message, 'error'); }
        });
      },
    });
  };

  async function removeMember(id) {
    const m = MT.db.members.get(id);
    if (!m) return;
    const tasks = MT.db.data.tasks.filter((t) => t.assigneeId === id && t.status !== 'done');
    const ok = await D.confirm({
      title: 'Xoá thành viên ' + m.name + '?',
      message: 'Thành viên sẽ bị xoá khỏi nhóm. Toàn bộ nhiệm vụ đang giao sẽ chuyển về “Chưa phân công”; lịch sử bằng chứng vẫn được giữ lại.',
      confirmText: 'Xoá thành viên', danger: true,
    });
    if (!ok) return;
    MT.db.members.remove(id);
    D.toast('Đã xoá thành viên', 'success');
    D.refresh();
  }

  D.register('members', {
    title: 'Thành viên đội ngũ',
    crumb: 'Mây Trắng · Đội ngũ',
    noRange: true,
    render() {
      const members = MT.db.data.members;
      const totalEq = U.sum(members, (m) => m.equityPct || 0);
      const active = members.filter((m) => m.status === 'active').length;
      const openTasks = (MT.db.data.tasks || []).filter((t) => t.status !== 'done').length;
      const hours = U.sum(members, (m) => m.weeklyHours || 0);
      return '' +
        '<div class="stat-strip">' +
          '<div class="stat"><span>Thành viên</span><strong>' + members.length + ' <small>người</small></strong></div>' +
          '<div class="stat"><span>Đang hoạt động</span><strong style="color:var(--db-success)">' + active + '</strong><span style="margin-top:.15rem">' + (members.length - active) + ' nghỉ / thử việc</span></div>' +
          '<div class="stat"><span>Cổ phần đã phân bổ</span><strong>' + U.fmt.pct(totalEq) + '</strong><span style="margin-top:.15rem">Quỹ dự phòng ' + U.fmt.pct(Math.max(0, 100 - totalEq)) + '</span></div>' +
          '<div class="stat"><span>Cam kết mỗi tuần</span><strong>' + hours + ' <small>giờ</small></strong><span style="margin-top:.15rem">' + openTasks + ' nhiệm vụ đang mở</span></div>' +
        '</div>' +
        (totalEq > 100 ? '<div class="alert-banner alert-banner--danger">' + D.icon('alert', 16) + '<div>Tổng cổ phần đang vượt 100%. Vui lòng điều chỉnh lại tỷ lệ các thành viên.</div></div>' : '') +
        '<div class="card" style="margin-bottom:1rem"><div class="card__head"><div><div class="card__title">Đội ngũ Mây Trắng</div><div class="card__sub">Hồ sơ, cổ phần và hiệu suất công việc</div></div>' +
          '<button class="btn btn-primary btn-sm" type="button" id="addMember">' + D.icon('plus', 14) + ' Thêm thành viên</button></div>' +
          '<div class="card__body"><div class="member-grid">' + members.map((m) => {
            const st = memberStats(m.id);
            return '<div class="member-card">' +
              '<div class="member-card__top">' + D.avatar(m, 'lg') +
                '<div class="member-card__meta"><h3>' + U.esc(m.name) + '</h3><p>' + U.esc(m.role) + '</p>' +
                '<div class="member-card__badges"><span class="badge badge-' + (m.status === 'active' ? 'success' : m.status === 'probation' ? 'warn' : 'gray') + '">' + (m.status === 'active' ? 'Đang hoạt động' : m.status === 'probation' ? 'Thử việc' : 'Tạm nghỉ') + '</span>' +
                '<span class="badge badge-purple no-dot">' + U.fmt.pct(m.equityPct || 0) + ' cổ phần</span></div></div>' +
                '<div class="member-card__actions"><button class="btn btn-xs btn-icon" type="button" data-edit-member="' + m.id + '" title="Sửa">' + D.icon('edit', 12) + '</button>' +
                '<button class="btn btn-xs btn-icon" type="button" data-delete-member="' + m.id + '" title="Xoá">' + D.icon('trash', 12) + '</button></div></div>' +
              '<div style="font-size:.68rem;color:var(--db-muted);margin-top:.6rem;display:flex;flex-direction:column;gap:.1rem">' +
                '<span>' + D.icon('mail', 11) + ' ' + U.esc(m.email || '—') + '</span><span>' + D.icon('phone', 11) + ' ' + U.esc(m.phone || '—') + '</span></div>' +
              '<div class="member-card__stats"><div><strong>' + st.total + '</strong><span>Nhiệm vụ</span></div><div><strong style="color:var(--db-success)">' + st.done + '</strong><span>Hoàn thành</span></div><div><strong style="color:' + (st.overdue ? 'var(--db-danger)' : 'var(--db-ink)') + '">' + st.active + '</strong><span>Đang mở</span></div></div>' +
              '<div class="member-card__progress"><div class="progress-row"><span>Tiến độ</span>' + D.progress(st.progress, st.overdue ? 'warn' : 'success') + '<strong>' + st.progress + '%</strong></div></div>' +
              '<div class="member-card__footer"><span>' + m.weeklyHours + ' giờ/tuần · đúng hạn ' + st.onTimeRate + '%</span>' +
                '<button class="btn btn-xs" type="button" data-member-tasks="' + m.id + '">Xem việc ' + D.icon('chevronRight', 11) + '</button></div>' +
            '</div>';
          }).join('') + '</div></div></div>';
    },
    mount() {
      document.getElementById('addMember').addEventListener('click', () => D.openMemberForm());
      document.querySelectorAll('[data-edit-member]').forEach((b) => b.addEventListener('click', () => D.openMemberForm(b.dataset.editMember)));
      document.querySelectorAll('[data-delete-member]').forEach((b) => b.addEventListener('click', () => removeMember(b.dataset.deleteMember)));
      document.querySelectorAll('[data-member-tasks]').forEach((b) => b.addEventListener('click', () => {
        T.filterAssignee = b.dataset.memberTasks;
        T.filterStatus = 'all';
        D.go('tasks');
      }));
    },
  });

  /* ================================= TASKS ================================ */
  function filteredTasks() {
    let list = (MT.db.data.tasks || []).slice();
    if (T.filterAssignee !== 'all') list = list.filter((t) => t.assigneeId === T.filterAssignee);
    if (T.filterPriority !== 'all') list = list.filter((t) => t.priority === T.filterPriority);
    if (T.filterStatus !== 'all') list = list.filter((t) => t.status === T.filterStatus);
    if (T.search) {
      const q = U.normalize(T.search);
      list = list.filter((t) => U.normalize(t.title + ' ' + t.code + ' ' + (t.desc || '') + ' ' + (t.tags || []).join(' ')).includes(q));
    }
    return list.sort((a, b) => {
      const ao = a.status === 'done' ? 1 : 0, bo = b.status === 'done' ? 1 : 0;
      if (ao !== bo) return ao - bo;
      return new Date(a.dueDate || 8640000000000000) - new Date(b.dueDate || 8640000000000000);
    });
  }

  function dueLabel(t) {
    if (!t.dueDate) return '<span style="color:var(--db-muted)">Không hạn</span>';
    const overdue = t.status !== 'done' && new Date(t.dueDate) < U.startOfDay(new Date());
    return '<span class="task-card__due ' + (overdue ? 'overdue' : '') + '">' + D.icon('calendar', 11) + ' ' + U.fmt.dateShort(t.dueDate) + (overdue ? ' · quá hạn' : '') + '</span>';
  }

  function taskCard(t) {
    const m = D.member(t.assigneeId);
    const st = orderMeta(t.status);
    return '<div class="task-card" draggable="true" data-task-id="' + t.id + '" data-priority="' + t.priority + '" tabindex="0">' +
      '<div class="task-card__top"><span class="task-card__code">' + U.esc(t.code) + '</span>' + D.priority(t.priority) + '</div>' +
      '<div class="task-card__title">' + U.esc(t.title) + '</div>' +
      '<div class="task-card__meta">' + (t.assigneeId ? D.avatar(m, 'sm') + '<span>' + U.esc(m.name.split(' ').slice(-2).join(' ')) + '</span>' : '<span style="color:var(--db-muted)">Chưa phân công</span>') +
        '<span style="margin-left:auto">' + dueLabel(t) + '</span></div>' +
      '<div class="task-card__foot">' + D.progress(t.progress, t.status === 'done' ? 'success' : '') + '<strong>' + t.progress + '%</strong></div>' +
      '<div class="task-card__tags">' + (t.tags || []).slice(0, 2).map((x) => '<span class="tag">' + U.esc(x) + '</span>').join('') +
        '<span class="task-card__evidence" style="margin-left:auto">' + D.icon('image', 11) + ' ' + (t.evidence || []).length + '</span></div>' +
      '<div style="display:none">' + st.label + '</div></div>';
  }

  function tasksContentHtml() {
    if (T.taskView === 'list') {
      const list = filteredTasks();
      return '<div class="table-wrap"><table><thead><tr><th>Nhiệm vụ</th><th>Phụ trách</th><th>Ưu tiên</th><th>Hạn</th><th style="width:150px">Tiến độ</th><th>Trạng thái</th><th class="num">Bằng chứng</th><th></th></tr></thead><tbody>' +
        (list.length ? list.map((t) => {
          const m = D.member(t.assigneeId);
          const overdue = t.status !== 'done' && t.dueDate && new Date(t.dueDate) < U.startOfDay(new Date());
          return '<tr class="clickable" data-task-id="' + t.id + '"><td><strong>' + U.esc(t.title) + '</strong><div style="font-size:.62rem;color:var(--db-muted)">' + U.esc(t.code) + ' · ' + (t.tags || []).slice(0, 2).map(U.esc).join(', ') + '</div></td>' +
            '<td><div class="table-user">' + D.avatar(m, 'sm') + '<div><strong>' + U.esc(m.name) + '</strong><span>' + U.esc(m.role) + '</span></div></div></td>' +
            '<td>' + D.priority(t.priority) + '</td><td class="' + (overdue ? 'text-danger' : '') + '">' + (t.dueDate ? U.fmt.date(t.dueDate) : '—') + '</td>' +
            '<td><div class="progress-row">' + D.progress(t.progress, t.status === 'done' ? 'success' : '') + '<strong>' + t.progress + '%</strong></div></td>' +
            '<td>' + '<span class="badge badge-' + orderMeta(t.status).cls + '">' + orderMeta(t.status).label + '</span>' + '</td>' +
            '<td class="num">' + (t.evidence || []).length + '</td><td><button class="btn btn-sm btn-icon" type="button" data-open-task="' + t.id + '">' + D.icon('eye', 13) + '</button></td></tr>';
        }).join('') : '<tr><td colspan="8"><div class="empty-state">' + D.icon('tasks', 30) + '<h3>Không có nhiệm vụ</h3><p>Thử đổi bộ lọc hoặc tạo nhiệm vụ mới.</p></div></td></tr>') +
        '</tbody></table></div>';
    }
    const list = filteredTasks();
    return '<div class="kanban-board" id="kanbanBoard">' + STATUSES.map((st) => {
      const meta = orderMeta(st);
      const items = list.filter((t) => t.status === st);
      return '<div class="kanban-col" data-status="' + st + '"><div class="kanban-col__head"><span class="dot" style="background:' + meta.color + '"></span><strong>' + meta.label + '</strong><span class="kanban-col__count">' + items.length + '</span>' +
        '<button class="kanban-col__add" type="button" data-add-task="' + st + '" title="Thêm nhiệm vụ">' + D.icon('plus', 14) + '</button></div>' +
        '<div class="kanban-cards">' + (items.length ? items.map(taskCard).join('') : '<div style="border:1px dashed var(--db-line);border-radius:9px;padding:1rem;text-align:center;font-size:.68rem;color:var(--db-muted)">Kéo thẻ vào đây</div>') + '</div></div>';
    }).join('') + '</div>';
  }

  function bindTaskContent(root) {
    root.querySelectorAll('[data-task-id][draggable]').forEach((card) => {
      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', card.dataset.taskId);
        e.dataTransfer.effectAllowed = 'move';
        card.classList.add('dragging');
      });
      card.addEventListener('dragend', () => card.classList.remove('dragging'));
      card.addEventListener('click', () => D.openTask(card.dataset.taskId));
      card.addEventListener('keydown', (e) => { if (e.key === 'Enter') D.openTask(card.dataset.taskId); });
    });
    root.querySelectorAll('tr[data-task-id]').forEach((row) => row.addEventListener('click', () => D.openTask(row.dataset.taskId)));
    root.querySelectorAll('[data-open-task]').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); D.openTask(b.dataset.openTask); }));
    root.querySelectorAll('[data-add-task]').forEach((b) => b.addEventListener('click', () => D.openTaskForm(null, b.dataset.addTask)));
    root.querySelectorAll('.kanban-col').forEach((col) => {
      col.addEventListener('dragover', (e) => { e.preventDefault(); col.classList.add('dragover'); });
      col.addEventListener('dragleave', (e) => { if (!col.contains(e.relatedTarget)) col.classList.remove('dragover'); });
      col.addEventListener('drop', (e) => {
        e.preventDefault();
        col.classList.remove('dragover');
        const id = e.dataTransfer.getData('text/plain');
        const task = MT.db.tasks.get(id);
        if (!task || task.status === col.dataset.status) return;
        try {
          MT.db.tasks.save(id, { status: col.dataset.status, progress: col.dataset.status === 'done' ? 100 : task.progress, updatedBy: 'MB-01' });
          D.toast('Đã chuyển “' + task.title + '” sang ' + orderMeta(col.dataset.status).label, 'success');
          refreshTasksView();
          D.refresh();
        } catch (err) { D.toast(err.message, 'error'); }
      });
    });
  }

  function refreshTasksView() {
    const host = document.getElementById('tasksContent');
    if (!host) return;
    host.innerHTML = tasksContentHtml();
    bindTaskContent(host);
  }

  function openTaskForm(id, presetStatus) {
    const t = id ? MT.db.tasks.get(id) : null;
    const isNew = !t;
    const body =
      '<div class="field"><label>Tiêu đề nhiệm vụ <span class="req">*</span></label><input class="input" id="tfTitle" value="' + U.esc(t ? t.title : '') + '" placeholder="Ví dụ: Chốt đơn sỉ CLB Yoga Sen Xanh"><span class="field-error">Vui lòng nhập tiêu đề.</span></div>' +
      '<div class="field"><label>Mô tả / yêu cầu</label><textarea class="textarea" id="tfDesc" rows="4" placeholder="Mô tả rõ kết quả cần đạt...">' + U.esc(t ? t.desc : '') + '</textarea></div>' +
      '<div class="field-row"><div class="field"><label>Người phụ trách</label><select class="select" id="tfAssignee">' + D.memberOptions(t ? t.assigneeId : '', 'Chưa phân công') + '</select></div>' +
      '<div class="field"><label>Ưu tiên</label><select class="select" id="tfPriority">' +
        Object.keys(MT.meta.priority).map((k) => '<option value="' + k + '" ' + ((t ? t.priority : 'medium') === k ? 'selected' : '') + '>' + MT.meta.priority[k].label + '</option>').join('') + '</select></div></div>' +
      '<div class="field-row field-row--3"><div class="field"><label>Trạng thái</label><select class="select" id="tfStatus">' +
        STATUSES.map((k) => '<option value="' + k + '" ' + ((t ? t.status : (presetStatus || 'todo')) === k ? 'selected' : '') + '>' + orderMeta(k).label + '</option>').join('') + '</select></div>' +
        '<div class="field"><label>Hạn hoàn thành</label><input class="input" type="date" id="tfDue" value="' + (t && t.dueDate ? U.fmt.dateInput(t.dueDate) : U.fmt.dateInput(U.addDays(new Date(), 3))) + '"></div>' +
        '<div class="field"><label>Giờ ước tính</label><input class="input" type="number" min="0" step="0.5" id="tfHours" value="' + (t ? t.estimateHours || 0 : 2) + '"></div></div>' +
      '<div class="field"><label>Tiến độ: <strong id="tfProgressLabel">' + (t ? t.progress : 0) + '%</strong></label><input type="range" min="0" max="100" step="5" id="tfProgress" value="' + (t ? t.progress : 0) + '" style="width:100%;accent-color:#4F46E5"></div>' +
      '<div class="field"><label>Nhãn (phân cách bằng dấu phẩy)</label><input class="input" id="tfTags" value="' + U.esc(t ? (t.tags || []).join(', ') : '') + '" placeholder="Bán sỉ, CLB"></div>';
    D.modal({
      title: isNew ? 'Tạo nhiệm vụ mới' : 'Chỉnh sửa nhiệm vụ',
      size: 'lg',
      body,
      footer: '<button class="btn" type="button" data-modal-close>Huỷ</button><button class="btn btn-primary" type="button" id="tfSubmit">' + (isNew ? 'Tạo & giao việc' : 'Lưu thay đổi') + '</button>',
      onMount(el, close) {
        const prog = el.querySelector('#tfProgress');
        const label = el.querySelector('#tfProgressLabel');
        prog.addEventListener('input', () => { label.textContent = prog.value + '%'; });
        const status = el.querySelector('#tfStatus');
        status.addEventListener('change', () => {
          if (status.value === 'done') { prog.value = 100; label.textContent = '100%'; }
        });
        el.querySelector('#tfSubmit').addEventListener('click', () => {
          const title = el.querySelector('#tfTitle');
          title.closest('.field').classList.remove('invalid');
          if (!title.value.trim()) { title.closest('.field').classList.add('invalid'); return; }
          const data = {
            title: title.value.trim(),
            desc: el.querySelector('#tfDesc').value.trim(),
            assigneeId: el.querySelector('#tfAssignee').value,
            priority: el.querySelector('#tfPriority').value,
            status: status.value,
            dueDate: el.querySelector('#tfDue').value || null,
            estimateHours: Number(el.querySelector('#tfHours').value) || 0,
            progress: Number(prog.value) || 0,
            tags: el.querySelector('#tfTags').value.split(',').map((s) => s.trim()).filter(Boolean),
            updatedBy: 'MB-01',
            createdBy: 'MB-01',
          };
          if (data.status === 'done') data.progress = 100;
          try {
            MT.db.tasks.save(id || null, data);
            D.toast(isNew ? 'Đã tạo và giao nhiệm vụ' : 'Đã cập nhật nhiệm vụ', 'success');
            close();
            D.refresh();
          } catch (e) { D.toast(e.message, 'error'); }
        });
      },
    });
  }
  D.openTaskForm = openTaskForm;

  /* ------------------------------ Task drawer ----------------------------- */
  function evidenceItem(ev, task) {
    const m = D.member(ev.by);
    return '<div class="evidence-item" data-evidence-id="' + ev.id + '">' +
      '<div class="evidence-item__head">' + D.avatar(m, 'sm') + '<strong>' + U.esc(m.name) + '</strong><span>' + U.fmt.datetime(ev.at) + '</span>' +
        '<span style="margin-left:auto;display:flex;gap:.2rem">' +
        '<button class="btn btn-xs btn-ghost" type="button" data-copy-evidence="' + ev.id + '" title="Sao chép nội dung">' + D.icon('copy', 11) + '</button>' +
        '<button class="btn btn-xs btn-ghost" type="button" data-delete-evidence="' + ev.id + '" title="Xoá bằng chứng" style="color:var(--db-danger)">' + D.icon('trash', 11) + '</button></span></div>' +
      (ev.text ? '<p>' + U.esc(ev.text) + '</p>' : '') +
      (ev.type === 'image' && ev.url ? '<img src="' + U.esc(ev.url) + '" alt="' + U.esc(ev.name || 'Bằng chứng') + '" data-lightbox="' + U.esc(ev.url) + '" loading="lazy">' : '') +
      (ev.note ? '<div style="font-size:.66rem;color:var(--db-muted);margin-top:.3rem">' + U.esc(ev.note) + '</div>' : '') +
    '</div>';
  }

  D.openTask = function (id) {
    const t = MT.db.tasks.get(id);
    if (!t) { D.toast('Không tìm thấy nhiệm vụ', 'error'); return; }
    const m = D.member(t.assigneeId);
    const st = orderMeta(t.status);
    const body =
      '<div class="drawer-section"><div style="display:flex;align-items:flex-start;gap:.6rem">' + D.avatar(m, 'lg') +
        '<div style="flex:1"><div style="font-size:.66rem;color:var(--db-muted)">' + U.esc(t.code) + ' · giao bởi ' + U.esc((D.member('MB-01')).name) + '</div>' +
        '<strong style="font-size:.95rem;display:block;line-height:1.35">' + U.esc(t.title) + '</strong>' +
        '<div style="display:flex;gap:.35rem;margin-top:.35rem;flex-wrap:wrap">' + D.priority(t.priority) + '<span class="badge badge-' + st.cls + '">' + st.label + '</span>' +
        (t.dueDate && t.status !== 'done' && new Date(t.dueDate) < U.startOfDay(new Date()) ? '<span class="badge badge-danger">Quá hạn</span>' : '') + '</div></div></div>' +
        '<div class="drawer-meta" style="margin-top:.8rem">' +
          '<div><span>Phụ trách</span><strong>' + U.esc(m.name) + '</strong></div>' +
          '<div><span>Hạn hoàn thành</span><strong>' + (t.dueDate ? U.fmt.date(t.dueDate) : '—') + '</strong></div>' +
          '<div><span>Ước tính</span><strong>' + (t.estimateHours || 0) + ' giờ</strong></div>' +
          '<div><span>Bằng chứng</span><strong>' + (t.evidence || []).length + ' mục</strong></div>' +
        '</div>' +
        (t.tags.length ? '<div class="task-card__tags" style="margin-top:.5rem">' + t.tags.map((x) => '<span class="tag">' + U.esc(x) + '</span>').join('') + '</div>' : '') +
      '</div>' +

      '<div class="drawer-section"><h4>Tiến độ</h4>' +
        '<div class="progress-row" style="margin-bottom:.5rem">' + D.progress(t.progress, t.status === 'done' ? 'success' : '') + '<strong style="font-size:.8rem">' + t.progress + '%</strong></div>' +
        '<input type="range" id="drawerProgress" min="0" max="100" step="5" value="' + t.progress + '" style="width:100%;accent-color:#4F46E5">' +
        '<div style="display:flex;gap:.35rem;margin-top:.6rem;flex-wrap:wrap" id="drawerStatuses">' +
          STATUSES.map((s) => '<button class="btn btn-xs ' + (s === t.status ? 'btn-primary' : '') + '" type="button" data-task-status="' + s + '">' + orderMeta(s).label + '</button>').join('') +
        '</div>' +
        '<button class="btn btn-sm btn-soft" type="button" id="saveProgress" style="margin-top:.5rem">Lưu tiến độ</button>' +
      '</div>' +

      '<div class="drawer-section"><h4>Mô tả công việc</h4><div class="drawer-desc">' + (t.desc ? U.esc(t.desc) : '<span class="text-muted">Chưa có mô tả.</span>') + '</div></div>' +

      '<div class="drawer-section"><h4>Nộp bằng chứng</h4>' +
        '<div class="evidence-composer"><div class="composer-head"><strong>Ảnh hoặc ghi chú kết quả</strong><span>Tối đa ' + MT.config.limits.evidenceFileMaxMB + 'MB/ảnh</span></div>' +
          '<textarea class="textarea" id="evText" rows="3" placeholder="Mô tả kết quả, số liệu, phản hồi khách hàng…" style="min-height:70px"></textarea>' +
          '<div class="dropzone" id="evDropzone">' + D.icon('upload', 22) + '<div>Kéo thả ảnh vào đây hoặc <strong>bấm để chọn ảnh</strong></div><div style="font-size:.62rem;margin-top:.15rem">Ảnh được nén tự động trước khi lưu</div></div>' +
          '<input type="file" id="evFiles" accept="image/*" multiple style="display:none">' +
          '<div class="preview-strip" id="evPreview"></div>' +
          '<button class="btn btn-primary btn-sm" type="button" id="evSubmit" style="margin-top:.6rem">' + D.icon('upload', 13) + ' Nộp bằng chứng</button>' +
        '</div></div>' +

      '<div class="drawer-section"><h4>Bằng chứng đã nộp (' + (t.evidence || []).length + ')</h4>' +
        '<div class="evidence-list" id="evidenceList">' + ((t.evidence || []).length ? t.evidence.map((ev) => evidenceItem(ev, t)).join('') : '<div style="font-size:.74rem;color:var(--db-muted);text-align:center;padding:.8rem">Chưa có bằng chứng. Hãy nộp ảnh hoặc ghi chú kết quả.</div>') + '</div></div>' +

      '<div class="drawer-section"><h4>Lịch sử hoạt động</h4><div class="activity-list">' +
        (t.activity || []).slice().reverse().map((a) => '<div class="activity"><span class="avatar avatar--sm" style="background:' + (D.member(a.by).color || '#64748B') + '">' + U.initials(D.member(a.by).name) + '</span>' +
          '<div class="activity__body"><strong style="font-size:.72rem">' + U.esc(a.text) + '</strong><span>' + U.esc(D.member(a.by).name) + ' · ' + U.fmt.datetime(a.at) + '</span></div></div>').join('') +
      '</div></div>';

    let pending = [];
    const drawer = D.drawer({
      title: 'Chi tiết nhiệm vụ',
      body,
      footer: '<div style="display:flex;gap:.35rem"><button class="btn btn-sm" type="button" id="editTask">' + D.icon('edit', 13) + ' Sửa</button>' +
        '<button class="btn btn-sm btn-ghost" type="button" id="deleteTask" style="color:var(--db-danger)">Xoá</button></div>' +
        '<button class="btn btn-sm" type="button" data-drawer-close>Đóng</button>',
      onMount(el, close) {
        const reopen = () => { close(); setTimeout(() => { D.refresh(); D.openTask(id); }, 260); };
        el.querySelectorAll('[data-task-status]').forEach((btn) => btn.addEventListener('click', () => {
          try {
            MT.db.tasks.save(id, { status: btn.dataset.taskStatus, progress: btn.dataset.taskStatus === 'done' ? 100 : t.progress, updatedBy: 'MB-01' });
            D.toast('Đã chuyển trạng thái', 'success');
            reopen();
          } catch (e) { D.toast(e.message, 'error'); }
        }));
        el.querySelector('#saveProgress').addEventListener('click', () => {
          const val = Number(el.querySelector('#drawerProgress').value) || 0;
          try {
            MT.db.tasks.save(id, { progress: val, updatedBy: t.assigneeId || 'MB-01' });
            D.toast('Đã cập nhật tiến độ ' + val + '%', 'success');
            reopen();
          } catch (e) { D.toast(e.message, 'error'); }
        });

        const drop = el.querySelector('#evDropzone');
        const fileInput = el.querySelector('#evFiles');
        const preview = el.querySelector('#evPreview');
        const renderPreview = () => {
          preview.innerHTML = pending.map((f, i) =>
            '<div class="thumb"><img src="' + f.url + '" alt=""><button type="button" data-rm-preview="' + i + '">' + D.icon('close', 10) + '</button></div>').join('');
          preview.querySelectorAll('[data-rm-preview]').forEach((b) => b.addEventListener('click', () => {
            pending.splice(Number(b.dataset.rmPreview), 1); renderPreview();
          }));
        };
        const addFiles = async (files) => {
          for (const f of Array.from(files || [])) {
            if (!f.type.startsWith('image/')) { D.toast('Chỉ hỗ trợ file ảnh', 'error'); continue; }
            if (f.size > MT.config.limits.evidenceFileMaxMB * 1024 * 1024) { D.toast('Ảnh quá lớn: ' + f.name, 'error'); continue; }
            try {
              const url = await U.compressImage(f);
              pending.push({ type: 'image', url, name: f.name });
              renderPreview();
            } catch (e) { D.toast('Không đọc được ảnh ' + f.name, 'error'); }
          }
        };
        drop.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', () => { addFiles(fileInput.files); fileInput.value = ''; });
        drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('dragover'); });
        drop.addEventListener('dragleave', () => drop.classList.remove('dragover'));
        drop.addEventListener('drop', (e) => { e.preventDefault(); drop.classList.remove('dragover'); addFiles(e.dataTransfer.files); });

        el.querySelector('#evSubmit').addEventListener('click', async () => {
          const text = el.querySelector('#evText').value.trim();
          if (!text && !pending.length) { D.toast('Nhập ghi chú hoặc chọn ảnh trước khi nộp', 'error'); return; }
          try {
            if (text) MT.db.tasks.addEvidence(id, { type: 'text', text, by: t.assigneeId || 'MB-01' });
            for (const f of pending) {
              MT.db.tasks.addEvidence(id, { type: 'image', url: f.url, name: f.name, by: t.assigneeId || 'MB-01' });
            }
            D.toast('Đã nộp bằng chứng' + (pending.length ? ' (' + pending.length + ' ảnh)' : ''), 'success');
            reopen();
          } catch (e) { D.toast(e.message, 'error'); }
        });

        el.querySelectorAll('[data-lightbox]').forEach((img) => img.addEventListener('click', () => D.lightbox(img.dataset.lightbox)));
        el.querySelectorAll('[data-delete-evidence]').forEach((btn) => btn.addEventListener('click', async () => {
          const ok = await D.confirm({ title: 'Xoá bằng chứng?', message: 'Bằng chứng này sẽ bị xoá khỏi nhiệm vụ.', confirmText: 'Xoá', danger: true });
          if (!ok) return;
          MT.db.tasks.removeEvidence(id, btn.dataset.deleteEvidence);
          D.toast('Đã xoá bằng chứng', 'success');
          reopen();
        }));
        el.querySelectorAll('[data-copy-evidence]').forEach((btn) => btn.addEventListener('click', () => {
          const ev = (t.evidence || []).find((x) => x.id === btn.dataset.copyEvidence);
          if (ev) D.copy(ev.text || ev.url || '');
        }));
        el.querySelector('#editTask').addEventListener('click', () => { close(); setTimeout(() => openTaskForm(id), 250); });
        el.querySelector('#deleteTask').addEventListener('click', async () => {
          const ok = await D.confirm({ title: 'Xoá nhiệm vụ?', message: '“' + t.title + '” và toàn bộ bằng chứng, lịch sử sẽ bị xoá.', confirmText: 'Xoá nhiệm vụ', danger: true });
          if (!ok) return;
          MT.db.tasks.remove(id);
          D.toast('Đã xoá nhiệm vụ', 'success');
          close(); D.refresh();
        });
      },
    });
    return drawer;
  };

  D.register('tasks', {
    title: 'Giao việc & theo dõi tiến độ',
    crumb: 'Mây Trắng · Đội ngũ',
    noRange: true,
    render() {
      const stats = MT.db.tasks.stats();
      const members = MT.db.data.members;
      return '' +
        '<div class="kanban-stats">' +
          '<div class="kanban-stat"><span class="kanban-stat__icon" style="background:#EEF2FF;color:#4F46E5">' + D.icon('tasks', 15) + '</span><div><strong>' + stats.total + '</strong><span>Tổng nhiệm vụ</span></div></div>' +
          '<div class="kanban-stat"><span class="kanban-stat__icon" style="background:#EAF2FE;color:#3B82F6">' + D.icon('activity', 15) + '</span><div><strong>' + (stats.doing + stats.review) + '</strong><span>Đang thực hiện</span></div></div>' +
          '<div class="kanban-stat"><span class="kanban-stat__icon" style="background:#FEECEC;color:#EF4444">' + D.icon('alert', 15) + '</span><div><strong>' + stats.overdue + '</strong><span>Quá hạn</span></div></div>' +
          '<div class="kanban-stat"><span class="kanban-stat__icon" style="background:#E7F8F2;color:#10B981">' + D.icon('checkCircle', 15) + '</span><div><strong>' + stats.progress + '%</strong><span>Tiến độ trung bình</span></div></div>' +
        '</div>' +
        '<div class="card" style="margin-bottom:1rem"><div class="card__head"><div><div class="card__title">Bảng công việc</div><div class="card__sub">Kéo thẻ giữa các cột để cập nhật trạng thái · ' + stats.evidence + ' bằng chứng đã nộp</div></div>' +
          '<div class="card__actions"><div class="toolbar">' +
            '<div class="search">' + D.icon('search', 14) + '<input class="input" id="taskSearch" placeholder="Tìm nhiệm vụ…" value="' + U.esc(T.search) + '"></div>' +
            '<select class="select" id="taskAssigneeFilter"><option value="all">Mọi thành viên</option>' +
              members.map((m) => '<option value="' + m.id + '" ' + (T.filterAssignee === m.id ? 'selected' : '') + '>' + U.esc(m.name) + '</option>').join('') + '</select>' +
            '<select class="select" id="taskPriorityFilter"><option value="all">Mọi ưu tiên</option>' +
              Object.keys(MT.meta.priority).map((k) => '<option value="' + k + '" ' + (T.filterPriority === k ? 'selected' : '') + '>' + MT.meta.priority[k].label + '</option>').join('') + '</select>' +
            '<div class="segmented" id="taskViewToggle"><button type="button" data-taskview="board" class="' + (T.taskView === 'board' ? 'active' : '') + '">' + D.icon('grid', 12) + ' Bảng</button><button type="button" data-taskview="list" class="' + (T.taskView === 'list' ? 'active' : '') + '">' + D.icon('tasks', 12) + ' Danh sách</button></div>' +
            '<button class="btn btn-primary btn-sm" type="button" id="addTask">' + D.icon('plus', 14) + ' Giao việc</button>' +
          '</div></div></div>' +
          '<div class="card__body" id="tasksContent" style="' + (T.taskView === 'board' ? 'overflow-x:auto' : 'padding:0') + '">' + tasksContentHtml() + '</div></div>' +
        '<div class="grid grid-2-1">' +
          '<div class="card"><div class="card__head"><div><div class="card__title">Hạn chót gần nhất</div><div class="card__sub">Các việc chưa hoàn thành</div></div></div><div class="card__body"><div class="activity-list">' +
            (MT.db.data.tasks.filter((t) => t.status !== 'done' && t.dueDate).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0, 5).map((t) =>
              '<div class="activity clickable" data-task-id="' + t.id + '" style="cursor:pointer"><span class="avatar avatar--sm" style="background:' + D.member(t.assigneeId).color + '">' + U.initials(D.member(t.assigneeId).name) + '</span>' +
              '<div class="activity__body"><strong>' + U.esc(t.title) + '</strong><span>' + U.esc(D.member(t.assigneeId).name) + ' · hạn ' + U.fmt.date(t.dueDate) + '</span></div>' +
              '<span class="badge badge-' + (new Date(t.dueDate) < U.startOfDay(new Date()) ? 'danger' : 'gray') + '">' + (new Date(t.dueDate) < U.startOfDay(new Date()) ? 'Quá hạn' : U.fmt.dateShort(t.dueDate)) + '</span></div>'
            ).join('') || '<div class="empty-state"><h3>Không có việc gấp</h3><p>Mọi nhiệm vụ đều đúng hạn.</p></div>') +
          '</div></div></div>' +
          '<div class="card"><div class="card__head"><div><div class="card__title">Phân bổ theo thành viên</div><div class="card__sub">Số việc đang mở</div></div></div><div class="card__body">' +
            members.map((m) => {
              const c = MT.db.data.tasks.filter((t) => t.assigneeId === m.id && t.status !== 'done').length;
              const total = MT.db.data.tasks.filter((t) => t.assigneeId === m.id).length;
              return '<div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.65rem">' + D.avatar(m, 'sm') +
                '<div style="flex:1"><div style="display:flex;justify-content:space-between;font-size:.72rem"><strong>' + U.esc(m.name) + '</strong><span style="color:var(--db-muted)">' + c + ' mở / ' + total + ' việc</span></div>' +
                D.progress(total ? (total - c) / total * 100 : 0, 'success') + '</div></div>';
            }).join('') +
          '</div></div>' +
        '</div>';
    },
    mount() {
      const content = document.getElementById('tasksContent');
      if (content) bindTaskContent(content);
      document.getElementById('addTask').addEventListener('click', () => openTaskForm());
      const search = document.getElementById('taskSearch');
      if (search) search.addEventListener('input', U.debounce(() => { T.search = search.value; refreshTasksView(); }, 200));
      const af = document.getElementById('taskAssigneeFilter');
      if (af) af.addEventListener('change', () => { T.filterAssignee = af.value; refreshTasksView(); });
      const pf = document.getElementById('taskPriorityFilter');
      if (pf) pf.addEventListener('change', () => { T.filterPriority = pf.value; refreshTasksView(); });
      document.querySelectorAll('[data-taskview]').forEach((b) => b.addEventListener('click', () => {
        T.taskView = b.dataset.taskview;
        document.querySelectorAll('[data-taskview]').forEach((x) => x.classList.toggle('active', x === b));
        const host = document.getElementById('tasksContent');
        host.style.overflowX = T.taskView === 'board' ? 'auto' : 'hidden';
        host.style.padding = T.taskView === 'board' ? '' : '0';
        host.innerHTML = tasksContentHtml();
        bindTaskContent(host);
      }));
      document.querySelectorAll('#view [data-task-id].activity').forEach((el) => el.addEventListener('click', () => D.openTask(el.dataset.taskId)));
    },
  });

  /* ============================== WORKSPACE =============================== */
  function workspaceMember() {
    const list = MT.db.data.members.filter((m) => m.status !== 'leave');
    if (!T.workspaceMember || !list.some((m) => m.id === T.workspaceMember)) {
      T.workspaceMember = (list[0] || MT.db.data.members[0] || {}).id;
    }
    return MT.db.members.get(T.workspaceMember) || MT.db.data.members[0];
  }

  function evidenceFeed(memberId) {
    const tasks = MT.db.data.tasks.filter((t) => t.assigneeId === memberId);
    const items = [];
    tasks.forEach((t) => (t.evidence || []).forEach((e) => items.push(Object.assign({}, e, { taskTitle: t.title, taskCode: t.code }))));
    return items.sort((a, b) => new Date(b.at) - new Date(a.at));
  }

  D.register('workspace', {
    title: 'Cổng thành viên',
    crumb: 'Mây Trắng · Đội ngũ',
    noRange: true,
    render() {
      const m = workspaceMember();
      if (!m) return '<div class="empty-state">' + D.icon('users', 30) + '<h3>Chưa có thành viên</h3><p>Thêm thành viên trước khi sử dụng cổng làm việc.</p><a class="btn btn-primary btn-sm" href="#members">Thêm thành viên</a></div>';
      const stats = memberStats(m.id);
      const tasks = MT.db.data.tasks.filter((t) => t.assigneeId === m.id).sort((a, b) => (a.status === 'done' ? 1 : 0) - (b.status === 'done' ? 1 : 0));
      const active = tasks.filter((t) => t.status !== 'done');
      const feed = evidenceFeed(m.id).slice(0, 8);
      return '' +
        '<div class="card" style="margin-bottom:1rem"><div class="card__head"><div><div class="card__title">Chọn thành viên</div><div class="card__sub">Mỗi thành viên có không gian làm việc riêng để cập nhật tiến độ và nộp bằng chứng</div></div></div>' +
          '<div class="card__body" style="display:flex;gap:.5rem;flex-wrap:wrap">' +
            MT.db.data.members.map((x) =>
              '<button class="btn ' + (x.id === m.id ? 'btn-primary' : '') + '" type="button" data-ws-member="' + x.id + '" style="height:auto;padding:.4rem .7rem">' +
              D.avatar(x, 'sm') + '<span>' + U.esc(x.name) + '</span></button>').join('') +
          '</div></div>' +
        '<div class="grid grid-1-2" style="align-items:start">' +
          '<div>' +
            '<div class="card" style="margin-bottom:1rem"><div class="card__body">' +
              '<div style="display:flex;gap:.8rem;align-items:center">' + D.avatar(m, 'xl') +
                '<div><h2 style="font-size:1.05rem;letter-spacing:-.01em">' + U.esc(m.name) + '</h2><div style="font-size:.72rem;color:var(--db-muted)">' + U.esc(m.role) + '</div>' +
                '<div style="display:flex;gap:.3rem;margin-top:.35rem;flex-wrap:wrap"><span class="badge badge-success">' + U.fmt.pct(m.equityPct || 0) + ' cổ phần</span><span class="badge badge-info no-dot">' + m.weeklyHours + ' giờ/tuần</span></div></div>' +
              '</div>' +
              '<div class="member-card__stats" style="margin-top:1rem">' +
                '<div><strong>' + stats.done + '</strong><span>Đã xong</span></div>' +
                '<div><strong style="color:' + (stats.overdue ? 'var(--db-danger)' : 'var(--db-ink)') + '">' + stats.overdue + '</strong><span>Quá hạn</span></div>' +
                '<div><strong>' + stats.evidence + '</strong><span>Bằng chứng</span></div></div>' +
              '<div style="margin-top:.9rem"><div class="progress-row"><span style="font-size:.68rem;color:var(--db-muted)">Tiến độ tổng</span>' + D.progress(stats.progress, 'success') + '<strong>' + stats.progress + '%</strong></div></div>' +
              '<div style="font-size:.68rem;color:var(--db-muted);margin-top:.6rem;line-height:1.6">' + D.icon('mail', 11) + ' ' + U.esc(m.email || '—') + '<br>' + D.icon('phone', 11) + ' ' + U.esc(m.phone || '—') + '</div>' +
            '</div></div>' +
            '<div class="card card--flush"><div class="card__head"><div><div class="card__title">Nhiệm vụ của tôi</div><div class="card__sub">' + active.length + ' việc đang mở · ' + tasks.length + ' tổng cộng</div></div></div>' +
              '<div class="table-wrap"><table><tbody>' +
                (tasks.length ? tasks.map((t) => {
                  const overdue = t.status !== 'done' && t.dueDate && new Date(t.dueDate) < U.startOfDay(new Date());
                  return '<tr><td><strong style="font-size:.76rem">' + U.esc(t.title) + '</strong><div style="font-size:.62rem;color:var(--db-muted)">' + U.esc(t.code) + ' · ' + orderMeta(t.status).label + (t.dueDate ? ' · hạn ' + U.fmt.date(t.dueDate) : '') + '</div>' +
                    '<div class="progress-row" style="margin-top:.3rem;max-width:220px">' + D.progress(t.progress, t.status === 'done' ? 'success' : '') + '<strong>' + t.progress + '%</strong></div></td>' +
                    '<td style="width:1%"><button class="btn btn-xs btn-soft" type="button" data-ws-open="' + t.id + '">Nộp bằng chứng</button></td></tr>';
                }).join('') : '<tr><td><div class="empty-state" style="padding:1.5rem">' + D.icon('checkCircle', 26) + '<h3>Chưa có nhiệm vụ</h3><p>Việc được giao sẽ xuất hiện tại đây.</p></div></td></tr>') +
              '</tbody></table></div></div>' +
          '</div>' +
          '<div>' +
            '<div class="card" style="margin-bottom:1rem"><div class="card__head"><div><div class="card__title">Nộp bằng chứng nhanh</div><div class="card__sub">Ghi chú kết quả hoặc tải ảnh minh chứng</div></div></div><div class="card__body">' +
              '<div class="field"><label>Nhiệm vụ</label><select class="select" id="wsTask">' +
                (active.length ? active : tasks).map((t) => '<option value="' + t.id + '">' + U.esc(t.code + ' — ' + t.title) + '</option>').join('') +
                (!tasks.length ? '<option value="">Chưa có nhiệm vụ</option>' : '') + '</select></div>' +
              '<div class="field"><label>Nội dung bằng chứng</label><textarea class="textarea" id="wsText" rows="3" placeholder="Ví dụ: Đã gọi 9/20 khách, 3 khách chốt đơn 1.240.000đ…"></textarea></div>' +
              '<div class="dropzone" id="wsDropzone">' + D.icon('upload', 22) + '<div>Kéo thả ảnh hoặc <strong>bấm để chọn</strong></div></div>' +
              '<input type="file" id="wsFiles" accept="image/*" multiple style="display:none">' +
              '<div class="preview-strip" id="wsPreview"></div>' +
              '<button class="btn btn-primary btn-sm" type="button" id="wsSubmit" style="margin-top:.6rem">' + D.icon('upload', 13) + ' Gửi bằng chứng</button>' +
            '</div></div>' +
            '<div class="card"><div class="card__head"><div><div class="card__title">Bằng chứng gần đây</div><div class="card__sub">Từ các nhiệm vụ của ' + U.esc(m.name) + '</div></div><span class="badge badge-gray no-dot">' + feed.length + ' mục</span></div>' +
              '<div class="card__body">' +
                (feed.length ? '<div class="evidence-list">' + feed.map((e) =>
                  '<div class="evidence-item" style="display:flex;gap:.6rem"><div style="flex:1"><div class="evidence-item__head"><strong>' + U.esc(e.taskCode) + '</strong><span>' + U.fmt.ago(e.at) + '</span></div>' +
                  (e.type === 'image' ? '<img src="' + U.esc(e.url) + '" alt="" data-lightbox="' + U.esc(e.url) + '" style="max-height:150px;width:auto;margin-top:.2rem">' : '<p style="font-size:.74rem">' + U.esc(e.text) + '</p>') +
                  '<div style="font-size:.62rem;color:var(--db-muted);margin-top:.3rem">' + U.esc(e.taskTitle) + '</div></div></div>').join('') + '</div>'
                  : '<div class="empty-state" style="padding:1.2rem">' + D.icon('image', 26) + '<h3>Chưa có bằng chứng</h3><p>Bằng chứng nộp cho nhiệm vụ sẽ hiển thị tại đây.</p></div>') +
              '</div></div>' +
          '</div>' +
        '</div>';
    },
    mount() {
      const m = workspaceMember();
      document.querySelectorAll('[data-ws-member]').forEach((b) => b.addEventListener('click', () => {
        T.workspaceMember = b.dataset.wsMember;
        workspaceFiles = [];
        D.refresh();
      }));
      document.querySelectorAll('[data-ws-open]').forEach((b) => b.addEventListener('click', () => D.openTask(b.dataset.wsOpen)));
      document.querySelectorAll('[data-lightbox]').forEach((img) => img.addEventListener('click', () => D.lightbox(img.dataset.lightbox)));
      const drop = document.getElementById('wsDropzone');
      const fileInput = document.getElementById('wsFiles');
      const preview = document.getElementById('wsPreview');
      const renderPreview = () => {
        preview.innerHTML = workspaceFiles.map((f, i) =>
          '<div class="thumb"><img src="' + f.url + '" alt=""><button type="button" data-ws-rm="' + i + '">' + D.icon('close', 10) + '</button></div>').join('');
        preview.querySelectorAll('[data-ws-rm]').forEach((b) => b.addEventListener('click', () => { workspaceFiles.splice(Number(b.dataset.wsRm), 1); renderPreview(); }));
      };
      const addFiles = async (files) => {
        for (const f of Array.from(files || [])) {
          if (!f.type.startsWith('image/')) { D.toast('Chỉ hỗ trợ file ảnh', 'error'); continue; }
          if (f.size > MT.config.limits.evidenceFileMaxMB * 1024 * 1024) { D.toast('Ảnh quá lớn: ' + f.name, 'error'); continue; }
          try { workspaceFiles.push({ type: 'image', url: await U.compressImage(f), name: f.name }); renderPreview(); }
          catch (e) { D.toast('Không đọc được ảnh ' + f.name, 'error'); }
        }
      };
      if (drop) {
        drop.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', () => { addFiles(fileInput.files); fileInput.value = ''; });
        drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('dragover'); });
        drop.addEventListener('dragleave', () => drop.classList.remove('dragover'));
        drop.addEventListener('drop', (e) => { e.preventDefault(); drop.classList.remove('dragover'); addFiles(e.dataTransfer.files); });
      }
      const submit = document.getElementById('wsSubmit');
      if (submit) submit.addEventListener('click', () => {
        const taskId = document.getElementById('wsTask').value;
        const text = document.getElementById('wsText').value.trim();
        if (!taskId) { D.toast('Chưa có nhiệm vụ để nộp bằng chứng', 'error'); return; }
        if (!text && !workspaceFiles.length) { D.toast('Nhập nội dung hoặc chọn ảnh', 'error'); return; }
        try {
          if (text) MT.db.tasks.addEvidence(taskId, { type: 'text', text, by: m.id });
          workspaceFiles.forEach((f) => MT.db.tasks.addEvidence(taskId, { type: 'image', url: f.url, name: f.name, by: m.id }));
          workspaceFiles = [];
          D.toast('Đã gửi bằng chứng thành công', 'success');
          D.refresh();
        } catch (e) { D.toast(e.message, 'error'); }
      });
    },
  });
})();
