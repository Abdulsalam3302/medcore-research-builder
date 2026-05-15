/**
 * evidenceFinder — multi-source evidence retrieval.
 *
 * Query PubMed, Semantic Scholar, OpenAlex, and Europe PMC in parallel,
 * dedupe results by DOI / PMID / normalized title, and rank by a blended
 * score that prefers recent + cited + influentially cited work and
 * down-weights retracted/preprint records when peer-reviewed versions
 * are available.
 *
 * This is the workhorse the SectionBuilder and ReferenceVerifier use
 * when the user asks "find evidence for X".
 */

import { pubmedSearchAndSummarize, type PubMedSummary } from "@/lib/scholarly/pubmed";
import { s2Search, type S2Paper } from "@/lib/scholarly/semanticscholar";
import { openalexSearch, type OpenAlexWork } from "@/lib/scholarly/openalex";
import { europepmcSearch, type EuropePMCPaper } from "@/lib/scholarly/europepmc";

export type EvidenceHit = {
  title: string;
  authors: string[];
  journal?: string;
  year?: string;
  doi?: string;
  pmid?: string;
  url: string;
  abstract?: string;
  tldr?: string;
  citationCount?: number;
  influentialCitationCount?: number;
  isOpenAccess?: boolean;
  openAccessPdfUrl?: string;
  isPreprint?: boolean;
  isRetracted?: boolean;
  sources: Array<"pubmed" | "s2" | "openalex" | "europepmc">;
  score: number;
  scoreBreakdown: Record<string, number>;
};

const RETRACTION_PATTERNS = [
  /\bretracted\b/i,
  /\bretraction\b/i,
  /\bwithdrawn\b/i,
  /\bexpression of concern\b/i,
];

function normTitle(t: string): string {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().slice(0, 120);
}

function flagRetraction(title: string, types?: string[]): boolean {
  if (RETRACTION_PATTERNS.some((r) => r.test(title))) return true;
  if (types?.some((t) => /retract/i.test(t) || /withdraw/i.test(t))) return true;
  return false;
}

function fromPubMed(p: PubMedSummary): EvidenceHit {
  return {
    title: p.title,
    authors: p.authors,
    journal: p.journal,
    year: p.year,
    doi: p.doi,
    pmid: p.pmid,
    url: p.url,
    isRetracted: flagRetraction(p.title, p.pubtypes),
    sources: ["pubmed"],
    score: 0,
    scoreBreakdown: {},
  };
}

function fromS2(p: S2Paper): EvidenceHit {
  return {
    title: p.title,
    authors: p.authors,
    journal: p.venue,
    year: p.year,
    doi: p.doi,
    pmid: p.pmid,
    url: p.url,
    abstract: p.abstract,
    tldr: p.tldr,
    citationCount: p.citationCount,
    influentialCitationCount: p.influentialCitationCount,
    openAccessPdfUrl: p.openAccessPdfUrl,
    isOpenAccess: Boolean(p.openAccessPdfUrl),
    isRetracted: flagRetraction(p.title, p.publicationTypes),
    sources: ["s2"],
    score: 0,
    scoreBreakdown: {},
  };
}

function fromOpenAlex(p: OpenAlexWork): EvidenceHit {
  return {
    title: p.title,
    authors: p.authors,
    journal: p.journal,
    year: p.year,
    doi: p.doi,
    pmid: p.pmid,
    url: p.url,
    isRetracted: flagRetraction(p.title, p.type ? [p.type] : []),
    sources: ["openalex"],
    score: 0,
    scoreBreakdown: {},
  };
}

function fromEuPMC(p: EuropePMCPaper): EvidenceHit {
  return {
    title: p.title,
    authors: p.authors,
    journal: p.journal,
    year: p.year,
    doi: p.doi,
    pmid: p.pmid,
    url: p.url,
    abstract: p.abstract,
    isOpenAccess: p.isOpenAccess,
    isPreprint: p.isPreprint,
    citationCount: p.citedByCount,
    isRetracted: flagRetraction(p.title),
    sources: ["europepmc"],
    score: 0,
    scoreBreakdown: {},
  };
}

function merge(a: EvidenceHit, b: EvidenceHit): EvidenceHit {
  return {
    ...a,
    abstract: a.abstract || b.abstract,
    tldr: a.tldr || b.tldr,
    doi: a.doi || b.doi,
    pmid: a.pmid || b.pmid,
    journal: a.journal || b.journal,
    year: a.year || b.year,
    citationCount: Math.max(a.citationCount ?? 0, b.citationCount ?? 0) || undefined,
    influentialCitationCount:
      Math.max(a.influentialCitationCount ?? 0, b.influentialCitationCount ?? 0) || undefined,
    openAccessPdfUrl: a.openAccessPdfUrl || b.openAccessPdfUrl,
    isOpenAccess: a.isOpenAccess || b.isOpenAccess,
    isPreprint: a.isPreprint ?? b.isPreprint,
    isRetracted: a.isRetracted || b.isRetracted,
    sources: Array.from(new Set([...a.sources, ...b.sources])) as EvidenceHit["sources"],
    scoreBreakdown: { ...b.scoreBreakdown, ...a.scoreBreakdown },
  };
}

function dedupe(all: EvidenceHit[]): EvidenceHit[] {
  const byKey = new Map<string, EvidenceHit>();
  for (const h of all) {
    const keys = [
      h.doi ? `doi:${h.doi.toLowerCase()}` : null,
      h.pmid ? `pmid:${h.pmid}` : null,
      h.title ? `title:${normTitle(h.title)}` : null,
    ].filter(Boolean) as string[];
    // find existing by any matching key
    let existing: EvidenceHit | undefined;
    let existingKey: string | undefined;
    for (const k of keys) {
      const cur = byKey.get(k);
      if (cur) {
        existing = cur;
        existingKey = k;
        break;
      }
    }
    const merged = existing ? merge(existing, h) : h;
    // re-key under all known identifiers so subsequent matches collapse
    for (const k of keys) byKey.set(k, merged);
    if (existingKey && !keys.includes(existingKey)) byKey.set(existingKey, merged);
  }
  // collapse to unique objects (keys may point to same record)
  const seen = new Set<EvidenceHit>();
  const out: EvidenceHit[] = [];
  for (const v of byKey.values()) {
    if (!seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }
  return out;
}

function rank(hits: EvidenceHit[]): EvidenceHit[] {
  const now = new Date().getFullYear();
  for (const h of hits) {
    const br: Record<string, number> = {};
    // recency: full credit if <=3y old, fading to 0 at 20y
    const y = Number(h.year);
    if (y && !Number.isNaN(y)) {
      const age = Math.max(0, now - y);
      br.recency = Math.max(0, 1 - age / 20) * 25;
    } else {
      br.recency = 0;
    }
    // log-scaled citation impact
    br.citations = Math.min(25, Math.log10(1 + (h.citationCount ?? 0)) * 10);
    br.influential = Math.min(20, Math.log10(1 + (h.influentialCitationCount ?? 0)) * 15);
    // multi-source consensus (paper found in N databases)
    br.consensus = (h.sources.length - 1) * 8;
    // open access bonus — easier to verify
    br.openAccess = h.isOpenAccess ? 5 : 0;
    // PMID present is a small quality bump (peer-reviewed indexing)
    br.indexed = h.pmid ? 5 : 0;
    // penalties
    br.retraction = h.isRetracted ? -100 : 0;
    br.preprint = h.isPreprint && !h.pmid ? -8 : 0;
    h.scoreBreakdown = br;
    h.score = Object.values(br).reduce((s, v) => s + v, 0);
  }
  return hits.sort((a, b) => b.score - a.score);
}

export async function findEvidence(args: {
  query: string;
  limit?: number;
  sources?: Array<"pubmed" | "s2" | "openalex" | "europepmc">;
  yearFrom?: number;
  yearTo?: number;
}): Promise<{
  hits: EvidenceHit[];
  perSourceCounts: Record<string, number>;
  errors: Record<string, string>;
}> {
  const sources = args.sources ?? ["pubmed", "s2", "openalex", "europepmc"];
  const perSource = Math.max(10, Math.ceil((args.limit ?? 25) * 1.5));
  const errors: Record<string, string> = {};
  const perSourceCounts: Record<string, number> = {};
  const results = await Promise.allSettled([
    sources.includes("pubmed")
      ? pubmedSearchAndSummarize({ query: args.query, retmax: perSource })
      : Promise.resolve([] as PubMedSummary[]),
    sources.includes("s2")
      ? s2Search({
          query: args.query,
          limit: perSource,
          yearFrom: args.yearFrom,
          yearTo: args.yearTo,
        })
      : Promise.resolve([] as S2Paper[]),
    sources.includes("openalex")
      ? openalexSearch({ query: args.query, perPage: perSource })
      : Promise.resolve([] as OpenAlexWork[]),
    sources.includes("europepmc")
      ? europepmcSearch({ query: args.query, pageSize: perSource })
      : Promise.resolve([] as EuropePMCPaper[]),
  ]);
  const labels = ["pubmed", "s2", "openalex", "europepmc"] as const;
  const all: EvidenceHit[] = [];
  results.forEach((r, i) => {
    const label = labels[i];
    if (r.status === "rejected") {
      errors[label] = String((r.reason as Error)?.message || r.reason);
      perSourceCounts[label] = 0;
      return;
    }
    const arr = r.value as Array<unknown>;
    perSourceCounts[label] = arr.length;
    if (label === "pubmed") all.push(...(arr as PubMedSummary[]).map(fromPubMed));
    else if (label === "s2") all.push(...(arr as S2Paper[]).map(fromS2));
    else if (label === "openalex") all.push(...(arr as OpenAlexWork[]).map(fromOpenAlex));
    else all.push(...(arr as EuropePMCPaper[]).map(fromEuPMC));
  });
  const ranked = rank(dedupe(all));
  return {
    hits: ranked.slice(0, args.limit ?? 25),
    perSourceCounts,
    errors,
  };
}
