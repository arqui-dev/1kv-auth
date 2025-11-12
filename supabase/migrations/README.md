# Running Supabase Migrations via SQL Editor

We now run database changes directly from the Supabase Dashboard. This keeps things simple—no local CLI setup or scripts are required.

## How to Apply the Current Migration
1. Sign in to https://supabase.com/dashboard and open the project `lnjqfautqugtwzxptjzr`.
2. Go to **SQL Editor → New query**.
3. Run the following statements in order (they mirror `20241018120000_profiles_table.sql`). You can paste them one by one or as a single script.

### 1. Timestamp helper function
```sql
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;
```

### 2. Profiles table
```sql
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  birthdate date not null,
  has_access boolean not null default false,
  license_valid_until date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
```

### 3. Helpful comments
```sql
comment on table public.profiles is 'Additional user metadata for 1kvideos accounts.';
comment on column public.profiles.has_access is 'True when the user has an active 1kvideos license.';
comment on column public.profiles.license_valid_until is 'Date when the license expires (UTC).';
```

### 4. Updated-at trigger
```sql
create trigger handle_profiles_updated_at
before update on public.profiles
for each row
execute function public.handle_updated_at();
```

### 5. Enable row-level security
```sql
alter table public.profiles enable row level security;
```

### 6. User-facing policies
```sql
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where policyname = 'Users select own profile'
      and tablename = 'profiles'
      and schemaname = 'public'
  ) then
    create policy "Users select own profile"
      on public.profiles
      for select
      using (auth.uid() = id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where policyname = 'Users upsert own profile'
      and tablename = 'profiles'
      and schemaname = 'public'
  ) then
    create policy "Users upsert own profile"
      on public.profiles
      for insert
      with check (auth.uid() = id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where policyname = 'Users update own profile'
      and tablename = 'profiles'
      and schemaname = 'public'
  ) then
    create policy "Users update own profile"
      on public.profiles
      for update
      using (auth.uid() = id)
      with check (auth.uid() = id);
  end if;
end;
$$;
```

> **Tip:** If you prefer to keep everything transactional, wrap the entire script with `begin;` at the top and `commit;` at the bottom.

After running the statements, the `profiles` table will be ready for the signup/login changes already merged in the frontend.

## Auto-populate profiles (20241018123000)
To avoid row-level security errors right after sign-up, mirror every new Supabase user into `public.profiles` using a trigger. Run the script below once the base table exists.

```sql
begin;

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

  insert into public.profiles (
    id,
    first_name,
    last_name,
    birthdate,
    has_access,
    license_valid_until
  )
  values (
    new.id,
    v_first_name,
    v_last_name,
    v_birthdate,
    v_has_access,
    v_license_until
  )
  on conflict (id)
    do update set
      first_name = excluded.first_name,
      last_name = excluded.last_name,
      birthdate = excluded.birthdate,
      has_access = excluded.has_access,
      license_valid_until = excluded.license_valid_until,
      updated_at = timezone('utc', now());

  return new;
end;
$$ language plpgsql
   security definer
   set search_path = public;

drop trigger if exists on_auth_user_profile on auth.users;

create trigger on_auth_user_profile
  after insert on auth.users
  for each row
  execute function public.handle_new_user_profile();

commit;
```

Once this function and trigger are in place, every successful sign-up that includes the extra metadata automatically seeds the `profiles` row, so the frontend no longer needs to call the `profiles` table directly.

## Add optional phone field (20241018124500)
Execute this snippet to add the new `phone` column used by the signup/profile editor:

```sql
begin;

alter table public.profiles
  add column if not exists phone text;

comment on column public.profiles.phone is 'Optional phone number captured at signup or during profile updates.';

commit;
```
