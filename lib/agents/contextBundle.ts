/**
 * Context Bundle builder.
 *
 * Aggregates the user's design + journal + features + (expanded) notes
 * into a single object that every downstream LLM call consumes.
 * Ensures we never re-ask the user the same question and that every
 * refinement is aware of guideline, journal, and feature constraints.
 */

import type {
  ContextBundle,
  Extension,
  ResearchTypeAnswersV2,
} from "../types";
import { designById } from "../registry/designs";
import { featureById } from "../registry/features";
import { icmjeGenericFallback, journalById } from "../registry/journals";

export function buildContextBundle(answers: ResearchTypeAnswersV2): ContextBundle {
  const bundle: ContextBundle = { rawNotes: answers.notes };

  /* ---------- Design ---------- */
  if (answers.designId) {
    const d = designById(answers.designId);
    if (d) {
      const featureExt: Extension[] = (answers.featureIds || [])
        .map((id) => featureById(id))
        .filter(Boolean)
        .flatMap((f) => f!.addExtensions || []);
      const allExt: Extension[] = [...d.commonExtensions, ...featureExt];
      // Dedupe by acronym
      const dedup = Array.from(new Map(allExt.map((e) => [e.acronym, e])).values());
      bundle.design = {
        id: d.id,
        name: d.name,
        primaryGuideline: d.primaryGuideline,
        activeExtensions: dedup,
        pitfalls: d.pitfalls,
      };
    }
  }

  /* ---------- Journal ---------- */
  if (answers.journalId) {
    let j = journalById(answers.journalId);
    if (!j && answers.journalId === "icmje-generic") j = icmjeGenericFallback;
    if (j) {
      const mtSpec = j.manuscriptTypes.find((m) => m.type === answers.manuscriptType) ||
        j.manuscriptTypes.find((m) => m.type === j!.defaultManuscriptType) ||
        j.manuscriptTypes[0];
      bundle.journal = {
        id: j.id,
        name: j.name,
        referenceFormat: j.referenceStyle.format,
        abstractStructure: j.abstractStructure,
        mainTextWordLimit: mtSpec?.mainTextWordLimit,
        abstractWordLimit: mtSpec?.abstractWordLimit,
        keyPointsRequired: !!mtSpec?.keyPointsRequired,
        reviewerLens: j.reviewerLens,
        editorLens: j.editorLens,
        required: j.required,
        manuscriptType: answers.manuscriptType || j.defaultManuscriptType,
        tier: j.tier,
      };
    }
  }

  /* ---------- Features ---------- */
  if (answers.featureIds && answers.featureIds.length) {
    bundle.features = answers.featureIds
      .map((id) => featureById(id))
      .filter(Boolean)
      .map((f) => ({
        id: f!.id,
        name: f!.name,
        agentHints: f!.agentHints,
      }));
  }

  /* ---------- Expanded notes ---------- */
  if (answers.expandedNotes) bundle.expandedNotes = answers.expandedNotes;

  return bundle;
}

/**
 * Render the bundle as a compact prompt block to inject into LLM system / user prompts.
 */
export function bundleToPromptBlock(b: ContextBundle): string {
  if (!b.design && !b.journal && !b.features && !b.expandedNotes && !b.rawNotes) {
    return "";
  }
  const lines: string[] = ["MANUSCRIPT CONTEXT (use this throughout):"];
  if (b.design) {
    lines.push(
      `- Study design: ${b.design.name}`,
      `- Primary reporting guideline: ${b.design.primaryGuideline.acronym} (${b.design.primaryGuideline.year || "—"})`
    );
    if (b.design.activeExtensions.length) {
      lines.push(`- Active extensions: ${b.design.activeExtensions.map((e) => e.acronym).join(", ")}`);
    }
    if (b.design.pitfalls.length) {
      lines.push(`- Top pitfalls to avoid: ${b.design.pitfalls.slice(0, 5).join("; ")}`);
    }
  }
  if (b.journal) {
    lines.push(
      `- Target journal: ${b.journal.name} (${b.journal.id})`,
      `- Manuscript type: ${b.journal.manuscriptType}`,
      `- Reference style: ${b.journal.referenceFormat}`,
      `- Abstract structure: ${b.journal.abstractStructure}`,
      b.journal.mainTextWordLimit ? `- Main-text word limit: ~${b.journal.mainTextWordLimit}` : ""
    );
    if (b.journal.keyPointsRequired) lines.push("- Key Points (Question/Findings/Meaning) required.");
    if (b.journal.required.ppiStatement) lines.push("- Patient & public involvement (PPI) statement REQUIRED.");
    if (b.journal.required.dataSharingStatement) lines.push("- Data-sharing statement REQUIRED.");
    if (b.journal.required.aiDisclosure) lines.push("- ICMJE 2026 AI-assistance disclosure REQUIRED in acknowledgements.");
    if (b.journal.reviewerLens.length) {
      lines.push("- Journal reviewer lens:");
      b.journal.reviewerLens.forEach((r) => lines.push(`  · ${r}`));
    }
    if (b.journal.editorLens.length) {
      lines.push("- Journal editor lens:");
      b.journal.editorLens.forEach((r) => lines.push(`  · ${r}`));
    }
  }
  if (b.features && b.features.length) {
    lines.push("- Special features active (each carries its own reporting expectations):");
    for (const f of b.features) {
      lines.push(`  · ${f.name}`);
      for (const h of f.agentHints) lines.push(`    – ${h}`);
    }
  }
  if (b.expandedNotes) {
    lines.push("- Author-supplied context (extracted):");
    const e = b.expandedNotes;
    if (e.population) lines.push(`  · Population: ${e.population}`);
    if (e.condition) lines.push(`  · Condition: ${e.condition}`);
    if (e.intervention) lines.push(`  · Intervention: ${e.intervention}`);
    if (e.exposure) lines.push(`  · Exposure: ${e.exposure}`);
    if (e.comparator) lines.push(`  · Comparator: ${e.comparator}`);
    if (e.primaryOutcome) lines.push(`  · Primary outcome: ${e.primaryOutcome}`);
    if (e.secondaryOutcomes?.length) lines.push(`  · Secondary outcomes: ${e.secondaryOutcomes.join("; ")}`);
    if (e.setting) lines.push(`  · Setting: ${e.setting}`);
    if (e.country) lines.push(`  · Country: ${e.country}`);
    if (e.timePeriod) lines.push(`  · Time period: ${e.timePeriod}`);
    if (e.sampleSize) lines.push(`  · Sample size: ${e.sampleSize}`);
    if (e.dataSource) lines.push(`  · Data source: ${e.dataSource}`);
    if (e.registration) lines.push(`  · Registration: ${e.registration}`);
    if (e.conflictsDetected?.length) {
      lines.push("  · Conflicts/inconsistencies detected (resolve before refining):");
      e.conflictsDetected.forEach((c) => lines.push(`    – ${c}`));
    }
  } else if (b.rawNotes) {
    lines.push(`- Author notes (verbatim): ${b.rawNotes}`);
  }
  return lines.filter(Boolean).join("\n");
}
