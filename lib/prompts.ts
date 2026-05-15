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
  contextBlock?: string;            // Context Bundle prompt block
  journalHints?: string[];          // journal-style fragments
}) {
  const ctx = args.contextBlock ? `\n\n${args.contextBlock}\n` : "";
  const jh =
    args.journalHints && args.journalHints.length
      ? `\nJOURNAL STYLE HINTS:\n${args.journalHints.map((h) => "- " + h).join("\n")}\n`
      : "";
  return `Refine the manuscript ${args.section} below according to ${args.guidelineName}.${ctx}${jh}

Reporting-guideline checklist items for this section (paraphrased):
${args.checklist.map((c, i) => `${i + 1}. ${c}`).join("\n") || "(none configured)"}

Additional context provided by the author:
${args.contextNotes || "(none)"}

Author's current draft:
"""
${args.draft || "(empty)"}
"""

Tasks:
1. Rewrite the section in clear, scientific English suitable for the target journal, preserving every fact the author provided. Apply the journal style (reference format, abstract structure, key points, word budget) when relevant to this section. Do not invent numbers, citations, or outcomes.
2. Reorganize content into the logical structure expected by the guideline + the journal's preferred sectioning.
3. For each checklist item, mark whether it is covered, partial, or missing. If missing, list it under missingInformation.
4. Flag any claims that need a citation under claimsNeedingCitation.
5. Suggest specific PubMed / Crossref search queries the author could run to find supporting evidence.
6. Warn about any overstatement, causal language unsupported by the design, or methodological red flags — and any failure to satisfy journal-specific requirements (e.g., PPI statement, data sharing, Key Points).

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
  contextBlock?: string;
  journalHints?: string[];
}) {
  const i = args.inputs;
  const ctx = args.contextBlock ? `\n\n${args.contextBlock}\n` : "";
  const jh =
    args.journalHints && args.journalHints.length
      ? `\nJOURNAL TITLE HINTS:\n${args.journalHints.map((h) => "- " + h).join("\n")}\n`
      : "";
  return `${args.mode === "refine" ? "Refine" : "Generate"} candidate manuscript titles based on the inputs below.${ctx}${jh}

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
  contextBlock?: string;
  /** Pass 1 (analyse) vs Pass 2 (validate previous). When omitted, a single-pass prompt is generated. */
  pass?: "analyse" | "validate";
  previousReport?: unknown;
}) {
  const ctx = args.contextBlock ? `\n\n${args.contextBlock}\n` : "";

  const baseRules = `RULES — NEVER VIOLATE:
- Do NOT fabricate any statistic, sample size, p-value, CI, PMID, DOI, citation, or outcome.
- Every claim must be traceable to a field in the project JSON. If unknown, output "unknown".
- Be conservative: if section coverage is unclear, mark "low"; if novelty risk is unclear, mark "unknown".
- Use the reporting-guideline checklist that the project actually selected; never substitute a different one.
- Flag conflicts between research-type, manuscript-type, title, and sections explicitly.`;

  const schema = `Return ONLY this JSON (no prose, no markdown):
{
  "summary": "string (3-5 sentence overview — what is the manuscript about, what design, what state is it in, what blockers)",
  "researchType": "string",
  "primaryGuideline": "string",
  "extensions": ["string"],
  "titleQualityScore": "low|medium|high",
  "titleNotes": ["string"],
  "titleConflictsWithDesign": ["string"],
  "noveltyRisk": "low_duplicate_risk|moderate_similarity_risk|high_duplicate_risk|exact_or_near_exact_match|unknown",
  "sectionScores": [
    {"section": "introduction|methods|results|discussion|conclusion", "coverage": "low|medium|high", "missing": ["string"], "checklistCovered": 0, "checklistTotal": 0}
  ],
  "criticalIssues": ["string"],
  "overstatementWarnings": ["string"],
  "ethicsRegistrationWarnings": ["string"],
  "appendixWarnings": ["string"],
  "manuscriptDesignAlignment": "aligned|partial|conflict|unknown",
  "alignmentNotes": ["string"],
  "referenceSummary": {
    "total": 0,
    "pubmedIndexed": 0,
    "doiVerified": 0,
    "openAlex": 0,
    "europePMC": 0,
    "semanticScholar": 0,
    "openAccess": 0,
    "preprints": 0,
    "mismatches": 0,
    "duplicates": 0,
    "notFound": 0,
    "possibleRetractionOrConcern": 0
  },
  "finalRecommendations": ["string"],
  "overallReadiness": "draft|near_submission|submission_ready"
}`;

  if (args.pass === "validate" && args.previousReport) {
    return `You are auditing a previously-generated compliance report against the raw project JSON. Your job: catch any hallucinations, missed conflicts, or inflated scores. Be skeptical.${ctx}

Project (JSON):
${JSON.stringify(args.project, null, 2)}

Previous report under audit:
${JSON.stringify(args.previousReport, null, 2)}

${baseRules}

Audit tasks:
1. Verify every number, statistic, or count in the report against the project JSON. Correct any discrepancy.
2. Re-check section coverage scores by re-reading the section text. Be strict — if a section is short or missing key items, downgrade.
3. Re-check title for conflicts with the selected design (e.g., "retrospective" in cross-sectional, "RCT" in observational).
4. Confirm manuscript type is compatible with the chosen design family.
5. Re-tally reference statistics from project.references.verifications.
6. Re-rate overall readiness conservatively.

${schema}`;
  }

  return `Produce a final compliance report for the manuscript project below. Use only data present in the project — do not invent results or references.${ctx}

Project (JSON):
${JSON.stringify(args.project, null, 2)}

${baseRules}

${schema}`;
}
