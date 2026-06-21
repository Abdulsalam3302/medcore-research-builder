-- Tokenized, server-stored share links for MedCore Research Builder.
--
-- Backs POST/GET /api/share. Sharing is anonymous (no auth required), so a
-- recipient resolves a project purely by holding an unguessable token.
--
-- Run this once in your Supabase project (SQL editor) when enabling
-- server-stored sharing. If Supabase is not configured, the app falls back to
-- the inline URL-fragment share link and this table is unused.

create table if not exists shared_projects (
  token       text primary key,
  state       jsonb       not null,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null,
  created_by  uuid        references auth.users (id) on delete set null
);

-- Speeds up the expiry sweep / lookups.
create index if not exists shared_projects_expires_at_idx
  on shared_projects (expires_at);

alter table shared_projects enable row level security;

-- Allow anyone (incl. anon) to create a share link.
create policy "anon can insert shares"
  on shared_projects for insert
  to anon, authenticated
  with check (true);

-- IMPORTANT: Do NOT grant anon/authenticated SELECT on the full table.
-- A permissive SELECT policy (using (true)) lets anyone with the public
-- anon key enumerate every share. Reads are performed server-side via
-- SUPABASE_SERVICE_ROLE_KEY in GET /api/share, filtered by token only.

-- If you previously created a permissive select policy, remove it:
-- drop policy if exists "anon can select shares" on shared_projects;

-- NOTE: Expired rows are NOT auto-deleted. Schedule a periodic cleanup, e.g.
-- via pg_cron:
--   select cron.schedule(
--     'purge-expired-shares', '0 * * * *',
--     $$ delete from shared_projects where expires_at < now() $$
--   );
-- (The GET handler already refuses to return rows past expires_at.)
