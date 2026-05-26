export type ResearchPhaseId =
  | "pre"
  | "intra"
  | "post"
  | "impact";

export type ResourceType = "template" | "checklist" | "example" | "video" | "guide" | "diagram";
export type ResourceLevel = "beginner" | "intermediate" | "advanced";

export type ResearchResource = {
  id: string;
  sectionId: string;
  title: string;
  type: ResourceType;
  level: ResourceLevel;
  description: string;
  standards?: string[];
  fileUrl?: string;
};

export type VideoSupplement = {
  id: string;
  sectionId: string;
  title: string;
  url?: string;
  level: ResourceLevel;
  description: string;
  duration?: string;
  status: "placeholder" | "active";
};

export type LifecycleSection = {
  id: string;
  phaseId: ResearchPhaseId;
  title: string;
  subtitle: string;
  learnWhy: string;
  commonMistake: string;
  example: string;
};

export type ResearchPhase = {
  id: ResearchPhaseId;
  label: string;
  description: string;
  sections: LifecycleSection[];
};

export type ProtocolStatus =
  | "not-started"
  | "needed"
  | "draft-available"
  | "uploaded"
  | "complete"
  | "needs-revision"
  | "not-applicable";

export type ProtocolReadinessItem = {
  id: string;
  label: string;
  requiredByStudyTypes: string[];
  status: ProtocolStatus;
  guidance: string;
  missingItems: string[];
  uploadedFile?: string;
  generatedDraft?: string;
};

export type JournalIndexingRecord = {
  journalName: string;
  issn?: string;
  eissn?: string;
  indexing: {
    webOfScience: "verified" | "unverified" | "unknown";
    scopus: "verified" | "unverified" | "unknown";
    pubMed: "verified" | "unverified" | "unknown";
    medline: "verified" | "unverified" | "unknown";
    pmc: "verified" | "unverified" | "unknown";
    saudiDigitalLibraryCategory?: string;
    doaj: "verified" | "unverified" | "unknown";
  };
  verificationSources: string[];
  lastChecked: string;
  redFlags: string[];
};

export type UploadedDataProfile = {
  fileId: string;
  name: string;
  columns: string[];
  variableTypes: Record<string, "numeric" | "categorical" | "date" | "text" | "unknown">;
  missingness: Record<string, number>;
  detectedRoles: Partial<Record<"id" | "outcome" | "exposure" | "group" | "time", string>>;
  warnings: string[];
  userConfirmedRoles?: Partial<Record<"id" | "outcome" | "exposure" | "group" | "time", string>>;
};

export type GeneratedOutput = {
  id: string;
  type: string;
  usedSources: string[];
  usedFiles: string[];
  humanReviewRequired: string[];
  originalityWarnings: string[];
  citationWarnings: string[];
  exportFormats: string[];
};

export const lifecyclePhases: ResearchPhase[] = [
  {
    id: "pre",
    label: "Pre-Research Workspace",
    description: "Move from idea to protocol-ready, ethics-ready, feasible research.",
    sections: [
      {
        id: "launch",
        phaseId: "pre",
        title: "Research Launch",
        subtitle: "Define your question, population, and feasibility path.",
        learnWhy: "A strong launch prevents weak methods and rejected submissions later.",
        commonMistake: "Starting drafting before defining outcomes, design, and ethics path.",
        example: "PICO-ready objective + feasibility score + next-best actions.",
      },
      {
        id: "pre-protocol",
        phaseId: "pre",
        title: "Protocol / Proposal Readiness",
        subtitle: "Track all protocol-critical documents before drafting.",
        learnWhy: "Complete protocol packages reduce revision loops and compliance risk.",
        commonMistake: "Missing SAP, data dictionary, or registration planning.",
        example: "Status ladder + missing-item extraction + skeleton generation.",
      },
    ],
  },
  {
    id: "intra",
    label: "Intra-Research Manuscript",
    description: "Convert evidence, data, and methods into a manuscript.",
    sections: [
      {
        id: "intra-manuscript",
        phaseId: "intra",
        title: "Manuscript Builder",
        subtitle: "Section-by-section drafting with reporting guidance.",
        learnWhy: "Guideline-aware drafting improves acceptance probability.",
        commonMistake: "Overclaiming conclusions without aligned results.",
        example: "Structured Introduction/Methods/Results/Discussion with evidence checks.",
      },
      {
        id: "intra-results-lab",
        phaseId: "intra",
        title: "Analysis & Results Lab",
        subtitle: "Upload data, infer variables, produce manuscript-ready outputs.",
        learnWhy: "Data understanding and transparency are central to credible results.",
        commonMistake: "Reporting p-values without effect sizes and confidence intervals.",
        example: "Baseline table, model output, narrative interpretation, and caveats.",
      },
    ],
  },
  {
    id: "post",
    label: "Post-Research Submission",
    description: "Prepare a complete and journal-compliant submission package.",
    sections: [
      {
        id: "post-journals",
        phaseId: "post",
        title: "Target Journals & Indexation",
        subtitle: "Compare fit, indexing, and requirements with official verification.",
        learnWhy: "Scope mismatch and indexing confusion are major rejection drivers.",
        commonMistake: "Trusting journal marketing claims without official source checks.",
        example: "WoS/Scopus/NLM/SDl verification matrix with red-flag warnings.",
      },
      {
        id: "post-quality",
        phaseId: "post",
        title: "Quality & Excellence Gate",
        subtitle: "Final readiness scan before submission.",
        learnWhy: "Final QA catches critical issues before editors and reviewers do.",
        commonMistake: "Submitting with incomplete declarations or checklist gaps.",
        example: "Ready / Minor / Major / Not ready verdict + fix plan.",
      },
    ],
  },
  {
    id: "impact",
    label: "Post-Publication Impact",
    description: "Turn publication into educational and practical research impact.",
    sections: [
      {
        id: "impact-studio",
        phaseId: "impact",
        title: "Impact Studio",
        subtitle: "Create social posts, lay summaries, conference materials, and posters.",
        learnWhy: "Visibility improves citations, collaboration, and real-world uptake.",
        commonMistake: "Overstating findings in outreach content.",
        example: "LinkedIn post + 100-word lay summary + A4 poster scaffold.",
      },
    ],
  },
];

export const learningResources: ResearchResource[] = [
  {
    id: "res-idea-sheet",
    sectionId: "launch",
    title: "Research Idea Worksheet",
    type: "template",
    level: "beginner",
    description: "Turn a broad idea into a specific, answerable research objective.",
    standards: ["EQUATOR", "ICMJE"],
  },
  {
    id: "res-pico",
    sectionId: "launch",
    title: "PICO / PECO / SPIDER Worksheet",
    type: "template",
    level: "beginner",
    description: "Framework-driven question builder for interventional and observational work.",
    standards: ["PRISMA", "CONSORT", "STROBE"],
  },
  {
    id: "res-protocol-template",
    sectionId: "pre-protocol",
    title: "Protocol Template (Study Design Aware)",
    type: "template",
    level: "intermediate",
    description: "Editable skeleton covering objective, methods, ethics, and dissemination.",
    standards: ["SPIRIT", "PRISMA-P", "STROBE"],
  },
  {
    id: "res-data-dictionary",
    sectionId: "intra-results-lab",
    title: "Data Dictionary Template",
    type: "template",
    level: "intermediate",
    description: "Define variables, coding, units, and missing-data handling rules.",
    standards: ["TRIPOD", "STROBE"],
  },
  {
    id: "res-checklist-pack",
    sectionId: "post-quality",
    title: "Journal-Ready Checklist Pack",
    type: "checklist",
    level: "intermediate",
    description: "Item-by-item mapping from manuscript content to guideline criteria.",
    standards: ["CONSORT", "PRISMA", "STROBE", "ICMJE"],
  },
  {
    id: "res-visibility-plan",
    sectionId: "impact-studio",
    title: "Post-Publication Visibility Timeline",
    type: "guide",
    level: "beginner",
    description: "What to share at acceptance, publication, and conference milestones.",
    standards: ["Springer Nature", "Elsevier", "PLOS"],
  },
];

export const videoSupplements: VideoSupplement[] = [
  {
    id: "vid-launch",
    sectionId: "launch",
    title: "Research Launch Full Demonstration",
    level: "beginner",
    description: "Step-by-step onboarding from research idea to feasible study roadmap.",
    duration: "TBD",
    status: "placeholder",
  },
  {
    id: "vid-protocol",
    sectionId: "pre-protocol",
    title: "Protocol & Proposal Readiness Walkthrough",
    level: "beginner",
    description: "How to complete protocol-critical files and avoid common review blockers.",
    duration: "TBD",
    status: "placeholder",
  },
  {
    id: "vid-results-lab",
    sectionId: "intra-results-lab",
    title: "Results Data Lab Demonstration",
    level: "intermediate",
    description: "Upload datasets, validate variables, and generate manuscript-ready results.",
    duration: "TBD",
    status: "placeholder",
  },
  {
    id: "vid-indexation",
    sectionId: "post-journals",
    title: "Journal Indexing Verification Demonstration",
    level: "intermediate",
    description: "Verify WoS/Scopus/NLM/SDl status from official sources.",
    duration: "TBD",
    status: "placeholder",
  },
  {
    id: "vid-impact",
    sectionId: "impact-studio",
    title: "Post-Publication Impact Studio Demonstration",
    level: "beginner",
    description: "Create social posts, lay summaries, and conference assets responsibly.",
    duration: "TBD",
    status: "placeholder",
  },
];
