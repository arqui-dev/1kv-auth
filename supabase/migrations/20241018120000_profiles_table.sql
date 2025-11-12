begin;

-- Ensure helper function exists to maintain updated_at timestamps
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

-- User profile table linked 1:1 with auth.users
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

comment on table public.profiles is 'Additional user metadata for 1kvideos accounts.';
comment on column public.profiles.has_access is 'True when the user has an active 1kvideos license.';
comment on column public.profiles.license_valid_until is 'Date when the license expires (UTC).';

-- Keep updated_at automatically in sync
create trigger handle_profiles_updated_at
before update on public.profiles
for each row
execute function public.handle_updated_at();

-- Row level security keeps user data isolated
alter table public.profiles enable row level security;

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

commit;
