export type ManuscriptSection =
  | "title"
  | "abstract"
  | "introduction"
  | "methods"
  | "results"
  | "discussion"
  | "conclusion"
  | "references";

export type GuidelineSource = "EQUATOR" | "Official" | "Custom";

export type Guideline = {
  id: string;
  name: string;
  acronym: string;
  versionOrYear?: string;
  source: GuidelineSource;
  officialUrl: string;
  appliesTo: string[];
  manuscriptSections: ManuscriptSection[];
  checklistPrompts: Partial<Record<ManuscriptSection, string[]>>;
  extensions?: string[];
  notes?: string;
};

export type ChecklistCoverage = {
  item: string;
  status: "covered" | "partial" | "missing";
  comment?: string;
};

export type LLMRefineResponse = {
  refinedText: string;
  checklistCoverage: ChecklistCoverage[];
  missingInformation: string[];
  riskWarnings: string[];
  claimsNeedingCitation: string[];
  suggestedSearchQueries: string[];
  /** Language-editing improvements applied by default (clarity, flow, register). */
  languageNotes?: string[];
  /** Cross-section coherence observations (design/claims/objective consistency). */
  coherenceNotes?: string[];
  confidence: "high" | "medium" | "low";
};

/* ============================================================
   v2 — Design registry
   ============================================================ */

export type DesignCategory =
  | "interventional"
  | "observational"
  | "synthesis"
  | "protocol"
  | "diagnostic_prognostic_prediction"
  | "case_reports"
  | "guidelines_consensus"
  | "qualitative_mixed"
  | "preclinical"
  | "quality_implementation"
  | "economic"
  | "genetics_omics";

export type GuidelineRef = {
  acronym: string;          // "CONSORT 2025"
  fullName: string;
  year?: string;
  officialUrl: string;
  equatorUrl?: string;
  pdfUrl?: string;
  citation?: string;
  deprecated?: boolean;
  successorAcronym?: string;
};

export type SupportingDocument = {
  id: string;                // "consort-flow"
  name: string;              // "CONSORT 2025 flow diagram"
  description: string;
  url?: string;              // official PDF / template
  whenRequired?: string;     // "always for RCTs"
};

export type Extension = {
  acronym: string;
  fullName: string;
  whenToUse: string;          // condition for triggering
  officialUrl?: string;
};

export type DesignSpec = {
  id: string;                 // "interv.rct.parallel"
  category: DesignCategory;
  name: string;               // user-facing
  shortLabel: string;         // for pickers
  primaryGuideline: GuidelineRef;
  legacyGuidelines?: GuidelineRef[];   // older versions kept with deprecated:true
  whenToUseChecklist: string[];        // criteria checklist — "is this really X?"
  manuscriptSections: ManuscriptSection[];
  reportingChecklist: Partial<Record<ManuscriptSection, string[]>>;
  supportingDocuments: SupportingDocument[];
  commonExtensions: Extension[];
  pitfalls: string[];
  appliesTo: string[];        // keywords for fuzzy matching
};

/* ============================================================
   v2 — Journal / publisher registry
   ============================================================ */

export type ReferenceFormat =
  | "vancouver-superscript"
  | "vancouver-numbered-parens"
  | "vancouver-numbered-brackets"
  | "ama-numbered"
  | "apa-7"
  | "harvard"
  | "nature-superscript"
  | "elsevier-numbered";

export type AbstractStructure =
  | "background-methods-results-conclusions"
  | "introduction-methods-results-discussion"
  | "question-findings-meaning"        // JAMA Key Points
  | "objective-design-setting-participants-outcomes-results-conclusions"
  | "unstructured"
  | "custom";

export type ManuscriptType =
  | "research_article"
  | "original_investigation"
  | "brief_report"
  | "research_letter"
  | "case_report"
  | "review"
  | "systematic_review"
  | "meta_analysis"
  | "protocol"
  | "viewpoint"
  | "editorial"
  | "correspondence";

export type ManuscriptTypeSpec = {
  type: ManuscriptType;
  mainTextWordLimit?: number;
  abstractWordLimit?: number;
  referencesMax?: number;
  displayItemsMax?: number;       // figures + tables combined
  keywordsMin?: number;
  keywordsMax?: number;
  keyPointsRequired?: boolean;
};

export type JournalSpec = {
  id: string;                     // "bmj"
  name: string;
  publisher: string;
  homepage: string;
  authorGuideUrl: string;
  reviewerGuideUrl?: string;
  editorGuideUrl?: string;
  impactFactor?: number;
  scope?: string;
  manuscriptTypes: ManuscriptTypeSpec[];
  defaultManuscriptType: ManuscriptType;
  abstractStructure: AbstractStructure;
  abstractCustomSections?: string[];
  referenceStyle: {
    format: ReferenceFormat;
    authorListing: "all-up-to-3-etal" | "all-up-to-6-etal" | "all-up-to-5-etal" | "first-author-etal" | "all";
    journalAbbrev: "index-medicus" | "full-name" | "either";
    doiRequired: boolean;
    urlsAllowed: boolean;
    notes?: string;
  };
  figures: {
    format: "editable" | "redrawn-inhouse" | "high-res-image";
    minDpi?: number;
    allowedTypes: string[];        // ["TIFF","EPS","PDF"]
    captionLocation: "below-figure" | "separate-page" | "end-of-manuscript";
    notes?: string;
  };
  tables: {
    format: "editable-word" | "image" | "either";
    location: "in-text" | "end-of-manuscript" | "separate-file";
    notes?: string;
  };
  required: {
    icmjeAuthorship: boolean;
    ppiStatement: boolean;
    dataSharingStatement: boolean;
    fundingStatement: boolean;
    coiStatement: boolean;
    creditTaxonomy: boolean;
    registrationStatement: boolean;
    aiDisclosure: boolean;          // ICMJE 2026
    ethicsStatement: boolean;
    consentStatement: boolean;
  };
  reviewerLens: string[];           // prompt fragments — "what would a reviewer for this journal flag?"
  editorLens: string[];             // prompt fragments — "what would the editor desk-reject for?"
  tier: "A" | "B" | "C";            // A=fully encoded, B=publisher template, C=fetched
  notes?: string;
};

/* ============================================================
   v2 — Feature registry
   ============================================================ */

export type FeatureCategory =
  | "ai_ml"
  | "population_equity"
  | "specialty"
  | "methods"
  | "intervention_description"
  | "patient_public"
  | "open_science"
  | "harms_safety"
  | "implementation_qi"
  | "decentralized_digital";

/**
 * Real-world evidence that a feature is genuinely used in the published
 * literature. We deliberately avoid hard-coding specific DOIs (which risk going
 * stale or being mis-cited): `verifyUrl` is a LIVE PubMed/EQUATOR query that
 * returns the actual articles that used this reporting guideline/feature, so a
 * user can confirm the evidence themselves. `publishedUse`, when present, is a
 * verified landmark citation. Only features with evidence are surfaced as
 * "evidence-backed"; `forthcoming` marks guidelines still under development
 * (no published use yet) so we never overstate.
 */
export type FeatureEvidence = {
  /** Concrete "you'd use this when…" scenario (first-party guidance). */
  exampleOfUse: string;
  /** Live, verifiable search returning published articles that used this. */
  verifyUrl: string;
  /** Optional verified landmark citation (statement or exemplar use). */
  publishedUse?: string;
  /** Maturity of the guideline's real-world adoption. */
  status: "established" | "emerging" | "forthcoming";
};

export type FeatureSpec = {
  id: string;                       // "ai.tripod-ai"
  category: FeatureCategory;
  name: string;
  description: string;
  addExtensions?: Extension[];      // guidelines this triggers
  addChecklistItems?: Partial<Record<ManuscriptSection, string[]>>;
  addSupportingDocs?: SupportingDocument[];
  agentHints: string[];             // prompt fragments injected into LLM context
  recommendedFor?: string[];        // design ids that this is most useful with
  evidence?: FeatureEvidence;       // real-world, verifiable usage evidence
};

/* ============================================================
   v2 — Research-type answers (new schema)
   ============================================================ */

export type ResearchTypeAnswersV2 = {
  // v2 fields
  designId?: string;                 // e.g. "interv.rct.parallel"
  manuscriptType?: ManuscriptType;
  journalId?: string;                // "bmj" or "other:My Journal Name"
  featureIds?: string[];             // selected features
  notes?: string;
  expandedNotes?: ExpandedNotes;
  // v1 compatibility — keep optional so old projects open
  designFamily?: string;
  isOriginalResearch?: boolean;
  isProtocol?: boolean;
  isReview?: boolean;
  isCaseReport?: boolean;
  isGuideline?: boolean;
  isQualityImprovement?: boolean;
  isEconomic?: boolean;
  isAnimal?: boolean;
  isQualitative?: boolean;
  isMixedMethods?: boolean;
  hasHumanParticipants?: boolean;
  ethicsRequired?: boolean;
  registrationRequired?: boolean;
  features?: string[];
  targetJournal?: string;
};

export type ExpandedNotes = {
  population?: string;
  condition?: string;
  intervention?: string;
  exposure?: string;
  comparator?: string;
  primaryOutcome?: string;
  secondaryOutcomes?: string[];
  setting?: string;
  country?: string;
  timePeriod?: string;
  sampleSize?: string;
  dataSource?: string;
  ethicsApproval?: string;
  registration?: string;
  funding?: string;
  conflictsDetected?: string[];     // inconsistencies between design and notes
  clarifyingQuestions?: string[];   // surfaced as chips
  confidence: "high" | "medium" | "low";
};

/* ============================================================
   v2 — Context Bundle (single source of truth for downstream LLM calls)
   ============================================================ */

export type ContextBundle = {
  design?: {
    id: string;
    name: string;
    primaryGuideline: GuidelineRef;
    activeExtensions: Extension[];
    pitfalls: string[];
  };
  journal?: {
    id: string;
    name: string;
    referenceFormat: ReferenceFormat;
    abstractStructure: AbstractStructure;
    mainTextWordLimit?: number;
    abstractWordLimit?: number;
    keyPointsRequired?: boolean;
    reviewerLens: string[];
    editorLens: string[];
    required: JournalSpec["required"];
    manuscriptType?: ManuscriptType;
    tier: "A" | "B" | "C";
  };
  features?: Array<{
    id: string;
    name: string;
    agentHints: string[];
  }>;
  expandedNotes?: ExpandedNotes;
  rawNotes?: string;
};

/* ============================================================
   Existing v1 types — kept
   ============================================================ */

export type ResearchTypeAnswers = ResearchTypeAnswersV2;     // alias to keep v1 API surface

export type ResearchTypeResult = {
  primaryGuidelineId: string;       // design id in v2 OR legacy guideline id
  primaryGuidelineName: string;
  possibleExtensionIds: string[];
  requiredSections: ManuscriptSection[];
  sectionChecklists: Partial<Record<ManuscriptSection, string[]>>;
  warnings: string[];
  notes: string;
  // v2 enrichments
  designId?: string;
  supportingDocuments?: SupportingDocument[];
  pitfalls?: string[];
  whenToUseChecklist?: string[];
};

export type TitleInputs = {
  researchType?: string;
  population?: string;
  problem?: string;
  intervention?: string;
  comparator?: string;
  outcome?: string;
  setting?: string;
  design?: string;
  timePeriod?: string;
  draftTitle?: string;
};

export type TitleCandidate = {
  text: string;
  rationale: string;
  warnings: string[];
};

export type NoveltyRisk =
  | "low_duplicate_risk"
  | "moderate_similarity_risk"
  | "high_duplicate_risk"
  | "exact_or_near_exact_match";

export type SimilarPaper = {
  title: string;
  authors?: string[];
  journal?: string;
  year?: string;
  pmid?: string;
  doi?: string;
  url?: string;
  source: "pubmed" | "crossref" | "openalex" | "web";
  similarity: "exact" | "near" | "keyword" | "semantic";
  whySimilar: string;
};

export type NoveltyReport = {
  risk: NoveltyRisk;
  exactMatches: SimilarPaper[];
  similar: SimilarPaper[];
  queriesUsed: { source: string; query: string }[];
  gapsRemaining: string[];
  refinementSuggestions: string[];
  disclaimer: string;
};

export type ParsedReference = {
  title?: string;
  authors?: string[];
  journal?: string;
  year?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  pmid?: string;
};

export type ReferenceVerification = {
  originalText: string;
  parsed: ParsedReference;
  pubmed?: {
    found: boolean;
    pmid?: string;
    title?: string;
    journal?: string;
    year?: string;
    doi?: string;
    authors?: string[];
    url?: string;
  };
  crossref?: {
    found: boolean;
    doi?: string;
    title?: string;
    journal?: string;
    year?: string;
    authors?: string[];
    score?: number;
    url?: string;
  };
  openalex?: {
    found: boolean;
    id?: string;
    title?: string;
    journal?: string;
    year?: string;
    doi?: string;
    pmid?: string;
    url?: string;
  };
  europepmc?: {
    found: boolean;
    source?: string;
    title?: string;
    journal?: string;
    year?: string;
    doi?: string;
    pmid?: string;
    pmcid?: string;
    isPreprint?: boolean;
    isOpenAccess?: boolean;
    url?: string;
  };
  semanticscholar?: {
    found: boolean;
    paperId?: string;
    title?: string;
    venue?: string;
    year?: string;
    doi?: string;
    pmid?: string;
    influentialCitationCount?: number;
    citationCount?: number;
    tldr?: string;
    openAccessPdfUrl?: string;
    url?: string;
  };
  unpaywall?: {
    found: boolean;
    isOA?: boolean;
    oaStatus?: string;
    bestOaPdfUrl?: string;
    bestOaLandingUrl?: string;
  };
  checks: {
    pubmedIndexed: boolean | "unknown";
    doiResolved: boolean | "unknown";
    metadataMatch: "match" | "partial" | "mismatch" | "unknown";
    duplicate: boolean;
    possibleRetractionOrConcern: boolean | "unknown";
    openAccess?: boolean | "unknown";
    inOpenAlex?: boolean | "unknown";
    inEuropePMC?: boolean | "unknown";
    inSemanticScholar?: boolean | "unknown";
    isPreprint?: boolean | "unknown";
  };
  confidence: "high" | "medium" | "low";
  problems: string[];
  correctedCitationVancouver?: string;
};

export type AppendixSection = {
  id: string;
  kind: "questionnaire" | "instrument" | "supplementary" | "other";
  title: string;
  content: string;
};

/* ============================================================
   v2.2 — Research launch (pre-research preparation)
   ============================================================ */

export type YesNoMaybe = "yes" | "no" | "partial";
export type DurationBucket = "lt1m" | "1to3m" | "3to6m" | "6to12m" | "gt12m";

export type ResearchLaunchAnswers = {
  // Team & leadership
  hasTeam?: YesNoMaybe;
  teamSize?: number;
  hasPI?: YesNoMaybe;
  piName?: string;
  hasSeniorResearcher?: YesNoMaybe;
  hasLeader?: YesNoMaybe;
  leaderRole?: "PI" | "senior" | "first-author" | "consultant" | "other";
  rolesAssigned?: boolean;

  // Authorship
  firstAuthorDecided?: boolean;
  firstAuthorName?: string;
  authorshipOrderAgreed?: boolean;
  icmjeReviewed?: boolean;
  correspondingAuthorDecided?: boolean;

  // Research type & pre-requirements
  researchTypeKnown?: boolean;
  researchTypeNote?: string;
  irbStatus?: "approved" | "submitted" | "not-required" | "not-started";
  irbNumber?: string;
  dataStatus?: "collected-clean" | "collected-raw" | "in-collection" | "secondary-available" | "not-started";
  questionnaireStatus?: "validated" | "draft" | "not-needed" | "not-started";
  registrationStatus?: "registered" | "in-progress" | "not-required" | "not-started";
  registrationId?: string;
  consentStatus?: "obtained" | "in-progress" | "not-required" | "not-started";

  // Budget & funding
  budgetPlanned?: boolean;
  estimatedBudgetUSD?: number;
  fundingSecured?: YesNoMaybe;
  budgetItems?: {
    apc?: boolean;              // article processing charge / open access
    submissionFees?: boolean;
    languageEdit?: boolean;     // English editing
    statisticsConsult?: boolean;
    figureDesign?: boolean;
    plagiarismCheck?: boolean;
    referenceManager?: boolean;
    softwareLicenses?: boolean; // SPSS, REDCap, etc
    transcription?: boolean;    // qualitative
    travelConferences?: boolean;
    irbFees?: boolean;
    reprints?: boolean;
  };

  // Journal & format
  targetJournalKnown?: boolean;
  targetJournalName?: string;
  manuscriptTypeKnown?: boolean;

  // Methodology readiness
  statisticianAvailable?: YesNoMaybe | "external";
  analysisPlanReady?: boolean;
  outcomeMeasuresDefined?: boolean;
  sampleSizeJustified?: boolean;

  // Tools & compliance
  referenceManagerReady?: boolean;
  coiDisclosed?: boolean;
  aiUsePolicyReviewed?: boolean;
  dataSharingPlanned?: boolean;

  // Timeline
  durationTarget?: DurationBucket;
  hasHardDeadline?: boolean;
  deadlineDate?: string;

  // Additional context
  notes?: string;
  completedAt?: string;
};

export type LaunchReadinessSummary = {
  totalScore: number;             // 0–100
  pillarScores: {
    team: number;
    authorship: number;
    prereqs: number;
    budget: number;
    methodology: number;
    journalAndTimeline: number;
  };
  acceleratingFactors: string[];
  deceleratingFactors: string[];
  recommendedDesigns: string[];
  recommendationRationale: string;
  blockers: string[];
};

export type ProjectState = {
  version: string;
  createdAt: string;
  updatedAt: string;
  researchLaunch?: ResearchLaunchAnswers;
  researchTypeAnswers: ResearchTypeAnswersV2;
  researchTypeResult?: ResearchTypeResult;
  titleInputs: TitleInputs;
  titleFinal?: string;
  titleCandidates: TitleCandidate[];
  noveltyReport?: NoveltyReport;
  sections: {
    introduction: string;
    methods: string;
    results: string;
    discussion: string;
    conclusion: string;
  };
  sectionFeedback: Partial<Record<
    "introduction" | "methods" | "results" | "discussion" | "conclusion",
    LLMRefineResponse
  >>;
  references: {
    raw: string;
    verifications: ReferenceVerification[];
  };
  appendices?: AppendixSection[];
  /** Journal submission tracker — selection → submission → peer review → publication. */
  submissions?: SubmissionRecord[];
};

/* ============================================================
   v3.9 — Submission pipeline (journal selection → publication)
   ============================================================ */

export type SubmissionStatus =
  | "shortlisted"
  | "formatting"
  | "submitted"
  | "under_review"
  | "major_revision"
  | "minor_revision"
  | "accepted"
  | "rejected"
  | "withdrawn"
  | "published";

export type SubmissionEvent = {
  /** Status entered. */
  status: SubmissionStatus;
  /** ISO date the status was recorded. */
  at: string;
  note?: string;
};

export type SubmissionRecord = {
  id: string;
  journalName: string;
  /** Journal Finder id when the journal came from the dataset. */
  journalId?: string;
  status: SubmissionStatus;
  /** Full status history, oldest first — powers the timeline + duration stats. */
  history: SubmissionEvent[];
  notes?: string;
  /** Manuscript/tracking id assigned by the journal's submission system. */
  manuscriptId?: string;
  createdAt: string;
  updatedAt: string;
};

export const emptyProject = (): ProjectState => ({
  version: "2.2.0",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  researchTypeAnswers: { featureIds: [] },
  titleInputs: {},
  titleCandidates: [],
  sections: {
    introduction: "",
    methods: "",
    results: "",
    discussion: "",
    conclusion: "",
  },
  sectionFeedback: {},
  references: { raw: "", verifications: [] },
  appendices: [],
  submissions: [],
});
