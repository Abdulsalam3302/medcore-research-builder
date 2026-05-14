# MedCore Research Builder

A polished, no-login, reporting-guideline-driven workspace for building the core of a medical research manuscript.

- ✍️ **Section builders** for Introduction, Methods, Results, Discussion, and Conclusion — checklist-driven against EQUATOR Network reporting guidelines (CONSORT, STROBE, PRISMA, SPIRIT, PRISMA-P, STARD, TRIPOD, CARE, AGREE/RIGHT, SRQR/COREQ, ARRIVE, SQUIRE, CHEERS, GRAMMS).
- 🔎 **Title Lab** with evidence-based novelty / similarity scan across PubMed, Crossref, OpenAlex (and optional web search). We never promise absolute uniqueness — we surface evidence.
- 📚 **Reference Verifier** that parses pasted references in mixed formats, looks them up in PubMed (via E-utilities + citation matcher) and Crossref, flags mismatches, duplicates, and possible retractions.
- 🛡️ **Research-integrity safe** — we refine and critique your draft, but **never** invent studies, PMIDs, DOIs, results, statistics, or claims. Missing data is flagged, not filled in.
- 🔐 **Direct use** — no registration, no login, no account system. All API calls go through server-side Next.js routes; your keys never reach the browser.

## Tech stack

- Next.js 14 (App Router) · TypeScript · Tailwind CSS
- No database — drafts live in browser `localStorage` only
- Export/import as **JSON**, manuscript Markdown, compliance Markdown, references CSV

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Configure API keys
cp .env.example .env.local
# Edit .env.local: paste your ANTHROPIC_API_KEY (or OPENAI_API_KEY)

# 3. Run the dev server
npm run dev
# Open http://localhost:3000
```

The dashboard loads immediately — no login.

## Environment variables

See `.env.example`. The app degrades gracefully when optional keys are missing.

| Variable | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | recommended | LLM refinement, parsing, final report |
| `OPENAI_API_KEY` | optional | Fallback LLM provider |
| `LLM_PROVIDER` | optional | `anthropic` (default) or `openai` |
| `NCBI_API_KEY` | optional | Raises PubMed rate limit from 3 → 10 req/s |
| `NCBI_EMAIL` · `NCBI_TOOL` | recommended | Polite identification with NCBI |
| `CROSSREF_MAILTO` | recommended | Polite pool with Crossref |
| `OPENALEX_MAILTO` | recommended | Polite pool with OpenAlex |
| `TAVILY_API_KEY` *or* `SERPAPI_API_KEY` | optional | Adds web search to novelty scan |

Without an LLM key:
- Research-type wizard still works (heuristic).
- PubMed/Crossref/OpenAlex search and reference verification still work.
- Title generation, section refinement, and the final compliance report show a "configure LLM" message.

## How to test

### Health-check
```bash
curl http://localhost:3000/api/status
```
You should see flags for `llm.configured`, `pubmed`, `crossref`, `openalex`, `webSearch`.

### PubMed search
```bash
curl 'http://localhost:3000/api/pubmed/search?q=heart+failure+discharge+education&retmax=5'
```

### Reference verifier
The Reference Verifier card has a **Load demo** button that pastes four real guideline references. Click **Verify references** to run them through PubMed + Crossref.

### Demo title (safe sample input)
> *Effect of structured discharge education on 30-day readmission among adults with heart failure: a randomized controlled trial*

The Title Lab card has a **Load demo** button that pre-fills this title with PICO inputs. Click **Check similarity** to run the novelty scan.

## Project layout

```
app/
  api/                 # Server-side routes — all external API calls live here
    llm/{refine-title, refine-section, research-type, parse-references, final-report}
    pubmed/{search, details, citation-match}
    crossref/{search, works}
    openalex/search
    references/verify
    title/novelty-check
    web-search
    status
  page.tsx             # Dashboard shell
components/
  Sidebar.tsx · TopBar.tsx
  Overview.tsx · ResearchTypeWizard.tsx · TitleLab.tsx
  SectionBuilder.tsx · ReferenceVerifier.tsx
  ComplianceReport.tsx · ExportCenter.tsx
lib/
  types.ts             # Shared TypeScript types
  guidelines.ts        # Curated EQUATOR guideline registry
  prompts.ts           # LLM system + per-route prompt templates
  llm.ts               # Anthropic / OpenAI client + JSON extraction
  novelty.ts           # PubMed + Crossref + OpenAlex similarity scan
  store.ts             # localStorage helpers (project state)
  export.ts            # Markdown + CSV exporters
  scholarly/
    pubmed.ts · crossref.ts · openalex.ts · websearch.ts
  references/
    parser.ts          # Reference text parser
    verify.ts          # Per-reference verifier with metadata-match scoring
```

## Reporting-guideline coverage

Guideline registry seeded from the [EQUATOR Network](https://www.equator-network.org/reporting-guidelines/):

| Family | Primary | Extensions (selected) |
|---|---|---|
| Randomized trials | CONSORT | Cluster · Non-inferiority · Pragmatic · Pilot · Abstracts · Harms · NPT · AI · eHealth |
| Observational | STROBE | RECORD · RECORD-PE · STROBE-ME · STROBE-nut · STROBE-equity |
| Systematic reviews | PRISMA 2020 | PRISMA-P · PRISMA-ScR · PRISMA-DTA · PRISMA-NMA · PRISMA-IPD · Harms · Overviews |
| Trial protocols | SPIRIT | — |
| SR protocols | PRISMA-P | — |
| Diagnostic accuracy | STARD | — |
| Prediction models | TRIPOD | TRIPOD+AI |
| Case reports | CARE | — |
| Guidelines | AGREE / RIGHT | — |
| Qualitative | SRQR / COREQ | — |
| Mixed-methods | GRAMMS | — |
| Animal / preclinical | ARRIVE | — |
| Quality improvement | SQUIRE | — |
| Economic evaluations | CHEERS | — |
| Other | Custom | — |

Checklist prompts are paraphrased compliance reminders for the UI and the LLM. Always cross-check against the official source linked from each guideline.

## Deployment

### Vercel (recommended)
1. Push to GitHub.
2. Import the repo into Vercel.
3. Add the environment variables in **Settings → Environment Variables**.
4. Deploy — `next build` runs automatically.

### Hostinger Node hosting
Hostinger's Node-capable plans can host Next.js as a standalone server:
1. Build: `npm install && npm run build`.
2. Upload the project. The `next.config.mjs` is set to `output: "standalone"`, so you only need `.next/standalone/`, `.next/static/`, and `public/` (if any).
3. Start: `node .next/standalone/server.js` with `PORT` set by the host.
4. Set the same environment variables in the Hostinger control panel.

## Research-integrity guarantees

- **No fabricated data.** The LLM is instructed never to invent PMIDs, DOIs, citations, p-values, confidence intervals, sample sizes, effect estimates, or clinical claims. The Results module reinforces this with an extra system rule.
- **No promised novelty.** Title Lab labels novelty risk on a 4-level scale (low / moderate / high / exact match) with the underlying evidence and queries used. It never claims absolute uniqueness.
- **Transparency.** Each refined section returns a structured response with checklist coverage, missing-information list, risk warnings, claims-needing-citation, and the queries you should run to find evidence.
- **Local-only drafts.** Your manuscript lives in `localStorage`. No cookies, no telemetry, no account.

## License notice

MedCore Research Builder is independent of EQUATOR, NCBI, Crossref, and OpenAlex. It uses their public APIs respectfully (polite-pool identifiers, rate-limit-aware concurrency). The reporting-guideline checklist prompts are paraphrased compliance reminders, not verbatim copies of copyrighted checklists. Always refer to the linked official sources for full guideline text.
