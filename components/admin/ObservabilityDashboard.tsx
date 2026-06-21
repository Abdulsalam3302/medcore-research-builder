"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { ObservabilityPayload } from "@/lib/analytics/types";

function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "warn" | "alert" | "good";
}) {
  const toneClass =
    tone === "warn"
      ? "border-amber-200 bg-amber-50"
      : tone === "alert"
        ? "border-rose-200 bg-rose-50"
        : tone === "good"
          ? "border-emerald-200 bg-emerald-50"
          : "border-med-line bg-white";
  return (
    <div className={`card-elevated p-4 border ${toneClass}`}>
      <p className="text-[11px] uppercase tracking-wide text-med-sub font-medium">{label}</p>
      <p className="text-2xl font-semibold text-med-ink mt-1 tabular-nums">{value}</p>
      {hint && <p className="text-[12px] text-med-sub mt-1">{hint}</p>}
    </div>
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

function TopList({ title, items }: { title: string; items: { label: string; count: number }[] }) {
  return (
    <div className="card-elevated p-4">
      <h3 className="text-sm font-semibold text-med-ink mb-3">{title}</h3>
      {!items.length ? (
        <p className="text-sm text-med-sub">No data yet.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.label} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-med-inkSoft truncate">{item.label}</span>
              <span className="font-medium tabular-nums text-med-ink shrink-0">{item.count}</span>
            </li>
          ))}
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

export function ObservabilityDashboard() {
  const [data, setData] = useState<ObservabilityPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

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

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 60_000);
    return () => clearInterval(id);
  }, [load]);

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

  const { overview, alerts, retrospective } = data;

  return (
    <div className="space-y-8">
      {/* Alerts banner */}
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

      {/* Overview KPIs */}
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
          <StatCard label="Page views today" value={overview.pageViewsToday} hint={`${overview.uniqueSessionsToday} sessions`} />
          <StatCard label="Page views (7d)" value={overview.pageViews7d} hint={`${overview.uniqueSessions7d} sessions`} />
          <StatCard label="Signups (7d)" value={overview.signups7d} tone={overview.signups7d > 0 ? "good" : "default"} />
          <StatCard label="Logins (7d)" value={overview.logins7d} />
          <StatCard
            label="Rate limits (24h)"
            value={overview.rateLimits24h}
            tone={overview.rateLimits24h >= 10 ? "warn" : "default"}
          />
          <StatCard
            label="Auth failures (24h)"
            value={overview.authFailures24h}
            tone={overview.authFailures24h >= 5 ? "warn" : "default"}
          />
          <StatCard label="API calls (24h)" value={overview.apiCalls24h} />
          <StatCard
            label="Rate limit backend"
            value={data.configured.rateLimitBackend}
            hint={data.configured.analytics ? "Analytics active" : "Analytics not configured"}
          />
        </div>
      </section>

      {/* Charts */}
      <section className="grid md:grid-cols-2 gap-4">
        <BarChart data={data.dailyPageViews} label="Daily page views" />
        <BarChart data={data.dailySignups} label="Daily signups" />
      </section>

      {/* Marketing + usage */}
      <section className="grid md:grid-cols-3 gap-4">
        <TopList title="Top pages" items={data.topPages} />
        <TopList title="Top referrers" items={data.topReferrers} />
        <TopList title="Top countries" items={data.topCountries} />
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <TopList title="Feature usage" items={data.featureUsage} />
        <div className="card-elevated p-4">
          <h3 className="text-sm font-semibold text-med-ink mb-3">Abuse signals</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <TopList title="Rate limits by tier" items={data.abuseSignals.rateLimitByTier} />
            <TopList title="Top blocked IP hashes" items={data.abuseSignals.topBlockedIps} />
          </div>
        </div>
      </section>

      {/* Retrospective */}
      <section className="card-elevated p-5 border border-med-brand/20 bg-gradient-to-br from-white to-med-blue-50/30">
        <h2 className="text-base font-semibold text-med-ink mb-1">Retrospective since inception</h2>
        <p className="text-sm text-med-sub mb-4">{retrospective.note}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <StatCard label="Registered users" value={retrospective.totalRegisteredUsers} />
          <StatCard label="Cloud projects" value={retrospective.cloudProjects} />
          <StatCard label="Share links" value={retrospective.shareLinks} />
          <StatCard label="Page views (tracked)" value={retrospective.pageViewsSinceTracking} />
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

      {/* Live feed */}
      <section>
        <h2 className="text-sm font-semibold text-med-ink mb-3">Recent activity</h2>
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

      <footer className="text-center text-[12px] text-med-sub pb-4">
        <Link href="/" className="text-med-brand hover:underline">
          Back to workspace
        </Link>
      </footer>
    </div>
  );
}
