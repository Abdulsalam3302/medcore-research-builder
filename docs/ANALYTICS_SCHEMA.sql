-- MedCore observability / analytics event store
--
-- Run once in Supabase SQL editor. Events are written server-side only
-- (service role). No RLS policies are created — clients cannot read or write.
-- Admin dashboard reads via SUPABASE_SERVICE_ROLE_KEY on the server.

create table if not exists analytics_events (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  event_type        text not null,
  category          text not null check (category in ('visit', 'auth', 'usage', 'abuse', 'alert')),
  path              text,
  method            text,
  user_id           uuid references auth.users (id) on delete set null,
  session_id        text,
  ip_hash           text,
  country           text,
  region            text,
  referrer          text,
  user_agent_family text,
  metadata          jsonb not null default '{}',
  severity          text not null default 'info' check (severity in ('info', 'warn', 'alert'))
);

create index if not exists analytics_events_created_at_idx
  on analytics_events (created_at desc);

create index if not exists analytics_events_event_type_idx
  on analytics_events (event_type, created_at desc);

create index if not exists analytics_events_category_idx
  on analytics_events (category, created_at desc);

create index if not exists analytics_events_session_idx
  on analytics_events (session_id, created_at desc);

create index if not exists analytics_events_ip_hash_idx
  on analytics_events (ip_hash, created_at desc);

alter table analytics_events enable row level security;

-- Intentionally no policies: anon/authenticated cannot access.
-- Service role bypasses RLS for server-side inserts and admin reads.
