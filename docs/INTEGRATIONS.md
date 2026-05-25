# MedCore — integration separation

Each external service uses a **dedicated project** scoped to MedCore Research Builder only.

| Integration | Dedicated resource | Purpose |
|-------------|-------------------|---------|
| **Supabase** | Project `medcore-research-builder` (`hhmhwfekrzncmjxgjsya`) | Auth + cloud manuscript sync |
| **Vercel** | Project `medcore-research-builder` | Next.js app + API routes |
| **GitHub** | Repo `Abdulsalam3302/medcore-research-builder` | Source + CI/CD |
| **LLM** | Env keys on Vercel only | Server-side drafting |
| **Scholarly APIs** | Server-side routes only | PubMed, Crossref, etc. |

## Architecture (adapted for Next.js monolith)

```
Browser
   │
   ▼
Vercel — medcore-research-builder.vercel.app
   ├── Next.js pages (/, /auth, …)
   └── /api/* serverless routes (LLM, PubMed, verify, health, projects)
   │
   ├──► Supabase Auth (dedicated project)
   │         └── profiles, manuscript_projects (RLS per user)
   │
   └──► External APIs (NCBI, Crossref, OpenAlex, …)
```

Unlike split Vite+Railway setups, **API and UI deploy together** on Vercel. Supabase holds auth + optional cloud sync only; scholarly keys never reach the browser.

## Supabase dashboard checklist

Project: **medcore-research-builder** (us-east-1)

1. **Authentication → URL configuration**
   - Site URL: `https://medcore-research-builder.vercel.app`
   - Redirect URLs:
     - `https://medcore-research-builder.vercel.app/auth/callback`
     - `http://localhost:3000/auth/callback`

2. **Authentication → Providers** — Email enabled

3. **Never** reuse this project for IRB, surveys, or other products.

## GitHub secrets (for deploy.yml)

| Secret | Value |
|--------|--------|
| `VERCEL_TOKEN` | From vercel.com/account/tokens |
| `VERCEL_ORG_ID` | From `.vercel/project.json` → orgId |
| `VERCEL_PROJECT_ID` | From `.vercel/project.json` → projectId |

## Vercel environment variables

Sync from `.env.local`:

```bash
./scripts/sync-vercel-env.sh .env.local
printf '%s' 'https://medcore-research-builder.vercel.app' | vercel env add NEXT_PUBLIC_APP_URL production --force --yes
printf '%s' 'https://hhmhwfekrzncmjxgjsya.supabase.co' | vercel env add NEXT_PUBLIC_SUPABASE_URL production --force --yes
# … anon key, OWNER_EMAIL, LLM keys, etc.
vercel deploy --prod
```

## Admin access

Set `OWNER_EMAIL=kubee3302@gmail.com` on Vercel. First sign-up/login with that email receives `admin` role in `profiles`.

## Paused project note

Free-tier limit required pausing empty **IRB Saudi Arabia** project to create MedCore's dedicated Supabase project. Restore IRB from Supabase dashboard when upgrading plan.
