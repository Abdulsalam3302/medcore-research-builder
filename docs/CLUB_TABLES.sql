-- Publication Club — community board for research opportunities and shared
-- projects. Run this in the Supabase SQL editor (after AUTH_SETUP.md).
--
-- Posts are readable by everyone (including guests); creating posts and
-- joining requires a signed-in user. RLS enforces ownership.

create table if not exists public.club_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  author_name text not null default 'Researcher',
  -- 'opportunity' = open call to join a project; 'project' = shared MedCore
  -- project looking for collaborators/feedback; 'meet' = find peers/mentors.
  kind text not null check (kind in ('opportunity', 'project', 'meet')),
  title text not null check (char_length(title) between 8 and 160),
  description text not null check (char_length(description) between 20 and 2000),
  specialty text check (char_length(specialty) <= 80),
  -- Optional MedCore share link (tokenized) so the project starts AND finishes here.
  share_url text check (char_length(share_url) <= 300),
  contact text check (char_length(contact) <= 200),
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now()
);

create table if not exists public.club_joins (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.club_posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joiner_name text not null default 'Researcher',
  message text check (char_length(message) <= 500),
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

alter table public.club_posts enable row level security;
alter table public.club_joins enable row level security;

-- Anyone (anon included) may read open posts.
create policy "club_posts_read" on public.club_posts
  for select using (true);

-- Signed-in users create their own posts.
create policy "club_posts_insert" on public.club_posts
  for insert with check (auth.uid() = user_id);

-- Owners may update (e.g. close) and delete their posts.
create policy "club_posts_update" on public.club_posts
  for update using (auth.uid() = user_id);
create policy "club_posts_delete" on public.club_posts
  for delete using (auth.uid() = user_id);

-- Join requests: visible to the post owner and the requester.
create policy "club_joins_read" on public.club_joins
  for select using (
    auth.uid() = user_id
    or auth.uid() = (select user_id from public.club_posts where id = post_id)
  );

-- Signed-in users may request to join (once per post).
create policy "club_joins_insert" on public.club_joins
  for insert with check (auth.uid() = user_id);

-- Requesters may withdraw their own join request.
create policy "club_joins_delete" on public.club_joins
  for delete using (auth.uid() = user_id);

create index if not exists club_posts_created_idx on public.club_posts (created_at desc);
create index if not exists club_joins_post_idx on public.club_joins (post_id);
