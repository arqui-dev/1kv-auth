begin;

-- Ensure user_id columns point to auth.users (and thus profiles.id)
alter table public.user_subscriptions
  drop constraint if exists user_subscriptions_user_id_fkey;

alter table public.user_subscriptions
  add constraint user_subscriptions_user_id_fkey
  foreign key (user_id) references auth.users (id) on delete cascade;

alter table public.usage_events
  drop constraint if exists usage_events_user_id_fkey;

alter table public.usage_events
  add constraint usage_events_user_id_fkey
  foreign key (user_id) references auth.users (id) on delete cascade;

-- Helpful index for lookups by user_id
create index if not exists user_subscriptions_user_idx on public.user_subscriptions (user_id);

commit;
