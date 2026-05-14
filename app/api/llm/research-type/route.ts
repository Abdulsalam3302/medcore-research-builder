import { bad, handleError, ok, safeJson } from "../../_utils";
import { GLOBAL_SYSTEM, researchTypePrompt } from "@/lib/prompts";
import { callLLM, extractJSON, isLLMConfigured } from "@/lib/llm";
import { guidelineById, guidelines } from "@/lib/guidelines";
import type { ResearchTypeAnswers, ResearchTypeResult } from "@/lib/types";

export const runtime = "nodejs";

type Body = { answers: ResearchTypeAnswers };

export async function POST(req: Request) {
  try {
    const body = await safeJson<Body>(req);
    if (!body?.answers) return bad("answers is required");

    // Heuristic fallback (works without LLM): match designFamily / flags.
    const heuristicId = heuristicGuideline(body.answers);

    if (!isLLMConfigured()) {
      const g = guidelineById(heuristicId)!;
      const result = buildResultFromGuideline(g, body.answers, []);
      return ok({ ...result, _source: "heuristic" });
    }

    const catalog = guidelines.map((g) => ({
      id: g.id,
      acronym: g.acronym,
      appliesTo: g.appliesTo,
    }));
    const prompt = researchTypePrompt({ answers: body.answers, guidelineCatalog: catalog });
    const text = await callLLM({
      system: GLOBAL_SYSTEM,
      prompt,
      maxTokens: 1200,
      temperature: 0.1,
      jsonOnly: true,
    });
    const parsed = extractJSON<{
      primaryGuidelineId: string;
      primaryGuidelineName: string;
      possibleExtensionIds: string[];
      warnings: string[];
      notes: string;
    }>(text);

    // Validate the chosen id is in our catalog; otherwise fall back to heuristic.
    let g = guidelineById(parsed.primaryGuidelineId);
    if (!g) g = guidelineById(heuristicId)!;
    const result = buildResultFromGuideline(g, body.answers, parsed.possibleExtensionIds || [], parsed.warnings, parsed.notes);
    return ok({ ...result, _source: "llm" });
  } catch (e) {
    return handleError(e);
  }
}

function heuristicGuideline(a: ResearchTypeAnswers): string {
  const family = (a.designFamily || "").toLowerCase();
  if (a.isProtocol) {
    if (family.includes("systematic")) return "prisma-p";
    return "spirit";
  }
  if (a.isReview || family.includes("systematic") || family.includes("meta"))
    return "prisma-2020";
  if (a.isCaseReport || family.includes("case report")) return "care";
  if (a.isGuideline) return "agree-right";
  if (a.isQualityImprovement) return "squire";
  if (a.isEconomic) return "cheers";
  if (a.isAnimal) return "arrive";
  if (a.isQualitative) return "srqr-coreq";
  if (a.isMixedMethods) return "gramms";
  if (family.includes("diagnost")) return "stard";
  if (family.includes("prognos") || family.includes("prediction")) return "tripod";
  if (family.includes("rct") || family.includes("randomi")) return "consort-2010";
  if (family.includes("cohort") || family.includes("case-control") || family.includes("cross-sectional") || family.includes("observ"))
    return "strobe";
  return "custom";
}

function buildResultFromGuideline(
  g: import("@/lib/types").Guideline,
  a: ResearchTypeAnswers,
  extensionIds: string[],
  warnings: string[] = [],
  notes = ""
): ResearchTypeResult {
  const requiredSections = g.manuscriptSections;
  const sectionChecklists = g.checklistPrompts;
  const w: string[] = [...warnings];
  if (a.hasHumanParticipants && a.ethicsRequired === false) {
    w.push("Human participants but ethics approval marked as not required — verify the rationale.");
  }
  if ((g.id === "consort-2010" || g.id === "spirit") && a.registrationRequired === false) {
    w.push("Trial registration is normally required for prospective interventional trials.");
  }
  if (g.id === "prisma-2020" && a.registrationRequired === false) {
    w.push("Systematic-review protocol registration (e.g., PROSPERO) is strongly recommended.");
  }
  return {
    primaryGuidelineId: g.id,
    primaryGuidelineName: g.name,
    possibleExtensionIds: extensionIds.length ? extensionIds : g.extensions || [],
    requiredSections: requiredSections.filter((s) =>
      ["title", "introduction", "methods", "results", "discussion", "conclusion", "references"].includes(s)
    ) as ResearchTypeResult["requiredSections"],
    sectionChecklists,
    warnings: w,
    notes: notes || (g.notes || ""),
  };
}
