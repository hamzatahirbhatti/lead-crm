-- =====================================================================
-- Lead CRM — database schema
-- Run this ONCE in your Supabase project:
--   Supabase Dashboard -> SQL Editor -> New query -> paste all -> Run
-- =====================================================================

-- ---------- PROFILES (one row per logged-in user) --------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users on delete cascade,
  email      text,
  full_name  text,
  role       text not null default 'bd' check (role in ('admin', 'bd')),
  created_at timestamptz not null default now()
);

-- ---------- LEADS ----------------------------------------------------
create table if not exists public.leads (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  name           text not null,
  company        text,
  email          text,
  phone          text,
  source         text,
  value          numeric,
  status         text not null default 'New'
                 check (status in ('New','Contacted','Qualified','Won','Lost')),
  assigned_to    uuid references public.profiles(id) on delete set null,
  created_by     uuid references public.profiles(id) on delete set null,
  next_follow_up date
);

-- ---------- NOTES / FOLLOW-UPS --------------------------------------
create table if not exists public.notes (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  lead_id    uuid not null references public.leads(id) on delete cascade,
  author_id  uuid references public.profiles(id) on delete set null,
  body       text not null
);

create index if not exists leads_assigned_idx on public.leads(assigned_to);
create index if not exists leads_status_idx   on public.leads(status);
create index if not exists notes_lead_idx      on public.notes(lead_id);

-- =====================================================================
-- Helper: is the current user an admin? (SECURITY DEFINER avoids RLS
-- recursion when policies need to check the caller's role.)
-- =====================================================================
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- =====================================================================
-- Auto-create a profile when a new auth user signs up.
-- The FIRST user to sign up becomes the admin; everyone else is a BD.
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_count int;
begin
  select count(*) into user_count from public.profiles;
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    case when user_count = 0 then 'admin' else 'bd' end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.leads    enable row level security;
alter table public.notes    enable row level security;

-- ---- PROFILES ----
-- Everyone signed in can read the team list (needed for assign dropdowns).
drop policy if exists "read profiles" on public.profiles;
create policy "read profiles" on public.profiles
  for select using (auth.role() = 'authenticated');

-- Users can edit their own profile; admins can edit anyone (e.g. change role).
drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles
  for update using (id = auth.uid() or public.is_admin());

-- ---- LEADS ----
-- Admins see all leads; BDs see only leads assigned to them.
drop policy if exists "read leads" on public.leads;
create policy "read leads" on public.leads
  for select using (public.is_admin() or assigned_to = auth.uid());

-- Only admins create leads (upload / manual add).
drop policy if exists "insert leads" on public.leads;
create policy "insert leads" on public.leads
  for insert with check (public.is_admin());

-- Admins update any lead; BDs update leads assigned to them.
drop policy if exists "update leads" on public.leads;
create policy "update leads" on public.leads
  for update using (public.is_admin() or assigned_to = auth.uid());

-- Only admins delete leads.
drop policy if exists "delete leads" on public.leads;
create policy "delete leads" on public.leads
  for delete using (public.is_admin());

-- ---- NOTES ----
-- You can read notes on any lead you can read.
drop policy if exists "read notes" on public.notes;
create policy "read notes" on public.notes
  for select using (
    exists (
      select 1 from public.leads l
      where l.id = notes.lead_id
        and (public.is_admin() or l.assigned_to = auth.uid())
    )
  );

-- You can add notes to any lead you can read; author must be you.
drop policy if exists "insert notes" on public.notes;
create policy "insert notes" on public.notes
  for insert with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.leads l
      where l.id = notes.lead_id
        and (public.is_admin() or l.assigned_to = auth.uid())
    )
  );
