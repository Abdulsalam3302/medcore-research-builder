/**
 * Journal-style prompt fragments.
 * Translates a JournalSpec into ready-to-inject prompt strings.
 */

import type { JournalSpec, ContextBundle } from "../types";

export function journalStyleHints(journal: JournalSpec | undefined, section?: string): string[] {
  if (!journal) return [];
  const hints: string[] = [];
  hints.push(
    `Target journal: ${journal.name} (${journal.publisher}). Apply its style and constraints throughout.`
  );
  // Reference style
  const rs = journal.referenceStyle;
  const fmt =
    rs.format === "vancouver-superscript"
      ? "Vancouver superscript"
      : rs.format === "vancouver-numbered-parens"
      ? "Vancouver numbered in parentheses"
      : rs.format === "vancouver-numbered-brackets"
      ? "Vancouver numbered in square brackets"
      : rs.format === "ama-numbered"
      ? "AMA numbered"
      : rs.format === "apa-7"
      ? "APA 7th edition"
      : rs.format === "harvard"
      ? "Harvard author-date"
      : rs.format === "nature-superscript"
      ? "Nature superscript numerical"
      : "Elsevier numbered";
  const authorList =
    rs.authorListing === "all-up-to-3-etal"
      ? "first 3 authors then et al"
      : rs.authorListing === "all-up-to-6-etal"
      ? "first 6 authors then et al"
      : rs.authorListing === "all-up-to-5-etal"
      ? "first 5 authors then et al"
      : rs.authorListing === "first-author-etal"
      ? "first author et al"
      : "all authors listed";
  hints.push(
    `Reference style: ${fmt}; list ${authorList}; journal abbreviation per ${rs.journalAbbrev}; DOI ${rs.doiRequired ? "required" : "optional"}; URLs ${rs.urlsAllowed ? "allowed" : "not allowed"}.`
  );

  // Abstract
  const abs = journal.abstractStructure;
  if (abs === "question-findings-meaning") {
    hints.push(
      "Structured abstract for this journal uses the JAMA format: Importance · Objective · Design/Setting/Participants · Interventions or Exposures · Main Outcomes and Measures · Results · Conclusions and Relevance. Plus a Key Points box (Question · Findings · Meaning)."
    );
  } else if (abs === "background-methods-results-conclusions") {
    hints.push("Structured abstract: Background · Methods · Results · Conclusions.");
  } else if (abs === "unstructured") {
    hints.push("Abstract is unstructured (single paragraph).");
  }

  // Section-specific
  if (section === "title") {
    if (journal.id === "jama" || journal.id === "jama-network-open" || journal.id === "jama-surgery") {
      hints.push("Use concise informative title that fits JAMA Key Points framing.");
    }
    if (journal.id.startsWith("lancet")) {
      hints.push("Lancet titles often follow 'Study Topic: design' pattern, e.g., 'Drug X vs placebo for Y in Z: a randomised, double-blind, phase 3 trial'.");
    }
  }
  if (journal.required.ppiStatement) {
    hints.push("This journal requires a Patient & Public Involvement (PPI) statement — surface it under missingInformation if absent.");
  }
  if (journal.required.dataSharingStatement) {
    hints.push("This journal requires a data-sharing statement (what data, when, where, conditions).");
  }
  if (journal.required.aiDisclosure) {
    hints.push("ICMJE 2026: declare any AI-assistance used in writing or analysis in the acknowledgements.");
  }
  return hints;
}

export function bundleJournalHints(bundle: ContextBundle): string[] {
  if (!bundle.journal) return [];
  const hints: string[] = [];
  hints.push(...bundle.journal.reviewerLens.map((r) => `Reviewer lens: ${r}`));
  hints.push(...bundle.journal.editorLens.map((r) => `Editor lens: ${r}`));
  if (bundle.journal.mainTextWordLimit)
    hints.push(`Main-text target: ~${bundle.journal.mainTextWordLimit} words.`);
  if (bundle.journal.keyPointsRequired)
    hints.push("Key Points (Question · Findings · Meaning) are required.");
  return hints;
}
