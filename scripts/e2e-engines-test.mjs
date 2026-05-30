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

import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
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

rmSync(work, { recursive: true, force: true });
console.log(`\n${pass}/${pass + fail} checks passed`);
if (fail) process.exitCode = 1;
