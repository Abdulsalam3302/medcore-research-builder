/**
 * Library Navigator — one deterministic engine to find the right skill, skill
 * chain, tip, open-source tool, MCP server, or built-in platform feature from
 * MedCore's six knowledge catalogs (380+ entries).
 *
 * Why deterministic instead of an AI chat: results are instant, identical for
 * every user, work offline with no API key, and can never hallucinate an entry
 * that doesn't exist. Two ways in:
 *   1. Guided intent — answer "where are you?" + "what do you need?" (+ level)
 *      and get a curated, ranked shortlist.
 *   2. Free-text search — token-scored ranking across every catalog at once,
 *      with human-readable match reasons.
 */

import { researchSkills, type ResearchSkill, type SkillArea } from "./skills";
import { skillChains, type SkillChain } from "./skillchains";
import { researchTips, type ResearchTip, type TipCategory } from "./methods";
import { ossProjects, type OSSProject } from "./opensource";
import { mcpServers, type MCPServer } from "./mcp";
import { platformIntegrations, type PlatformIntegration } from "./integrations";

/* ── Unified item model ─────────────────────────────────────────────────── */

export type LibraryKind = "skill" | "chain" | "tip" | "tool" | "mcp" | "platform";

export type LibraryItem = {
  /** Globally unique: `${kind}:${id}`. */
  key: string;
  kind: LibraryKind;
  id: string;
  title: string;
  /** One-line plain-language summary. */
  summary: string;
  /** Catalog grouping label (area / category). */
  group: string;
  /** Skill level when applicable. */
  level?: string;
  /** Workspace lane to jump to, when the item lives in the platform. */
  lane?: string;
  /** External verify/home URL for tools and MCP servers. */
  url?: string;
  /** Lifecycle stages this item serves (see NavigatorStage). */
  stages: NavigatorStage[];
  /** Lowercased search haystack: title + group + body text. */
  haystack: string;
};

export type NavigatorStage =
  | "plan"        // question, feasibility, protocol, ethics
  | "literature"  // search, gap, screening
  | "write"       // drafting sections, language
  | "analyze"     // data, statistics, figures
  | "references"  // citations, verification
  | "submit"      // journal choice, formatting, submission
  | "review"      // peer review, revision, quality
  | "publish";    // acceptance, impact, open science

export type NavigatorNeed =
  | "learn"       // skills, chains, tips
  | "tool"        // open-source software
  | "connect-ai"  // MCP servers
  | "platform"    // built-in MedCore features
  | "any";

export const STAGE_OPTIONS: Array<{ id: NavigatorStage; label: string; hint: string }> = [
  { id: "plan", label: "Planning & protocol", hint: "Question, design, feasibility, ethics, protocol" },
  { id: "literature", label: "Literature & gap", hint: "Searching, screening, novelty" },
  { id: "write", label: "Writing sections", hint: "Title, abstract, IMRaD drafting, language" },
  { id: "analyze", label: "Data & statistics", hint: "Analysis, figures, tables, reproducibility" },
  { id: "references", label: "References", hint: "Citing, verifying, reference managers" },
  { id: "submit", label: "Journal & submission", hint: "Choosing journals, formatting, submitting" },
  { id: "review", label: "Peer review & revision", hint: "Responding to reviewers, quality checks" },
  { id: "publish", label: "Publication & impact", hint: "Open science, visibility, identity" },
];

export const NEED_OPTIONS: Array<{ id: NavigatorNeed; label: string; hint: string }> = [
  { id: "any", label: "Anything relevant", hint: "Search all six catalogs" },
  { id: "learn", label: "Learn how", hint: "Skills, step-by-step chains, tips" },
  { id: "platform", label: "A MedCore feature", hint: "Built-in lanes that do it for you" },
  { id: "tool", label: "Software to install", hint: "Vetted open-source tools" },
  { id: "connect-ai", label: "Connect my AI assistant", hint: "MCP servers with verify links" },
];

/* ── Stage inference per catalog ────────────────────────────────────────── */

const SKILL_AREA_STAGES: Record<SkillArea, NavigatorStage[]> = {
  title: ["write", "submit"],
  abstract: ["write", "submit"],
  introduction: ["write"],
  methods: ["write", "plan"],
  results: ["write", "analyze"],
  discussion: ["write"],
  conclusion: ["write"],
  references: ["references"],
  review: ["review"],
  revision: ["review"],
  reproducibility: ["analyze", "publish", "plan"],
  statistics: ["analyze"],
  figures: ["analyze", "write"],
  ethics: ["plan", "publish"],
  writing: ["write"],
  search: ["literature"],
  "peer-review": ["review"],
  productivity: ["plan", "publish"],
};

const TIP_CATEGORY_STAGES: Record<TipCategory, NavigatorStage[]> = {
  planning: ["plan"],
  writing: ["write"],
  structure: ["write"],
  statistics: ["analyze"],
  reproducibility: ["analyze", "publish"],
  literature: ["literature"],
  figures: ["analyze", "write"],
  publishing: ["submit", "publish"],
  revision: ["review"],
  ethics: ["plan"],
  productivity: ["plan"],
  originality: ["write", "review"],
};

/** Keyword → stage hints used for tools/MCP/chains where no area enum exists. */
const STAGE_KEYWORDS: Array<[NavigatorStage, RegExp]> = [
  ["plan", /protocol|preregist|ethics|irb|feasib|design|spirit|consent|registr/i],
  ["literature", /literature|search|screening|systematic review|pubmed|preprint|openalex|europe pmc|arxiv|paper|evidence|citation index|scholar/i],
  ["write", /writ|draft|manuscript|abstract|title|language|markdown|document|word|latex|pandoc/i],
  ["analyze", /statist|analysis|data|figure|plot|notebook|jupyter|r-project|python|model|machine learning|nlp|pipeline|workflow|clean/i],
  ["references", /reference|citat|zotero|bibliograph|doi|retract/i],
  ["submit", /journal|submission|format|cover letter|indexing|doaj|scopus|impact factor/i],
  ["review", /peer.?review|revis|reviewer|quality|coherence|score/i],
  ["publish", /open science|preprint|publish|impact|orcid|repositor|osf|visibility|share/i],
];

function inferStages(text: string, fallback: NavigatorStage[] = []): NavigatorStage[] {
  const hits = STAGE_KEYWORDS.filter(([, re]) => re.test(text)).map(([s]) => s);
  return hits.length ? Array.from(new Set(hits)) : fallback;
}

/* ── Index construction (cached) ────────────────────────────────────────── */

function hay(...parts: Array<string | undefined | string[]>): string {
  return parts
    .flat()
    .filter(Boolean)
    .join(" \n ")
    .toLowerCase();
}

function fromSkill(s: ResearchSkill): LibraryItem {
  return {
    key: `skill:${s.id}`,
    kind: "skill",
    id: s.id,
    title: s.title,
    summary: s.whatYouLearn,
    group: s.area,
    level: s.level,
    lane: "skills",
    stages: SKILL_AREA_STAGES[s.area] || [],
    haystack: hay(s.title, s.area, s.level, s.whatYouLearn, s.steps, s.pitfalls, s.standards),
  };
}

function fromChain(c: SkillChain): LibraryItem {
  return {
    key: `chain:${c.id}`,
    kind: "chain",
    id: c.id,
    title: c.title,
    summary: c.goal,
    group: c.scope,
    lane: "skills",
    stages: inferStages(`${c.title} ${c.goal} ${c.whenToUse}`, ["plan"]),
    haystack: hay(c.title, c.goal, c.whenToUse, c.deliverable, c.steps.map((st) => `${st.title} ${st.doThis}`)),
  };
}

function fromTip(t: ResearchTip): LibraryItem {
  return {
    key: `tip:${t.id}`,
    kind: "tip",
    id: t.id,
    title: t.title,
    summary: t.insight,
    group: t.category,
    lane: "skills",
    stages: TIP_CATEGORY_STAGES[t.category] || [],
    haystack: hay(t.title, t.category, t.insight, t.why, t.how),
  };
}

function fromTool(o: OSSProject): LibraryItem {
  const text = `${o.name} ${o.category} ${o.whatItDoes} ${o.howItHelpsResearch}`;
  return {
    key: `tool:${o.id}`,
    kind: "tool",
    id: o.id,
    title: o.name,
    summary: o.plainSummary || o.whatItDoes,
    group: o.category,
    lane: "toolkit",
    url: o.verifyUrl,
    stages: inferStages(text),
    haystack: hay(o.name, o.org, o.category, o.whatItDoes, o.howItHelpsResearch, o.useCase, o.language),
  };
}

function fromMcp(m: MCPServer): LibraryItem {
  const text = `${m.name} ${m.category} ${m.capability} ${m.useInResearch}`;
  return {
    key: `mcp:${m.id}`,
    kind: "mcp",
    id: m.id,
    title: m.name,
    summary: m.plainSummary || m.capability,
    group: m.category,
    lane: "toolkit",
    url: m.verifyUrl,
    stages: inferStages(text),
    haystack: hay(m.name, m.vendor, m.category, m.capability, m.useInResearch, m.useCase),
  };
}

function fromPlatform(p: PlatformIntegration): LibraryItem {
  const text = `${p.capability} ${p.plainSummary} ${p.useCase || ""}`;
  return {
    key: `platform:${p.id}`,
    kind: "platform",
    id: p.id,
    title: p.capability,
    summary: p.plainSummary,
    group: p.status === "built-in" ? "Built into MedCore" : "Powered by public sources",
    lane: p.lane,
    stages: inferStages(text),
    haystack: hay(p.capability, p.plainSummary, p.useCase, p.poweredBy, p.replacesExternal, p.laneLabel),
  };
}

let INDEX: LibraryItem[] | null = null;

export function libraryIndex(): LibraryItem[] {
  if (!INDEX) {
    INDEX = [
      ...platformIntegrations.map(fromPlatform),
      ...researchSkills.map(fromSkill),
      ...skillChains.map(fromChain),
      ...researchTips.map(fromTip),
      ...ossProjects.map(fromTool),
      ...mcpServers.map(fromMcp),
    ];
  }
  return INDEX;
}

export function libraryCounts(): Record<LibraryKind, number> & { total: number } {
  const counts = { skill: 0, chain: 0, tip: 0, tool: 0, mcp: 0, platform: 0, total: 0 };
  for (const it of libraryIndex()) {
    counts[it.kind]++;
    counts.total++;
  }
  return counts;
}

/* ── Search & recommendation ────────────────────────────────────────────── */

export type NavigatorQuery = {
  /** Free-text query (optional). */
  text?: string;
  stage?: NavigatorStage;
  need?: NavigatorNeed;
  /** Restrict skills to at most this level (beginner < intermediate < advanced < expert). */
  maxLevel?: "beginner" | "intermediate" | "advanced" | "expert";
  limit?: number;
};

export type NavigatorResult = {
  item: LibraryItem;
  score: number;
  /** Human-readable reasons the item matched. */
  reasons: string[];
};

const LEVEL_RANK: Record<string, number> = { beginner: 0, intermediate: 1, advanced: 2, expert: 3 };

const NEED_KINDS: Record<NavigatorNeed, LibraryKind[]> = {
  learn: ["skill", "chain", "tip"],
  tool: ["tool"],
  "connect-ai": ["mcp"],
  platform: ["platform"],
  any: ["platform", "skill", "chain", "tip", "tool", "mcp"],
};

const STOP = new Set([
  "the", "a", "an", "of", "and", "or", "to", "in", "for", "with", "how", "do",
  "i", "my", "me", "what", "is", "are", "on", "by", "from", "need", "want",
]);

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^a-z0-9+]+/)
    .filter((t) => t.length > 1 && !STOP.has(t));
}

/**
 * Rank library items for a query. Pure and deterministic: same inputs, same
 * shortlist, no network. Scoring favours title hits, then group, then body;
 * stage/need filters narrow and boost rather than only excluding.
 */
export function searchLibrary(q: NavigatorQuery): NavigatorResult[] {
  const kinds = new Set(NEED_KINDS[q.need || "any"]);
  const tokens = tokenize(q.text || "");
  const phrase = (q.text || "").trim().toLowerCase();
  const limit = Math.min(Math.max(q.limit ?? 12, 1), 50);

  const results: NavigatorResult[] = [];
  for (const item of libraryIndex()) {
    if (!kinds.has(item.kind)) continue;
    if (q.maxLevel && item.level && LEVEL_RANK[item.level] > LEVEL_RANK[q.maxLevel]) continue;
    if (q.stage && tokens.length === 0 && !item.stages.includes(q.stage)) continue;

    let score = 0;
    const reasons: string[] = [];

    if (q.stage && item.stages.includes(q.stage)) {
      score += 6;
      const label = STAGE_OPTIONS.find((s) => s.id === q.stage)?.label || q.stage;
      reasons.push(`Fits the “${label}” stage`);
    }

    if (tokens.length) {
      const titleLc = item.title.toLowerCase();
      const groupLc = item.group.toLowerCase();
      let titleHits = 0;
      let groupHits = 0;
      let bodyHits = 0;
      for (const t of tokens) {
        if (titleLc.includes(t)) titleHits++;
        else if (groupLc.includes(t)) groupHits++;
        else if (item.haystack.includes(t)) bodyHits++;
      }
      // Require at least one textual hit when the user typed something.
      if (titleHits + groupHits + bodyHits === 0) continue;
      score += titleHits * 4 + groupHits * 3 + bodyHits;
      if (phrase.length > 3 && (titleLc.includes(phrase) || item.haystack.includes(phrase))) {
        score += 5;
        reasons.push("Matches your phrase exactly");
      } else if (titleHits) {
        reasons.push("Matches in the title");
      } else if (groupHits) {
        reasons.push(`Matches its ${item.kind === "skill" ? "skill area" : "category"}`);
      } else {
        reasons.push("Mentioned in the details");
      }
    }

    // Surface built-in platform power first on ties: it requires zero setup.
    if (item.kind === "platform") score += 1;

    if (score > 0) results.push({ item, score, reasons });
  }

  results.sort(
    (a, b) =>
      b.score - a.score ||
      a.item.title.localeCompare(b.item.title),
  );
  return results.slice(0, limit);
}
