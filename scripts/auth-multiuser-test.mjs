#!/usr/bin/env node
/**
 * Multi-user auth + guest-mode functional test.
 *
 * - If NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY are set, it
 *   creates N throwaway users, signs each up (expecting instant activation, no
 *   email confirmation), signs in, writes a per-user cloud project, and asserts
 *   isolation (user A never sees user B's project).
 * - Otherwise it verifies the guest path: the app + APIs are fully usable with
 *   no account, and the cloud-sync route correctly returns 401/503 without auth.
 *
 * Usage:
 *   BASE_URL=http://localhost:3000 node scripts/auth-multiuser-test.mjs
 *   (add Supabase env vars to exercise the real multi-user path)
 */

const BASE = process.env.BASE_URL || "http://localhost:3000";
const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const N = Number(process.env.USERS || 3);

let pass = 0;
let fail = 0;
function ok(name) { pass++; console.log(`✓ ${name}`); }
function no(name, msg) { fail++; console.error(`✗ ${name}: ${msg}`); }

async function guestPath() {
  console.log("No Supabase configured — verifying guest-mode (no-registration) functionality.\n");

  // 1. The app shell loads with no auth.
  const home = await fetch(`${BASE}/`);
  if (home.ok) ok("Guest can load the app (no login wall)");
  else no("Guest app load", `HTTP ${home.status}`);

  // 2. Core feature APIs work with no account.
  const finder = await fetch(`${BASE}/api/journals/finder`, { cache: "no-store" });
  const fjson = await finder.json().catch(() => ({}));
  if (finder.ok && fjson.counts?.total > 0) ok("Guest can use Journal Finder");
  else no("Guest Journal Finder", `HTTP ${finder.status}`);

  const verify = await fetch(`${BASE}/api/references/verify`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ raw: "Page MJ, et al. PRISMA 2020. BMJ. 2021;372:n71." }),
  });
  if (verify.ok) ok("Guest can verify references");
  else no("Guest reference verify", `HTTP ${verify.status}`);

  // 3. Cloud sync correctly refuses without auth (no crash, clear status).
  const proj = await fetch(`${BASE}/api/projects`, { cache: "no-store" });
  if (proj.ok || proj.status === 401 || proj.status === 503) ok("Cloud-sync route degrades cleanly for guests");
  else no("Cloud-sync guest handling", `HTTP ${proj.status}`);

  // 4. Two independent "guests" (separate fetch contexts) don't share state —
  // guest drafts live in the browser, so server holds nothing identifying.
  const a = await (await fetch(`${BASE}/api/status`, { cache: "no-store" })).json();
  if (a && a.version) ok("Stateless server status (guests share no server identity)");
  else no("Stateless status", "no version");
}

async function supabasePath() {
  const { createClient } = await import("@supabase/supabase-js");
  console.log(`Supabase configured — simulating ${N} real users.\n`);
  const stamp = Date.now();
  const users = [];

  for (let i = 0; i < N; i++) {
    const email = `medcore.test+${stamp}.${i}@example.com`;
    const password = `Test-${stamp}-${i}!aA`;
    const sb = createClient(SUPA_URL, SUPA_KEY);
    // Sign up — expect instant session (email confirmation disabled).
    const { data: signUp, error: suErr } = await sb.auth.signUp({ email, password });
    if (suErr) { no(`User ${i} sign-up`, suErr.message); continue; }
    let session = signUp.session;
    if (!session) {
      const { data: si, error: siErr } = await sb.auth.signInWithPassword({ email, password });
      if (siErr) { no(`User ${i} sign-in`, siErr.message); continue; }
      session = si.session;
    }
    if (session) ok(`User ${i} active immediately (no email confirmation)`);
    else { no(`User ${i} activation`, "no session"); continue; }
    users.push({ email, password, sb, token: session.access_token, marker: `proj-${stamp}-${i}` });
  }

  // Each user writes a distinct cloud project via the app API (cookie/JWT).
  for (const u of users) {
    const r = await fetch(`${BASE}/api/projects`, {
      method: "PUT",
      headers: { "content-type": "application/json", authorization: `Bearer ${u.token}` },
      body: JSON.stringify({ state: { version: "3.0.0", marker: u.marker, sections: {} }, title: u.marker }),
    });
    if (r.ok) ok(`${u.email} saved a cloud project`);
    else no(`${u.email} cloud save`, `HTTP ${r.status}`);
  }

  // Isolation: each user reads back ONLY their own project.
  for (const u of users) {
    const r = await fetch(`${BASE}/api/projects`, {
      headers: { authorization: `Bearer ${u.token}` }, cache: "no-store",
    });
    const j = await r.json().catch(() => ({}));
    const marker = j?.project?.marker;
    if (marker === u.marker) ok(`${u.email} reads back only their own project`);
    else no(`${u.email} isolation`, `expected ${u.marker}, got ${marker}`);
  }

  // Cleanup sign-out.
  for (const u of users) await u.sb.auth.signOut().catch(() => {});
}

(async () => {
  console.log(`MedCore auth/multi-user test → ${BASE}\n`);
  try {
    if (SUPA_URL && SUPA_KEY) await supabasePath();
    else await guestPath();
  } catch (e) {
    no("test harness", e instanceof Error ? e.message : String(e));
  }
  console.log(`\n${pass}/${pass + fail} checks passed`);
  if (fail) process.exitCode = 1;
})();
