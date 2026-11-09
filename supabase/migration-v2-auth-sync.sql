-- ============================================================================
-- MÂY TRẮNG – Migration v2: tài khoản thành viên + đồng bộ realtime
-- Chạy file này một lần nếu bạn đã cài schema.sql phiên bản cũ.
-- (schema.sql mới đã bao gồm toàn bộ thay đổi dưới đây.)
-- ============================================================================

-- 1. Liên kết thành viên với Supabase Auth
alter table public.members
  add column if not exists auth_user_id uuid unique references auth.users(id) on delete set null;

create index if not exists idx_members_auth_user on public.members (auth_user_id);

-- 2. Đổi tên CEO
update public.members
set name = 'Nguyễn Tiến Dũng',
    email = 'dung@maytrang.vn',
    note = 'CEO — phụ trách vận hành và phát triển kênh CLB.'
where id = 'MB-01' and name = 'Lại Trọng Việt';

update public.profiles
set full_name = 'Nguyễn Tiến Dũng'
where full_name = 'Lại Trọng Việt';

-- 3. Quyền đọc dữ liệu công khai
drop policy if exists "coupons_public_read" on public.coupons;
create policy "coupons_public_read" on public.coupons
  for select using (active = true);

grant select on public.coupons to anon;

-- 4. Thành viên chỉ thấy dữ liệu của mình
drop policy if exists "members_self_read" on public.members;
create policy "members_self_read" on public.members
  for select to authenticated using (auth_user_id = auth.uid());

drop policy if exists "tasks_member_read" on public.tasks;
create policy "tasks_member_read" on public.tasks
  for select to authenticated
  using (assignee_id in (select id from public.members where auth_user_id = auth.uid()));

drop policy if exists "evidence_member_read" on public.task_evidence;
create policy "evidence_member_read" on public.task_evidence
  for select to authenticated
  using (exists (
    select 1 from public.tasks t
    join public.members m on m.id = t.assignee_id
    where t.id = task_evidence.task_id and m.auth_user_id = auth.uid()
  ));

drop policy if exists "evidence_member_insert" on public.task_evidence;
create policy "evidence_member_insert" on public.task_evidence
  for insert to authenticated
  with check (
    submitted_by in (select id from public.members where auth_user_id = auth.uid())
    and exists (
      select 1 from public.tasks t
      join public.members m on m.id = t.assignee_id
      where t.id = task_evidence.task_id and m.auth_user_id = auth.uid()
    )
  );

drop policy if exists "activity_member_read" on public.task_activity;
create policy "activity_member_read" on public.task_activity
  for select to authenticated
  using (exists (
    select 1 from public.tasks t
    join public.members m on m.id = t.assignee_id
    where t.id = task_activity.task_id and m.auth_user_id = auth.uid()
  ));

-- 5. Hàm cập nhật tiến độ an toàn cho thành viên
create or replace function public.member_update_task(
  p_task_id text,
  p_progress integer default null,
  p_status text default null
)
returns public.tasks
language plpgsql security definer
set search_path = public
as $$
declare
  v_member text;
  v_task public.tasks;
begin
  select m.id into v_member
  from public.members m
  join public.tasks t on t.assignee_id = m.id
  where t.id = p_task_id and m.auth_user_id = auth.uid();

  if v_member is null then
    raise exception 'Bạn không được giao nhiệm vụ này.';
  end if;
  if p_status is not null and p_status not in ('todo', 'doing', 'review', 'done') then
    raise exception 'Trạng thái không hợp lệ.';
  end if;
  if p_progress is not null and (p_progress < 0 or p_progress > 100) then
    raise exception 'Tiến độ phải nằm trong khoảng 0–100.';
  end if;

  update public.tasks
  set status = coalesce(p_status, status),
      progress = case when coalesce(p_status, status) = 'done' then 100 else coalesce(p_progress, progress) end,
      completed_at = case when coalesce(p_status, status) = 'done' then coalesce(completed_at, now()) else null end,
      updated_at = now()
  where id = p_task_id
  returning * into v_task;

  insert into public.task_activity (task_id, text, by_member)
  values (p_task_id, 'Cập nhật tiến độ từ cổng thành viên', v_member);

  return v_task;
end;
$$;

grant execute on function public.member_update_task(text, integer, text) to authenticated;

-- 6. Cài đặt công khai cho website (không lộ chi phí/thuế)
create or replace function public.public_store_settings()
returns jsonb
language sql stable security definer
set search_path = public
as $$
  select jsonb_build_object(
    'store', coalesce(data -> 'store', '{}'::jsonb),
    'shipping', coalesce(data -> 'shipping', '{}'::jsonb),
    'storefront', coalesce(data -> 'storefront', '{}'::jsonb)
  )
  from public.settings
  where id = 1;
$$;

grant execute on function public.public_store_settings() to anon, authenticated;

-- 7. Storage cho bằng chứng của thành viên
drop policy if exists "evidence_files_member_insert" on storage.objects;
create policy "evidence_files_member_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'task-evidence'
    and (storage.foldername(name))[1] = 'members'
    and (storage.foldername(name))[2] in (select id from public.members where auth_user_id = auth.uid())
  );

drop policy if exists "evidence_files_member_update" on storage.objects;
create policy "evidence_files_member_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'task-evidence' and owner = auth.uid())
  with check (bucket_id = 'task-evidence' and owner = auth.uid());

drop policy if exists "evidence_files_member_delete" on storage.objects;
create policy "evidence_files_member_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'task-evidence' and owner = auth.uid());

-- 8. Bật realtime cho các bảng đồng bộ
do $$
declare t text;
begin
  foreach t in array array['products', 'settings', 'coupons', 'reviews', 'members', 'tasks', 'task_evidence', 'task_activity']
  loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception
      when duplicate_object then null;
      when undefined_object then null;
    end;
  end loop;
end $$;

-- 9. Ghi chú
-- - Sau khi chạy migration, mở Dashboard > Cài đặt > Supabase, đăng nhập admin.
-- - Trong Thành viên > sửa thành viên, nhập mật khẩu khởi tạo và bấm lưu để tạo tài khoản.
-- - Thành viên đăng nhập tại member.html.
-- - Nếu Supabase Auth đang bật "Confirm email", hãy tắt tạm để tài khoản đăng nhập được ngay,
--   hoặc yêu cầu thành viên xác nhận email trước.
