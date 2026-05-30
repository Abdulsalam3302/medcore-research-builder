/**
 * Protocol / proposal generator — study-design-aware.
 *
 * Pure, dependency-light builders used by:
 *  - the offline deterministic skeleton path (works with NO API key)
 *  - the /api/llm/protocol-draft route (LLM drafting)
 *
 * STRICT RULE: never fabricate numbers (sample size, budget, dates). Wherever a
 * concrete value is required but unknown, emit a clearly-labelled placeholder
 * like "[needs author input: ...]". This module is safe to import on both the
 * server and the client (no Node-only or DOM-only APIs).
 */

import type { ProjectState } from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Design family detection + reporting-guideline tailoring            */
/* ------------------------------------------------------------------ */

export type ProtocolDesignFamily =
  | "interventional"
  | "synthesis"
  | "observational"
  | "diagnostic"
  | "prediction"
  | "case"
  | "qualitative"
  | "other";

export type DesignProfile = {
  family: ProtocolDesignFamily;
  label: string;
  /** Primary reporting/protocol guideline acronym(s) to follow. */
  guideline: string;
  /** Extra design-specific sections required on top of the core set. */
  extraSections: string[];
  /** Short focused guidance shown to the author and the model. */
  guidance: string;
};

/**
 * Map a v2 design id (e.g. "interv.rct.parallel", "synth.sr.intervention")
 * or free-text notes onto a protocol design family. Deterministic, no I/O.
 */
export function detectDesignFamily(project: ProjectState): DesignProfile {
  const ans = project.researchTypeAnswers || {};
  const id = (ans.designId || "").toLowerCase();
  const haystack = [
    id,
    ans.designFamily || "",
    ans.notes || "",
    project.researchLaunch?.researchTypeNote || "",
    ans.targetJournal || "",
    project.titleInputs?.design || "",
    project.titleInputs?.researchType || "",
  ]
    .join(" ")
    .toLowerCase();

  const has = (...needles: string[]) => needles.some((n) => haystack.includes(n));

  if (
    id.startsWith("interv") ||
    has("rct", "randomi", "trial", "interventional", "parallel", "crossover", "factorial", "stepped-wedge")
  ) {
    return {
      family: "interventional",
      label: "Interventional / randomized trial",
      guideline: "SPIRIT (protocol) + CONSORT (reporting)",
      extraSections: [
        "Randomization, allocation concealment & blinding",
        "Interventions (TIDieR-level detail) & adherence",
        "Harms & safety monitoring (DSMB / stopping rules)",
        "Trial registration & protocol version control",
      ],
      guidance:
        "Follow SPIRIT for the protocol and plan CONSORT-compliant reporting. Pre-register the trial, pre-specify the primary outcome, and define randomization, allocation concealment, and blinding.",
    };
  }
  if (
    id.startsWith("synth") ||
    has("systematic review", "meta-analysis", "meta analysis", "scoping review", "prisma", "evidence synthesis")
  ) {
    return {
      family: "synthesis",
      label: "Evidence synthesis (systematic review / meta-analysis)",
      guideline: "PRISMA-P (protocol) + PRISMA (reporting)",
      extraSections: [
        "Eligibility criteria (PICOS) & information sources",
        "Search strategy & study selection process",
        "Data extraction & risk-of-bias assessment",
        "Synthesis methods (qualitative / meta-analytic) & certainty (GRADE)",
        "Protocol registration (PROSPERO / OSF)",
      ],
      guidance:
        "Follow PRISMA-P for the protocol. Register in PROSPERO or OSF, document the full search strategy, and pre-specify risk-of-bias and synthesis methods.",
    };
  }
  if (
    id.includes("prediction") ||
    id.includes("prognos") ||
    has("tripod", "prognostic", "prediction model", "machine learning", "predictive model")
  ) {
    return {
      family: "prediction",
      label: "Prediction / prognostic model study",
      guideline: "TRIPOD (+AI where relevant)",
      extraSections: [
        "Predictors & outcome definitions",
        "Model development & internal/external validation plan",
        "Handling of missing data & overfitting controls",
        "Performance metrics (discrimination, calibration)",
      ],
      guidance:
        "Follow TRIPOD (and TRIPOD+AI for ML). Pre-specify predictors, outcome, validation strategy, and performance metrics.",
    };
  }
  if (id.startsWith("diag") || has("diagnostic accuracy", "stard", "index test", "reference standard")) {
    return {
      family: "diagnostic",
      label: "Diagnostic accuracy study",
      guideline: "STARD",
      extraSections: [
        "Index test & reference standard definitions",
        "Participant sampling (consecutive / random) & flow",
        "Blinding of test interpreters",
        "Accuracy estimates plan (sensitivity, specificity, predictive values)",
      ],
      guidance:
        "Follow STARD. Clearly define the index test and reference standard, the sampling strategy, and how interpreters are blinded.",
    };
  }
  if (id.startsWith("case") || has("case report", "case series", "care guideline")) {
    return {
      family: "case",
      label: "Case report / case series",
      guideline: "CARE",
      extraSections: [
        "Case timeline & clinical findings",
        "Diagnostic assessment & interventions",
        "Patient perspective & informed consent",
      ],
      guidance:
        "Follow CARE. Provide a clear timeline, obtain and document patient consent, and avoid generalizing beyond the case(s).",
    };
  }
  if (
    id.startsWith("qual") ||
    has("qualitative", "mixed methods", "coreq", "srqr", "interview", "focus group", "thematic")
  ) {
    return {
      family: "qualitative",
      label: "Qualitative / mixed-methods study",
      guideline: "COREQ / SRQR",
      extraSections: [
        "Theoretical framework & researcher reflexivity",
        "Sampling & saturation strategy",
        "Data collection (interviews / focus groups) & analysis approach",
        "Trustworthiness (credibility, transferability, dependability)",
      ],
      guidance:
        "Follow COREQ or SRQR. Describe the theoretical framework, sampling and saturation, reflexivity, and trustworthiness strategy.",
    };
  }
  if (
    id.startsWith("obs") ||
    has("cohort", "case-control", "case control", "cross-sectional", "cross sectional", "observational", "strobe")
  ) {
    return {
      family: "observational",
      label: "Observational study (cohort / case-control / cross-sectional)",
      guideline: "STROBE",
      extraSections: [
        "Exposure(s), outcome(s) & potential confounders",
        "Bias minimization & confounding control strategy",
        "Handling of missing data & sensitivity analyses",
      ],
      guidance:
        "Follow STROBE. Pre-specify exposures, outcomes, and confounders, and describe the strategy to control bias and confounding.",
    };
  }

  return {
    family: "other",
    label: "General study protocol",
    guideline: "Relevant EQUATOR reporting guideline (select on submission)",
    extraSections: [],
    guidance:
      "Select the matching EQUATOR reporting guideline for your design (e.g., SPIRIT, PRISMA-P, STROBE, STARD, TRIPOD, CARE, COREQ) before drafting.",
  };
}

/* ------------------------------------------------------------------ */
/* Section catalogue                                                  */
/* ------------------------------------------------------------------ */

export const CORE_PROTOCOL_SECTIONS = [
  "Background & rationale",
  "Objectives (PICO)",
  "Study design",
  "Setting",
  "Population & eligibility",
  "Sample size justification",
  "Variables & measures",
  "Data collection",
  "Statistical analysis plan",
  "Ethics & consent",
  "Data management",
  "Timeline & budget",
  "Dissemination",
] as const;

/**
 * The full ordered list of sections for a given project, including the
 * design-specific extras (inserted after "Study design").
 */
export function protocolSectionList(project: ProjectState): string[] {
  const profile = detectDesignFamily(project);
  const out: string[] = [];
  for (const s of CORE_PROTOCOL_SECTIONS) {
    out.push(s);
    if (s === "Study design" && profile.extraSections.length) {
      out.push(...profile.extraSections);
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Context extraction (no fabrication)                                */
/* ------------------------------------------------------------------ */

type PicoContext = {
  title: string;
  population: string;
  intervention: string;
  comparator: string;
  outcome: string;
  setting: string;
  timePeriod: string;
  sampleSize: string;
  ethicsApproval: string;
  registration: string;
  funding: string;
};

const PH = (label: string) => `[needs author input: ${label}]`;

export function extractPico(project: ProjectState): PicoContext {
  const ti = project.titleInputs || {};
  const en = project.researchTypeAnswers?.expandedNotes;
  const launch = project.researchLaunch;
  const pick = (...vals: Array<string | undefined>) =>
    vals.find((v) => typeof v === "string" && v.trim().length > 0)?.trim() || "";

  return {
    title: pick(project.titleFinal, ti.draftTitle) || PH("working title"),
    population: pick(en?.population, ti.population) || PH("target population"),
    intervention: pick(en?.intervention, en?.exposure, ti.intervention) || PH("intervention / exposure"),
    comparator: pick(en?.comparator, ti.comparator) || PH("comparator (or 'none')"),
    outcome: pick(en?.primaryOutcome, ti.outcome) || PH("primary outcome"),
    setting: pick(en?.setting, en?.country, ti.setting) || PH("study setting / country"),
    timePeriod: pick(en?.timePeriod, ti.timePeriod) || PH("study period"),
    // Numbers are NEVER invented — always placeholders unless the author supplied them.
    sampleSize: pick(en?.sampleSize, launch?.sampleSizeJustified ? "Author-justified (see SAP)" : undefined) ||
      PH("target sample size with power assumptions"),
    ethicsApproval: pick(en?.ethicsApproval, launch?.irbNumber) || PH("ethics/IRB approval reference"),
    registration: pick(en?.registration, launch?.registrationId) || PH("registration ID (if applicable)"),
    funding: pick(en?.funding) || PH("funding source / 'none'"),
  };
}

/* ------------------------------------------------------------------ */
/* Deterministic offline skeleton (no LLM)                            */
/* ------------------------------------------------------------------ */

function sectionBody(section: string, pico: PicoContext, profile: DesignProfile): string {
  switch (section) {
    case "Background & rationale":
      return [
        `- Clinical/scientific problem this study addresses: ${PH("describe the gap and why it matters")}`,
        `- What is already known and the specific knowledge gap: ${PH("summarize prior evidence — cite, do not fabricate")}`,
        `- Rationale for the chosen design (${profile.label}).`,
      ].join("\n");
    case "Objectives (PICO)":
      return [
        `- Population: ${pico.population}`,
        `- Intervention/Exposure: ${pico.intervention}`,
        `- Comparator: ${pico.comparator}`,
        `- Outcome (primary): ${pico.outcome}`,
        `- Secondary objectives: ${PH("list secondary outcomes")}`,
        `- Primary research question / hypothesis: ${PH("state the testable hypothesis")}`,
      ].join("\n");
    case "Study design":
      return [
        `- Design: ${profile.label}`,
        `- Reporting/protocol guideline: ${profile.guideline}`,
        `- Design rationale & key features: ${PH("justify the design")}`,
      ].join("\n");
    case "Setting":
      return [
        `- Setting / sites / country: ${pico.setting}`,
        `- Study period: ${pico.timePeriod}`,
        `- Recruitment context: ${PH("how and where participants/records are accessed")}`,
      ].join("\n");
    case "Population & eligibility":
      return [
        `- Source population: ${pico.population}`,
        `- Inclusion criteria: ${PH("list inclusion criteria")}`,
        `- Exclusion criteria: ${PH("list exclusion criteria")}`,
        `- Sampling/recruitment strategy: ${PH("describe sampling")}`,
      ].join("\n");
    case "Sample size justification":
      return [
        `- Target sample size: ${pico.sampleSize}`,
        `- Assumptions (effect size, variance, alpha, power, dropout): ${PH("specify each assumption — do NOT guess")}`,
        `- Method/software used for the calculation: ${PH("e.g., G*Power, nQuery, R 'pwr'")}`,
        `> Note: no numbers are pre-filled here; the platform never invents sample-size figures.`,
      ].join("\n");
    case "Variables & measures":
      return [
        `- Primary outcome measure & definition: ${pico.outcome}`,
        `- Secondary outcomes: ${PH("define each")}`,
        `- Exposures/predictors & covariates/confounders: ${PH("define each with units and coding")}`,
        `- Instruments/scales (validated?): ${PH("name instruments and validation status")}`,
      ].join("\n");
    case "Data collection":
      return [
        `- Data sources & collection procedures: ${PH("CRF, EHR extraction, surveys, etc.")}`,
        `- Timing/visits/measurement schedule: ${PH("when each variable is captured")}`,
        `- Data quality & monitoring: ${PH("double-entry, range checks, training")}`,
      ].join("\n");
    case "Statistical analysis plan":
      return [
        `- Primary analysis (model & estimand): ${PH("specify model aligned to design & outcome type")}`,
        `- Handling of missing data: ${PH("e.g., multiple imputation, complete-case + sensitivity")}`,
        `- Subgroup/sensitivity analyses (pre-specified): ${PH("list")}`,
        `- Multiplicity & significance thresholds: ${PH("state")}`,
        `- Effect sizes with confidence intervals will be reported (not p-values alone).`,
      ].join("\n");
    case "Ethics & consent":
      return [
        `- Ethics/IRB approval: ${pico.ethicsApproval}`,
        `- Informed consent process (or waiver justification): ${PH("describe consent or waiver")}`,
        `- Risk/benefit assessment & vulnerable populations: ${PH("describe")}`,
      ].join("\n");
    case "Data management":
      return [
        `- Storage, access control & de-identification: ${PH("describe data security")}`,
        `- Retention period & data sharing plan: ${PH("state retention and sharing")}`,
        `- Data management responsibilities: ${PH("name data custodian")}`,
      ].join("\n");
    case "Timeline & budget":
      return [
        `- Milestones & timeline: ${PH("setup, recruitment, follow-up, analysis, write-up dates")}`,
        `- Budget skeleton (categories — figures by author): personnel, data tools/licenses, APC/publication, ethics fees, statistics, dissemination — each ${PH("cost")}`,
        `> Note: no budget figures are pre-filled; the platform never invents costs.`,
      ].join("\n");
    case "Dissemination":
      return [
        `- Target journal / audience: ${pico.funding ? "" : ""}${PH("target journal & conferences")}`,
        `- Authorship plan (ICMJE / CRediT): ${PH("define contributor roles")}`,
        `- Open-science & registration: ${pico.registration}`,
        `- Funding: ${pico.funding}`,
      ].join("\n");
    default:
      // Design-specific extra section.
      return `- ${PH(`complete this design-specific section (${section})`)}`;
  }
}

/**
 * Build a structured Markdown protocol/proposal skeleton WITHOUT an LLM.
 * Always works (used as the offline path with no API key). Never invents numbers.
 */
export function buildProtocolSkeleton(project: ProjectState): string {
  const profile = detectDesignFamily(project);
  const pico = extractPico(project);
  const sections = protocolSectionList(project);
  const now = new Date().toISOString().slice(0, 10);

  const lines: string[] = [];
  lines.push(`# Study Protocol / Proposal (Draft Skeleton)`);
  lines.push("");
  lines.push(`**Working title:** ${pico.title}`);
  lines.push(`**Design family:** ${profile.label}`);
  lines.push(`**Reporting/protocol guideline:** ${profile.guideline}`);
  lines.push(`**Generated (offline skeleton):** ${now}`);
  lines.push("");
  lines.push(
    `> DRAFT — requires human methodological and ethics review before use. Placeholders marked \`[needs author input: ...]\` must be completed by the author. This skeleton never fabricates numbers (sample size, budget, dates).`,
  );
  lines.push("");
  lines.push(`**Design-specific guidance:** ${profile.guidance}`);
  lines.push("");

  sections.forEach((section, i) => {
    lines.push(`## ${i + 1}. ${section}`);
    lines.push("");
    lines.push(sectionBody(section, pico, profile));
    lines.push("");
  });

  lines.push(`---`);
  lines.push(
    `_This is an auto-generated scaffold to accelerate drafting. It does not replace methodological, statistical, or ethics review._`,
  );
  return lines.join("\n");
}

/**
 * Per-document mini-skeleton for the readiness checklist (proposal, SAP, CRF,
 * data dictionary, consent, etc.). Deterministic, never fabricates numbers.
 */
export function buildDocumentSkeleton(docId: string, docLabel: string, project: ProjectState): string {
  const profile = detectDesignFamily(project);
  const pico = extractPico(project);
  const now = new Date().toISOString().slice(0, 10);

  const blocks: Record<string, string[]> = {
    protocol: ["See the full protocol generator for a complete study-design-aware skeleton."],
    proposal: [
      `- Title: ${pico.title}`,
      `- Background & significance: ${PH("why this matters")}`,
      `- Aims/objectives: ${PH("specific aims")}`,
      `- Methods summary (${profile.label}): ${PH("design, population, outcomes")}`,
      `- Feasibility & resources: ${PH("team, data, timeline")}`,
      `- Budget categories (figures by author): ${PH("costs")}`,
    ],
    sap: [
      `- Primary estimand & analysis model: ${PH(`aligned to ${pico.outcome}`)}`,
      `- Missing-data handling: ${PH("method")}`,
      `- Pre-specified subgroup/sensitivity analyses: ${PH("list")}`,
      `- Multiplicity control & significance level: ${PH("state")}`,
      `- Effect sizes with CIs reported (not p-values alone).`,
    ],
    crf: [
      `- Participant identifier (de-identified): ${PH("ID scheme")}`,
      `- Visit/timepoint fields: ${PH("schedule")}`,
      `- Outcome capture fields: ${PH("define")}`,
      `- Exposure/covariate fields with units & coding: ${PH("define")}`,
    ],
    dictionary: [
      `- For each variable: name, label, type, units, allowed values/codes, missing code, source.`,
      `- Primary outcome: ${pico.outcome}`,
      `- ${PH("enumerate all variables")}`,
    ],
    ethics: [
      `- Approval reference: ${pico.ethicsApproval}`,
      `- Risk/benefit & vulnerable populations: ${PH("describe")}`,
      `- Consent or waiver justification: ${PH("describe")}`,
    ],
    consent: [
      `- Study purpose (plain language): ${PH("describe")}`,
      `- Procedures, risks, benefits: ${PH("describe")}`,
      `- Voluntariness, withdrawal, confidentiality: ${PH("describe")}`,
      `- Contact & ethics committee details: ${PH("provide")}`,
    ],
    budget: [
      `- Categories: personnel, tools/licenses, APC/publication, ethics fees, statistics, dissemination.`,
      `- Each line item cost: ${PH("figure by author — never auto-filled")}`,
      `- Timeline milestones: ${PH("dates")}`,
    ],
    dmp: [
      `- Storage, access control, de-identification: ${PH("describe")}`,
      `- Retention & sharing plan: ${PH("describe")}`,
      `- Responsible data custodian: ${PH("name")}`,
    ],
    dissemination: [
      `- Target journal/conference: ${PH("name")}`,
      `- Authorship (ICMJE/CRediT): ${PH("roles")}`,
      `- Registration/open science: ${pico.registration}`,
    ],
  };

  const body = blocks[docId] || [`- ${PH(`outline for ${docLabel}`)}`];
  return [
    `# ${docLabel} — Draft Skeleton`,
    "",
    `**Project design:** ${profile.label} (${profile.guideline})`,
    `**Generated (offline):** ${now}`,
    "",
    `> DRAFT — requires human and ethics review. Placeholders \`[needs author input: ...]\` must be completed. No numbers are fabricated.`,
    "",
    ...body,
    "",
  ].join("\n");
}

/* ------------------------------------------------------------------ */
/* LLM prompt + schema (used by the API route)                        */
/* ------------------------------------------------------------------ */

export const PROTOCOL_SCHEMA = `Return ONLY this JSON (no prose, no markdown fences):
{
  "title": "string",
  "designFamily": "string",
  "guideline": "string",
  "sections": [
    { "heading": "string", "markdown": "string" }
  ],
  "placeholders": ["string (each unresolved [needs author input] item)"],
  "humanReviewRequired": ["string (what a methodologist/ethics board must verify)"],
  "warnings": ["string (design/ethics/overstatement risks)"]
}`;

export type ProtocolDraftResult = {
  title: string;
  designFamily: string;
  guideline: string;
  sections: Array<{ heading: string; markdown: string }>;
  placeholders: string[];
  humanReviewRequired: string[];
  warnings: string[];
};

export type BuildProtocolPromptArgs = {
  project: ProjectState;
  /** Optional author free-text notes to incorporate. */
  contextNotes?: string;
};

/**
 * Build the LLM prompt for drafting a full study-design-aware protocol/proposal.
 * The deterministic skeleton is embedded as a scaffold the model expands —
 * this keeps the model anchored to the real PICO context and the correct
 * design-specific sections.
 */
export function buildProtocolPrompt(args: BuildProtocolPromptArgs): string {
  const { project } = args;
  const profile = detectDesignFamily(project);
  const pico = extractPico(project);
  const sections = protocolSectionList(project);
  const scaffold = buildProtocolSkeleton(project);

  return `You are drafting a STUDY-DESIGN-AWARE research PROTOCOL / PROPOSAL for a medical study.

DESIGN CONTEXT:
- Design family: ${profile.label}
- Reporting/protocol guideline to follow: ${profile.guideline}
- Design-specific guidance: ${profile.guidance}

PROJECT CONTEXT (PICO and identifiers — use ONLY what is given; everything else is unknown):
- Working title: ${pico.title}
- Population: ${pico.population}
- Intervention/Exposure: ${pico.intervention}
- Comparator: ${pico.comparator}
- Primary outcome: ${pico.outcome}
- Setting/country: ${pico.setting}
- Study period: ${pico.timePeriod}
- Sample size: ${pico.sampleSize}
- Ethics/IRB: ${pico.ethicsApproval}
- Registration: ${pico.registration}
- Funding: ${pico.funding}

Author's additional notes:
${args.contextNotes || "(none)"}

REQUIRED SECTIONS (in this order; each becomes one object in "sections"):
${sections.map((s, i) => `${i + 1}. ${s}`).join("\n")}

STRICT RULES — NEVER VIOLATE:
- Do NOT invent any numbers: sample sizes, power/alpha, effect sizes, p-values, CIs, costs/budget figures, prevalence, dates, or doses.
- Where a number or unknown fact is needed, write "[needs author input: <what is missing>]" inline and add it to "placeholders".
- Do NOT invent citations, references, registration IDs, or ethics approval numbers.
- Do NOT promise novelty, "first ever", or "unique".
- Keep every claim proportional to the design (${profile.label}). Do not write causal language an observational design cannot support.
- Tailor the design-specific sections to the guideline (${profile.guideline}).
- This is a DRAFT that requires human methodological and ethics review — reflect that in "humanReviewRequired".

You may use the following deterministic scaffold as your structural starting point; expand each section into clear, scientific prose/checklists, preserving all placeholders you cannot resolve:
"""
${scaffold}
"""

${PROTOCOL_SCHEMA}`;
}
