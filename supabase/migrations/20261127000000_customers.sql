-- Customer accounts, booking requests, reviews and travel-agent (B2B) rates.
-- Idempotent: safe to run more than once.
--
-- Security model
--  * Customers sign up with email + password (Supabase Auth). A profile row is created for them automatically.
--  * Customers can only ever see and change their own profile, bookings and reviews.
--  * Prices on a booking are filled in by the database from the package / agent rate — never trusted from the browser.
--  * Agent status can only be changed by the admin; agent rates are readable only by approved agents and the admin.
--  * Admin access still comes only from public.admin_users (a customer account never becomes an admin).

-- ── Profiles ─────────────────────────────────────────────────────────
create table if not exists public.customer_profiles (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  full_name    text not null default '' check (char_length(full_name) <= 120),
  phone        text not null default '' check (char_length(phone) <= 30),
  city         text not null default '' check (char_length(city) <= 80),
  agent_status text not null default 'none' check (agent_status in ('none', 'pending', 'approved', 'rejected')),
  agency_name  text not null default '' check (char_length(agency_name) <= 160),
  agency_gstin text not null default '' check (char_length(agency_gstin) <= 20),
  agency_note  text not null default '' check (char_length(agency_note) <= 1000),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table public.customer_profiles enable row level security;

drop policy if exists "own profile readable" on public.customer_profiles;
create policy "own profile readable" on public.customer_profiles
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists "own profile editable" on public.customer_profiles;
create policy "own profile editable" on public.customer_profiles
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Customers may only edit these columns themselves; agent status goes through the functions below.
revoke all on public.customer_profiles from anon, authenticated;
grant select on public.customer_profiles to authenticated;
grant update (full_name, phone, city) on public.customer_profiles to authenticated;

-- Create a profile for every new login (name and phone come from the sign-up form).
create or replace function public.handle_new_customer()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.customer_profiles (user_id, full_name, phone)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 120),
    left(coalesce(new.raw_user_meta_data ->> 'phone', ''), 30)
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created_customer on auth.users;
create trigger on_auth_user_created_customer after insert on auth.users
  for each row execute function public.handle_new_customer();

-- Profiles for accounts that existed before this migration.
insert into public.customer_profiles (user_id)
select id from auth.users on conflict (user_id) do nothing;

create or replace function public.is_approved_agent()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.customer_profiles where user_id = auth.uid() and agent_status = 'approved');
$$;
revoke all on function public.is_approved_agent() from public;
grant execute on function public.is_approved_agent() to authenticated;

-- A customer applies to become a travel agent.
create or replace function public.request_agent_access(p_agency text, p_gstin text, p_note text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'sign in first' using errcode = '42501'; end if;
  if char_length(coalesce(trim(p_agency), '')) < 2 then raise exception 'Please enter your agency name'; end if;
  update public.customer_profiles
     set agent_status = case when agent_status = 'approved' then 'approved' else 'pending' end,
         agency_name  = left(trim(p_agency), 160),
         agency_gstin = left(upper(trim(coalesce(p_gstin, ''))), 20),
         agency_note  = left(trim(coalesce(p_note, '')), 1000),
         updated_at   = now()
   where user_id = auth.uid();
end;
$$;
revoke all on function public.request_agent_access(text, text, text) from public;
grant execute on function public.request_agent_access(text, text, text) to authenticated;

-- Admin: approve / reject an agent.
create or replace function public.set_agent_status(p_user uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'admins only' using errcode = '42501'; end if;
  if p_status not in ('none', 'pending', 'approved', 'rejected') then raise exception 'bad status'; end if;
  update public.customer_profiles set agent_status = p_status, updated_at = now() where user_id = p_user;
end;
$$;
revoke all on function public.set_agent_status(uuid, text) from public;
grant execute on function public.set_agent_status(uuid, text) to authenticated;

-- Admin: customer list with emails (auth.users is not readable directly).
create or replace function public.admin_list_customers()
returns table (
  user_id uuid, email text, full_name text, phone text, city text,
  agent_status text, agency_name text, agency_gstin text, agency_note text,
  created_at timestamptz, last_sign_in_at timestamptz, bookings bigint, is_admin boolean
)
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin() then raise exception 'admins only' using errcode = '42501'; end if;
  return query
    select p.user_id, u.email::text, p.full_name, p.phone, p.city,
           p.agent_status, p.agency_name, p.agency_gstin, p.agency_note,
           u.created_at, u.last_sign_in_at,
           (select count(*) from public.bookings b where b.user_id = p.user_id),
           exists (select 1 from public.admin_users a where a.user_id = p.user_id)
      from public.customer_profiles p
      join auth.users u on u.id = p.user_id
     order by u.created_at desc;
end;
$$;

-- ── Agent (B2B) rates ────────────────────────────────────────────────
create table if not exists public.agent_rates (
  package_slug     text primary key check (char_length(package_slug) between 1 and 120),
  price_per_person numeric(12, 2) not null check (price_per_person > 0),
  note             text not null default '' check (char_length(note) <= 300),
  updated_at       timestamptz not null default now()
);
alter table public.agent_rates enable row level security;
drop policy if exists "agents and admin read rates" on public.agent_rates;
create policy "agents and admin read rates" on public.agent_rates
  for select to authenticated using (public.is_admin() or public.is_approved_agent());
drop policy if exists "admin writes rates" on public.agent_rates;
create policy "admin writes rates" on public.agent_rates
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
revoke all on public.agent_rates from anon;

-- ── Bookings ─────────────────────────────────────────────────────────
create table if not exists public.bookings (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  package_slug     text not null check (char_length(package_slug) between 1 and 120),
  package_title    text not null check (char_length(package_title) between 1 and 200),
  travel_date      date not null,
  adults           int  not null check (adults between 1 and 60),
  children         int  not null default 0 check (children between 0 and 60),
  contact_name     text not null check (char_length(contact_name) between 2 and 120),
  contact_phone    text not null check (char_length(contact_phone) between 6 and 30),
  contact_email    text,
  notes            text check (char_length(notes) <= 2000),
  price_per_person numeric(12, 2),
  rate_type        text not null default 'public' check (rate_type in ('public', 'agent')),
  status           text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  admin_notes      text check (char_length(admin_notes) <= 4000),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists bookings_user_idx on public.bookings (user_id, created_at desc);
create index if not exists bookings_status_idx on public.bookings (status, created_at desc);
alter table public.bookings enable row level security;

drop policy if exists "customers create own bookings" on public.bookings;
create policy "customers create own bookings" on public.bookings
  for insert to authenticated with check (user_id = auth.uid() and status = 'pending' and admin_notes is null);
drop policy if exists "own bookings readable" on public.bookings;
create policy "own bookings readable" on public.bookings
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists "admin updates bookings" on public.bookings;
create policy "admin updates bookings" on public.bookings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "owner deletes bookings" on public.bookings;
create policy "owner deletes bookings" on public.bookings
  for delete to authenticated using (public.is_owner());
revoke all on public.bookings from anon;

-- Fill in trusted values on every new booking.
create or replace function public.prepare_booking()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_agent numeric;
  v_public numeric;
  v_title text;
begin
  if new.travel_date < current_date then raise exception 'Travel date must be today or later'; end if;
  if (select count(*) from public.bookings where user_id = new.user_id and status = 'pending') >= 10 then
    raise exception 'You already have 10 pending booking requests. Please wait for us to confirm them.';
  end if;
  select email into new.contact_email from auth.users where id = new.user_id;

  select nullif(data ->> 'pricePerPerson', '')::numeric, data ->> 'title'
    into v_public, v_title
    from public.packages where slug = new.package_slug and published;
  if v_title is not null then new.package_title := left(v_title, 200); end if;

  if public.is_approved_agent() then
    select price_per_person into v_agent from public.agent_rates where package_slug = new.package_slug;
  end if;
  if v_agent is not null then
    new.price_per_person := v_agent;
    new.rate_type := 'agent';
  else
    new.price_per_person := v_public;
    new.rate_type := 'public';
  end if;
  new.status := 'pending';
  new.created_at := now();
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists bookings_prepare on public.bookings;
create trigger bookings_prepare before insert on public.bookings
  for each row execute function public.prepare_booking();

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists bookings_touch on public.bookings;
create trigger bookings_touch before update on public.bookings
  for each row execute function public.touch_updated_at();

-- A customer may cancel their own booking while it is still pending.
create or replace function public.cancel_my_booking(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.bookings set status = 'cancelled'
   where id = p_id and user_id = auth.uid() and status = 'pending';
  if not found then raise exception 'Only pending bookings can be cancelled online. Please contact us.'; end if;
end;
$$;
revoke all on function public.cancel_my_booking(uuid) from public;
grant execute on function public.cancel_my_booking(uuid) to authenticated;

-- ── Reviews ──────────────────────────────────────────────────────────
create table if not exists public.reviews (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  package_slug text not null check (char_length(package_slug) between 1 and 120),
  rating       int  not null check (rating between 1 and 5),
  title        text not null default '' check (char_length(title) <= 120),
  body         text not null check (char_length(body) between 10 and 2000),
  author_name  text not null check (char_length(author_name) between 2 and 80),
  status       text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at   timestamptz not null default now(),
  unique (user_id, package_slug)
);
create index if not exists reviews_pkg_idx on public.reviews (package_slug, status, created_at desc);
alter table public.reviews enable row level security;

-- Only customers with a confirmed or completed booking for that package can review it.
drop policy if exists "travellers write reviews" on public.reviews;
create policy "travellers write reviews" on public.reviews
  for insert to authenticated with check (
    user_id = auth.uid() and status = 'pending'
    and exists (
      select 1 from public.bookings b
       where b.user_id = auth.uid() and b.package_slug = reviews.package_slug and b.status in ('confirmed', 'completed')
    )
  );
drop policy if exists "approved reviews are public" on public.reviews;
create policy "approved reviews are public" on public.reviews
  for select to anon, authenticated using (status = 'approved' or user_id = auth.uid() or public.is_admin());
drop policy if exists "admin moderates reviews" on public.reviews;
create policy "admin moderates reviews" on public.reviews
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin deletes reviews" on public.reviews;
create policy "admin deletes reviews" on public.reviews
  for delete to authenticated using (public.is_admin());

-- Anonymous visitors only need the public columns.
revoke all on public.reviews from anon;
grant select (id, package_slug, rating, title, body, author_name, status, created_at) on public.reviews to anon;

revoke all on function public.admin_list_customers() from public;
grant execute on function public.admin_list_customers() to authenticated;
