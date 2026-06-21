export type AnalyticsCategory = "visit" | "auth" | "usage" | "abuse" | "alert";

export type AnalyticsSeverity = "info" | "warn" | "alert";

export type AnalyticsEventType =
  | "page_view"
  | "signup"
  | "login"
  | "logout"
  | "auth_failed"
  | "api_call"
  | "rate_limit"
  | "feature_use"
  | "share_created"
  | "project_sync"
  | "llm_call";

export type TrackEventInput = {
  eventType: AnalyticsEventType;
  category: AnalyticsCategory;
  path?: string | null;
  method?: string | null;
  userId?: string | null;
  sessionId?: string | null;
  ipHash?: string | null;
  country?: string | null;
  region?: string | null;
  referrer?: string | null;
  userAgentFamily?: string | null;
  metadata?: Record<string, unknown>;
  severity?: AnalyticsSeverity;
};

export type ObservabilityAlert = {
  id: string;
  title: string;
  detail: string;
  severity: AnalyticsSeverity;
  count?: number;
};

export type DailyCount = { date: string; count: number };

export type TopItem = { label: string; count: number; tokens?: number };

export type GeoCountryItem = {
  code: string;
  name: string;
  flag: string;
  count: number;
  sharePct: number;
  isPrimary: boolean;
};

export type UsersInsightPayload = {
  total: number;
  activeInRange: number;
  users: Array<{
    id: string;
    ref: string;
    maskedEmail: string;
    role: string;
    registeredAt: string | null;
    eventCount: number;
    lastActiveAt: string | null;
    eventTypes: string[];
  }>;
  note: string;
};

export type PageInsightPayload = {
  path: string | null;
  totalViews: number;
  uniqueSessions: number;
  topPaths: TopItem[];
  topReferrers: TopItem[];
  topCountries: TopItem[];
  topUserAgents: TopItem[];
  dailyViews: DailyCount[];
};

export type GeoInsightPayload = {
  totalViews: number;
  primaryGeo: { code: string; name: string; count: number; sharePct: number };
  countries: GeoCountryItem[];
  note: string;
};

export type LLMInsightPayload = {
  totalCalls: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  errors: number;
  avgLatencyMs: number;
  topRoutes: TopItem[];
  byProvider: TopItem[];
  dailyCalls: DailyCount[];
  recent: Array<{
    id: string;
    at: string;
    route: string;
    provider: string;
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    latencyMs: number;
    ok: boolean;
    userRef: string;
  }>;
  note: string;
};

export type AuditTrailPayload = {
  userId: string | null;
  userRef: string | null;
  totalEvents: number;
  byEventType: TopItem[];
  byUser: TopItem[];
  entries: Array<{
    id: string;
    at: string;
    eventType: string;
    category: string;
    summary: string;
    path: string | null;
    country: string | null;
    userRef: string;
    ipHash: string;
    severity: string;
  }>;
  note: string;
};

export type ActivityFeedItem = {
  id: string;
  createdAt: string;
  eventType: string;
  category: AnalyticsCategory;
  path: string | null;
  country: string | null;
  severity: AnalyticsSeverity;
  summary: string;
};

export type RetrospectiveReport = {
  trackingStartedAt: string | null;
  trackingDays: number;
  totalRegisteredUsers: number;
  usersByMonth: DailyCount[];
  cloudProjects: number;
  shareLinks: number;
  announcements: number;
  pageViewsSinceTracking: number;
  uniqueSessionsSinceTracking: number;
  note: string;
};

export type ObservabilityPayload = {
  generatedAt: string;
  range: { days: number };
  overview: {
    pageViewsToday: number;
    uniqueSessionsToday: number;
    pageViews7d: number;
    uniqueSessions7d: number;
    signups7d: number;
    logins7d: number;
    rateLimits24h: number;
    authFailures24h: number;
    apiCalls24h: number;
  };
  dailyPageViews: DailyCount[];
  dailySignups: DailyCount[];
  topPages: TopItem[];
  topReferrers: TopItem[];
  topCountries: TopItem[];
  geoInsight: {
    primaryGeo: { code: string; name: string; count: number; sharePct: number };
    saHighlight: boolean;
  };
  llmOverview: {
    calls24h: number;
    calls7d: number;
    tokens7d: number;
    errors7d: number;
  };
  featureUsage: TopItem[];
  abuseSignals: {
    rateLimitByTier: TopItem[];
    topBlockedIps: TopItem[];
    authFailuresByHour: DailyCount[];
  };
  alerts: ObservabilityAlert[];
  activityFeed: ActivityFeedItem[];
  retrospective: RetrospectiveReport;
  configured: {
    analytics: boolean;
    rateLimitBackend: "redis" | "memory";
  };
};
