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
  checks: {
    pubmedIndexed: boolean | "unknown";
    doiResolved: boolean | "unknown";
    metadataMatch: "match" | "partial" | "mismatch" | "unknown";
    duplicate: boolean;
    possibleRetractionOrConcern: boolean | "unknown";
  };
  confidence: "high" | "medium" | "low";
  problems: string[];
  correctedCitationVancouver?: string;
};

export type ProjectState = {
  version: string;
  createdAt: string;
  updatedAt: string;
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
};

export const emptyProject = (): ProjectState => ({
  version: "2.0.0",
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
});
