import type { FeatureCategory, FeatureEvidence, FeatureSpec } from "../types";

/* ============================================================
   Feature catalog.
   Each feature attaches: extensions, checklist additions,
   supporting documents, and "agent hints" — prompt fragments
   we inject into every downstream LLM call so the assistant
   knows the specific reporting expectations.

   `rawFeatures` is the authored catalogue. The exported `features`
   is derived from it: it is de-duplicated by id (a few ids were
   authored twice) and each feature is decorated with real-world,
   verifiable usage `evidence` (see featureEvidence below). Only
   evidence-backed features are surfaced as such in the UI.
   ============================================================ */

const rawFeatures: FeatureSpec[] = [
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

  /* ============ Newly added — quality, integrity, writing ============ */
  {
    id: "qual.reproducibility",
    category: "open_science",
    name: "Reproducibility — code + data + computational environment",
    description: "Goes beyond data-sharing: pinned dependencies, container images, exact reproducibility instructions.",
    agentHints: [
      "Provide a reproducibility paragraph: code repository link, exact pinned dependency versions, container image (Docker/Singularity) digest, hardware required, expected runtime, and the exact command line to reproduce each figure/table.",
    ],
  },
  {
    id: "qual.preregistration",
    category: "open_science",
    name: "Pre-registration of hypotheses, outcomes, and analysis plan",
    description: "Locks design decisions before data are seen — supports falsifiability and reduces HARKing.",
    agentHints: [
      "Cite the pre-registration record (OSF / AsPredicted / clinical-trial registry). Distinguish pre-specified vs post-hoc analyses; flag any deviations from the registered plan with rationale.",
    ],
  },
  {
    id: "qual.ai-assistance",
    category: "open_science",
    name: "AI assistance disclosure (ICMJE 2026)",
    description: "Disclose any generative-AI assistance in drafting / coding / analysis per ICMJE 2026.",
    agentHints: [
      "Add an acknowledgements paragraph listing each AI tool used, its version, the date(s) of use, the section(s) it was used for, and a statement that the authors are responsible for the final content.",
    ],
  },
  {
    id: "qual.integrity-coi",
    category: "open_science",
    name: "Research integrity statement + COI granularity",
    description: "Stronger integrity statement: industry funding details, role of sponsor, individual COI per author.",
    agentHints: [
      "Include a per-author COI table (financial, employment, advisory, stock, IP). State the role of any commercial sponsor in: design, data collection, analysis, manuscript preparation, decision to submit. Affirm authors had full access to data.",
    ],
  },

  /* ============ Pediatric / specific populations ============ */
  {
    id: "pop.pediatric",
    category: "population_equity",
    name: "Paediatric population",
    description: "Children / adolescents — age-appropriate consent, growth, age-stratified analyses.",
    agentHints: [
      "Report age strata (neonate / infant / child / adolescent), parental consent + age-appropriate assent, age-specific outcomes, and any deviation from adult dosing.",
    ],
  },
  {
    id: "pop.pregnancy",
    category: "population_equity",
    name: "Pregnancy / perinatal population",
    description: "Pregnant or post-partum participants — fetal outcomes, gestational age, exclusions.",
    agentHints: [
      "Report gestational age at exposure, fetal-outcome surveillance, breast-milk transfer if applicable, and rationale for inclusion (Belmont equity principle vs. teratogenic risk).",
    ],
  },
  {
    id: "pop.older-adults",
    category: "population_equity",
    name: "Older adults / frailty",
    description: "≥65y with frailty / polypharmacy / dementia considerations.",
    agentHints: [
      "Report frailty score (CFS / Fried), polypharmacy count, cognitive screen, comprehensive geriatric assessment if relevant; pre-specify age-stratified analyses.",
    ],
  },
  {
    id: "pop.lmic",
    category: "population_equity",
    name: "Low- and middle-income setting (LMIC)",
    description: "Adapt context, transferability, and resource-constrained workflow.",
    agentHints: [
      "Describe local resource constraints, regulatory environment, community engagement, capacity-building, and explicit transferability vs. HIC settings.",
    ],
  },
  {
    id: "pop.indigenous",
    category: "population_equity",
    name: "Indigenous / minoritized community partnership",
    description: "CONSIDER-statement; community-based participatory research principles.",
    agentHints: [
      "Document community partnership (governance, data sovereignty per CARE/OCAP principles), local IRB / Tribal IRB approval, benefit-sharing, and consent process aligned with community norms.",
    ],
  },
  {
    id: "pop.race-ethnicity",
    category: "population_equity",
    name: "Race / ethnicity reporting (AMA 11)",
    description: "Use race/ethnicity as a social construct; pre-specified justification; avoid biological essentialism.",
    agentHints: [
      "State source of race/ethnicity data (self-report vs administrative), justify use, avoid biological language, and report subgroup analyses with appropriate caution.",
    ],
  },

  /* ============ Specialty extensions ============ */
  {
    id: "spec.surgery",
    category: "specialty",
    name: "Surgical study",
    description: "Surgical interventions — surgeon experience, learning curve, intra-operative variables.",
    agentHints: [
      "Report surgeon volume/experience, learning-curve adjustment, intraoperative variables (blood loss, time, conversion), peri-operative protocol, and complications by Clavien-Dindo.",
    ],
  },
  {
    id: "spec.imaging",
    category: "specialty",
    name: "Medical imaging study",
    description: "MRI / CT / US / PET — acquisition parameters, reader blinding, reproducibility.",
    agentHints: [
      "Report scanner manufacturer/model/field strength, acquisition parameters (TR/TE/slice thickness), reconstruction, reader experience, blinding, intra/inter-reader reliability (κ / ICC).",
    ],
  },
  {
    id: "spec.cardiology",
    category: "specialty",
    name: "Cardiology endpoints",
    description: "MACE composites — specify and justify the components used.",
    agentHints: [
      "Define every MACE / MACCE component, adjudication committee, time-to-event handling, and whether components were pre-specified.",
    ],
  },
  {
    id: "spec.oncology",
    category: "specialty",
    name: "Oncology — RECIST / iRECIST / OS / PFS",
    description: "Cancer endpoints with appropriate criteria.",
    agentHints: [
      "Report RECIST v1.1 / iRECIST adherence, blinded independent central review (BICR), OS / PFS handling, censoring rules, and crossover handling.",
    ],
  },
  {
    id: "spec.mental-health",
    category: "specialty",
    name: "Mental-health study",
    description: "Validated scales — specify minimal clinically important difference (MCID).",
    agentHints: [
      "Cite the validated instrument (PHQ-9, GAD-7, HAM-D, etc.) with reference; state MCID, scoring direction, and translation/cultural adaptation.",
    ],
  },
  {
    id: "spec.infectious-disease",
    category: "specialty",
    name: "Infectious disease / outbreak",
    description: "Case definition, lab confirmation, contact tracing, biosafety.",
    agentHints: [
      "Provide WHO/CDC case definition used, laboratory diagnostic method (PCR / serology / culture), contact tracing window, isolation policies, and biosafety level.",
    ],
  },
  {
    id: "spec.public-health",
    category: "specialty",
    name: "Public health / population intervention",
    description: "Population-level metrics, equity-stratified outcomes.",
    agentHints: [
      "Report population-level outcomes (incidence, prevalence, life-years, equity gradients) and any pre-specified equity-stratified analyses (PROGRESS-Plus).",
    ],
  },
  {
    id: "spec.nutrition",
    category: "specialty",
    name: "Nutrition / dietary study",
    description: "STROBE-nut — instrument validity, residual confounding by lifestyle.",
    agentHints: [
      "Cite dietary assessment instrument (FFQ / 24-h recall) with validation data, energy adjustment method, and acknowledgement of measurement error and residual confounding.",
    ],
  },
  {
    id: "spec.rehabilitation",
    category: "specialty",
    name: "Rehabilitation / physiotherapy",
    description: "Dose-response, adherence, fidelity of complex intervention.",
    agentHints: [
      "Report frequency × intensity × duration × type of therapy; document fidelity assessment, adherence (% sessions attended), and dropout reasons.",
    ],
  },
  {
    id: "spec.pharmacology",
    category: "specialty",
    name: "Pharmacology / pharmacokinetics",
    description: "PK/PD modelling, dose-response, drug-drug interactions.",
    agentHints: [
      "Report sampling schedule, PK parameters (AUC, Cmax, t½), modelling software, and any DDI analysis.",
    ],
  },

  /* ============ Methods extensions ============ */
  {
    id: "methods.causal-inference",
    category: "methods",
    name: "Causal inference (DAG + estimand framework)",
    description: "Explicit causal estimand; DAG; clear identification strategy.",
    agentHints: [
      "Provide a DAG, state the estimand (target trial language for observational data), identification assumptions, sensitivity analyses (E-value), and quantitative bias analysis if applicable.",
    ],
  },
  {
    id: "methods.target-trial",
    category: "methods",
    name: "Target-trial emulation",
    description: "Hernán-style protocol emulating an RCT from observational data.",
    agentHints: [
      "Present the target-trial protocol explicitly (eligibility, treatment strategies, assignment, follow-up, outcome, causal contrast, analysis plan) and explain how each component is emulated.",
    ],
  },
  {
    id: "methods.bayesian",
    category: "methods",
    name: "Bayesian analysis",
    description: "Prior specification, posterior, model checks.",
    agentHints: [
      "State prior choice + sensitivity, posterior summaries (median, 95% credible interval), MCMC diagnostics (R̂, ESS), and posterior predictive checks.",
    ],
  },
  {
    id: "methods.missing-data",
    category: "methods",
    name: "Missing-data handling (multiple imputation / IPW)",
    description: "Beyond complete-case — pre-specified method.",
    agentHints: [
      "Report missingness pattern by variable, missing-data mechanism assumption (MCAR/MAR/MNAR), method used (MI/IPW), number of imputations, and sensitivity to assumptions.",
    ],
  },
  {
    id: "methods.imbalance-handling",
    category: "methods",
    name: "Imbalanced-data handling (oversampling / class weighting)",
    description: "For ML/classification with class imbalance.",
    agentHints: [
      "Report class balance, technique used (SMOTE, class weights, focal loss), and ensure performance metrics are not misleading (use PR-AUC, F1, MCC alongside ROC-AUC).",
    ],
  },
  {
    id: "methods.subgroup",
    category: "methods",
    name: "Pre-specified subgroup analyses",
    description: "Pre-specified, not data-driven; interaction tests; equity-aware.",
    agentHints: [
      "List subgroups pre-specified in the protocol; report interaction p-values; warn against over-interpreting small subgroups; PROGRESS-Plus for equity.",
    ],
  },
  {
    id: "methods.equity",
    category: "methods",
    name: "Equity-stratified analyses (PROGRESS-Plus)",
    description: "Place, Race, Occupation, Gender, Religion, Education, SES, Social capital plus age, disability.",
    agentHints: [
      "Report eligibility/recruitment/retention by PROGRESS-Plus categories; pre-specify equity-stratified outcomes.",
    ],
  },
  {
    id: "methods.sensitivity",
    category: "methods",
    name: "Robustness / sensitivity analyses",
    description: "E-value, leave-one-out, tipping-point.",
    agentHints: [
      "Report a tipping-point or E-value analysis for the primary effect; explicitly state at what level of unmeasured confounding the conclusion would change.",
    ],
  },
  {
    id: "methods.economic-eval",
    category: "methods",
    name: "Economic evaluation alongside the study",
    description: "CHEERS 2022 — cost-effectiveness alongside the trial / cohort.",
    agentHints: [
      "Apply CHEERS 2022: cost perspective, time horizon, discounting, ICER with bootstrap CI, deterministic & probabilistic sensitivity analyses, value-of-information.",
    ],
  },

  /* ============ Intervention description ============ */
  {
    id: "intv.dose-response",
    category: "intervention_description",
    name: "Dose-response / titration",
    description: "Document titration scheme and stopping rules.",
    agentHints: [
      "Describe titration steps, dose-escalation rules, dose modifications for toxicity, and stopping rules.",
    ],
  },
  {
    id: "intv.complex-intervention",
    category: "intervention_description",
    name: "Complex / multi-component intervention (MRC framework)",
    description: "Apply MRC complex-intervention framework + TIDieR.",
    agentHints: [
      "Use the MRC framework (development, feasibility, evaluation, implementation). Map each component to behaviour-change-technique taxonomy (BCTTv1). Pair with TIDieR.",
    ],
  },
  {
    id: "intv.digital-health",
    category: "intervention_description",
    name: "Digital health intervention (CONSORT-eHEALTH)",
    description: "Apply CONSORT-eHEALTH for web/mobile interventions.",
    agentHints: [
      "Document platform, content, dosage, theoretical basis, security, privacy, accessibility (WCAG), and tech-support pathway. Cite CONSORT-eHEALTH v1.6.1.",
    ],
  },

  /* ============ Patient & public ============ */
  {
    id: "pp.diversity",
    category: "patient_public",
    name: "Diverse PPI panel + accessibility statement",
    description: "Specify PPI demographics and lived experience.",
    agentHints: [
      "Report PPI panel demographics, lived experience, training/support given, how their input changed the study, and accessibility (plain-language summary, translation).",
    ],
  },

  /* ============ Harms & safety ============ */
  {
    id: "harms.adverse",
    category: "harms_safety",
    name: "CONSORT-Harms — adverse events",
    description: "Pre-specified harms outcomes, severity grading, time-windows.",
    agentHints: [
      "Apply CONSORT-Harms: list pre-specified AEs vs. surveillance, severity grading (CTCAE / WHO-UMC), time window, attribution method, and full numerator/denominator.",
    ],
  },

  /* ============ Implementation / QI ============ */
  {
    id: "qi.proctor-implementation-outcomes",
    category: "implementation_qi",
    name: "Implementation outcomes (Proctor)",
    description: "Acceptability, adoption, appropriateness, feasibility, fidelity, penetration, sustainability, cost.",
    agentHints: [
      "Report Proctor's 8 implementation outcomes with measurement method for each.",
    ],
  },

  /* ============ Open science (additional) ============ */
  {
    id: "open.code",
    category: "open_science",
    name: "Open code repository (TRIPOD-CODE)",
    description: "Public, versioned repository with DOI.",
    agentHints: [
      "Include a code-availability statement: URL + commit hash + Zenodo DOI; specify license (MIT/Apache/CC).",
    ],
  },
  {
    id: "open.materials",
    category: "open_science",
    name: "Open materials (protocols.io etc.)",
    description: "Versioned protocols / SOPs in an open repository.",
    agentHints: [
      "Cite protocols.io / OSF version IDs and include a materials-availability statement.",
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

/* ============================================================
   Real-world EVIDENCE for each feature.

   `verifyUrl` is a LIVE search (PubMed, EQUATOR, or the official
   site) that returns the actual published articles which used the
   guideline/feature — so users can confirm the evidence first-hand
   instead of trusting a hard-coded citation. `publishedUse` is added
   only where a landmark statement/exemplar is verified. `status`:
   "established" = in routine published use; "emerging" = adopted but
   newer; "forthcoming" = guideline still under development (we do NOT
   claim published use). Only features with an entry here are shown as
   evidence-backed in the Study Design Selector.
   ============================================================ */

const pubmed = (term: string) =>
  `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(term)}`;

export const featureEvidence: Record<string, FeatureEvidence> = {
  "ai.tripod-ai": {
    exampleOfUse:
      "Reporting a clinical risk/prognostic model (regression or ML) with development and external validation, calibration and discrimination, and fairness across subgroups.",
    verifyUrl: pubmed('"TRIPOD+AI" OR "TRIPOD-AI"'),
    publishedUse:
      "Collins GS, et al. TRIPOD+AI statement: updated guidance for reporting clinical prediction models that use regression or machine learning methods. BMJ. 2024;385:e078378.",
    status: "established",
  },
  "ai.consort-ai": {
    exampleOfUse:
      "Reporting a randomised controlled trial whose intervention is an AI/ML system — describing model version, integration, human oversight, and error analysis.",
    verifyUrl: pubmed('"CONSORT-AI"'),
    publishedUse:
      "Liu X, Cruz Rivera S, Moher D, et al. Reporting guidelines for clinical trial reports for interventions involving artificial intelligence: the CONSORT-AI extension. Nat Med. 2020;26:1364-1374.",
    status: "established",
  },
  "ai.decide-ai": {
    exampleOfUse:
      "Reporting an early-stage, small-scale live evaluation of an AI decision-support tool before a full trial — human–AI interaction, safety, and learning curve.",
    verifyUrl: pubmed('"DECIDE-AI"'),
    publishedUse:
      "Vasey B, Nagendran M, Campbell B, et al. Reporting guideline for the early-stage clinical evaluation of decision support systems driven by AI: DECIDE-AI. Nat Med. 2022;28:924-933.",
    status: "established",
  },
  "ai.claim-imaging": {
    exampleOfUse:
      "Reporting an AI model in medical imaging — modality, ground truth, train/test integrity (no leakage), and external validation site.",
    verifyUrl: pubmed('"CLAIM" "artificial intelligence" medical imaging checklist'),
    publishedUse:
      "Tejani AS, et al. Checklist for Artificial Intelligence in Medical Imaging (CLAIM): 2024 Update. Radiol Artif Intell. 2024.",
    status: "established",
  },
  "ai.tripod-llm": {
    exampleOfUse:
      "Reporting a study that uses a large language model — model version/date, verbatim prompts, temperature/seed, evaluation set, and hallucination handling.",
    verifyUrl: pubmed('"TRIPOD-LLM"'),
    publishedUse:
      "Gallifant J, et al. The TRIPOD-LLM reporting guideline for studies using large language models. Nat Med. 2024.",
    status: "emerging",
  },
  "ai.bridge-ai": {
    exampleOfUse:
      "Planning ahead for AI-in-digital-health reporting; principles only until the guideline is published.",
    verifyUrl:
      "https://www.equator-network.org/library/reporting-guidelines-under-development/",
    status: "forthcoming",
  },

  "equity.progress-plus": {
    exampleOfUse:
      "Reporting outcomes disaggregated across equity strata (place, race, occupation, gender, education, SES…) with interaction tests or equity-gap measures.",
    verifyUrl: pubmed('"PROGRESS-Plus" equity'),
    publishedUse:
      "O'Neill J, et al. Applying an equity lens to interventions: using PROGRESS ensures consideration of socially stratifying factors. J Clin Epidemiol. 2014;67(1):56-64.",
    status: "established",
  },
  "equity.sager": {
    exampleOfUse:
      "Reporting sex- and gender-disaggregated analyses, distinguishing biological sex from social gender across methods, results, and discussion.",
    verifyUrl: pubmed('"SAGER guidelines" sex gender reporting'),
    publishedUse:
      "Heidari S, et al. Sex and Gender Equity in Research: rationale for the SAGER guidelines. Res Integr Peer Rev. 2016;1:2.",
    status: "established",
  },
  "equity.indigenous": {
    exampleOfUse:
      "Reporting health research conducted with Indigenous communities — governance, relationships, capacity, and dissemination.",
    verifyUrl: pubmed('"CONSIDER statement" Indigenous'),
    publishedUse:
      "Huria T, et al. Consolidated criteria for strengthening reporting of health research involving indigenous peoples: the CONSIDER statement. BMC Med Res Methodol. 2019;19:173.",
    status: "established",
  },

  "specialty.surgery": {
    exampleOfUse:
      "Staging a surgical innovation study within the IDEAL framework (stages 1–5) and reporting learning-curve and complication grading.",
    verifyUrl: pubmed('"IDEAL framework" surgery innovation'),
    publishedUse:
      "McCulloch P, et al. No surgical innovation without evaluation: the IDEAL recommendations. Lancet. 2009;374(9695):1105-1112.",
    status: "established",
  },
  "specialty.infectious": {
    exampleOfUse:
      "Reporting molecular epidemiology of an infectious disease — sequencing methods, case definitions, and source attribution.",
    verifyUrl: pubmed('"STROME-ID"'),
    publishedUse:
      "Field N, et al. Strengthening the Reporting of Molecular Epidemiology for Infectious Diseases (STROME-ID). Lancet Infect Dis. 2014;14(4):341-352.",
    status: "established",
  },
  "specialty.genetics": {
    exampleOfUse:
      "Reporting a genetic-association/GWAS study — variant calling, Hardy–Weinberg, population stratification, and genome-wide significance.",
    verifyUrl: pubmed('"STREGA" genetic association reporting'),
    publishedUse:
      "Little J, et al. STrengthening the REporting of Genetic Association studies (STREGA). PLoS Med. 2009;6(2):e22.",
    status: "established",
  },

  "methods.diagnostic-test": {
    exampleOfUse:
      "Reporting a diagnostic-accuracy study — index test, reference standard, thresholds, blinding, and flow/timing.",
    verifyUrl: pubmed('"STARD 2015" diagnostic accuracy'),
    publishedUse:
      "Bossuyt PM, et al. STARD 2015: an updated list of essential items for reporting diagnostic accuracy studies. BMJ. 2015;351:h5527.",
    status: "established",
  },
  "methods.adaptive": {
    exampleOfUse:
      "Reporting a pre-specified adaptive trial — adaptation rules, type-I error control, and bias adjustment.",
    verifyUrl: pubmed('"Adaptive designs CONSORT Extension" ACE'),
    publishedUse:
      "Dimairo M, et al. The Adaptive designs CONSORT Extension (ACE) statement. BMJ. 2020;369:m115.",
    status: "established",
  },
  "methods.mr": {
    exampleOfUse:
      "Reporting a Mendelian randomization study — instrument strength (F-statistics), MR-Egger/weighted-median, and pleiotropy sensitivity analyses.",
    verifyUrl: pubmed('"STROBE-MR" Mendelian randomization'),
    publishedUse:
      "Skrivankova VW, et al. Strengthening the Reporting of Observational Studies in Epidemiology Using Mendelian Randomization: the STROBE-MR statement. JAMA. 2021;326(16):1614-1621.",
    status: "established",
  },
  "methods.target-trial": {
    exampleOfUse:
      "Emulating a hypothetical RCT from observational data — explicit protocol (eligibility, strategies, follow-up, outcome, causal contrast) and where the emulation falls short.",
    verifyUrl: pubmed('"target trial emulation"'),
    publishedUse:
      "Hernán MA, Robins JM. Using big data to emulate a target trial when a randomized trial is not available. Am J Epidemiol. 2016;183(8):758-764.",
    status: "established",
  },
  "methods.bayesian": {
    exampleOfUse:
      "Reporting a Bayesian analysis — priors and justification, posterior summaries with credible intervals, MCMC diagnostics, and prior-sensitivity.",
    verifyUrl: pubmed('"Bayesian" clinical trial "credible interval" reporting'),
    status: "established",
  },
  "methods.causal-inference": {
    exampleOfUse:
      "Making a causal claim from data — DAG, named estimand, identification assumptions, and an E-value for unmeasured confounding.",
    verifyUrl: pubmed('"directed acyclic graph" "E-value" causal'),
    publishedUse:
      "VanderWeele TJ, Ding P. Sensitivity analysis in observational research: introducing the E-value. Ann Intern Med. 2017;167(4):268-274.",
    status: "established",
  },
  "methods.subgroup": {
    exampleOfUse:
      "Reporting pre-specified subgroup analyses with interaction tests and multiplicity control — avoiding within-subgroup p-value claims.",
    verifyUrl: pubmed("subgroup analysis interaction test pre-specified trial"),
    status: "established",
  },
  "methods.sensitivity": {
    exampleOfUse:
      "Reporting robustness/sensitivity analyses — E-value, leave-one-out, or tipping-point — to show how far conclusions could be from the truth.",
    verifyUrl: pubmed("sensitivity analysis robustness E-value tipping point"),
    status: "established",
  },
  "methods.missing-data": {
    exampleOfUse:
      "Handling missing data beyond complete-case — pattern, mechanism (MCAR/MAR/MNAR), multiple imputation or IPW, and sensitivity to assumptions.",
    verifyUrl: pubmed("multiple imputation missing data clinical reporting"),
    publishedUse:
      "Sterne JAC, et al. Multiple imputation for missing data in epidemiological and clinical research. BMJ. 2009;338:b2393.",
    status: "established",
  },
  "methods.economic-eval": {
    exampleOfUse:
      "Reporting a cost-effectiveness/economic evaluation alongside a trial or model — perspective, horizon, discounting, ICER, and probabilistic sensitivity analyses.",
    verifyUrl: pubmed('"CHEERS 2022"'),
    publishedUse:
      "Husereau D, et al. Consolidated Health Economic Evaluation Reporting Standards 2022 (CHEERS 2022). BMJ. 2022;376:e067975.",
    status: "established",
  },

  "intervention.tidier": {
    exampleOfUse:
      "Describing any intervention so it can be replicated — the 12 TIDieR items (what, who, how, where, when, how much, tailoring, fidelity).",
    verifyUrl: pubmed('"TIDieR" intervention description replication'),
    publishedUse:
      "Hoffmann TC, et al. Better reporting of interventions: TIDieR checklist and guide. BMJ. 2014;348:g1687.",
    status: "established",
  },
  "intervention.credeci": {
    exampleOfUse:
      "Reporting development and evaluation of a complex intervention — components, theory, dose, fidelity, and context.",
    verifyUrl: pubmed('"CReDECI 2" complex intervention'),
    publishedUse:
      "Möhler R, et al. Criteria for Reporting the Development and Evaluation of Complex Interventions in healthcare: revised guideline (CReDECI 2). Trials. 2015;16:204.",
    status: "established",
  },
  "intv.digital-health": {
    exampleOfUse:
      "Reporting a web/mobile digital health intervention — platform, content, dosage, security, and engagement metrics.",
    verifyUrl: pubmed('"CONSORT-EHEALTH"'),
    publishedUse:
      "Eysenbach G; CONSORT-EHEALTH Group. CONSORT-EHEALTH: improving and standardizing evaluation reports of web-based and mobile health interventions. J Med Internet Res. 2011;13(4):e126.",
    status: "established",
  },

  "pp.gripp2": {
    exampleOfUse:
      "Reporting patient and public involvement (PPI) — aims, methods of involvement, impact on the study, and reflections.",
    verifyUrl: pubmed('"GRIPP2" patient public involvement'),
    publishedUse:
      "Staniszewska S, et al. GRIPP2 reporting checklists: tools to improve reporting of patient and public involvement in research. BMJ. 2017;358:j3453.",
    status: "established",
  },
  "pp.pro": {
    exampleOfUse:
      "Reporting patient-reported outcomes in a trial — instrument, administration, missing-data handling, and minimal clinically important difference.",
    verifyUrl: pubmed('"CONSORT-PRO" patient-reported outcomes'),
    publishedUse:
      "Calvert M, et al. Reporting of patient-reported outcomes in randomized trials: the CONSORT PRO extension. JAMA. 2013;309(8):814-822.",
    status: "established",
  },

  "open.preregistration": {
    exampleOfUse:
      "Pre-registering hypotheses and the analysis plan (OSF / ClinicalTrials.gov / PROSPERO) before data collection, then disclosing any deviations.",
    verifyUrl: pubmed("preregistration protocol registration research"),
    publishedUse:
      "Nosek BA, et al. The preregistration revolution. Proc Natl Acad Sci USA. 2018;115(11):2600-2606.",
    status: "established",
  },
  "open.data-sharing": {
    exampleOfUse:
      "Writing a specific data-availability statement — what data, where (repository + DOI), license, and any restrictions, under FAIR principles.",
    verifyUrl: pubmed("FAIR data sharing availability statement"),
    publishedUse:
      "Wilkinson MD, et al. The FAIR Guiding Principles for scientific data management and stewardship. Sci Data. 2016;3:160018.",
    status: "established",
  },
  "open.code": {
    exampleOfUse:
      "Sharing a versioned analysis-code repository with a DOI (e.g. Zenodo) and a code-availability statement specifying the license.",
    verifyUrl: pubmed("code availability reproducibility repository Zenodo"),
    status: "established",
  },
  "open.preprint": {
    exampleOfUse:
      "Posting and citing a preprint (medRxiv/bioRxiv) with a DOI, after confirming the target journal permits preprints.",
    verifyUrl: pubmed("preprint medRxiv biomedical research"),
    status: "established",
  },

  "harms.consort-harms": {
    exampleOfUse:
      "Reporting trial harms in detail — definitions, severity grading (CTCAE), collection method, attribution, and balanced benefit-vs-harm presentation.",
    verifyUrl: pubmed('"CONSORT" harms extension adverse events'),
    publishedUse:
      "Junqueira DR, et al. CONSORT Harms 2022 statement, explanation, and elaboration: updated guideline for the reporting of harms in randomised trials. BMJ. 2023;381:e073725.",
    status: "established",
  },
  "harms.adverse": {
    exampleOfUse:
      "Pre-specifying adverse-event outcomes with severity grading and full numerator/denominator, distinguishing pre-specified from surveillance harms.",
    verifyUrl: pubmed('"CONSORT" harms extension adverse events'),
    publishedUse:
      "Junqueira DR, et al. CONSORT Harms 2022 statement. BMJ. 2023;381:e073725.",
    status: "established",
  },

  "impl.stari": {
    exampleOfUse:
      "Reporting an implementation study — the implementation strategy and the clinical intervention as separate layers, with a process evaluation.",
    verifyUrl: pubmed('"StaRI" implementation studies'),
    publishedUse:
      "Pinnock H, et al. Standards for Reporting Implementation Studies (StaRI) statement. BMJ. 2017;356:i6795.",
    status: "established",
  },
  "qi.proctor-implementation-outcomes": {
    exampleOfUse:
      "Reporting implementation outcomes — acceptability, adoption, appropriateness, feasibility, fidelity, penetration, sustainability, and cost.",
    verifyUrl: pubmed("Proctor implementation outcomes"),
    publishedUse:
      "Proctor E, et al. Outcomes for implementation research: conceptual distinctions, measurement challenges, and research agenda. Adm Policy Ment Health. 2011;38(2):65-76.",
    status: "established",
  },
  "impl.trace": {
    exampleOfUse:
      "Planning ahead for transparent reporting of intervention adaptations; principles only until TRACE is published.",
    verifyUrl:
      "https://www.equator-network.org/library/reporting-guidelines-under-development/",
    status: "forthcoming",
  },

  "dd.dct": {
    exampleOfUse:
      "Reporting decentralized/remote trial procedures — e-consent, telehealth, wearables, data flows, and digital-equity considerations.",
    verifyUrl: pubmed("decentralized clinical trial reporting remote"),
    status: "forthcoming",
  },
  "dd.ehealth": {
    exampleOfUse:
      "Reporting an internet/mobile health intervention — technology, version, interactivity, and engagement.",
    verifyUrl: pubmed('"CONSORT-EHEALTH"'),
    publishedUse:
      "Eysenbach G; CONSORT-EHEALTH Group. CONSORT-EHEALTH. J Med Internet Res. 2011;13(4):e126.",
    status: "established",
  },

  "qual.ai-assistance": {
    exampleOfUse:
      "Disclosing generative-AI assistance per ICMJE — tool, version, dates, sections used, and author responsibility for the final content.",
    verifyUrl:
      "https://www.icmje.org/recommendations/browse/roles-and-responsibilities/defining-the-role-of-authors-and-contributors.html",
    publishedUse:
      "ICMJE. Recommendations for the Conduct, Reporting, Editing, and Publication of Scholarly Work in Medical Journals (AI/large language models guidance).",
    status: "emerging",
  },
};

/* ============================================================
   Build the exported catalogue: de-duplicate by id (first wins,
   but inherit evidence for any id) and attach evidence.
   ============================================================ */

function buildFeatures(): FeatureSpec[] {
  const byId = new Map<string, FeatureSpec>();
  for (const f of rawFeatures) {
    if (!byId.has(f.id)) {
      byId.set(f.id, { ...f, evidence: featureEvidence[f.id] });
    }
  }
  return Array.from(byId.values());
}

export const features: FeatureSpec[] = buildFeatures();

/** Features that carry verifiable real-world usage evidence. */
export const evidenceBackedFeatures = features.filter((f) => f.evidence);

export const featureById = (id: string) => features.find((f) => f.id === id);
export const featuresByCategory = (cat: FeatureCategory) => features.filter((f) => f.category === cat);
