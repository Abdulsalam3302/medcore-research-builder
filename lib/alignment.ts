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

import type { DesignCategory, FeatureSpec, ManuscriptType } from "./types";

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
/* ============================================================
   Feature recommendation engine.
   Given a design + manuscript-type + notes, score every feature
   and surface the most relevant ones automatically. The user can
   always add expert-only features manually.
   ============================================================ */

export type FeatureRecommendation = {
  feature: FeatureSpec;
  score: number;
  reason: string;
  tier: "core" | "recommended" | "expert";
};

const DESIGN_TO_CORE_FEATURES: Array<{
  match: (id: string) => boolean;
  ids: string[];
  reasonByFeature?: Record<string, string>;
}> = [
  {
    match: (id) => id.startsWith("interv.rct"),
    ids: [
      "intervention.tidier",
      "harms.adverse",
      "open.data-sharing",
      "open.code",
      "qual.preregistration",
      "qual.ai-assistance",
      "qual.integrity-coi",
      "methods.subgroup",
      "methods.sensitivity",
    ],
  },
  {
    match: (id) => id === "interv.rct.cluster",
    ids: ["intervention.tidier", "methods.sensitivity"],
  },
  {
    match: (id) => id.startsWith("obs.cohort"),
    ids: [
      "methods.causal-inference",
      "methods.target-trial",
      "methods.missing-data",
      "methods.sensitivity",
      "open.data-sharing",
      "qual.ai-assistance",
      "qual.integrity-coi",
    ],
  },
  {
    match: (id) => id === "obs.cross-sectional",
    ids: [
      "methods.missing-data",
      "pp.diversity",
      "open.data-sharing",
      "qual.ai-assistance",
      "qual.integrity-coi",
      "pop.race-ethnicity",
    ],
  },
  {
    match: (id) => id === "obs.case-control",
    ids: [
      "methods.missing-data",
      "methods.sensitivity",
      "qual.integrity-coi",
    ],
  },
  {
    match: (id) => id.startsWith("syn."),
    ids: [
      "open.data-sharing",
      "qual.preregistration",
      "qual.reproducibility",
      "qual.ai-assistance",
    ],
  },
  {
    match: (id) => id.startsWith("dx."),
    ids: [
      "ai.tripod-ai",
      "ai.claim-imaging",
      "methods.imbalance-handling",
      "methods.sensitivity",
      "open.code",
      "qual.reproducibility",
      "qual.ai-assistance",
    ],
  },
  {
    match: (id) => id === "case.care",
    ids: ["qual.ai-assistance", "qual.integrity-coi"],
  },
  {
    match: (id) => id.startsWith("qi."),
    ids: [
      "qi.proctor-implementation-outcomes",
      "intv.complex-intervention",
      "intervention.tidier",
    ],
  },
  {
    match: (id) => id.startsWith("preclin."),
    ids: ["open.data-sharing", "qual.reproducibility", "qual.preregistration"],
  },
  {
    match: (id) => id.startsWith("econ."),
    ids: ["methods.economic-eval", "methods.sensitivity"],
  },
];

const KEYWORD_HINTS: Array<{ pattern: RegExp; featureIds: string[]; reason: string }> = [
  { pattern: /\b(ai|machine learning|ml|deep learning|neural network)\b/i, featureIds: ["ai.tripod-ai", "ai.consort-ai", "ai.decide-ai"], reason: "Notes mention AI/ML." },
  { pattern: /\b(imaging|mri|ct|pet|ultrasound|x-ray)\b/i, featureIds: ["spec.imaging", "ai.claim-imaging"], reason: "Notes mention medical imaging." },
  { pattern: /\b(llm|chatgpt|gpt|large language)\b/i, featureIds: ["ai.tripod-llm"], reason: "Notes mention LLMs." },
  { pattern: /\b(surger|surgical|operative|peri-?operative)\b/i, featureIds: ["spec.surgery"], reason: "Notes mention surgery." },
  { pattern: /\b(cardiac|cardiovascular|heart failure|stemi|mace)\b/i, featureIds: ["spec.cardiology"], reason: "Notes mention cardiology." },
  { pattern: /\b(cancer|oncolog|tumour|tumor|chemotherapy|radiotherapy)\b/i, featureIds: ["spec.oncology"], reason: "Notes mention oncology." },
  { pattern: /\b(depression|anxiety|psychiatr|mental health|schizo|bipolar)\b/i, featureIds: ["spec.mental-health"], reason: "Notes mention mental-health endpoints." },
  { pattern: /\b(child|pediatric|paediatric|neonat|adolesc)\b/i, featureIds: ["pop.pediatric"], reason: "Notes mention paediatric population." },
  { pattern: /\b(pregnan|gestational|perinatal|postpartum)\b/i, featureIds: ["pop.pregnancy"], reason: "Notes mention pregnancy / perinatal." },
  { pattern: /\b(elder|geriatric|frailty|65\+)\b/i, featureIds: ["pop.older-adults"], reason: "Notes mention older-adult / frailty." },
  { pattern: /\b(lmic|low-income|middle-income|sub-saharan|africa|south asia)\b/i, featureIds: ["pop.lmic"], reason: "Notes mention LMIC setting." },
  { pattern: /\b(indigenous|aborigin|tribal|m[aā]ori|first nations)\b/i, featureIds: ["pop.indigenous"], reason: "Notes mention Indigenous community." },
  { pattern: /\b(diet|nutrition|food frequency|ffq)\b/i, featureIds: ["spec.nutrition"], reason: "Notes mention nutrition." },
  { pattern: /\b(rehab|physiotherap|occupational therapy)\b/i, featureIds: ["spec.rehabilitation"], reason: "Notes mention rehabilitation." },
  { pattern: /\b(pharmacokinet|pharmacodynam|auc|cmax|drug-drug)\b/i, featureIds: ["spec.pharmacology"], reason: "Notes mention pharmacology." },
  { pattern: /\b(wearable|sensor|smartwatch|activity tracker)\b/i, featureIds: ["dd.wearable"], reason: "Notes mention wearables/sensors." },
  { pattern: /\b(digital|app|mhealth|ehealth)\b/i, featureIds: ["intv.digital-health"], reason: "Notes mention digital intervention." },
  { pattern: /\b(equity|disparit|underserved|race|ethnicit|gender)\b/i, featureIds: ["methods.equity", "pop.race-ethnicity"], reason: "Notes mention equity / disparities." },
  { pattern: /\b(missing data|imputation)\b/i, featureIds: ["methods.missing-data"], reason: "Notes mention missing data." },
  { pattern: /\b(bayesian|posterior|prior distribution)\b/i, featureIds: ["methods.bayesian"], reason: "Notes mention Bayesian methods." },
  { pattern: /\b(infect|outbreak|pandemic|covid|sars)\b/i, featureIds: ["spec.infectious-disease"], reason: "Notes mention infectious disease / outbreak." },
  { pattern: /\b(cost.effective|qaly|icer|economic)\b/i, featureIds: ["methods.economic-eval"], reason: "Notes mention economic evaluation." },
];

const MANUSCRIPT_TYPE_HINTS: Record<string, string[]> = {
  systematic_review: ["qual.preregistration", "qual.reproducibility", "open.data-sharing"],
  meta_analysis: ["qual.preregistration", "qual.reproducibility", "open.data-sharing"],
  protocol: ["qual.preregistration", "qual.ai-assistance"],
  case_report: ["qual.ai-assistance", "qual.integrity-coi"],
};

export function recommendFeatures(args: {
  designId?: string;
  manuscriptType?: string;
  notes?: string;
  features: FeatureSpec[];
}): FeatureRecommendation[] {
  const scoreByFeature = new Map<string, { score: number; reasons: string[]; tier: "core" | "recommended" | "expert" }>();

  function bump(id: string, score: number, reason: string, tier: "core" | "recommended" | "expert") {
    const cur = scoreByFeature.get(id) || { score: 0, reasons: [], tier };
    cur.score += score;
    if (!cur.reasons.includes(reason)) cur.reasons.push(reason);
    if (tier === "core" || (tier === "recommended" && cur.tier === "expert")) cur.tier = tier;
    scoreByFeature.set(id, cur);
  }

  /* Pass 1 — design-driven core recommendations. */
  if (args.designId) {
    for (const rule of DESIGN_TO_CORE_FEATURES) {
      if (!rule.match(args.designId)) continue;
      for (const fid of rule.ids) {
        const reason =
          rule.reasonByFeature?.[fid] ||
          `Standard expectation for ${args.designId.replace(/_/g, " ")}.`;
        bump(fid, 10, reason, "core");
      }
    }
    /* Pass 2 — features that declare recommendedFor matching this design. */
    for (const f of args.features) {
      if (f.recommendedFor?.some((d) => args.designId!.startsWith(d) || d === args.designId)) {
        bump(f.id, 8, `Pre-mapped recommendation for ${args.designId}.`, "recommended");
      }
    }
  }

  /* Pass 3 — manuscript-type cues. */
  if (args.manuscriptType && MANUSCRIPT_TYPE_HINTS[args.manuscriptType]) {
    for (const fid of MANUSCRIPT_TYPE_HINTS[args.manuscriptType]) {
      bump(fid, 6, `Common expectation for ${args.manuscriptType.replace(/_/g, " ")} manuscripts.`, "recommended");
    }
  }

  /* Pass 4 — notes keyword matching. */
  if (args.notes) {
    for (const hint of KEYWORD_HINTS) {
      if (hint.pattern.test(args.notes)) {
        for (const fid of hint.featureIds) bump(fid, 5, hint.reason, "recommended");
      }
    }
  }

  /* Build the final list. */
  const out: FeatureRecommendation[] = [];
  for (const f of args.features) {
    const s = scoreByFeature.get(f.id);
    if (!s || s.score <= 0) continue;
    out.push({
      feature: f,
      score: s.score,
      reason: s.reasons.join(" "),
      tier: s.tier,
    });
  }
  out.sort((a, b) => b.score - a.score);
  return out;
}

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
