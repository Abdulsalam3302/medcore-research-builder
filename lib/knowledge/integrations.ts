/**
 * Knowledge registry — capabilities that are ALREADY built into the MedCore
 * platform.
 *
 * PURPOSE: The Open-source and MCP registries describe powerful *external* tools.
 * Many non-technical researchers do not need to install or configure any of them,
 * because the corresponding capability is already delivered inside MedCore. This
 * file maps each powerful external capability to the in-platform feature (a "lane"
 * in the workspace) that provides it, in plain language.
 *
 * HONESTY NOTE: Every entry describes a feature that exists in this app today and
 * names the lane that delivers it. `poweredBy` lists the public data sources /
 * methods the feature actually uses (e.g. the Reference Verifier checks PubMed,
 * Crossref and OpenAlex; Literature Search queries Europe PMC). We do not claim
 * capabilities the platform does not have. "built-in" = the platform does this
 * for you directly; "powered-by" = the platform performs the task on your behalf
 * by calling a named external public data source.
 */

export type IntegrationStatus = "built-in" | "powered-by";

export type PlatformIntegration = {
  id: string;
  /** Short capability name, e.g. "Reference verification". */
  capability: string;
  /** One friendly sentence a non-technical researcher understands. */
  plainSummary: string;
  /** A single emoji representing the capability. */
  icon: string;
  status: IntegrationStatus;
  /** Workspace lane key that opens this feature (matches WorkspaceApp tabs). */
  lane?: string;
  /** Human label for the lane (what the user sees in the tab bar). */
  laneLabel?: string;
  /** Public data sources / methods the feature uses on your behalf. */
  poweredBy?: string;
  /** Concrete "you'd use this when…" example. */
  useCase?: string;
  /** External tool category this replaces, for the curious. */
  replacesExternal?: string;
};

export const platformIntegrations: PlatformIntegration[] = [
  {
    id: "reference-verification",
    capability: "Reference verification",
    plainSummary:
      "Checks every reference in your manuscript against trusted databases and flags ones it can't confirm.",
    icon: "✅",
    status: "powered-by",
    lane: "references",
    laneLabel: "Refs",
    poweredBy: "PubMed · Crossref · OpenAlex",
    useCase:
      "Use this before submission to catch fake, mis-cited, or unindexed references reviewers will reject.",
    replacesExternal: "PubMed / Crossref / OpenAlex MCP servers",
  },
  {
    id: "literature-search",
    capability: "Literature search",
    plainSummary:
      "Searches real peer-reviewed papers and preprints, then adds any you pick straight into your references.",
    icon: "🔍",
    status: "powered-by",
    lane: "literature",
    laneLabel: "Lit search",
    poweredBy: "Europe PMC",
    useCase:
      "Use this to find the latest evidence on your topic without leaving the platform or copying citations by hand.",
    replacesExternal: "Europe PMC / PubMed search tools",
  },
  {
    id: "journal-finder",
    capability: "Journal finding",
    plainSummary:
      "Finds and compares journals that fit your paper, with their indexing and submission formatting rules.",
    icon: "🎯",
    status: "built-in",
    lane: "journal-finder",
    laneLabel: "Journals",
    poweredBy: "WoS SCIE/ESCI · Scopus · PubMed/MEDLINE · DOAJ indexation data",
    useCase:
      "Use this when you're ready to submit and need a well-indexed journal that actually matches your scope.",
    replacesExternal: "Manual journal-shopping and indexation lookups",
  },
  {
    id: "ai-peer-review",
    capability: "AI peer review",
    plainSummary:
      "A team of specialist AI reviewers (methodology, statistics, editorial, integrity) reads your draft and gives layered feedback.",
    icon: "🤖",
    status: "built-in",
    lane: "swarm",
    laneLabel: "Swarm",
    useCase:
      "Use this to get a tough mock review before real reviewers do, so you can fix problems early.",
    replacesExternal: "Reasoning / multi-agent review setups",
  },
  {
    id: "manuscript-scoring",
    capability: "Manuscript scoring",
    plainSummary:
      "Gives your draft an objective, repeatable score across multiple quality dimensions you can re-run after edits.",
    icon: "📊",
    status: "built-in",
    lane: "scorecard",
    laneLabel: "Score",
    useCase:
      "Use this to prove your manuscript is actually improving as you revise it.",
    replacesExternal: "Ad-hoc quality checklists",
  },
  {
    id: "statistics-guidance",
    capability: "Statistics guidance",
    plainSummary:
      "Helps you choose and report the right statistical approach for your study design in plain language.",
    icon: "🧮",
    status: "built-in",
    lane: "results",
    laneLabel: "Results",
    useCase:
      "Use this when you're writing the Results and aren't sure which test or reporting style fits.",
    replacesExternal: "Statistics libraries (R, statsmodels, SciPy)",
  },
  {
    id: "figure-table-specs",
    capability: "Figure & table specs",
    plainSummary:
      "Tells you exactly how your figures and tables should look so they meet journal requirements.",
    icon: "📈",
    status: "built-in",
    lane: "results",
    laneLabel: "Results",
    useCase:
      "Use this when preparing figures so they pass journal checks (resolution, labels, captions) the first time.",
    replacesExternal: "Plotting libraries (Matplotlib, Plotly, ggplot2)",
  },
  {
    id: "originality-advisories",
    capability: "Plagiarism & AI-pattern advisories",
    plainSummary:
      "Warns you about text that may read as copied or AI-generated, and reminds you to verify integrity before submitting.",
    icon: "🛡️",
    status: "built-in",
    lane: "swarm",
    laneLabel: "Swarm",
    useCase:
      "Use this to spot originality and integrity risks before an editor's screening tools do.",
    replacesExternal: "Standalone plagiarism / AI-detector tools",
  },
  {
    id: "protocol-drafting",
    capability: "Protocol drafting",
    plainSummary:
      "Helps you turn an idea into a study-design-aware protocol or proposal, written here rather than just uploaded.",
    icon: "📝",
    status: "built-in",
    lane: "protocol",
    laneLabel: "Protocol",
    useCase:
      "Use this at the very start of a project to produce a feasible, well-structured protocol.",
    replacesExternal: "Blank-document drafting from scratch",
  },
];

/** Group integrations by status ("built-in" first), preserving entry order. */
export function integrationsByStatus(): Map<IntegrationStatus, PlatformIntegration[]> {
  const map = new Map<IntegrationStatus, PlatformIntegration[]>();
  // Seed insertion order so "built-in" renders before "powered-by".
  map.set("built-in", []);
  map.set("powered-by", []);
  for (const item of platformIntegrations) {
    map.get(item.status)!.push(item);
  }
  // Drop any empty buckets.
  for (const [k, v] of map) {
    if (v.length === 0) map.delete(k);
  }
  return map;
}
