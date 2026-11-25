-- ════════════════════════════════════════════════════════════════════
--  Skyhigh CMS — team invites, roles, editable page copy, photo storage
--  Safe to run more than once.
-- ════════════════════════════════════════════════════════════════════

-- ── Editable website copy keys ─────────────────────────────────────
alter table public.site_settings drop constraint if exists site_settings_key_check;
alter table public.site_settings add constraint site_settings_key_check
  check (key in ('contact', 'seo', 'home', 'company', 'pages', 'faqs', 'legal'));

-- ── Roles: editors edit, owners (role = 'admin') also delete & manage team ──
create or replace function public.my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.admin_users where user_id = auth.uid();
$$;
revoke all on function public.my_role() from public;
grant execute on function public.my_role() to authenticated;

-- Content: anyone on the team can create/edit, only owners can delete.
do $$
declare t text;
begin
  foreach t in array array['services','destinations','packages'] loop
    execute format('drop policy if exists "admins write %1$s" on public.%1$I', t);
    execute format('drop policy if exists "team inserts %1$s" on public.%1$I', t);
    execute format('drop policy if exists "team updates %1$s" on public.%1$I', t);
    execute format('drop policy if exists "owners delete %1$s" on public.%1$I', t);
    execute format('create policy "team inserts %1$s" on public.%1$I for insert to authenticated with check (public.is_admin())', t);
    execute format('create policy "team updates %1$s" on public.%1$I for update to authenticated using (public.is_admin()) with check (public.is_admin())', t);
    execute format('create policy "owners delete %1$s" on public.%1$I for delete to authenticated using (public.is_owner())', t);
  end loop;
end $$;

-- ── Team invites ───────────────────────────────────────────────────
create table if not exists public.admin_invites (
  email      text primary key check (email = lower(email) and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  role       text not null default 'editor' check (role in ('admin', 'editor')),
  invited_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.admin_invites enable row level security;
drop policy if exists "owners read invites" on public.admin_invites;
create policy "owners read invites" on public.admin_invites for select to authenticated using (public.is_owner());

-- Called right after sign-in: turns a pending invite for this email into team membership.
create or replace function public.claim_invite()
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_email text;
  v_role text;
begin
  if auth.uid() is null then return false; end if;
  select lower(email) into v_email from auth.users where id = auth.uid();
  select role into v_role from public.admin_invites where email = v_email;
  if v_role is null then return false; end if;
  insert into public.admin_users (user_id, role) values (auth.uid(), v_role)
    on conflict (user_id) do update set role = excluded.role;
  delete from public.admin_invites where email = v_email;
  return true;
end;
$$;

create or replace function public.list_team()
returns table (user_id uuid, email text, role text, pending boolean, created_at timestamptz)
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  if not public.is_owner() then raise exception 'only owners can view the team' using errcode = '42501'; end if;
  return query
    select a.user_id, u.email::text, a.role, false, a.created_at
      from public.admin_users a join auth.users u on u.id = a.user_id
    union all
    select null::uuid, i.email, i.role, true, i.created_at from public.admin_invites i
    order by 5;
end;
$$;

create or replace function public.invite_member(p_email text, p_role text)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_email text := lower(trim(p_email));
  v_uid uuid;
begin
  if not public.is_owner() then raise exception 'only owners can invite people' using errcode = '42501'; end if;
  if p_role not in ('admin', 'editor') then raise exception 'invalid role'; end if;
  select id into v_uid from auth.users where lower(email) = v_email;
  if v_uid is not null then
    insert into public.admin_users (user_id, role) values (v_uid, p_role)
      on conflict (user_id) do update set role = excluded.role;
  else
    insert into public.admin_invites (email, role, invited_by) values (v_email, p_role, auth.uid())
      on conflict (email) do update set role = excluded.role, invited_by = excluded.invited_by;
  end if;
end;
$$;

create or replace function public.remove_member(p_email text)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_email text := lower(trim(p_email));
  v_uid uuid;
begin
  if not public.is_owner() then raise exception 'only owners can remove people' using errcode = '42501'; end if;
  select id into v_uid from auth.users where lower(email) = v_email;
  if v_uid = auth.uid() then raise exception 'you cannot remove yourself'; end if;
  if v_uid is not null
     and (select role from public.admin_users where user_id = v_uid) = 'admin'
     and (select count(*) from public.admin_users where role = 'admin') <= 1 then
    raise exception 'the last owner cannot be removed';
  end if;
  delete from public.admin_users where user_id = v_uid;
  delete from public.admin_invites where email = v_email;
end;
$$;

revoke all on function public.claim_invite() from public;
revoke all on function public.list_team() from public;
revoke all on function public.invite_member(text, text) from public;
revoke all on function public.remove_member(text) from public;
grant execute on function public.claim_invite() to authenticated;
grant execute on function public.list_team() to authenticated;
grant execute on function public.invite_member(text, text) to authenticated;
grant execute on function public.remove_member(text) to authenticated;
grant select on public.admin_invites to authenticated;

-- ── Photo storage ──────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/webp', 'image/jpeg', 'image/png', 'image/avif', 'image/gif'])
on conflict (id) do update
  set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "media is public" on storage.objects;
drop policy if exists "team uploads media" on storage.objects;
drop policy if exists "team updates media" on storage.objects;
drop policy if exists "owners delete media" on storage.objects;
create policy "media is public" on storage.objects for select using (bucket_id = 'media');
create policy "team uploads media" on storage.objects for insert to authenticated with check (bucket_id = 'media' and public.is_admin());
create policy "team updates media" on storage.objects for update to authenticated using (bucket_id = 'media' and public.is_admin());
create policy "owners delete media" on storage.objects for delete to authenticated using (bucket_id = 'media' and public.is_owner());
