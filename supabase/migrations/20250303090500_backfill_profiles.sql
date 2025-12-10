begin;

-- Backfill missing profiles for existing auth.users to avoid 406 on .single()
insert into public.profiles (
  id,
  first_name,
  last_name,
  birthdate,
  has_access,
  license_valid_until,
  phone,
  role,
  created_at,
  updated_at
)
select
  u.id,
  coalesce(nullif(u.raw_user_meta_data->>'first_name', ''), 'Usuário') as first_name,
  coalesce(nullif(u.raw_user_meta_data->>'last_name', ''), '1kvideos') as last_name,
  coalesce(nullif(u.raw_user_meta_data->>'birthdate', '')::date, timezone('utc', now())::date) as birthdate,
  coalesce((u.raw_user_meta_data->>'has_access')::boolean, false) as has_access,
  nullif(u.raw_user_meta_data->>'license_valid_until', '')::date as license_valid_until,
  nullif(u.raw_user_meta_data->>'phone', '') as phone,
  'user' as role,
  timezone('utc', now()),
  timezone('utc', now())
from auth.users u
where not exists (
  select 1 from public.profiles p where p.id = u.id
);

commit;
