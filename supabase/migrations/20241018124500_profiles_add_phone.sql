begin;

alter table public.profiles
  add column if not exists phone text;

comment on column public.profiles.phone is 'Optional phone number captured at signup or during profile updates.';

commit;
