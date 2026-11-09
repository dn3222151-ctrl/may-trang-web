-- ============================================================================
-- MÂY TRẮNG – Supabase schema
-- Chạy file này trong Supabase SQL Editor, sau đó chạy seed.sql
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- 1. Hồ sơ quản trị
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'staff' check (role in ('admin', 'staff')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''), 'staff')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 2. Sản phẩm
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id text primary key,
  slug text not null unique,
  name text not null,
  sku text unique,
  category text not null default 'skincare',
  price numeric(14, 0) not null default 0 check (price >= 0),
  compare_at numeric(14, 0),
  cost numeric(14, 0) not null default 0 check (cost >= 0),
  stock integer not null default 0 check (stock >= 0),
  sold integer not null default 0,
  rating numeric(3, 1) not null default 0,
  review_count integer not null default 0,
  volume text,
  weight integer default 0,
  badge text,
  short_description text,
  description text,
  benefits jsonb not null default '[]'::jsonb,
  ingredients text,
  usage_steps jsonb not null default '[]'::jsonb,
  skin_types jsonb not null default '[]'::jsonb,
  images jsonb not null default '[]'::jsonb,
  variants jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3. Đơn hàng
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id text primary key,
  code text not null unique,
  created_at timestamptz not null default now(),
  channel text not null default 'website',
  customer jsonb not null,
  subtotal numeric(14, 0) not null default 0,
  discount numeric(14, 0) not null default 0,
  coupon_code text,
  shipping_fee numeric(14, 0) not null default 0,
  total numeric(14, 0) not null default 0,
  payment_method text not null default 'cod',
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'paid', 'refunded')),
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'packing', 'shipping', 'completed', 'cancelled')),
  shipping_method text default 'standard',
  source text default 'web',
  timeline jsonb not null default '[]'::jsonb
);

create table if not exists public.order_items (
  id bigserial primary key,
  order_id text not null references public.orders(id) on delete cascade,
  product_id text,
  name text not null,
  variant text not null default '',
  price numeric(14, 0) not null default 0,
  cost numeric(14, 0) not null default 0,
  qty integer not null default 1 check (qty > 0),
  image text,
  unique (order_id, product_id, variant)
);

-- ---------------------------------------------------------------------------
-- 4. Đội ngũ & nhiệm vụ
-- ---------------------------------------------------------------------------
create table if not exists public.members (
  id text primary key,
  name text not null,
  role text,
  email text unique,
  auth_user_id uuid unique references auth.users(id) on delete set null,
  phone text,
  equity_pct numeric(5, 2) not null default 0 check (equity_pct >= 0 and equity_pct <= 100),
  weekly_hours integer not null default 0,
  status text not null default 'active' check (status in ('active', 'probation', 'leave')),
  joined_at date,
  color text default '#4F46E5',
  kpi_target numeric(14, 0) not null default 0,
  skills jsonb not null default '[]'::jsonb,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id text primary key,
  code text not null unique,
  title text not null,
  description text,
  assignee_id text references public.members(id) on delete set null,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  status text not null default 'todo' check (status in ('todo', 'doing', 'review', 'done')),
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  due_date date,
  estimate_hours numeric(6, 1) not null default 0,
  actual_hours numeric(6, 1) not null default 0,
  tags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.task_evidence (
  id text primary key,
  task_id text not null references public.tasks(id) on delete cascade,
  type text not null default 'text' check (type in ('text', 'image', 'file')),
  text_content text,
  url text,
  file_name text,
  note text,
  submitted_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.task_activity (
  id bigserial primary key,
  task_id text not null references public.tasks(id) on delete cascade,
  text text not null,
  by_member text,
  created_at timestamptz not null default now(),
  unique (task_id, created_at, text)
);

-- ---------------------------------------------------------------------------
-- 5. Đánh giá, mã giảm giá, người đăng ký, cài đặt
-- ---------------------------------------------------------------------------
create table if not exists public.reviews (
  id text primary key,
  product_id text references public.products(id) on delete cascade,
  name text not null,
  rating integer not null check (rating between 1 and 5),
  text text not null,
  verified boolean not null default false,
  source text default 'user',
  created_at timestamptz not null default now()
);

create table if not exists public.coupons (
  id text primary key,
  code text not null unique,
  type text not null check (type in ('percent', 'fixed', 'shipping')),
  value numeric(14, 0) not null default 0,
  max_discount numeric(14, 0) not null default 0,
  min_order numeric(14, 0) not null default 0,
  label text,
  active boolean not null default true,
  expires date,
  usage_count integer not null default 0
);

create table if not exists public.subscribers (
  email text primary key,
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  id integer primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 6. Index & trigger cập nhật thời gian
-- ---------------------------------------------------------------------------
create index if not exists idx_orders_created_at on public.orders (created_at desc);
create index if not exists idx_orders_status on public.orders (status);
create index if not exists idx_orders_channel on public.orders (channel);
create index if not exists idx_order_items_order on public.order_items (order_id);
create index if not exists idx_tasks_assignee on public.tasks (assignee_id);
create index if not exists idx_members_auth_user on public.members (auth_user_id);
create index if not exists idx_tasks_status on public.tasks (status);
create index if not exists idx_tasks_due on public.tasks (due_date);
create index if not exists idx_evidence_task on public.task_evidence (task_id);
create index if not exists idx_activity_task on public.task_activity (task_id);
create index if not exists idx_reviews_product on public.reviews (product_id);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_products_updated on public.products;
create trigger trg_products_updated before update on public.products
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_tasks_updated on public.tasks;
create trigger trg_tasks_updated before update on public.tasks
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_settings_updated on public.settings;
create trigger trg_settings_updated before update on public.settings
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- 7. Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.members enable row level security;
alter table public.tasks enable row level security;
alter table public.task_evidence enable row level security;
alter table public.task_activity enable row level security;
alter table public.reviews enable row level security;
alter table public.coupons enable row level security;
alter table public.subscribers enable row level security;
alter table public.settings enable row level security;

-- Profiles: mỗi người đọc/sửa hồ sơ của mình, admin xem tất cả
drop policy if exists "profiles_self_read" on public.profiles;
create policy "profiles_self_read" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update" on public.profiles
  for update using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- Sản phẩm: khách đọc sản phẩm đang bán, admin toàn quyền
drop policy if exists "products_public_read" on public.products;
create policy "products_public_read" on public.products
  for select using (active = true);

drop policy if exists "products_admin_all" on public.products;
create policy "products_admin_all" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- Đơn hàng: chỉ quản trị viên (website demo lưu cục bộ trước khi đồng bộ)
drop policy if exists "orders_admin_all" on public.orders;
create policy "orders_admin_all" on public.orders
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "order_items_admin_all" on public.order_items;
create policy "order_items_admin_all" on public.order_items
  for all using (public.is_admin()) with check (public.is_admin());

-- Đội ngũ, nhiệm vụ, bằng chứng: admin toàn quyền; thành viên chỉ thấy dữ liệu của mình
drop policy if exists "members_admin_all" on public.members;
create policy "members_admin_all" on public.members
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "members_self_read" on public.members;
create policy "members_self_read" on public.members
  for select to authenticated using (auth_user_id = auth.uid());

drop policy if exists "tasks_admin_all" on public.tasks;
create policy "tasks_admin_all" on public.tasks
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "tasks_member_read" on public.tasks;
create policy "tasks_member_read" on public.tasks
  for select to authenticated
  using (assignee_id in (select id from public.members where auth_user_id = auth.uid()));

drop policy if exists "evidence_admin_all" on public.task_evidence;
create policy "evidence_admin_all" on public.task_evidence
  for all using (public.is_admin()) with check (public.is_admin());

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

drop policy if exists "activity_admin_all" on public.task_activity;
create policy "activity_admin_all" on public.task_activity
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "activity_member_read" on public.task_activity;
create policy "activity_member_read" on public.task_activity
  for select to authenticated
  using (exists (
    select 1 from public.tasks t
    join public.members m on m.id = t.assignee_id
    where t.id = task_activity.task_id and m.auth_user_id = auth.uid()
  ));

-- Đánh giá: công khai đọc, khách được gửi đánh giá mới
drop policy if exists "reviews_public_read" on public.reviews;
create policy "reviews_public_read" on public.reviews for select using (true);

drop policy if exists "reviews_public_insert" on public.reviews;
create policy "reviews_public_insert" on public.reviews
  for insert to anon, authenticated
  with check (rating between 1 and 5 and char_length(text) > 0);

drop policy if exists "reviews_admin_all" on public.reviews;
create policy "reviews_admin_all" on public.reviews
  for all using (public.is_admin()) with check (public.is_admin());

-- Mã giảm giá: khách đọc mã đang áp dụng (để website tính giảm giá), admin toàn quyền
drop policy if exists "coupons_public_read" on public.coupons;
create policy "coupons_public_read" on public.coupons
  for select using (active = true);

drop policy if exists "coupons_admin_all" on public.coupons;
create policy "coupons_admin_all" on public.coupons
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "settings_admin_all" on public.settings;
create policy "settings_admin_all" on public.settings
  for all using (public.is_admin()) with check (public.is_admin());

-- Người đăng ký nhận tin: khách được thêm, admin được đọc
drop policy if exists "subscribers_public_insert" on public.subscribers;
create policy "subscribers_public_insert" on public.subscribers
  for insert to anon, authenticated with check (true);

drop policy if exists "subscribers_admin_read" on public.subscribers;
create policy "subscribers_admin_read" on public.subscribers
  for select using (public.is_admin());

-- ---------------------------------------------------------------------------
-- 7.1 Hàm cho cổng thành viên & dữ liệu công khai
-- ---------------------------------------------------------------------------
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
      progress = case
        when coalesce(p_status, status) = 'done' then 100
        else coalesce(p_progress, progress)
      end,
      completed_at = case
        when coalesce(p_status, status) = 'done' then coalesce(completed_at, now())
        else null
      end,
      updated_at = now()
  where id = p_task_id
  returning * into v_task;

  insert into public.task_activity (task_id, text, by_member)
  values (p_task_id, 'Cập nhật tiến độ từ cổng thành viên', v_member);

  return v_task;
end;
$$;

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

-- ---------------------------------------------------------------------------
-- 8. Quyền API
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select on public.products, public.reviews, public.coupons to anon;
grant insert on public.reviews, public.subscribers to anon;
grant execute on function public.public_store_settings() to anon, authenticated;
grant execute on function public.member_update_task(text, integer, text) to authenticated;
grant all on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- ---------------------------------------------------------------------------
-- 9. Storage bucket cho ảnh bằng chứng
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'task-evidence', 'task-evidence', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set public = true;

drop policy if exists "evidence_files_public_read" on storage.objects;
create policy "evidence_files_public_read" on storage.objects
  for select using (bucket_id = 'task-evidence');

drop policy if exists "evidence_files_admin_insert" on storage.objects;
create policy "evidence_files_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'task-evidence' and public.is_admin());

drop policy if exists "evidence_files_admin_update" on storage.objects;
create policy "evidence_files_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'task-evidence' and public.is_admin());

drop policy if exists "evidence_files_admin_delete" on storage.objects;
create policy "evidence_files_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'task-evidence' and public.is_admin());

-- Thành viên được upload ảnh bằng chứng vào thư mục members/{member}/{task}
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

-- Bật realtime cho các bảng cần đồng bộ tức thời (bỏ qua nếu đã bật)
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

-- ---------------------------------------------------------------------------
-- 10. View báo cáo
-- ---------------------------------------------------------------------------
create or replace view public.v_monthly_pl
with (security_invoker = true) as
select
  date_trunc('month', o.created_at)::date as month,
  count(distinct o.id) as orders,
  coalesce(sum(o.subtotal - o.discount), 0) as revenue,
  coalesce(sum(oi.cost * oi.qty), 0) as cogs,
  coalesce(sum(o.subtotal - o.discount), 0) - coalesce(sum(oi.cost * oi.qty), 0) as gross_profit
from public.orders o
left join public.order_items oi on oi.order_id = o.id
where o.status <> 'cancelled'
group by 1
order by 1;

create or replace view public.v_channel_performance
with (security_invoker = true) as
select
  channel,
  count(*) as orders,
  coalesce(sum(subtotal - discount), 0) as revenue,
  coalesce(avg(total), 0) as avg_order_value
from public.orders
where status <> 'cancelled'
group by channel
order by revenue desc;

-- ---------------------------------------------------------------------------
-- 11. Tạo tài khoản quản trị
-- ---------------------------------------------------------------------------
-- Cách 1 (khuyến nghị): Authentication > Users > Add user, sau đó chạy:
--   insert into public.profiles (id, email, full_name, role)
--   select id, email, 'Nguyễn Tiến Dũng', 'admin'
--   from auth.users where email = 'admin@maytrang.vn'
--   on conflict (id) do update set role = 'admin', full_name = 'Nguyễn Tiến Dũng';
--
-- Cách 2: dùng service_role để tạo user qua Admin API rồi cập nhật role.
--
-- Ghi chú: website dùng publishable/anon key, chỉ đọc dữ liệu công khai và gửi đánh giá.
-- Dashboard cần đăng nhập admin để đẩy dữ liệu; thành viên đăng nhập tại member.html.
-- Tạo tài khoản thành viên trong Dashboard > Thành viên > Tài khoản đăng nhập.
