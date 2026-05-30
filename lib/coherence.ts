// Manuscript coherence / consistency engine.
//
// Pure, deterministic, text-only analysis. No network, no LLM.
// Treats the whole manuscript (title + sections + references) as one connected
// unit and flags conflicts BETWEEN components (cross-section inconsistencies),
// rather than judging any single section in isolation.

import type { ProjectState } from "@/lib/types";

export type CoherenceIssue = {
  id: string;
  severity: "high" | "medium" | "low";
  area: string;
  message: string;
  relatedSections: string[];
  fix: string;
};

export type CoherenceReport = {
  score: number;
  issues: CoherenceIssue[];
  checkedAt: string;
  citationOrder: { ok: boolean; detail: string };
};

/* ============================================================
   Text utilities
   ============================================================ */

const STOPWORDS = new Set([
  "the","a","an","and","or","but","of","to","in","on","for","with","without",
  "by","at","from","as","is","are","was","were","be","been","being","this","that",
  "these","those","it","its","we","our","their","they","he","she","his","her",
  "study","studies","research","paper","article","manuscript","analysis","data",
  "using","used","use","based","both","between","among","within","across","into",
  "than","then","also","may","can","could","would","should","will","not","no",
  "which","who","whom","whose","what","when","where","how","why","all","any",
  "each","more","most","other","some","such","only","own","same","so","very",
  "results","result","methods","method","introduction","discussion","conclusion",
  "background","objective","aim","aims","purpose","patients","patient","group",
  "groups","showed","found","reported","versus","vs","per","one","two","three",
  "associated","association","effect","effects","outcome","outcomes","level",
  "levels","high","low","new","novel","first","compared","comparison","present",
  "significant","significantly","increase","decrease","increased","decreased",
]);

function normalize(s: string): string {
  return (s || "").toLowerCase();
}

function words(s: string): string[] {
  return normalize(s)
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

// Content keywords (length >= 4, not a stopword, not pure number).
function keyTerms(s: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const w of words(s)) {
    const t = w.replace(/^-+|-+$/g, "");
    if (t.length < 4) continue;
    if (STOPWORDS.has(t)) continue;
    if (/^\d+$/.test(t)) continue;
    if (!seen.has(t)) {
      seen.add(t);
      out.push(t);
    }
  }
  return out;
}

// Crude singular/plural-tolerant membership: does `text` contain `term`?
function mentions(text: string, term: string): boolean {
  const hay = normalize(text);
  if (hay.includes(term)) return true;
  // tolerate simple plural / singular variants
  if (term.endsWith("s") && hay.includes(term.slice(0, -1))) return true;
  if (!term.endsWith("s") && hay.includes(term + "s")) return true;
  if (term.endsWith("y") && hay.includes(term.slice(0, -1) + "ies")) return true;
  return false;
}

function hasContent(s: string | undefined): boolean {
  return !!s && s.trim().length > 0;
}

/* ============================================================
   Numeric claim extraction (for Results <-> Discussion)
   ============================================================ */

// Capture numeric "claims" as normalized tokens: percentages, p-values,
// n-counts, confidence intervals, and bare decimals/ratios.
function numericClaims(s: string): string[] {
  const text = normalize(s);
  const claims = new Set<string>();
  const add = (raw: string) => {
    const c = raw.replace(/\s+/g, "").replace(/[,;]+$/g, "");
    if (c) claims.add(c);
  };

  // percentages: 12%, 12.5 %
  for (const m of text.matchAll(/(\d+(?:\.\d+)?)\s*%/g)) add(m[1] + "%");
  // p-values: p<0.05, p = 0.001, p≤0.01 — keep the operator so p<0.001 and
  // p=0.001 are distinct claims (real Results↔Discussion mismatch detection).
  for (const m of text.matchAll(/p\s*([<>=≤≥]+)\s*(\d*\.?\d+)/g)) add("p" + m[1] + m[2]);
  // n counts: n = 240, n=12
  for (const m of text.matchAll(/\bn\s*=\s*(\d+)/g)) add("n=" + m[1]);
  // confidence intervals: anchor on a real "CI" token (word-bounded) and bound
  // the gap to a few chars so "inCIdence … 5 to 9" can't masquerade as a CI.
  for (const m of text.matchAll(
    /\b(?:95\s*%\s*)?ci\b[^0-9]{0,6}(\d+(?:\.\d+)?)\s*(?:to|[-–—])\s*(\d+(?:\.\d+)?)/g,
  )) {
    add("ci" + m[1] + "-" + m[2]);
  }
  // effect sizes / ratios: require an explicit operator (or=1.45, hr: 0.78) so
  // the English word "or" in prose ("3 or 4 sites") is not read as an odds ratio.
  for (const m of text.matchAll(/\b(aor|ahr|or|hr|rr)\s*[=:]\s*(\d+(?:\.\d+)?)/g)) {
    add(m[1] + m[2]);
  }
  return Array.from(claims);
}

/* ============================================================
   Citation parsing
   ============================================================ */

type CitationParse = {
  numericMarkers: number[]; // every numeric citation number in first-appearance order across concatenated text
  authorYearCount: number;
  maxNumber: number;
  uniqueNumbers: Set<number>;
};

// Expand a numeric marker group like "1", "1,2", "1-3", "1, 2, 4-6"
function expandNumberGroup(inner: string): number[] {
  const out: number[] = [];
  for (const part of inner.split(/\s*,\s*/)) {
    const range = part.match(/^(\d+)\s*[-–—]\s*(\d+)$/);
    if (range) {
      const a = parseInt(range[1], 10);
      const b = parseInt(range[2], 10);
      if (Number.isFinite(a) && Number.isFinite(b) && b >= a && b - a < 500) {
        for (let i = a; i <= b; i++) out.push(i);
      }
    } else {
      const n = parseInt(part, 10);
      if (Number.isFinite(n)) out.push(n);
    }
  }
  return out;
}

function parseCitations(concatenated: string): CitationParse {
  const numericMarkers: number[] = [];
  const uniqueNumbers = new Set<number>();
  let maxNumber = 0;

  // Bracketed numeric markers: [1], [1,2], [1-3]
  // Process matches in source order so first-appearance ordering is preserved.
  const orderHits: Array<{ index: number; nums: number[] }> = [];

  for (const m of concatenated.matchAll(/\[(\d[\d\s,\-–—]*)\]/g)) {
    const nums = expandNumberGroup(m[1]);
    if (nums.length) orderHits.push({ index: m.index ?? 0, nums });
  }

  // Parenthesized numeric markers: (1), (1,2), (1-3) — only when clearly numeric
  // (avoid matching things like "(2020)" years by requiring the whole inner to be a number group).
  for (const m of concatenated.matchAll(/\((\d[\d\s,\-–—]*)\)/g)) {
    const inner = m[1].trim();
    // skip 4-digit standalone years
    if (/^\d{4}$/.test(inner)) continue;
    const nums = expandNumberGroup(inner);
    if (nums.length) orderHits.push({ index: m.index ?? 0, nums });
  }

  orderHits.sort((x, y) => x.index - y.index);
  for (const hit of orderHits) {
    for (const n of hit.nums) {
      numericMarkers.push(n);
      uniqueNumbers.add(n);
      if (n > maxNumber) maxNumber = n;
    }
  }

  // Author-year citations: (Smith et al., 2020), (Jones & Lee, 2019), (Smith, 2021)
  let authorYearCount = 0;
  for (const _m of concatenated.matchAll(
    /\([A-Z][A-Za-z'’-]+(?:\s+(?:et al\.?|and|&)\s+[A-Z][A-Za-z'’-]+)?(?:,)?\s*(?:et al\.?,?\s*)?\d{4}[a-z]?\)/g,
  )) {
    authorYearCount++;
  }

  return { numericMarkers, authorYearCount, maxNumber, uniqueNumbers };
}

function analyzeCitationOrder(markers: number[]): { ok: boolean; detail: string } {
  if (markers.length === 0) {
    return { ok: true, detail: "No numeric in-text citations detected." };
  }
  // First-appearance order of distinct numbers.
  const firstSeen: number[] = [];
  const seen = new Set<number>();
  for (const n of markers) {
    if (!seen.has(n)) {
      seen.add(n);
      firstSeen.push(n);
    }
  }

  const outOfOrder: string[] = [];
  for (let i = 1; i < firstSeen.length; i++) {
    if (firstSeen[i] < firstSeen[i - 1]) {
      outOfOrder.push(`[${firstSeen[i]}] appears after [${firstSeen[i - 1]}]`);
    }
  }

  // Skipped numbers: every number from 1..max should appear at least once.
  const max = Math.max(...firstSeen);
  const skipped: number[] = [];
  for (let i = 1; i <= max; i++) {
    if (!seen.has(i)) skipped.push(i);
  }

  const startsAtOne = firstSeen[0] === 1;

  // A genuine ordering defect = out-of-order first appearances or skipped
  // numbers. "Doesn't start at [1]" alone is common in a partial draft (one
  // section excerpt) and should not read as a hard error.
  const hasRealDefect = outOfOrder.length > 0 || skipped.length > 0;

  if (!hasRealDefect) {
    const detail = startsAtOne
      ? `Citations appear in ascending first-use order (1…${max}).`
      : `Citations ascend in first-use order but begin at [${firstSeen[0]}] (expected [1] in a complete manuscript).`;
    return { ok: true, detail };
  }

  const parts: string[] = [];
  if (!startsAtOne) parts.push(`first citation is [${firstSeen[0]}], expected [1]`);
  if (outOfOrder.length) parts.push(`out of order: ${outOfOrder.join("; ")}`);
  if (skipped.length)
    parts.push(`numbers cited but never first-appearing in sequence / missing: ${skipped.map((n) => `[${n}]`).join(", ")}`);

  return { ok: false, detail: parts.join(" — ") };
}

/* ============================================================
   Design inference
   ============================================================ */

type InferredDesign =
  | "rct"
  | "cohort"
  | "case-control"
  | "cross-sectional"
  | "observational"
  | "systematic-review"
  | "meta-analysis"
  | "case-report"
  | "unknown";

function inferDesign(project: ProjectState): InferredDesign {
  const a = project.researchTypeAnswers || {};
  const id = normalize(a.designId || "");
  const mt = normalize(a.manuscriptType || "");
  const fam = normalize(a.designFamily || "");
  const hay = `${id} ${mt} ${fam} ${normalize(a.notes || "")} ${normalize(a.targetJournal || "")}`;

  if (a.isReview && /systematic/.test(hay)) return "systematic-review";
  if (/meta[-\s]?analysis/.test(hay)) return "meta-analysis";
  if (/systematic[-\s]?review|prisma|systematic/.test(hay)) return "systematic-review";
  if (/\brct\b|randomi[sz]ed|consort|interv\.rct|trial\b/.test(hay)) return "rct";
  if (/case[-\s]?control/.test(hay)) return "case-control";
  if (/cohort|longitudinal|prospective|retrospective/.test(hay)) return "cohort";
  if (/cross[-\s]?section/.test(hay)) return "cross-sectional";
  if (/case[-\s]?report|case[-\s]?series|care\b/.test(hay) || a.isCaseReport) return "case-report";
  if (a.isReview) return "systematic-review";
  if (/observational|strobe/.test(hay)) return "observational";
  return "unknown";
}

function isObservational(d: InferredDesign): boolean {
  return (
    d === "cohort" ||
    d === "case-control" ||
    d === "cross-sectional" ||
    d === "observational"
  );
}

/* ============================================================
   Main analysis
   ============================================================ */

const SEVERITY_PENALTY: Record<CoherenceIssue["severity"], number> = {
  high: 12,
  medium: 6,
  low: 2,
};

export function analyzeCoherence(project: ProjectState): CoherenceReport {
  const issues: CoherenceIssue[] = [];
  const push = (i: CoherenceIssue) => issues.push(i);

  const s = project.sections || {
    introduction: "",
    methods: "",
    results: "",
    discussion: "",
    conclusion: "",
  };
  const intro = s.introduction || "";
  const methods = s.methods || "";
  const results = s.results || "";
  const discussion = s.discussion || "";
  const conclusion = s.conclusion || "";

  const title =
    project.titleFinal ||
    project.titleInputs?.draftTitle ||
    "";

  const designInferred = inferDesign(project);

  const concatenated = [intro, methods, results, discussion, conclusion]
    .filter(Boolean)
    .join("\n\n");

  const anyContent = hasContent(title) || hasContent(concatenated);

  // ---------- Check 8: Section completeness ----------
  const coreSections: Array<[string, string]> = [
    ["introduction", intro],
    ["methods", methods],
    ["results", results],
    ["discussion", discussion],
    ["conclusion", conclusion],
  ];
  for (const [name, body] of coreSections) {
    const trimmed = body.trim();
    if (trimmed.length === 0) {
      push({
        id: `completeness-empty-${name}`,
        severity: "medium",
        area: "Completeness",
        message: `The ${name} section is empty.`,
        relatedSections: [name],
        fix: `Draft the ${name} section. A manuscript cannot be assessed for coherence with a missing ${name}.`,
      });
    } else if (trimmed.length < 60) {
      push({
        id: `completeness-thin-${name}`,
        severity: "low",
        area: "Completeness",
        message: `The ${name} section is very short (<60 characters) and likely a placeholder.`,
        relatedSections: [name],
        fix: `Expand the ${name} section so its claims can be cross-checked against the rest of the manuscript.`,
      });
    }
  }

  // ---------- Check 1: Title <-> content ----------
  if (hasContent(title)) {
    const titleTerms = keyTerms(title);
    const body = `${intro}\n${methods}`;
    if (hasContent(body)) {
      const missingFromBody = titleTerms.filter((t) => !mentions(body, t));
      // Only flag if a meaningful fraction is missing, and surface up to a few.
      if (missingFromBody.length > 0 && titleTerms.length > 0) {
        const shown = missingFromBody.slice(0, 6);
        push({
          id: "title-terms-missing-body",
          severity: missingFromBody.length >= Math.max(2, Math.ceil(titleTerms.length / 2)) ? "high" : "medium",
          area: "Title ↔ Content",
          message: `Key title term(s) do not appear in the Introduction or Methods: ${shown.join(", ")}${
            missingFromBody.length > shown.length ? ", …" : ""
          }.`,
          relatedSections: ["title", "introduction", "methods"],
          fix: "Ensure every concept named in the title is introduced and operationalized in the body, or revise the title to match the study actually reported.",
        });
      }
    }

    // Major body concepts absent from the title (frequency-based).
    if (hasContent(intro) || hasContent(results)) {
      const freq = new Map<string, number>();
      for (const w of keyTerms(`${intro} ${results} ${methods}`)) {
        freq.set(w, (freq.get(w) || 0) + 1);
      }
      // Recount with raw occurrences for ranking.
      const occ = new Map<string, number>();
      for (const w of words(`${intro} ${results} ${methods}`)) {
        if (w.length < 5 || STOPWORDS.has(w) || /^\d+$/.test(w)) continue;
        occ.set(w, (occ.get(w) || 0) + 1);
      }
      const topConcepts = Array.from(occ.entries())
        .filter(([, c]) => c >= 3)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([w]) => w);
      const absentFromTitle = topConcepts.filter((t) => !mentions(title, t));
      // Heuristic: if a frequently-repeated central concept never shows in the title.
      if (absentFromTitle.length >= 2) {
        push({
          id: "body-concepts-missing-title",
          severity: "low",
          area: "Title ↔ Content",
          message: `Frequently discussed concept(s) are absent from the title: ${absentFromTitle
            .slice(0, 5)
            .join(", ")}.`,
          relatedSections: ["title", "introduction", "results"],
          fix: "Consider whether the title should reflect these central concepts so it accurately signals the paper's scope.",
        });
      }
    }
  }

  // ---------- Check 2: Title/Methods <-> design ----------
  const titleLc = normalize(title);
  const abstractishLc = `${titleLc} ${normalize(intro)}`;
  if (hasContent(title) || hasContent(intro)) {
    const claimsRandomized = /randomi[sz]ed|randomi[sz]ation|\brct\b/.test(abstractishLc);
    if (claimsRandomized && isObservational(designInferred)) {
      push({
        id: "design-conflict-randomized-observational",
        severity: "high",
        area: "Design Consistency",
        message: `The title/introduction uses "randomized" language, but the selected design is observational (${designInferred}).`,
        relatedSections: ["title", "introduction", "methods"],
        fix: "Reconcile the wording with the actual design: either the study is a randomized trial (update the design) or remove randomization language and describe the observational design.",
      });
    }

    const claimsSystematic = /systematic\s+review|meta[-\s]?analysis/.test(abstractishLc);
    if (claimsSystematic) {
      const methodsLc = normalize(methods);
      const hasPrismaish =
        /prisma|search strateg|databases?\b|inclusion criteria|exclusion criteria|screening|data extraction|risk of bias|eligibility criteria|systematic search/.test(
          methodsLc,
        );
      if (hasContent(methods) && !hasPrismaish) {
        push({
          id: "design-systematic-no-prisma",
          severity: "high",
          area: "Design Consistency",
          message:
            'The title/introduction claims a "systematic review" / "meta-analysis", but the Methods lack systematic-review reporting language (search strategy, databases, inclusion/exclusion criteria, screening, risk of bias).',
          relatedSections: ["title", "methods"],
          fix: "Add PRISMA-aligned Methods (search strategy, databases searched, dates, eligibility criteria, screening flow, risk-of-bias assessment) — or, if it is not a systematic review, change the title.",
        });
      }
    }

    // Title claims a design the methods/design registry contradicts.
    if (/cross[-\s]?section/.test(titleLc) && (designInferred === "cohort" || designInferred === "rct")) {
      push({
        id: "design-conflict-crosssectional-title",
        severity: "medium",
        area: "Design Consistency",
        message: `The title says "cross-sectional", but the selected design is ${designInferred}.`,
        relatedSections: ["title", "methods"],
        fix: "Align the title's stated design with the registered design, or correct the design selection.",
      });
    }
  }

  // ---------- Check 3: Introduction objective <-> Conclusion ----------
  if (hasContent(intro) && hasContent(conclusion)) {
    const objSentence = extractObjective(intro);
    if (objSentence) {
      const objTerms = keyTerms(objSentence).slice(0, 10);
      const answered = objTerms.filter((t) => mentions(conclusion, t));
      const coverage = objTerms.length ? answered.length / objTerms.length : 1;
      if (objTerms.length >= 3 && coverage < 0.34) {
        push({
          id: "objective-not-answered",
          severity: "medium",
          area: "Objective ↔ Conclusion",
          message:
            "The objective/aim stated in the Introduction does not appear to be addressed in the Conclusion (little term overlap).",
          relatedSections: ["introduction", "conclusion"],
          fix: "Make the Conclusion explicitly answer the stated aim — restate the objective and state what the study found about it.",
        });
      }
    }

    // Conclusion introduces a new outcome not in results.
    if (hasContent(results)) {
      const concKeys = keyTerms(conclusion);
      const introKeys = new Set(keyTerms(`${intro} ${methods} ${results}`));
      const novelInConc = concKeys.filter(
        (t) => !introKeys.has(t) && !mentions(`${intro} ${methods} ${results}`, t),
      );
      // Restrict to plausibly "outcome-ish" novel terms by frequency to reduce noise.
      const meaningfulNovel = novelInConc.filter((t) => t.length >= 6).slice(0, 5);
      if (meaningfulNovel.length >= 3) {
        push({
          id: "conclusion-new-outcome",
          severity: "medium",
          area: "Conclusion ↔ Results",
          message: `The Conclusion introduces concept(s) not present in the rest of the manuscript: ${meaningfulNovel.join(
            ", ",
          )}.`,
          relatedSections: ["conclusion", "results"],
          fix: "Conclusions must stay within what the Results support. Remove new outcomes/concepts or move them to Discussion as clearly-labelled hypotheses.",
        });
      }
    }
  }

  // ---------- Check 4: Results <-> Discussion ----------
  if (hasContent(discussion)) {
    if (hasContent(results)) {
      const resClaims = new Set(numericClaims(results));
      const discClaims = numericClaims(discussion);
      const orphanNumbers = discClaims.filter((c) => !resClaims.has(c));
      if (orphanNumbers.length > 0) {
        push({
          id: "discussion-numbers-not-in-results",
          severity: "high",
          area: "Results ↔ Discussion",
          message: `Numeric claim(s) appear in the Discussion but not in the Results (possible overclaim/fabrication): ${orphanNumbers
            .slice(0, 8)
            .join(", ")}.`,
          relatedSections: ["results", "discussion"],
          fix: "Every number discussed must first be reported in Results. Add the figure to Results, or correct/remove the Discussion claim.",
        });
      }
    }

    // Causal language in Discussion under an observational design.
    if (isObservational(designInferred)) {
      const causal = findCausalLanguage(discussion);
      if (causal.length > 0) {
        push({
          id: "discussion-causal-observational",
          severity: "high",
          area: "Causal Language",
          message: `The Discussion uses causal language (${causal
            .slice(0, 5)
            .join(", ")}) although the design is observational (${designInferred}) and cannot establish causation.`,
          relatedSections: ["discussion", "methods"],
          fix: 'Replace causal verbs with associational language ("was associated with", "correlated with") and add a limitation noting causality cannot be inferred.',
        });
      }
    }
  }

  // ---------- Check 5: Results <-> Methods ----------
  if (hasContent(results) && hasContent(methods)) {
    const resTerms = keyTerms(results);
    // Candidate "measures/outcomes": terms appearing in results but absent in methods.
    const notPrespecified = resTerms.filter(
      (t) => t.length >= 6 && !mentions(methods, t),
    );
    // Reduce noise: only flag terms that recur in results (look like real variables).
    const occ = new Map<string, number>();
    for (const w of words(results)) occ.set(w, (occ.get(w) || 0) + 1);
    const recurringUnspecified = notPrespecified.filter((t) => (occ.get(t) || 0) >= 2);
    if (recurringUnspecified.length >= 3) {
      push({
        id: "results-not-in-methods",
        severity: "medium",
        area: "Results ↔ Methods",
        message: `Outcome/measure term(s) reported in Results are not mentioned in Methods (not pre-specified): ${recurringUnspecified
          .slice(0, 6)
          .join(", ")}.`,
        relatedSections: ["methods", "results"],
        fix: "Pre-specify every reported outcome and measure in the Methods (or label post-hoc analyses as exploratory).",
      });
    }
  }

  // ---------- Check 6: Conclusion overclaim ----------
  if (hasContent(conclusion)) {
    const superlatives = findSuperlatives(conclusion);
    if (superlatives.length > 0) {
      // Check whether results provide supporting statistical evidence.
      const resultsHaveEvidence =
        hasContent(results) &&
        (numericClaims(results).length > 0 ||
          /p\s*[<>=≤≥]|confidence interval|\bci\b|significant/.test(normalize(results)));
      if (!resultsHaveEvidence) {
        push({
          id: "conclusion-overclaim",
          severity: "medium",
          area: "Overclaim",
          message: `The Conclusion uses strong/superlative language (${superlatives
            .slice(0, 5)
            .join(", ")}) without matching quantitative evidence in the Results.`,
          relatedSections: ["conclusion", "results"],
          fix: "Either report the statistical evidence (effect sizes, p-values, CIs) in Results that justifies these claims, or soften the Conclusion to match the strength of the data.",
        });
      }
    }
  }

  // ---------- Check 7: References / citations ----------
  const citations = parseCitations(concatenated);
  const citationOrder =
    citations.numericMarkers.length > 0
      ? analyzeCitationOrder(citations.numericMarkers)
      : { ok: true, detail: "No numeric in-text citations detected." };

  if (!citationOrder.ok) {
    push({
      id: "citation-order",
      severity: "medium",
      area: "Citations",
      message: `Numeric citations are not in ascending order of first appearance: ${citationOrder.detail}`,
      relatedSections: ["introduction", "methods", "results", "discussion", "conclusion"],
      fix: "Renumber in-text citations so they ascend by first appearance (1, 2, 3…) through the manuscript, and update the reference list to match.",
    });
  }

  const refCount = (project.references?.verifications || []).length;

  if (citations.maxNumber > 0) {
    // Numeric style: highest cited number should not exceed the reference count.
    if (refCount === 0) {
      push({
        id: "citations-no-references",
        severity: "high",
        area: "Citations",
        message: `The text cites numbered references (up to [${citations.maxNumber}]) but the reference list is empty.`,
        relatedSections: ["references"],
        fix: "Add and verify the cited references in the Reference Verifier so every in-text marker maps to an entry.",
      });
    } else if (citations.maxNumber > refCount) {
      push({
        id: "citations-exceed-references",
        severity: "high",
        area: "Citations",
        message: `In-text citations reference up to [${citations.maxNumber}], but only ${refCount} reference entr${
          refCount === 1 ? "y exists" : "ies exist"
        } — ${citations.maxNumber - refCount} cited number(s) have no matching reference.`,
        relatedSections: ["references"],
        fix: "Add the missing reference entries (or renumber) so the count of references matches the highest cited number.",
      });
    } else if (refCount > citations.maxNumber) {
      // reference entries never cited (trailing uncited entries)
      push({
        id: "references-uncited",
        severity: "low",
        area: "Citations",
        message: `${refCount - citations.maxNumber} reference entr${
          refCount - citations.maxNumber === 1 ? "y is" : "ies are"
        } never cited in the text (highest in-text citation is [${citations.maxNumber}]).`,
        relatedSections: ["references"],
        fix: "Cite each listed reference at least once, or remove uncited entries from the reference list.",
      });
    }

    // Specific uncited numbers within range (gaps) — informational, low.
    const missing: number[] = [];
    for (let i = 1; i <= Math.min(citations.maxNumber, refCount || citations.maxNumber); i++) {
      if (!citations.uniqueNumbers.has(i)) missing.push(i);
    }
    if (missing.length > 0 && citationOrder.ok) {
      push({
        id: "references-gap-uncited",
        severity: "low",
        area: "Citations",
        message: `Reference number(s) within range are never cited in the text: ${missing
          .slice(0, 10)
          .map((n) => `[${n}]`)
          .join(", ")}.`,
        relatedSections: ["references"],
        fix: "Ensure every reference between 1 and the highest cited number is actually cited, or renumber to close the gap.",
      });
    }
  } else if (citations.authorYearCount > 0 && refCount === 0) {
    push({
      id: "authoryear-no-references",
      severity: "medium",
      area: "Citations",
      message: `The text contains ${citations.authorYearCount} author–year citation(s) but the reference list is empty.`,
      relatedSections: ["references"],
      fix: "Add and verify a reference entry for each author–year citation used in the text.",
    });
  } else if (
    citations.numericMarkers.length === 0 &&
    citations.authorYearCount === 0 &&
    refCount === 0 &&
    hasContent(concatenated)
  ) {
    push({
      id: "no-citations-at-all",
      severity: "medium",
      area: "Citations",
      message: "No in-text citations and no references were detected anywhere in the manuscript.",
      relatedSections: ["introduction", "discussion", "references"],
      fix: "Support factual and prior-work claims with citations, and build the reference list in the Reference Verifier.",
    });
  }

  // ---------- Scoring ----------
  let score = 100;
  for (const i of issues) score -= SEVERITY_PENALTY[i.severity];
  if (score < 0) score = 0;

  // If there is no content at all, score is not meaningful — report 0 with a single note.
  if (!anyContent) {
    return {
      score: 0,
      issues: [
        {
          id: "no-content",
          severity: "low",
          area: "Completeness",
          message: "No manuscript content yet.",
          relatedSections: [],
          fix: "Draft a title and at least one section to run a coherence analysis.",
        },
      ],
      checkedAt: new Date().toISOString(),
      citationOrder,
    };
  }

  // Stable ordering: high → medium → low, then by area.
  const order: Record<CoherenceIssue["severity"], number> = { high: 0, medium: 1, low: 2 };
  issues.sort((a, b) => order[a.severity] - order[b.severity] || a.area.localeCompare(b.area));

  return {
    score,
    issues,
    checkedAt: new Date().toISOString(),
    citationOrder,
  };
}

/* ============================================================
   Linguistic helpers
   ============================================================ */

function extractObjective(intro: string): string | null {
  const sentences = intro.split(/(?<=[.!?])\s+/);
  const cueRe =
    /\b(aim(?:ed|s)?|objective|purpose|we sought|we investigated|this study|the goal|we examined|we evaluated|we assessed|hypothesi[sz]ed?|we determined)\b/i;
  for (const sentence of sentences) {
    if (cueRe.test(sentence)) return sentence;
  }
  // fall back to last sentence of intro (often the aim)
  return sentences.length ? sentences[sentences.length - 1] : null;
}

const CAUSAL_TERMS = [
  "caused",
  "causes",
  "causing",
  "cause of",
  "prevents",
  "prevented",
  "leads to",
  "led to",
  "results in",
  "resulted in",
  "induces",
  "induced",
  "produces",
  "produced",
  "due to our intervention",
  "because of the",
];

function findCausalLanguage(text: string): string[] {
  const lc = normalize(text);
  const hits: string[] = [];
  for (const term of CAUSAL_TERMS) {
    if (lc.includes(term) && !hits.includes(term)) hits.push(term);
  }
  return hits;
}

const SUPERLATIVE_TERMS = [
  "first",
  "novel",
  "proves",
  "proven",
  "proof",
  "confirms",
  "confirmed",
  "significant improvement",
  "unprecedented",
  "definitive",
  "conclusively",
  "groundbreaking",
  "for the first time",
  "establishes",
  "demonstrates conclusively",
];

function findSuperlatives(text: string): string[] {
  const lc = normalize(text);
  const hits: string[] = [];
  for (const term of SUPERLATIVE_TERMS) {
    // word-boundary-ish containment
    const re = new RegExp(`(^|[^a-z])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z]|$)`, "i");
    if (re.test(lc) && !hits.includes(term)) hits.push(term);
  }
  return hits;
}
