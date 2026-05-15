import type { ParsedReference, ReferenceVerification } from "../types";
import { pubmedCitationMatch, pubmedSummary, pubmedSearch } from "../scholarly/pubmed";
import { crossrefByDOI, crossrefSearch } from "../scholarly/crossref";
import { openalexSearch } from "../scholarly/openalex";
import { europepmcSearch } from "../scholarly/europepmc";
import { s2Paper, s2Search } from "../scholarly/semanticscholar";
import { unpaywallConfigured, unpaywallLookup } from "../scholarly/unpaywall";
import { formatVancouver } from "./parser";

const stop = new Set([
  "the", "a", "an", "of", "and", "or", "in", "on", "to", "for", "with", "by",
  "is", "are", "was", "were", "be", "been", "being", "at", "from", "as", "that",
  "this", "these", "those", "vs", "versus",
]);

export function tokenize(s: string): string[] {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stop.has(w));
}

export function jaccard(a: string, b: string): number {
  const A = new Set(tokenize(a));
  const B = new Set(tokenize(b));
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  A.forEach((t) => {
    if (B.has(t)) inter++;
  });
  return inter / (A.size + B.size - inter);
}

function authorSurnames(a?: string[]): string[] {
  return (a || [])
    .map((n) => {
      const trimmed = n.trim();
      // Vancouver style: "Smith J" => "Smith"; APA: "Smith, J." => "Smith"
      if (trimmed.includes(",")) return trimmed.split(",")[0].trim().toLowerCase();
      const parts = trimmed.split(/\s+/);
      // Usually last token is initials in Vancouver; first token is surname.
      // But sometimes "John Smith" => last token is surname. Use last token when
      // there's no comma.
      return (parts[parts.length - 1] || trimmed).toLowerCase();
    })
    .filter(Boolean);
}

function authorOverlap(a?: string[], b?: string[]): number {
  const A = new Set(authorSurnames(a));
  const B = new Set(authorSurnames(b));
  if (!A.size || !B.size) return 0;
  let inter = 0;
  A.forEach((x) => {
    if (B.has(x)) inter++;
  });
  return inter / Math.max(A.size, B.size);
}

export async function verifyReference(args: {
  originalText: string;
  parsed: ParsedReference;
}): Promise<ReferenceVerification> {
  const v: ReferenceVerification = {
    originalText: args.originalText,
    parsed: args.parsed,
    checks: {
      pubmedIndexed: "unknown",
      doiResolved: "unknown",
      metadataMatch: "unknown",
      duplicate: false,
      possibleRetractionOrConcern: "unknown",
    },
    confidence: "low",
    problems: [],
  };

  // 1) Crossref by DOI if available
  if (args.parsed.doi) {
    try {
      const w = await crossrefByDOI(args.parsed.doi);
      if (w) {
        v.crossref = {
          found: true,
          doi: w.doi,
          title: w.title,
          journal: w.journal,
          year: w.year,
          authors: w.authors,
          url: w.url,
        };
        v.checks.doiResolved = true;
        if (w.isRetraction || (w.relations || []).some((r) => /retraction|correction|expression/i.test(r))) {
          v.checks.possibleRetractionOrConcern = true;
        }
      } else {
        v.crossref = { found: false };
        v.checks.doiResolved = false;
        v.problems.push("DOI did not resolve via Crossref.");
      }
    } catch {
      v.problems.push("Crossref lookup failed; retry later.");
    }
  }

  // 2) Crossref bibliographic search if no DOI
  if (!args.parsed.doi && args.parsed.title) {
    try {
      const hits = await crossrefSearch({
        bibliographic: [args.parsed.title, args.parsed.journal, args.parsed.year]
          .filter(Boolean)
          .join(" "),
        rows: 5,
      });
      if (hits.length > 0) {
        const best = hits.sort((a, b) =>
          jaccard(b.title, args.parsed.title || "") -
          jaccard(a.title, args.parsed.title || "")
        )[0];
        const sim = jaccard(best.title, args.parsed.title);
        if (sim >= 0.5) {
          v.crossref = {
            found: true,
            doi: best.doi,
            title: best.title,
            journal: best.journal,
            year: best.year,
            authors: best.authors,
            score: best.score,
            url: best.url,
          };
          v.checks.doiResolved = true;
        } else {
          v.crossref = { found: false, score: best.score };
        }
      } else {
        v.crossref = { found: false };
      }
    } catch {
      v.problems.push("Crossref search failed; retry later.");
    }
  }

  // 3) PubMed by PMID if available
  let pmid = args.parsed.pmid || "";
  if (pmid) {
    try {
      const sums = await pubmedSummary([pmid]);
      const s = sums[0];
      if (s) {
        v.pubmed = {
          found: true,
          pmid: s.pmid,
          title: s.title,
          journal: s.journal,
          year: s.year,
          doi: s.doi,
          authors: s.authors,
          url: s.url,
        };
        v.checks.pubmedIndexed = true;
        if (s.pubtypes.some((t) => /retract|corrigend|expression of concern/i.test(t))) {
          v.checks.possibleRetractionOrConcern = true;
        }
      } else {
        v.pubmed = { found: false };
        v.checks.pubmedIndexed = false;
        v.problems.push(`PMID ${pmid} not found in PubMed.`);
      }
    } catch {
      v.problems.push("PubMed lookup failed; retry later.");
    }
  }

  // 4) If no PMID yet but we have a DOI, search PubMed by DOI
  if (!v.pubmed?.found && (args.parsed.doi || v.crossref?.doi)) {
    const doi = args.parsed.doi || v.crossref?.doi || "";
    try {
      const r = await pubmedSearch({ query: `${doi}[AID] OR ${doi}[DOI]`, retmax: 1 });
      if (r.ids[0]) {
        pmid = r.ids[0];
        const sums = await pubmedSummary([pmid]);
        const s = sums[0];
        if (s) {
          v.pubmed = {
            found: true,
            pmid: s.pmid,
            title: s.title,
            journal: s.journal,
            year: s.year,
            doi: s.doi,
            authors: s.authors,
            url: s.url,
          };
          v.checks.pubmedIndexed = true;
          if (s.pubtypes.some((t) => /retract|corrigend|expression of concern/i.test(t))) {
            v.checks.possibleRetractionOrConcern = true;
          }
        }
      } else {
        v.checks.pubmedIndexed = false;
      }
    } catch {
      v.problems.push("PubMed DOI lookup failed; retry later.");
    }
  }

  // 5) If still nothing in PubMed, try citation matcher
  if (!v.pubmed?.found && (args.parsed.title || args.parsed.journal)) {
    try {
      const surname = authorSurnames(args.parsed.authors)[0];
      const matched = await pubmedCitationMatch({
        journal: args.parsed.journal,
        year: args.parsed.year,
        volume: args.parsed.volume,
        page: args.parsed.pages?.split("-")[0],
        author: surname,
        title: args.parsed.title?.split(/[.:?]/)[0],
      });
      if (matched) {
        const sums = await pubmedSummary([matched]);
        const s = sums[0];
        if (s) {
          v.pubmed = {
            found: true,
            pmid: s.pmid,
            title: s.title,
            journal: s.journal,
            year: s.year,
            doi: s.doi,
            authors: s.authors,
            url: s.url,
          };
          v.checks.pubmedIndexed = true;
        }
      } else {
        v.checks.pubmedIndexed = false;
      }
    } catch {
      v.problems.push("PubMed citation match failed; retry later.");
    }
  }

  // 6) Metadata match
  const checks: number[] = [];
  if (v.pubmed?.found && v.pubmed.title && args.parsed.title) {
    checks.push(jaccard(v.pubmed.title, args.parsed.title));
  }
  if (v.crossref?.found && v.crossref.title && args.parsed.title) {
    checks.push(jaccard(v.crossref.title, args.parsed.title));
  }
  // Year match contributes too
  let yearMatch: boolean | null = null;
  const refYear = args.parsed.year;
  if (refYear) {
    const matched: string[] = [];
    if (v.pubmed?.year) matched.push(v.pubmed.year);
    if (v.crossref?.year) matched.push(v.crossref.year);
    if (matched.length) yearMatch = matched.every((y) => y === refYear);
  }
  let authorOk: boolean | null = null;
  if (args.parsed.authors?.length) {
    const a = authorOverlap(args.parsed.authors, v.pubmed?.authors || v.crossref?.authors || []);
    if (a > 0) authorOk = a >= 0.4;
  }
  if (checks.length === 0 && !v.pubmed?.found && !v.crossref?.found) {
    v.checks.metadataMatch = "unknown";
  } else {
    const sim = checks.length ? Math.max(...checks) : 0;
    if (sim >= 0.8 && (yearMatch !== false) && (authorOk !== false)) {
      v.checks.metadataMatch = "match";
    } else if (sim >= 0.5) {
      v.checks.metadataMatch = "partial";
    } else {
      v.checks.metadataMatch = "mismatch";
      v.problems.push("Title/metadata did not match the located record.");
    }
  }

  // 7) DOI conflict between PubMed and Crossref
  const doiP = v.pubmed?.doi?.toLowerCase();
  const doiC = v.crossref?.doi?.toLowerCase();
  if (doiP && doiC && doiP !== doiC) {
    v.problems.push("DOI in PubMed does not match DOI in Crossref for this record.");
  }
  // DOI parsed vs found
  const doiR = args.parsed.doi?.toLowerCase();
  if (doiR && doiP && doiR !== doiP) {
    v.problems.push("Provided DOI differs from PubMed-listed DOI.");
  }

  // 7b) OpenAlex enrichment (best-effort).
  try {
    const oaQuery = v.pubmed?.doi || v.crossref?.doi || args.parsed.doi || args.parsed.title;
    if (oaQuery) {
      const oa = await openalexSearch({ query: oaQuery, perPage: 3 });
      const best =
        oa.find(
          (w) => (w.doi || "").toLowerCase() === (v.pubmed?.doi || v.crossref?.doi || args.parsed.doi || "").toLowerCase()
        ) ||
        oa.find((w) => jaccard(w.title, args.parsed.title || v.pubmed?.title || v.crossref?.title || "") >= 0.6);
      if (best) {
        v.openalex = {
          found: true,
          id: best.id,
          title: best.title,
          journal: best.journal,
          year: best.year,
          doi: best.doi,
          pmid: best.pmid,
          url: best.url,
        };
        v.checks.inOpenAlex = true;
      } else {
        v.openalex = { found: false };
        v.checks.inOpenAlex = false;
      }
    }
  } catch {
    /* best effort */
  }

  // 7c) Europe PMC — adds preprints (bioRxiv/medRxiv) and OA indicators.
  try {
    const eQuery = v.pubmed?.doi || v.crossref?.doi || args.parsed.doi
      ? `DOI:"${(v.pubmed?.doi || v.crossref?.doi || args.parsed.doi)!.toLowerCase()}"`
      : args.parsed.pmid
      ? `EXT_ID:${args.parsed.pmid} AND SRC:MED`
      : args.parsed.title;
    if (eQuery) {
      const hits = await europepmcSearch({ query: eQuery, pageSize: 3 });
      const best =
        hits.find(
          (h) => (h.doi || "").toLowerCase() === (v.pubmed?.doi || v.crossref?.doi || args.parsed.doi || "").toLowerCase()
        ) ||
        hits.find((h) => jaccard(h.title, args.parsed.title || v.pubmed?.title || v.crossref?.title || "") >= 0.6);
      if (best) {
        v.europepmc = {
          found: true,
          source: best.source,
          title: best.title,
          journal: best.journal,
          year: best.year,
          doi: best.doi,
          pmid: best.pmid,
          pmcid: best.pmcid,
          isPreprint: best.isPreprint,
          isOpenAccess: best.isOpenAccess,
          url: best.url,
        };
        v.checks.inEuropePMC = true;
        if (best.isPreprint) v.checks.isPreprint = true;
        if (best.isOpenAccess) v.checks.openAccess = true;
      } else {
        v.europepmc = { found: false };
        v.checks.inEuropePMC = false;
      }
    }
  } catch {
    /* best effort */
  }

  // 7d) Semantic Scholar — citation influence + TLDR + OA PDF.
  try {
    const sId =
      v.pubmed?.doi || v.crossref?.doi || args.parsed.doi
        ? `DOI:${v.pubmed?.doi || v.crossref?.doi || args.parsed.doi}`
        : args.parsed.pmid
        ? `PMID:${args.parsed.pmid}`
        : null;
    if (sId) {
      const s = await s2Paper(sId);
      if (s) {
        v.semanticscholar = {
          found: true,
          paperId: s.paperId,
          title: s.title,
          venue: s.venue,
          year: s.year,
          doi: s.doi,
          pmid: s.pmid,
          influentialCitationCount: s.influentialCitationCount,
          citationCount: s.citationCount,
          tldr: s.tldr,
          openAccessPdfUrl: s.openAccessPdfUrl,
          url: s.url,
        };
        v.checks.inSemanticScholar = true;
        if (s.openAccessPdfUrl) v.checks.openAccess = true;
      } else {
        v.semanticscholar = { found: false };
        v.checks.inSemanticScholar = false;
      }
    } else if (args.parsed.title) {
      const results = await s2Search({ query: args.parsed.title, limit: 3 });
      const best = results.find(
        (r) => jaccard(r.title, args.parsed.title || "") >= 0.7
      );
      if (best) {
        v.semanticscholar = {
          found: true,
          paperId: best.paperId,
          title: best.title,
          venue: best.venue,
          year: best.year,
          doi: best.doi,
          pmid: best.pmid,
          influentialCitationCount: best.influentialCitationCount,
          citationCount: best.citationCount,
          tldr: best.tldr,
          openAccessPdfUrl: best.openAccessPdfUrl,
          url: best.url,
        };
        v.checks.inSemanticScholar = true;
      }
    }
  } catch {
    /* best effort — S2 has stricter rate limits */
  }

  // 7e) Unpaywall — only if email configured; lookup by DOI.
  if (unpaywallConfigured()) {
    const doi = v.pubmed?.doi || v.crossref?.doi || args.parsed.doi;
    if (doi) {
      try {
        const u = await unpaywallLookup(doi);
        if (u) {
          v.unpaywall = {
            found: true,
            isOA: u.isOA,
            oaStatus: u.oaStatus,
            bestOaPdfUrl: u.bestOaPdfUrl,
            bestOaLandingUrl: u.bestOaLandingUrl,
          };
          if (u.isOA) v.checks.openAccess = true;
        } else {
          v.unpaywall = { found: false };
        }
      } catch {
        /* best effort */
      }
    }
  }

  // 8) Confidence — now considers OpenAlex / EuropePMC corroboration.
  const corroboratedCount =
    (v.pubmed?.found ? 1 : 0) +
    (v.crossref?.found ? 1 : 0) +
    (v.openalex?.found ? 1 : 0) +
    (v.europepmc?.found ? 1 : 0) +
    (v.semanticscholar?.found ? 1 : 0);
  if (v.pubmed?.found && v.checks.metadataMatch === "match" && corroboratedCount >= 2)
    v.confidence = "high";
  else if (v.pubmed?.found && v.checks.metadataMatch === "match") v.confidence = "high";
  else if (v.crossref?.found && v.checks.metadataMatch !== "mismatch") v.confidence = "medium";
  else if (corroboratedCount >= 2 && v.checks.metadataMatch !== "mismatch") v.confidence = "medium";
  else if (v.checks.metadataMatch === "mismatch") v.confidence = "low";
  else v.confidence = "low";

  // 9) Build a corrected Vancouver string from verified source preference: PubMed > Crossref > parsed.
  const src = v.pubmed?.found
    ? {
        title: v.pubmed.title,
        authors: v.pubmed.authors,
        journal: v.pubmed.journal,
        year: v.pubmed.year,
        volume: args.parsed.volume,
        issue: args.parsed.issue,
        pages: args.parsed.pages,
        doi: v.pubmed.doi || args.parsed.doi,
        pmid: v.pubmed.pmid,
      }
    : v.crossref?.found
    ? {
        title: v.crossref.title,
        authors: v.crossref.authors,
        journal: v.crossref.journal,
        year: v.crossref.year,
        volume: args.parsed.volume,
        issue: args.parsed.issue,
        pages: args.parsed.pages,
        doi: v.crossref.doi || args.parsed.doi,
        pmid: args.parsed.pmid,
      }
    : args.parsed;
  v.correctedCitationVancouver = formatVancouver(src as ParsedReference);

  // Helpful problem notes when nothing found
  if (!v.pubmed?.found && v.checks.pubmedIndexed !== true) {
    v.problems.push("Not indexed in PubMed (may still be a valid book/guideline/preprint).");
  }
  if (!v.crossref?.found && v.checks.doiResolved !== true) {
    v.problems.push("No DOI located via Crossref. Older articles or books may not have one.");
  }

  return v;
}

export function markDuplicates(verifs: ReferenceVerification[]): ReferenceVerification[] {
  const keyMap = new Map<string, number>();
  for (let i = 0; i < verifs.length; i++) {
    const v = verifs[i];
    const key =
      v.pubmed?.pmid ||
      v.parsed.pmid ||
      (v.crossref?.doi || v.parsed.doi || "").toLowerCase() ||
      (v.parsed.title || "").toLowerCase().slice(0, 80);
    if (!key) continue;
    if (keyMap.has(key)) {
      v.checks.duplicate = true;
      verifs[keyMap.get(key)!].checks.duplicate = true;
    } else {
      keyMap.set(key, i);
    }
  }
  return verifs;
}
