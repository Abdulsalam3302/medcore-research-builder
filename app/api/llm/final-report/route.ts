import { bad, handleError, ok, safeJson, enforceRateLimit } from "../../_utils";
import { callLLM, llmTracking, extractJSON, isLLMConfigured } from "@/lib/llm";
import { GLOBAL_SYSTEM, finalReportPrompt } from "@/lib/prompts";
import type { ProjectState } from "@/lib/types";
import { buildContextBundle, bundleToPromptBlock } from "@/lib/agents/contextBundle";
import {
  detectTitleConflicts,
  isManuscriptTypeCompatible,
} from "@/lib/alignment";
import { designById } from "@/lib/registry/designs";

export const runtime = "nodejs";

type Body = { project: ProjectState; multiCheck?: boolean };

export async function POST(req: Request) {
  const rl = await enforceRateLimit(req, "llm");
  if (rl) return rl;
  try {
    const body = await safeJson<Body>(req);
    if (!body?.project) return bad("project is required");

    /* Deterministic numbers + alignment checks happen for every report. */
    const p = body.project;
    const verifs = p.references.verifications;
    const referenceSummary = {
      total: verifs.length,
      pubmedIndexed: verifs.filter((v) => v.pubmed?.found).length,
      doiVerified: verifs.filter((v) => v.crossref?.found || v.pubmed?.doi).length,
      openAlex: verifs.filter((v) => v.openalex?.found).length,
      europePMC: verifs.filter((v) => v.europepmc?.found).length,
      semanticScholar: verifs.filter((v) => v.semanticscholar?.found).length,
      openAccess: verifs.filter((v) => v.checks.openAccess === true).length,
      preprints: verifs.filter((v) => v.checks.isPreprint === true).length,
      mismatches: verifs.filter((v) => v.checks.metadataMatch === "mismatch").length,
      duplicates: verifs.filter((v) => v.checks.duplicate).length,
      notFound: verifs.filter((v) => !v.pubmed?.found && !v.crossref?.found && !v.openalex?.found).length,
      possibleRetractionOrConcern: verifs.filter((v) => v.checks.possibleRetractionOrConcern === true).length,
    };

    const designId = p.researchTypeAnswers?.designId;
    const design = designId ? designById(designId) : undefined;
    const designCategory = design?.category;
    const manuscriptType = p.researchTypeAnswers?.manuscriptType;
    const designManuscriptOK = isManuscriptTypeCompatible(designCategory, manuscriptType);
    const titleConflicts = detectTitleConflicts(designId, p.titleFinal || p.titleInputs.draftTitle || "");

    const alignmentNotes: string[] = [];
    if (!designManuscriptOK)
      alignmentNotes.push(
        `Manuscript type "${manuscriptType}" is not compatible with design category "${designCategory}".`
      );
    if (titleConflicts.length)
      alignmentNotes.push(
        `Title contains ${titleConflicts.length} word(s) that conflict with the selected design: ${titleConflicts
          .map((c) => `"${c.keyword}"`)
          .join(", ")}.`
      );

    if (!isLLMConfigured()) {
      return ok({
        summary:
          "Heuristic report (no LLM configured). Configure MINIMAX_API_KEY (default), ANTHROPIC_API_KEY, or OPENAI_API_KEY for a richer multi-pass analysis.",
        researchType: p.researchTypeResult?.primaryGuidelineName || "(not selected)",
        primaryGuideline: p.researchTypeResult?.primaryGuidelineName || "(not selected)",
        extensions: p.researchTypeResult?.possibleExtensionIds || [],
        titleQualityScore: p.titleFinal ? "medium" : "low",
        titleNotes: [],
        titleConflictsWithDesign: titleConflicts.map(
          (c) => `${c.keyword}: ${c.reason}`
        ),
        noveltyRisk: p.noveltyReport?.risk || "unknown",
        sectionScores: (["introduction", "methods", "results", "discussion", "conclusion"] as const).map(
          (s) => ({
            section: s,
            coverage: (p.sections[s] || "").length > 500 ? "medium" : "low",
            missing: p.sectionFeedback?.[s]?.missingInformation || [],
            checklistCovered:
              (p.sectionFeedback?.[s]?.checklistCoverage || []).filter(
                (x) => x.status === "covered"
              ).length,
            checklistTotal: (p.sectionFeedback?.[s]?.checklistCoverage || []).length,
          })
        ),
        criticalIssues: [],
        overstatementWarnings: [],
        ethicsRegistrationWarnings: p.researchTypeResult?.warnings || [],
        appendixWarnings:
          designId &&
          (designId === "obs.cross-sectional" || designId.startsWith("qual.")) &&
          !(p.appendices || []).some((a) => a.kind === "questionnaire")
            ? ["Cross-sectional / qualitative designs should include the questionnaire/instrument as an appendix."]
            : [],
        manuscriptDesignAlignment: titleConflicts.length || !designManuscriptOK ? "conflict" : "aligned",
        alignmentNotes,
        referenceSummary,
        finalRecommendations: [
          "Configure an LLM key for richer compliance analysis.",
          "Address any references flagged with mismatches or retraction concerns.",
        ],
        overallReadiness: "draft",
        _source: "heuristic",
      });
    }

    const bundle = buildContextBundle(body.project.researchTypeAnswers || {});
    const contextBlock = bundleToPromptBlock(bundle);

    /* Pass 1 — analyse. */
    const text1 = await callLLM({
      system: GLOBAL_SYSTEM,
      prompt: finalReportPrompt({ project: body.project, contextBlock }),
      maxTokens: 4000,
      temperature: 0.1,
      jsonOnly: true,
      tracking: llmTracking(req, "/api/llm/final-report"),
    });
    let report = extractJSON<Record<string, unknown>>(text1);

    /* Pass 2 — audit/validate against project JSON (multi-check). */
    if (body.multiCheck !== false) {
      try {
        const text2 = await callLLM({
          system: GLOBAL_SYSTEM,
          prompt: finalReportPrompt({
            project: body.project,
            contextBlock,
            pass: "validate",
            previousReport: report,
          }),
          maxTokens: 4000,
          temperature: 0.05,
          jsonOnly: true,
          tracking: llmTracking(req, "/api/llm/final-report"),
        });
        report = extractJSON<Record<string, unknown>>(text2);
      } catch {
        /* If audit pass fails, keep the first pass and continue. */
      }
    }

    /* Always overwrite deterministic numeric fields with our local counts. */
    report.referenceSummary = referenceSummary;
    if (alignmentNotes.length) {
      const prev = (report.alignmentNotes as string[]) || [];
      report.alignmentNotes = Array.from(new Set([...prev, ...alignmentNotes]));
    }
    if (titleConflicts.length) {
      report.titleConflictsWithDesign = titleConflicts.map(
        (c) => `${c.keyword}: ${c.reason}`
      );
      if (report.manuscriptDesignAlignment !== "conflict") {
        report.manuscriptDesignAlignment = "conflict";
      }
    }

    return ok({ ...report, _source: "llm-multi-check" });
  } catch (e) {
    return handleError(e);
  }
}
