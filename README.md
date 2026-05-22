# MedCore Research Builder v2

A free, no-login, reporting-guideline-driven workspace for building the core of a **medical research manuscript**. Built for clinicians and researchers worldwide — drafts stay in your browser; scholarly lookups run server-side.

## What’s new in v2

- **63 study designs**, **34 journals**, **84 feature flags** via the design registry
- **Research Launch** readiness scoring before you write
- **Title Lab** with 7-dimension rubric + PubMed/Crossref/OpenAlex similarity scan
- **Reference Verifier** across PubMed, Crossref, OpenAlex, Europe PMC, Semantic Scholar, Unpaywall
- **Quality Suite**, **Reviewer Simulator**, **Statistician Copilot**, **Flow Diagram Builder**
- **Version history**, **URL hash sharing**, **DOCX export**
- **System status panel** — live integration health on Overview
- **Rate limiting & security headers** for public deployment
- **Smoke tests** — `npm run test:smoke`

## Core principles

- **Never fabricate** PMIDs, DOIs, statistics, or citations
- **Checklist-driven** against EQUATOR reporting guidelines (CONSORT, STROBE, PRISMA, SPIRIT, STARD, TRIPOD, CARE, etc.)
- **Transparent LLM outputs** — missing data is flagged, not invented
- **Privacy-first** — no accounts, no server-side draft storage

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

Recommended: **Vercel** (zero-config for Next.js) or any Node host with `npm run build && npm start`.

Before going public:

1. Set all env vars in the host dashboard (never commit `.env.local`)
2. Run `npm run build && npm run test:smoke` against the deployed URL
3. Set `CROSSREF_MAILTO`, `OPENALEX_MAILTO`, `NCBI_EMAIL` for polite API pools
4. Consider adding `TAVILY_API_KEY` for Title Lab web search
5. Monitor rate limits — defaults are ~24 LLM req/min/IP, 12 verify/min/IP

## License & attribution

MedCore is independent of EQUATOR Network, NCBI, Crossref, and OpenAlex. Checklists are paraphrased prompts for author guidance, not official copies. Always verify against the official guideline PDF before submission.

## Contact

Founder: Abdulsalam Aleid — feedback via the in-app contact links or GitHub issues.
