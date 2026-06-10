# MedCore Research Builder v2

[![CI](https://github.com/Abdulsalam3302/medcore-research-builder/actions/workflows/ci.yml/badge.svg)](https://github.com/Abdulsalam3302/medcore-research-builder/actions/workflows/ci.yml)

A free, no-login, reporting-guideline-driven workspace for building the core of a **medical research manuscript**. Built for clinicians and researchers worldwide — drafts stay in your browser; scholarly lookups run server-side.

**Live app:** https://medcore-research-builder.vercel.app  
**Repository:** https://github.com/Abdulsalam3302/medcore-research-builder

## What’s new in v3.9

- **Submission Pipeline** — track every target journal from shortlist →
  formatting → submission → peer review → revision → acceptance → publication,
  with stage-by-stage best practice (ICMJE/COPE-aligned), duration stats, and
  a full status timeline. New lane under Post-Research.
- **Publication Club** — a community board (new Community phase): post and
  join research opportunities, meet researchers by specialty, and share
  MedCore projects via tokenized share links so studies are initiated *and*
  finished on the platform. Supabase-backed (`docs/CLUB_TABLES.sql`), browse
  as guest, post/join with a free account; plain-text only, RLS-enforced,
  strict rate limits.
- **DOAJ integration** — `/api/doaj/search` (articles + journals) and a new
  `check_open_access_journal` MCP tool: verify a journal's DOAJ listing
  (license, APC, publisher) as a legitimacy signal for the predatory check.
- **Security** — HSTS header (2-year max-age) added to the middleware
  security set; community endpoints are auth-gated, length-capped,
  control-character-stripped, and rate-limited.

## What’s new in v3.8

- **First-party MCP server** — MedCore's engines (journal finder, design
  registry, reference verification, coherence checks, preprint search) are now
  exposed to any Model Context Protocol client at `/api/mcp`
  (Streamable HTTP, stateless). See [`docs/MCP_SERVER.md`](docs/MCP_SERVER.md).
  ```bash
  claude mcp add --transport http medcore https://medcore-research-builder.vercel.app/api/mcp
  ```
- **Preprint search API** — `/api/preprints/search` queries bioRxiv/medRxiv and
  other preprints via Europe PMC's `SRC:PPR` source (free, keyless), with
  explicit *not peer reviewed* labelling.
- **Lint gate** — `npm run lint` (next/core-web-vitals) now passes clean and
  runs in CI; React hook dependency hazards fixed.
- **Sync you can trust** — cloud-sync failures and local-storage save failures
  now surface as visible alerts (including on mobile) instead of failing silently.

## What’s new in v3

- **Journal Finder** — a deep journal-suggestion engine over WoS SCIE/ESCI,
  Scopus, PubMed/MEDLINE, PMC, and DOAJ, with a curated **100%-Saudi** journal
  set, relevance + indexing ranking, filters, official verify links, and
  per-journal **submission formatting**. Scales to tens of thousands via
  `scripts/ingest-journals.mjs` (OpenAlex/DOAJ/Crossref) → `lib/journals/generated.ts`.
- **Manuscript Coherence** — treats the manuscript as one connected unit:
  checks title↔content, design↔claims, objective↔conclusion, results↔discussion
  (numbers + causal language), citation **order**, and cited-vs-listed integrity.
- **Protocol / Proposal Studio** — the platform *develops* protocols (offline
  skeleton + AI draft), design-aware (SPIRIT/PRISMA-P/STROBE/STARD/TRIPOD/CARE).
- **Figures & Results upgrade** — figure-type recommendation with caption/legend/
  footnotes, a Table 1 scaffold, and AI-assisted results interpretation that
  foregrounds effect size + CI and never fabricates numbers.
- **Reference Safety** — an anti-hallucination layer flagging unverified,
  low-confidence, irrelevant, or retracted citations for human review.
- **Language Studio** — academic editing that preserves meaning and every
  number, with honest (non-guarantee) readability / AI-pattern / originality aids.
- **Instant auth** — sign-up with no email confirmation (auto sign-in); full
  guest mode with zero registration. See `docs/AUTH_SETUP.md`.
- **Durable rate limiting** (Upstash) + **tokenized share links**.
- **Tests** — `npm run test:smoke` and `npm run test:auth`.

### From v2

- **63 study designs**, **34 journals**, **84 feature flags** via the design registry
- **Research Launch** readiness scoring; **Title Lab** novelty scan
- **Reference Verifier** across PubMed, Crossref, OpenAlex, Europe PMC, Semantic Scholar, Unpaywall
- **Quality Suite**, **Reviewer Simulator**, **Statistician Copilot**, **Flow Diagram Builder**
- **Version history**, **DOCX export**, **system status panel**, security headers

## Core principles

- **Never fabricate** PMIDs, DOIs, statistics, or citations
- **Checklist-driven** against EQUATOR reporting guidelines (CONSORT, STROBE, PRISMA, SPIRIT, STARD, TRIPOD, CARE, etc.)
- **Transparent LLM outputs** — missing data is flagged, not invented
- **Privacy-first** — no account required; in guest mode drafts stay in your browser with no server-side storage. Optional Supabase sign-in enables cloud sync, which stores your draft server-side only while you are signed in.

## Tech stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| UI | React 18, TypeScript, Tailwind CSS |
| State | Browser `localStorage` only |
| Export | DOCX, Markdown, CSV, JSON |
| Charts | Plotly (CDN) |
| Deploy | `output: "standalone"` — Vercel, Railway, or any Node host |

## Getting started

```bash
npm install
cp .env.example .env.local
# Edit .env.local — at minimum set one LLM key (see below)
npm run dev
# Open http://localhost:3000
```

If port 3000 is stuck with a stale process (API 404, broken CSS), kill old Node processes and restart:

```bash
lsof -ti :3000 | xargs kill -9 2>/dev/null; npm run dev
```

## Environment variables

See `.env.example`. The app degrades gracefully when optional keys are missing.

| Variable | Required | Purpose |
|----------|----------|---------|
| `LLM_PROVIDER` | optional | `minimax` (default), `anthropic`, or `openai` |
| `MINIMAX_API_KEY` | recommended | Default LLM provider |
| `ANTHROPIC_API_KEY` | optional | Anthropic LLM |
| `OPENAI_API_KEY` | optional | OpenAI fallback |
| `NCBI_API_KEY` | optional | PubMed rate limit 3→10 req/s |
| `NCBI_EMAIL` · `NCBI_TOOL` | recommended | NCBI polite identification |
| `CROSSREF_MAILTO` | recommended | Crossref polite pool |
| `OPENALEX_MAILTO` | recommended | OpenAlex polite pool |
| `OPENALEX_API_KEY` | optional | OpenAlex premium limits |
| `SEMANTIC_SCHOLAR_API_KEY` | optional | S2 higher rate limits |
| `UNPAYWALL_EMAIL` | optional | Open-access PDF links in reference verifier |
| `TAVILY_API_KEY` or `SERPAPI_API_KEY` | optional | Web search in Title Lab novelty scan |
| `ELICIT_API_KEY` | optional | Elicit AI search (paid) |

Without an LLM key: scholarly APIs, reference verification, stats engine, and heuristic parsers still work. Drafting features show a “configure LLM” message.

## Testing

```bash
# Type check
npm run typecheck

# Production build
npm run build

# API smoke tests (dev server must be running)
npm run test:smoke
# Or against a specific port:
BASE_URL=http://localhost:3006 npm run test:smoke
```

### Manual checks

```bash
curl http://localhost:3000/api/status
curl 'http://localhost:3000/api/pubmed/search?q=heart+failure&retmax=3'
```

In the UI: **Reference Verifier → Load demo → Verify** and **Title Lab → Load demo → Check similarity**.

## Workflow

1. **Research Launch** — team, IRB, budget, readiness score  
2. **Research Type** — pick design, journal, features → guideline recommendation  
3. **Title Lab** — PICO, novelty scan, refinement  
4. **Manuscript sections** — Introduction → Methods → Results → Discussion → Conclusion  
5. **References** — parse & verify across scholarly APIs  
6. **Quality / Compliance / Export** — review, report, DOCX  

## Project layout

```
app/
  api/           # 40 server routes (LLM, scholarly, agents, registry)
  page.tsx       # Dashboard shell
components/      # Feature UI (20+ panels)
lib/
  registry/      # Designs, journals, features (v2)
  scholarly/     # PubMed, Crossref, OpenAlex, etc.
  agents/        # Stats, evidence, retraction, figures
  store.ts       # localStorage persistence
scripts/
  smoke-test.mjs # API smoke tests
middleware.ts    # Security headers
```

## Deployment (public)

**Production:** https://medcore-research-builder.vercel.app

Hosted on Vercel (Next.js standalone). Environment variables are set in the Vercel project dashboard — never commit `.env.local`.

To sync local env to Vercel (maintainers only):

```bash
./scripts/sync-vercel-env.sh .env.local
vercel deploy --prod
```

Before going public:

1. Set all env vars in the host dashboard (never commit `.env.local`)
2. Run `npm run build && npm run test:smoke` against the deployed URL
3. Set `CROSSREF_MAILTO`, `OPENALEX_MAILTO`, `NCBI_EMAIL` for polite API pools
4. Consider adding `TAVILY_API_KEY` for Title Lab web search
5. Monitor rate limits — defaults are ~24 LLM req/min/IP, 12 verify/min/IP
6. (Optional) For server-stored share links, run [`docs/SHARE_TABLE.sql`](docs/SHARE_TABLE.sql) in Supabase — without it, sharing falls back to inline URL-fragment links

## License

MIT — see [LICENSE](LICENSE). MedCore is independent of EQUATOR Network, NCBI, Crossref, and OpenAlex.

## Contact

Founder: Abdulsalam Aleid — feedback via the in-app contact links or GitHub issues.
