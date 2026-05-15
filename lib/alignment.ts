/**
 * Cross-step alignment helpers.
 *
 * Enforces scientific consistency across the wizard pipeline:
 *  - Which manuscript types are compatible with which design family?
 *  - Which title keywords conflict with the selected design?
 *  - Which sections/appendices are required for which design?
 *
 * These rules are codified here (single source of truth) and consumed by
 * the Wizard, TitleLab, SectionBuilder, and Compliance Report so every
 * step "sees" the others.
 */

import type { DesignCategory, ManuscriptType } from "./types";

/**
 * Which manuscript types are valid for a given design category.
 * An empty array means "any" (used as a permissive default).
 */
export const MANUSCRIPT_TYPES_FOR_CATEGORY: Record<DesignCategory, ManuscriptType[]> = {
  interventional: [
    "original_investigation",
    "research_article",
    "brief_report",
    "research_letter",
    "protocol",
  ],
  observational: [
    "original_investigation",
    "research_article",
    "brief_report",
    "research_letter",
  ],
  synthesis: ["systematic_review", "meta_analysis", "review"],
  protocol: ["protocol"],
  diagnostic_prognostic_prediction: [
    "original_investigation",
    "research_article",
    "brief_report",
  ],
  case_reports: ["case_report", "correspondence"],
  guidelines_consensus: ["review", "viewpoint"],
  qualitative_mixed: ["original_investigation", "research_article", "brief_report"],
  preclinical: ["original_investigation", "research_article", "brief_report"],
  quality_implementation: ["original_investigation", "research_article", "brief_report"],
  economic: ["original_investigation", "research_article", "brief_report"],
  genetics_omics: ["original_investigation", "research_article", "brief_report"],
};

export function manuscriptTypesAllowed(
  designCategory?: DesignCategory
): ManuscriptType[] | "any" {
  if (!designCategory) return "any";
  const allowed = MANUSCRIPT_TYPES_FOR_CATEGORY[designCategory];
  if (!allowed || allowed.length === 0) return "any";
  return allowed;
}

export function isManuscriptTypeCompatible(
  designCategory: DesignCategory | undefined,
  manuscriptType: ManuscriptType | undefined
): boolean {
  if (!designCategory || !manuscriptType) return true;
  const allowed = manuscriptTypesAllowed(designCategory);
  if (allowed === "any") return true;
  return allowed.includes(manuscriptType);
}

/**
 * Keywords-in-title that conflict with the chosen design id.
 * Used by TitleLab refine to alert the author *before* an LLM call.
 */
type ConflictRule = {
  designIdPrefix: string | string[];
  forbiddenKeywords: string[];
  reason: string;
};

const TITLE_CONFLICT_RULES: ConflictRule[] = [
  {
    designIdPrefix: "obs.cross-sectional",
    forbiddenKeywords: [
      "retrospective",
      "prospective cohort",
      "longitudinal",
      "follow-up",
      "follow up",
      "randomized",
      "randomised",
      "rct",
      "trial",
    ],
    reason:
      "A cross-sectional study measures exposure and outcome at one point in time. Terms like 'retrospective', 'longitudinal', or 'randomized' contradict that design.",
  },
  {
    designIdPrefix: "obs.cohort.retrospective",
    forbiddenKeywords: ["cross-sectional", "randomized", "randomised", "rct"],
    reason:
      "A retrospective cohort study follows participants over time using existing data — it is not a cross-sectional or randomized design.",
  },
  {
    designIdPrefix: "obs.cohort.prospective",
    forbiddenKeywords: ["cross-sectional", "randomized", "randomised", "rct", "retrospective"],
    reason:
      "A prospective cohort study follows participants forward in time. It is not randomized, not retrospective, and not cross-sectional.",
  },
  {
    designIdPrefix: "obs.case-control",
    forbiddenKeywords: ["randomized", "randomised", "rct", "cross-sectional"],
    reason: "Case-control studies sample by outcome status; they are not randomized or cross-sectional.",
  },
  {
    designIdPrefix: ["interv.rct"],
    forbiddenKeywords: [
      "observational",
      "cross-sectional",
      "retrospective",
      "case report",
      "case series",
    ],
    reason:
      "RCTs prospectively allocate participants. Terms like 'observational', 'cross-sectional', or 'retrospective' contradict that.",
  },
  {
    designIdPrefix: ["syn.sr", "syn.meta", "syn.scoping", "syn.umbrella", "syn.rapid", "syn.living"],
    forbiddenKeywords: ["randomized controlled trial", "single-center", "single center"],
    reason:
      "A systematic review / meta-analysis is a synthesis of primary studies — it is not itself an RCT.",
  },
  {
    designIdPrefix: "case.care",
    forbiddenKeywords: ["randomized", "cohort study", "trial", "systematic review"],
    reason: "A case report describes one patient — it is not a trial, cohort, or review.",
  },
  {
    designIdPrefix: "preclin",
    forbiddenKeywords: ["patients", "human participants"],
    reason: "Preclinical animal studies should not claim human participants in the title.",
  },
];

export type TitleConflict = {
  keyword: string;
  reason: string;
  severity: "block" | "warn";
};

export function detectTitleConflicts(
  designId: string | undefined,
  title: string
): TitleConflict[] {
  if (!designId || !title) return [];
  const t = title.toLowerCase();
  const out: TitleConflict[] = [];
  for (const rule of TITLE_CONFLICT_RULES) {
    const prefixes = Array.isArray(rule.designIdPrefix)
      ? rule.designIdPrefix
      : [rule.designIdPrefix];
    if (!prefixes.some((p) => designId.startsWith(p))) continue;
    for (const kw of rule.forbiddenKeywords) {
      const pattern = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\b`, "i");
      if (pattern.test(t)) {
        out.push({ keyword: kw, reason: rule.reason, severity: "block" });
      }
    }
  }
  return out;
}

/**
 * Designs that benefit from a questionnaire/instrument appendix.
 * Used by SectionBuilder/Wizard to surface the appendix tab.
 */
export const APPENDIX_REQUIRED_FOR: { match: (id: string) => boolean; label: string }[] = [
  {
    match: (id) =>
      id === "obs.cross-sectional" ||
      id.startsWith("qual.") ||
      id === "obs.cohort.prospective" ||
      id === "obs.cohort.retrospective",
    label: "Questionnaire / survey instrument",
  },
];

export function needsQuestionnaireAppendix(designId?: string): boolean {
  if (!designId) return false;
  return APPENDIX_REQUIRED_FOR.some((r) => r.match(designId));
}

/**
 * Project-state → flattened "what the assistant should know about every other step"
 * Used in TitleLab/SectionBuilder so each step sees previous + future state.
 */
export function summarizePipelineState(p: {
  researchTypeAnswers?: { designId?: string; journalId?: string; manuscriptType?: string; notes?: string };
  researchTypeResult?: { primaryGuidelineName?: string };
  titleInputs?: Record<string, unknown>;
  titleFinal?: string;
  sections?: Record<string, string>;
  references?: { verifications?: unknown[] };
}): string[] {
  const lines: string[] = [];
  const a = p.researchTypeAnswers;
  if (a?.designId) lines.push(`Design selected: ${a.designId}`);
  if (a?.manuscriptType) lines.push(`Manuscript type: ${a.manuscriptType}`);
  if (a?.journalId) lines.push(`Journal: ${a.journalId}`);
  if (p.researchTypeResult?.primaryGuidelineName)
    lines.push(`Primary guideline: ${p.researchTypeResult.primaryGuidelineName}`);
  if (p.titleFinal) lines.push(`Title chosen: ${p.titleFinal}`);
  if (a?.notes) lines.push(`Notes excerpt: ${a.notes.slice(0, 200)}`);
  if (p.sections) {
    const drafted = Object.entries(p.sections)
      .filter(([, v]) => (v || "").length > 60)
      .map(([k]) => k);
    if (drafted.length) lines.push(`Sections already drafted: ${drafted.join(", ")}`);
  }
  if (p.references?.verifications && p.references.verifications.length > 0)
    lines.push(`References verified: ${p.references.verifications.length}`);
  return lines;
}
