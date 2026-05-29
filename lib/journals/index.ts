/**
 * Journal Finder engine — dataset assembly + matching + filtering.
 *
 * Dataset = curated international + curated Saudi + (optional) deploy-time
 * generated set (lib/journals/generated.ts, produced by scripts/ingest-
 * journals.mjs). De-dup by ISSN, then by normalized name; curated wins.
 *
 * Matching is deterministic and transparent — it never invents indexing or
 * metrics, and every match carries human-readable `reasons` and `cautions`.
 */

import type {
  JournalRecord,
  ManuscriptProfile,
  JournalFilters,
  JournalMatch,
  WosCollection,
} from "./types";
import { internationalJournals } from "./international";
import { saudiJournals } from "./saudi";

// Optional generated dataset. The file may not exist until the ingest script
// runs at deploy time, so we load it defensively without a hard import.
let generatedJournals: JournalRecord[] = [];
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
  const mod = require("./generated");
  if (Array.isArray(mod.generatedJournals)) generatedJournals = mod.generatedJournals;
} catch {
  /* no generated dataset yet — curated only */
}

const STOPWORDS = new Set([
  "the", "a", "an", "of", "and", "or", "in", "on", "for", "to", "with", "by",
  "study", "trial", "patients", "patient", "among", "using", "based", "analysis",
  "effect", "effects", "association", "associated", "outcomes", "outcome",
  "randomized", "randomised", "controlled", "systematic", "review", "versus",
]);

function tokenize(text?: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function issnKey(j: JournalRecord): string | null {
  return (j.issnOnline || j.issnPrint || "").replace(/[^0-9xX]/g, "").toLowerCase() || null;
}

/** Build the merged, de-duplicated dataset (curated wins over generated). */
export function allJournals(): JournalRecord[] {
  const byKey = new Map<string, JournalRecord>();
  const order: string[] = [];

  const add = (j: JournalRecord, isCurated: boolean) => {
    const key = issnKey(j) || normalizeName(j.name);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, j);
      order.push(key);
      return;
    }
    // Curated record wins; otherwise keep the first seen.
    if (isCurated && existing.dataConfidence !== "curated") {
      byKey.set(key, j);
    }
  };

  // Curated first so they win de-dup.
  for (const j of saudiJournals) add(j, true);
  for (const j of internationalJournals) add(j, true);
  for (const j of generatedJournals) add(j, false);

  return order.map((k) => byKey.get(k)!).filter(Boolean);
}

export function journalCount(): { total: number; curated: number; saudi: number; generated: number } {
  const all = allJournals();
  return {
    total: all.length,
    curated: all.filter((j) => j.dataConfidence === "curated").length,
    saudi: all.filter((j) => j.saudi).length,
    // Count from the de-duplicated set so total === curated-ish + generated.
    generated: all.filter((j) => j.dataConfidence !== "curated").length,
  };
}

/** Derive a manuscript profile from loosely-shaped project fields. */
export function profileFromInputs(args: {
  title?: string;
  abstract?: string;
  keywords?: string[];
  scope?: string;
  specialties?: string[];
  designCategory?: string;
  manuscriptType?: string;
}): ManuscriptProfile {
  return {
    title: args.title,
    abstract: args.abstract,
    keywords: args.keywords,
    scope: args.scope,
    specialties: args.specialties,
    designCategory: args.designCategory,
    manuscriptType: args.manuscriptType,
  };
}

function passesFilters(j: JournalRecord, f: JournalFilters): boolean {
  if (f.saudiOnly && !j.saudi) return false;
  if (f.requireScopus && j.indexing.scopus !== "indexed") return false;
  if (f.requirePubmed && j.indexing.pubmed !== "indexed") return false;
  if (f.requireMedline && j.indexing.medline !== "indexed") return false;
  if (f.requireDoaj && j.indexing.doaj !== "indexed") return false;
  if (f.openAccessOnly && !["gold", "diamond", "hybrid", "green"].includes(j.oaModel)) return false;
  if (f.wos && f.wos.length) {
    if (!f.wos.includes(j.indexing.wos)) return false;
  }
  if (typeof f.maxApcUsd === "number") {
    if (typeof j.apcUsd === "number" && j.apcUsd > f.maxApcUsd) return false;
  }
  if (typeof f.minImpactFactor === "number") {
    const jif = j.metrics?.impactFactor ?? -1;
    if (jif < f.minImpactFactor) return false;
  }
  if (f.country && j.country.toLowerCase() !== f.country.toLowerCase()) return false;
  if (f.specialties && f.specialties.length) {
    const set = new Set(j.specialties.map((s) => s.toLowerCase()));
    if (!f.specialties.some((s) => set.has(s.toLowerCase()))) return false;
  }
  if (f.query && f.query.trim()) {
    const q = f.query.toLowerCase();
    const hay = `${j.name} ${j.publisher} ${j.scope} ${j.specialties.join(" ")} ${j.abbrev || ""}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

const WOS_RANK: Record<WosCollection, number> = { SCIE: 3, SSCI: 3, ESCI: 2, none: 0 };

function scoreJournal(j: JournalRecord, p: ManuscriptProfile): JournalMatch {
  const reasons: string[] = [];
  const cautions: string[] = [];

  // ---- Topical relevance (0..60) ----
  const profileTokens = new Set([
    ...tokenize(p.title),
    ...tokenize(p.abstract),
    ...tokenize(p.scope),
    ...(p.keywords || []).flatMap((k) => tokenize(k)),
  ]);
  const journalTokens = new Set([
    ...tokenize(j.scope),
    ...j.specialties.flatMap((s) => tokenize(s)),
    ...tokenize(j.name),
    ...(j.trendingTopics || []).flatMap((t) => tokenize(t)),
  ]);
  let overlap = 0;
  for (const t of profileTokens) if (journalTokens.has(t)) overlap++;
  const denom = Math.max(6, profileTokens.size);
  const topicScore = Math.min(60, Math.round((overlap / denom) * 90));
  if (overlap > 0) reasons.push(`${overlap} topic term${overlap === 1 ? "" : "s"} match the journal scope`);

  // Specialty direct hit.
  const pSpec = new Set((p.specialties || []).map((s) => s.toLowerCase()));
  const specialtyHit = j.specialties.some((s) => pSpec.has(s.toLowerCase()));
  const specialtyBonus = specialtyHit ? 12 : 0;
  if (specialtyHit) reasons.push("Specialty directly matches");

  // ---- Manuscript-type fit (0..10) ----
  let typeScore = 0;
  if (p.manuscriptType && j.acceptedTypes && j.acceptedTypes.length) {
    if (j.acceptedTypes.includes(p.manuscriptType)) {
      typeScore = 10;
      reasons.push(`Accepts ${p.manuscriptType.replace(/_/g, " ")}`);
    } else {
      cautions.push(`May not accept ${p.manuscriptType.replace(/_/g, " ")} — verify scope`);
    }
  }

  // ---- Indexing quality (0..18) ----
  let indexScore = 0;
  indexScore += WOS_RANK[j.indexing.wos] * 3; // up to 9
  if (j.indexing.scopus === "indexed") indexScore += 4;
  if (j.indexing.medline === "indexed") indexScore += 4;
  else if (j.indexing.pubmed === "indexed") indexScore += 2;
  indexScore = Math.min(18, indexScore);
  if (j.indexing.wos === "SCIE") reasons.push("Web of Science SCIE-indexed");
  else if (j.indexing.wos === "ESCI") reasons.push("Web of Science ESCI (emerging)");
  if (j.indexing.medline === "indexed") reasons.push("MEDLINE-indexed");

  // ---- Confidence / honesty cautions ----
  if (j.dataConfidence !== "curated") {
    cautions.push("Indexing/metrics auto-ingested — verify at the official source");
  }
  if (j.notes) cautions.push(j.notes);
  if (j.indexing.wos === "ESCI") {
    cautions.push("ESCI titles may lack a Journal Impact Factor — confirm current WoS collection");
  }

  const score = Math.min(100, topicScore + specialtyBonus + typeScore + indexScore);
  return { journal: j, score, reasons, cautions };
}

/** Main entry: filter + score + rank journals for a manuscript. */
export function findJournals(
  profile: ManuscriptProfile,
  filters: JournalFilters = {},
  limit = 30,
): JournalMatch[] {
  const pool = allJournals().filter((j) => passesFilters(j, filters));
  const scored = pool.map((j) => scoreJournal(j, profile));
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // Tie-break: prefer higher WoS rank, then impact factor, then name.
    const wr = WOS_RANK[b.journal.indexing.wos] - WOS_RANK[a.journal.indexing.wos];
    if (wr !== 0) return wr;
    const ifr = (b.journal.metrics?.impactFactor ?? 0) - (a.journal.metrics?.impactFactor ?? 0);
    if (ifr !== 0) return ifr;
    return a.journal.name.localeCompare(b.journal.name);
  });
  return scored.slice(0, limit);
}

export function getJournalById(id: string): JournalRecord | undefined {
  return allJournals().find((j) => j.id === id);
}

export type { JournalRecord, ManuscriptProfile, JournalFilters, JournalMatch } from "./types";
