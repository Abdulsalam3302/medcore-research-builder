import { ok } from "../_utils";
import { designs, designCategories } from "@/lib/registry/designs";
import { journals, publisherTemplates, icmjeGenericFallback } from "@/lib/registry/journals";
import { features, featureCategories } from "@/lib/registry/features";

export const runtime = "nodejs";

/**
 * One-shot registry endpoint — client fetches once and renders pickers.
 * We trim heavy fields (full checklist text) for transport; the details
 * routes return full payloads.
 */
export async function GET() {
  return ok({
    designs: designs.map((d) => ({
      id: d.id,
      category: d.category,
      name: d.name,
      shortLabel: d.shortLabel,
      primaryGuideline: d.primaryGuideline,
      whenToUseChecklist: d.whenToUseChecklist,
      manuscriptSections: d.manuscriptSections,
      supportingDocuments: d.supportingDocuments,
      commonExtensions: d.commonExtensions,
      pitfalls: d.pitfalls,
      legacyGuidelines: d.legacyGuidelines,
      appliesTo: d.appliesTo,
    })),
    designCategories,
    journals: [...journals, ...publisherTemplates, icmjeGenericFallback],
    features,
    featureCategories,
  });
}
