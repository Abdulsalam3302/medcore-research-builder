// Design-derived expertise for the Review & Improve swarm.
//
// The Study Design Selector already captures everything that should shape a
// review: the chosen design (→ its reporting guideline + known pitfalls) and
// the selected "special features" (each of which carries `agentHints` — prompt
// fragments authored precisely to steer an LLM). This module folds all of that
// into (a) DIRECTIVES injected verbatim into every swarm agent's context, so
// the review applies the user's exact design expectations, and (b) human-facing
// LENSES the UI lists so the user can see the extra expert reviewers at work.
//
// Pure & dependency-light: importable from both the server route and client UI.

import type { ProjectState } from "@/lib/types";
import { featureById } from "@/lib/registry/features";
import { designById } from "@/lib/registry/designs";

export type AppliedLens = {
  kind: "guideline" | "feature" | "extension" | "pitfall";
  label: string;
  detail: string;
};

export type Expertise = {
  /** Directives injected into every agent's prompt context. */
  directives: string[];
  /** Human-facing list of the expert lenses applied, for the UI. */
  lenses: AppliedLens[];
  designName?: string;
  guidelineLabel?: string;
};

export function buildExpertise(project: ProjectState): Expertise {
  const a = project.researchTypeAnswers || {};
  const design = a.designId ? designById(a.designId) : undefined;
  const featureIds = a.featureIds || [];

  const directives: string[] = [];
  const lenses: AppliedLens[] = [];
  let guidelineLabel: string | undefined;

  if (design) {
    const g = design.primaryGuideline;
    guidelineLabel = `${g.acronym}${g.year ? ` ${g.year}` : ""}`;
    lenses.push({
      kind: "guideline",
      label: guidelineLabel,
      detail: `Primary reporting guideline matched to ${design.name}.`,
    });
    directives.push(
      `Reporting-guideline lens — apply ${guidelineLabel} (the standard for ${design.name}). Check the manuscript against each required item and flag any that are missing, vague, or under-reported.`,
    );

    if (design.pitfalls?.length) {
      directives.push(
        `Design-pitfall lens for a ${design.name} — actively check for: ${design.pitfalls.join("; ")}.`,
      );
      for (const p of design.pitfalls.slice(0, 6)) {
        lenses.push({ kind: "pitfall", label: "Common pitfall", detail: p });
      }
    }

    for (const ext of design.commonExtensions || []) {
      lenses.push({ kind: "extension", label: ext.acronym, detail: ext.fullName });
    }
  }

  for (const id of featureIds) {
    const f = featureById(id);
    if (!f) continue;
    lenses.push({ kind: "feature", label: f.name, detail: f.description });
    for (const hint of f.agentHints || []) {
      directives.push(`${f.name} lens — ${hint}`);
    }
    for (const ext of f.addExtensions || []) {
      lenses.push({ kind: "extension", label: ext.acronym, detail: ext.fullName });
    }
  }

  // De-duplicate lenses (the catalogue has a few overlapping extensions).
  const seen = new Set<string>();
  const dedupedLenses = lenses.filter((l) => {
    const key = `${l.kind}|${l.label}|${l.detail}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return {
    directives,
    lenses: dedupedLenses,
    designName: design?.name,
    guidelineLabel,
  };
}
