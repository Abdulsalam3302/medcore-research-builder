-- One-time fix if you already ran an older SHARE_TABLE.sql with a permissive
-- SELECT policy. Run in Supabase SQL editor.

drop policy if exists "anon can select shares" on shared_projects;
