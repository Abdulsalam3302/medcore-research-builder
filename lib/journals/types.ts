/**
 * Journal Finder — data model.
 *
 * Designed to scale from a curated seed (this file's siblings) to tens of
 * thousands of records ingested at deploy time from DOAJ / Crossref / OpenAlex
 * / NLM Catalog (see scripts/ingest-journals.mjs). Every record carries a
 * `dataConfidence` and official `verifyUrls` so the UI can stay honest: we
 * never assert an indexing status or metric as fact without a path to verify
 * it at the source — consistent with the platform's no-fabrication ethos.
 */

/** Web of Science collection membership. */
export type WosCollection =
  | "SCIE" // Science Citation Index Expanded
  | "ESCI" // Emerging Sources Citation Index
  | "SSCI" // Social Sciences Citation Index
  | "none";

export type IndexStatus = "indexed" | "not-indexed" | "unknown";

export type OAModel = "gold" | "hybrid" | "diamond" | "green" | "subscription" | "unknown";

export type DataConfidence = "curated" | "ingested" | "community" | "unverified";

export type JournalIndexing = {
  /** Web of Science: which collection (SCIE high-value; ESCI emerging). */
  wos: WosCollection;
  /** Scopus coverage. */
  scopus: IndexStatus;
  /** PubMed (citations may appear via PMC even if not MEDLINE). */
  pubmed: IndexStatus;
  /** MEDLINE selective indexing (stricter than PubMed). */
  medline: IndexStatus;
  /** PubMed Central full-text archive. */
  pmc: IndexStatus;
  /** Directory of Open Access Journals. */
  doaj: IndexStatus;
};

export type JournalMetrics = {
  /** Clarivate Journal Impact Factor (JCR). Undefined when not in SCIE/SSCI. */
  impactFactor?: number;
  /** Scopus CiteScore. */
  citeScore?: number;
  /** SCImago Journal Rank. */
  sjr?: number;
  /** SJR/JIF quartile in primary category, when known. */
  quartile?: "Q1" | "Q2" | "Q3" | "Q4";
  /** Year the metrics above were last sourced (for transparency). */
  metricsYear?: number;
};

export type JournalRecord = {
  id: string;
  name: string;
  /** Common abbreviation (ISO4 / Index Medicus) when known. */
  abbrev?: string;
  publisher: string;
  /** Country the journal is *based in* (ISO-ish label). For Saudi set: "Saudi Arabia". */
  country: string;
  /** True only for journals that are 100% Saudi-based and Saudi-owned. */
  saudi?: boolean;
  issnPrint?: string;
  issnOnline?: string;
  homepage?: string;
  authorGuideUrl?: string;
  reviewerGuideUrl?: string;
  submissionUrl?: string;

  /** Free-text scope/aims used for relevance matching. */
  scope: string;
  /** Specialty tags (lowercase) used for filtering + matching. */
  specialties: string[];
  /** Manuscript types the journal commonly accepts. */
  acceptedTypes?: string[];

  indexing: JournalIndexing;
  metrics?: JournalMetrics;

  oaModel: OAModel;
  /** Article processing charge in USD (approx; verify at source). */
  apcUsd?: number;
  /** Median/approx time to first decision in days, when published. */
  timeToFirstDecisionDays?: number;
  /** Acceptance rate fraction (0..1) when published. */
  acceptanceRate?: number;

  /** Reporting-guideline families the journal explicitly endorses. */
  endorsedGuidelines?: string[];
  /** Topics the journal is actively soliciting (special issues / trends). */
  trendingTopics?: string[];
  specialIssues?: Array<{ title: string; deadline?: string; url?: string }>;

  dataConfidence: DataConfidence;
  /** Official sources a user can open to verify indexing/metrics themselves. */
  verifyUrls?: Partial<Record<"wos" | "scopus" | "nlm" | "doaj" | "scimago" | "homepage", string>>;
  /** Honest caveats, e.g. "ESCI not yet promoted to SCIE; verify current status". */
  notes?: string;
};

/** Manuscript context the finder scores journals against. */
export type ManuscriptProfile = {
  title?: string;
  abstract?: string;
  scope?: string;
  keywords?: string[];
  specialties?: string[];
  designCategory?: string;
  manuscriptType?: string;
  referencesText?: string;
};

export type JournalFilters = {
  query?: string;
  /** Restrict to journals in one of these WoS collections. */
  wos?: WosCollection[];
  requireScopus?: boolean;
  requirePubmed?: boolean;
  requireMedline?: boolean;
  requireDoaj?: boolean;
  saudiOnly?: boolean;
  openAccessOnly?: boolean;
  maxApcUsd?: number;
  minImpactFactor?: number;
  specialties?: string[];
  country?: string;
};

export type JournalMatch = {
  journal: JournalRecord;
  score: number; // 0..100 relevance+fit
  reasons: string[];
  cautions: string[];
};
