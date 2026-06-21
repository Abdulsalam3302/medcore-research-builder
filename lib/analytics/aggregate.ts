import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimitBackend } from "@/lib/rateLimit";
import { countryLabel, isPrimaryGeo, PRIMARY_GEO_CODE } from "./countries";
import type {
  ActivityFeedItem,
  DailyCount,
  ObservabilityAlert,
  ObservabilityPayload,
  RetrospectiveReport,
  TopItem,
} from "./types";

type RawEvent = {
  id: string;
  created_at: string;
  event_type: string;
  category: string;
  path: string | null;
  country: string | null;
  severity: string;
  referrer: string | null;
  session_id: string | null;
  ip_hash: string | null;
  metadata: Record<string, unknown> | null;
  user_agent_family: string | null;
  method: string | null;
};

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function hoursAgo(n: number): string {
  const d = new Date();
  d.setTime(d.getTime() - n * 3_600_000);
  return d.toISOString();
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString();
}

function countByDay(events: RawEvent[], eventType?: string): DailyCount[] {
  const map = new Map<string, number>();
  for (const e of events) {
    if (eventType && e.event_type !== eventType) continue;
    const day = e.created_at.slice(0, 10);
    map.set(day, (map.get(day) || 0) + 1);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));
}

function topCounts(
  events: RawEvent[],
  pick: (e: RawEvent) => string | null | undefined,
  limit = 10,
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

function uniqueSessions(events: RawEvent[], since?: string): number {
  const set = new Set<string>();
  for (const e of events) {
    if (since && e.created_at < since) continue;
    if (e.session_id) set.add(e.session_id);
  }
  return set.size;
}

function summarizeEvent(e: RawEvent): string {
  const meta = e.metadata || {};
  switch (e.event_type) {
    case "page_view":
      return `Page view · ${e.path || "/"}`;
    case "signup":
      return "New account signup";
    case "login":
      return "User login";
    case "auth_failed":
      return `Auth failed · ${String(meta.mode || "unknown")}`;
    case "rate_limit":
      return `Rate limit · ${String(meta.tier || "default")} · ${e.path || "api"}`;
    case "api_call":
      return `API · ${e.method || "GET"} ${e.path || ""}`;
    case "feature_use":
      return `Feature · ${String(meta.feature || e.path || "unknown")}`;
    case "share_created":
      return "Share link created";
    case "project_sync":
      return "Cloud project sync";
    case "llm_call":
      return `LLM · ${String(meta.route || e.path || "unknown")} · ${Number(meta.totalTokens || 0)} tokens`;
    default:
      return e.event_type.replace(/_/g, " ");
  }
}

function buildAlerts(
  events: RawEvent[],
  rateLimits24h: number,
  authFailures24h: number,
): ObservabilityAlert[] {
  const alerts: ObservabilityAlert[] = [];
  if (rateLimits24h >= 10) {
    alerts.push({
      id: "rate-limit-spike",
      title: "Elevated rate-limit hits",
      detail: `${rateLimits24h} rate-limit events in the last 24 hours. Review abuse signals.`,
      severity: rateLimits24h >= 50 ? "alert" : "warn",
      count: rateLimits24h,
    });
  }
  if (authFailures24h >= 5) {
    alerts.push({
      id: "auth-failure-spike",
      title: "Auth failure spike",
      detail: `${authFailures24h} failed sign-in attempts in 24h. Possible credential stuffing.`,
      severity: authFailures24h >= 20 ? "alert" : "warn",
      count: authFailures24h,
    });
  }

  const since1h = hoursAgo(1);
  const recentViews = events.filter(
    (e) => e.event_type === "page_view" && e.created_at >= since1h,
  ).length;
  if (recentViews >= 200) {
    alerts.push({
      id: "traffic-spike",
      title: "Traffic spike (last hour)",
      detail: `${recentViews} page views in the last hour.`,
      severity: "warn",
      count: recentViews,
    });
  }

  const botViews = events.filter(
    (e) =>
      e.event_type === "page_view" &&
      e.created_at >= daysAgo(1) &&
      (e.user_agent_family === "bot"),
  ).length;
  if (botViews >= 100) {
    alerts.push({
      id: "bot-traffic",
      title: "Possible bot traffic",
      detail: `${botViews} suspicious page views in 24h (bots or missing referrer).`,
      severity: "info",
      count: botViews,
    });
  }

  return alerts;
}

async function buildRetrospective(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
): Promise<RetrospectiveReport> {
  let trackingStartedAt: string | null = null;
  let pageViewsSinceTracking = 0;
  let uniqueSessionsSinceTracking = 0;

  try {
    const { data: first } = await admin
      .from("analytics_events")
      .select("created_at")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    trackingStartedAt = first?.created_at ?? null;
  } catch {
    /* table may not exist yet */
  }

  try {
    const { count } = await admin
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "page_view");
    pageViewsSinceTracking = count ?? 0;
  } catch {
    /* optional */
  }

  try {
    const { data: sessions } = await admin
      .from("analytics_events")
      .select("session_id")
      .eq("event_type", "page_view")
      .not("session_id", "is", null);
    uniqueSessionsSinceTracking = new Set((sessions || []).map((s) => s.session_id)).size;
  } catch {
    /* optional */
  }

  const trackingDays = trackingStartedAt
    ? Math.max(1, Math.ceil((Date.now() - new Date(trackingStartedAt).getTime()) / 86_400_000))
    : 0;

  let totalRegisteredUsers = 0;
  let usersByMonth: DailyCount[] = [];
  let cloudProjects = 0;
  let shareLinks = 0;
  let announcements = 0;

  try {
    const { count: profileCount } = await admin
      .from("profiles")
      .select("*", { count: "exact", head: true });
    totalRegisteredUsers = profileCount ?? 0;
  } catch {
    /* table may not exist */
  }

  try {
    const { data: users } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (users?.users?.length) {
      totalRegisteredUsers = Math.max(totalRegisteredUsers, users.users.length);
      const monthMap = new Map<string, number>();
      for (const u of users.users) {
        const month = (u.created_at || "").slice(0, 7);
        if (month) monthMap.set(month, (monthMap.get(month) || 0) + 1);
      }
      usersByMonth = [...monthMap.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date: `${date}-01`, count }));
    }
  } catch {
    /* auth admin may be unavailable */
  }

  try {
    const { count } = await admin.from("manuscript_projects").select("*", { count: "exact", head: true });
    cloudProjects = count ?? 0;
  } catch {
    /* optional table */
  }

  try {
    const { count } = await admin.from("shared_projects").select("*", { count: "exact", head: true });
    shareLinks = count ?? 0;
  } catch {
    /* optional table */
  }

  try {
    const { count } = await admin.from("announcements").select("*", { count: "exact", head: true });
    announcements = count ?? 0;
  } catch {
    /* optional table */
  }

  const pageViews: RawEvent[] = [];
  const note = trackingStartedAt
    ? "Page views and sessions are tracked from when observability was deployed. User and cloud-sync counts reflect full database history."
    : "No analytics events yet — metrics will populate as traffic is recorded.";

  return {
    trackingStartedAt,
    trackingDays,
    totalRegisteredUsers,
    usersByMonth,
    cloudProjects,
    shareLinks,
    announcements,
    pageViewsSinceTracking,
    uniqueSessionsSinceTracking: uniqueSessionsSinceTracking,
    note,
  };
}

export async function buildObservabilityPayload(rangeDays = 30): Promise<ObservabilityPayload> {
  const admin = createAdminClient();
  const since = daysAgo(rangeDays);

  if (!admin) {
    return {
      generatedAt: new Date().toISOString(),
      range: { days: rangeDays },
      overview: {
        pageViewsToday: 0,
        uniqueSessionsToday: 0,
        pageViews7d: 0,
        uniqueSessions7d: 0,
        signups7d: 0,
        logins7d: 0,
        rateLimits24h: 0,
        authFailures24h: 0,
        apiCalls24h: 0,
      },
      dailyPageViews: [],
      dailySignups: [],
      topPages: [],
      topReferrers: [],
      topCountries: [],
      geoInsight: {
        primaryGeo: { code: PRIMARY_GEO_CODE, name: countryLabel(PRIMARY_GEO_CODE), count: 0, sharePct: 0 },
        saHighlight: false,
      },
      llmOverview: { calls24h: 0, calls7d: 0, tokens7d: 0, errors7d: 0 },
      featureUsage: [],
      abuseSignals: { rateLimitByTier: [], topBlockedIps: [], authFailuresByHour: [] },
      alerts: [
        {
          id: "not-configured",
          title: "Analytics not configured",
          detail: "Set SUPABASE_SERVICE_ROLE_KEY and run docs/ANALYTICS_SCHEMA.sql.",
          severity: "alert",
        },
      ],
      activityFeed: [],
      retrospective: {
        trackingStartedAt: null,
        trackingDays: 0,
        totalRegisteredUsers: 0,
        usersByMonth: [],
        cloudProjects: 0,
        shareLinks: 0,
        announcements: 0,
        pageViewsSinceTracking: 0,
        uniqueSessionsSinceTracking: 0,
        note: "Configure Supabase service role and analytics schema to enable tracking.",
      },
      configured: { analytics: false, rateLimitBackend: rateLimitBackend() },
    };
  }

  const { data, error } = await admin
    .from("analytics_events")
    .select(
      "id, created_at, event_type, category, path, method, country, severity, referrer, session_id, ip_hash, metadata, user_agent_family",
    )
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) throw error;
  const events = (data || []) as RawEvent[];

  const today = isoDay(new Date());
  const since7d = daysAgo(7);
  const since24h = daysAgo(1);

  const pageViews = events.filter((e) => e.event_type === "page_view");
  const pageViewsToday = pageViews.filter((e) => e.created_at.startsWith(today));
  const pageViews7d = pageViews.filter((e) => e.created_at >= since7d);

  const signups7d = events.filter((e) => e.event_type === "signup" && e.created_at >= since7d).length;
  const logins7d = events.filter((e) => e.event_type === "login" && e.created_at >= since7d).length;
  const rateLimits24h = events.filter((e) => e.event_type === "rate_limit" && e.created_at >= since24h).length;
  const authFailures24h = events.filter((e) => e.event_type === "auth_failed" && e.created_at >= since24h).length;
  const apiCalls24h = events.filter((e) => e.event_type === "api_call" && e.created_at >= since24h).length;

  const llmEvents = events.filter((e) => e.event_type === "llm_call");
  const llm24h = llmEvents.filter((e) => e.created_at >= since24h);
  const llm7d = llmEvents.filter((e) => e.created_at >= since7d);
  const tokens7d = llm7d.reduce((sum, e) => sum + Number(e.metadata?.totalTokens || 0), 0);
  const errors7d = llm7d.filter((e) => e.metadata?.error).length;

  const rateLimitEvents = events.filter((e) => e.event_type === "rate_limit");
  const authFailEvents = events.filter((e) => e.event_type === "auth_failed" && e.created_at >= since24h);

  const activityFeed: ActivityFeedItem[] = events.slice(0, 60).map((e) => ({
    id: e.id,
    createdAt: e.created_at,
    eventType: e.event_type,
    category: e.category as ActivityFeedItem["category"],
    path: e.path,
    country: e.country ? countryLabel(e.country) : null,
    severity: e.severity as ActivityFeedItem["severity"],
    summary: summarizeEvent(e),
  }));

  const countryCounts = topCounts(pageViews, (e) => e.country || "XX");
  const totalPv = pageViews.length || 1;
  const saEntry = countryCounts.find((c) => isPrimaryGeo(c.label));
  const saCount = saEntry?.count ?? 0;

  const retrospective = await buildRetrospective(admin);

  return {
    generatedAt: new Date().toISOString(),
    range: { days: rangeDays },
    overview: {
      pageViewsToday: pageViewsToday.length,
      uniqueSessionsToday: uniqueSessions(pageViewsToday),
      pageViews7d: pageViews7d.length,
      uniqueSessions7d: uniqueSessions(pageViews7d),
      signups7d,
      logins7d,
      rateLimits24h,
      authFailures24h,
      apiCalls24h,
    },
    dailyPageViews: countByDay(pageViews),
    dailySignups: countByDay(events, "signup"),
    topPages: topCounts(pageViews, (e) => e.path || "/"),
    topReferrers: topCounts(pageViews, (e) => e.referrer),
    topCountries: countryCounts.map((c) => ({
      label: countryLabel(c.label),
      count: c.count,
    })),
    geoInsight: {
      primaryGeo: {
        code: PRIMARY_GEO_CODE,
        name: countryLabel(PRIMARY_GEO_CODE),
        count: saCount,
        sharePct: Math.round((saCount / totalPv) * 1000) / 10,
      },
      saHighlight: saCount > 0,
    },
    llmOverview: {
      calls24h: llm24h.length,
      calls7d: llm7d.length,
      tokens7d,
      errors7d,
    },
    featureUsage: topCounts(
      events.filter((e) => e.event_type === "feature_use"),
      (e) => String(e.metadata?.feature || e.path || "unknown"),
    ),
    abuseSignals: {
      rateLimitByTier: topCounts(rateLimitEvents, (e) => String(e.metadata?.tier || "default")),
      topBlockedIps: topCounts(rateLimitEvents, (e) => e.ip_hash),
      authFailuresByHour: countByDay(authFailEvents),
    },
    alerts: buildAlerts(events, rateLimits24h, authFailures24h),
    activityFeed,
    retrospective,
    configured: { analytics: true, rateLimitBackend: rateLimitBackend() },
  };
}
