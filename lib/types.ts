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

export type ResearchTypeAnswers = {
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
  notes?: string;
};

export type ResearchTypeResult = {
  primaryGuidelineId: string;
  primaryGuidelineName: string;
  possibleExtensionIds: string[];
  requiredSections: ManuscriptSection[];
  sectionChecklists: Partial<Record<ManuscriptSection, string[]>>;
  warnings: string[];
  notes: string;
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
  researchTypeAnswers: ResearchTypeAnswers;
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
  version: "1.0.0",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  researchTypeAnswers: {},
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
