import { test, expect, request } from "@playwright/test";

/**
 * PERSONA: Developer + security tester.
 * Exercises the API contract, security headers, rate limiting, input
 * validation, error handling, and abuse resistance — directly against the API.
 */
const BASE = process.env.BASE_URL || "http://localhost:3210";

test.describe("Developer — API contract", () => {
  test("health + status return expected shape", async () => {
    const ctx = await request.newContext({ baseURL: BASE });
    const h = await (await ctx.get("/api/health")).json();
    expect(h.ok).toBe(true);
    const s = await (await ctx.get("/api/status")).json();
    expect(s.version).toBeTruthy();
    expect(s.rateLimit).toBeTruthy();
  });

  test("journal finder returns ranked matches + counts", async () => {
    const ctx = await request.newContext({ baseURL: BASE });
    const r = await ctx.post("/api/journals/finder", { data: { title: "diabetes trial", limit: 5 } });
    expect(r.status()).toBe(200);
    const j = await r.json();
    expect(Array.isArray(j.matches)).toBe(true);
    expect(j.counts.total).toBeGreaterThan(20);
  });
});

test.describe("Security tester", () => {
  test("security headers present on a page", async () => {
    const ctx = await request.newContext({ baseURL: BASE });
    const res = await ctx.get("/");
    const h = res.headers();
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["x-frame-options"]).toBeTruthy();
    expect(h["referrer-policy"]).toBeTruthy();
    expect(h["content-security-policy"]).toBeTruthy();
  });

  test("malformed JSON is rejected with 400, not 500/502", async () => {
    const ctx = await request.newContext({ baseURL: BASE });
    const res = await ctx.post("/api/references/verify", { headers: { "content-type": "application/json" }, data: "not-json" });
    expect(res.status()).toBe(400);
  });

  test("admin announcements endpoint is gated (not open)", async () => {
    const ctx = await request.newContext({ baseURL: BASE });
    const res = await ctx.post("/api/admin/announcements", { data: { title: "x", body: "y" } });
    // 503 (no supabase) or 403 (not admin) — never 200 for an anonymous caller.
    expect([401, 403, 503]).toContain(res.status());
  });

  test("admin observability endpoint is gated (not open)", async () => {
    const ctx = await request.newContext({ baseURL: BASE });
    const res = await ctx.get("/api/admin/observability");
    expect([401, 403, 503]).toContain(res.status());
  });

  test("rate limiting eventually returns 429 under a burst", async () => {
    const ctx = await request.newContext({ baseURL: BASE });
    let got429 = false;
    for (let i = 0; i < 70; i++) {
      const res = await ctx.post("/api/references/verify", { data: {} });
      if (res.status() === 429) { got429 = true; break; }
    }
    expect(got429).toBe(true);
  });

  test("upstream errors do not leak provider internals", async () => {
    const ctx = await request.newContext({ baseURL: BASE });
    const res = await ctx.get("/api/pubmed/search?q=heart");
    if (res.status() >= 500) {
      const body = await res.text();
      expect(body).not.toMatch(/api[_-]?key|bearer|eutils\.ncbi.*key=/i);
    }
  });
});
