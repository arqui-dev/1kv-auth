begin;

-- Automatically mirror Supabase auth metadata into public.profiles
create or replace function public.handle_new_user_profile()
returns trigger as $$
declare
  v_first_name text;
  v_last_name text;
  v_birthdate_text text;
  v_birthdate date;
  v_has_access boolean;
  v_license_until_text text;
  v_license_until date;
  v_phone text;
begin
  v_first_name := coalesce(nullif(new.raw_user_meta_data->>'first_name', ''), 'Usuário');
  v_last_name := coalesce(nullif(new.raw_user_meta_data->>'last_name', ''), '1kvideos');

  v_birthdate_text := nullif(new.raw_user_meta_data->>'birthdate', '');
  if v_birthdate_text is not null then
    v_birthdate := v_birthdate_text::date;
  else
    v_birthdate := timezone('utc', now())::date;
  end if;

  v_has_access := coalesce((new.raw_user_meta_data->>'has_access')::boolean, false);

  v_license_until_text := nullif(new.raw_user_meta_data->>'license_valid_until', '');
  if v_license_until_text is not null then
    v_license_until := v_license_until_text::date;
  else
    v_license_until := null;
  end if;
  v_phone := nullif(new.raw_user_meta_data->>'phone', '');

  insert into public.profiles (
    id,
    first_name,
    last_name,
    birthdate,
    has_access,
    license_valid_until,
    phone
  )
  values (
    new.id,
    v_first_name,
    v_last_name,
    v_birthdate,
    v_has_access,
    v_license_until,
    v_phone
  )
  on conflict (id)
    do update set
      first_name = excluded.first_name,
      last_name = excluded.last_name,
      birthdate = excluded.birthdate,
      has_access = excluded.has_access,
      license_valid_until = excluded.license_valid_until,
      phone = excluded.phone,
      updated_at = timezone('utc', now());

  return new;
end;
$$ language plpgsql
   security definer
   set search_path = public;

-- Ensure trigger is unique
drop trigger if exists on_auth_user_profile on auth.users;

create trigger on_auth_user_profile
  after insert on auth.users
  for each row
  execute function public.handle_new_user_profile();

commit;
