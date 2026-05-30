/**
 * Submission formatting service.
 *
 * Given a target journal and the project, produce a concrete, journal-specific
 * submission checklist + a formatted package outline: title page, abstract
 * structure, reference style, figure/table requirements, and required
 * statements. Deterministic and offline — it reads the journal's encoded
 * requirements and the project's content, and never invents missing facts.
 */

import type { JournalRecord } from "./types";
import type { ProjectState } from "@/lib/types";

export type FormattingItem = {
  id: string;
  label: string;
  status: "ok" | "action" | "info";
  detail: string;
};

export type SubmissionFormat = {
  journalName: string;
  items: FormattingItem[];
  titlePage: string;
  referenceStyleNote: string;
  packageChecklist: string[];
};

function wordCount(s: string): number {
  return (s || "").trim() ? (s || "").trim().split(/\s+/).length : 0;
}

export function buildSubmissionFormat(
  journal: JournalRecord,
  project: ProjectState,
): SubmissionFormat {
  const items: FormattingItem[] = [];

  const title = project.titleFinal || project.titleInputs?.draftTitle || "";
  const sections = project.sections || ({} as ProjectState["sections"]);
  const bodyWords =
    wordCount(sections.introduction) +
    wordCount(sections.methods) +
    wordCount(sections.results) +
    wordCount(sections.discussion) +
    wordCount(sections.conclusion);

  // Title presence.
  items.push({
    id: "title",
    label: "Title",
    status: title ? "ok" : "action",
    detail: title ? `"${title}"` : "No final title set — finalize in Title Lab.",
  });

  // Body length vs. typical limit (we don't have per-type limits in the new
  // record, so give honest guidance).
  items.push({
    id: "length",
    label: "Manuscript length",
    status: bodyWords > 0 ? "info" : "action",
    detail:
      bodyWords > 0
        ? `~${bodyWords} words across core sections. Confirm against the journal's word limit in the author guide.`
        : "No section content yet.",
  });

  // Reference style.
  const refCount = project.references?.verifications?.length ?? 0;
  items.push({
    id: "references",
    label: "References",
    status: refCount > 0 ? "info" : "action",
    detail:
      refCount > 0
        ? `${refCount} references parsed. Format to the journal's required style (check the author guide).`
        : "No references verified yet.",
  });

  // Open access / APC.
  if (journal.oaModel === "gold" || journal.oaModel === "diamond") {
    items.push({
      id: "oa",
      label: "Open access",
      status: "info",
      detail:
        journal.oaModel === "diamond"
          ? "Diamond OA — typically no article processing charge."
          : typeof journal.apcUsd === "number"
            ? `Gold OA — APC ≈ $${journal.apcUsd} (verify current fee).`
            : "Gold OA — APC applies (verify current fee).",
    });
  }

  // Required statements derived from indexing/endorsements.
  const statements: string[] = [
    "ICMJE authorship & contributorship (CRediT)",
    "Conflict of interest statement",
    "Funding statement",
    "Data availability statement",
    "Ethics approval / IRB statement (human/animal studies)",
    "Informed consent statement (where applicable)",
    "AI-use disclosure (ICMJE 2024+)",
  ];
  for (const s of statements) {
    items.push({ id: `stmt-${s.slice(0, 8)}`, label: s, status: "action", detail: "Include in the manuscript before submission." });
  }

  // Endorsed reporting guideline.
  if (journal.endorsedGuidelines && journal.endorsedGuidelines.length) {
    items.push({
      id: "guideline",
      label: "Reporting guideline",
      status: "info",
      detail: `Journal endorses: ${journal.endorsedGuidelines.join(", ")}. Attach the completed checklist.`,
    });
  }

  const titlePage = [
    `Title: ${title || "[title]"}`,
    `Target journal: ${journal.name}`,
    `Article type: ${project.researchTypeAnswers?.manuscriptType?.replace(/_/g, " ") || "[select]"}`,
    "",
    "Authors: [Full names, ORCID, affiliations]",
    "Corresponding author: [name, email, address]",
    "Word count (main text): [auto / verify]",
    "Number of figures/tables: [count]",
    "Keywords: [3–8 MeSH-aligned terms]",
    "",
    "Funding: [source or 'None']",
    "Conflicts of interest: [declare or 'None']",
    "Data availability: [statement]",
    "AI-use disclosure: [tools used and how, or 'None']",
  ].join("\n");

  const referenceStyleNote = `Format references to ${journal.name}'s required style (see ${journal.authorGuideUrl || journal.homepage || "author guide"}). Verify author-listing rules (e.g., et al. threshold), journal-name abbreviation (Index Medicus vs full), and whether DOIs/URLs are required.`;

  const packageChecklist = [
    "Cover letter (journal-specific)",
    "Title page (separate file if double-blind)",
    "Anonymized main manuscript",
    "Tables (editable, end-of-manuscript or separate file per journal)",
    "Figures (high-resolution, journal-specified format/DPI)",
    "Figure legends list",
    "Completed reporting-guideline checklist",
    "Required statements (COI, funding, ethics, consent, data, AI)",
    "Supplementary/appendix files",
    "Suggested/opposed reviewers (if requested)",
  ];

  return {
    journalName: journal.name,
    items,
    titlePage,
    referenceStyleNote,
    packageChecklist,
  };
}
