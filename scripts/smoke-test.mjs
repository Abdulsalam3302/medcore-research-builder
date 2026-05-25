#!/usr/bin/env node
/**
 * Extended smoke tests — local or production.
 * BASE_URL=https://medcore-research-builder.vercel.app node scripts/smoke-test.mjs
 */

const BASE = process.env.BASE_URL || "http://localhost:3000";

const results = [];

async function check(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`✓ ${name}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    results.push({ name, ok: false, msg });
    console.error(`✗ ${name}: ${msg}`);
  }
}

async function getJson(path) {
  const r = await fetch(`${BASE}${path}`, { cache: "no-store" });
  const text = await r.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`HTTP ${r.status} — not JSON (${text.slice(0, 120)}…)`);
  }
  if (!r.ok) throw new Error(json.error || `HTTP ${r.status}`);
  return json;
}

async function postJson(path, body, expectStatus) {
  const r = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await r.json();
  if (expectStatus !== undefined && r.status !== expectStatus) {
    throw new Error(`expected ${expectStatus}, got ${r.status}: ${json.error || ""}`);
  }
  return { status: r.status, json };
}

console.log(`MedCore smoke tests → ${BASE}\n`);

await check("GET /api/health", async () => {
  const h = await getJson("/api/health");
  if (h.ok !== true) throw new Error("health not ok");
});

await check("GET /api/sign-in → redirect /auth", async () => {
  const r = await fetch(`${BASE}/api/sign-in`, { redirect: "manual" });
  if (r.status !== 307 && r.status !== 308 && r.status !== 302) {
    throw new Error(`expected redirect, got ${r.status}`);
  }
  const loc = r.headers.get("location") || "";
  if (!loc.includes("/auth")) throw new Error(`location=${loc}`);
});

await check("GET /auth", async () => {
  const r = await fetch(`${BASE}/auth`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const html = await r.text();
  if (!html.includes("Sign in")) throw new Error("auth page missing");
});

await check("GET /api/status", async () => {
  const s = await getJson("/api/status");
  if (!s.version) throw new Error("missing version");
});

await check("GET /api/registry", async () => {
  const r = await getJson("/api/registry");
  if (!Array.isArray(r.designs) || r.designs.length < 10) throw new Error("designs missing");
});

await check("GET /api/guidelines", async () => {
  const g = await getJson("/api/guidelines");
  if (!Array.isArray(g.guidelines) || g.guidelines.length < 5) throw new Error("guidelines missing");
});

await check("GET /api/pubmed/search", async () => {
  const p = await getJson("/api/pubmed/search?q=heart+failure&retmax=2");
  if (!Array.isArray(p.results)) throw new Error("results missing");
});

await check("POST /api/references/verify (empty → 400)", async () => {
  await postJson("/api/references/verify", {}, 400);
});

await check("POST /api/references/verify (demo ref)", async () => {
  const raw =
    "Page MJ, McKenzie JE, Bossuyt PM, et al. The PRISMA 2020 statement. BMJ. 2021;372:n71.";
  const { status, json } = await postJson("/api/references/verify", { raw }, 200);
  if (status !== 200) throw new Error("verify failed");
  if (!Array.isArray(json.verifications) || json.verifications.length < 1) {
    throw new Error("no verifications returned");
  }
});

await check("GET / (HTML shell)", async () => {
  const r = await fetch(`${BASE}/`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const html = await r.text();
  if (!html.includes("MedCore")) throw new Error("title missing in HTML");
});

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length) {
  process.exitCode = 1;
}
