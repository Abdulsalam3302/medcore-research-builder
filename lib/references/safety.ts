/**
 * Reference-accuracy SAFETY LAYER (deterministic, no API calls, no LLM).
 *
 * Purpose: surface every citation that a HUMAN must re-verify before submission.
 * This layer NEVER asserts that a reference is correct. AI parsing and automated
 * source matching can mis-match or hallucinate references, so this module is
 * intentionally conservative: when in doubt, it flags for human review.
 *
 * It operates purely over `ReferenceVerification[]` (the output of the existing
 * verifier) plus the manuscript section text. It reuses the real field names
 * from `lib/types.ts` (checks.metadataMatch, checks.possibleRetractionOrConcern,
 * checks.duplicate, confidence, pubmed/crossref/etc.) and degrades gracefully if
 * any field is absent.
 */

import type { ReferenceVerification } from "../types";
import { tokenize } from "./verify";

export type ReferenceFlagKind =
  | "unverified"
  | "low-confidence-match"
  | "metadata-mismatch"
  | "possibly-irrelevant"
  | "retracted"
  | "duplicate"
  | "predatory-risk"
  | "uncited-in-text"
  | "cited-not-in-list";

export type ReferenceFlagSeverity = "critical" | "warning" | "info";

export type ReferenceSafetyFlag = {
  refIndex: number; // 0-based index into the verifications array; -1 for list-level flags
  severity: ReferenceFlagSeverity;
  kind: ReferenceFlagKind;
  message: string;
};

export type ReferenceSafetyAssessment = {
  score: number; // 0–100; higher = fewer outstanding human-review items (NOT a correctness guarantee)
  flags: ReferenceSafetyFlag[];
  summary: string;
};

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Token-overlap (containment) of `a` within the topic token set `b`. 0..1. */
function overlapAgainstTopic(a: string, topicTokens: Set<string>): number {
  const at = new Set(tokenize(a));
  if (at.size === 0 || topicTokens.size === 0) return 0;
  let inter = 0;
  at.forEach((t) => {
    if (topicTokens.has(t)) inter++;
  });
  // Containment of the (usually short) reference text inside the topic.
  return inter / at.size;
}

/** Best human-readable title available for a verification, in source-priority order. */
function bestTitle(v: ReferenceVerification): string {
  return (
    v.pubmed?.title ||
    v.crossref?.title ||
    v.openalex?.title ||
    v.europepmc?.title ||
    v.semanticscholar?.title ||
    v.parsed?.title ||
    ""
  );
}

/** Best descriptive blob for relevance scoring (title + any abstract/tldr). */
function relevanceText(v: ReferenceVerification): string {
  const parts = [
    bestTitle(v),
    v.parsed?.journal || v.pubmed?.journal || v.crossref?.journal || "",
    // Semantic Scholar TLDR is the closest thing to an abstract in the shape.
    v.semanticscholar?.tldr || "",
  ];
  return parts.filter(Boolean).join(" ");
}

/** Detect whether the manuscript body text appears to actually cite a reference. */
function looksCitedInText(v: ReferenceVerification, sectionsLower: string): boolean {
  if (!sectionsLower) return false;
  const pmid = v.parsed?.pmid || v.pubmed?.pmid;
  if (pmid && sectionsLower.includes(pmid.toLowerCase())) return true;
  const doi = (v.parsed?.doi || v.crossref?.doi || v.pubmed?.doi || "").toLowerCase();
  if (doi && sectionsLower.includes(doi)) return true;
  // First-author surname + year is the most common in-text signal.
  const firstAuthor = (v.parsed?.authors?.[0] || v.pubmed?.authors?.[0] || v.crossref?.authors?.[0] || "")
    .trim();
  const surname = firstAuthor.includes(",")
    ? firstAuthor.split(",")[0].trim()
    : firstAuthor.split(/\s+/)[0] || "";
  const year = v.parsed?.year || v.pubmed?.year || v.crossref?.year || "";
  if (surname.length > 2 && year) {
    const s = surname.toLowerCase();
    const y = year.toLowerCase();
    // Look for surname and year within a small window of each other.
    const idx = sectionsLower.indexOf(s);
    if (idx !== -1) {
      const window = sectionsLower.slice(Math.max(0, idx - 40), idx + s.length + 40);
      if (window.includes(y)) return true;
    }
  }
  return false;
}

/**
 * Heuristic predatory / quality-risk signal. Advisory only — flags for human
 * review, never an accusation. A reference that no trusted index could locate
 * AND has no DOI is the weakest possible provenance.
 */
function predatoryRisk(v: ReferenceVerification): boolean {
  const inAnyIndex =
    v.pubmed?.found ||
    v.crossref?.found ||
    v.openalex?.found ||
    v.europepmc?.found ||
    v.semanticscholar?.found;
  const hasDoi = !!(v.parsed?.doi || v.crossref?.doi || v.pubmed?.doi);
  // Located nowhere and no resolvable DOI => provenance unestablished.
  return !inAnyIndex && !hasDoi;
}

/* ------------------------------------------------------------------ */
/* Main assessment                                                    */
/* ------------------------------------------------------------------ */

export function assessReferenceSafety(
  verifications: ReferenceVerification[],
  sectionsText: string,
): ReferenceSafetyAssessment {
  const flags: ReferenceSafetyFlag[] = [];
  const verifs = Array.isArray(verifications) ? verifications : [];
  const sectionsLower = (sectionsText || "").toLowerCase();

  // Build the manuscript "topic" token set from the section text itself.
  // We keep the most frequent content tokens as a proxy for the manuscript's
  // subject matter, used only for a *low-overlap → review* relevance flag.
  const topicTokens = new Set(tokenize(sectionsText || ""));
  const hasTopic = topicTokens.size >= 12; // need enough signal to judge relevance

  verifs.forEach((v, i) => {
    const checks = v?.checks || ({} as ReferenceVerification["checks"]);

    // 1) Retraction / expression of concern — CRITICAL.
    if (checks.possibleRetractionOrConcern === true) {
      flags.push({
        refIndex: i,
        severity: "critical",
        kind: "retracted",
        message:
          "A source flagged a possible retraction, correction, or expression of concern. Do not cite until you confirm the article's current status with the publisher/PubMed.",
      });
    }

    // 2) Metadata mismatch — the located record does not match what was pasted.
    if (checks.metadataMatch === "mismatch") {
      flags.push({
        refIndex: i,
        severity: "critical",
        kind: "metadata-mismatch",
        message:
          "The located record's title/year/authors did not match the pasted citation. This is a classic hallucination signature — confirm the reference points to the intended article.",
      });
    }

    // 3) Unverified — located in no trusted index at all.
    const inAnyIndex =
      v.pubmed?.found ||
      v.crossref?.found ||
      v.openalex?.found ||
      v.europepmc?.found ||
      v.semanticscholar?.found;
    if (!inAnyIndex) {
      flags.push({
        refIndex: i,
        severity: "warning",
        kind: "unverified",
        message:
          "Not located in any trusted index (PubMed/Crossref/OpenAlex/Europe PMC/Semantic Scholar). May be a valid book, guideline, or grey-literature item — but verify it exists exactly as written before citing.",
      });
    }

    // 4) Low-confidence match — found something, but corroboration is weak.
    if (inAnyIndex && v.confidence === "low") {
      flags.push({
        refIndex: i,
        severity: "warning",
        kind: "low-confidence-match",
        message:
          "Low overall match confidence. The automated cross-check is uncertain this is the right record — verify manually.",
      });
    }

    // 5) Predatory / provenance risk — advisory.
    if (predatoryRisk(v)) {
      flags.push({
        refIndex: i,
        severity: "warning",
        kind: "predatory-risk",
        message:
          "No trusted index and no resolvable DOI. Provenance is unestablished; check the journal/venue is legitimate (Beall-style / DOAJ / journal indexing) before citing.",
      });
    }

    // 6) Duplicate.
    if (checks.duplicate === true) {
      flags.push({
        refIndex: i,
        severity: "info",
        kind: "duplicate",
        message: "Appears to duplicate another entry in the reference list. Merge or remove one.",
      });
    }

    // 7) Possibly irrelevant — low token overlap with the manuscript topic.
    // Only judged when we both (a) have a manuscript topic and (b) have a
    // reasonably descriptive title to compare. Conservative: this is a prompt
    // for human review, never an assertion of irrelevance.
    if (hasTopic) {
      const text = relevanceText(v);
      if (tokenize(text).length >= 3) {
        const ov = overlapAgainstTopic(text, topicTokens);
        if (ov < 0.12) {
          flags.push({
            refIndex: i,
            severity: "info",
            kind: "possibly-irrelevant",
            message:
              "Low topical overlap between this reference's title and your manuscript text. It may be off-topic or mis-matched — confirm it actually supports the claim it is attached to.",
          });
        }
      }
    }

    // 8) In the reference list but not detectably cited in the body text.
    if (sectionsLower && !looksCitedInText(v, sectionsLower)) {
      flags.push({
        refIndex: i,
        severity: "info",
        kind: "uncited-in-text",
        message:
          "Could not detect an in-text citation (author-year, DOI, or PMID) for this reference in the section text. Confirm it is cited, or remove it. (Numeric/superscript styles may not be detectable here.)",
      });
    }
  });

  // 9) List-level: in-text author-year mentions with no matching list entry.
  // Heuristic — scan body for "Surname (YYYY)" / "Surname et al., YYYY" patterns
  // and check whether each surname appears among the reference authors.
  if (sectionsLower) {
    const listSurnames = new Set<string>();
    verifs.forEach((v) => {
      const authors = v.parsed?.authors || v.pubmed?.authors || v.crossref?.authors || [];
      authors.forEach((a) => {
        const surname = a.includes(",") ? a.split(",")[0] : a.split(/\s+/)[0];
        if (surname && surname.length > 2) listSurnames.add(surname.toLowerCase());
      });
    });
    if (listSurnames.size > 0) {
      const citeRe = /([A-Z][a-zA-Z'`-]{2,})\s*(?:et al\.?,?\s*)?\(?\s*(?:19|20)\d{2}\b/g;
      const seen = new Set<string>();
      let m: RegExpExecArray | null;
      let count = 0;
      while ((m = citeRe.exec(sectionsText || "")) && count < 2000) {
        count++;
        const surname = (m[1] || "").toLowerCase();
        if (!surname || seen.has(surname)) continue;
        seen.add(surname);
        if (!listSurnames.has(surname)) {
          flags.push({
            refIndex: -1,
            severity: "info",
            kind: "cited-not-in-list",
            message: `An in-text citation appears to reference "${m[1]}" (with a year) but no reference list entry has a matching first-author surname. Add the missing reference or correct the citation.`,
          });
        }
      }
    }
  }

  // ---- Scoring (deductive; clamped 0..100) ----
  // A reference list with no outstanding human-review items scores 100. Items
  // deduct by severity. This is a triage score, NOT a correctness guarantee.
  let score = 100;
  for (const f of flags) {
    if (f.severity === "critical") score -= 18;
    else if (f.severity === "warning") score -= 8;
    else score -= 3;
  }
  score = Math.max(0, Math.min(100, score));

  // ---- Summary ----
  const critical = flags.filter((f) => f.severity === "critical").length;
  const warning = flags.filter((f) => f.severity === "warning").length;
  const info = flags.filter((f) => f.severity === "info").length;

  let summary: string;
  if (verifs.length === 0) {
    summary =
      "No verified references yet. Run the Reference Verifier first, then re-check here. Every citation still requires human verification.";
  } else if (flags.length === 0) {
    summary = `${verifs.length} reference(s) reviewed; no automated red flags. This is NOT a guarantee of correctness — every citation must still be human-verified against the original source.`;
  } else {
    summary = `${verifs.length} reference(s) reviewed: ${critical} critical, ${warning} warning, ${info} advisory flag(s) for human review. Resolve critical flags before submission; automated checks can miss errors and cannot confirm correctness.`;
  }

  return { score, flags, summary };
}
