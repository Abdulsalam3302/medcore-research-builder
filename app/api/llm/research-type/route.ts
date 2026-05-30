import { bad, handleError, ok, safeJson, enforceRateLimit } from "../../_utils";
import type { ResearchTypeAnswersV2, ResearchTypeResult } from "@/lib/types";
import { designById, designs } from "@/lib/registry/designs";
import { featureById } from "@/lib/registry/features";

export const runtime = "nodejs";

type Body = { answers: ResearchTypeAnswersV2 };

/**
 * v2: research-type now operates over the design registry.
 * If a designId is supplied, we synthesize the result directly (no LLM needed).
 * If not, we run a heuristic to pick a design from the legacy v1 answers,
 * so old projects keep working.
 */
export async function POST(req: Request) {
  const rl = await enforceRateLimit(req, "llm");
  if (rl) return rl;
  try {
    const body = await safeJson<Body>(req);
    if (!body?.answers) return bad("answers is required");
    const a = body.answers;

    let designId = a.designId;
    if (!designId) {
      designId = heuristicDesignId(a);
    }
    const d = designById(designId) || designById("custom")!;

    /* Feature-driven additions */
    const featureExtensions = (a.featureIds || [])
      .map((id) => featureById(id))
      .filter(Boolean)
      .flatMap((f) => f!.addExtensions || []);
    const featureChecklist: Record<string, string[]> = {};
    for (const fid of a.featureIds || []) {
      const f = featureById(fid);
      if (!f?.addChecklistItems) continue;
      for (const [sec, items] of Object.entries(f.addChecklistItems)) {
        featureChecklist[sec] = [...(featureChecklist[sec] || []), ...(items as string[])];
      }
    }
    const featureDocs = (a.featureIds || [])
      .map((id) => featureById(id))
      .filter(Boolean)
      .flatMap((f) => f!.addSupportingDocs || []);

    /* Merge checklists (design + features) */
    const mergedChecklist: ResearchTypeResult["sectionChecklists"] = {};
    for (const [sec, items] of Object.entries(d.reportingChecklist)) {
      mergedChecklist[sec as keyof typeof mergedChecklist] = [...(items as string[])];
    }
    for (const [sec, items] of Object.entries(featureChecklist)) {
      const key = sec as keyof typeof mergedChecklist;
      mergedChecklist[key] = [...(mergedChecklist[key] || []), ...items];
    }

    /* Warnings */
    const warnings: string[] = [];
    if (d.id.startsWith("interv.rct") && a.featureIds && !a.featureIds.includes("intervention.tidier")) {
      warnings.push(
        "TIDieR intervention description is strongly recommended for interventional trials — consider enabling it as a special feature."
      );
    }
    if (a.featureIds?.includes("ai.consort-ai") && !d.id.startsWith("interv.rct")) {
      warnings.push("CONSORT-AI applies to RCTs; verify your design choice.");
    }

    const result: ResearchTypeResult = {
      primaryGuidelineId: d.id, // we now store the design id here for backward compat
      primaryGuidelineName: `${d.primaryGuideline.acronym} — ${d.name}`,
      possibleExtensionIds: Array.from(
        new Set([
          ...d.commonExtensions.map((e) => e.acronym),
          ...featureExtensions.map((e) => e.acronym),
        ])
      ),
      requiredSections: d.manuscriptSections.filter((s) =>
        ["title", "introduction", "methods", "results", "discussion", "conclusion", "references"].includes(s)
      ) as ResearchTypeResult["requiredSections"],
      sectionChecklists: mergedChecklist,
      warnings,
      notes: d.primaryGuideline.citation || "",
      designId: d.id,
      supportingDocuments: [...d.supportingDocuments, ...featureDocs],
      pitfalls: d.pitfalls,
      whenToUseChecklist: d.whenToUseChecklist,
    };
    return ok({ ...result, _source: "registry" });
  } catch (e) {
    return handleError(e);
  }
}

function heuristicDesignId(a: ResearchTypeAnswersV2): string {
  const family = (a.designFamily || "").toLowerCase();
  if (a.isProtocol) {
    if (family.includes("systematic")) return "proto.sr";
    return "proto.trial";
  }
  if (a.isReview || family.includes("systematic") || family.includes("meta"))
    return "syn.sr";
  if (a.isCaseReport || family.includes("case report")) return "case.care";
  if (a.isGuideline) return "guide.right";
  if (a.isQualityImprovement) return "qi.squire";
  if (a.isEconomic) return "econ.cheers";
  if (a.isAnimal) return "preclin.arrive";
  if (a.isQualitative) return "qual.srqr";
  if (a.isMixedMethods) return "qual.gramms";
  if (family.includes("diagnost")) return "dx.stard";
  if (family.includes("prognos") || family.includes("prediction")) return "dx.tripod-ai";
  if (family.includes("cluster")) return "interv.rct.cluster";
  if (family.includes("crossover")) return "interv.rct.crossover";
  if (family.includes("non-inferi") || family.includes("equivalence")) return "interv.rct.noninferiority";
  if (family.includes("pragmatic")) return "interv.rct.pragmatic";
  if (family.includes("pilot") || family.includes("feasibility")) return "interv.rct.pilot";
  if (family.includes("rct") || family.includes("randomi")) return "interv.rct.parallel";
  if (family.includes("cohort") && family.includes("prospect")) return "obs.cohort.prospective";
  if (family.includes("cohort") && family.includes("retrospect")) return "obs.cohort.retrospective";
  if (family.includes("cohort")) return "obs.cohort.prospective";
  if (family.includes("case-control") || family.includes("case control")) return "obs.case-control";
  if (family.includes("cross-sectional")) return "obs.cross-sectional";
  if (family.includes("observ")) return "obs.cohort.prospective";
  return "custom";
}

// Surface designs so the CLI client could enumerate.
export async function GET() {
  return new Response(JSON.stringify({ designs: designs.map((d) => ({ id: d.id, name: d.name })) }), {
    headers: { "content-type": "application/json" },
  });
}
