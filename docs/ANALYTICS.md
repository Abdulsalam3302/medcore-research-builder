# Admin observability setup

MedCore includes a lightweight server-side analytics pipeline and an admin
dashboard at `/admin/observability`.

## 1. Create the analytics table

Run `docs/ANALYTICS_SCHEMA.sql` once in your Supabase SQL editor.

## 2. Environment variables

Add to Vercel (and local `.env.local`):

```
SUPABASE_SERVICE_ROLE_KEY=...        # required for tracking + admin reads
ANALYTICS_INTERNAL_SECRET=...        # random string; middleware → collect auth
ANALYTICS_IP_SALT=...                # optional; strengthens IP hashing
OWNER_EMAIL=you@example.com          # admin access (existing)
```

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` must already be set.

## 3. Access the dashboard

1. Sign in with an account whose email matches `OWNER_EMAIL`, or whose
   `profiles.role` is `admin`.
2. Open `/admin/observability`.

Non-admins are redirected to `/auth?next=/admin/observability`.

## What is tracked

| Event | Source | Category |
|-------|--------|----------|
| Page views | Middleware | visit |
| API calls | Middleware | usage |
| Signups / logins | Auth page + callback | auth |
| Auth failures | Auth page | abuse |
| Rate limits | API `_utils` | abuse |
| Feature panels | Lifecycle navigation | usage |
| Cloud sync | `/api/projects` PUT | usage |
| Share links | `/api/share` POST | usage |

No raw IPs or user emails are stored in events — only hashed IP prefixes and
aggregates.

## Retrospective report

The dashboard merges:

- **Full history** from Supabase (`profiles`, `auth.users`, cloud projects, shares)
- **Visit/session metrics** from when tracking was deployed (`analytics_events`)

Page views before deployment are not backfilled.

## Open-beta recommendations

- Set `ANALYTICS_INTERNAL_SECRET` in production so middleware beacons are authenticated.
- Configure Upstash Redis for durable rate limiting across Vercel instances.
- Review alerts weekly: rate-limit spikes, auth failures, traffic anomalies.
- For richer marketing analytics, consider adding Vercel Web Analytics or Plausible
  alongside this dashboard (this stack stays privacy-first and admin-only).
