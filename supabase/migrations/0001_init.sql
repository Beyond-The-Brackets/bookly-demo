-- Bookly: initial schema

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,64}$'),
  display_name text not null,
  profession text,
  bio text,
  timezone text not null default 'UTC',
  currency text not null default 'USD',
  created_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  description text,
  duration_minutes integer not null check (duration_minutes between 10 and 480),
  price_cents integer not null default 0 check (price_cents >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.availability (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  check (end_time > start_time)
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  created_at timestamptz not null default now(),
  unique (profile_id, email)
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete restrict,
  client_id uuid not null references public.clients (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled', 'completed')),
  price_paid_cents integer not null default 0 check (price_paid_cents >= 0),
  cancellation_fee_cents integer check (cancellation_fee_cents >= 0),
  cancelled_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index services_profile_id_idx on public.services (profile_id);
create index availability_profile_id_idx on public.availability (profile_id, weekday);
create index clients_profile_id_idx on public.clients (profile_id);
create index bookings_profile_starts_idx on public.bookings (profile_id, starts_at);
create index bookings_client_id_idx on public.bookings (client_id);
create unique index bookings_no_double_booking_idx
  on public.bookings (profile_id, starts_at)
  where status <> 'cancelled';

-- Row level security ---------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.availability enable row level security;
alter table public.clients enable row level security;
alter table public.bookings enable row level security;

create policy "Profiles are public"
  on public.profiles for select
  using (true);

create policy "Practitioners update their own profile"
  on public.profiles for update
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Active services are public"
  on public.services for select
  using (active or (select auth.uid()) = profile_id);

create policy "Practitioners manage their services"
  on public.services for all
  using ((select auth.uid()) = profile_id)
  with check ((select auth.uid()) = profile_id);

create policy "Availability is public"
  on public.availability for select
  using (true);

create policy "Practitioners manage their availability"
  on public.availability for all
  using ((select auth.uid()) = profile_id)
  with check ((select auth.uid()) = profile_id);

create policy "Practitioners manage their clients"
  on public.clients for all
  using ((select auth.uid()) = profile_id)
  with check ((select auth.uid()) = profile_id);

create policy "Practitioners read their bookings"
  on public.bookings for select
  using ((select auth.uid()) = profile_id);

create policy "Practitioners update their bookings"
  on public.bookings for update
  using ((select auth.uid()) = profile_id)
  with check ((select auth.uid()) = profile_id);

-- New practitioner -> profile -------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_slug text;
  final_slug text;
  tz text;
begin
  base_slug := coalesce(nullif(new.raw_user_meta_data ->> 'slug', ''), split_part(new.email, '@', 1));
  base_slug := trim(both '-' from regexp_replace(lower(base_slug), '[^a-z0-9]+', '-', 'g'));
  if length(base_slug) < 2 then
    base_slug := 'practitioner';
  end if;
  base_slug := left(base_slug, 48);

  final_slug := base_slug;
  while exists (select 1 from public.profiles where slug = final_slug) loop
    final_slug := base_slug || '-' || substr(md5(random()::text), 1, 4);
  end loop;

  tz := coalesce(new.raw_user_meta_data ->> 'timezone', 'UTC');
  if not exists (select 1 from pg_timezone_names where name = tz) then
    tz := 'UTC';
  end if;

  insert into public.profiles (id, slug, display_name, profession, timezone)
  values (
    new.id,
    final_slug,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(new.email, '@', 1)),
    nullif(new.raw_user_meta_data ->> 'profession', ''),
    tz
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Public booking ---------------------------------------------------------------

create or replace function public.get_busy_slots(p_profile_id uuid, p_from timestamptz, p_to timestamptz)
returns table (starts_at timestamptz, ends_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select b.starts_at, b.ends_at
  from public.bookings b
  where b.profile_id = p_profile_id
    and b.status = 'confirmed'
    and b.starts_at < p_to
    and b.ends_at > p_from
    and p_to - p_from <= interval '62 days'
  order by b.starts_at;
$$;

create or replace function public.create_booking(
  p_profile_id uuid,
  p_service_id uuid,
  p_starts_at timestamptz,
  p_client_name text,
  p_client_email text,
  p_client_phone text default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_service public.services;
  v_tz text;
  v_ends_at timestamptz;
  v_local_start timestamp;
  v_local_end timestamp;
  v_client_id uuid;
  v_booking_id uuid;
begin
  select * into v_service
  from public.services
  where id = p_service_id and profile_id = p_profile_id and active;
  if not found then
    raise exception 'service_not_found';
  end if;

  if p_starts_at < now() then
    raise exception 'slot_in_past';
  end if;

  if length(coalesce(p_client_name, '')) not between 2 and 80
     or p_client_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
     or length(p_client_email) > 120
     or length(coalesce(p_notes, '')) > 500 then
    raise exception 'invalid_client';
  end if;

  select timezone into v_tz from public.profiles where id = p_profile_id;
  v_ends_at := p_starts_at + make_interval(mins => v_service.duration_minutes);
  v_local_start := p_starts_at at time zone v_tz;
  v_local_end := v_ends_at at time zone v_tz;

  if not exists (
    select 1 from public.availability a
    where a.profile_id = p_profile_id
      and a.weekday = extract(dow from v_local_start)
      and v_local_start::date = v_local_end::date
      and v_local_start::time >= a.start_time
      and v_local_end::time <= a.end_time
  ) then
    raise exception 'outside_availability';
  end if;

  if exists (
    select 1 from public.bookings b
    where b.profile_id = p_profile_id
      and b.status = 'confirmed'
      and tstzrange(b.starts_at, b.ends_at) && tstzrange(p_starts_at, v_ends_at)
  ) then
    raise exception 'slot_taken';
  end if;

  insert into public.clients (profile_id, name, email, phone)
  values (p_profile_id, trim(p_client_name), lower(trim(p_client_email)), nullif(trim(p_client_phone), ''))
  on conflict (profile_id, email) do update
    set name = excluded.name,
        phone = coalesce(excluded.phone, public.clients.phone)
  returning id into v_client_id;

  insert into public.bookings (profile_id, service_id, client_id, starts_at, ends_at, price_paid_cents, notes)
  values (p_profile_id, p_service_id, v_client_id, p_starts_at, v_ends_at, v_service.price_cents, nullif(trim(p_notes), ''))
  returning id into v_booking_id;

  return v_booking_id;
end;
$$;

revoke all on function public.get_busy_slots(uuid, timestamptz, timestamptz) from public;
revoke all on function public.create_booking(uuid, uuid, timestamptz, text, text, text, text) from public;
grant execute on function public.get_busy_slots(uuid, timestamptz, timestamptz) to anon, authenticated;
grant execute on function public.create_booking(uuid, uuid, timestamptz, text, text, text, text) to anon, authenticated;
