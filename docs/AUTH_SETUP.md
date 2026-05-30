# Authentication setup (optional, no-verification)

MedCore works **fully without any account** — guest mode has every feature and
stores drafts in the browser. Sign-in is optional and only adds cloud sync.

When you do enable Supabase auth, configure it for **instant, no-verification**
sign-up so users are active immediately:

## 1. Disable email confirmation

In the Supabase dashboard:

**Authentication → Providers → Email**
- Turn **OFF** "Confirm email".
- (Optional) Turn **ON** "Enable email + password sign-in".

With confirmation off, `supabase.auth.signUp` returns an active session
immediately and the app drops the user straight into the workspace — no email
round-trip. The app also attempts an immediate `signInWithPassword` as a
fallback, so sign-up → signed-in is one click.

## 2. Create the profiles table (for roles / admin)

```sql
create table if not exists profiles (
  id    uuid primary key references auth.users (id) on delete cascade,
  email text,
  role  text not null default 'user'
);
alter table profiles enable row level security;

-- A user may read their own profile.
create policy "read own profile" on profiles
  for select to authenticated using (auth.uid() = id);

-- A user may insert/update their own profile, but NOT escalate their role.
create policy "upsert own profile" on profiles
  for insert to authenticated with check (auth.uid() = id);
create policy "update own non-role" on profiles
  for update to authenticated using (auth.uid() = id);
```

> Role escalation to `admin` is performed server-side via `OWNER_EMAIL` only
> (see `lib/auth.ts`), never from the client.

## 3. Manuscript cloud-sync table

```sql
create table if not exists manuscript_projects (
  user_id    uuid not null references auth.users (id) on delete cascade,
  slug       text not null default 'default',
  title      text,
  state      jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, slug)
);
alter table manuscript_projects enable row level security;
create policy "own projects" on manuscript_projects
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

## 4. Announcements table (optional — post updates without a deploy)

The app always shows the version-controlled announcements in `lib/announcements.ts`.
If you want to post live from the dashboard, create this table; rows are merged
on top of the built-in posts by `/api/announcements`.

```sql
create table if not exists announcements (
  id        text primary key,
  date      date not null default current_date,
  kind      text not null default 'notice',  -- release | update | tip | notice
  title     text not null,
  body      text not null,
  pinned    boolean not null default false,
  cta_label text,
  cta_href  text
);
alter table announcements enable row level security;

-- Anyone (incl. guests) may READ announcements.
create policy "read announcements" on announcements
  for select to anon, authenticated using (true);
-- Only the service role / dashboard inserts; no public write policy is created,
-- so users cannot post. Add rows from the Supabase Table editor or SQL editor.
```

To post: insert a row (e.g. `insert into announcements (id, kind, title, body, pinned) values ('2026-06-promo','update','New journals added','We expanded the Journal Finder...', true);`).

## 5. Environment variables

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
OWNER_EMAIL=you@example.com   # promoted to admin on login
```

That's it — sign-up/sign-in is now real, instant, and verification-free, while
guest mode remains fully functional with zero setup.
