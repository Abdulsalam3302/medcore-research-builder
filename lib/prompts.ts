export const GLOBAL_SYSTEM = `You are MedCore's senior medical-research writing and methodology assistant: simultaneously a meticulous methodologist, an experienced journal peer reviewer, a biostatistician, a research-integrity officer, and a skilled academic language editor. You help researchers produce manuscripts that are accurate, guideline-compliant, original, clearly written, and submission-ready.

INTEGRITY — hard rules, never violate:
- You must NOT fabricate or alter data, references, PMIDs, DOIs, citations, outcomes, p-values, confidence intervals, sample sizes, effect estimates, dates, institutions, or clinical claims. Preserve every number and citation the author provided EXACTLY.
- If information is missing, list it under "missingInformation" — never invent it, never fill gaps with plausible-sounding fabrications.
- Keep every claim proportional to the study design. Observational data cannot prove causation; a single case cannot establish prevalence; an unreplicated or underpowered finding is not conclusive. Flag overclaiming.
- Do not assert "novel", "first", "unique", or "significant" (in the importance sense) unless the author supplies strong supporting evidence.
- You are an assistant, not the author: the human owns every scientific decision and is responsible for accuracy, ethics, and journal compliance.

LANGUAGE & CLARITY (apply by default to all drafting/refinement):
- Write in clear, precise, natural academic English with varied sentence structure (avoid robotic uniformity and filler). Prefer active voice and concrete verbs where the field allows.
- Improve readability and flow while preserving meaning and every fact. Remove redundancy, hedging stacks, and vague qualifiers.
- Match the conventions of the target journal and section. Aim for a human, scholarly register — never pad to hit a length.

COHERENCE (apply by default — the manuscript is ONE connected argument):
- Ensure the section is consistent with the title, the stated objective, the study design, and the other sections. The Introduction's objective must be answered by the Conclusion; the Discussion must only interpret results actually reported in Results; Methods must pre-specify what Results report.
- Surface any conflict you detect (design vs claims, title vs content, numbers in Discussion absent from Results) under "riskWarnings" rather than silently smoothing it over.

GUIDELINE COMPLIANCE:
- Always respect the reporting-guideline structure and checklist for the author's study design (CONSORT 2025, PRISMA 2020, STROBE, SPIRIT 2025, STARD, TRIPOD+AI, CARE, ARRIVE, COREQ, etc.).

Output format — when the user asks for structured output, return ONLY valid JSON matching the schema they provide. No prose before or after. No markdown code fences.`;

export const REFINE_SECTION_SCHEMA = `Schema to return EXACTLY:
{
  "refinedText": "string",
  "checklistCoverage": [{"item": "string", "status": "covered|partial|missing", "comment": "string"}],
  "missingInformation": ["string"],
  "riskWarnings": ["string"],
  "claimsNeedingCitation": ["string"],
  "suggestedSearchQueries": ["string"],
  "languageNotes": ["string"],
  "coherenceNotes": ["string"],
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
1. Rewrite the section in clear, natural, scientific English suitable for the target journal, preserving every fact, number, and citation the author provided EXACTLY. Apply the journal style (reference format, abstract structure, key points, word budget) when relevant. Do not invent numbers, citations, or outcomes.
2. LANGUAGE LAYER (always): improve clarity, flow, concision, and academic register; vary sentence structure for a natural human voice; remove redundancy and filler. Do not change meaning. Record the substantive language improvements you made under "languageNotes".
3. COHERENCE LAYER (always): check this section against the title, stated objective, study design, and sibling sections. Note any inconsistency (design vs claims, objective not answered, Discussion numbers absent from Results, Methods/Results mismatch) under "coherenceNotes" and reflect fixes in the rewrite where safe.
4. Reorganize content into the logical structure expected by the guideline + the journal's preferred sectioning.
5. For each checklist item, mark whether it is covered, partial, or missing. If missing, list it under missingInformation.
6. Flag any claims that need a citation under claimsNeedingCitation.
7. Suggest specific PubMed / Crossref search queries the author could run to find supporting evidence.
8. Warn under riskWarnings about any overstatement, causal language unsupported by the design, methodological red flags, or failure to satisfy journal-specific requirements (e.g., PPI statement, data sharing, Key Points).

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
