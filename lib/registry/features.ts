import type { FeatureCategory, FeatureSpec } from "../types";

/* ============================================================
   Feature catalog.
   Each feature attaches: extensions, checklist additions,
   supporting documents, and "agent hints" — prompt fragments
   we inject into every downstream LLM call so the assistant
   knows the specific reporting expectations.
   ============================================================ */

export const features: FeatureSpec[] = [
  /* ============ AI / ML ============ */
  {
    id: "ai.tripod-ai",
    category: "ai_ml",
    name: "Prediction model uses ML or regression (TRIPOD+AI)",
    description: "Apply TRIPOD+AI 2024 — supersedes TRIPOD 2015. Covers both regression and ML.",
    addExtensions: [
      {
        acronym: "TRIPOD+AI",
        fullName: "TRIPOD+AI statement (2024)",
        whenToUse: "Any prediction model — regression or ML.",
        officialUrl: "https://www.equator-network.org/reporting-guidelines/tripod-statement/",
      },
    ],
    agentHints: [
      "Apply TRIPOD+AI 2024 (27-item) reporting requirements. Distinguish development vs validation cohort. Report calibration AND discrimination with 95% CI. Address class imbalance and fairness across subgroups. Code repository link (TRIPOD-CODE) recommended.",
    ],
    recommendedFor: ["dx.tripod-ai", "dx.claim", "dx.tripod-llm"],
  },
  {
    id: "ai.consort-ai",
    category: "ai_ml",
    name: "Clinical trial of an AI intervention (CONSORT-AI)",
    description: "Trial evaluates an AI/ML algorithm as an intervention.",
    addExtensions: [
      {
        acronym: "CONSORT-AI",
        fullName: "CONSORT-AI extension (2020)",
        whenToUse: "RCT where the intervention is an AI tool.",
        officialUrl: "https://www.equator-network.org/reporting-guidelines/consort-ai/",
      },
      { acronym: "SPIRIT-AI", fullName: "SPIRIT-AI protocol", whenToUse: "AI-intervention trial protocols." },
    ],
    agentHints: [
      "Apply CONSORT-AI: describe AI version, training data, integration into workflow, human oversight, failure modes, performance drift, and equity considerations.",
    ],
    recommendedFor: ["interv.rct.parallel", "interv.rct.ai"],
  },
  {
    id: "ai.decide-ai",
    category: "ai_ml",
    name: "Early-stage clinical evaluation of AI decision-support (DECIDE-AI)",
    description: "Pre-RCT, exploratory, small-scale evaluation of an AI clinical tool.",
    addExtensions: [
      { acronym: "DECIDE-AI", fullName: "DECIDE-AI 2022", whenToUse: "Early-stage AI clinical evaluation.", officialUrl: "https://www.equator-network.org/reporting-guidelines/decide-ai/" },
    ],
    agentHints: [
      "Apply DECIDE-AI: describe human-AI interaction, workflow integration, ergonomics, learning curve, and unintended consequences.",
    ],
  },
  {
    id: "ai.claim-imaging",
    category: "ai_ml",
    name: "AI in medical imaging (CLAIM 2024)",
    description: "Apply CLAIM 2024 update for imaging-specific AI reporting.",
    addExtensions: [
      { acronym: "CLAIM 2024", fullName: "Checklist for AI in Medical Imaging (2024)", whenToUse: "Imaging AI studies.", officialUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11304031/" },
    ],
    agentHints: [
      "Apply CLAIM 2024: imaging modality, ground-truth definition, train/test split integrity (no data leakage), external validation site, model architecture, augmentation, computational requirements.",
    ],
    recommendedFor: ["dx.claim"],
  },
  {
    id: "ai.tripod-llm",
    category: "ai_ml",
    name: "Large language model used (TRIPOD-LLM)",
    description: "Apply TRIPOD-LLM for studies using LLMs in prediction, generation, or decision support.",
    addExtensions: [
      { acronym: "TRIPOD-LLM", fullName: "TRIPOD-LLM (Nat Med 2024)", whenToUse: "Any study using an LLM.", officialUrl: "https://www.nature.com/articles/s41591-024-03425-5" },
    ],
    agentHints: [
      "Apply TRIPOD-LLM: report model version/date, prompts used (verbatim or templated), temperature, seed, evaluation set construction, human review process, hallucination handling, and refusal rates.",
    ],
  },
  {
    id: "ai.bridge-ai",
    category: "ai_ml",
    name: "AI in digital health (BRIDGE-AI, forthcoming)",
    description: "Apply BRIDGE-AI reporting guideline for AI in digital health (under development, 2026).",
    addExtensions: [
      { acronym: "BRIDGE-AI", fullName: "BRIDGE-AI (under development, 2026)", whenToUse: "AI in digital health products.", officialUrl: "https://www.equator-network.org/library/reporting-guidelines-under-development/reporting-guidelines-under-development-for-other-study-designs/" },
    ],
    agentHints: ["Apply BRIDGE-AI principles: clinical integration, equity, monitoring, post-deployment surveillance."],
  },

  /* ============ POPULATION & EQUITY ============ */
  {
    id: "equity.pediatric",
    category: "population_equity",
    name: "Pediatric population",
    description: "Children / adolescents as study population.",
    agentHints: [
      "Apply pediatric-specific reporting: age stratification, developmental stage, assent + parental consent, weight-/BSA-based dosing, child-friendly outcome measures.",
      "If interventional, consider CONSORT-Pediatric extensions where applicable.",
    ],
  },
  {
    id: "equity.geriatric",
    category: "population_equity",
    name: "Geriatric population",
    description: "Older adults — frailty, comorbidity, polypharmacy.",
    agentHints: [
      "Report frailty assessment, cognitive screening, comorbidity index, and competing risks. Consider geriatric-specific endpoints (function, falls, delirium, ADLs).",
    ],
  },
  {
    id: "equity.pregnancy",
    category: "population_equity",
    name: "Pregnancy / perinatal",
    description: "Pregnant participants or perinatal outcomes.",
    agentHints: [
      "Report gestational age, maternal-fetal outcomes separately, ethics around pregnancy research, and exclusion rationale if applicable.",
    ],
  },
  {
    id: "equity.lmic",
    category: "population_equity",
    name: "Low- or middle-income country setting",
    description: "Study conducted in LMICs.",
    agentHints: [
      "Report local context, healthcare-system constraints, implementation feasibility, and equity considerations. Reflect on generalisability beyond high-income settings.",
    ],
  },
  {
    id: "equity.progress-plus",
    category: "population_equity",
    name: "Equity-focused analysis (PROGRESS-Plus)",
    description: "Examines outcomes across equity dimensions (place, race, occupation, gender, religion, education, SES, social capital, plus age/disability/other).",
    addExtensions: [
      { acronym: "STROBE-equity", fullName: "STROBE extension for equity", whenToUse: "Observational equity-focused.", officialUrl: "https://www.equator-network.org/reporting-guidelines/strobe/" },
      { acronym: "CONSORT-Equity", fullName: "CONSORT equity extension", whenToUse: "RCT with equity focus." },
    ],
    agentHints: [
      "Apply the PROGRESS-Plus framework. Report disaggregated effects across equity strata and any equity-relevant analyses (e.g., interaction tests, equity gap measures).",
    ],
  },
  {
    id: "equity.sager",
    category: "population_equity",
    name: "Sex/gender analysis (SAGER)",
    description: "Sex and gender equity in research reporting.",
    agentHints: [
      "Report sex disaggregation in methods, results, and discussion. Distinguish sex (biological) from gender (social).",
    ],
  },
  {
    id: "equity.indigenous",
    category: "population_equity",
    name: "Indigenous populations (CONSIDER)",
    description: "Research with Indigenous communities.",
    agentHints: [
      "Apply CONSIDER framework: governance, prioritization, relationships, methodology, participation, capacity, analysis, dissemination.",
    ],
  },

  /* ============ SPECIALTY ============ */
  {
    id: "specialty.oncology",
    category: "specialty",
    name: "Oncology",
    description: "Cancer research — adopt oncology-specific endpoints and conventions.",
    agentHints: [
      "Use standard oncology endpoints: PFS, OS, ORR, DCR, DOR. Apply RECIST 1.1 (solid tumors) / iRECIST for immunotherapy / Lugano for lymphoma. Report stage (AJCC/UICC), histology, biomarkers.",
    ],
  },
  {
    id: "specialty.cardiology",
    category: "specialty",
    name: "Cardiology",
    description: "Cardiovascular research conventions.",
    agentHints: [
      "Use standard CV endpoints (MACE, MI, stroke, CV death, HF hospitalisation). Report risk classifications (NYHA, KCCQ for HF).",
    ],
  },
  {
    id: "specialty.surgery",
    category: "specialty",
    name: "Surgery (IDEAL framework)",
    description: "Surgical research and innovation.",
    addExtensions: [
      { acronym: "IDEAL", fullName: "Idea, Development, Exploration, Assessment, Long-term study framework", whenToUse: "Surgical innovation.", officialUrl: "https://www.ideal-collaboration.net/" },
    ],
    agentHints: [
      "Map study to IDEAL stage (1-5). Report Clavien-Dindo complication grading, surgeon experience/volume, learning-curve effects.",
    ],
  },
  {
    id: "specialty.mental-health",
    category: "specialty",
    name: "Mental health",
    description: "Psychiatry / psychology research conventions.",
    agentHints: [
      "Use standardised measures (PHQ-9, GAD-7, HAM-D, MADRS, BDI, Y-BOCS, etc.). Report DSM-5 / ICD-11 criteria. Address suicidality reporting.",
    ],
  },
  {
    id: "specialty.infectious",
    category: "specialty",
    name: "Infectious disease (STROME-ID for molecular epi)",
    description: "Infectious disease research conventions.",
    addExtensions: [
      { acronym: "STROME-ID", fullName: "STROBE extension for molecular epidemiology of infectious diseases", whenToUse: "Molecular epi of infectious diseases." },
    ],
    agentHints: [
      "Report case definitions, diagnostic confirmation method, source attribution, antimicrobial sensitivity, sequencing methods if applicable.",
    ],
  },
  {
    id: "specialty.critical-care",
    category: "specialty",
    name: "Critical care / ICU",
    description: "Critical-care research conventions.",
    agentHints: [
      "Report severity scores (SOFA, APACHE II), ICU-specific outcomes (ventilator-free days, ICU-LOS, mortality), and standard ICU adverse events.",
    ],
  },
  {
    id: "specialty.rare-disease",
    category: "specialty",
    name: "Rare disease (IRDiRC)",
    description: "Rare disease research with small sample sizes.",
    agentHints: [
      "Apply IRDiRC recommendations. Discuss natural-history alternatives, surrogate endpoints, novel trial designs (basket, umbrella, platform, N-of-1) and registry linkage.",
    ],
  },
  {
    id: "specialty.genetics",
    category: "specialty",
    name: "Genetics / GWAS (STREGA)",
    description: "Genetic association research.",
    addExtensions: [
      { acronym: "STREGA", fullName: "Strengthening the Reporting of Genetic Association studies", whenToUse: "Genetic association studies.", officialUrl: "https://www.equator-network.org/reporting-guidelines/strega/" },
    ],
    agentHints: [
      "Report variant calling pipeline, Hardy-Weinberg, population stratification, multiple-testing correction (e.g., 5×10⁻⁸ genome-wide significance).",
    ],
  },
  {
    id: "specialty.imaging",
    category: "specialty",
    name: "Imaging / radiology",
    description: "Imaging-based research.",
    agentHints: [
      "Report imaging protocol parameters (modality, manufacturer, contrast, sequence/protocol). Report observer-agreement (kappa/ICC) and blinding.",
    ],
  },

  /* ============ METHODS ============ */
  {
    id: "methods.diagnostic-test",
    category: "methods",
    name: "Diagnostic test evaluation (STARD)",
    description: "Diagnostic accuracy reporting.",
    addExtensions: [
      { acronym: "STARD 2015", fullName: "STARD", whenToUse: "Diagnostic accuracy studies.", officialUrl: "https://www.equator-network.org/reporting-guidelines/stard/" },
    ],
    agentHints: ["Apply STARD 2015: index test, reference standard, thresholds, blinding, flow/timing, indeterminate handling."],
  },
  {
    id: "methods.adaptive",
    category: "methods",
    name: "Adaptive design (ACE)",
    description: "Pre-specified adaptive trial design.",
    addExtensions: [
      { acronym: "ACE", fullName: "Adaptive designs CONSORT Extension", whenToUse: "Adaptive trials." },
    ],
    agentHints: ["Apply ACE: pre-specify adaptation rules, type-I error control, bias adjustment."],
  },
  {
    id: "methods.bayesian",
    category: "methods",
    name: "Bayesian methods",
    description: "Bayesian inference used.",
    agentHints: [
      "Report priors (informative or non-informative, source/justification), posterior summary (median, credible intervals), MCMC diagnostics, prior-sensitivity analyses.",
    ],
  },
  {
    id: "methods.target-trial",
    category: "methods",
    name: "Target trial emulation",
    description: "Observational study explicitly emulates a hypothetical RCT.",
    agentHints: [
      "Specify the target trial protocol explicitly (eligibility, treatment strategies, follow-up, outcomes, causal contrast, analysis plan), then describe how each was emulated and where the emulation falls short.",
    ],
    recommendedFor: ["obs.target-trial"],
  },
  {
    id: "methods.mr",
    category: "methods",
    name: "Mendelian randomization (STROBE-MR)",
    description: "Genetic variants as instrumental variables.",
    addExtensions: [
      { acronym: "STROBE-MR", fullName: "STROBE extension for Mendelian Randomization", whenToUse: "MR studies." },
    ],
    agentHints: ["Apply STROBE-MR: F-statistics for instrument strength, MR-Egger / weighted median, sensitivity analyses for pleiotropy."],
  },
  {
    id: "methods.causal-inference",
    category: "methods",
    name: "Causal inference (DAGs, g-methods)",
    description: "Explicit causal framework with DAGs and/or g-methods.",
    agentHints: [
      "Display a DAG when feasible. Report causal estimands (ATE, ATT, controlled direct effects). State identification assumptions (exchangeability, positivity, consistency).",
    ],
  },
  {
    id: "methods.subgroup",
    category: "methods",
    name: "Pre-specified subgroup analyses",
    description: "Effect heterogeneity across subgroups.",
    agentHints: [
      "Pre-specify subgroup analyses with rationale, interaction tests, and adjustment for multiplicity. Avoid claims of efficacy in subgroups based on within-subgroup p-values.",
    ],
  },
  {
    id: "methods.sensitivity",
    category: "methods",
    name: "Sensitivity / robustness analyses",
    description: "Sensitivity analyses across alternate assumptions.",
    agentHints: [
      "Report sensitivity analyses (alternative imputation, alternative model specifications, E-values for unmeasured confounding).",
    ],
  },

  /* ============ INTERVENTION DESCRIPTION ============ */
  {
    id: "intervention.tidier",
    category: "intervention_description",
    name: "TIDieR — full intervention description",
    description: "Template for Intervention Description and Replication.",
    addExtensions: [
      { acronym: "TIDieR", fullName: "TIDieR", whenToUse: "Any study with an intervention.", officialUrl: "https://www.equator-network.org/reporting-guidelines/tidier/" },
    ],
    agentHints: [
      "Apply TIDieR 12 items: brief name; why (rationale); what (materials); what (procedure); who provided; how (mode of delivery); where; when and how much (dose/duration); tailoring; modifications; planned fidelity; actual fidelity.",
    ],
  },
  {
    id: "intervention.credeci",
    category: "intervention_description",
    name: "Complex intervention reporting (CReDECI 2)",
    description: "Criteria for Reporting Development & Evaluation of Complex Interventions.",
    agentHints: [
      "Apply CReDECI 2: development theory, intervention components, dose, fidelity, contextual factors, mechanism of action.",
    ],
  },

  /* ============ PATIENT & PUBLIC ============ */
  {
    id: "pp.gripp2",
    category: "patient_public",
    name: "Patient & public involvement (GRIPP2)",
    description: "PPI reporting standards — required by BMJ, recommended widely.",
    addExtensions: [
      { acronym: "GRIPP2", fullName: "GRIPP2 short/long form", whenToUse: "Any health research involving PPI.", officialUrl: "https://www.equator-network.org/reporting-guidelines/gripp2-reporting-checklists-for-patient-and-public-involvement-in-research/" },
    ],
    agentHints: [
      "Apply GRIPP2: aim of PPI, methods of involvement, study results affected by PPI, discussion of impact, reflections, lessons learned.",
    ],
  },
  {
    id: "pp.pro",
    category: "patient_public",
    name: "Patient-reported outcomes (CONSORT-PRO / ISOQOL)",
    description: "PRO as primary or secondary outcome.",
    addExtensions: [
      { acronym: "CONSORT-PRO", fullName: "CONSORT-PRO extension", whenToUse: "RCT with PRO." },
      { acronym: "ISOQOL", fullName: "ISOQOL standards", whenToUse: "PRO measurement." },
    ],
    agentHints: [
      "Report PRO instrument (name, version, language, validated for population), administration mode, missing-data handling, minimal clinically important difference.",
    ],
  },
  {
    id: "pp.sdm",
    category: "patient_public",
    name: "Shared decision-making",
    description: "Intervention or measurement related to shared decision-making.",
    agentHints: [
      "Describe the decision-aid (if any), SDM measurement tool (e.g., SDM-Q-9, OPTION), and patient and clinician outcomes separately.",
    ],
  },

  /* ============ OPEN SCIENCE ============ */
  {
    id: "open.preregistration",
    category: "open_science",
    name: "Pre-registration (OSF / ClinicalTrials.gov / PROSPERO)",
    description: "Study pre-registered before data collection / analysis.",
    agentHints: [
      "Report registry name, registration number, registration date, and any deviations between registered and final protocol.",
    ],
  },
  {
    id: "open.data-sharing",
    category: "open_science",
    name: "Data sharing (FAIR)",
    description: "Open data and FAIR principles.",
    agentHints: [
      "Specify exactly: what data are shared, when, where (repository + DOI), under which licence, and any restrictions.",
    ],
  },
  {
    id: "open.code",
    category: "open_science",
    name: "Code & analysis-pipeline sharing (TRIPOD-CODE)",
    description: "Code repository linked.",
    addExtensions: [{ acronym: "TRIPOD-CODE", fullName: "TRIPOD-CODE (2025)", whenToUse: "Prediction-model studies with code." }],
    agentHints: [
      "Provide a versioned code repository (DOI via Zenodo). Document environment (language, libraries, seeds). State whether code reproduces the published results.",
    ],
  },
  {
    id: "open.preprint",
    category: "open_science",
    name: "Pre-print posted",
    description: "Pre-print version on medRxiv/bioRxiv/etc.",
    agentHints: [
      "Cite the preprint with DOI and platform. Confirm the target journal allows preprints.",
    ],
  },

  /* ============ HARMS & SAFETY ============ */
  {
    id: "harms.consort-harms",
    category: "harms_safety",
    name: "Harms reporting (CONSORT-Harms)",
    description: "Detailed adverse-event reporting.",
    addExtensions: [
      { acronym: "CONSORT-Harms", fullName: "CONSORT extension for reporting harms", whenToUse: "Trials reporting harms." },
    ],
    agentHints: [
      "Apply CONSORT-Harms: define adverse events, severity grading (CTCAE), collection method, attribution, and balanced presentation of benefits vs harms.",
    ],
  },
  {
    id: "harms.pharmacovigilance",
    category: "harms_safety",
    name: "Pharmacovigilance / drug safety (ICH-E2A)",
    description: "Drug-safety study.",
    agentHints: [
      "Apply ICH-E2A definitions for serious adverse events. Report MedDRA coding and signal detection methods.",
    ],
  },

  /* ============ IMPLEMENTATION / QI ============ */
  {
    id: "impl.stari",
    category: "implementation_qi",
    name: "Implementation strategy (StaRI)",
    description: "Implementation study with strategy + clinical intervention.",
    addExtensions: [
      { acronym: "StaRI", fullName: "Standards for Reporting Implementation Studies", whenToUse: "Implementation studies.", officialUrl: "https://www.equator-network.org/reporting-guidelines/stari-statement/" },
    ],
    agentHints: [
      "Apply StaRI: report the implementation strategy and the clinical intervention as separate layers. Use a process evaluation framework.",
    ],
  },
  {
    id: "impl.mrc",
    category: "implementation_qi",
    name: "MRC Framework — complex-intervention process evaluation",
    description: "Process evaluation of complex interventions.",
    agentHints: [
      "Apply the MRC process-evaluation framework: implementation, mechanisms of impact, context.",
    ],
  },
  {
    id: "impl.trace",
    category: "implementation_qi",
    name: "Adaptations reporting (TRACE, forthcoming)",
    description: "TRACE — Transparent Reporting of Adaptations, Context, and Effects (2026).",
    agentHints: [
      "Apply TRACE principles: report intervention adaptations, the contexts that prompted them, and effects on outcomes.",
    ],
  },

  /* ============ DECENTRALIZED / DIGITAL ============ */
  {
    id: "dd.dct",
    category: "decentralized_digital",
    name: "Decentralized clinical trial components (CONSORT-DCT, forthcoming)",
    description: "Decentralized / remote trial procedures.",
    addExtensions: [
      { acronym: "CONSORT-DCT", fullName: "CONSORT extension for decentralized clinical trials (2026)", whenToUse: "DCT or hybrid trials." },
    ],
    agentHints: [
      "Describe which procedures occur remotely, technology used (e-consent, telehealth, wearables), data flows, and digital-equity considerations.",
    ],
  },
  {
    id: "dd.ehealth",
    category: "decentralized_digital",
    name: "eHealth / digital intervention (CONSORT-eHealth)",
    description: "Internet, mobile, or digital health intervention.",
    addExtensions: [
      { acronym: "CONSORT-eHealth", fullName: "CONSORT-eHealth", whenToUse: "Digital interventions." },
    ],
    agentHints: [
      "Apply CONSORT-eHealth: describe the technology, version, platform, content, interactivity, and user engagement metrics.",
    ],
  },
  {
    id: "dd.wearable",
    category: "decentralized_digital",
    name: "Wearable / sensor data",
    description: "Wearable devices or continuous monitoring sensors.",
    agentHints: [
      "Describe device manufacturer, model, firmware, sampling rate, data processing (filtering, artifact removal), and adherence metrics.",
    ],
  },
];

export const featureCategories: { id: FeatureCategory; label: string; emoji: string }[] = [
  { id: "ai_ml", label: "AI / ML", emoji: "🤖" },
  { id: "population_equity", label: "Population & equity", emoji: "🌍" },
  { id: "specialty", label: "Specialty", emoji: "🩻" },
  { id: "methods", label: "Methods", emoji: "📐" },
  { id: "intervention_description", label: "Intervention description", emoji: "📋" },
  { id: "patient_public", label: "Patient & public", emoji: "👥" },
  { id: "open_science", label: "Open science", emoji: "🔓" },
  { id: "harms_safety", label: "Harms & safety", emoji: "⚠️" },
  { id: "implementation_qi", label: "Implementation / QI", emoji: "🛠" },
  { id: "decentralized_digital", label: "Decentralized / digital", emoji: "📱" },
];

export const featureById = (id: string) => features.find((f) => f.id === id);
export const featuresByCategory = (cat: FeatureCategory) => features.filter((f) => f.category === cat);
