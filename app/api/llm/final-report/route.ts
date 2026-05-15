import { bad, handleError, ok, safeJson } from "../../_utils";
import { callLLM, extractJSON, isLLMConfigured } from "@/lib/llm";
import { GLOBAL_SYSTEM, finalReportPrompt } from "@/lib/prompts";
import type { ProjectState } from "@/lib/types";
import { buildContextBundle, bundleToPromptBlock } from "@/lib/agents/contextBundle";

export const runtime = "nodejs";

type Body = { project: ProjectState };

export async function POST(req: Request) {
  try {
    const body = await safeJson<Body>(req);
    if (!body?.project) return bad("project is required");

    if (!isLLMConfigured()) {
      // Build a structural fallback that doesn't fabricate
      const p = body.project;
      const total = p.references.verifications.length;
      const pubmedIndexed = p.references.verifications.filter((v) => v.pubmed?.found).length;
      const doiVerified = p.references.verifications.filter((v) => v.crossref?.found || v.pubmed?.doi).length;
      const duplicates = p.references.verifications.filter((v) => v.checks.duplicate).length;
      const notFound = p.references.verifications.filter(
        (v) => !v.pubmed?.found && !v.crossref?.found
      ).length;
      const mismatches = p.references.verifications.filter((v) => v.checks.metadataMatch === "mismatch").length;
      const retr = p.references.verifications.filter((v) => v.checks.possibleRetractionOrConcern === true).length;
      return ok({
        summary:
          "Heuristic report (no LLM configured). Configure ANTHROPIC_API_KEY for a richer analysis.",
        researchType: p.researchTypeResult?.primaryGuidelineName || "(not selected)",
        primaryGuideline: p.researchTypeResult?.primaryGuidelineName || "(not selected)",
        extensions: p.researchTypeResult?.possibleExtensionIds || [],
        titleQualityScore: p.titleFinal ? "medium" : "low",
        titleNotes: [],
        noveltyRisk: p.noveltyReport?.risk || "unknown",
        sectionScores: (["introduction", "methods", "results", "discussion", "conclusion"] as const).map(
          (s) => ({
            section: s,
            coverage: (p.sections[s] || "").length > 500 ? "medium" : "low",
            missing: p.sectionFeedback?.[s]?.missingInformation || [],
          })
        ),
        criticalIssues: [],
        overstatementWarnings: [],
        ethicsRegistrationWarnings: p.researchTypeResult?.warnings || [],
        referenceSummary: {
          total,
          pubmedIndexed,
          doiVerified,
          mismatches,
          duplicates,
          notFound,
          possibleRetractionOrConcern: retr,
        },
        finalRecommendations: [
          "Configure an LLM key for richer compliance analysis.",
          "Address any references flagged with mismatches or retraction concerns.",
        ],
        _source: "heuristic",
      });
    }

    const bundle = buildContextBundle(body.project.researchTypeAnswers || {});
    const contextBlock = bundleToPromptBlock(bundle);
    const text = await callLLM({
      system: GLOBAL_SYSTEM,
      prompt: finalReportPrompt({ project: body.project, contextBlock }),
      maxTokens: 4000,
      temperature: 0.1,
      jsonOnly: true,
    });
    const parsed = extractJSON(text);
    return ok({ ...(parsed as Record<string, unknown>), _source: "llm" });
  } catch (e) {
    return handleError(e);
  }
}
