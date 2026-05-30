#!/usr/bin/env node
/**
 * End-to-end engine test — exercises the pure analysis engines against a
 * deliberately CONFLICTED manuscript and asserts each conflict is detected.
 *
 * The engines are TypeScript with `@/` path aliases and type-only imports, so
 * this harness transpiles them to a temp dir with `tsc` (already a dev dep)
 * and runs the emitted JS under Node. No network, no browser, no API key.
 *
 * Run:  node scripts/e2e-engines-test.mjs
 */

import { mkdtempSync, writeFileSync, rmSync, readFileSync, readdirSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";

/** Recursively list emitted .js files. */
function walkJs(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walkJs(full));
    else if (name.endsWith(".js")) out.push(full);
  }
  return out;
}
import { fileURLToPath, pathToFileURL } from "node:url";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const work = mkdtempSync(path.join(tmpdir(), "medcore-e2e-"));
const outDir = path.join(work, "out");

let pass = 0;
let fail = 0;
const ok = (n) => { pass++; console.log(`✓ ${n}`); };
const no = (n, m) => { fail++; console.error(`✗ ${n}: ${m}`); };

const FILES = [
  "lib/coherence.ts",
  "lib/journals/index.ts",
  "lib/journals/formatting.ts",
  "lib/references/safety.ts",
  "lib/protocol/generator.ts",
  "lib/eval/scorecard.ts",
  "lib/swarm/orchestrator.ts",
  "lib/knowledge/skills.ts",
  "lib/knowledge/methods.ts",
  "lib/knowledge/opensource.ts",
  "lib/knowledge/mcp.ts",
  "lib/knowledge/skillchains.ts",
  "lib/knowledge/integrations.ts",
];

const tsconfig = {
  compilerOptions: {
    outDir, module: "commonjs", target: "es2020", moduleResolution: "node",
    skipLibCheck: true, esModuleInterop: true, baseUrl: repo,
    paths: { "@/*": ["./*"] }, noEmitOnError: false,
  },
  files: FILES.map((f) => path.join(repo, f)),
};
const cfgPath = path.join(work, "tsconfig.json");
writeFileSync(cfgPath, JSON.stringify(tsconfig));

console.log("MedCore E2E engine test\n");
try {
  // `require` in journals/index.ts triggers a known TS2580 with no @types in
  // this isolated config; the JS still emits and runs fine, so ignore it.
  try {
    execFileSync("npx", ["tsc", "-p", cfgPath], { cwd: repo, stdio: "pipe" });
  } catch { /* emit-on-error: JS is still produced */ }
  // TS resolves the `@/` path alias for types but emits a literal
  // `require("@/lib/x")` Node can't resolve. Rewrite those to relative paths
  // against each emitted file's location so the modules load standalone.
  for (const jsPath of walkJs(outDir)) {
    let src = readFileSync(jsPath, "utf8");
    if (src.includes('require("@/')) {
      src = src.replace(/require\("@\/lib\/([^"]+)"\)/g, (_m, sub) => {
        const target = path.join(outDir, sub);
        let rel = path.relative(path.dirname(jsPath), target).replace(/\\/g, "/");
        if (!rel.startsWith(".")) rel = "./" + rel;
        return `require("${rel}")`;
      });
      writeFileSync(jsPath, src);
    }
  }
  ok("engines transpile to JS");
} catch (e) {
  no("transpile", e.message);
}

async function load(rel) {
  return import(pathToFileURL(path.join(outDir, rel)).href);
}

const project = {
  version: "3.0.0", createdAt: "", updatedAt: "",
  researchTypeAnswers: { designId: "obs.cross-sectional", manuscriptType: "original_investigation", featureIds: [] },
  titleInputs: { draftTitle: "A randomized controlled trial of vitamin D in elderly fallers", population: "elderly", outcome: "falls" },
  titleFinal: "A randomized controlled trial of vitamin D in elderly fallers",
  titleCandidates: [],
  sections: {
    introduction: "Falls are common in elderly people. Vitamin D deficiency is prevalent. We aimed to assess the association between vitamin D and falls in a cross-sectional survey.",
    methods: "We surveyed 300 community-dwelling elderly. We measured serum vitamin D and self-reported falls. We computed odds ratios.",
    results: "Among n=300 participants, 40% reported a fall. Lower vitamin D was associated with falls (OR=1.8, 95% CI 1.2 to 2.7, p<0.01).",
    discussion: "Vitamin D supplementation prevents falls and causes improved bone density. The mortality reduction was 25% (p=0.03).",
    conclusion: "This is the first study to prove that vitamin D eliminates falls in all elderly people.",
  },
  sectionFeedback: {}, references: { raw: "", verifications: [] }, appendices: [],
};

try {
  const { analyzeCoherence } = await load("coherence.js");
  const rep = analyzeCoherence(project);
  const areas = rep.issues.map((i) => i.area.toLowerCase()).join(" | ");
  const has = (kw) => areas.includes(kw);
  if (rep.issues.length >= 4) ok(`coherence flags multiple conflicts (${rep.issues.length})`); else no("coherence count", `${rep.issues.length}`);
  if (has("causal")) ok("coherence: causal language in observational design"); else no("coherence causal", areas);
  if (has("design")) ok("coherence: RCT-title vs observational-design conflict"); else no("coherence design", areas);
  if (has("results") || has("discussion")) ok("coherence: discussion number not in results (overclaim)"); else no("coherence overclaim", areas);
} catch (e) { no("coherence run", e.message); }

try {
  const { findJournals, journalCount } = await load("journals/index.js");
  const c = journalCount();
  if (c.total >= 40 && c.saudi >= 15) ok(`journal db loaded (${c.total} total, ${c.saudi} Saudi)`); else no("journal counts", JSON.stringify(c));
  if (c.total === c.curated + c.generated) ok("journal count math consistent"); else no("count math", JSON.stringify(c));
  const m = findJournals({ title: "diabetes cardiovascular trial", specialties: ["cardiology", "diabetes"], manuscriptType: "original_investigation" }, {}, 3);
  if (m.length && typeof m[0].score === "number") ok(`journal finder ranks (top: ${m[0].journal.name})`); else no("journal ranking", "no matches");
  const saudi = findJournals({ title: "health systems" }, { saudiOnly: true }, 5);
  if (saudi.every((x) => x.journal.saudi)) ok("Saudi-only filter is clean"); else no("Saudi filter", "leaked");
} catch (e) { no("journals run", e.message); }

try {
  const { assessReferenceSafety } = await load("references/safety.js");
  const safety = assessReferenceSafety(
    [{ parsed: { title: "Unrelated quantum paper" }, checks: { metadataMatch: false, duplicate: false, possibleRetractionOrConcern: true }, confidence: "low", sources: {} }],
    "Vitamin D and falls in elderly adults.",
  );
  const kinds = safety.flags.map((f) => f.kind).join(",");
  if (kinds.includes("retracted")) ok("reference safety flags retraction (critical)"); else no("ref safety retraction", kinds);
} catch (e) { no("safety run", e.message); }

try {
  const gen = await load("protocol/generator.js");
  const skel = gen.buildProtocolSkeleton({ researchTypeAnswers: { designId: "interv.rct.parallel", manuscriptType: "protocol" }, titleInputs: { draftTitle: "RCT", population: "x", intervention: "y", outcome: "z" }, researchLaunch: {}, sections: {}, references: { verifications: [] } });
  if (skel.length > 1000 && /SPIRIT/i.test(skel)) ok("offline protocol skeleton (SPIRIT-aware, no API key)"); else no("protocol skeleton", `${skel.length} chars`);
} catch (e) { no("protocol run", e.message); }

// ---- v3: eval harness proves a better manuscript scores higher ----
try {
  const { evaluateManuscript, compareEvaluations } = await load("eval/scorecard.js");
  const weak = { ...project, sections: { introduction: "Falls happen.", methods: "We looked.", results: "Some fell.", discussion: "It matters.", conclusion: "Done." } };
  const strong = {
    ...project,
    references: { raw: "", verifications: [{ parsed: {}, checks: {}, confidence: "high", sources: {} }] },
    sections: {
      introduction: "Falls are a leading cause of injury in older adults. Despite known risk factors, the association between vitamin D status and falls remains unclear, and few studies have quantified it prospectively. We aimed to estimate this association.",
      methods: "In this prospective cohort we enrolled 1200 community-dwelling adults. The primary outcome was incident falls over 12 months. We calculated a priori sample size for 80% power. We adjusted for confounders and ran a sensitivity analysis. Ethics approval and informed consent were obtained.",
      results: "Among 1200 participants, lower vitamin D was associated with falls (adjusted OR=1.6, 95% CI 1.2 to 2.1). Effect sizes are reported with confidence intervals.",
      discussion: "Our findings align with prior cohorts. Limitations include residual confounding. Funding and competing interests are disclosed.",
      conclusion: "Lower vitamin D was associated with a modestly higher fall risk; causal inference is limited by the observational design.",
    },
  };
  const ev = evaluateManuscript(strong);
  if (ev.overall > 0 && ev.dimensions.length >= 10 && ["A","B","C","D","F"].includes(ev.grade)) ok(`scorecard evaluates (overall ${ev.overall}, grade ${ev.grade}, ${ev.dimensions.length} dims)`); else no("scorecard shape", JSON.stringify({o:ev.overall,g:ev.grade,d:ev.dimensions.length}));
  const delta = compareEvaluations(weak, strong);
  if (delta.overallDelta > 0 && delta.verdict.includes("improvement")) ok(`eval proves improvement weak→strong (+${delta.overallDelta}, ${delta.verdict})`); else no("eval delta", JSON.stringify({d:delta.overallDelta,v:delta.verdict}));
} catch (e) { no("eval run", e.message); }

// ---- v3: swarm offline synthesis returns a valid report with no LLM ----
try {
  const { buildSwarmContext, synthesizeReport } = await load("swarm/orchestrator.js");
  const { analyzeCoherence } = await load("coherence.js");
  const coh = analyzeCoherence(project);
  buildSwarmContext(project); // must not throw
  const report = synthesizeReport([], coh);
  const hasLayers = report.scorecard && typeof report.overallVerdict === "string";
  if (hasLayers && Array.isArray(report.findings)) ok(`swarm offline synthesis works (verdict ${report.overallVerdict})`); else no("swarm offline", JSON.stringify(Object.keys(report)));
} catch (e) { no("swarm run", e.message); }

// ---- v3: knowledge registries load with expected volume ----
try {
  const skills = await load("knowledge/skills.js");
  const methods = await load("knowledge/methods.js");
  const oss = await load("knowledge/opensource.js");
  const mcp = await load("knowledge/mcp.js");
  const nSkills = skills.researchSkills?.length ?? 0;
  const nTips = methods.researchTips?.length ?? 0;
  const nOss = oss.ossProjects?.length ?? 0;
  const nMcp = mcp.mcpServers?.length ?? 0;
  if (nSkills >= 180) ok(`skills library loaded (${nSkills})`); else no("skills count", `${nSkills} (<180)`);
  if (nTips >= 60) ok(`tips/methods loaded (${nTips})`); else no("tips count", `${nTips}`);
  if (nOss >= 18) ok(`open-source registry loaded (${nOss})`); else no("oss count", `${nOss}`);
  if (nMcp >= 40) ok(`MCP registry loaded (${nMcp})`); else no("mcp count", `${nMcp}`);
  // Honesty: every OSS + MCP entry must carry a verifyUrl.
  const ossOk = (oss.ossProjects || []).every((p) => p.verifyUrl);
  const mcpOk = (mcp.mcpServers || []).every((p) => p.verifyUrl);
  if (ossOk && mcpOk) ok("every registry entry has a verify link (no unsourced claims)"); else no("verify links", `oss=${ossOk} mcp=${mcpOk}`);
  // GitHub-verified enrichment: most OSS entries should now carry real stars + a verified date.
  const verified = (oss.ossProjects || []).filter((p) => typeof p.stars === "number" && p.verifiedAt);
  if (verified.length >= 18) ok(`OSS registry GitHub-verified with live stars (${verified.length}/${nOss})`); else no("oss verified", `${verified.length}/${nOss}`);
} catch (e) { no("knowledge run", e.message); }

// v4: skill chains (epics) + platform integrations
try {
  const chains = await load("knowledge/skillchains.js");
  const nChains = chains.skillChains?.length ?? 0;
  if (nChains >= 10) ok(`skill chains / epics loaded (${nChains})`); else no("chains", `${nChains}`);
  const integ = await load("knowledge/integrations.js");
  const nInteg = integ.platformIntegrations?.length ?? 0;
  if (nInteg >= 8) ok(`platform integrations documented (${nInteg})`); else no("integrations", `${nInteg}`);
} catch (e) { no("chains/integrations run", e.message); }

// v4: journals enriched with 2026 data — free-APC + verifiedAt present
try {
  const { allJournals } = await load("journals/index.js");
  const all = allJournals();
  const freeApc = all.filter((j) => j.freeApc === true).length;
  const verified2026 = all.filter((j) => j.verifiedAt === "2026-05-30").length;
  if (all.length >= 60) ok(`journal DB expanded (${all.length} journals)`); else no("journal expand", `${all.length}`);
  if (freeApc >= 5) ok(`free-APC journals present (${freeApc})`); else no("free-apc", `${freeApc}`);
  if (verified2026 >= 30) ok(`journals carry 2026 verification (${verified2026})`); else no("verified2026", `${verified2026}`);
} catch (e) { no("journal v4 run", e.message); }

rmSync(work, { recursive: true, force: true });
console.log(`\n${pass}/${pass + fail} checks passed`);
if (fail) process.exitCode = 1;
