begin;

-- Extensions
create extension if not exists "pgcrypto";

-- Profiles: roles + Stripe linkage (table already exists from earlier migrations)
alter table if exists public.profiles
  add column if not exists role text not null default 'user' check (role in ('user','admin','superadmin')),
  add column if not exists stripe_customer_id text;

comment on column public.profiles.role is 'Role for application authorization. Default user; admin/superadmin are assigned manually.';
comment on column public.profiles.stripe_customer_id is 'Stripe customer id used to map webhook events back to Supabase users.';

-- Products catalog
create table if not exists public.products (
  slug text primary key,
  name text not null,
  description text,
  is_bundle boolean not null default false,
  bundle_items text[] not null default '{}',
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_bundle_items_idx on public.products using gin (bundle_items);

-- Subscriptions
create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  product_slug text not null references public.products (slug) on delete cascade,
  stripe_subscription_id text,
  stripe_customer_id text,
  status text not null default 'active' check (status in ('active','trialing','past_due','canceled','incomplete')),
  current_period_end timestamptz,
  cancel_at timestamptz,
  canceled_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists user_subscriptions_user_product_active_idx
  on public.user_subscriptions (user_id, product_slug)
  where status in ('active','trialing','past_due');
create unique index if not exists user_subscriptions_stripe_idx
  on public.user_subscriptions (stripe_subscription_id)
  where stripe_subscription_id is not null;

-- Usage events
create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  product_slug text not null references public.products (slug) on delete cascade,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists usage_events_user_idx
  on public.usage_events (user_id, product_slug, event_type);

-- Updated_at trigger helper (reuse existing helper if present)
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_touch_updated_at
  before update on public.products
  for each row
  execute function public.touch_updated_at();

create trigger user_subscriptions_touch_updated_at
  before update on public.user_subscriptions
  for each row
  execute function public.touch_updated_at();

-- Access helpers
create or replace function public.has_access_to_product(
  p_product_slug text,
  p_user_id uuid default auth.uid()
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_slug text;
begin
  if p_user_id is null or p_product_slug is null then
    return false;
  end if;

  select role into v_role from public.profiles where id = p_user_id;
  if v_role in ('admin','superadmin') then
    return true;
  end if;

  select slug into v_slug from public.products
  where slug = p_product_slug and is_active = true;

  if not found then
    return false;
  end if;

  if exists (
    select 1
    from public.user_subscriptions s
    where s.user_id = p_user_id
      and s.product_slug = p_product_slug
      and s.status in ('active','trialing','past_due')
  ) then
    return true;
  end if;

  if exists (
    select 1
    from public.user_subscriptions s
    join public.products bundle on bundle.slug = s.product_slug
    where s.user_id = p_user_id
      and s.status in ('active','trialing','past_due')
      and bundle.is_bundle = true
      and p_product_slug = any(bundle.bundle_items)
  ) then
    return true;
  end if;

  return false;
end;
$$;

create or replace function public.get_user_products(
  p_user_id uuid default auth.uid()
)
returns table (
  product_slug text,
  product_name text,
  access_via text,
  status text,
  current_period_end timestamptz,
  bundle_source text,
  role text
)
language sql
security definer
set search_path = public
as $$
with role_info as (
  select coalesce(role, 'user') as role
  from public.profiles
  where id = p_user_id
),
base_access as (
  select
    p.slug as product_slug,
    p.name as product_name,
    'subscription'::text as access_via,
    s.status,
    s.current_period_end,
    null::text as bundle_source
  from public.user_subscriptions s
  join public.products p on p.slug = s.product_slug
  where s.user_id = p_user_id
    and s.status in ('active','trialing','past_due')
),
bundle_access as (
  select
    target.slug as product_slug,
    target.name as product_name,
    'bundle'::text as access_via,
    s.status,
    s.current_period_end,
    s.product_slug as bundle_source
  from public.user_subscriptions s
  join public.products bundle on bundle.slug = s.product_slug and bundle.is_bundle
  join public.products target on target.slug = any(bundle.bundle_items)
  where s.user_id = p_user_id
    and s.status in ('active','trialing','past_due')
),
admin_access as (
  select
    p.slug as product_slug,
    p.name as product_name,
    'role'::text as access_via,
    'active'::text as status,
    null::timestamptz as current_period_end,
    null::text as bundle_source
  from public.products p
  join role_info ri on ri.role in ('admin','superadmin')
  where p.is_active = true
)
select distinct on (product_slug)
  product_slug,
  product_name,
  access_via,
  status,
  current_period_end,
  bundle_source,
  (select role from role_info)
from (
  select * from base_access
  union all
  select * from bundle_access
  union all
  select * from admin_access
) combined
order by product_slug, access_via = 'role' desc, access_via = 'bundle' desc;
$$;

-- RLS policies
alter table if exists public.products enable row level security;
alter table if exists public.user_subscriptions enable row level security;
alter table if exists public.usage_events enable row level security;
alter table if exists public.profiles enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where policyname = 'products_select_all'
      and tablename = 'products'
      and schemaname = 'public'
  ) then
    create policy products_select_all on public.products for select using (true);
  end if;
  if not exists (
    select 1 from pg_policies
    where policyname = 'products_admin_manage'
      and tablename = 'products'
      and schemaname = 'public'
  ) then
    create policy products_admin_manage on public.products
      for all using (
        auth.role() = 'service_role' or exists (
          select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','superadmin')
        )
      ) with check (
        auth.role() = 'service_role' or exists (
          select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','superadmin')
        )
      );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where policyname = 'subscriptions_select_own'
      and tablename = 'user_subscriptions'
      and schemaname = 'public'
  ) then
    create policy subscriptions_select_own on public.user_subscriptions
      for select using (
        user_id = auth.uid() or auth.role() = 'service_role' or exists (
          select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','superadmin')
        )
      );
  end if;
  if not exists (
    select 1 from pg_policies
    where policyname = 'subscriptions_write_service_or_admin'
      and tablename = 'user_subscriptions'
      and schemaname = 'public'
  ) then
    create policy subscriptions_write_service_or_admin on public.user_subscriptions
      for all using (
        auth.role() = 'service_role' or exists (
          select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','superadmin')
        )
      ) with check (
        auth.role() = 'service_role' or exists (
          select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','superadmin')
        )
      );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where policyname = 'usage_events_select_own'
      and tablename = 'usage_events'
      and schemaname = 'public'
  ) then
    create policy usage_events_select_own on public.usage_events
      for select using (
        user_id = auth.uid() or auth.role() = 'service_role' or exists (
          select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','superadmin')
        )
      );
  end if;
  if not exists (
    select 1 from pg_policies
    where policyname = 'usage_events_insert_guarded'
      and tablename = 'usage_events'
      and schemaname = 'public'
  ) then
    create policy usage_events_insert_guarded on public.usage_events
      for insert with check (
        (user_id = auth.uid() and has_access_to_product(product_slug, auth.uid()))
        or auth.role() = 'service_role'
        or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','superadmin'))
      );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where policyname = 'profiles_select_self_or_admin'
      and tablename = 'profiles'
      and schemaname = 'public'
  ) then
    create policy profiles_select_self_or_admin on public.profiles
      for select using (
        id = auth.uid() or auth.role() = 'service_role' or exists (
          select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','superadmin')
        )
      );
  end if;
  if not exists (
    select 1 from pg_policies
    where policyname = 'profiles_update_self_or_admin'
      and tablename = 'profiles'
      and schemaname = 'public'
  ) then
    create policy profiles_update_self_or_admin on public.profiles
      for update using (
        id = auth.uid() or auth.role() = 'service_role' or exists (
          select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','superadmin')
        )
      ) with check (
        id = auth.uid() or auth.role() = 'service_role' or exists (
          select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','superadmin')
        )
      );
  end if;
end $$;

-- Ensure role defaults and statuses are consistent
update public.profiles set role = 'user' where role is null;

commit;
