begin;

-- Helper to avoid policy recursion (not used on profiles policies)
create or replace function public.is_admin(p_user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.profiles where id = p_user_id and role in ('admin','superadmin')
  );
$$;

-- Rebuild policies to avoid recursion on profiles and loosen usage_events insert
drop policy if exists products_admin_manage on public.products;
create policy products_admin_manage on public.products
  for all using (
    auth.role() = 'service_role' or public.is_admin(auth.uid())
  ) with check (
    auth.role() = 'service_role' or public.is_admin(auth.uid())
  );

drop policy if exists subscriptions_select_own on public.user_subscriptions;
create policy subscriptions_select_own on public.user_subscriptions
  for select using (
    user_id = auth.uid() or auth.role() = 'service_role' or public.is_admin(auth.uid())
  );

drop policy if exists subscriptions_write_service_or_admin on public.user_subscriptions;
create policy subscriptions_write_service_or_admin on public.user_subscriptions
  for all using (
    auth.role() = 'service_role' or public.is_admin(auth.uid())
  ) with check (
    auth.role() = 'service_role' or public.is_admin(auth.uid())
  );

drop policy if exists usage_events_select_own on public.usage_events;
create policy usage_events_select_own on public.usage_events
  for select using (
    user_id = auth.uid() or auth.role() = 'service_role' or public.is_admin(auth.uid())
  );

drop policy if exists usage_events_insert_guarded on public.usage_events;
create policy usage_events_insert_guarded on public.usage_events
  for insert with check (
    user_id = auth.uid() or auth.role() = 'service_role' or public.is_admin(auth.uid())
  );

drop policy if exists profiles_select_self_or_admin on public.profiles;
create policy profiles_select_self_or_admin on public.profiles
  for select using (
    id = auth.uid() or auth.role() = 'service_role'
  );

drop policy if exists profiles_update_self_or_admin on public.profiles;
create policy profiles_update_self_or_admin on public.profiles
  for update using (
    id = auth.uid() or auth.role() = 'service_role'
  ) with check (
    id = auth.uid() or auth.role() = 'service_role'
  );

commit;
