-- ════════════════════════════════════════════════════════════════════
--  Skyhigh — initial schema
--  Tables: admin_users, enquiries, services, destinations, packages, site_settings
--  Security: Row Level Security on every table; admin rights via is_admin().
-- ════════════════════════════════════════════════════════════════════


-- ── Roles ───────────────────────────────────────────────────────────
-- Administrators are Supabase Auth users listed here. Add the first admin
-- manually (see README): insert into admin_users (user_id, role) values ('<uuid>', 'admin');
create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  role       text not null default 'editor' check (role in ('admin', 'editor')),
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid() and role = 'admin');
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.is_owner() from public;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_owner() to authenticated;

drop policy if exists "admins read admin list" on public.admin_users;
create policy "admins read admin list" on public.admin_users
  for select to authenticated using (public.is_admin());
drop policy if exists "owners manage admin list" on public.admin_users;
create policy "owners manage admin list" on public.admin_users
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

-- ── Enquiries ───────────────────────────────────────────────────────
create table if not exists public.enquiries (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  full_name   text not null check (char_length(full_name) between 2 and 80),
  email       text not null check (char_length(email) <= 160 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone       text not null check (phone ~ '^\+?[0-9 ()-]{7,20}$'),
  service     text not null check (service in ('tour','transport-passenger','transport-goods','logistics','booking','corporate','custom-package')),
  departure   text not null check (char_length(departure) between 2 and 120),
  destination text not null check (char_length(destination) between 2 and 120),
  travel_date date not null,
  travellers  int check (travellers between 1 and 500),
  budget      text check (char_length(budget) <= 60),
  details     jsonb not null default '{}'::jsonb check (pg_column_size(details) < 4000),
  message     text check (char_length(message) <= 2000),
  consent     boolean not null check (consent = true),
  status      text not null default 'new' check (status in ('new','contacted','quoted','closed','spam')),
  admin_notes text check (char_length(admin_notes) <= 4000),
  source_page text check (char_length(source_page) <= 200)
);
create index if not exists enquiries_created_idx on public.enquiries (created_at desc);
create index if not exists enquiries_status_idx on public.enquiries (status);
create index if not exists enquiries_email_idx on public.enquiries (lower(email), created_at desc);
alter table public.enquiries enable row level security;

-- Public visitors may only INSERT a fresh enquiry; they can never read any.
drop policy if exists "public can submit enquiries" on public.enquiries;
create policy "public can submit enquiries" on public.enquiries
  for insert to anon, authenticated
  with check (status = 'new' and admin_notes is null and consent = true);
drop policy if exists "admins read enquiries" on public.enquiries;
create policy "admins read enquiries" on public.enquiries
  for select to authenticated using (public.is_admin());
drop policy if exists "admins update enquiries" on public.enquiries;
create policy "admins update enquiries" on public.enquiries
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "owners delete enquiries" on public.enquiries;
create policy "owners delete enquiries" on public.enquiries
  for delete to authenticated using (public.is_owner());

-- Server-side spam protection: max 5 enquiries per email per hour, 30 per hour overall burst guard,
-- and strip angle brackets from free text.
create or replace function public.enquiries_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_by_email int;
  recent_total int;
begin
  if new.travel_date < (now() at time zone 'Asia/Kolkata')::date - 1 then
    raise exception 'travel date must be today or later' using errcode = '23514';
  end if;
  select count(*) into recent_by_email from public.enquiries
    where lower(email) = lower(new.email) and created_at > now() - interval '1 hour';
  if recent_by_email >= 5 then
    raise exception 'rate limit: too many enquiries from this email' using errcode = 'P0001';
  end if;
  select count(*) into recent_total from public.enquiries where created_at > now() - interval '5 minutes';
  if recent_total >= 30 then
    raise exception 'rate limit: please try again shortly' using errcode = 'P0001';
  end if;
  new.full_name   := regexp_replace(new.full_name, '[<>]', '', 'g');
  new.departure   := regexp_replace(new.departure, '[<>]', '', 'g');
  new.destination := regexp_replace(new.destination, '[<>]', '', 'g');
  new.message     := regexp_replace(coalesce(new.message, ''), '[<>]', '', 'g');
  new.email       := lower(trim(new.email));
  new.status      := 'new';
  new.admin_notes := null;
  return new;
end;
$$;
drop trigger if exists enquiries_before_insert on public.enquiries;
create trigger enquiries_before_insert before insert on public.enquiries
  for each row execute function public.enquiries_before_insert();

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end; $$;
drop trigger if exists enquiries_touch on public.enquiries;
create trigger enquiries_touch before update on public.enquiries
  for each row execute function public.touch_updated_at();

-- ── Content (services, destinations, packages) ─────────────────────
-- Each row stores the full typed object in `data` (mirrors src/types/content.ts).
do $$
declare t text;
begin
  foreach t in array array['services','destinations','packages'] loop
    execute format($f$
      create table if not exists public.%1$I (
        id         uuid primary key default gen_random_uuid(),
        slug       text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
        data       jsonb not null,
        published  boolean not null default true,
        sort       int not null default 0,
        updated_at timestamptz not null default now()
      );
      alter table public.%1$I enable row level security;
      drop policy if exists "public reads published %1$s" on public.%1$I;
      create policy "public reads published %1$s" on public.%1$I
        for select to anon, authenticated using (published or public.is_admin());
      drop policy if exists "admins write %1$s" on public.%1$I;
      create policy "admins write %1$s" on public.%1$I
        for all to authenticated using (public.is_admin()) with check (public.is_admin());
      drop trigger if exists %1$s_touch on public.%1$I;
      create trigger %1$s_touch before update on public.%1$I
        for each row execute function public.touch_updated_at();
    $f$, t);
  end loop;
end $$;

-- ── Site settings (contact, seo) ───────────────────────────────────
create table if not exists public.site_settings (
  key        text primary key check (key in ('contact', 'seo')),
  value      jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.site_settings enable row level security;
drop policy if exists "public reads settings" on public.site_settings;
create policy "public reads settings" on public.site_settings
  for select to anon, authenticated using (true);
drop policy if exists "admins write settings" on public.site_settings;
create policy "admins write settings" on public.site_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Grants (RLS still applies)
grant usage on schema public to anon, authenticated;
grant insert on public.enquiries to anon, authenticated;
grant select, update, delete on public.enquiries to authenticated;
grant select on public.services, public.destinations, public.packages, public.site_settings to anon, authenticated;
grant insert, update, delete on public.services, public.destinations, public.packages, public.site_settings to authenticated;
grant select, insert, update, delete on public.admin_users to authenticated;
