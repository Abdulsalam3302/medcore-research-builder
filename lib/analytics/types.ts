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
  | "project_sync";

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

export type TopItem = { label: string; count: number };

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
