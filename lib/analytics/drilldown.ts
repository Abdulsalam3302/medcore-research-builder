import { createAdminClient } from "@/lib/supabase/admin";
import { countryLabel, countryFlag, isPrimaryGeo, PRIMARY_GEO_CODE } from "./countries";
import { maskEmail, maskIpHash, userRef } from "./mask";
import type {
  AuditTrailPayload,
  GeoInsightPayload,
  LLMInsightPayload,
  PageInsightPayload,
  TopItem,
  UsersInsightPayload,
} from "./types";

type RawEvent = {
  id: string;
  created_at: string;
  event_type: string;
  category: string;
  path: string | null;
  method: string | null;
  country: string | null;
  region: string | null;
  referrer: string | null;
  session_id: string | null;
  ip_hash: string | null;
  user_id: string | null;
  metadata: Record<string, unknown> | null;
  severity: string;
  user_agent_family: string | null;
};

function daysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString();
}

function topCounts(
  events: RawEvent[],
  pick: (e: RawEvent) => string | null | undefined,
  limit = 15,
): TopItem[] {
  const map = new Map<string, number>();
  for (const e of events) {
    const key = pick(e);
    if (!key) continue;
    map.set(key, (map.get(key) || 0) + 1);
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
}

async function fetchEvents(since: string, filters?: { eventType?: string; path?: string; userId?: string }) {
  const admin = createAdminClient();
  if (!admin) return [];

  let q = admin
    .from("analytics_events")
    .select(
      "id, created_at, event_type, category, path, method, country, region, referrer, session_id, ip_hash, user_id, metadata, severity, user_agent_family",
    )
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (filters?.eventType) q = q.eq("event_type", filters.eventType);
  if (filters?.path) q = q.eq("path", filters.path);
  if (filters?.userId) q = q.eq("user_id", filters.userId);

  const { data, error } = await q;
  if (error) throw error;
  return (data || []) as RawEvent[];
}

export async function buildUsersInsight(days: number): Promise<UsersInsightPayload> {
  const admin = createAdminClient();
  if (!admin) {
    return { total: 0, activeInRange: 0, users: [], note: "Analytics not configured" };
  }

  const since = daysAgo(days);
  const events = await fetchEvents(since);

  const activityByUser = new Map<string, { count: number; lastAt: string; types: Set<string> }>();
  for (const e of events) {
    if (!e.user_id) continue;
    const cur = activityByUser.get(e.user_id) || { count: 0, lastAt: e.created_at, types: new Set<string>() };
    cur.count++;
    if (e.created_at > cur.lastAt) cur.lastAt = e.created_at;
    cur.types.add(e.event_type);
    activityByUser.set(e.user_id, cur);
  }

  let profiles: Array<{ id: string; email: string | null; role: string }> = [];
  try {
    const { data } = await admin.from("profiles").select("id, email, role").order("email");
    profiles = data || [];
  } catch {
    /* optional */
  }

  if (!profiles.length) {
    try {
      const { data: authData } = await admin.auth.admin.listUsers({ perPage: 1000 });
      profiles = (authData?.users || []).map((u) => ({
        id: u.id,
        email: u.email ?? null,
        role: "user",
      }));
    } catch {
      /* auth admin unavailable */
    }
  }

  const authUsers = new Map<string, { createdAt: string | null }>();
  try {
    const { data: authData } = await admin.auth.admin.listUsers({ perPage: 1000 });
    for (const u of authData?.users || []) {
      authUsers.set(u.id, { createdAt: u.created_at ?? null });
    }
  } catch {
    /* optional */
  }

  const users = profiles.map((p) => {
    const act = activityByUser.get(p.id);
    const auth = authUsers.get(p.id);
    return {
      id: p.id,
      ref: userRef(p.id),
      maskedEmail: maskEmail(p.email),
      role: p.role,
      registeredAt: auth?.createdAt ?? null,
      eventCount: act?.count ?? 0,
      lastActiveAt: act?.lastAt ?? null,
      eventTypes: act ? [...act.types].sort() : [],
    };
  });

  users.sort((a, b) => (b.lastActiveAt || "").localeCompare(a.lastActiveAt || ""));

  return {
    total: users.length,
    activeInRange: users.filter((u) => u.eventCount > 0).length,
    users: users.slice(0, 100),
    note: "Emails are masked. Full addresses are never shown in observability.",
  };
}

export async function buildPageInsight(days: number, path?: string): Promise<PageInsightPayload> {
  const since = daysAgo(days);
  const events = path
    ? await fetchEvents(since, { eventType: "page_view", path })
    : await fetchEvents(since, { eventType: "page_view" });

  const pageViews = path ? events : events.filter((e) => e.event_type === "page_view");

  const byPath = topCounts(pageViews, (e) => e.path || "/");
  const byReferrer = topCounts(pageViews, (e) => e.referrer || "direct");
  const byCountry = topCounts(pageViews, (e) => countryLabel(e.country));
  const byUa = topCounts(pageViews, (e) => e.user_agent_family || "unknown");

  const daily = new Map<string, number>();
  for (const e of pageViews) {
    const day = e.created_at.slice(0, 10);
    daily.set(day, (daily.get(day) || 0) + 1);
  }

  const sessions = new Set(pageViews.map((e) => e.session_id).filter(Boolean));

  return {
    path: path || null,
    totalViews: pageViews.length,
    uniqueSessions: sessions.size,
    topPaths: path ? [{ label: path, count: pageViews.length }] : byPath,
    topReferrers: byReferrer,
    topCountries: byCountry.map((c) => ({
      ...c,
      label: c.label,
    })),
    topUserAgents: byUa,
    dailyViews: [...daily.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count })),
  };
}

export async function buildGeoInsight(days: number): Promise<GeoInsightPayload> {
  const since = daysAgo(days);
  const events = await fetchEvents(since);
  const pageViews = events.filter((e) => e.event_type === "page_view");

  const byCode = new Map<string, number>();
  for (const e of pageViews) {
    const code = (e.country || "XX").toUpperCase();
    byCode.set(code, (byCode.get(code) || 0) + 1);
  }

  const total = pageViews.length || 1;
  const countries = [...byCode.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([code, count]) => ({
      code,
      name: countryLabel(code),
      flag: countryFlag(code),
      count,
      sharePct: Math.round((count / total) * 1000) / 10,
      isPrimary: isPrimaryGeo(code),
    }));

  const sa = countries.find((c) => c.code === PRIMARY_GEO_CODE);
  const saCount = sa?.count ?? 0;
  const saShare = sa?.sharePct ?? 0;

  return {
    totalViews: pageViews.length,
    primaryGeo: {
      code: PRIMARY_GEO_CODE,
      name: countryLabel(PRIMARY_GEO_CODE),
      count: saCount,
      sharePct: saShare,
    },
    countries,
    note: "Country codes are ISO 3166-1 alpha-2 (e.g. IN = India, SA = Saudi Arabia). Derived from Vercel/Cloudflare geo headers.",
  };
}

export async function buildLLMInsight(days: number): Promise<LLMInsightPayload> {
  const since = daysAgo(days);
  const events = await fetchEvents(since, { eventType: "llm_call" });

  let totalCalls = events.length;
  let promptTokens = 0;
  let completionTokens = 0;
  let totalTokens = 0;
  let errors = 0;
  let totalLatencyMs = 0;

  const byRoute = new Map<string, { calls: number; tokens: number }>();
  const byProvider = new Map<string, { calls: number; tokens: number }>();
  const byDay = new Map<string, number>();

  for (const e of events) {
    const meta = e.metadata || {};
    const pt = Number(meta.promptTokens || 0);
    const ct = Number(meta.completionTokens || 0);
    const tt = Number(meta.totalTokens || pt + ct);
    promptTokens += pt;
    completionTokens += ct;
    totalTokens += tt;
    if (meta.error) errors++;
    totalLatencyMs += Number(meta.latencyMs || 0);

    const route = String(meta.route || e.path || "unknown");
    const prov = String(meta.provider || "unknown");
    const rCur = byRoute.get(route) || { calls: 0, tokens: 0 };
    rCur.calls++;
    rCur.tokens += tt;
    byRoute.set(route, rCur);

    const pCur = byProvider.get(prov) || { calls: 0, tokens: 0 };
    pCur.calls++;
    pCur.tokens += tt;
    byProvider.set(prov, pCur);

    const day = e.created_at.slice(0, 10);
    byDay.set(day, (byDay.get(day) || 0) + 1);
  }

  const topRoutes = [...byRoute.entries()]
    .sort((a, b) => b[1].calls - a[1].calls)
    .slice(0, 15)
    .map(([label, v]) => ({ label, count: v.calls, tokens: v.tokens }));

  const byProviderList = [...byProvider.entries()]
    .sort((a, b) => b[1].tokens - a[1].tokens)
    .map(([label, v]) => ({ label, count: v.calls, tokens: v.tokens }));

  const recent = events.slice(0, 30).map((e) => {
    const meta = e.metadata || {};
    return {
      id: e.id,
      at: e.created_at,
      route: String(meta.route || e.path || "unknown"),
      provider: String(meta.provider || "—"),
      model: String(meta.model || "—"),
      promptTokens: Number(meta.promptTokens || 0),
      completionTokens: Number(meta.completionTokens || 0),
      totalTokens: Number(meta.totalTokens || 0),
      latencyMs: Number(meta.latencyMs || 0),
      ok: !meta.error,
      userRef: userRef(e.user_id),
    };
  });

  return {
    totalCalls,
    promptTokens,
    completionTokens,
    totalTokens,
    errors,
    avgLatencyMs: totalCalls ? Math.round(totalLatencyMs / totalCalls) : 0,
    topRoutes,
    byProvider: byProviderList,
    dailyCalls: [...byDay.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count })),
    recent,
    note: "Token counts are logged server-side from LLM provider responses. No prompt/response content is stored.",
  };
}

export async function buildAuditInsight(days: number, userId?: string): Promise<AuditTrailPayload> {
  const since = daysAgo(days);
  const events = userId ? await fetchEvents(since, { userId }) : await fetchEvents(since);

  const auditTypes = new Set([
    "signup",
    "login",
    "logout",
    "auth_failed",
    "project_sync",
    "share_created",
    "feature_use",
    "llm_call",
    "api_call",
  ]);

  const filtered = events.filter((e) => auditTypes.has(e.event_type));

  const byType = topCounts(filtered, (e) => e.event_type);
  const byUser = topCounts(filtered, (e) => userRef(e.user_id));

  const entries = filtered.slice(0, 80).map((e) => {
    const meta = e.metadata || {};
    let summary = e.event_type.replace(/_/g, " ");
    if (e.event_type === "feature_use") summary = `Feature · ${String(meta.feature || "unknown")}`;
    if (e.event_type === "llm_call") summary = `LLM · ${String(meta.route || e.path || "unknown")}`;
    if (e.event_type === "project_sync") summary = "Cloud project saved";
    if (e.event_type === "share_created") summary = "Share link created";
    if (e.event_type === "auth_failed") summary = `Auth failed · ${String(meta.mode || "unknown")}`;

    return {
      id: e.id,
      at: e.created_at,
      eventType: e.event_type,
      category: e.category,
      summary,
      path: e.path,
      country: e.country ? countryLabel(e.country) : null,
      userRef: userRef(e.user_id),
      ipHash: maskIpHash(e.ip_hash),
      severity: e.severity,
    };
  });

  return {
    userId: userId || null,
    userRef: userId ? userRef(userId) : null,
    totalEvents: filtered.length,
    byEventType: byType,
    byUser,
    entries,
    note: "Audit trail shows hashed IPs and masked user refs — no raw PII.",
  };
}
