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
| LLM calls | All `/api/llm/*` routes | usage (tokens, latency, route) |

No raw IPs or user emails are stored in events — only hashed IP prefixes and
aggregates. The dashboard masks emails in user drill-downs.

## Drill-down API (admin-only)

| Endpoint | Purpose |
|----------|---------|
| `GET /api/admin/observability/users?days=30` | Registered users (masked emails) |
| `GET /api/admin/observability/pages?days=30&path=/foo` | Page view breakdown |
| `GET /api/admin/observability/geo?days=30` | Full country names + SA highlight |
| `GET /api/admin/observability/llm?days=30` | Token usage & LLM call stats |
| `GET /api/admin/observability/audit?days=30&userId=...` | Audit trail |

## Schema migration (LLM indexes)

After the base schema, run `docs/ANALYTICS_SCHEMA_MIGRATION.sql` for LLM and
user audit indexes.

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
