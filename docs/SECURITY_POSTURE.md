# Security posture (open beta)

Brief summary for operators — not a penetration-test report.

## Authentication & admin

- **Sign-in:** Supabase email/password at `/auth` (no separate admin password).
- **Admin:** `OWNER_EMAIL` env is promoted to `admin` on login; `profiles.role = admin` also grants access.
- **Admin routes:** `/admin/observability` and `/api/admin/*` require `getAppUser().role === admin` (403 otherwise).
- **Owner promotion:** server-side via service role only (`promoteOwnerIfNeeded`); clients cannot change `profiles.role` (RLS + column revoke).

## API

- **Rate limits:** per-IP tiers on LLM, search, verify, and default routes (`lib/rateLimit.ts`); Upstash Redis when configured.
- **Input:** JSON body size caps, malformed JSON → 400; upstream errors sanitized (no key leakage).
- **CORS:** same-origin Next.js app; no broad `Access-Control-Allow-Origin`.
- **Analytics collect:** client may only send `auth_failed`, `feature_use`, `signup`, `login`; middleware uses `ANALYTICS_INTERNAL_SECRET`.

## Supabase

- **Service role:** `SUPABASE_SERVICE_ROLE_KEY` — server only (`lib/supabase/admin.ts`); never in client bundle.
- **analytics_events:** RLS enabled, no policies — server inserts/reads only.
- **shared_projects:** anon may INSERT; SELECT removed — GET `/api/share` uses service role + token validation.
- **manuscript_projects:** user-scoped RLS for authenticated cloud sync.
- **announcements:** public read; writes via service role in admin API only.

## Headers (middleware)

CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, Referrer-Policy, Permissions-Policy, HSTS on HTTPS.

## Secrets

- `.env.local`, `.env.vercel` — not committed; keys only in Vercel env.
- Client bundle: only `NEXT_PUBLIC_*` vars (Supabase URL/anon key, app URL).

## Share links

- 32+ hex token, 7-day TTL, rate-limited create/resolve; expired rows rejected.

## Reporting

See `SECURITY.md` for vulnerability disclosure.
