"use client";

import { useMemo, useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  ossByCategory,
  type OSSConfidence,
  type OSSProject,
} from "@/lib/knowledge/opensource";
import {
  mcpByCategory,
  type MCPConfidence,
  type MCPServer,
} from "@/lib/knowledge/mcp";
import {
  integrationsByStatus,
  platformIntegrations,
  type IntegrationStatus,
  type PlatformIntegration,
} from "@/lib/knowledge/integrations";

type Tab = "platform" | "oss" | "mcp";

function confidenceBadgeKind(confidence: OSSConfidence | MCPConfidence) {
  return confidence === "established" ? "good" : "warn";
}

function matchesQuery(haystacks: Array<string | undefined>, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return haystacks.some((h) => (h ?? "").toLowerCase().includes(q));
}

/** Big friendly emoji avatar shown on every card. */
function IconBubble({ emoji }: { emoji?: string }) {
  return (
    <div
      aria-hidden="true"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-med-bg text-2xl leading-none"
    >
      {emoji ?? "🔧"}
    </div>
  );
}

function VerifyLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm font-medium text-med-brand hover:underline break-all"
    >
      Verify source ↗
    </a>
  );
}

function TechNote() {
  return (
    <span className="text-[11px] font-medium uppercase tracking-wide text-med-sub">
      For technical users
    </span>
  );
}

/* ── Built into MedCore ──────────────────────────────────────────────────── */

function statusBadgeKind(status: IntegrationStatus) {
  return status === "built-in" ? "good" : "info";
}

function statusLabel(status: IntegrationStatus) {
  return status === "built-in" ? "Built in" : "Powered for you";
}

function IntegrationCard({ item }: { item: PlatformIntegration }) {
  return (
    <Card>
      <CardBody>
        <div className="flex items-start gap-3">
          <IconBubble emoji={item.icon} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="font-semibold text-med-ink">{item.capability}</div>
              <Badge kind={statusBadgeKind(item.status)}>{statusLabel(item.status)}</Badge>
            </div>
            <p className="mt-2 text-sm text-med-ink">{item.plainSummary}</p>
            {item.useCase && (
              <p className="mt-2 text-sm text-med-sub">{item.useCase}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {item.lane && (
                <span className="badge-brand">Open {item.laneLabel ?? item.lane}</span>
              )}
              {item.poweredBy && (
                <span className="text-[12px] text-med-sub">
                  Powered by {item.poweredBy}
                </span>
              )}
            </div>
            {item.replacesExternal && (
              <p className="mt-2 text-[12px] italic text-med-sub">
                Replaces having to set up: {item.replacesExternal}
              </p>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

/* ── Open-source tools ───────────────────────────────────────────────────── */

function OSSCard({ project }: { project: OSSProject }) {
  return (
    <Card>
      <CardBody>
        <div className="flex items-start gap-3">
          <IconBubble emoji={project.icon} />
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-med-ink">{project.name}</div>
            {project.plainSummary && (
              <p className="mt-1.5 text-sm text-med-ink">{project.plainSummary}</p>
            )}
            {project.useCase && (
              <p className="mt-2 text-sm text-med-sub">{project.useCase}</p>
            )}

            <details className="group mt-3 border-t border-med-line pt-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2">
                <TechNote />
                <span className="text-[11px] text-med-sub group-open:hidden">Show details</span>
                <span className="hidden text-[11px] text-med-sub group-open:inline">Hide details</span>
              </summary>

              <div className="mt-3 space-y-2">
                <div className="muted">{project.org}</div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {typeof project.stars === "number" && (
                    <Badge kind="neutral">★ {project.stars.toLocaleString()}</Badge>
                  )}
                  <Badge kind={confidenceBadgeKind(project.confidence)}>
                    {project.confidence}
                  </Badge>
                </div>
                <p className="text-sm text-med-ink">{project.whatItDoes}</p>
                <p className="text-sm text-med-sub">
                  <span className="font-medium text-med-ink">How it helps research: </span>
                  {project.howItHelpsResearch}
                </p>
                {(project.language || project.license) && (
                  <div className="muted flex flex-wrap gap-x-3 gap-y-1">
                    {project.language && <span>{project.language}</span>}
                    {project.license && <span>{project.license}</span>}
                  </div>
                )}
                {project.note && (
                  <p className="text-[12px] italic text-med-sub">{project.note}</p>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <VerifyLink href={project.verifyUrl} />
                  {project.verifiedAt && (
                    <span className="text-[11px] text-med-sub">
                      GitHub-verified {project.verifiedAt}
                    </span>
                  )}
                </div>
              </div>
            </details>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

/* ── MCP servers ─────────────────────────────────────────────────────────── */

function MCPCard({ server }: { server: MCPServer }) {
  return (
    <Card>
      <CardBody>
        <div className="flex items-start gap-3">
          <IconBubble emoji={server.icon} />
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-med-ink">{server.name}</div>
            {server.plainSummary && (
              <p className="mt-1.5 text-sm text-med-ink">{server.plainSummary}</p>
            )}
            {server.useCase && (
              <p className="mt-2 text-sm text-med-sub">{server.useCase}</p>
            )}

            <details className="group mt-3 border-t border-med-line pt-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2">
                <TechNote />
                <span className="text-[11px] text-med-sub group-open:hidden">Show details</span>
                <span className="hidden text-[11px] text-med-sub group-open:inline">Hide details</span>
              </summary>

              <div className="mt-3 space-y-2">
                {server.vendor && <div className="muted">{server.vendor}</div>}
                <div>
                  <Badge kind={confidenceBadgeKind(server.confidence)}>
                    {server.confidence}
                  </Badge>
                </div>
                <p className="text-sm text-med-ink">{server.capability}</p>
                <p className="text-sm text-med-sub">
                  <span className="font-medium text-med-ink">Use in research: </span>
                  {server.useInResearch}
                </p>
                {server.note && (
                  <p className="text-[12px] italic text-med-sub">{server.note}</p>
                )}
                <div>
                  <VerifyLink href={server.verifyUrl} />
                </div>
              </div>
            </details>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

/* ── Main component ──────────────────────────────────────────────────────── */

const STATUS_HEADINGS: Record<IntegrationStatus, string> = {
  "built-in": "Done for you, right here",
  "powered-by": "We do the work using trusted public sources",
};

export function ResearchToolkit() {
  const [tab, setTab] = useState<Tab>("platform");
  const [query, setQuery] = useState("");

  const platformGroups = useMemo(
    () => Array.from(integrationsByStatus().entries()),
    []
  );
  const ossGroups = useMemo(() => Array.from(ossByCategory().entries()), []);
  const mcpGroups = useMemo(() => Array.from(mcpByCategory().entries()), []);

  const filteredPlatform = useMemo(
    () =>
      platformGroups
        .map(
          ([status, items]) =>
            [
              status,
              items.filter((it) =>
                matchesQuery(
                  [
                    it.capability,
                    it.plainSummary,
                    it.useCase,
                    it.poweredBy,
                    it.laneLabel,
                    it.replacesExternal,
                  ],
                  query
                )
              ),
            ] as const
        )
        .filter(([, items]) => items.length > 0),
    [platformGroups, query]
  );

  const filteredOss = useMemo(
    () =>
      ossGroups
        .map(
          ([category, projects]) =>
            [
              category,
              projects.filter((p) =>
                matchesQuery(
                  [
                    p.name,
                    p.org,
                    p.category,
                    p.plainSummary,
                    p.useCase,
                    p.whatItDoes,
                    p.howItHelpsResearch,
                    p.language,
                    p.license,
                    p.note,
                  ],
                  query
                )
              ),
            ] as const
        )
        .filter(([, projects]) => projects.length > 0),
    [ossGroups, query]
  );

  const filteredMcp = useMemo(
    () =>
      mcpGroups
        .map(
          ([category, servers]) =>
            [
              category,
              servers.filter((s) =>
                matchesQuery(
                  [
                    s.name,
                    s.vendor,
                    s.category,
                    s.plainSummary,
                    s.useCase,
                    s.capability,
                    s.useInResearch,
                    s.note,
                  ],
                  query
                )
              ),
            ] as const
        )
        .filter(([, servers]) => servers.length > 0),
    [mcpGroups, query]
  );

  const platformCount = filteredPlatform.reduce((n, [, items]) => n + items.length, 0);
  const ossCount = filteredOss.reduce((n, [, projects]) => n + projects.length, 0);
  const mcpCount = filteredMcp.reduce((n, [, servers]) => n + servers.length, 0);
  const activeCount =
    tab === "platform" ? platformCount : tab === "oss" ? ossCount : mcpCount;

  const placeholder =
    tab === "platform"
      ? "Search built-in powers (e.g. references, journals, statistics)…"
      : tab === "oss"
      ? "Search tools (e.g. Zotero, meta-analysis, charts)…"
      : "Search connectors (e.g. PubMed, files, database)…";

  return (
    <Card>
      <CardHeader
        title="Research toolkit"
        subtitle="What MedCore already does for you — plus the open tools and connectors that power the wider research world."
      />
      <CardBody>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Toolkit category">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "platform"}
              className={`pill-tab ${tab === "platform" ? "pill-tab-active" : ""}`}
              onClick={() => setTab("platform")}
            >
              ✨ Built into MedCore
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "oss"}
              className={`pill-tab ${tab === "oss" ? "pill-tab-active" : ""}`}
              onClick={() => setTab("oss")}
            >
              🧰 Open-source tools
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "mcp"}
              className={`pill-tab ${tab === "mcp" ? "pill-tab-active" : ""}`}
              onClick={() => setTab("mcp")}
            >
              🔌 MCP servers
            </button>
          </div>
          <div className="text-[12px] text-med-sub">
            {activeCount} {activeCount === 1 ? "entry" : "entries"} shown
          </div>
        </div>

        {tab === "platform" && (
          <p className="mt-4 rounded-xl bg-med-bg px-4 py-3 text-sm text-med-ink">
            Good news: you don&apos;t need to install or configure anything below to
            do great research here. These capabilities are already built into
            MedCore — just open the matching tab in your workspace. The other two
            tabs explain the powerful external tools behind the scenes, for the
            curious and the technical.
          </p>
        )}

        <div className="mt-4">
          <label htmlFor="research-toolkit-search" className="label">
            Filter
          </label>
          <input
            id="research-toolkit-search"
            type="text"
            className="input"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="mt-5 space-y-6">
          {tab === "platform" ? (
            filteredPlatform.length === 0 ? (
              <p className="muted">No built-in features match your filter.</p>
            ) : (
              filteredPlatform.map(([status, items]) => (
                <section key={status}>
                  <h3 className="section-title text-base">{STATUS_HEADINGS[status]}</h3>
                  <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                    {items.map((it) => (
                      <IntegrationCard key={it.id} item={it} />
                    ))}
                  </div>
                </section>
              ))
            )
          ) : tab === "oss" ? (
            filteredOss.length === 0 ? (
              <p className="muted">No tools match your filter.</p>
            ) : (
              filteredOss.map(([category, projects]) => (
                <section key={category}>
                  <h3 className="section-title text-base">{category}</h3>
                  <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                    {projects.map((p) => (
                      <OSSCard key={p.id} project={p} />
                    ))}
                  </div>
                </section>
              ))
            )
          ) : filteredMcp.length === 0 ? (
            <p className="muted">No connectors match your filter.</p>
          ) : (
            filteredMcp.map(([category, servers]) => (
              <section key={category}>
                <h3 className="section-title text-base">{category}</h3>
                <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                  {servers.map((s) => (
                    <MCPCard key={s.id} server={s} />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>

        {tab === "mcp" && (
          <p className="muted mt-5 text-[12px]">
            What is an &quot;MCP server&quot;? It&apos;s a standard plug that lets an
            AI assistant safely connect to an outside tool or data source. You
            generally don&apos;t need these for everyday work on MedCore — the
            &quot;Built into MedCore&quot; tab already covers the essentials.
          </p>
        )}

        <p className="muted mt-6 border-t border-med-line pt-4 text-[12px]">
          Honesty note: the &quot;Built into MedCore&quot; cards describe features
          this app actually has today and name the public sources they use.
          Confidence labels and verify links on the other two tabs are curated by
          hand — no live metrics beyond the dated GitHub star snapshots, and no
          fabricated URLs. &quot;Established&quot; entries are well-known or
          maintained in the official source linked; &quot;likely&quot; entries
          carry a caveat in their details. Always open the verify link before
          relying on an external tool or connector.
        </p>
      </CardBody>
    </Card>
  );
}
