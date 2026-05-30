// Research Skill Chains ("epics")
// End-to-end sequences that stitch individual research skills into complete,
// runnable workflows — from a single task up to a full multi-month project.
// Each step references skills by id (see lib/knowledge/skills.ts) and the
// platform lane (LifecycleNavigation key) where the work happens, so a user can
// follow a chain across the app and know exactly which skills to apply.
//
// These are first-party, authored workflows — concrete and immediately usable.

export type ChainScope = "task" | "major-task" | "epic";

export type SkillChainStep = {
  title: string;
  doThis: string;
  skillIds?: string[];
  platformLane?: string;
};

export type SkillChain = {
  id: string;
  title: string;
  scope: ChainScope;
  goal: string;
  whenToUse: string;
  steps: SkillChainStep[];
  deliverable: string;
  estimatedEffort: string;
};

export const skillChains: SkillChain[] = [
  // ════════════════════════════════════════════════════════════════ EPICS
  {
    id: "epic-systematic-review-meta-analysis",
    title: "Run a full systematic review & meta-analysis end-to-end",
    scope: "epic",
    goal:
      "Take a clinical question to a published, GRADE-rated systematic review with a defensible meta-analysis.",
    whenToUse:
      "You have a focused question and want the highest-evidence synthesis: protocol-first, registered, dual-screened, and transparently synthesized.",
    steps: [
      {
        title: "Frame the question and write a protocol",
        doThis:
          "Convert the curiosity into a PICO, draft a PRISMA-P protocol, and pre-specify eligibility, screening, extraction, risk-of-bias tool, and the synthesis plan before any screening.",
        skillIds: ["methods-pico", "methods-prisma-p", "methods-eligibility"],
        platformLane: "protocol",
      },
      {
        title: "Register the protocol",
        doThis:
          "Register on PROSPERO before screening begins; lock outcomes and the analysis approach to prevent later cherry-picking.",
        skillIds: ["repro-prereg", "repro-equator-select"],
        platformLane: "protocol",
      },
      {
        title: "Build and document the search",
        doThis:
          "Construct a reproducible MeSH+free-text search per database, add grey literature and registries, and record everything to PRISMA-S standards.",
        skillIds: [
          "search-pubmed-mesh",
          "search-document-strategy",
          "search-grey-literature",
          "search-citation-chasing",
        ],
        platformLane: "literature",
      },
      {
        title: "Deduplicate and screen in duplicate",
        doThis:
          "Deduplicate records, then screen titles/abstracts and full texts with two independent reviewers, logging exclusion reasons for the flow diagram.",
        skillIds: [
          "search-deduplicate",
          "review-systematic-screening",
          "search-screening-tools",
        ],
        platformLane: "literature",
      },
      {
        title: "Extract data and assess risk of bias",
        doThis:
          "Extract pre-specified fields in duplicate and apply the design-matched risk-of-bias tool (RoB 2 / ROBINS-I / QUADAS-2) with supporting quotes.",
        skillIds: ["review-risk-of-bias"],
        platformLane: "methods",
      },
      {
        title: "Synthesize and probe heterogeneity",
        doThis:
          "Pool with the appropriate model; report tau-squared and a prediction interval, probe heterogeneity with pre-specified subgroups/meta-regression, and assess small-study effects.",
        skillIds: [
          "review-meta-analysis",
          "meta-heterogeneity-deep",
          "meta-regression",
          "meta-publication-bias",
        ],
        platformLane: "results",
      },
      {
        title: "Rate certainty with GRADE and draw the figures",
        doThis:
          "Build a Summary of Findings table, rate certainty per outcome with GRADE, and draw the PRISMA flow diagram and forest plots.",
        skillIds: ["meta-grade", "fig-forest", "fig-prisma-flow"],
        platformLane: "results",
      },
      {
        title: "Write, run the checklist, and submit",
        doThis:
          "Write a PRISMA-compliant abstract and manuscript, complete the PRISMA checklist, target a fitting journal, and submit.",
        skillIds: [
          "abstract-prisma",
          "prod-checklist-before-draft",
          "prod-journal-fit-strategy",
          "prod-submission-checklist",
        ],
        platformLane: "submission",
      },
    ],
    deliverable:
      "A registered, PRISMA-compliant systematic review and meta-analysis with a GRADE Summary of Findings table, ready for submission.",
    estimatedEffort: "3-9 months (team of 2+ reviewers)",
  },
  {
    id: "epic-observational-study",
    title: "Take an observational study from idea to submission",
    scope: "epic",
    goal:
      "Design, analyze, and report a cohort/case-control study with causal-inference rigor and STROBE-compliant reporting.",
    whenToUse:
      "You have (or can assemble) observational data and want a credible association/effect estimate that survives methods review.",
    steps: [
      {
        title: "Scope the question and design",
        doThis:
          "Define the PICO/exposure-outcome question, choose the observational design, and select the STROBE guideline up front.",
        skillIds: ["methods-pico", "repro-equator-select", "prod-equator-extension-select"],
        platformLane: "type",
      },
      {
        title: "Specify the causal model and estimand",
        doThis:
          "Draw a DAG to pick the adjustment set, define the estimand and intercurrent-event handling, and pre-register the analysis plan.",
        skillIds: ["causal-dag", "stats-estimand", "repro-prereg"],
        platformLane: "protocol",
      },
      {
        title: "Define eligibility, variables, and measurement",
        doThis:
          "Write precise eligibility criteria, define every variable, and document data collection and instrument validity for STROBE.",
        skillIds: [
          "methods-eligibility",
          "methods-strobe",
          "methods-data-collection",
          "methods-missing-data",
        ],
        platformLane: "methods",
      },
      {
        title: "Analyze with confounding control",
        doThis:
          "Adjust transparently (DAG-based covariates, propensity methods, or target-trial emulation), handle missing data with multiple imputation, and avoid the Table 2 fallacy.",
        skillIds: [
          "stats-confounding",
          "causal-propensity",
          "causal-target-trial",
          "stats-multiple-imputation",
          "stats-dag-table-two",
        ],
        platformLane: "results",
      },
      {
        title: "Report results and figures",
        doThis:
          "Build Table 1, report crude and adjusted estimates with CIs, present time-to-event or regression results to SAMPL precision.",
        skillIds: [
          "results-table1",
          "results-confounder-table",
          "results-effect-ci",
          "stats-regression-reporting",
          "stats-survival",
        ],
        platformLane: "results",
      },
      {
        title: "Write the narrative honestly",
        doThis:
          "Build a CARS introduction, interpret without spin, state generalizability and limitations candidly, and conclude proportionately.",
        skillIds: [
          "intro-cars",
          "discussion-avoid-spin",
          "discussion-generalizability",
          "discussion-limitations",
          "conclusion-proportionate",
        ],
        platformLane: "discussion",
      },
      {
        title: "Finalize and submit",
        doThis:
          "Complete the STROBE checklist, write ethics/COI/data statements, pick the journal, and run the submission checklist.",
        skillIds: [
          "prod-checklist-before-draft",
          "ethics-irb",
          "repro-data-availability-real",
          "prod-journal-fit-strategy",
          "prod-submission-checklist",
        ],
        platformLane: "submission",
      },
    ],
    deliverable:
      "A STROBE-compliant observational manuscript with a pre-registered, DAG-justified analysis, ready for submission.",
    estimatedEffort: "2-6 months",
  },
  {
    id: "epic-rct-spirit-consort",
    title: "Design, run, and report an RCT (SPIRIT to CONSORT)",
    scope: "epic",
    goal:
      "Move a trial from a SPIRIT protocol through conduct to a CONSORT-compliant primary results paper.",
    whenToUse:
      "You are planning or reporting a randomized controlled trial and need protocol-to-publication rigor.",
    steps: [
      {
        title: "Write the SPIRIT protocol",
        doThis:
          "Draft a SPIRIT protocol: objectives, design, allocation ratio, interventions, schedule of assessments, monitoring, and dissemination.",
        skillIds: ["methods-spirit", "methods-pico", "methods-eligibility"],
        platformLane: "protocol",
      },
      {
        title: "Define the estimand, outcomes, and sample size",
        doThis:
          "Specify the estimand and intercurrent-event strategy, pre-specify primary/secondary outcomes, and justify the sample size and power.",
        skillIds: ["stats-estimand", "stats-sample-size", "stats-cluster-design"],
        platformLane: "protocol",
      },
      {
        title: "Register and write the SAP",
        doThis:
          "Register the trial before enrollment, write a dated statistical analysis plan, and pre-specify multiplicity control and missing-data handling.",
        skillIds: ["repro-prereg", "repro-sap", "stats-multiplicity", "methods-missing-data"],
        platformLane: "protocol",
      },
      {
        title: "Specify randomization and blinding",
        doThis:
          "Describe sequence generation, allocation concealment, and exactly who was blinded and how, to CONSORT standards.",
        skillIds: ["methods-consort", "methods-blinding-detail"],
        platformLane: "methods",
      },
      {
        title: "Analyze and report results and harms",
        doThis:
          "Analyze per the SAP (ITT), report participant flow, primary effect with CI, all pre-specified outcomes, and harms fully; handle baseline imbalance correctly.",
        skillIds: [
          "results-flow",
          "results-effect-ci",
          "results-report-all-outcomes",
          "results-adverse-events",
          "stats-baseline-imbalance",
        ],
        platformLane: "results",
      },
      {
        title: "Draw the CONSORT flow diagram and write up",
        doThis:
          "Build the CONSORT participant-flow diagram, write a CONSORT-for-abstracts abstract with the registration ID, and avoid spin in the discussion.",
        skillIds: [
          "figures-consort-flow",
          "abstract-trial-registration",
          "discussion-avoid-spin",
        ],
        platformLane: "results",
      },
      {
        title: "Finalize and submit",
        doThis:
          "Complete the CONSORT checklist, ensure ethics/funding/data statements, and submit to a fitting trial-publishing journal.",
        skillIds: [
          "prod-checklist-before-draft",
          "ethics-funding-statement",
          "ethics-trial-reporting-timeliness",
          "prod-submission-checklist",
        ],
        platformLane: "submission",
      },
    ],
    deliverable:
      "A registered RCT with a SPIRIT protocol, pre-specified SAP, and a CONSORT-compliant primary results manuscript.",
    estimatedEffort: "Protocol weeks; full trial 1-3 years",
  },
  {
    id: "epic-prediction-model-tripod",
    title: "Build a prediction model and report it end-to-end (TRIPOD)",
    scope: "epic",
    goal:
      "Develop, internally and externally validate, and report a clinical prediction model with discrimination, calibration, and clinical utility.",
    whenToUse:
      "You want a risk/prognostic model that clinicians can trust and that will pass TRIPOD/TRIPOD+AI review.",
    steps: [
      {
        title: "Plan development with adequate data",
        doThis:
          "Estimate the required development sample/events, pre-specify candidate predictors clinically, and keep continuous predictors continuous.",
        skillIds: ["methods-prediction-development", "stats-sample-size"],
        platformLane: "protocol",
      },
      {
        title: "Develop with shrinkage and avoid leakage",
        doThis:
          "Apply penalization/shrinkage, prevent data leakage in any ML pipeline, and bootstrap the whole process for optimism-corrected internal validation.",
        skillIds: ["methods-prediction-development", "methods-ml-rigor"],
        platformLane: "methods",
      },
      {
        title: "Validate externally with calibration and utility",
        doThis:
          "Validate on external data; report discrimination AND calibration plus a decision-curve (net benefit) analysis.",
        skillIds: ["methods-prediction-validation", "fig-calibration-plot", "fig-decision-curve"],
        platformLane: "results",
      },
      {
        title: "Report per TRIPOD",
        doThis:
          "Present the final model usably (equation/nomogram/calculator) and report following TRIPOD (and TRIPOD+AI for ML models, with provenance and fairness).",
        skillIds: ["methods-tripod", "methods-prediction-validation"],
        platformLane: "methods",
      },
      {
        title: "Write up and submit",
        doThis:
          "Write the manuscript, complete the TRIPOD checklist, ensure data/code availability, and submit.",
        skillIds: [
          "prod-checklist-before-draft",
          "repro-data-availability-real",
          "prod-submission-checklist",
        ],
        platformLane: "submission",
      },
    ],
    deliverable:
      "A developed and externally validated prediction model with a TRIPOD-compliant manuscript and a usable risk tool.",
    estimatedEffort: "2-6 months (given data)",
  },

  // ═══════════════════════════════════════════════════════════ MAJOR TASKS
  {
    id: "major-respond-major-revision",
    title: "Respond to major revisions and win acceptance",
    scope: "major-task",
    goal:
      "Turn a major-revision decision into an acceptance with a complete, persuasive, navigable response.",
    whenToUse:
      "You received a major-revision (or reject-and-resubmit) decision and want to maximize the chance of acceptance.",
    steps: [
      {
        title: "Triage every comment",
        doThis:
          "Classify each comment as do / negotiate / decline; separate the editor's own asks from reviewer comments.",
        skillIds: ["revision-major", "revision-new-analysis-scope", "writing-respond-to-editor"],
        platformLane: "swarm",
      },
      {
        title: "Run the requested (and pre-emptive) analyses",
        doThis:
          "Do the cheap-and-strengthening analyses, add sensitivity analyses that answer the underlying worry, and document any new analysis as exploratory.",
        skillIds: ["revision-new-analysis-scope", "prod-anticipate-reviewers"],
        platformLane: "results",
      },
      {
        title: "Handle hostile and conflicting reviewers",
        doThis:
          "Steelman harsh comments, reconcile contradictory demands transparently, and disagree respectfully with evidence where the reviewer is wrong.",
        skillIds: [
          "revision-reviewer-2",
          "revision-conflicting-reviewers",
          "revision-disagree",
        ],
        platformLane: "swarm",
      },
      {
        title: "Write the rebuttal letter as a persuasive document",
        doThis:
          "Open with a change summary, respond point-by-point with quoted revised text and locations, and format so the editor can scan in minutes.",
        skillIds: [
          "revision-rebuttal-mastery",
          "revision-rebuttal-summary",
          "revision-point-by-point",
        ],
        platformLane: "submission",
      },
      {
        title: "Package and resubmit cleanly",
        doThis:
          "Prepare clean and tracked-changes files, sync the abstract/figures/checklists to the edits, and re-run the submission checklist.",
        skillIds: ["revision-track-changes", "prod-submission-checklist"],
        platformLane: "submission",
      },
    ],
    deliverable:
      "A complete point-by-point response letter and a revised, internally consistent manuscript ready to resubmit.",
    estimatedEffort: "1-6 weeks",
  },
  {
    id: "major-recover-from-rejection",
    title: "Recover from a rejection and resubmit elsewhere",
    scope: "major-task",
    goal:
      "Convert a rejection into a stronger submission at a better-fitting journal.",
    whenToUse:
      "Your manuscript was rejected and you need to decide what to fix and where to send it next.",
    steps: [
      {
        title: "Diagnose the rejection",
        doThis:
          "Separate desk/scope rejection from peer-review/substance rejection and decide what must change.",
        skillIds: ["prod-handle-rejection", "revision-resubmission-strategy"],
        platformLane: "scorecard",
      },
      {
        title: "Fix the legitimate science",
        doThis:
          "Implement valid reviewer fixes, add pre-emptive sensitivity analyses, and address any methods weakness.",
        skillIds: ["revision-new-analysis-scope", "prod-anticipate-reviewers"],
        platformLane: "results",
      },
      {
        title: "Appeal only a clear error",
        doThis:
          "If a review contains a demonstrable factual error worth contesting, write a measured appeal; otherwise move on.",
        skillIds: ["revision-appeal"],
        platformLane: "submission",
      },
      {
        title: "Reposition for the next journal",
        doThis:
          "Choose the next venue by fit and feasibility, reframe the abstract/significance and cover letter, and reformat to the new style.",
        skillIds: [
          "prod-journal-fit-strategy",
          "writing-significance-statement",
          "prod-cover-letter",
          "prod-presubmission-inquiry",
        ],
        platformLane: "journal-finder",
      },
    ],
    deliverable:
      "A repositioned, improved manuscript and a deliberate next-journal plan with cover letter.",
    estimatedEffort: "1-4 weeks",
  },
  {
    id: "major-causal-observational-analysis",
    title: "Make a defensible causal claim from observational data",
    scope: "major-task",
    goal:
      "Estimate an exposure-outcome effect that withstands confounding and bias scrutiny.",
    whenToUse:
      "You need more than an association — a causal effect estimate — from non-randomized data.",
    steps: [
      {
        title: "Specify the causal structure and estimand",
        doThis:
          "Draw a DAG to choose the adjustment set and define the estimand precisely.",
        skillIds: ["causal-dag", "stats-estimand"],
        platformLane: "methods",
      },
      {
        title: "Choose an identification strategy",
        doThis:
          "Pick propensity methods, instrumental variables, or target-trial emulation to suit the data and assumptions.",
        skillIds: ["causal-propensity", "causal-iv", "causal-target-trial"],
        platformLane: "methods",
      },
      {
        title: "Decompose effects and probe robustness",
        doThis:
          "Run mediation if mechanism matters, use negative controls to detect residual bias, and avoid the Table 2 fallacy.",
        skillIds: ["causal-mediation", "causal-negative-controls", "stats-dag-table-two"],
        platformLane: "results",
      },
      {
        title: "Report with calibrated causal language",
        doThis:
          "State assumptions transparently and scale the causal claim to what the design and sensitivity analyses support.",
        skillIds: ["discussion-avoid-spin", "discussion-evidence-to-recommendation"],
        platformLane: "discussion",
      },
    ],
    deliverable:
      "A causal effect estimate with a stated identification strategy, sensitivity analyses, and calibrated claims.",
    estimatedEffort: "3-8 weeks",
  },
  {
    id: "major-open-science-package",
    title: "Assemble a complete open-science package",
    scope: "major-task",
    goal:
      "Make the study reproducible and transparent: pre-registration, pipeline, environment, and honest availability statements.",
    whenToUse:
      "You want the analysis to be independently reproducible and to meet TOP/FAIR expectations.",
    steps: [
      {
        title: "Pre-register or run a Registered Report",
        doThis:
          "Pre-register hypotheses and the analysis plan, or pursue the two-stage Registered Report route for in-principle acceptance.",
        skillIds: ["repro-prereg", "repro-registered-report"],
        platformLane: "protocol",
      },
      {
        title: "Build a reproducible pipeline",
        doThis:
          "Script every transformation from raw data to outputs, separate raw/derived data, and map each table/figure to its script.",
        skillIds: ["repro-pipeline", "repro-code"],
        platformLane: "methods",
      },
      {
        title: "Freeze the computational environment",
        doThis:
          "Pin language/package versions, provide a lockfile or container, and test reproduction on a clean machine.",
        skillIds: ["repro-computational-env"],
        platformLane: "methods",
      },
      {
        title: "Write honest availability statements",
        doThis:
          "Deposit data/code with a DOI and write specific, actionable data and code availability statements.",
        skillIds: ["repro-data-availability-real", "repro-data-sharing"],
        platformLane: "submission",
      },
    ],
    deliverable:
      "A pre-registered study with an archived, reproducible pipeline, pinned environment, and credible availability statements.",
    estimatedEffort: "1-3 weeks of dedicated effort",
  },

  // ═══════════════════════════════════════════════════════════════ TASKS
  {
    id: "task-publication-ready-methods",
    title: "Write a publication-ready Methods section",
    scope: "task",
    goal:
      "Produce a Methods section a reader could replicate and a checklist reviewer would pass.",
    whenToUse:
      "You are drafting or tightening the Methods for any quantitative study.",
    steps: [
      {
        title: "Pick the guideline and structure",
        doThis:
          "Select the matching EQUATOR guideline/extension and structure the section to it (STROBE/CONSORT/etc.).",
        skillIds: ["repro-equator-select", "prod-equator-extension-select", "methods-strobe"],
        platformLane: "methods",
      },
      {
        title: "Specify design, participants, and variables",
        doThis:
          "State design and setting, write precise eligibility, and define every outcome, exposure, and covariate with measurement.",
        skillIds: ["methods-eligibility", "methods-data-collection"],
        platformLane: "methods",
      },
      {
        title: "Pre-specify the statistical plan",
        doThis:
          "State the estimand, the chosen test/model, multiplicity control, and the missing-data strategy.",
        skillIds: ["stats-estimand", "stats-choose-test", "methods-missing-data"],
        platformLane: "methods",
      },
      {
        title: "Make it reproducible",
        doThis:
          "Add software versions, seeds, and enough procedural detail that a colleague could re-execute it.",
        skillIds: ["methods-reproducible-protocol"],
        platformLane: "methods",
      },
    ],
    deliverable: "A complete, checklist-aligned, replicable Methods section.",
    estimatedEffort: "1-3 days",
  },
  {
    id: "task-results-section",
    title: "Write a clean Results section",
    scope: "task",
    goal:
      "Report findings objectively with effect sizes, CIs, and honest presentation of all outcomes.",
    whenToUse: "You have analyses done and need to write the Results.",
    steps: [
      {
        title: "Order and report objectively",
        doThis:
          "Follow the methods order, report primary then secondary outcomes, and keep interpretation out.",
        skillIds: ["results-no-interpretation", "results-report-all-outcomes"],
        platformLane: "results",
      },
      {
        title: "Report estimates with precision",
        doThis:
          "Give each effect with its CI and exact p, to SAMPL precision, and present subgroups honestly with interaction tests.",
        skillIds: [
          "results-effect-ci",
          "results-numbers-precision",
          "results-subgroup",
          "stats-report-sampl",
        ],
        platformLane: "results",
      },
      {
        title: "Build the supporting tables and figures",
        doThis:
          "Construct Table 1, choose table vs figure deliberately, and make every figure self-explanatory.",
        skillIds: ["results-table1", "figures-table-vs-figure", "fig-self-explanatory"],
        platformLane: "results",
      },
    ],
    deliverable: "A Results section with complete, precise, objectively reported findings.",
    estimatedEffort: "1-2 days",
  },
  {
    id: "task-craft-abstract-title",
    title: "Craft a title and abstract that survive screening",
    scope: "task",
    goal:
      "Produce a design-declaring title and a structured abstract whose conclusion matches the data.",
    whenToUse:
      "You are finalizing the front matter before submission or for a presubmission inquiry.",
    steps: [
      {
        title: "Write the title",
        doThis:
          "Write an informative, design-declaring title; strip hype and spin; optimize keywords for discoverability.",
        skillIds: ["title-informative", "title-avoid-spin", "title-keywords"],
        platformLane: "title",
      },
      {
        title: "Write the structured abstract",
        doThis:
          "Fill IMRaD sub-headings within the word budget, lead Results with effect sizes and CIs, and keep the conclusion proportionate.",
        skillIds: [
          "abstract-structured",
          "abstract-word-budget",
          "abstract-conclusion-match",
        ],
        platformLane: "title",
      },
      {
        title: "Add required extras",
        doThis:
          "Add trial registration (if applicable), a key-points box, and a plain-language summary where required.",
        skillIds: [
          "abstract-trial-registration",
          "abstract-keypoints",
          "abstract-lay-summary",
        ],
        platformLane: "title",
      },
    ],
    deliverable: "A discoverable title and a structured, spin-free abstract.",
    estimatedEffort: "Half a day",
  },
  {
    id: "task-write-significance-cover-letter",
    title: "Pitch the paper: significance statement and cover letter",
    scope: "task",
    goal:
      "Make the editor want to send the paper out by articulating why it matters and why it fits.",
    whenToUse:
      "You are preparing to submit and need the front-of-house persuasion right.",
    steps: [
      {
        title: "Sharpen the storyline and stakes",
        doThis:
          "Write the one-sentence spine, pass the 'so what?' test in the opening, and draft the significance statement.",
        skillIds: ["writing-storyline", "intro-so-what", "writing-significance-statement"],
        platformLane: "title",
      },
      {
        title: "Target the journal",
        doThis:
          "Choose the journal with a fit-and-feasibility matrix and, for high-impact venues, consider a presubmission inquiry.",
        skillIds: ["prod-journal-fit-strategy", "prod-presubmission-inquiry"],
        platformLane: "journal-finder",
      },
      {
        title: "Write the cover letter",
        doThis:
          "Draft a three-paragraph cover letter selling the fit and the single key finding, confirming originality and ethics.",
        skillIds: ["prod-cover-letter", "writing-grant-framing"],
        platformLane: "submission",
      },
    ],
    deliverable: "A significance statement and a targeted cover letter ready to accompany submission.",
    estimatedEffort: "Half a day",
  },
];

export function skillChainsByScope(): Record<ChainScope, SkillChain[]> {
  const map = {} as Record<ChainScope, SkillChain[]>;
  for (const chain of skillChains) {
    (map[chain.scope] ||= []).push(chain);
  }
  return map;
}

export function skillChainCount(): number {
  return skillChains.length;
}
