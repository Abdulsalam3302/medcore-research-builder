/**
 * MedCore MCP server — tool definitions and dispatch.
 *
 * Exposes the platform's deterministic research engines (journal finder,
 * design registry, reference verification, coherence analysis, preprint
 * search) to any Model Context Protocol client (Claude Desktop, Claude Code,
 * IDE agents, …) over the Streamable HTTP transport at /api/mcp.
 *
 * Honesty rules carry over from the platform: tools never fabricate PMIDs,
 * DOIs, metrics, or indexing claims — every lookup is verifiable at the
 * official source, and low-confidence results say so.
 */

import { findJournals, profileFromInputs, journalCount } from "@/lib/journals";
import type { JournalFilters } from "@/lib/journals";
import { designs, designById, designCategories } from "@/lib/registry/designs";
import { analyzeCoherence } from "@/lib/coherence";
import { emptyProject } from "@/lib/types";
import type { ReferenceVerification } from "@/lib/types";
import { parseReferenceBlock } from "@/lib/references/parser";
import { markDuplicates, verifyReference } from "@/lib/references/verify";
import { europepmcSearch } from "@/lib/scholarly/europepmc";
import { doajSearchJournals } from "@/lib/scholarly/doaj";

export const MCP_PROTOCOL_VERSION = "2025-03-26";

export const SERVER_INFO = {
  name: "medcore-research-builder",
  title: "MedCore Research Builder",
  version: "3.10.0",
};

export const SERVER_INSTRUCTIONS = [
  "MedCore Research Builder exposes its medical-research engines as tools:",
  "ranked journal suggestions (curated WoS/Scopus/PubMed/DOAJ data), the",
  "EQUATOR-aligned study-design registry, anti-hallucination reference",
  "verification (PubMed/Crossref/OpenAlex), deterministic manuscript",
  "coherence checks, and preprint search via Europe PMC. Results are",
  "advisory: always verify indexing and citations at the official source.",
].join(" ");

type JsonSchema = Record<string, unknown>;

export type McpToolDef = {
  name: string;
  title: string;
  description: string;
  inputSchema: JsonSchema;
};

export const MCP_TOOLS: McpToolDef[] = [
  {
    name: "find_journals",
    title: "Find target journals",
    description:
      "Rank candidate journals for a manuscript using MedCore's curated + ingested dataset " +
      "(Web of Science, Scopus, PubMed/MEDLINE, PMC, DOAJ indexing). Returns scored matches " +
      "with reasons, cautions, and official verification links. Never fabricates indexing or metrics.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Manuscript title (working or final)." },
        abstract: { type: "string", description: "Abstract or summary text." },
        keywords: { type: "array", items: { type: "string" }, description: "Topic keywords." },
        specialties: { type: "array", items: { type: "string" }, description: "Clinical specialties, e.g. ['cardiology']." },
        manuscriptType: { type: "string", description: "e.g. research_article, case_report, systematic_review." },
        query: { type: "string", description: "Free-text filter over journal name/scope/publisher." },
        saudiOnly: { type: "boolean", description: "Restrict to the curated Saudi journal set." },
        requireScopus: { type: "boolean" },
        requirePubmed: { type: "boolean" },
        openAccessOnly: { type: "boolean" },
        freeApcOnly: { type: "boolean", description: "Only journals with no article-processing charge." },
        maxApcUsd: { type: "number" },
        minImpactFactor: { type: "number" },
        limit: { type: "number", description: "Max matches to return (default 10, max 30)." },
      },
    },
  },
  {
    name: "list_study_designs",
    title: "List study designs",
    description:
      "List MedCore's registry of study designs (RCTs, observational, synthesis, protocols, prediction, " +
      "case reports, …), each mapped to its primary EQUATOR reporting guideline. Optionally filter by category.",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description:
            "Optional category id. One of: " + designCategories.map((c) => c.id).join(", "),
        },
      },
    },
  },
  {
    name: "get_study_design",
    title: "Get study design details",
    description:
      "Full detail for one study design: when-to-use checklist, manuscript sections, per-section " +
      "reporting checklist (EQUATOR-aligned), supporting documents, common extensions, and pitfalls.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Design id from list_study_designs, e.g. 'interv.rct.parallel'." },
      },
      required: ["id"],
    },
  },
  {
    name: "verify_references",
    title: "Verify references (anti-hallucination)",
    description:
      "Parse and verify a block of citations against PubMed, Crossref, OpenAlex, Europe PMC and " +
      "Semantic Scholar. Flags unverified, mismatched, duplicate, or possibly retracted references. " +
      "Max 20 references per call; results are advisory and need human confirmation.",
    inputSchema: {
      type: "object",
      properties: {
        raw: {
          type: "string",
          description: "Reference list as plain text — one reference per line or numbered block.",
        },
      },
      required: ["raw"],
    },
  },
  {
    name: "check_coherence",
    title: "Check manuscript coherence",
    description:
      "Deterministic, offline coherence analysis across manuscript sections: title↔content fit, " +
      "design↔claims conflicts, objective↔conclusion alignment, results↔discussion number and causal-language " +
      "consistency, and citation ordering. Returns a 0–100 score with located issues. No LLM, no fabrication.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        introduction: { type: "string" },
        methods: { type: "string" },
        results: { type: "string" },
        discussion: { type: "string" },
        conclusion: { type: "string" },
      },
    },
  },
  {
    name: "check_open_access_journal",
    title: "Check a journal in DOAJ",
    description:
      "Look a journal up in the Directory of Open Access Journals (DOAJ) by title or ISSN. A DOAJ " +
      "listing is a strong legitimacy signal for an open-access journal; absence is a caution flag " +
      "for the predatory self-check. Returns license, APC, publisher, and the official DOAJ link.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Journal title or ISSN, e.g. 'Annals of Saudi Medicine' or '0256-4947'." },
        limit: { type: "number", description: "Max journals to return (default 5, max 20)." },
      },
      required: ["query"],
    },
  },
  {
    name: "search_preprints",
    title: "Search preprints",
    description:
      "Search bioRxiv/medRxiv and other preprints indexed by Europe PMC. Returns title, authors, year, " +
      "DOI link, and open-access flags. Preprints are not peer reviewed — treat findings accordingly.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query (Europe PMC syntax supported)." },
        pageSize: { type: "number", description: "Results to return (default 10, max 25)." },
      },
      required: ["query"],
    },
  },
];

class McpToolError extends Error {}

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v : undefined;
}
function num(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}
function boolArg(v: unknown): boolean | undefined {
  return typeof v === "boolean" ? v : undefined;
}
function strArray(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out = v.filter((x): x is string => typeof x === "string" && Boolean(x.trim()));
  return out.length ? out : undefined;
}

async function toolFindJournals(args: Record<string, unknown>) {
  const profile = profileFromInputs({
    title: str(args.title),
    abstract: str(args.abstract),
    keywords: strArray(args.keywords),
    specialties: strArray(args.specialties),
    manuscriptType: str(args.manuscriptType),
  });
  const filters: JournalFilters = {
    query: str(args.query),
    saudiOnly: boolArg(args.saudiOnly),
    requireScopus: boolArg(args.requireScopus),
    requirePubmed: boolArg(args.requirePubmed),
    openAccessOnly: boolArg(args.openAccessOnly),
    freeApcOnly: boolArg(args.freeApcOnly),
    maxApcUsd: num(args.maxApcUsd),
    minImpactFactor: num(args.minImpactFactor),
    specialties: strArray(args.specialties),
  };
  const limit = Math.min(Math.max(num(args.limit) ?? 10, 1), 30);
  const matches = findJournals(profile, filters, limit);
  return {
    datasetSize: journalCount(),
    matches: matches.map((m) => ({
      name: m.journal.name,
      publisher: m.journal.publisher,
      country: m.journal.country,
      score: m.score,
      reasons: m.reasons,
      cautions: m.cautions,
      indexing: m.journal.indexing,
      openAccess: m.journal.oaModel,
      apcUsd: m.journal.apcUsd ?? null,
      impactFactor: m.journal.metrics?.impactFactor ?? null,
      homepage: m.journal.homepage || null,
      dataConfidence: m.journal.dataConfidence,
    })),
    note: "Indexing and metrics are advisory — verify at the journal's official site before submitting.",
  };
}

function toolListStudyDesigns(args: Record<string, unknown>) {
  const category = str(args.category);
  const pool = category ? designs.filter((d) => d.category === category) : designs;
  return {
    categories: designCategories.map((c) => ({ id: c.id, label: c.label })),
    designs: pool.map((d) => ({
      id: d.id,
      name: d.name,
      category: d.category,
      primaryGuideline: {
        acronym: d.primaryGuideline.acronym,
        fullName: d.primaryGuideline.fullName,
        officialUrl: d.primaryGuideline.officialUrl,
      },
    })),
  };
}

function toolGetStudyDesign(args: Record<string, unknown>) {
  const id = str(args.id);
  if (!id) throw new McpToolError("'id' is required — call list_study_designs first.");
  const d = designById(id);
  if (!d) throw new McpToolError(`Unknown design id '${id}' — call list_study_designs for valid ids.`);
  return {
    id: d.id,
    name: d.name,
    category: d.category,
    primaryGuideline: d.primaryGuideline,
    whenToUseChecklist: d.whenToUseChecklist,
    manuscriptSections: d.manuscriptSections,
    reportingChecklist: d.reportingChecklist,
    supportingDocuments: d.supportingDocuments,
    commonExtensions: d.commonExtensions,
    pitfalls: d.pitfalls,
  };
}

async function toolVerifyReferences(args: Record<string, unknown>) {
  const raw = str(args.raw);
  if (!raw) throw new McpToolError("'raw' reference text is required.");
  const items = parseReferenceBlock(raw);
  if (!items.length) throw new McpToolError("No references could be parsed from the text.");
  if (items.length > 20) {
    throw new McpToolError("Too many references in one call (max 20) — split the list.");
  }
  const out: ReferenceVerification[] = new Array(items.length);
  const concurrency = 3;
  let idx = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (idx < items.length) {
        const i = idx++;
        out[i] = await verifyReference(items[i]);
      }
    }),
  );
  const verifications = markDuplicates(out);
  return {
    count: verifications.length,
    verifications: verifications.map((v) => ({
      originalText: v.originalText,
      confidence: v.confidence,
      problems: v.problems,
      checks: v.checks,
      pmid: v.pubmed?.pmid ?? v.parsed.pmid ?? null,
      doi: v.crossref?.doi ?? v.parsed.doi ?? null,
    })),
    note: "Advisory only — a human must confirm flagged references before submission.",
  };
}

function toolCheckCoherence(args: Record<string, unknown>) {
  const project = emptyProject();
  project.titleFinal = str(args.title) || "";
  project.sections = {
    ...project.sections,
    introduction: str(args.introduction) || "",
    methods: str(args.methods) || "",
    results: str(args.results) || "",
    discussion: str(args.discussion) || "",
    conclusion: str(args.conclusion) || "",
  };
  return analyzeCoherence(project);
}

async function toolCheckDoaj(args: Record<string, unknown>) {
  const query = str(args.query);
  if (!query) throw new McpToolError("'query' (journal title or ISSN) is required.");
  const limit = Math.min(Math.max(num(args.limit) ?? 5, 1), 20);
  const journals = await doajSearchJournals(query, limit);
  return {
    count: journals.length,
    journals,
    note:
      journals.length === 0
        ? "Not found in DOAJ. For an open-access journal this is a caution flag — verify indexing at the official sources before trusting it."
        : "DOAJ listing confirmed for the returned titles — still cross-check scope, APC, and indexing at the journal's official site.",
  };
}

async function toolSearchPreprints(args: Record<string, unknown>) {
  const query = str(args.query);
  if (!query) throw new McpToolError("'query' is required.");
  const pageSize = Math.min(Math.max(num(args.pageSize) ?? 10, 1), 25);
  const results = await europepmcSearch({
    query: `(${query}) AND SRC:PPR`,
    pageSize,
    includePreprints: false, // the SRC:PPR clause above already scopes to preprints
  });
  return {
    count: results.length,
    results,
    note: "Preprints are not peer reviewed — verify before citing as evidence.",
  };
}

export type McpToolResult = {
  content: Array<{ type: "text"; text: string }>;
  structuredContent?: unknown;
  isError?: boolean;
};

export async function callMcpTool(
  name: string,
  args: Record<string, unknown>,
): Promise<McpToolResult> {
  try {
    let result: unknown;
    switch (name) {
      case "find_journals":
        result = await toolFindJournals(args);
        break;
      case "list_study_designs":
        result = toolListStudyDesigns(args);
        break;
      case "get_study_design":
        result = toolGetStudyDesign(args);
        break;
      case "verify_references":
        result = await toolVerifyReferences(args);
        break;
      case "check_coherence":
        result = toolCheckCoherence(args);
        break;
      case "search_preprints":
        result = await toolSearchPreprints(args);
        break;
      case "check_open_access_journal":
        result = await toolCheckDoaj(args);
        break;
      default:
        return {
          content: [{ type: "text", text: `Unknown tool '${name}'.` }],
          isError: true,
        };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      structuredContent: result,
    };
  } catch (e) {
    const msg = e instanceof McpToolError ? e.message : "Tool execution failed — upstream source may be unavailable.";
    if (!(e instanceof McpToolError)) console.error("[mcp]", name, e);
    return { content: [{ type: "text", text: msg }], isError: true };
  }
}
