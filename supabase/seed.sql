-- Demo data for local development. Every name, email and phone number below is fictitious.
-- Practitioner logins: alex@example.com / sam@example.com, password: bookly-demo-password

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
values
  (
    '00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111111',
    'authenticated', 'authenticated', 'alex@example.com',
    extensions.crypt('bookly-demo-password', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Alex Morgan Coaching","slug":"demo-coach","profession":"Coach","timezone":"America/New_York"}',
    now() - interval '120 days', now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000', '22222222-2222-4222-8222-222222222222',
    'authenticated', 'authenticated', 'sam@example.com',
    extensions.crypt('bookly-demo-password', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Sam Rivera Yoga","slug":"river-yoga","profession":"Yoga teacher","timezone":"America/Los_Angeles"}',
    now() - interval '90 days', now(), '', '', '', ''
  );

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text,
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
       'email', now(), now(), now()
from auth.users u
where u.id in ('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222');

update public.profiles
set bio = 'Career and confidence coaching for people starting something new. Sessions by video call.'
where id = '11111111-1111-4111-8111-111111111111';

update public.profiles
set bio = 'Small-group and private yoga, from first class to daily practice.'
where id = '22222222-2222-4222-8222-222222222222';

insert into public.services (id, profile_id, name, description, duration_minutes, price_cents)
values
  ('a0000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'Discovery call', 'A short first conversation to see if we are a good fit.', 30, 0),
  ('a0000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'Coaching session', 'One hour, one topic, one clear next step.', 60, 9000),
  ('a0000000-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', 'Deep-dive session', 'Ninety minutes for a bigger decision.', 90, 13000),
  ('b0000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'Private class', 'A class built around your body and goals.', 60, 7500),
  ('b0000000-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'Breathwork', 'Guided breathing and relaxation.', 45, 4500);

insert into public.availability (profile_id, weekday, start_time, end_time)
select '11111111-1111-4111-8111-111111111111', d, t.s, t.e
from generate_series(1, 5) as d,
     (values (time '09:00', time '12:00'), (time '13:00', time '18:00')) as t (s, e)
union all
select '22222222-2222-4222-8222-222222222222', d, time '07:00', time '11:00'
from unnest(array[1, 3, 5, 6]) as d;

insert into public.clients (id, profile_id, name, email, phone, created_at)
values
  ('c0000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'Jordan Lee', 'jordan.lee@example.com', '+1 555-0101', now() - interval '100 days'),
  ('c0000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'Taylor Brooks', 'taylor.brooks@example.com', '+1 555-0102', now() - interval '80 days'),
  ('c0000000-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', 'Morgan Patel', 'morgan.patel@example.com', '+1 555-0103', now() - interval '60 days'),
  ('c0000000-0000-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111', 'Casey Nguyen', 'casey.nguyen@example.com', null, now() - interval '30 days'),
  ('c0000000-0000-4000-8000-000000000005', '11111111-1111-4111-8111-111111111111', 'Riley Johnson', 'riley.johnson@example.com', '+1 555-0105', now() - interval '12 days'),
  ('c0000000-0000-4000-8000-000000000006', '11111111-1111-4111-8111-111111111111', 'Jamie Carter', 'jamie.carter@example.com', '+1 555-0106', now() - interval '3 days'),
  ('d0000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'Avery Kim', 'avery.kim@example.com', '+1 555-0111', now() - interval '70 days'),
  ('d0000000-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'Drew Martinez', 'drew.martinez@example.com', '+1 555-0112', now() - interval '40 days'),
  ('d0000000-0000-4000-8000-000000000003', '22222222-2222-4222-8222-222222222222', 'Quinn Foster', 'quinn.foster@example.com', null, now() - interval '20 days'),
  ('d0000000-0000-4000-8000-000000000004', '22222222-2222-4222-8222-222222222222', 'Harper Diaz', 'harper.diaz@example.com', '+1 555-0114', now() - interval '5 days');

-- Bookings are placed relative to today so the dashboard always has something upcoming.
with seed (profile_id, service_id, client_id, day_offset, local_time, status, notes) as (
  values
    ('11111111-1111-4111-8111-111111111111'::uuid, 'a0000000-0000-4000-8000-000000000002'::uuid, 'c0000000-0000-4000-8000-000000000001'::uuid, -56, time '10:00', 'completed', null),
    ('11111111-1111-4111-8111-111111111111', 'a0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000001', -28, time '10:00', 'completed', null),
    ('11111111-1111-4111-8111-111111111111', 'a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000002', -21, time '14:00', 'completed', null),
    ('11111111-1111-4111-8111-111111111111', 'a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000003', -14, time '09:00', 'completed', null),
    ('11111111-1111-4111-8111-111111111111', 'a0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000004', -6, time '15:00', 'cancelled', null),
    ('11111111-1111-4111-8111-111111111111', 'a0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000001', 1, time '10:00', 'confirmed', 'Follow-up on the job offer.'),
    ('11111111-1111-4111-8111-111111111111', 'a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000006', 1, time '13:30', 'confirmed', null),
    ('11111111-1111-4111-8111-111111111111', 'a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000002', 3, time '14:00', 'confirmed', null),
    ('11111111-1111-4111-8111-111111111111', 'a0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000005', 4, time '09:00', 'confirmed', 'First paid session.'),
    ('11111111-1111-4111-8111-111111111111', 'a0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000003', 9, time '16:00', 'confirmed', null),
    ('22222222-2222-4222-8222-222222222222', 'b0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', -14, time '08:00', 'completed', null),
    ('22222222-2222-4222-8222-222222222222', 'b0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000002', -7, time '09:00', 'completed', null),
    ('22222222-2222-4222-8222-222222222222', 'b0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000003', 2, time '07:30', 'confirmed', 'Lower back is a bit stiff.'),
    ('22222222-2222-4222-8222-222222222222', 'b0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000004', 5, time '08:00', 'confirmed', null)
)
insert into public.bookings (profile_id, service_id, client_id, starts_at, ends_at, status, price_paid_cents, cancelled_at, cancellation_fee_cents, notes)
select
  s.profile_id,
  s.service_id,
  s.client_id,
  start_at,
  start_at + make_interval(mins => sv.duration_minutes),
  s.status,
  sv.price_cents,
  case when s.status = 'cancelled' then start_at - interval '3 days' end,
  case when s.status = 'cancelled' then 0 end,
  s.notes
from seed s
join public.services sv on sv.id = s.service_id
join public.profiles p on p.id = s.profile_id
cross join lateral (
  select ((current_date + s.day_offset)::timestamp + s.local_time) at time zone p.timezone as start_at
) t;
