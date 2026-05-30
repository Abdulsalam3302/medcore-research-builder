# Journal ingestion

The Journal Finder ships with a hand-curated seed of journals
(`lib/journals/international.ts`, `lib/journals/saudi.ts`). To scale from that
seed to the full universe of medical / health / life-sciences journals (tens of
thousands), a deploy-time ingestion script pulls from open, no-key APIs and
writes `lib/journals/generated.ts`.

- Script: `scripts/ingest-journals.mjs`
- Output: `lib/journals/generated.ts` (auto-generated — do not hand edit)
- CI: `.github/workflows/ingest-journals.yml`

## Sources

| Source | Role | What we take |
| --- | --- | --- |
| **OpenAlex** `/sources` | Primary bulk source, cursor-paginated (`per-page=200`) | `display_name`, `issn_l` + `issn[]`, `host_organization_name`, `country_code`, `homepage_url`, `is_oa`, `is_in_doaj`, `works_count`, `cited_by_count`, `summary_stats` (`2yr_mean_citedness`, `h_index`, `i10_index`), `x_concepts` (specialty tags + medical filtering), `apc_usd` / `apc_prices`, `type` |
| **DOAJ** `/api/v2/search/journals/issn:<issn>` | Cross-reference for OA + APC, per-ISSN | `bibjson.apc` (has_apc, max price in USD), DOAJ membership |

OpenAlex is the spine. Records are filtered to the medical / health /
life-sciences universe client-side via `x_concepts` (concept names matched
against a medical regex + the `--subjects` keywords, plus level-0 concept ids)
and the journal name. DOAJ is only queried when a record has an ISSN and already
looks open access (`is_oa` or `is_in_doaj`), and any DOAJ failure is swallowed —
enrichment is best-effort and never blocks the run.

## Fields captured (maps to `JournalRecord` in `lib/journals/types.ts`)

- `id`, `name`, `publisher`, `country`, `issnPrint`, `issnOnline`, `homepage`
- `scope`, `specialties` (from `x_concepts`)
- `indexing { wos, scopus, pubmed, medline, pmc, doaj }` — only `doaj` is
  asserted (`indexed` when in DOAJ); the rest stay `"unknown"`/`"none"` because
  there is no free authoritative bulk source for WoS/Scopus/MEDLINE selection.
- `oaModel` — `gold`, `diamond` (gold + no APC in DOAJ), or `unknown`
- `apcUsd`, `apcModel` (`none` / `gold-apc` / `hybrid-apc` / `unknown`),
  `freeApc` (true when in DOAJ with absent/zero APC)
- `metrics { citeScore, metricsYear }` — see honesty note below
- `dataConfidence: "ingested"`, `verifiedAt` (today, ISO date),
  `dataSource` (`"OpenAlex"` or `"OpenAlex+DOAJ"`), `verifyUrls`, `notes`

## Honesty model

Ingested metrics are **approximate proxies from open data**, never authoritative
vendor metrics:

- OpenAlex `2yr_mean_citedness` is carried into `metrics.citeScore` as a rough
  proxy and clearly labelled in `notes`. It is **not** a Clarivate Journal Impact
  Factor. `metrics.impactFactor` is left **undefined** unless truly known.
- `h_index` / `i10_index` / `works_count` / `cited_by_count` are recorded in
  `notes` only, as open-data proxies.
- WoS / Scopus / MEDLINE indexing is `"unknown"` for ingested records — we never
  assert a selective indexing status we cannot verify in bulk.
- Every record carries `verifyUrls` (Clarivate MJL, Scopus sources, NLM Catalog,
  DOAJ ToC, Scimago, publisher homepage) so a user can confirm at the source.

The finder UI already surfaces a caution for any record whose
`dataConfidence !== "curated"` and echoes the `notes`.

## Curated wins over ingested

`lib/journals/index.ts#allJournals()` merges datasets and de-duplicates by ISSN,
then by normalized name. Curated records (`dataConfidence: "curated"`) are added
first and **win** de-dup over ingested ones. So a hand-verified curated journal
always takes precedence over its auto-ingested counterpart; ingested records only
fill in journals the curated seed doesn't cover. `generated.ts` is loaded
defensively (optional `require`), so the app works fine before the file exists.

## Run locally

```bash
# Polite-pool rate limits: set a contact email.
SCHOLARLY_MAILTO=you@example.com node scripts/ingest-journals.mjs \
  --max 60000 --min-works 25 \
  --subjects "medicine,public health,surgery,nursing,dentistry,pharmacy"

# Then confirm the generated file typechecks:
npx tsc --noEmit
```

### CLI flags

| Flag | Default | Meaning |
| --- | --- | --- |
| `--max <n>` | `50000` | Max records to write |
| `--subjects <csv>` | medicine/health/… | Concept keywords kept in scope |
| `--min-works <n>` | `25` | Skip tiny/defunct sources below this works count |
| `--doaj <bool>` | `true` | Toggle the per-ISSN DOAJ cross-reference |
| `--out <path>` | `lib/journals/generated.ts` | Output path |

### Robustness

- Retries with exponential backoff + jitter on `429` / `5xx`, honoring
  `Retry-After`.
- `AbortSignal` request timeouts.
- Progress logging every 1000 kept records.
- Descriptive `User-Agent` including `SCHOLARLY_MAILTO` for the OpenAlex/DOAJ
  polite pools.
- Deterministic output ordering (by name, then ISSN) so re-runs produce minimal
  git diffs.

## CI schedule

`.github/workflows/ingest-journals.yml`:

- **Triggers:** `workflow_dispatch` (with an optional `max` input) and a monthly
  `schedule` (cron `0 3 1 * *` — 03:00 UTC on the 1st).
- **Steps:** checkout -> setup-node 20 -> `npm ci` ->
  `SCHOLARLY_MAILTO=<secret or research@medcore.app> node scripts/ingest-journals.mjs --max 60000`
  -> `npx tsc --noEmit` (fails the run on a malformed `generated.ts`) -> commit
  `lib/journals/generated.ts` back to `main` only if it changed.
- `permissions: contents: write`. The commit step is a no-op (clean exit) when
  there is no diff, so the run never fails just because nothing changed.
- Set the optional repo secret `SCHOLARLY_MAILTO` for better OpenAlex/DOAJ rate
  limits; it falls back to `research@medcore.app`.
