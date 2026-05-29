/**
 * Language-editing / academic-writing assistant — pure helpers + prompt builders.
 *
 * HONESTY CONSTRAINT (ethics): nothing here promises "zero AI detection" or
 * "zero plagiarism". The heuristics below are advisory signals only. No tool —
 * including this one — can guarantee AI-undetectability or zero plagiarism.
 * They exist to (a) reduce robotic, AI-sounding patterns, (b) improve human
 * readability, and (c) flag potential integrity issues for the author to fix.
 * Human review, proper citation, and journal AI-disclosure remain the author's
 * responsibility.
 */

import { readability, type ReadabilityReport } from "../readability";

/* ============================================================
   Prompt builder + schema
   ============================================================ */

export const LANGUAGE_EDIT_SCHEMA = `Return ONLY this JSON (no prose, no markdown, no code fences):
{
  "editedText": "string (the improved text, meaning-preserving)",
  "changes": [
    {
      "type": "grammar|clarity|tone|concision|flow|word-choice|structure",
      "before": "string (short snippet of the original)",
      "after": "string (short snippet of the edit)",
      "reason": "string (why this improves the writing)"
    }
  ],
  "preservedClaims": ["string (key facts/numbers/citations confirmed unchanged)"],
  "registerNotes": ["string (how human/natural academic register was achieved)"],
  "uncertainties": ["string (anything the editor was unsure about — for human review)"]
}`;

export type LanguageChange = {
  type:
    | "grammar"
    | "clarity"
    | "tone"
    | "concision"
    | "flow"
    | "word-choice"
    | "structure";
  before: string;
  after: string;
  reason: string;
};

export type LanguageEditLLMResponse = {
  editedText: string;
  changes: LanguageChange[];
  preservedClaims: string[];
  registerNotes: string[];
  uncertainties: string[];
};

export type LanguageEditArgs = {
  text: string;
  section?: string; // e.g. "introduction", "discussion", or "pasted text"
  targetAudience?: string; // e.g. "general medical readership"
  englishVariant?: "US" | "UK";
  notes?: string; // author guidance
};

export function buildLanguageEditPrompt(args: LanguageEditArgs): string {
  const variant =
    args.englishVariant === "UK" ? "British English" : "American English";
  const audience = args.targetAudience || "an international medical readership";
  const where = args.section ? `the manuscript ${args.section}` : "the text below";

  return `You are a meticulous scientific copy-editor and language editor for medical research manuscripts. Improve ${where} for clarity, grammar, academic tone, flow, and readability for ${audience}, writing in ${variant}.

ABSOLUTE RULES — never violate:
- PRESERVE MEANING EXACTLY. Do NOT add, remove, or alter any data, numbers, statistics, p-values, confidence intervals, sample sizes, effect estimates, study claims, hedging strength, or conclusions.
- Do NOT add, remove, renumber, or change any citation, reference marker, DOI, PMID, figure/table call-out, or quotation.
- Do NOT introduce new facts, references, or claims. If something is unclear or missing, note it under "uncertainties" — never invent.
- Do NOT strengthen or weaken the author's claims (e.g. do not turn "may be associated with" into "causes").

STYLE GOALS — produce a HUMAN, NATURAL ACADEMIC register:
- Vary sentence length and structure; avoid robotic uniformity and metronomic rhythm.
- Avoid filler and empty connective scaffolding ("It is important to note that", "Moreover, furthermore, additionally" stacking).
- Avoid AI-cliché vocabulary ("delve", "tapestry", "intricate", "navigate the landscape", "robust" as filler, "leverage" as a verb of last resort).
- Prefer precise medical terminology and active voice where it does not distort meaning; keep necessary passive voice in methods.
- Keep the author's voice; edit, do not rewrite from scratch.

NOTE ON INTEGRITY: You are an editing aid. You cannot and must not claim to make text "undetectable" by AI classifiers or "plagiarism-free". Your job is to improve human readability and reduce mechanical/AI-sounding patterns. The author remains responsible for originality, citation, and any journal AI-use disclosure.

${args.notes ? `Author guidance:\n${args.notes}\n\n` : ""}Text to edit:
"""
${args.text || "(empty)"}
"""

${LANGUAGE_EDIT_SCHEMA}

Return ONLY the JSON object.`;
}

/* ============================================================
   Pure heuristic: readability (reuses lib/readability.ts)
   ============================================================ */

export type ReadabilityDelta = {
  before: ReadabilityReport;
  after: ReadabilityReport;
  fleschDelta: number; // positive = easier to read after edit
  fkGradeDelta: number; // negative = lower (easier) grade after edit
  avgSentenceLengthDelta: number;
};

export function estimateReadability(text: string): ReadabilityReport {
  return readability(text || "");
}

export function readabilityDelta(before: string, after: string): ReadabilityDelta {
  const b = readability(before || "");
  const a = readability(after || "");
  return {
    before: b,
    after: a,
    fleschDelta: Number((a.flesch - b.flesch).toFixed(1)),
    fkGradeDelta: Number((a.fleschKincaidGrade - b.fleschKincaidGrade).toFixed(1)),
    avgSentenceLengthDelta: Number(
      (a.avgSentenceLength - b.avgSentenceLength).toFixed(1)
    ),
  };
}

/* ============================================================
   Pure heuristic: AI-pattern advisory signals
   ------------------------------------------------------------
   These are SIGNALS, not a detector. No tool can guarantee
   AI-undetectability. We surface patterns a human can choose to soften.
   ============================================================ */

export type AdvisorySignal = {
  id: string;
  label: string;
  level: "ok" | "watch" | "high";
  detail: string;
  value?: number;
};

export type AiPatternReport = {
  signals: AdvisorySignal[];
  disclaimer: string;
};

const OVERUSED_TRANSITIONS = [
  "moreover",
  "furthermore",
  "additionally",
  "in addition",
  "consequently",
  "thus",
  "therefore",
  "however",
  "nevertheless",
  "notably",
  "indeed",
];

const BUZZWORDS = [
  "delve",
  "tapestry",
  "intricate",
  "intricacies",
  "navigate the landscape",
  "landscape of",
  "leverage",
  "robust",
  "seamless",
  "realm of",
  "in the realm",
  "underscore",
  "pivotal",
  "multifaceted",
  "testament to",
];

const HEDGE_SCAFFOLDS = [
  "it is important to note",
  "it should be noted",
  "it is worth noting",
  "in today's world",
  "in conclusion",
  "in summary",
  "as such",
];

function splitSentences(text: string): string[] {
  return (text || "")
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function countOccurrences(haystackLower: string, needle: string): number {
  if (!needle) return 0;
  return haystackLower.split(needle).length - 1;
}

export const AI_PATTERN_DISCLAIMER =
  "Heuristic, not a detector. No tool can guarantee that text will pass — or fail — an AI-detector, and none can guarantee zero plagiarism. These signals only highlight mechanical, AI-sounding patterns you may choose to soften. Always do human review and disclose AI use per your target journal's policy.";

export function aiPatternHeuristics(text: string): AiPatternReport {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  const lower = clean.toLowerCase();
  const sentences = splitSentences(clean);
  const wordCount = clean.split(/\s+/).filter(Boolean).length;
  const signals: AdvisorySignal[] = [];

  if (sentences.length < 3 || wordCount < 40) {
    signals.push({
      id: "insufficient",
      label: "Sample size",
      level: "watch",
      detail:
        "Too little text for reliable pattern signals. Paste a fuller passage (a paragraph or more) for meaningful advisories.",
    });
    return { signals, disclaimer: AI_PATTERN_DISCLAIMER };
  }

  // 1) Sentence-length uniformity (low burstiness reads as machine-even).
  const lengths = sentences.map((s) => s.split(/\s+/).filter(Boolean).length);
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance =
    lengths.reduce((acc, l) => acc + (l - mean) ** 2, 0) / lengths.length;
  const sd = Math.sqrt(variance);
  const burstiness = mean ? Number((sd / mean).toFixed(3)) : 0;
  signals.push({
    id: "uniformity",
    label: "Sentence-length variety",
    value: burstiness,
    level: burstiness < 0.25 ? "high" : burstiness < 0.4 ? "watch" : "ok",
    detail:
      burstiness < 0.25
        ? "Sentences are very uniform in length (low burstiness) — a common AI-writing signature. Mix short and long sentences."
        : burstiness < 0.4
        ? "Sentence lengths are somewhat even. A little more variety will read more naturally."
        : "Healthy variation in sentence length.",
  });

  // 2) Overused transitions, esp. sentence-initial.
  const transitionStarts = sentences.filter((s) => {
    const head = s.toLowerCase().slice(0, 24);
    return OVERUSED_TRANSITIONS.some((t) => head.startsWith(t));
  }).length;
  const transitionDensity = Number(
    ((100 * transitionStarts) / sentences.length).toFixed(1)
  );
  signals.push({
    id: "transitions",
    label: 'Transition words ("moreover/furthermore…")',
    value: transitionDensity,
    level: transitionDensity > 25 ? "high" : transitionDensity > 12 ? "watch" : "ok",
    detail:
      transitionDensity > 25
        ? "Many sentences open with a generic transition. Cut or vary them; let logic carry the flow."
        : transitionDensity > 12
        ? "A noticeable number of generic sentence-opening transitions — trim a few."
        : "Transition use looks natural.",
  });

  // 3) Em-dash density (AI text often over-uses em-dashes).
  const emDashes = (clean.match(/—|--/g) || []).length;
  const emDashPer100 = Number(((100 * emDashes) / wordCount).toFixed(2));
  signals.push({
    id: "emdash",
    label: "Em-dash density",
    value: emDashPer100,
    level: emDashPer100 > 1.2 ? "high" : emDashPer100 > 0.6 ? "watch" : "ok",
    detail:
      emDashPer100 > 1.2
        ? "Heavy em-dash use is a frequent AI tell. Replace some with commas, parentheses, or full stops."
        : emDashPer100 > 0.6
        ? "Moderately frequent em-dashes — consider varying punctuation."
        : "Em-dash use is unremarkable.",
  });

  // 4) Buzzword / cliché vocabulary.
  const buzzHits: string[] = [];
  let buzzCount = 0;
  for (const b of BUZZWORDS) {
    const c = countOccurrences(lower, b);
    if (c > 0) {
      buzzCount += c;
      buzzHits.push(`${b}${c > 1 ? ` ×${c}` : ""}`);
    }
  }
  signals.push({
    id: "buzzwords",
    label: 'AI-cliché vocabulary ("delve", "tapestry", "intricate"…)',
    value: buzzCount,
    level: buzzCount >= 3 ? "high" : buzzCount >= 1 ? "watch" : "ok",
    detail: buzzHits.length
      ? `Found: ${buzzHits.join(", ")}. Swap these for plain, specific medical wording.`
      : "No common AI-cliché vocabulary detected.",
  });

  // 5) Hedge scaffolds / filler openers.
  let hedgeCount = 0;
  const hedgeHits: string[] = [];
  for (const h of HEDGE_SCAFFOLDS) {
    const c = countOccurrences(lower, h);
    if (c > 0) {
      hedgeCount += c;
      hedgeHits.push(`"${h}"${c > 1 ? ` ×${c}` : ""}`);
    }
  }
  signals.push({
    id: "scaffolds",
    label: "Filler scaffolds (“it is important to note…”)",
    value: hedgeCount,
    level: hedgeCount >= 3 ? "high" : hedgeCount >= 1 ? "watch" : "ok",
    detail: hedgeHits.length
      ? `Found: ${hedgeHits.join(", ")}. These add words without information — usually safe to delete.`
      : "No common filler scaffolds detected.",
  });

  return { signals, disclaimer: AI_PATTERN_DISCLAIMER };
}

/* ============================================================
   Pure heuristic: originality / plagiarism-risk advisory
   ------------------------------------------------------------
   Advisory only — this is NOT a plagiarism checker and cannot
   confirm originality. It flags patterns worth a human/tool check.
   ============================================================ */

export type OriginalityReport = {
  signals: AdvisorySignal[];
  disclaimer: string;
};

export const ORIGINALITY_DISCLAIMER =
  "Advisory only — this is NOT a plagiarism checker and cannot confirm originality or detect copied text. It flags patterns (long verbatim-looking runs, claims without nearby citations) that a human or a dedicated similarity tool (e.g. iThenticate/Turnitin) should review. Proper citation and quotation remain your responsibility.";

// Claim-like cues that usually require a supporting citation.
const CLAIM_CUES = [
  "studies have shown",
  "research has shown",
  "it has been demonstrated",
  "evidence suggests",
  "it is well established",
  "previous studies",
  "prior work",
  "according to",
  "has been reported",
  "is associated with",
  "significantly",
];

function hasNearbyCitation(sentence: string): boolean {
  // Numeric/bracket/superscript markers, author-year, DOI, or PMID nearby.
  return (
    /\[\s*\d/.test(sentence) || // [1] or [1,2]
    /\(\s*\d{1,3}(\s*[,–-]\s*\d{1,3})*\s*\)/.test(sentence) || // (1) numeric
    /\((?:[A-Z][A-Za-z'`-]+(?: et al\.?)?,?\s*)?(?:19|20)\d{2}[a-z]?\)/.test(
      sentence
    ) || // (Smith, 2021)
    /\b10\.\d{4,9}\/\S+/.test(sentence) || // DOI
    /\bPMID[:\s]*\d{6,9}\b/i.test(sentence) ||
    /[¹²³⁴⁵⁶⁷⁸⁹⁰]/.test(sentence) // superscript digits
  );
}

export function originalityHeuristics(text: string): OriginalityReport {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  const signals: AdvisorySignal[] = [];
  const sentences = splitSentences(clean);
  const wordCount = clean.split(/\s+/).filter(Boolean).length;

  if (wordCount < 40) {
    signals.push({
      id: "insufficient",
      label: "Sample size",
      level: "watch",
      detail:
        "Too little text for originality signals. Paste a fuller passage for meaningful advisories.",
    });
    return { signals, disclaimer: ORIGINALITY_DISCLAIMER };
  }

  // 1) Long verbatim-looking runs (very long sentences with no punctuation
  //    breaks can indicate pasted/block-quoted material that may need quoting).
  const longRuns = sentences.filter((s) => s.split(/\s+/).length >= 45);
  signals.push({
    id: "long-runs",
    label: "Long verbatim-looking passages",
    value: longRuns.length,
    level: longRuns.length >= 2 ? "high" : longRuns.length === 1 ? "watch" : "ok",
    detail: longRuns.length
      ? `${longRuns.length} very long, unbroken sentence(s) (≥45 words). If any is copied or closely paraphrased from a source, quote it and cite it, or rewrite in your own words.`
      : "No unusually long verbatim-looking runs detected.",
  });

  // 2) Quoted material without an adjacent citation.
  const quotedNoCite = sentences.filter(
    (s) => /[“”"]/.test(s) && /\w{8,}/.test(s) && !hasNearbyCitation(s)
  );
  signals.push({
    id: "quotes",
    label: "Quotations without nearby citation",
    value: quotedNoCite.length,
    level: quotedNoCite.length >= 1 ? "high" : "ok",
    detail: quotedNoCite.length
      ? `${quotedNoCite.length} quoted passage(s) appear to lack an adjacent citation. Quoted text must be attributed.`
      : "No unattributed quotations detected.",
  });

  // 3) Claim-like statements without a nearby citation.
  const lowerSentences = sentences.map((s) => s.toLowerCase());
  let uncitedClaims = 0;
  const examples: string[] = [];
  sentences.forEach((s, i) => {
    const ls = lowerSentences[i];
    const isClaim = CLAIM_CUES.some((c) => ls.includes(c));
    if (isClaim && !hasNearbyCitation(s)) {
      uncitedClaims++;
      if (examples.length < 3) {
        examples.push(s.length > 90 ? s.slice(0, 90) + "…" : s);
      }
    }
  });
  signals.push({
    id: "uncited-claims",
    label: "Claims that may need a citation",
    value: uncitedClaims,
    level: uncitedClaims >= 3 ? "high" : uncitedClaims >= 1 ? "watch" : "ok",
    detail: uncitedClaims
      ? `${uncitedClaims} claim-like statement(s) had no detectable nearby citation. Examples: ${examples
          .map((e) => `“${e}”`)
          .join("; ")}. Add a reference or soften to your own observation.`
      : "Claim-like statements appear to carry nearby citations.",
  });

  return { signals, disclaimer: ORIGINALITY_DISCLAIMER };
}
