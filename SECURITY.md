# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| 3.7.x   | Yes       |

## Reporting a vulnerability

Please **do not** open public GitHub issues for security problems.

Email **kubee3302@gmail.com** with:

- Description of the issue
- Steps to reproduce
- Impact assessment (data exposure, API abuse, etc.)

We aim to respond within 7 days.

## Scope

In scope:

- Server-side API routes (`/api/*`) — injection, SSRF, rate-limit bypass, secret leakage
- Admin routes (`/admin/*`, `/api/admin/*`) — auth bypass, data exposure
- Supabase RLS misconfigurations (share links, profiles, analytics)
- Client-side XSS in manuscript fields or export flows
- Insecure defaults that expose user drafts or API keys

Out of scope:

- Missing CSP on third-party CDNs (Plotly) unless exploitable
- Social engineering
- Denial of service against upstream scholarly APIs (PubMed, Crossref, etc.)

## Open-beta security posture

| Area | Posture |
|------|---------|
| Auth | Supabase email/password at `/auth`; optional guest mode |
| Admin | `OWNER_EMAIL` or `profiles.role = admin`; API routes check `getAppUser()` |
| API keys | Server env only — never `NEXT_PUBLIC_*` except Supabase anon key |
| Service role | `SUPABASE_SERVICE_ROLE_KEY` server-only (analytics, owner promotion, share reads, announcements) |
| Rate limits | Per-IP tiers on LLM, search, verify, and default routes; Upstash Redis recommended on Vercel |
| Share links | Unguessable tokens; reads via service role (no anon table scan) |
| Analytics | `analytics_events` has RLS with no policies; middleware beacons require `ANALYTICS_INTERNAL_SECRET` |
| Headers | CSP, HSTS (HTTPS), X-Frame-Options DENY, nosniff, Referrer-Policy |
| Profiles RLS | Users cannot self-promote to admin (`role` column locked) |

## Architecture notes

- Guest drafts live in **browser localStorage** — not on MedCore servers
- Cloud sync requires authenticated users (`manuscript_projects` RLS per user)
- API keys live in **server environment variables** only

## Safe disclosure

We appreciate responsible disclosure. Credit will be given in release notes if you wish.
