"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type {
  AuditTrailPayload,
  GeoInsightPayload,
  LLMInsightPayload,
  ObservabilityPayload,
  PageInsightPayload,
  TopItem,
  UsersInsightPayload,
} from "@/lib/analytics/types";

type DrillKind =
  | "pageViewsToday"
  | "pageViews7d"
  | "signups7d"
  | "logins7d"
  | "rateLimits24h"
  | "authFailures24h"
  | "apiCalls24h"
  | "llm24h"
  | "llm7d"
  | "registeredUsers"
  | "pages"
  | "geo"
  | "llm"
  | "audit"
  | "features"
  | null;

function StatCard({
  label,
  value,
  hint,
  tone = "default",
  onClick,
  active,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "warn" | "alert" | "good";
  onClick?: () => void;
  active?: boolean;
}) {
  const toneClass =
    tone === "warn"
      ? "border-amber-200 bg-amber-50"
      : tone === "alert"
        ? "border-rose-200 bg-rose-50"
        : tone === "good"
          ? "border-emerald-200 bg-emerald-50"
          : "border-med-line bg-white";
  const interactive = onClick
    ? "cursor-pointer hover:border-med-brand/40 hover:shadow-sm transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-med-brand"
    : "";
  const activeClass = active ? "ring-2 ring-med-brand/30 border-med-brand/50" : "";
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      className={`card-elevated p-4 border text-left w-full ${toneClass} ${interactive} ${activeClass}`}
      onClick={onClick}
    >
      <p className="text-[11px] uppercase tracking-wide text-med-sub font-medium">{label}</p>
      <p className="text-2xl font-semibold text-med-ink mt-1 tabular-nums">{value}</p>
      {hint && <p className="text-[12px] text-med-sub mt-1">{hint}</p>}
      {onClick && <p className="text-[10px] text-med-brand mt-2">Click for details →</p>}
    </Tag>
  );
}

function BarChart({ data, label }: { data: { date: string; count: number }[]; label: string }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  if (!data.length) {
    return (
      <div className="card-elevated p-4">
        <h3 className="text-sm font-semibold text-med-ink mb-2">{label}</h3>
        <p className="text-sm text-med-sub">No data yet.</p>
      </div>
    );
  }
  return (
    <div className="card-elevated p-4">
      <h3 className="text-sm font-semibold text-med-ink mb-3">{label}</h3>
      <div className="flex items-end gap-1 h-28">
        {data.slice(-21).map((d) => (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <div
              className="w-full rounded-t bg-med-brand/80 min-h-[2px]"
              style={{ height: `${Math.max(4, (d.count / max) * 100)}%` }}
              title={`${d.date}: ${d.count}`}
            />
            <span className="text-[9px] text-med-sub truncate w-full text-center">
              {d.date.slice(5)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopList({
  title,
  items,
  onItemClick,
  highlightPrimary,
}: {
  title: string;
  items: TopItem[];
  onItemClick?: (label: string) => void;
  highlightPrimary?: (label: string) => boolean;
}) {
  return (
    <div className="card-elevated p-4">
      <h3 className="text-sm font-semibold text-med-ink mb-3">{title}</h3>
      {!items.length ? (
        <p className="text-sm text-med-sub">No data yet.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const primary = highlightPrimary?.(item.label);
            const inner = (
              <>
                <span className={`truncate ${primary ? "font-medium text-emerald-800" : "text-med-inkSoft"}`}>
                  {primary ? "🇸🇦 " : ""}
                  {item.label}
                </span>
                <span className="font-medium tabular-nums text-med-ink shrink-0">
                  {item.count}
                  {item.tokens != null ? ` · ${item.tokens.toLocaleString()} tok` : ""}
                </span>
              </>
            );
            return (
              <li key={item.label}>
                {onItemClick ? (
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 text-sm text-left hover:text-med-brand transition-colors"
                    onClick={() => onItemClick(item.label)}
                  >
                    {inner}
                  </button>
                ) : (
                  <div className="flex items-center justify-between gap-3 text-sm">{inner}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function severityBadge(severity: string) {
  if (severity === "alert") return "bg-rose-100 text-rose-800";
  if (severity === "warn") return "bg-amber-100 text-amber-800";
  return "bg-slate-100 text-med-sub";
}

function DetailPanel({
  title,
  loading,
  error,
  onClose,
  children,
}: {
  title: string;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative card-elevated w-full sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col rounded-t-xl sm:rounded-xl"
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-med-line shrink-0">
          <h2 className="text-base font-semibold text-med-ink">{title}</h2>
          <button type="button" className="btn-secondary text-sm py-1 px-3" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="overflow-y-auto p-5 flex-1">
          {loading && <p className="text-sm text-med-sub animate-pulse">Loading details…</p>}
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</div>
          )}
          {!loading && !error && children}
        </div>
      </div>
    </div>
  );
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function ObservabilityDashboard() {
  const [data, setData] = useState<ObservabilityPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [drill, setDrill] = useState<DrillKind>(null);
  const [drillLoading, setDrillLoading] = useState(false);
  const [drillError, setDrillError] = useState<string | null>(null);
  const [usersData, setUsersData] = useState<UsersInsightPayload | null>(null);
  const [pagesData, setPagesData] = useState<PageInsightPayload | null>(null);
  const [geoData, setGeoData] = useState<GeoInsightPayload | null>(null);
  const [llmData, setLlmData] = useState<LLMInsightPayload | null>(null);
  const [auditData, setAuditData] = useState<AuditTrailPayload | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/observability?days=${days}`, { cache: "no-store" });
      if (res.status === 403) {
        window.location.href = "/auth?next=/admin/observability";
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as ObservabilityPayload;
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [days]);

  const loadDrill = useCallback(
    async (kind: DrillKind, extra?: { path?: string; userId?: string }) => {
      if (!kind) return;
      setDrillLoading(true);
      setDrillError(null);
      setUsersData(null);
      setPagesData(null);
      setGeoData(null);
      setLlmData(null);
      setAuditData(null);

      try {
        let url = "";
        if (kind === "registeredUsers" || kind === "signups7d" || kind === "logins7d") {
          url = `/api/admin/observability/users?days=${days}`;
        } else if (kind === "pages" || kind === "pageViewsToday" || kind === "pageViews7d") {
          const path = extra?.path || selectedPath;
          url = `/api/admin/observability/pages?days=${days}${path ? `&path=${encodeURIComponent(path)}` : ""}`;
        } else if (kind === "geo") {
          url = `/api/admin/observability/geo?days=${days}`;
        } else if (kind === "llm" || kind === "llm24h" || kind === "llm7d") {
          url = `/api/admin/observability/llm?days=${days}`;
        } else if (kind === "audit" || kind === "rateLimits24h" || kind === "authFailures24h" || kind === "apiCalls24h") {
          const userId = extra?.userId || selectedUserId;
          url = `/api/admin/observability/audit?days=${days}${userId ? `&userId=${userId}` : ""}`;
        } else if (kind === "features") {
          url = `/api/admin/observability/audit?days=${days}`;
        }

        if (!url) return;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (url.includes("/users")) setUsersData(json as UsersInsightPayload);
        else if (url.includes("/pages")) setPagesData(json as PageInsightPayload);
        else if (url.includes("/geo")) setGeoData(json as GeoInsightPayload);
        else if (url.includes("/llm")) setLlmData(json as LLMInsightPayload);
        else if (url.includes("/audit")) setAuditData(json as AuditTrailPayload);
      } catch (e) {
        setDrillError(e instanceof Error ? e.message : String(e));
      } finally {
        setDrillLoading(false);
      }
    },
    [days, selectedPath, selectedUserId],
  );

  const openDrill = useCallback(
    (kind: DrillKind, extra?: { path?: string; userId?: string }) => {
      setDrill(kind);
      void loadDrill(kind, extra);
    },
    [loadDrill],
  );

  const closeDrill = useCallback(() => {
    setDrill(null);
    setDrillError(null);
    setSelectedPath(null);
    setSelectedUserId(null);
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 60_000);
    return () => clearInterval(id);
  }, [load]);

  const drillTitle = (): string => {
    switch (drill) {
      case "pageViewsToday":
      case "pageViews7d":
      case "pages":
        return selectedPath ? `Page: ${selectedPath}` : "Page views breakdown";
      case "registeredUsers":
      case "signups7d":
      case "logins7d":
        return "Registered users";
      case "geo":
        return "Geographic traffic";
      case "llm":
      case "llm24h":
      case "llm7d":
        return "LLM usage & tokens";
      case "audit":
      case "rateLimits24h":
      case "authFailures24h":
      case "apiCalls24h":
        return selectedUserId ? "User audit trail" : "Activity audit log";
      case "features":
        return "Feature usage audit";
      default:
        return "Details";
    }
  };

  if (loading && !data) {
    return (
      <div className="card-elevated p-8 text-center text-med-sub animate-pulse">
        Loading observability data…
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-elevated p-6 border border-rose-200 bg-rose-50">
        <p className="text-rose-800 font-medium">Failed to load dashboard</p>
        <p className="text-sm text-rose-700 mt-1">{error}</p>
        <button type="button" className="btn-primary mt-4" onClick={() => void load()}>
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { overview, alerts, retrospective, geoInsight, llmOverview } = data;
  const sa = geoInsight.primaryGeo;

  return (
    <div className="space-y-8">
      {alerts.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-med-ink">Active alerts</h2>
          <div className="grid gap-2">
            {alerts.map((a) => (
              <div
                key={a.id}
                className={`rounded-lg border px-4 py-3 text-sm ${
                  a.severity === "alert"
                    ? "border-rose-200 bg-rose-50 text-rose-900"
                    : a.severity === "warn"
                      ? "border-amber-200 bg-amber-50 text-amber-900"
                      : "border-med-line bg-white text-med-inkSoft"
                }`}
              >
                <span className="font-medium">{a.title}</span>
                <span className="mx-2 text-med-line" aria-hidden>·</span>
                {a.detail}
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-sm font-semibold text-med-ink">Overview</h2>
          <div className="flex items-center gap-2">
            <label className="text-[12px] text-med-sub" htmlFor="range-days">
              Range
            </label>
            <select
              id="range-days"
              className="input text-sm py-1 px-2 w-auto"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            >
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
            </select>
            <button type="button" className="btn-primary text-sm py-1.5 px-3" onClick={() => void load()}>
              Refresh
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Page views today"
            value={overview.pageViewsToday}
            hint={`${overview.uniqueSessionsToday} sessions`}
            onClick={() => openDrill("pageViewsToday")}
            active={drill === "pageViewsToday"}
          />
          <StatCard
            label="Page views (7d)"
            value={overview.pageViews7d}
            hint={`${overview.uniqueSessions7d} sessions`}
            onClick={() => openDrill("pageViews7d")}
            active={drill === "pageViews7d"}
          />
          <StatCard
            label="Signups (7d)"
            value={overview.signups7d}
            tone={overview.signups7d > 0 ? "good" : "default"}
            onClick={() => openDrill("signups7d")}
            active={drill === "signups7d"}
          />
          <StatCard
            label="Logins (7d)"
            value={overview.logins7d}
            onClick={() => openDrill("logins7d")}
            active={drill === "logins7d"}
          />
          <StatCard
            label="Rate limits (24h)"
            value={overview.rateLimits24h}
            tone={overview.rateLimits24h >= 10 ? "warn" : "default"}
            onClick={() => openDrill("rateLimits24h")}
            active={drill === "rateLimits24h"}
          />
          <StatCard
            label="Auth failures (24h)"
            value={overview.authFailures24h}
            tone={overview.authFailures24h >= 5 ? "warn" : "default"}
            onClick={() => openDrill("authFailures24h")}
            active={drill === "authFailures24h"}
          />
          <StatCard
            label="API calls (24h)"
            value={overview.apiCalls24h}
            onClick={() => openDrill("apiCalls24h")}
            active={drill === "apiCalls24h"}
          />
          <StatCard
            label="LLM calls (24h)"
            value={llmOverview.calls24h}
            hint={`${formatTokens(llmOverview.tokens7d)} tokens (7d)`}
            tone={llmOverview.errors7d > 0 ? "warn" : "default"}
            onClick={() => openDrill("llm24h")}
            active={drill === "llm24h" || drill === "llm"}
          />
        </div>
      </section>

      {/* Saudi Arabia geo highlight */}
      <section className="card-elevated p-4 border border-emerald-200/60 bg-gradient-to-r from-emerald-50/80 to-white">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-med-ink">Geographic focus — Saudi Arabia (SA)</h2>
            <p className="text-[12px] text-med-sub mt-1 max-w-xl">
              Country codes are ISO 3166-1 alpha-2. <strong>IN = India</strong>, <strong>SA = Saudi Arabia</strong>,{" "}
              <strong>US = United States</strong>, etc. Click any country row for the full breakdown.
            </p>
          </div>
          <button type="button" className="btn-secondary text-sm" onClick={() => openDrill("geo")}>
            View all countries
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <StatCard
            label="🇸🇦 Saudi Arabia views"
            value={sa.count}
            hint={`${sa.sharePct}% of tracked traffic`}
            tone={sa.count > 0 ? "good" : "default"}
            onClick={() => openDrill("geo")}
          />
          <StatCard label="LLM calls (7d)" value={llmOverview.calls7d} hint={`${llmOverview.errors7d} errors`} onClick={() => openDrill("llm7d")} />
          <StatCard
            label="Registered users"
            value={retrospective.totalRegisteredUsers}
            onClick={() => openDrill("registeredUsers")}
          />
          <StatCard label="Rate limit backend" value={data.configured.rateLimitBackend} hint={data.configured.analytics ? "Analytics active" : "Analytics not configured"} />
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <BarChart data={data.dailyPageViews} label="Daily page views" />
        <BarChart data={data.dailySignups} label="Daily signups" />
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        <TopList
          title="Top pages — click to drill down"
          items={data.topPages}
          onItemClick={(label) => {
            setSelectedPath(label);
            openDrill("pages", { path: label });
          }}
        />
        <TopList title="Top referrers" items={data.topReferrers} />
        <TopList
          title="Top countries (full names)"
          items={data.topCountries}
          onItemClick={() => openDrill("geo")}
          highlightPrimary={(label) => label.includes("Saudi Arabia")}
        />
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <TopList title="Feature usage — click for audit" items={data.featureUsage} onItemClick={() => openDrill("features")} />
        <div className="card-elevated p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="text-sm font-semibold text-med-ink">Abuse signals</h3>
            <button type="button" className="text-[12px] text-med-brand hover:underline" onClick={() => openDrill("audit")}>
              Full audit log →
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <TopList title="Rate limits by tier" items={data.abuseSignals.rateLimitByTier} />
            <TopList title="Top blocked IP hashes" items={data.abuseSignals.topBlockedIps} />
          </div>
        </div>
      </section>

      <section className="card-elevated p-5 border border-med-brand/20 bg-gradient-to-br from-white to-med-blue-50/30">
        <h2 className="text-base font-semibold text-med-ink mb-1">Retrospective since inception</h2>
        <p className="text-sm text-med-sub mb-4">{retrospective.note}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <StatCard
            label="Registered users"
            value={retrospective.totalRegisteredUsers}
            onClick={() => openDrill("registeredUsers")}
          />
          <StatCard label="Cloud projects" value={retrospective.cloudProjects} />
          <StatCard label="Share links" value={retrospective.shareLinks} />
          <StatCard label="Page views (tracked)" value={retrospective.pageViewsSinceTracking} onClick={() => openDrill("pages")} />
        </div>
        {retrospective.trackingStartedAt && (
          <p className="text-[12px] text-med-sub mb-3">
            Tracking since {new Date(retrospective.trackingStartedAt).toLocaleString()} (
            {retrospective.trackingDays} days) · {retrospective.uniqueSessionsSinceTracking} unique sessions
          </p>
        )}
        {retrospective.usersByMonth.length > 0 && (
          <BarChart data={retrospective.usersByMonth} label="User registrations by month" />
        )}
      </section>

      <section>
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="text-sm font-semibold text-med-ink">Recent activity</h2>
          <button type="button" className="text-[12px] text-med-brand hover:underline" onClick={() => openDrill("audit")}>
            View audit log
          </button>
        </div>
        <div className="card-elevated divide-y divide-med-line max-h-[420px] overflow-y-auto">
          {!data.activityFeed.length ? (
            <p className="p-4 text-sm text-med-sub">No events recorded yet.</p>
          ) : (
            data.activityFeed.map((item) => (
              <div key={item.id} className="px-4 py-3 flex items-start justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="text-med-ink truncate">{item.summary}</p>
                  <p className="text-[11px] text-med-sub mt-0.5">
                    {new Date(item.createdAt).toLocaleString()}
                    {item.country ? ` · ${item.country}` : ""}
                    {item.path ? ` · ${item.path}` : ""}
                  </p>
                </div>
                <span className={`shrink-0 text-[10px] uppercase px-2 py-0.5 rounded-full font-medium ${severityBadge(item.severity)}`}>
                  {item.category}
                </span>
              </div>
            ))
          )}
        </div>
        <p className="text-[11px] text-med-sub mt-2">
          Auto-refreshes every 60s · Generated {new Date(data.generatedAt).toLocaleTimeString()}
        </p>
      </section>

      {drill && (
        <DetailPanel title={drillTitle()} loading={drillLoading} error={drillError} onClose={closeDrill}>
          {usersData && (
            <div className="space-y-4">
              <p className="text-sm text-med-sub">{usersData.note}</p>
              <p className="text-sm">
                <span className="font-medium text-med-ink">{usersData.total}</span> registered ·{" "}
                <span className="font-medium text-med-ink">{usersData.activeInRange}</span> active in range
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase text-med-sub border-b border-med-line">
                      <th className="py-2 pr-3">Ref</th>
                      <th className="py-2 pr-3">Email (masked)</th>
                      <th className="py-2 pr-3">Role</th>
                      <th className="py-2 pr-3">Events</th>
                      <th className="py-2 pr-3">Last active</th>
                      <th className="py-2">Audit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersData.users.map((u) => (
                      <tr key={u.id} className="border-b border-med-line/60">
                        <td className="py-2 pr-3 font-mono text-[12px]">{u.ref}</td>
                        <td className="py-2 pr-3">{u.maskedEmail}</td>
                        <td className="py-2 pr-3">{u.role}</td>
                        <td className="py-2 pr-3 tabular-nums">{u.eventCount}</td>
                        <td className="py-2 pr-3 text-[12px] text-med-sub">
                          {u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleString() : "—"}
                        </td>
                        <td className="py-2">
                          <button
                            type="button"
                            className="text-med-brand text-[12px] hover:underline"
                            onClick={() => {
                              setSelectedUserId(u.id);
                              void loadDrill("audit", { userId: u.id });
                            }}
                          >
                            View trail
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {pagesData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Total views" value={pagesData.totalViews} />
                <StatCard label="Unique sessions" value={pagesData.uniqueSessions} />
              </div>
              {pagesData.path && (
                <p className="text-sm text-med-sub">
                  Filtered to path: <code className="text-med-ink">{pagesData.path}</code>
                </p>
              )}
              <TopList title="Top paths" items={pagesData.topPaths} onItemClick={(label) => { setSelectedPath(label); void loadDrill("pages", { path: label }); }} />
              <TopList title="Referrers" items={pagesData.topReferrers} />
              <TopList title="Countries" items={pagesData.topCountries} />
              <TopList title="User agents" items={pagesData.topUserAgents} />
              {pagesData.dailyViews.length > 0 && <BarChart data={pagesData.dailyViews} label="Daily views" />}
            </div>
          )}

          {geoData && (
            <div className="space-y-4">
              <p className="text-sm text-med-sub">{geoData.note}</p>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 text-sm">
                <span className="font-medium text-emerald-900">🇸🇦 {geoData.primaryGeo.name}</span>
                <span className="text-emerald-800"> — {geoData.primaryGeo.count} views ({geoData.primaryGeo.sharePct}%)</span>
              </div>
              <ul className="space-y-2">
                {geoData.countries.map((c) => (
                  <li
                    key={c.code}
                    className={`flex items-center justify-between gap-3 text-sm rounded-lg px-3 py-2 ${
                      c.isPrimary ? "bg-emerald-50 border border-emerald-200" : "bg-white border border-med-line/60"
                    }`}
                  >
                    <span>
                      {c.flag} {c.name}
                    </span>
                    <span className="tabular-nums font-medium">
                      {c.count} <span className="text-med-sub font-normal">({c.sharePct}%)</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {llmData && (
            <div className="space-y-4">
              <p className="text-sm text-med-sub">{llmData.note}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard label="Total calls" value={llmData.totalCalls} />
                <StatCard label="Prompt tokens" value={formatTokens(llmData.promptTokens)} />
                <StatCard label="Completion tokens" value={formatTokens(llmData.completionTokens)} />
                <StatCard label="Avg latency" value={`${llmData.avgLatencyMs}ms`} tone={llmData.errors > 0 ? "warn" : "default"} hint={`${llmData.errors} errors`} />
              </div>
              <TopList title="Top routes" items={llmData.topRoutes} />
              <TopList title="By provider" items={llmData.byProvider} />
              {llmData.dailyCalls.length > 0 && <BarChart data={llmData.dailyCalls} label="Daily LLM calls" />}
              <div>
                <h3 className="text-sm font-semibold text-med-ink mb-2">Recent calls</h3>
                <ul className="space-y-2 max-h-48 overflow-y-auto">
                  {llmData.recent.map((r) => (
                    <li key={r.id} className="text-[12px] border border-med-line/60 rounded-lg px-3 py-2">
                      <span className={r.ok ? "text-med-ink" : "text-rose-700"}>{r.route}</span>
                      <span className="text-med-sub"> · {r.provider}/{r.model} · {r.totalTokens} tok · {r.latencyMs}ms · user {r.userRef}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {auditData && (
            <div className="space-y-4">
              <p className="text-sm text-med-sub">{auditData.note}</p>
              {auditData.userRef && (
                <p className="text-sm">
                  User ref: <code className="font-mono">{auditData.userRef}</code> · {auditData.totalEvents} events
                </p>
              )}
              <div className="grid md:grid-cols-2 gap-4">
                <TopList title="By event type" items={auditData.byEventType} />
                {!auditData.userId && <TopList title="By user ref" items={auditData.byUser} />}
              </div>
              <div className="divide-y divide-med-line border border-med-line/60 rounded-lg max-h-64 overflow-y-auto">
                {auditData.entries.map((e) => (
                  <div key={e.id} className="px-3 py-2 text-[12px]">
                    <p className="text-med-ink">{e.summary}</p>
                    <p className="text-med-sub mt-0.5">
                      {new Date(e.at).toLocaleString()} · {e.userRef} · {e.ipHash}
                      {e.country ? ` · ${e.country}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DetailPanel>
      )}

      <footer className="text-center text-[12px] text-med-sub pb-4">
        <Link href="/" className="text-med-brand hover:underline">
          Back to workspace
        </Link>
      </footer>
    </div>
  );
}
