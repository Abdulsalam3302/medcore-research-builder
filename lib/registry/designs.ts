import type { DesignSpec, ManuscriptSection } from "../types";

/* ============================================================
   Helpers — common sections, common supporting docs.
   Keeps every design entry small and readable.
   ============================================================ */

const ALL_SECTIONS: ManuscriptSection[] = [
  "title",
  "abstract",
  "introduction",
  "methods",
  "results",
  "discussion",
  "conclusion",
];

const PROTOCOL_SECTIONS: ManuscriptSection[] = [
  "title",
  "abstract",
  "introduction",
  "methods",
  "references",
];

const FLOW_DIAGRAM = {
  id: "consort-2025-flow",
  name: "CONSORT 2025 participant flow diagram",
  description:
    "Standardized diagram showing enrolment, allocation, follow-up, and analysis for each trial arm.",
  url: "https://www.equator-network.org/reporting-guidelines/consort/",
  whenRequired: "Always for randomized trials.",
};

const PRISMA_FLOW = {
  id: "prisma-2020-flow",
  name: "PRISMA 2020 flow diagram",
  description: "Records identified, screened, included, and excluded across each phase.",
  url: "https://www.prisma-statement.org/",
  whenRequired: "Always for systematic reviews / meta-analyses.",
};

const STARD_FLOW = {
  id: "stard-flow",
  name: "STARD 2015 participant flow diagram",
  description: "Flow of participants through the diagnostic test and reference standard.",
  url: "https://www.equator-network.org/reporting-guidelines/stard/",
};

const TRIAL_REGISTRATION = {
  id: "trial-registration",
  name: "Prospective trial registration",
  description:
    "Register the trial in a primary ICMJE-accepted registry (ClinicalTrials.gov, ISRCTN, ANZCTR, ChiCTR, CTRI, EU-CTR, JPRN, PACTR, REBEC, RPCEC, TCTR, …) BEFORE first participant enrolment.",
  url: "https://www.icmje.org/about-icmje/faqs/clinical-trials-registration/",
  whenRequired: "Required for all prospective interventional trials.",
};

const PROSPERO_REGISTRATION = {
  id: "prospero",
  name: "PROSPERO protocol registration",
  description: "Register the systematic review protocol with PROSPERO or equivalent (e.g., OSF, INPLASY).",
  url: "https://www.crd.york.ac.uk/prospero/",
  whenRequired: "Strongly recommended for systematic reviews.",
};

const ETHICS_APPROVAL = {
  id: "ethics",
  name: "Ethics approval letter",
  description:
    "Institutional Review Board / Research Ethics Committee approval document — name of body, reference number, date.",
  whenRequired: "Required for any study involving human participants or identifiable human data.",
};

const INFORMED_CONSENT = {
  id: "consent",
  name: "Informed consent statement",
  description: "Statement that informed consent was obtained, including any waiver and the rationale.",
  whenRequired: "Required for human-participant studies.",
};

const ICMJE_DISCLOSURE = {
  id: "icmje-disclosure",
  name: "ICMJE conflict-of-interest disclosure form",
  description: "Disclosure of relationships and activities form, completed for each author.",
  url: "https://www.icmje.org/disclosure-of-interest/",
  whenRequired: "Required by all ICMJE-member journals.",
};

const DATA_SHARING_STATEMENT = {
  id: "data-sharing",
  name: "Data sharing statement",
  description:
    "Statement specifying what de-identified data are available, to whom, when, where, and under what conditions.",
  whenRequired: "Required by most major medical journals (BMJ, Lancet, JAMA, NEJM, ICMJE).",
};

const TIDIER = {
  id: "tidier",
  name: "TIDieR intervention description checklist",
  description:
    "Template for Intervention Description and Replication (12-item checklist) — name, why, what materials, what procedure, who provided, how, where, when/how much, tailoring, modifications, planned/actual fidelity.",
  url: "https://www.equator-network.org/reporting-guidelines/tidier/",
  whenRequired: "Recommended whenever an intervention is described.",
};

const GRIPP2 = {
  id: "gripp2",
  name: "GRIPP2 patient & public involvement reporting",
  description:
    "Short or long form for reporting patient and public involvement (PPI) in research.",
  url: "https://www.equator-network.org/reporting-guidelines/gripp2-reporting-checklists-for-patient-and-public-involvement-in-research/",
  whenRequired: "Required by BMJ; recommended for all health-services research.",
};

const SPIRIT_CHECKLIST = {
  id: "spirit-checklist",
  name: "SPIRIT 2013 checklist",
  description: "33-item checklist for clinical trial protocols.",
  url: "https://www.equator-network.org/reporting-guidelines/spirit-2013-statement-defining-standard-protocol-items-for-clinical-trials/",
};

const PRISMA_P_CHECKLIST = {
  id: "prisma-p",
  name: "PRISMA-P 2015 checklist",
  description: "17-item checklist for systematic-review protocols.",
  url: "https://www.equator-network.org/reporting-guidelines/prisma-protocols/",
};

/* ============================================================
   Reusable checklist building blocks (paraphrased).
   Always paraphrased — for verbatim official text see linked URLs.
   ============================================================ */

const CONSORT_2025 = {
  title: [
    "Identify the study as a randomised trial in the title.",
    "Use the structured abstract format required by the journal.",
  ],
  abstract: [
    "Provide a structured abstract with design, methods, results, conclusions (per journal).",
    "State the primary outcome and effect estimate with precision.",
    "State trial registration identifier.",
  ],
  introduction: [
    "Provide scientific background and rationale.",
    "State specific objectives or hypotheses.",
  ],
  methods: [
    "Describe trial design including allocation ratio and design framework (parallel, factorial, cluster, etc.).",
    "Pre-specify any important changes to methods after trial commencement, with reasons.",
    "Describe eligibility criteria and the settings/locations where data were collected.",
    "Describe interventions for each group in enough detail to allow replication (TIDieR-compatible).",
    "Pre-specify primary and secondary outcomes including any changes.",
    "Report how sample size was determined including assumptions and any interim analyses.",
    "Describe random sequence generation, allocation concealment, and implementation.",
    "Describe blinding of participants, providers, and outcome assessors.",
    "Specify statistical methods including handling of missing data, multiplicity, and prespecified subgroup analyses.",
    "Report trial registration number, protocol availability, funding, and conflicts of interest.",
    "Describe data sharing plan in line with ICMJE.",
    "Open science: declare pre-registration, protocol, data, code, and material availability.",
  ],
  results: [
    "Provide a CONSORT participant flow diagram for each group.",
    "Report recruitment and follow-up dates and any reasons for stopping the trial.",
    "Present baseline demographic and clinical characteristics by group.",
    "For each group, report numbers analysed (ITT, modified ITT, per-protocol) and reasons for missing data.",
    "Report results for each outcome with effect size and precision (e.g., 95% CI), and any adjusted analyses.",
    "Report all important harms or unintended effects in each group.",
  ],
  discussion: [
    "Discuss limitations including potential bias, imprecision, and multiplicity.",
    "Discuss generalisability (external validity).",
    "Provide interpretation consistent with results, balancing benefits and harms and considering other relevant evidence.",
  ],
  conclusion: [
    "Align conclusions with the primary outcome, effect estimate, and trial design.",
    "Avoid over-interpretation or causal claims unsupported by the data.",
  ],
};

const STROBE_BASE = {
  title: [
    "Indicate the study design (cohort, case-control, cross-sectional) in the title or abstract.",
  ],
  abstract: [
    "Provide an informative, balanced summary of methods and findings.",
  ],
  introduction: [
    "Describe scientific background and rationale.",
    "State pre-specified objectives, including any hypotheses.",
  ],
  methods: [
    "Describe the study design and setting clearly.",
    "Describe eligibility criteria and sources/methods of selection.",
    "Define all exposures, outcomes, predictors, potential confounders, and effect modifiers.",
    "Describe data sources and measurement methods, including comparability across groups.",
    "Describe efforts to address potential sources of bias.",
    "Explain how study size was determined.",
    "Describe handling of quantitative variables and statistical methods including confounding, subgroups, missing data, sensitivity analyses.",
  ],
  results: [
    "Report numbers at each stage (eligible, examined, included, completed follow-up).",
    "Give baseline characteristics and information on exposures and outcomes.",
    "Report unadjusted and confounder-adjusted estimates with precision.",
    "Report category boundaries for continuous variables when categorised.",
  ],
  discussion: [
    "Summarise key results referencing study objectives.",
    "Discuss limitations including bias and imprecision.",
    "Provide cautious interpretation considering objectives, limitations, multiplicity, and other studies.",
    "Discuss generalisability.",
  ],
  conclusion: ["Avoid causal language unsupported by an observational design."],
};

const PRISMA_2020 = {
  title: ["Identify the report as a systematic review (and meta-analysis if applicable)."],
  abstract: ["Provide a structured abstract following PRISMA-Abstracts."],
  introduction: [
    "Describe rationale in the context of existing knowledge.",
    "Provide an explicit objective statement using a structured framework (e.g., PICO).",
  ],
  methods: [
    "Specify inclusion and exclusion criteria including PICOS.",
    "Specify all information sources and date last searched.",
    "Provide the full search strategies for each database in the supplement.",
    "Describe study selection, data collection, and data items processes (including any automation).",
    "Describe risk-of-bias assessment for each study.",
    "Describe synthesis methods (qualitative or quantitative), heterogeneity, and certainty-of-evidence (GRADE).",
    "State whether a protocol was prepared and registered (PROSPERO).",
  ],
  results: [
    "Provide a PRISMA 2020 flow diagram.",
    "Cite all included studies and present their characteristics.",
    "Present risk-of-bias assessments.",
    "Present synthesis results (individual study results and combined estimates if applicable).",
    "Report certainty of evidence for each main outcome.",
  ],
  discussion: [
    "Provide a general interpretation in the context of other evidence.",
    "Discuss limitations of the evidence and the review process.",
    "Discuss implications for practice, policy, and future research.",
  ],
  conclusion: [
    "Align conclusions with strength of evidence and risk-of-bias findings.",
  ],
};

const STARD_2015 = {
  title: ["Identify the study as a diagnostic accuracy study and name the index test."],
  abstract: ["Provide a structured abstract with design, methods, results, conclusions."],
  introduction: ["State scientific and clinical background and study objectives."],
  methods: [
    "Define the index test and reference standard, including thresholds.",
    "Describe participant selection, sampling, and setting.",
    "Describe blinding of index-test readers to the reference standard and vice versa.",
    "Describe flow and timing between the index test and reference standard.",
    "Pre-specify statistical methods for sensitivity, specificity, predictive values, ROC/AUC.",
    "Describe handling of indeterminate, missing, or outlying results.",
  ],
  results: [
    "Show a flow diagram of participants.",
    "Report cross-tabulation between index test and reference standard.",
    "Report estimates of diagnostic accuracy with 95% CI.",
    "Report adverse events from the index or reference test.",
  ],
  discussion: [
    "Discuss clinical applicability and limitations including spectrum and verification bias.",
  ],
  conclusion: ["Align clinical implications with the studied population and reference standard."],
};

const TRIPOD_AI = {
  title: ["Identify the study as developing and/or validating a multivariable prediction model."],
  abstract: ["State whether regression or machine-learning methods were used."],
  introduction: ["State the prediction problem, intended use, and target population."],
  methods: [
    "Describe study design, data sources, and participants (development and validation cohorts).",
    "Define the outcome and how/when it was measured; blinding to predictors.",
    "Describe candidate predictors, how and when measured, and any unblinding.",
    "Describe sample-size determination and handling of missing data (with imputation method).",
    "Describe modelling approach, predictor selection, handling of continuous predictors, regularization, hyper-parameter tuning.",
    "Describe internal and external validation plans, including performance measures (discrimination, calibration) and any fairness/subgroup evaluation.",
    "Describe code and data availability (TRIPOD-CODE-compatible).",
  ],
  results: [
    "Report participant flow and characteristics for each cohort.",
    "Report model coefficients / decision rules and full performance with confidence intervals.",
    "Report calibration and discrimination with plots and statistics.",
    "Report subgroup / fairness analyses where relevant.",
  ],
  discussion: [
    "Discuss limitations including overfitting, generalisability, missing data, fairness.",
    "Discuss clinical utility and need for further external validation and impact studies.",
  ],
  conclusion: [
    "Avoid claims of clinical utility without prospective evaluation or external validation.",
  ],
};

const CARE = {
  title: ["Use the word 'case report' and indicate the area of interest in the title."],
  abstract: ["Provide a structured abstract: introduction, case presentation, conclusions."],
  introduction: ["Provide background of the condition and relevance of the case."],
  methods: [
    "Provide patient information (de-identified demographics, history, relevant comorbidities).",
    "Describe clinical findings.",
    "Describe a clear timeline of events.",
    "Describe diagnostic assessment including diagnostic challenges and reasoning.",
    "Describe therapeutic intervention (type, dose, duration, changes).",
    "Describe follow-up and outcomes including adverse / unanticipated events.",
    "Document patient informed consent for publication.",
  ],
  results: [
    "Present the case timeline and outcomes objectively without over-generalisation.",
  ],
  discussion: [
    "Discuss strengths and limitations, relevant medical literature, and lessons learned.",
  ],
  conclusion: ["Provide a take-away proportional to a single case (not generalisable)."],
};

const SQUIRE = {
  title: ["Indicate the project is a quality-improvement initiative."],
  abstract: ["Provide a structured abstract following SQUIRE 2.0."],
  introduction: ["Describe nature and significance of the local problem and aim."],
  methods: [
    "Describe context (setting and factors thought to affect success).",
    "Describe the intervention(s) and improvement-theory rationale.",
    "Describe study of the intervention (timing, evolution, comparison group).",
    "Describe measures (process, outcome, balancing) and analysis approach.",
    "Address ethical considerations.",
  ],
  results: [
    "Show initial steps of the intervention and their evolution over time (run charts).",
    "Report quantitative and qualitative data on processes, outcomes, and contextual factors.",
    "Document unintended consequences.",
  ],
  discussion: [
    "Discuss key findings, lessons, limitations, sustainability, and potential for spread.",
  ],
  conclusion: ["Avoid overstating causal effect of complex improvement interventions."],
};

const ARRIVE = {
  title: ["Indicate the species and main intervention/measure in the title or abstract."],
  abstract: ["Provide a clear summary including species and main findings."],
  introduction: ["State background and objectives, including translational relevance."],
  methods: [
    "Describe species, strain, sex, age, source, and welfare-related housing/husbandry.",
    "Describe experimental design including randomisation, blinding, and sample-size justification.",
    "Pre-specify outcomes and statistical methods.",
    "Describe ethics approval and the 3Rs (Replacement, Reduction, Refinement).",
  ],
  results: [
    "Report numbers of animals at each stage, including exclusions and reasons.",
    "Report outcomes with appropriate effect sizes and precision.",
  ],
  discussion: [
    "Discuss limitations, generalisability to humans, and translational caveats.",
  ],
  conclusion: ["Avoid premature clinical extrapolation from animal data."],
};

const CHEERS = {
  title: ["Identify the study as an economic evaluation and name the comparators."],
  abstract: ["Provide a structured abstract per CHEERS 2022."],
  introduction: [
    "State the question, target population, setting, and decision context.",
    "State the perspective(s) (payer, societal, etc.).",
  ],
  methods: [
    "Describe comparators, time horizon, discount rate, choice of outcomes.",
    "Describe how effectiveness was estimated (trial, model, review).",
    "Describe measurement and valuation of costs and outcomes.",
    "Describe currency, price date, conversion, and model assumptions.",
    "Describe analytical methods including sensitivity/uncertainty analyses.",
  ],
  results: [
    "Report study parameters and base-case results (ICERs).",
    "Characterise uncertainty (e.g., probabilistic sensitivity analysis).",
    "Report disaggregated costs and outcomes where feasible.",
  ],
  discussion: [
    "Discuss generalisability, limitations, equity, and policy implications.",
  ],
  conclusion: ["Tie cost-effectiveness statement to the chosen perspective and threshold."],
};

const SRQR = {
  title: ["Identify the study as qualitative and indicate the methodology."],
  abstract: ["Provide a clear summary including paradigm, methods, and key themes."],
  introduction: ["State the problem, research question, and theoretical framework."],
  methods: [
    "Describe research paradigm/orientation and researcher reflexivity.",
    "Describe context, sampling strategy, and participant recruitment.",
    "Describe data collection (interviews, focus groups, observation) and procedures.",
    "Describe analysis approach, coding, and how trustworthiness was ensured (e.g., triangulation, member checking, audit trail).",
    "Describe ethics approval and informed consent.",
  ],
  results: [
    "Report themes/findings with illustrative quotations and participant context.",
  ],
  discussion: [
    "Discuss findings in relation to literature, reflexivity, and transferability.",
  ],
  conclusion: ["Avoid quantitative generalisation; emphasise transferability and meaning."],
};

const AGREE_RIGHT = {
  title: ["Identify the document as a clinical practice guideline."],
  abstract: ["Provide a clear summary of scope, population, recommendations."],
  introduction: ["State purpose, scope, population, and target users."],
  methods: [
    "Describe panel composition and management of conflicts of interest.",
    "Describe evidence-review methods and grading system (GRADE).",
    "Describe formulation, voting, and review of recommendations.",
    "Describe external peer review and updating plan.",
  ],
  results: [
    "Present each recommendation with strength and evidence certainty.",
    "Provide rationale and supporting evidence summaries.",
  ],
  discussion: [
    "Discuss applicability, implementation, monitoring, and equity considerations.",
  ],
  conclusion: ["Summarise key recommendations with appropriate uncertainty acknowledgement."],
};

/* ============================================================
   The design catalog.
   12 categories × ~5 specific designs each ≈ 60 designs.
   ============================================================ */

export const designs: DesignSpec[] = [
  /* ---------- 1. INTERVENTIONAL ---------- */
  {
    id: "interv.rct.parallel",
    category: "interventional",
    name: "Randomized controlled trial (parallel-group)",
    shortLabel: "RCT — parallel",
    primaryGuideline: {
      acronym: "CONSORT 2025",
      fullName: "CONSORT 2025 Statement: updated guideline for reporting randomised trials",
      year: "2025",
      officialUrl: "https://www.equator-network.org/reporting-guidelines/consort/",
      citation:
        "Hopewell S, et al. CONSORT 2025 Statement: updated guideline for reporting randomised trials. BMJ. 2025;389:e081123.",
    },
    legacyGuidelines: [
      {
        acronym: "CONSORT 2010",
        fullName: "CONSORT 2010 statement",
        year: "2010",
        officialUrl: "https://www.equator-network.org/reporting-guidelines/consort/",
        deprecated: true,
        successorAcronym: "CONSORT 2025",
      },
    ],
    whenToUseChecklist: [
      "Participants were randomly allocated to two or more parallel arms.",
      "There is at least one intervention versus a control / comparator.",
      "Study is not cluster, crossover, factorial, or stepped-wedge (those have their own extensions).",
      "Primary outcome was prospectively defined.",
    ],
    manuscriptSections: ALL_SECTIONS,
    reportingChecklist: CONSORT_2025,
    supportingDocuments: [
      FLOW_DIAGRAM,
      TRIAL_REGISTRATION,
      ETHICS_APPROVAL,
      INFORMED_CONSENT,
      ICMJE_DISCLOSURE,
      DATA_SHARING_STATEMENT,
      TIDIER,
    ],
    commonExtensions: [
      { acronym: "CONSORT-Harms", fullName: "Reporting harms", whenToUse: "Always include harms; expand when adverse events are a focus." },
      { acronym: "CONSORT-PRO", fullName: "Patient-reported outcomes", whenToUse: "When a PRO is used as primary or secondary outcome." },
      { acronym: "TIDieR", fullName: "Intervention description", whenToUse: "Always — describe the intervention in replicable detail." },
      { acronym: "GRIPP2", fullName: "Patient & public involvement", whenToUse: "Required by BMJ; recommended for all trials." },
    ],
    pitfalls: [
      "Reporting only ITT analysis with no per-protocol comparison.",
      "Omitting the CONSORT flow diagram.",
      "Selective reporting of secondary outcomes that became significant.",
      "Implying causation in the abstract beyond what the effect estimate supports.",
      "Missing data not described or analysed transparently.",
    ],
    appliesTo: ["rct", "randomised", "randomized", "parallel", "trial", "interventional"],
  },
  {
    id: "interv.rct.cluster",
    category: "interventional",
    name: "Cluster-randomized trial",
    shortLabel: "RCT — cluster",
    primaryGuideline: {
      acronym: "CONSORT 2025 + Cluster extension",
      fullName: "CONSORT extension for cluster randomised trials",
      year: "2012 (with CONSORT 2025 main statement)",
      officialUrl: "https://www.equator-network.org/reporting-guidelines/consort-cluster/",
    },
    whenToUseChecklist: [
      "Randomization unit is a cluster (clinic, ward, school, village), not an individual.",
      "Outcome is measured at the individual level within clusters.",
      "Sample size accounts for intra-cluster correlation (ICC).",
    ],
    manuscriptSections: ALL_SECTIONS,
    reportingChecklist: {
      ...CONSORT_2025,
      methods: [
        ...CONSORT_2025.methods,
        "Justify the cluster design and unit of randomization.",
        "Report the assumed intra-cluster correlation coefficient (ICC) used for sample size.",
        "Describe procedures for cluster identification, recruitment, and consent.",
      ],
      results: [
        ...CONSORT_2025.results,
        "Report the number of clusters and individuals per cluster.",
        "Report observed ICCs for primary outcomes.",
        "Account for clustering in all effect estimates.",
      ],
    },
    supportingDocuments: [FLOW_DIAGRAM, TRIAL_REGISTRATION, ETHICS_APPROVAL, INFORMED_CONSENT, ICMJE_DISCLOSURE, DATA_SHARING_STATEMENT, TIDIER],
    commonExtensions: [
      { acronym: "CONSORT-Harms", fullName: "Reporting harms", whenToUse: "Always for trials." },
      { acronym: "TIDieR", fullName: "Intervention description", whenToUse: "Always — describe what each cluster received." },
    ],
    pitfalls: [
      "Ignoring intra-cluster correlation in analyses.",
      "Not reporting cluster-level baseline imbalance.",
      "Consenting individuals after cluster randomization (selection bias).",
    ],
    appliesTo: ["cluster", "cluster-randomised", "group-randomised"],
  },
  {
    id: "interv.rct.crossover",
    category: "interventional",
    name: "Crossover trial",
    shortLabel: "RCT — crossover",
    primaryGuideline: {
      acronym: "CONSORT 2025 + Crossover extension",
      fullName: "CONSORT extension for crossover trials",
      year: "2019",
      officialUrl: "https://www.equator-network.org/reporting-guidelines/consort-extension-for-randomised-crossover-trials/",
    },
    whenToUseChecklist: [
      "Each participant receives all interventions in random order.",
      "There is a washout period between treatments.",
      "Carryover effects are addressed analytically.",
    ],
    manuscriptSections: ALL_SECTIONS,
    reportingChecklist: {
      ...CONSORT_2025,
      methods: [
        ...CONSORT_2025.methods,
        "Justify the crossover design and rationale for the condition's chronicity/stability.",
        "Describe washout period(s) and rationale.",
        "Describe how carryover effects were assessed.",
      ],
    },
    supportingDocuments: [FLOW_DIAGRAM, TRIAL_REGISTRATION, ETHICS_APPROVAL, INFORMED_CONSENT, ICMJE_DISCLOSURE, DATA_SHARING_STATEMENT],
    commonExtensions: [{ acronym: "TIDieR", fullName: "Intervention description", whenToUse: "Always." }],
    pitfalls: ["Inadequate washout leading to carryover.", "Period × treatment interaction not assessed."],
    appliesTo: ["crossover", "cross-over"],
  },
  {
    id: "interv.rct.pilot",
    category: "interventional",
    name: "Pilot / feasibility trial",
    shortLabel: "Pilot/feasibility",
    primaryGuideline: {
      acronym: "CONSORT-Pilot",
      fullName: "CONSORT extension for pilot and feasibility trials",
      year: "2016",
      officialUrl: "https://www.equator-network.org/reporting-guidelines/consort-extension-for-pilot-and-feasibility-trials/",
    },
    whenToUseChecklist: [
      "Aim is to test feasibility of a future definitive trial, not efficacy.",
      "Pre-specified feasibility objectives (recruitment, retention, acceptability).",
      "Underpowered for clinical effectiveness; no inferential primary outcome.",
    ],
    manuscriptSections: ALL_SECTIONS,
    reportingChecklist: {
      ...CONSORT_2025,
      methods: [
        ...CONSORT_2025.methods,
        "State pilot/feasibility objectives and progression criteria for the main trial.",
        "Avoid framing as a hypothesis test of effectiveness.",
      ],
      results: [
        ...CONSORT_2025.results,
        "Report feasibility outcomes (recruitment rate, retention, intervention adherence).",
      ],
      conclusion: [
        "Avoid effectiveness claims — focus on whether and how a definitive trial should proceed.",
      ],
    },
    supportingDocuments: [FLOW_DIAGRAM, TRIAL_REGISTRATION, ETHICS_APPROVAL, INFORMED_CONSENT, TIDIER],
    commonExtensions: [{ acronym: "TIDieR", fullName: "Intervention description", whenToUse: "Always." }],
    pitfalls: ["Inferring effectiveness from a feasibility study.", "No progression criteria defined a priori."],
    appliesTo: ["pilot", "feasibility"],
  },
  {
    id: "interv.rct.noninferiority",
    category: "interventional",
    name: "Non-inferiority / equivalence trial",
    shortLabel: "Non-inferiority",
    primaryGuideline: {
      acronym: "CONSORT-NI/E",
      fullName: "CONSORT extension for non-inferiority and equivalence randomised trials",
      year: "2012",
      officialUrl: "https://www.equator-network.org/reporting-guidelines/consort-non-inferiority/",
    },
    whenToUseChecklist: [
      "Hypothesis is that intervention is not worse than (or equivalent to) comparator by a pre-specified margin.",
      "Non-inferiority margin justified clinically AND statistically.",
      "Both ITT and per-protocol analyses reported.",
    ],
    manuscriptSections: ALL_SECTIONS,
    reportingChecklist: {
      ...CONSORT_2025,
      methods: [
        ...CONSORT_2025.methods,
        "Justify the non-inferiority / equivalence margin clinically and statistically.",
        "Pre-specify both ITT and per-protocol analyses (both should be consistent for non-inferiority).",
      ],
      results: [
        ...CONSORT_2025.results,
        "Report the CI relative to the non-inferiority margin, not just to the null.",
      ],
    },
    supportingDocuments: [FLOW_DIAGRAM, TRIAL_REGISTRATION, ETHICS_APPROVAL, INFORMED_CONSENT, DATA_SHARING_STATEMENT],
    commonExtensions: [],
    pitfalls: [
      "Inadequate justification of margin.",
      "Reporting only ITT; non-inferiority requires both ITT and per-protocol.",
      "Bias toward the null from poor adherence not addressed.",
    ],
    appliesTo: ["non-inferiority", "noninferiority", "equivalence"],
  },
  {
    id: "interv.rct.pragmatic",
    category: "interventional",
    name: "Pragmatic trial",
    shortLabel: "Pragmatic trial",
    primaryGuideline: {
      acronym: "CONSORT-Pragmatic",
      fullName: "CONSORT extension for pragmatic trials",
      year: "2008",
      officialUrl: "https://www.equator-network.org/reporting-guidelines/consort-pragmatic-trials/",
    },
    whenToUseChecklist: [
      "Trial designed to inform real-world decision-making.",
      "Eligibility criteria reflect routine practice.",
      "Intervention delivered as in usual care.",
      "PRECIS-2 wheel ideally provided.",
    ],
    manuscriptSections: ALL_SECTIONS,
    reportingChecklist: CONSORT_2025,
    supportingDocuments: [FLOW_DIAGRAM, TRIAL_REGISTRATION, ETHICS_APPROVAL, INFORMED_CONSENT, TIDIER],
    commonExtensions: [
      { acronym: "PRECIS-2", fullName: "Pragmatic-explanatory continuum indicator summary", whenToUse: "Recommended for any pragmatic trial." },
      { acronym: "TIDieR", fullName: "Intervention description", whenToUse: "Always." },
    ],
    pitfalls: ["Reporting as efficacy trial when designed pragmatically.", "Inflexible analysis not matching real-world variation."],
    appliesTo: ["pragmatic"],
  },
  {
    id: "interv.rct.stepped-wedge",
    category: "interventional",
    name: "Stepped-wedge trial",
    shortLabel: "Stepped-wedge",
    primaryGuideline: {
      acronym: "CONSORT — Stepped Wedge",
      fullName: "CONSORT extension for stepped-wedge cluster trials",
      year: "2018",
      officialUrl: "https://www.equator-network.org/reporting-guidelines/consort-extension-stepped-wedge-cluster-randomised-trials/",
    },
    whenToUseChecklist: [
      "Clusters cross over from control to intervention in a randomly-determined sequence.",
      "All clusters receive the intervention by the end.",
      "Secular trends are accounted for analytically.",
    ],
    manuscriptSections: ALL_SECTIONS,
    reportingChecklist: {
      ...CONSORT_2025,
      methods: [
        ...CONSORT_2025.methods,
        "Justify the stepped-wedge design and number of steps.",
        "Describe model adjustments for time and clustering.",
      ],
    },
    supportingDocuments: [FLOW_DIAGRAM, TRIAL_REGISTRATION, ETHICS_APPROVAL, INFORMED_CONSENT],
    commonExtensions: [],
    pitfalls: ["Confounding by calendar time.", "Insufficient steps/clusters."],
    appliesTo: ["stepped-wedge", "stepped wedge"],
  },
  {
    id: "interv.rct.adaptive",
    category: "interventional",
    name: "Adaptive trial",
    shortLabel: "Adaptive trial",
    primaryGuideline: {
      acronym: "ACE",
      fullName: "Adaptive designs CONSORT Extension",
      year: "2020",
      officialUrl: "https://www.equator-network.org/reporting-guidelines/ace/",
    },
    whenToUseChecklist: [
      "Pre-specified adaptations triggered by interim data.",
      "Adaptations could include sample-size reassessment, arm dropping, response-adaptive randomization.",
      "Type-I error and bias controlled by design.",
    ],
    manuscriptSections: ALL_SECTIONS,
    reportingChecklist: CONSORT_2025,
    supportingDocuments: [FLOW_DIAGRAM, TRIAL_REGISTRATION, ETHICS_APPROVAL, INFORMED_CONSENT],
    commonExtensions: [],
    pitfalls: ["Unplanned adaptations not pre-specified.", "Type-I error inflation."],
    appliesTo: ["adaptive", "bayesian adaptive", "platform trial"],
  },
  {
    id: "interv.rct.n-of-1",
    category: "interventional",
    name: "N-of-1 trial",
    shortLabel: "N-of-1",
    primaryGuideline: {
      acronym: "CENT 2015",
      fullName: "CONSORT extension for N-of-1 trials",
      year: "2015",
      officialUrl: "https://www.equator-network.org/reporting-guidelines/cent/",
    },
    whenToUseChecklist: [
      "Single participant receives multiple treatment periods in random or sequential order.",
      "Goal is individual treatment optimization.",
    ],
    manuscriptSections: ALL_SECTIONS,
    reportingChecklist: CONSORT_2025,
    supportingDocuments: [ETHICS_APPROVAL, INFORMED_CONSENT],
    commonExtensions: [],
    pitfalls: ["Generalising N-of-1 results to populations."],
    appliesTo: ["n-of-1", "single patient"],
  },
  {
    id: "interv.rct.npt",
    category: "interventional",
    name: "Non-pharmacological intervention trial",
    shortLabel: "Non-pharm trial",
    primaryGuideline: {
      acronym: "CONSORT-NPT",
      fullName: "CONSORT extension for non-pharmacologic treatment interventions",
      year: "2017",
      officialUrl: "https://www.equator-network.org/reporting-guidelines/consort-npt/",
    },
    whenToUseChecklist: [
      "Intervention is surgical, behavioural, device-based, rehab, psychotherapy, or similar non-drug.",
      "Provider expertise/clustering is a meaningful factor.",
    ],
    manuscriptSections: ALL_SECTIONS,
    reportingChecklist: {
      ...CONSORT_2025,
      methods: [
        ...CONSORT_2025.methods,
        "Describe provider expertise, training, and centre volume.",
        "Describe care-provider clustering and how it was analysed.",
      ],
    },
    supportingDocuments: [FLOW_DIAGRAM, TRIAL_REGISTRATION, ETHICS_APPROVAL, INFORMED_CONSENT, TIDIER],
    commonExtensions: [{ acronym: "TIDieR", fullName: "Intervention description", whenToUse: "Always." }],
    pitfalls: ["Not accounting for surgeon/centre clustering.", "Inadequate intervention description."],
    appliesTo: ["non-pharmacologic", "non-pharmacological", "surgical", "behavioural"],
  },
  {
    id: "interv.rct.dct",
    category: "interventional",
    name: "Decentralized clinical trial (DCT)",
    shortLabel: "Decentralized trial",
    primaryGuideline: {
      acronym: "CONSORT-DCT (forthcoming)",
      fullName: "CONSORT extension for decentralized clinical trials",
      year: "2026",
      officialUrl: "https://www.equator-network.org/library/reporting-guidelines-under-development/reporting-guidelines-under-development-for-clinical-trials/",
    },
    whenToUseChecklist: [
      "Trial procedures (consent, intervention, outcome assessment) happen partly or fully remotely.",
      "Uses telehealth, wearables, e-consent, home delivery, or remote monitoring.",
    ],
    manuscriptSections: ALL_SECTIONS,
    reportingChecklist: {
      ...CONSORT_2025,
      methods: [
        ...CONSORT_2025.methods,
        "Describe the decentralized components (which procedures, what technology, data flows).",
        "Describe data security, privacy, and digital equity considerations.",
      ],
    },
    supportingDocuments: [FLOW_DIAGRAM, TRIAL_REGISTRATION, ETHICS_APPROVAL, INFORMED_CONSENT, DATA_SHARING_STATEMENT],
    commonExtensions: [{ acronym: "CONSORT-eHealth", fullName: "eHealth interventions", whenToUse: "If a digital intervention is delivered." }],
    pitfalls: ["Under-reporting digital divide and equity impacts."],
    appliesTo: ["decentralized", "remote", "digital trial", "dct"],
  },
  {
    id: "interv.rct.ai",
    category: "interventional",
    name: "AI-intervention trial",
    shortLabel: "AI intervention RCT",
    primaryGuideline: {
      acronym: "CONSORT-AI",
      fullName: "CONSORT-AI extension",
      year: "2020",
      officialUrl: "https://www.equator-network.org/reporting-guidelines/consort-ai/",
      citation:
        "Liu X, et al. Reporting guidelines for clinical trial reports for interventions involving artificial intelligence: the CONSORT-AI extension. Nat Med. 2020;26:1364-74.",
    },
    whenToUseChecklist: [
      "Intervention involves an AI/ML algorithm interacting with clinical decisions.",
      "AI tool was trained, externally validated, and deployed in the trial.",
    ],
    manuscriptSections: ALL_SECTIONS,
    reportingChecklist: {
      ...CONSORT_2025,
      methods: [
        ...CONSORT_2025.methods,
        "Describe AI intervention version, training data, intended use, integration into the workflow, and human oversight.",
        "Describe input handling errors and contingencies (algorithm failures, drift).",
      ],
      discussion: [
        ...CONSORT_2025.discussion,
        "Discuss algorithm performance drift, generalizability, and equity considerations.",
      ],
    },
    supportingDocuments: [FLOW_DIAGRAM, TRIAL_REGISTRATION, ETHICS_APPROVAL, INFORMED_CONSENT, DATA_SHARING_STATEMENT],
    commonExtensions: [
      { acronym: "SPIRIT-AI", fullName: "Protocol counterpart", whenToUse: "For AI-intervention trial protocols." },
      { acronym: "DECIDE-AI", fullName: "Early-stage clinical evaluation of AI", whenToUse: "For early-phase decision-support evaluations." },
    ],
    pitfalls: ["No external-validation evidence prior to trial.", "No description of failure modes."],
    appliesTo: ["ai", "ml", "machine learning", "artificial intelligence", "deep learning"],
  },

  /* ---------- 2. OBSERVATIONAL ---------- */
  {
    id: "obs.cohort.prospective",
    category: "observational",
    name: "Prospective cohort study",
    shortLabel: "Prospective cohort",
    primaryGuideline: {
      acronym: "STROBE",
      fullName: "Strengthening the Reporting of Observational Studies in Epidemiology",
      year: "2007",
      officialUrl: "https://www.equator-network.org/reporting-guidelines/strobe/",
    },
    whenToUseChecklist: [
      "Participants are grouped by exposure and followed forward in time.",
      "Outcomes occur after exposure ascertainment.",
      "Comparison group(s) defined a priori.",
    ],
    manuscriptSections: ALL_SECTIONS,
    reportingChecklist: STROBE_BASE,
    supportingDocuments: [ETHICS_APPROVAL, INFORMED_CONSENT, ICMJE_DISCLOSURE, DATA_SHARING_STATEMENT],
    commonExtensions: [{ acronym: "STROBE-equity", fullName: "Equity-focused observational", whenToUse: "When equity is a focus." }],
    pitfalls: ["Loss to follow-up not addressed.", "Confounding inadequately controlled."],
    appliesTo: ["cohort", "prospective", "longitudinal"],
  },
  {
    id: "obs.cohort.retrospective",
    category: "observational",
    name: "Retrospective cohort study",
    shortLabel: "Retrospective cohort",
    primaryGuideline: {
      acronym: "STROBE",
      fullName: "STROBE",
      year: "2007",
      officialUrl: "https://www.equator-network.org/reporting-guidelines/strobe/",
    },
    whenToUseChecklist: [
      "Exposure and outcome already occurred at time of study.",
      "Cohort assembled from existing records.",
    ],
    manuscriptSections: ALL_SECTIONS,
    reportingChecklist: STROBE_BASE,
    supportingDocuments: [ETHICS_APPROVAL, ICMJE_DISCLOSURE, DATA_SHARING_STATEMENT],
    commonExtensions: [{ acronym: "RECORD", fullName: "Routinely collected health data", whenToUse: "If using EHR/registry data." }],
    pitfalls: ["Information bias from incomplete records.", "Immortal-time bias."],
    appliesTo: ["retrospective", "historical cohort"],
  },
  {
    id: "obs.case-control",
    category: "observational",
    name: "Case-control study",
    shortLabel: "Case-control",
    primaryGuideline: {
      acronym: "STROBE",
      fullName: "STROBE",
      year: "2007",
      officialUrl: "https://www.equator-network.org/reporting-guidelines/strobe/",
    },
    whenToUseChecklist: [
      "Participants sampled by outcome status, then exposure ascertained.",
      "Controls represent the source population.",
    ],
    manuscriptSections: ALL_SECTIONS,
    reportingChecklist: STROBE_BASE,
    supportingDocuments: [ETHICS_APPROVAL, ICMJE_DISCLOSURE, DATA_SHARING_STATEMENT],
    commonExtensions: [],
    pitfalls: ["Recall bias.", "Inappropriate control selection."],
    appliesTo: ["case-control", "case control"],
  },
  {
    id: "obs.cross-sectional",
    category: "observational",
    name: "Cross-sectional study",
    shortLabel: "Cross-sectional",
    primaryGuideline: {
      acronym: "STROBE",
      fullName: "STROBE",
      year: "2007",
      officialUrl: "https://www.equator-network.org/reporting-guidelines/strobe/",
    },
    whenToUseChecklist: [
      "Exposure and outcome measured at a single point in time.",
      "Estimating prevalence or association at one time-point.",
    ],
    manuscriptSections: ALL_SECTIONS,
    reportingChecklist: STROBE_BASE,
    supportingDocuments: [ETHICS_APPROVAL, INFORMED_CONSENT, ICMJE_DISCLOSURE],
    commonExtensions: [],
    pitfalls: ["No temporal sequence — avoid causal claims.", "Non-response bias not addressed."],
    appliesTo: ["cross-sectional", "prevalence", "survey"],
  },
  {
    id: "obs.its",
    category: "observational",
    name: "Interrupted time-series study",
    shortLabel: "Interrupted time-series",
    primaryGuideline: {
      acronym: "STROBE + EPOC ITS",
      fullName: "STROBE with Cochrane EPOC interrupted time-series guidance",
      year: "2007 / EPOC",
      officialUrl: "https://www.equator-network.org/reporting-guidelines/strobe/",
    },
    whenToUseChecklist: [
      "Outcome measured at multiple time-points before and after an intervention/policy.",
      "Segmented regression with level and slope changes.",
    ],
    manuscriptSections: ALL_SECTIONS,
    reportingChecklist: STROBE_BASE,
    supportingDocuments: [ETHICS_APPROVAL, DATA_SHARING_STATEMENT],
    commonExtensions: [],
    pitfalls: ["Auto-correlation not accounted for.", "Too few time-points."],
    appliesTo: ["interrupted time-series", "its", "segmented regression"],
  },
  {
    id: "obs.record",
    category: "observational",
    name: "Routinely-collected data / registry study",
    shortLabel: "RWD / registry",
    primaryGuideline: {
      acronym: "RECORD",
      fullName: "RECORD: REporting of studies Conducted using Observational Routinely-collected health Data",
      year: "2015",
      officialUrl: "https://www.equator-network.org/reporting-guidelines/record/",
    },
    whenToUseChecklist: [
      "Data come from EHRs, claims, registries, or administrative datasets not collected for the study.",
    ],
    manuscriptSections: ALL_SECTIONS,
    reportingChecklist: STROBE_BASE,
    supportingDocuments: [ETHICS_APPROVAL, DATA_SHARING_STATEMENT],
    commonExtensions: [{ acronym: "RECORD-PE", fullName: "Pharmacoepidemiology", whenToUse: "If drug use is the exposure." }],
    pitfalls: ["Coding inaccuracies.", "Missing covariates."],
    appliesTo: ["registry", "ehr", "claims", "administrative data", "routinely collected", "real-world data"],
  },
  {
    id: "obs.mr",
    category: "observational",
    name: "Mendelian randomization",
    shortLabel: "Mendelian randomization",
    primaryGuideline: {
      acronym: "STROBE-MR",
      fullName: "STROBE extension for Mendelian Randomization",
      year: "2021",
      officialUrl: "https://www.equator-network.org/reporting-guidelines/strobe-mr/",
    },
    whenToUseChecklist: [
      "Genetic variants used as instrumental variables for an exposure.",
      "MR-Egger / weighted-median / MR-PRESSO sensitivity analyses.",
    ],
    manuscriptSections: ALL_SECTIONS,
    reportingChecklist: STROBE_BASE,
    supportingDocuments: [ETHICS_APPROVAL, DATA_SHARING_STATEMENT],
    commonExtensions: [],
    pitfalls: ["Weak instrument bias.", "Horizontal pleiotropy not assessed."],
    appliesTo: ["mendelian randomization", "mr", "instrumental variable"],
  },
  {
    id: "obs.target-trial",
    category: "observational",
    name: "Target trial emulation",
    shortLabel: "Target-trial emulation",
    primaryGuideline: {
      acronym: "STROBE + Target Trial framework",
      fullName: "STROBE with Hernán-Robins target trial emulation framework",
      year: "2007 / 2016",
      officialUrl: "https://www.equator-network.org/reporting-guidelines/strobe/",
    },
    whenToUseChecklist: [
      "Observational study explicitly emulates the design of a hypothetical target RCT.",
      "Eligibility, treatment strategies, follow-up, and outcomes pre-specified to mirror the target trial.",
    ],
    manuscriptSections: ALL_SECTIONS,
    reportingChecklist: STROBE_BASE,
    supportingDocuments: [ETHICS_APPROVAL, DATA_SHARING_STATEMENT],
    commonExtensions: [],
    pitfalls: ["Immortal-time bias if treatment-assignment grace period not handled."],
    appliesTo: ["target trial", "emulation", "causal observational"],
  },

  /* ---------- 3. SYNTHESIS ---------- */
  {
    id: "syn.sr",
    category: "synthesis",
    name: "Systematic review of interventions",
    shortLabel: "Systematic review",
    primaryGuideline: {
      acronym: "PRISMA 2020",
      fullName: "PRISMA 2020 statement",
      year: "2020",
      officialUrl: "https://www.equator-network.org/reporting-guidelines/prisma/",
    },
    whenToUseChecklist: [
      "Pre-specified protocol with a focused PICO question.",
      "Comprehensive search of at least two databases.",
      "Risk-of-bias assessment of included studies.",
    ],
    manuscriptSections: ALL_SECTIONS,
    reportingChecklist: PRISMA_2020,
    supportingDocuments: [PRISMA_FLOW, PROSPERO_REGISTRATION, ICMJE_DISCLOSURE],
    commonExtensions: [
      { acronym: "PRISMA-Harms", fullName: "Harms-focused SR", whenToUse: "If harms are a primary focus." },
    ],
    pitfalls: ["Incomplete search strategy.", "No risk-of-bias assessment.", "No certainty of evidence (GRADE)."],
    appliesTo: ["systematic review", "sr", "meta-analysis", "synthesis"],
  },
  {
    id: "syn.ma",
    category: "synthesis",
    name: "Meta-analysis (pairwise)",
    shortLabel: "Meta-analysis",
    primaryGuideline: {
      acronym: "PRISMA 2020",
      fullName: "PRISMA 2020",
      year: "2020",
      officialUrl: "https://www.equator-network.org/reporting-guidelines/prisma/",
    },
    whenToUseChecklist: [
      "Quantitative synthesis of effect estimates across studies.",
      "Heterogeneity assessed (I², τ²).",
      "Sensitivity / subgroup analyses planned a priori.",
    ],
    manuscriptSections: ALL_SECTIONS,
    reportingChecklist: PRISMA_2020,
    supportingDocuments: [PRISMA_FLOW, PROSPERO_REGISTRATION, ICMJE_DISCLOSURE],
    commonExtensions: [],
    pitfalls: ["Pooling heterogeneous studies.", "No publication-bias assessment."],
    appliesTo: ["meta-analysis", "meta analysis"],
  },
  {
    id: "syn.sr-dta",
    category: "synthesis",
    name: "Systematic review of diagnostic test accuracy",
    shortLabel: "SR — diagnostic accuracy",
    primaryGuideline: {
      acronym: "PRISMA-DTA",
      fullName: "PRISMA extension for diagnostic test accuracy reviews",
      year: "2018",
      officialUrl: "https://www.equator-network.org/reporting-guidelines/prisma-dta/",
    },
    whenToUseChecklist: [
      "Synthesis of sensitivity / specificity across studies.",
      "Bivariate or HSROC model used for meta-analysis.",
      "QUADAS-2 used for risk-of-bias assessment.",
    ],
    manuscriptSections: ALL_SECTIONS,
    reportingChecklist: PRISMA_2020,
    supportingDocuments: [PRISMA_FLOW, PROSPERO_REGISTRATION],
    commonExtensions: [],
    pitfalls: ["Univariate pooling of sensitivity/specificity.", "Threshold variability ignored."],
    appliesTo: ["dta", "diagnostic accuracy review"],
  },
  {
    id: "syn.nma",
    category: "synthesis",
    name: "Network meta-analysis",
    shortLabel: "Network meta-analysis",
    primaryGuideline: {
      acronym: "PRISMA-NMA",
      fullName: "PRISMA extension for network meta-analyses",
      year: "2015",
      officialUrl: "https://www.equator-network.org/reporting-guidelines/prisma-extension-network-meta-analyses/",
    },
    whenToUseChecklist: [
      "Indirect and mixed treatment comparisons across ≥3 treatments.",
      "Transitivity and inconsistency assessed.",
      "Ranking via SUCRA or P-score reported responsibly.",
    ],
    manuscriptSections: ALL_SECTIONS,
    reportingChecklist: PRISMA_2020,
    supportingDocuments: [PRISMA_FLOW, PROSPERO_REGISTRATION],
    commonExtensions: [],
    pitfalls: ["Transitivity not assessed.", "Over-interpreting SUCRA rankings."],
    appliesTo: ["network meta-analysis", "nma", "mixed treatment comparison"],
  },
  {
    id: "syn.scoping",
    category: "synthesis",
    name: "Scoping review",
    shortLabel: "Scoping review",
    primaryGuideline: {
      acronym: "PRISMA-ScR",
      fullName: "PRISMA extension for scoping reviews",
      year: "2018",
      officialUrl: "https://www.equator-network.org/reporting-guidelines/prisma-extension-for-scoping-reviews-prisma-scr-checklist-and-explanation/",
    },
    whenToUseChecklist: [
      "Aim is to map the evidence, identify gaps, clarify concepts — not to synthesize effects.",
      "Pre-registered protocol (JBI / OSF).",
      "Charted data extracted but no risk-of-bias assessment.",
    ],
    manuscriptSections: ALL_SECTIONS,
    reportingChecklist: PRISMA_2020,
    supportingDocuments: [PRISMA_FLOW],
    commonExtensions: [],
    pitfalls: ["Framing as systematic review (claiming synthesis of effects)."],
    appliesTo: ["scoping review", "scoping"],
  },
  {
    id: "syn.umbrella",
    category: "synthesis",
    name: "Umbrella review / overview of reviews",
    shortLabel: "Umbrella review",
    primaryGuideline: {
      acronym: "PRIOR",
      fullName: "Preferred Reporting Items for Overviews of Reviews",
      year: "2022",
      officialUrl: "https://www.equator-network.org/reporting-guidelines/prior-statement/",
    },
    whenToUseChecklist: [
      "Unit of inclusion is a systematic review, not a primary study.",
      "Risk of bias assessed using AMSTAR-2 or ROBIS.",
    ],
    manuscriptSections: ALL_SECTIONS,
    reportingChecklist: PRISMA_2020,
    supportingDocuments: [PRISMA_FLOW],
    commonExtensions: [],
    pitfalls: ["Overlap of primary studies across reviews not addressed."],
    appliesTo: ["umbrella review", "overview of reviews"],
  },

  /* ---------- 4. PROTOCOLS ---------- */
  {
    id: "proto.trial",
    category: "protocol",
    name: "Clinical trial protocol",
    shortLabel: "Trial protocol (SPIRIT)",
    primaryGuideline: {
      acronym: "SPIRIT 2025",
      fullName: "SPIRIT 2025: Standard Protocol Items — Recommendations for Interventional Trials (updated guideline for protocols of randomised trials)",
      year: "2025",
      officialUrl: "https://www.equator-network.org/reporting-guidelines/spirit-2013-statement-defining-standard-protocol-items-for-clinical-trials/",
      citation: "Chan AW, et al. SPIRIT 2025 statement: updated guideline for protocols of randomised trials. BMJ. 2025;389:e081477.",
    },
    legacyGuidelines: [
      {
        acronym: "SPIRIT 2013",
        fullName: "SPIRIT 2013 statement (superseded by SPIRIT 2025)",
        year: "2013",
        officialUrl: "https://www.equator-network.org/reporting-guidelines/spirit-2013-statement-defining-standard-protocol-items-for-clinical-trials/",
        deprecated: true,
      },
    ],
    whenToUseChecklist: [
      "Document describes the planned conduct of a randomised trial.",
      "Trial has not yet completed enrolment or analysis.",
    ],
    manuscriptSections: PROTOCOL_SECTIONS,
    reportingChecklist: {
      title: ["Identify the document as a randomised trial protocol."],
      abstract: ["Provide a structured abstract per the SPIRIT 2025 recommendations."],
      introduction: ["Provide background, rationale, and pre-specified objectives/hypotheses."],
      methods: [
        "Describe trial design (allocation ratio, framework).",
        "Specify study setting, eligibility criteria, interventions.",
        "Pre-specify outcomes and the statistical analysis plan.",
        "Describe randomization, allocation concealment, blinding.",
        "Plan for sample-size justification, recruitment, statistical methods, data management.",
        "Address harms collection and reporting explicitly (SPIRIT 2025 emphasis).",
        "Describe patient and public involvement in trial design and conduct (new in SPIRIT 2025).",
        "Include an open-science section: data sharing, code, and document availability (new in SPIRIT 2025).",
        "Describe ethics, consent, confidentiality, and dissemination plans.",
        "State trial registration plan (ClinicalTrials.gov, ISRCTN, etc.).",
      ],
    },
    supportingDocuments: [SPIRIT_CHECKLIST, TRIAL_REGISTRATION, ETHICS_APPROVAL, ICMJE_DISCLOSURE],
    commonExtensions: [
      { acronym: "SPIRIT-AI", fullName: "AI intervention protocol", whenToUse: "If the intervention involves an AI/ML algorithm." },
      { acronym: "SPIRIT-PRO", fullName: "PRO extension", whenToUse: "If a PRO is a primary outcome." },
      { acronym: "SPIRIT-DCT", fullName: "Decentralized trial extension (2026)", whenToUse: "If procedures occur remotely." },
    ],
    pitfalls: ["Vague analysis plan.", "Missing data plan absent."],
    appliesTo: ["protocol", "spirit", "trial protocol"],
  },
  {
    id: "proto.sr",
    category: "protocol",
    name: "Systematic review protocol",
    shortLabel: "SR protocol (PRISMA-P)",
    primaryGuideline: {
      acronym: "PRISMA-P 2015",
      fullName: "Preferred Reporting Items for Systematic review and Meta-Analysis Protocols",
      year: "2015 (2025 update emerging)",
      officialUrl: "https://www.equator-network.org/reporting-guidelines/prisma-protocols/",
    },
    whenToUseChecklist: [
      "Document is the planned methodology for a systematic review.",
      "Will be registered on PROSPERO or equivalent before screening begins.",
    ],
    manuscriptSections: PROTOCOL_SECTIONS,
    reportingChecklist: {
      title: ["Identify the document as a systematic review or meta-analysis protocol."],
      introduction: ["State rationale and objectives in a structured (e.g., PICO) format."],
      methods: [
        "Describe eligibility criteria, information sources, draft search strategy.",
        "Describe planned study selection, data extraction, risk-of-bias, and synthesis methods.",
        "State plan for registration (PROSPERO).",
      ],
    },
    supportingDocuments: [PRISMA_P_CHECKLIST, PROSPERO_REGISTRATION],
    commonExtensions: [],
    pitfalls: ["No risk-of-bias plan.", "No certainty-of-evidence (GRADE) plan."],
    appliesTo: ["sr protocol", "prisma-p", "systematic review protocol"],
  },

  /* ---------- 5. DIAGNOSTIC / PROGNOSTIC / PREDICTION ---------- */
  {
    id: "dx.stard",
    category: "diagnostic_prognostic_prediction",
    name: "Diagnostic accuracy study",
    shortLabel: "Diagnostic accuracy",
    primaryGuideline: {
      acronym: "STARD 2015",
      fullName: "Standards for Reporting Diagnostic accuracy studies",
      year: "2015",
      officialUrl: "https://www.equator-network.org/reporting-guidelines/stard/",
    },
    whenToUseChecklist: [
      "Comparing an index test against a reference standard.",
      "Sensitivity, specificity, predictive values, or AUC computed.",
    ],
    manuscriptSections: ALL_SECTIONS,
    reportingChecklist: STARD_2015,
    supportingDocuments: [STARD_FLOW, ETHICS_APPROVAL, ICMJE_DISCLOSURE],
    commonExtensions: [{ acronym: "CLAIM 2024", fullName: "Imaging AI", whenToUse: "If the index test is an imaging AI/ML algorithm." }],
    pitfalls: ["Verification bias.", "Spectrum bias from non-representative samples."],
    appliesTo: ["diagnostic accuracy", "sensitivity", "specificity", "stard"],
  },
  {
    id: "dx.tripod-ai",
    category: "diagnostic_prognostic_prediction",
    name: "Prediction-model study (development / validation)",
    shortLabel: "Prediction model (TRIPOD+AI)",
    primaryGuideline: {
      acronym: "TRIPOD+AI",
      fullName: "TRIPOD+AI statement (2024)",
      year: "2024",
      officialUrl: "https://www.equator-network.org/reporting-guidelines/tripod-statement/",
      citation:
        "Collins GS, et al. TRIPOD+AI statement: updated guidance for reporting clinical prediction models that use regression or machine learning methods. BMJ. 2024;385:e078378.",
    },
    legacyGuidelines: [
      {
        acronym: "TRIPOD 2015",
        fullName: "TRIPOD 2015 Statement",
        year: "2015",
        officialUrl: "https://www.equator-network.org/reporting-guidelines/tripod-statement/",
        deprecated: true,
        successorAcronym: "TRIPOD+AI",
      },
    ],
    whenToUseChecklist: [
      "Multivariable prediction model developed and/or validated.",
      "Outcome is diagnostic or prognostic.",
      "Includes regression OR machine-learning approach.",
    ],
    manuscriptSections: ALL_SECTIONS,
    reportingChecklist: TRIPOD_AI,
    supportingDocuments: [ETHICS_APPROVAL, DATA_SHARING_STATEMENT, ICMJE_DISCLOSURE],
    commonExtensions: [
      { acronym: "TRIPOD-CODE", fullName: "Code repositories (2025)", whenToUse: "When code is provided." },
      { acronym: "CLAIM 2024", fullName: "Medical imaging AI", whenToUse: "If model uses medical imaging." },
    ],
    pitfalls: [
      "No external validation.",
      "Calibration not reported.",
      "Optimistic in-sample performance not corrected for optimism.",
      "Class-imbalance and fairness not assessed.",
    ],
    appliesTo: ["prediction", "prognosis", "risk score", "machine learning", "tripod"],
  },
  {
    id: "dx.tripod-llm",
    category: "diagnostic_prognostic_prediction",
    name: "LLM-based prediction / clinical NLP study",
    shortLabel: "TRIPOD-LLM",
    primaryGuideline: {
      acronym: "TRIPOD-LLM",
      fullName: "TRIPOD-LLM reporting guideline for studies using large language models",
      year: "2024",
      officialUrl: "https://www.nature.com/articles/s41591-024-03425-5",
    },
    whenToUseChecklist: [
      "Study uses a large language model for clinical prediction, generation, or decision support.",
      "Reports prompt engineering, evaluation set, and human review.",
    ],
    manuscriptSections: ALL_SECTIONS,
    reportingChecklist: TRIPOD_AI,
    supportingDocuments: [ETHICS_APPROVAL, DATA_SHARING_STATEMENT],
    commonExtensions: [],
    pitfalls: ["No prompt/version tracking.", "Hallucination risk not addressed."],
    appliesTo: ["llm", "large language model", "chatgpt", "nlp"],
  },
  {
    id: "dx.claim",
    category: "diagnostic_prognostic_prediction",
    name: "Medical-imaging AI study",
    shortLabel: "Imaging AI (CLAIM 2024)",
    primaryGuideline: {
      acronym: "CLAIM 2024",
      fullName: "Checklist for Artificial Intelligence in Medical Imaging — 2024 update",
      year: "2024",
      officialUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11304031/",
    },
    whenToUseChecklist: [
      "Study develops or evaluates an AI algorithm for medical imaging.",
      "Imaging modality, model architecture, and dataset described.",
    ],
    manuscriptSections: ALL_SECTIONS,
    reportingChecklist: TRIPOD_AI,
    supportingDocuments: [ETHICS_APPROVAL, DATA_SHARING_STATEMENT],
    commonExtensions: [{ acronym: "TRIPOD+AI", fullName: "Prediction-model umbrella", whenToUse: "Apply with CLAIM." }],
    pitfalls: ["Data leakage between train and test.", "No external validation site."],
    appliesTo: ["radiology ai", "imaging ai", "claim"],
  },
  {
    id: "dx.decide-ai",
    category: "diagnostic_prognostic_prediction",
    name: "Early clinical evaluation of AI decision-support",
    shortLabel: "DECIDE-AI",
    primaryGuideline: {
      acronym: "DECIDE-AI",
      fullName: "Developmental and Exploratory Clinical Investigation of Decision-support systems driven by AI",
      year: "2022",
      officialUrl: "https://www.equator-network.org/reporting-guidelines/decide-ai/",
    },
    whenToUseChecklist: [
      "Early-stage clinical evaluation of an AI decision-support tool.",
      "Pre-RCT phase — small-scale, exploratory.",
    ],
    manuscriptSections: ALL_SECTIONS,
    reportingChecklist: TRIPOD_AI,
    supportingDocuments: [ETHICS_APPROVAL, ICMJE_DISCLOSURE],
    commonExtensions: [],
    pitfalls: ["No human-in-the-loop reporting.", "Workflow integration not described."],
    appliesTo: ["decide-ai", "early ai evaluation"],
  },

  /* ---------- 6. CASE REPORTS ---------- */
  {
    id: "case.care",
    category: "case_reports",
    name: "Medical case report",
    shortLabel: "Case report (CARE)",
    primaryGuideline: {
      acronym: "CARE",
      fullName: "CARE guideline for case reports",
      year: "2013 (updated)",
      officialUrl: "https://www.equator-network.org/reporting-guidelines/care/",
    },
    whenToUseChecklist: [
      "One or a small number of patients.",
      "Novel diagnosis, treatment, complication, or teaching value.",
      "Written informed consent for publication obtained.",
    ],
    manuscriptSections: ALL_SECTIONS,
    reportingChecklist: CARE,
    supportingDocuments: [INFORMED_CONSENT, ETHICS_APPROVAL, ICMJE_DISCLOSURE],
    commonExtensions: [],
    pitfalls: ["No patient consent.", "Over-generalisation from one case."],
    appliesTo: ["case report", "case study"],
  },
  {
    id: "case.scare",
    category: "case_reports",
    name: "Surgical case report",
    shortLabel: "Surgical case (SCARE)",
    primaryGuideline: {
      acronym: "SCARE 2023",
      fullName: "Surgical CAse REport guideline",
      year: "2023",
      officialUrl: "https://www.equator-network.org/reporting-guidelines/scare/",
    },
    whenToUseChecklist: [
      "Single surgical case (often rare or novel technique).",
      "Imaging, intra-operative findings, and follow-up documented.",
    ],
    manuscriptSections: ALL_SECTIONS,
    reportingChecklist: CARE,
    supportingDocuments: [INFORMED_CONSENT, ETHICS_APPROVAL],
    commonExtensions: [],
    pitfalls: [],
    appliesTo: ["surgical case report", "scare"],
  },
  {
    id: "case.process",
    category: "case_reports",
    name: "Surgical case series",
    shortLabel: "Case series (PROCESS)",
    primaryGuideline: {
      acronym: "PROCESS 2023",
      fullName: "PROCESS — case-series reporting in surgery",
      year: "2023",
      officialUrl: "https://www.equator-network.org/reporting-guidelines/process/",
    },
    whenToUseChecklist: [
      "Consecutive series of surgical patients.",
      "Outcomes reported with follow-up.",
    ],
    manuscriptSections: ALL_SECTIONS,
    reportingChecklist: CARE,
    supportingDocuments: [INFORMED_CONSENT, ETHICS_APPROVAL],
    commonExtensions: [],
    pitfalls: ["Selection bias from cherry-picked cases."],
    appliesTo: ["case series", "process"],
  },

  /* ---------- 7. GUIDELINES / CONSENSUS ---------- */
  {
    id: "guide.right",
    category: "guidelines_consensus",
    name: "Clinical practice guideline",
    shortLabel: "Clinical guideline (RIGHT)",
    primaryGuideline: {
      acronym: "RIGHT 2017",
      fullName: "Reporting Items for Practice Guidelines in Healthcare",
      year: "2017",
      officialUrl: "https://www.equator-network.org/reporting-guidelines/right-statement/",
    },
    whenToUseChecklist: [
      "Document provides recommendations for clinical practice.",
      "Recommendations linked to evidence reviews and panel deliberations.",
    ],
    manuscriptSections: ALL_SECTIONS,
    reportingChecklist: AGREE_RIGHT,
    supportingDocuments: [ICMJE_DISCLOSURE],
    commonExtensions: [{ acronym: "AGREE-II", fullName: "Quality appraisal tool", whenToUse: "Useful for self-assessment." }],
    pitfalls: ["No GRADE evidence grading.", "Conflicts of interest not managed."],
    appliesTo: ["guideline", "practice guideline", "right"],
  },
  {
    id: "guide.accord",
    category: "guidelines_consensus",
    name: "Consensus / Delphi study",
    shortLabel: "Consensus (ACCORD)",
    primaryGuideline: {
      acronym: "ACCORD 2024",
      fullName: "ACcurate COnsensus Reporting Document",
      year: "2024",
      officialUrl: "https://www.equator-network.org/reporting-guidelines/accord/",
    },
    whenToUseChecklist: [
      "Formal consensus method (Delphi, nominal group, RAND/UCLA).",
      "Pre-specified consensus threshold.",
    ],
    manuscriptSections: ALL_SECTIONS,
    reportingChecklist: AGREE_RIGHT,
    supportingDocuments: [ICMJE_DISCLOSURE],
    commonExtensions: [],
    pitfalls: ["Panel selection not transparent.", "Consensus threshold not pre-specified."],
    appliesTo: ["delphi", "consensus", "nominal group", "accord"],
  },

  /* ---------- 8. QUALITATIVE & MIXED METHODS ---------- */
  {
    id: "qual.srqr",
    category: "qualitative_mixed",
    name: "Qualitative research (general)",
    shortLabel: "Qualitative (SRQR)",
    primaryGuideline: {
      acronym: "SRQR",
      fullName: "Standards for Reporting Qualitative Research",
      year: "2014",
      officialUrl: "https://www.equator-network.org/reporting-guidelines/srqr/",
    },
    whenToUseChecklist: [
      "Inductive/interpretive analysis of textual/observational data.",
      "Sampling and saturation/information-power addressed.",
    ],
    manuscriptSections: ALL_SECTIONS,
    reportingChecklist: SRQR,
    supportingDocuments: [INFORMED_CONSENT, ETHICS_APPROVAL],
    commonExtensions: [{ acronym: "COREQ", fullName: "Interview / focus group", whenToUse: "If interviews/focus groups used." }],
    pitfalls: ["Quantifying themes inappropriately.", "Reflexivity not addressed."],
    appliesTo: ["qualitative", "srqr", "interpretive"],
  },
  {
    id: "qual.coreq",
    category: "qualitative_mixed",
    name: "Qualitative interviews / focus groups",
    shortLabel: "Interviews (COREQ)",
    primaryGuideline: {
      acronym: "COREQ",
      fullName: "Consolidated criteria for reporting qualitative research",
      year: "2007",
      officialUrl: "https://www.equator-network.org/reporting-guidelines/coreq/",
    },
    whenToUseChecklist: [
      "Data generated through interviews or focus groups.",
      "Interview guide and analysis approach described.",
    ],
    manuscriptSections: ALL_SECTIONS,
    reportingChecklist: SRQR,
    supportingDocuments: [INFORMED_CONSENT, ETHICS_APPROVAL],
    commonExtensions: [],
    pitfalls: ["No interview guide provided.", "Analyst characteristics not stated."],
    appliesTo: ["interviews", "focus groups", "coreq"],
  },
  {
    id: "qual.entreq",
    category: "qualitative_mixed",
    name: "Qualitative evidence synthesis",
    shortLabel: "Qual synthesis (ENTREQ)",
    primaryGuideline: {
      acronym: "ENTREQ",
      fullName: "Enhancing transparency in reporting the synthesis of qualitative research",
      year: "2012",
      officialUrl: "https://www.equator-network.org/reporting-guidelines/entreq/",
    },
    whenToUseChecklist: [
      "Systematic synthesis of qualitative studies (meta-ethnography, thematic synthesis, etc.).",
    ],
    manuscriptSections: ALL_SECTIONS,
    reportingChecklist: PRISMA_2020,
    supportingDocuments: [PROSPERO_REGISTRATION],
    commonExtensions: [],
    pitfalls: [],
    appliesTo: ["qualitative synthesis", "entreq", "meta-ethnography"],
  },
  {
    id: "qual.gramms",
    category: "qualitative_mixed",
    name: "Mixed-methods research",
    shortLabel: "Mixed-methods (GRAMMS)",
    primaryGuideline: {
      acronym: "GRAMMS",
      fullName: "Good Reporting of A Mixed Methods Study",
      year: "2008",
      officialUrl: "https://www.equator-network.org/?post_type=eq_guidelines&eq_guidelines_study_design=mixed-methods-studies",
    },
    whenToUseChecklist: [
      "Both quantitative and qualitative strands integrated.",
      "Integration approach (convergent / sequential / explanatory / exploratory) stated.",
    ],
    manuscriptSections: ALL_SECTIONS,
    reportingChecklist: SRQR,
    supportingDocuments: [INFORMED_CONSENT, ETHICS_APPROVAL],
    commonExtensions: [],
    pitfalls: ["Reporting strands separately with no integration."],
    appliesTo: ["mixed methods", "gramms"],
  },

  /* ---------- 9. PRECLINICAL ---------- */
  {
    id: "preclin.arrive",
    category: "preclinical",
    name: "In vivo animal study",
    shortLabel: "Animal (ARRIVE 2.0)",
    primaryGuideline: {
      acronym: "ARRIVE 2.0",
      fullName: "Animal Research: Reporting of In Vivo Experiments",
      year: "2020",
      officialUrl: "https://www.equator-network.org/reporting-guidelines/improving-bioscience-research-reporting-the-arrive-guidelines-for-reporting-animal-research/",
    },
    whenToUseChecklist: [
      "Study uses live vertebrate animals.",
      "Ethics approval from an animal-welfare body.",
      "3Rs (Replacement, Reduction, Refinement) considered.",
    ],
    manuscriptSections: ALL_SECTIONS,
    reportingChecklist: ARRIVE,
    supportingDocuments: [ETHICS_APPROVAL, ICMJE_DISCLOSURE],
    commonExtensions: [],
    pitfalls: ["No sample-size justification.", "Randomization / blinding not reported."],
    appliesTo: ["animal", "in vivo", "preclinical", "arrive"],
  },
  {
    id: "preclin.miqe",
    category: "preclinical",
    name: "qPCR / molecular study",
    shortLabel: "qPCR (MIQE)",
    primaryGuideline: {
      acronym: "MIQE",
      fullName: "Minimum Information for Publication of Quantitative real-time PCR Experiments",
      year: "2009",
      officialUrl: "https://www.equator-network.org/reporting-guidelines/miqe-guidelines-minimum-information-for-publication-of-quantitative-real-time-pcr-experiments/",
    },
    whenToUseChecklist: ["Uses qPCR for quantification.", "Reference gene normalization described."],
    manuscriptSections: ALL_SECTIONS,
    reportingChecklist: ARRIVE,
    supportingDocuments: [],
    commonExtensions: [],
    pitfalls: ["No primer sequences.", "Single reference gene without validation."],
    appliesTo: ["qpcr", "rt-pcr", "miqe"],
  },

  /* ---------- 10. QUALITY & IMPLEMENTATION ---------- */
  {
    id: "qi.squire",
    category: "quality_implementation",
    name: "Quality-improvement project",
    shortLabel: "QI project (SQUIRE)",
    primaryGuideline: {
      acronym: "SQUIRE 2.0",
      fullName: "Standards for QUality Improvement Reporting Excellence",
      year: "2015",
      officialUrl: "https://www.equator-network.org/reporting-guidelines/squire/",
    },
    whenToUseChecklist: [
      "Local change effort to improve healthcare delivery.",
      "Iterative PDSA cycles or similar improvement methodology.",
    ],
    manuscriptSections: ALL_SECTIONS,
    reportingChecklist: SQUIRE,
    supportingDocuments: [ETHICS_APPROVAL, ICMJE_DISCLOSURE],
    commonExtensions: [
      { acronym: "SQUIRE-EDU", fullName: "Education", whenToUse: "For educational QI." },
      { acronym: "TIDieR", fullName: "Intervention description", whenToUse: "Recommended." },
    ],
    pitfalls: ["No run charts.", "Causal claims overstated."],
    appliesTo: ["quality improvement", "qi", "squire", "pdsa"],
  },
  {
    id: "qi.stari",
    category: "quality_implementation",
    name: "Implementation study",
    shortLabel: "Implementation (StaRI)",
    primaryGuideline: {
      acronym: "StaRI",
      fullName: "Standards for Reporting Implementation Studies",
      year: "2017",
      officialUrl: "https://www.equator-network.org/reporting-guidelines/stari-statement/",
    },
    whenToUseChecklist: [
      "Evaluates strategies to embed an evidence-based intervention in practice.",
      "Reports both the implementation strategy and the intervention.",
    ],
    manuscriptSections: ALL_SECTIONS,
    reportingChecklist: SQUIRE,
    supportingDocuments: [ETHICS_APPROVAL],
    commonExtensions: [],
    pitfalls: ["Conflating intervention with implementation strategy."],
    appliesTo: ["implementation", "stari"],
  },

  /* ---------- 11. ECONOMIC ---------- */
  {
    id: "econ.cheers",
    category: "economic",
    name: "Economic evaluation",
    shortLabel: "Economic eval (CHEERS)",
    primaryGuideline: {
      acronym: "CHEERS 2022",
      fullName: "Consolidated Health Economic Evaluation Reporting Standards",
      year: "2022",
      officialUrl: "https://www.equator-network.org/reporting-guidelines/cheers/",
    },
    whenToUseChecklist: [
      "Evaluates costs and outcomes of two or more interventions.",
      "Perspective, time horizon, and discount rate pre-specified.",
    ],
    manuscriptSections: ALL_SECTIONS,
    reportingChecklist: CHEERS,
    supportingDocuments: [ICMJE_DISCLOSURE],
    commonExtensions: [],
    pitfalls: ["No probabilistic sensitivity analysis.", "Outdated cost data without inflation adjustment."],
    appliesTo: ["cost-effectiveness", "cea", "cua", "cheers", "economic evaluation"],
  },
  {
    id: "econ.bia",
    category: "economic",
    name: "Budget-impact analysis",
    shortLabel: "Budget impact",
    primaryGuideline: {
      acronym: "ISPOR BIA",
      fullName: "ISPOR Budget Impact Analysis Good Practice",
      year: "2014",
      officialUrl: "https://www.ispor.org/heor-resources/good-practices/article/budget-impact-analysis-principles-of-good-practice-report",
    },
    whenToUseChecklist: [
      "Estimates affordability of an intervention from a payer perspective.",
      "Short-term horizon (typically 3-5 years).",
    ],
    manuscriptSections: ALL_SECTIONS,
    reportingChecklist: CHEERS,
    supportingDocuments: [],
    commonExtensions: [],
    pitfalls: ["Confusing budget impact with cost-effectiveness."],
    appliesTo: ["budget impact", "affordability", "bia"],
  },

  /* ---------- 12. GENETICS / -OMICS ---------- */
  {
    id: "omics.strega",
    category: "genetics_omics",
    name: "Genetic-association study",
    shortLabel: "Genetic association (STREGA)",
    primaryGuideline: {
      acronym: "STREGA",
      fullName: "STrengthening the REporting of Genetic Association studies",
      year: "2009",
      officialUrl: "https://www.equator-network.org/reporting-guidelines/strega/",
    },
    whenToUseChecklist: [
      "Association between genetic variants and a phenotype.",
      "Hardy-Weinberg equilibrium and population stratification considered.",
    ],
    manuscriptSections: ALL_SECTIONS,
    reportingChecklist: STROBE_BASE,
    supportingDocuments: [ETHICS_APPROVAL, DATA_SHARING_STATEMENT],
    commonExtensions: [],
    pitfalls: ["No multiple-testing correction."],
    appliesTo: ["gwas", "snp", "genetic association", "strega"],
  },

  /* ---------- CUSTOM / OTHER ---------- */
  {
    id: "custom",
    category: "interventional",
    name: "Other / custom (manual selection)",
    shortLabel: "Other / custom",
    primaryGuideline: {
      acronym: "EQUATOR (search)",
      fullName: "EQUATOR Network — search for the appropriate guideline",
      year: "—",
      officialUrl: "https://www.equator-network.org/reporting-guidelines/",
    },
    whenToUseChecklist: ["No specific EQUATOR guideline fits the study design."],
    manuscriptSections: ALL_SECTIONS,
    reportingChecklist: {
      methods: ["Describe methods completely enough for replication."],
      results: ["Report results aligned with pre-specified objectives."],
      discussion: ["Interpret results without overstating beyond the design's capability."],
    },
    supportingDocuments: [ICMJE_DISCLOSURE],
    commonExtensions: [],
    pitfalls: [],
    appliesTo: ["custom", "other"],
  },
];

/* ============================================================
   Convenience lookups
   ============================================================ */

export const designById = (id: string) => designs.find((d) => d.id === id);

export const designCategories: { id: import("../types").DesignCategory; label: string; emoji: string }[] = [
  { id: "interventional", label: "Interventional trials", emoji: "💊" },
  { id: "observational", label: "Observational studies", emoji: "🔭" },
  { id: "synthesis", label: "Evidence synthesis / reviews", emoji: "📚" },
  { id: "protocol", label: "Study protocols", emoji: "📝" },
  { id: "diagnostic_prognostic_prediction", label: "Diagnostic · Prognostic · Prediction", emoji: "🎯" },
  { id: "case_reports", label: "Case reports & series", emoji: "🩺" },
  { id: "guidelines_consensus", label: "Guidelines & consensus", emoji: "📜" },
  { id: "qualitative_mixed", label: "Qualitative & mixed methods", emoji: "🗣" },
  { id: "preclinical", label: "Preclinical / animal", emoji: "🧬" },
  { id: "quality_implementation", label: "Quality improvement & implementation", emoji: "🛠" },
  { id: "economic", label: "Economic evaluations", emoji: "💰" },
  { id: "genetics_omics", label: "Genetics / -omics", emoji: "🧪" },
];

export function designsByCategory(cat: import("../types").DesignCategory) {
  return designs.filter((d) => d.category === cat);
}
