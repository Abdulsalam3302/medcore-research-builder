export const GLOBAL_SYSTEM = `You are a medical research reporting assistant. You help refine research manuscripts according to international reporting guidelines (EQUATOR Network).

Hard rules — never violate:
- You must NOT fabricate data, references, PMIDs, DOIs, citations, outcomes, p-values, confidence intervals, sample sizes, effect estimates, or clinical claims.
- If information is missing, ask for it OR list it under "missingInformation". Do NOT invent it.
- Keep claims proportional to the study design. Observational data cannot prove causation; a single case cannot establish prevalence; an unreplicated finding is not conclusive.
- Prefer transparent, neutral scientific writing in active voice where appropriate.
- Do not promise "novelty", "first ever", or "unique" unless the user supplies strong evidence (e.g., a low-duplicate-risk novelty report).
- Always respect reporting-guideline structure for the user's chosen study design.

Output format — when the user asks for structured output, return ONLY valid JSON matching the schema they provide. No prose before or after. No markdown code fences.`;

export const REFINE_SECTION_SCHEMA = `Schema to return EXACTLY:
{
  "refinedText": "string",
  "checklistCoverage": [{"item": "string", "status": "covered|partial|missing", "comment": "string"}],
  "missingInformation": ["string"],
  "riskWarnings": ["string"],
  "claimsNeedingCitation": ["string"],
  "suggestedSearchQueries": ["string"],
  "confidence": "high|medium|low"
}`;

export function refineSectionPrompt(args: {
  section: string;
  guidelineName: string;
  checklist: string[];
  draft: string;
  contextNotes?: string;
}) {
  return `Refine the manuscript ${args.section} below according to ${args.guidelineName}.

Reporting-guideline checklist items for this section (paraphrased):
${args.checklist.map((c, i) => `${i + 1}. ${c}`).join("\n") || "(none configured)"}

Additional context provided by the author:
${args.contextNotes || "(none)"}

Author's current draft:
"""
${args.draft || "(empty)"}
"""

Tasks:
1. Rewrite the section in clear, scientific English suitable for a medical journal, preserving every fact the author provided. Do not invent numbers, citations, or outcomes.
2. Reorganize content into the logical structure expected by the guideline.
3. For each checklist item, mark whether it is covered, partial, or missing. If missing, list it under missingInformation.
4. Flag any claims that need a citation under claimsNeedingCitation.
5. Suggest specific PubMed / Crossref search queries the author could run to find supporting evidence.
6. Warn about any overstatement, causal language unsupported by the design, or methodological red flags.

${REFINE_SECTION_SCHEMA}

Return ONLY the JSON object.`;
}

export function refineTitlePrompt(args: {
  inputs: {
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
  mode: "generate" | "refine";
}) {
  const i = args.inputs;
  return `${args.mode === "refine" ? "Refine" : "Generate"} candidate manuscript titles based on the inputs below.

Inputs:
- Research type: ${i.researchType || "(unspecified)"}
- Study design: ${i.design || "(unspecified)"}
- Population: ${i.population || "(unspecified)"}
- Condition / problem: ${i.problem || "(unspecified)"}
- Intervention / exposure / index test / model / theme: ${i.intervention || "(unspecified)"}
- Comparator: ${i.comparator || "(unspecified)"}
- Primary outcome: ${i.outcome || "(unspecified)"}
- Setting / country: ${i.setting || "(unspecified)"}
- Time period: ${i.timePeriod || "(unspecified)"}
- Author's draft title: ${i.draftTitle || "(none)"}

Rules:
- Be concise but complete.
- Include the study design when appropriate (e.g., "randomized controlled trial", "systematic review and meta-analysis", "retrospective cohort study", "diagnostic accuracy study", "case report").
- Include population, intervention/exposure, comparator (if any), and outcome when appropriate.
- Avoid "novel", "first", "unique", "unprecedented" unless the user has supplied strong evidence; default to NOT using these terms.
- Avoid vague words like "impact" without specifying the outcome.
- Avoid causal language that the design does not support.
- Prefer clear medical terminology.

Return ONLY this JSON:
{
  "candidates": [
    {"text": "string", "rationale": "string", "warnings": ["string"]}
  ]
}
Provide 4 to 6 candidates, ordered from strongest to weakest.`;
}

export function researchTypePrompt(args: {
  answers: Record<string, unknown>;
  guidelineCatalog: Array<{ id: string; acronym: string; appliesTo: string[] }>;
}) {
  return `Based on the author's answers below, recommend the most appropriate primary reporting guideline and any relevant extensions. You MUST pick one primary guideline id from the catalog.

Catalog (id — acronym — applies to):
${args.guidelineCatalog.map((g) => `- ${g.id} — ${g.acronym} — ${g.appliesTo.join(", ")}`).join("\n")}

Author answers (JSON):
${JSON.stringify(args.answers, null, 2)}

Return ONLY this JSON:
{
  "primaryGuidelineId": "string (must be one of the ids above)",
  "primaryGuidelineName": "string (acronym/name)",
  "possibleExtensionIds": ["string"],
  "warnings": ["string (e.g., conflicts between design and stated features)"],
  "notes": "string (brief rationale)"
}`;
}

export function parseReferencesPrompt(rawText: string) {
  return `Parse the following pasted references into structured records. Preserve the original raw string for each reference. Do not invent fields. If a field is missing, leave it as null. Detect DOIs (10.xxxx/...) and PMIDs (8-digit number) when present.

Pasted references (may be Vancouver, AMA, APA, RIS-like, raw text, DOI list, or PMID list):
"""
${rawText}
"""

Return ONLY this JSON:
{
  "references": [
    {
      "originalText": "string",
      "parsed": {
        "title": "string|null",
        "authors": ["string"] | null,
        "journal": "string|null",
        "year": "string|null",
        "volume": "string|null",
        "issue": "string|null",
        "pages": "string|null",
        "doi": "string|null",
        "pmid": "string|null"
      }
    }
  ]
}`;
}

export function finalReportPrompt(args: {
  project: unknown;
}) {
  return `Produce a final compliance report for the manuscript project below. Use only data present in the project — do not invent results or references.

Project (JSON):
${JSON.stringify(args.project, null, 2)}

Return ONLY this JSON:
{
  "summary": "string (2-4 sentence overview)",
  "researchType": "string",
  "primaryGuideline": "string",
  "extensions": ["string"],
  "titleQualityScore": "low|medium|high",
  "titleNotes": ["string"],
  "noveltyRisk": "low_duplicate_risk|moderate_similarity_risk|high_duplicate_risk|exact_or_near_exact_match|unknown",
  "sectionScores": [
    {"section": "introduction|methods|results|discussion|conclusion", "coverage": "low|medium|high", "missing": ["string"]}
  ],
  "criticalIssues": ["string"],
  "overstatementWarnings": ["string"],
  "ethicsRegistrationWarnings": ["string"],
  "referenceSummary": {
    "total": 0,
    "pubmedIndexed": 0,
    "doiVerified": 0,
    "mismatches": 0,
    "duplicates": 0,
    "notFound": 0,
    "possibleRetractionOrConcern": 0
  },
  "finalRecommendations": ["string"]
}`;
}
