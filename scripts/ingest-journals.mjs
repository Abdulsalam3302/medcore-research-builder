#!/usr/bin/env node
/**
 * Deploy-time journal ingestion (comprehensive, multi-source).
 *
 * Builds lib/journals/generated.ts from public, no-key open APIs so the Journal
 * Finder can scale from the curated seed to the full universe of medical /
 * health / life-sciences journals (tens of thousands of records). Run this in a
 * network-enabled environment (CI / a maintainer's machine) — NOT inside the
 * sandboxed app runtime, which has no outbound network.
 *
 * SOURCES
 *   - OpenAlex /sources  https://api.openalex.org/sources
 *       Primary, bulk source. Cursor-paginated (per-page=200). Gives
 *       display_name, issn_l + issn[], host_organization_name, country_code,
 *       homepage_url, is_oa, is_in_doaj, works_count, cited_by_count,
 *       summary_stats (2yr_mean_citedness, h_index, i10_index), x_concepts
 *       (used for specialty tags + medical/health/life-sci filtering), apc_usd
 *       / apc_prices, and type.
 *   - DOAJ /search/journals/issn:<issn>  https://doaj.org/api/v2/
 *       Cross-referenced (rate-limit-friendly, failure-tolerant) when an ISSN
 *       exists and the record looks open access, to confirm OA + APC info.
 *
 * HONESTY
 *   Every generated record is dataConfidence:"ingested" with official
 *   verifyUrls. Indexing flags that have no free authoritative bulk source
 *   (WoS/Scopus/MEDLINE) are left "unknown"; only DOAJ + a PubMed/PMC *proxy*
 *   are inferred. Metrics from OpenAlex are APPROXIMATE PROXIES from open data:
 *   the 2-year mean citedness is carried into metrics.citeScore as a rough
 *   proxy (NOT a Clarivate Impact Factor — impactFactor is left undefined), and
 *   a note records exactly where the numbers came from. The curated seed
 *   supplies hand-verified indexing/metrics; the finder merges curated over
 *   ingested.
 *
 * USAGE
 *   SCHOLARLY_MAILTO=you@example.com node scripts/ingest-journals.mjs \
 *     --max 60000 --min-works 25 \
 *     --subjects "medicine,public health,surgery,nursing,dentistry,pharmacy"
 *
 * FLAGS
 *   --max <n>        Max records to write (default 50000).
 *   --subjects <csv> Concept keywords used to keep medical/health/life-sci
 *                    sources (default below).
 *   --min-works <n>  Skip tiny/defunct sources with fewer works (default 25).
 *   --doaj <bool>    Enable DOAJ cross-reference (default true). --doaj false
 *                    to skip the per-ISSN DOAJ calls entirely.
 *   --out <path>     Output path (default lib/journals/generated.ts).
 */

import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

// ---------------------------------------------------------------------------
// Config / CLI
// ---------------------------------------------------------------------------

const MAILTO =
  process.env.SCHOLARLY_MAILTO ||
  process.env.OPENALEX_MAILTO ||
  process.env.CROSSREF_MAILTO ||
  "";
const UA = `MedCoreResearchBuilder/4.0 (journal-ingest; ${
  MAILTO ? "mailto:" + MAILTO : "+https://medcore-research-builder.vercel.app"
})`;

const argv = process.argv.slice(2);
function arg(name, def) {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : def;
}
function boolArg(name, def) {
  const v = arg(name, undefined);
  if (v === undefined) return def;
  return !/^(false|0|no|off)$/i.test(v);
}

const MAX = Number(arg("max", "50000"));
const MIN_WORKS = Number(arg("min-works", "25"));
const USE_DOAJ = boolArg("doaj", true);
const OUT = arg("out", "");
const SUBJECTS = arg(
  "subjects",
  "medicine,public health,health,surgery,nursing,dentistry,pharmacy,clinical,pharmacology,epidemiology,psychiatry,biology,immunology,oncology",
)
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

const TODAY = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

// Medical / health / life-sciences concept matcher. Built from --subjects plus
// a stable medical regex so the keyword list and the universe stay in sync.
const SUBJECT_RE = new RegExp(
  SUBJECTS.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
  "i",
);
const MED_RE =
  /medicine|medical|health|clinical|surg|nurs|dental|odonto|pharma|pharmacol|biolog|biomed|epidemi|psych|immunolog|oncolog|cardio|neuro|patholog|physiolog|genetic|microbiolog|virolog|disease|therap|hospital|nutrition|public health|veterinar|dermatolog|pediatr|paediatr|obstetr|gynec|gynaec|radiolog|anesth|anaesth|orthop|ophthalm|urolog|nephrolog|endocrin|gastroenter|rheumatolog|hematolog|haematolog|infectious|rehabilit|geriatr|palliat/i;

// OpenAlex top-level concept ids we treat as in-scope (level-0 fields). Used as
// an additional positive signal alongside text matching.
const MED_CONCEPT_IDS = new Set([
  "C71924100", // Medicine
  "C86803240", // Biology
  "C185592680", // Chemistry (kept loose; filtered by text too)
  "C15744967", // Psychology
]);

// ---------------------------------------------------------------------------
// HTTP with retry/backoff + timeout
// ---------------------------------------------------------------------------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url, { retries = 5, timeoutMs = 30000 } = {}) {
  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        headers: { accept: "application/json", "user-agent": UA },
        signal: ctrl.signal,
      });
      clearTimeout(t);
      if (res.status === 429 || res.status >= 500) {
        throw Object.assign(new Error(`HTTP ${res.status}`), {
          status: res.status,
          retryAfter: Number(res.headers.get("retry-after")) || 0,
        });
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
      return await res.json();
    } catch (e) {
      clearTimeout(t);
      const transient =
        e.status === 429 || (e.status && e.status >= 500) || e.name === "AbortError";
      if (!transient || attempt >= retries) throw e;
      const backoff = e.retryAfter
        ? e.retryAfter * 1000
        : Math.min(30000, 500 * 2 ** attempt) + Math.floor(Math.random() * 400);
      attempt++;
      console.warn(`  retry ${attempt}/${retries} after ${backoff}ms (${e.message})`);
      await sleep(backoff);
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}
function slugify(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
function cleanIssn(issn) {
  if (!issn) return undefined;
  const v = String(issn).toUpperCase().replace(/[^0-9X-]/g, "");
  return /^\d{4}-?\d{3}[\dX]$/.test(v)
    ? v.length === 8
      ? `${v.slice(0, 4)}-${v.slice(4)}`
      : v
    : undefined;
}
function round(n, d = 1) {
  if (n == null || Number.isNaN(Number(n))) return undefined;
  const f = 10 ** d;
  return Math.round(Number(n) * f) / f;
}

/** OpenAlex apc may live in apc_usd or apc_prices[].price (USD). */
function extractApcUsd(s) {
  if (typeof s.apc_usd === "number") return s.apc_usd;
  const prices = Array.isArray(s.apc_prices) ? s.apc_prices : [];
  const usd = prices.find((p) => p && p.currency === "USD" && typeof p.price === "number");
  if (usd) return usd.price;
  const any = prices.find((p) => p && typeof p.price === "number");
  return any ? any.price : undefined;
}

// ---------------------------------------------------------------------------
// DOAJ cross-reference (optional, tolerant)
// ---------------------------------------------------------------------------

const doajCache = new Map();
async function lookupDoaj(issn) {
  if (!issn || !USE_DOAJ) return null;
  if (doajCache.has(issn)) return doajCache.get(issn);
  const url = `https://doaj.org/api/v2/search/journals/issn:${encodeURIComponent(issn)}`;
  try {
    const data = await getJson(url, { retries: 2, timeoutMs: 20000 });
    const hit = (data.results || [])[0];
    let result = null;
    if (hit && hit.bibjson) {
      const b = hit.bibjson;
      const hasApc = b.apc && b.apc.has_apc;
      const apcPrice =
        b.apc && Array.isArray(b.apc.max)
          ? (b.apc.max.find((m) => m && m.currency === "USD") || b.apc.max[0])
          : undefined;
      result = {
        inDoaj: true,
        hasApc: !!hasApc,
        apcUsd:
          hasApc && apcPrice && apcPrice.currency === "USD" ? Number(apcPrice.price) : undefined,
      };
    }
    doajCache.set(issn, result);
    // Be polite to DOAJ.
    await sleep(150);
    return result;
  } catch (e) {
    // Tolerant of failures — skip enrichment on error.
    doajCache.set(issn, null);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Record mapping (EXACT JournalRecord shape from lib/journals/types.ts)
// ---------------------------------------------------------------------------

async function mapSource(s) {
  const name = s.display_name;
  if (!name) return null;

  const issnL = cleanIssn(s.issn_l);
  const allIssn = (Array.isArray(s.issn) ? s.issn : []).map(cleanIssn).filter(Boolean);
  const issnOnline = issnL || allIssn[0];
  const issnPrint = allIssn.find((x) => x !== issnOnline);

  const concepts = (s.x_concepts || [])
    .map((c) => ({
      name: String(c.display_name || "").toLowerCase(),
      id: String(c.id || "").split("/").pop(),
      score: c.score || 0,
    }))
    .filter((c) => c.name);
  const specialties = concepts
    .filter((c) => c.score >= 10)
    .slice(0, 8)
    .map((c) => c.name);

  const stats = s.summary_stats || {};
  const meanCited = stats["2yr_mean_citedness"];
  const apcOpenAlex = extractApcUsd(s);

  // OA model. is_oa / is_in_doaj from OpenAlex; refine via DOAJ when possible.
  // OAModel union: "gold" | "hybrid" | "diamond" | "green" | "subscription" | "unknown".
  let oaModel = s.is_oa ? "gold" : "unknown";
  let inDoaj = !!s.is_in_doaj;
  let apcUsd = typeof apcOpenAlex === "number" ? apcOpenAlex : undefined;
  let dataSource = "OpenAlex";
  let doajApcKnown = false;

  // DOAJ cross-reference: only when we have an ISSN and it looks OA.
  if (USE_DOAJ && issnOnline && (s.is_oa || s.is_in_doaj)) {
    const d = await lookupDoaj(issnOnline);
    if (d && d.inDoaj) {
      inDoaj = true;
      oaModel = "gold";
      if (typeof d.apcUsd === "number") {
        apcUsd = d.apcUsd;
        doajApcKnown = true;
      }
      if (d.hasApc === false) {
        apcUsd = apcUsd ?? 0;
        doajApcKnown = true;
      }
      dataSource = "OpenAlex+DOAJ";
    }
  }

  // freeApc=true when in DOAJ and apc absent or 0 (diamond/platinum OA).
  const freeApc = inDoaj && (apcUsd === undefined || apcUsd === 0) ? true : undefined;
  // No-APC gold OA in DOAJ is "diamond/platinum" OA.
  if (oaModel === "gold" && freeApc) oaModel = "diamond";

  let apcModel;
  if (apcUsd === 0 || freeApc) apcModel = "none";
  else if (typeof apcUsd === "number" && apcUsd > 0 && inDoaj) apcModel = "gold-apc";
  else if (typeof apcUsd === "number" && apcUsd > 0) apcModel = "hybrid-apc";
  else apcModel = "unknown";

  // Metrics: APPROXIMATE PROXIES from OpenAlex open data — never a JIF.
  const citeScore = round(meanCited, 1);
  const metrics =
    citeScore !== undefined && citeScore > 0
      ? { citeScore, metricsYear: Number(TODAY.slice(0, 4)) }
      : undefined;

  const issnSlug = (issnOnline || "").replace(/[^0-9xX]/g, "");
  const id = `oa-${slugify(name)}-${issnSlug || normName(name).slice(0, 10)}`;

  const verifyUrls = {
    wos: "https://mjl.clarivate.com/home",
    scopus: "https://www.scopus.com/sources",
    nlm: "https://www.ncbi.nlm.nih.gov/nlmcatalog/journals/",
    doaj: issnOnline ? `https://doaj.org/toc/${issnOnline}` : "https://doaj.org/",
    scimago: "https://www.scimagojr.com/journalsearch.php",
  };
  if (s.homepage_url) verifyUrls.homepage = s.homepage_url;

  const noteParts = [];
  if (metrics) {
    noteParts.push(
      `metrics.citeScore (${metrics.citeScore}) is an APPROXIMATE proxy from OpenAlex 2-year mean citedness, NOT a Clarivate Impact Factor; verify at source.`,
    );
  }
  if (typeof stats.h_index === "number") {
    noteParts.push(`OpenAlex h-index ${stats.h_index}${typeof stats.i10_index === "number" ? `, i10 ${stats.i10_index}` : ""} (open-data proxy).`);
  }
  if (typeof s.works_count === "number") {
    noteParts.push(`OpenAlex works_count ${s.works_count}, cited_by ${s.cited_by_count ?? 0}.`);
  }
  if (apcUsd !== undefined && !doajApcKnown && dataSource === "OpenAlex") {
    noteParts.push(`APC (${apcUsd} USD) from OpenAlex — confirm at publisher/DOAJ.`);
  }
  noteParts.push(`Indexing (WoS/Scopus/MEDLINE) unverified — confirm via the official links.`);

  /** @type {import("../lib/journals/types").JournalRecord} */
  const record = {
    id,
    name,
    publisher: s.host_organization_name || "Unknown",
    country: s.country_code || "Unknown",
    issnPrint: issnPrint || undefined,
    issnOnline: issnOnline || undefined,
    homepage: s.homepage_url || undefined,
    scope: concepts.slice(0, 10).map((c) => c.name).join(", "),
    specialties: specialties.length ? specialties : concepts.slice(0, 4).map((c) => c.name),
    indexing: {
      wos: "none",
      scopus: "unknown",
      // PubMed/PMC proxy: OpenAlex doesn't expose MEDLINE selection; leave
      // pubmed/pmc "unknown" rather than assert. DOAJ is known.
      pubmed: "unknown",
      medline: "unknown",
      pmc: "unknown",
      doaj: inDoaj ? "indexed" : "unknown",
    },
    oaModel,
    apcModel,
    dataConfidence: "ingested",
    verifyUrls,
    verifiedAt: TODAY,
    dataSource,
    notes: noteParts.join(" "),
  };
  if (apcUsd !== undefined) record.apcUsd = apcUsd;
  if (freeApc !== undefined) record.freeApc = freeApc;
  if (metrics) record.metrics = metrics;

  return record;
}

// ---------------------------------------------------------------------------
// OpenAlex bulk pull (cursor pagination)
// ---------------------------------------------------------------------------

async function fromOpenAlex(records, seenIssn, seenName) {
  let cursor = "*";
  let scanned = 0;
  let kept = 0;
  let lastLogged = 0;
  // Filter at the API: real journals with enough output. Concept filtering is
  // done client-side (x_concepts is richer than the filterable field).
  const baseFilter = `type:journal,works_count:>${Math.max(0, MIN_WORKS - 1)}`;

  while (cursor && records.length < MAX) {
    const url =
      `https://api.openalex.org/sources?filter=${encodeURIComponent(baseFilter)}` +
      `&per-page=200&cursor=${encodeURIComponent(cursor)}` +
      (MAILTO ? `&mailto=${encodeURIComponent(MAILTO)}` : "");

    let data;
    try {
      data = await getJson(url);
    } catch (e) {
      console.warn("OpenAlex page failed (continuing with what we have):", e.message);
      break;
    }

    const results = data.results || [];
    for (const s of results) {
      scanned++;
      const name = s.display_name;
      if (!name) continue;
      if ((s.works_count || 0) < MIN_WORKS) continue;

      // Medical / health / life-sciences filter via concepts (text + ids).
      const conceptNames = (s.x_concepts || []).map((c) =>
        String(c.display_name || "").toLowerCase(),
      );
      const conceptIds = (s.x_concepts || []).map((c) => String(c.id || "").split("/").pop());
      const textMed = conceptNames.some((c) => MED_RE.test(c) || SUBJECT_RE.test(c));
      const idMed = conceptIds.some((id) => MED_CONCEPT_IDS.has(id));
      const nameMed = MED_RE.test(name) || SUBJECT_RE.test(name);
      if (!(textMed || idMed || nameMed)) continue;

      // De-dupe by issn_l then by normalized name.
      const issnKey = cleanIssn(s.issn_l) || (Array.isArray(s.issn) ? cleanIssn(s.issn[0]) : undefined);
      const nameKey = normName(name);
      if (issnKey && seenIssn.has(issnKey)) continue;
      if (seenName.has(nameKey)) continue;

      const rec = await mapSource(s);
      if (!rec) continue;
      if (issnKey) seenIssn.add(issnKey);
      seenName.add(nameKey);
      records.push(rec);
      kept++;

      if (records.length >= MAX) break;
      if (records.length - lastLogged >= 1000) {
        lastLogged = records.length;
        console.log(
          `  …${records.length} kept / ${scanned} scanned (${
            records[records.length - 1].name
          })`,
        );
      }
    }

    cursor = data.meta?.next_cursor || null;
    // Polite pacing for OpenAlex page requests.
    await sleep(100);
  }
  console.log(`OpenAlex: kept ${kept} medical/health journals from ${scanned} sources scanned.`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(
    `Journal ingestion — max ${MAX}, min-works ${MIN_WORKS}, DOAJ=${USE_DOAJ}\n` +
      `Subjects: ${SUBJECTS.join(", ")}`,
  );
  if (!MAILTO) {
    console.warn("Tip: set SCHOLARLY_MAILTO for OpenAlex/DOAJ polite-pool rate limits.");
  }

  const records = [];
  const seenIssn = new Set();
  const seenName = new Set();

  await fromOpenAlex(records, seenIssn, seenName);

  // Stable, deterministic ordering by name so re-runs produce minimal git diffs
  // (resume-safe / CI-commit-friendly). ISSN is the tie-breaker.
  records.sort(
    (a, b) =>
      a.name.localeCompare(b.name) ||
      (a.issnOnline || "").localeCompare(b.issnOnline || ""),
  );

  const here = path.dirname(fileURLToPath(import.meta.url));
  const target = OUT
    ? path.resolve(OUT)
    : path.join(here, "..", "lib", "journals", "generated.ts");

  const sourcesUsed = USE_DOAJ ? "OpenAlex /sources + DOAJ" : "OpenAlex /sources";
  const header =
    `/* AUTO-GENERATED by scripts/ingest-journals.mjs on ${new Date().toISOString()}.\n` +
    ` * ${records.length} journals. Source: ${sourcesUsed}.\n` +
    ` * Do NOT edit by hand — re-run the script (see docs/JOURNAL_INGESTION.md).\n` +
    ` *\n` +
    ` * dataConfidence:"ingested". Metrics are APPROXIMATE proxies from open data\n` +
    ` * (OpenAlex 2-year mean citedness -> metrics.citeScore); they are NOT\n` +
    ` * Clarivate Impact Factors. WoS/Scopus/MEDLINE indexing is "unknown" (no free\n` +
    ` * bulk source). The finder merges curated (hand-verified) over ingested. */\n\n`;

  const out =
    header +
    `import type { JournalRecord } from "./types";\n\n` +
    `export const generatedJournals: JournalRecord[] = ${JSON.stringify(records, null, 0)};\n`;

  await writeFile(target, out, "utf8");
  console.log(`Wrote ${records.length} journals -> ${target}`);
}

main().catch((e) => {
  console.error("Ingestion failed:", e);
  process.exitCode = 1;
});
