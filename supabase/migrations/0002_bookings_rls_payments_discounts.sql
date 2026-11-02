-- Bookly: row level security on clients and bookings, online payments, discount codes

-- Row level security ---------------------------------------------------------
-- Public booking goes through create_booking / get_busy_slots (security definer),
-- so only the practitioner who owns a row ever reads or changes it directly.

alter table public.clients enable row level security;
alter table public.bookings enable row level security;

create policy "Practitioners read their clients"
  on public.clients for select
  using ((select auth.uid()) = profile_id);

create policy "Practitioners read their bookings"
  on public.bookings for select
  using ((select auth.uid()) = profile_id);

create policy "Practitioners update their bookings"
  on public.bookings for update
  using ((select auth.uid()) = profile_id)
  with check ((select auth.uid()) = profile_id);

-- Online payments ---------------------------------------------------------------

alter table public.bookings add column paid_at timestamptz;

-- Admins and discount codes -----------------------------------------------------

alter table public.profiles add column is_admin boolean not null default false;

-- "Practitioners update their own profile" must not let anyone make themselves
-- admin: they may only update the columns they own.
revoke update on public.profiles from anon, authenticated;
grant update (slug, display_name, profession, bio, timezone, currency) on public.profiles to authenticated;

create table public.discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9-]{3,32}$'),
  percent_off integer not null check (percent_off between 1 and 100),
  expires_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.discount_codes enable row level security;

create policy "Admins manage discount codes"
  on public.discount_codes for all
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin))
  with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin));
