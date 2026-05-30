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

type Tab = "oss" | "mcp";

function confidenceBadgeKind(confidence: OSSConfidence | MCPConfidence) {
  return confidence === "established" ? "good" : "warn";
}

function matchesQuery(haystacks: Array<string | undefined>, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return haystacks.some((h) => (h ?? "").toLowerCase().includes(q));
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

function MetaRow({ items }: { items: Array<string | undefined> }) {
  const present = items.filter((x): x is string => Boolean(x));
  if (present.length === 0) return null;
  return (
    <div className="muted mt-2 flex flex-wrap gap-x-3 gap-y-1">
      {present.map((item, i) => (
        <span key={i}>{item}</span>
      ))}
    </div>
  );
}

function OSSCard({ project }: { project: OSSProject }) {
  return (
    <Card>
      <CardBody>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-semibold text-med-ink">{project.name}</div>
            <div className="muted">{project.org}</div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {typeof project.stars === "number" && (
              <Badge kind="neutral">★ {project.stars.toLocaleString()}</Badge>
            )}
            <Badge kind={confidenceBadgeKind(project.confidence)}>
              {project.confidence}
            </Badge>
          </div>
        </div>

        <p className="mt-3 text-sm text-med-ink">{project.whatItDoes}</p>
        <p className="mt-2 text-sm text-med-sub">
          <span className="font-medium text-med-ink">How it helps research: </span>
          {project.howItHelpsResearch}
        </p>

        <MetaRow items={[project.language, project.license]} />

        {project.note && (
          <p className="mt-2 text-[12px] italic text-med-sub">{project.note}</p>
        )}

        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <VerifyLink href={project.verifyUrl} />
          {project.verifiedAt && (
            <span className="text-[11px] text-med-sub">GitHub-verified {project.verifiedAt}</span>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

function MCPCard({ server }: { server: MCPServer }) {
  return (
    <Card>
      <CardBody>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-semibold text-med-ink">{server.name}</div>
            {server.vendor && <div className="muted">{server.vendor}</div>}
          </div>
          <Badge kind={confidenceBadgeKind(server.confidence)}>
            {server.confidence}
          </Badge>
        </div>

        <p className="mt-3 text-sm text-med-ink">{server.capability}</p>
        <p className="mt-2 text-sm text-med-sub">
          <span className="font-medium text-med-ink">Use in research: </span>
          {server.useInResearch}
        </p>

        {server.note && (
          <p className="mt-2 text-[12px] italic text-med-sub">{server.note}</p>
        )}

        <div className="mt-3">
          <VerifyLink href={server.verifyUrl} />
        </div>
      </CardBody>
    </Card>
  );
}

export function ResearchToolkit() {
  const [tab, setTab] = useState<Tab>("oss");
  const [query, setQuery] = useState("");

  const ossGroups = useMemo(() => Array.from(ossByCategory().entries()), []);
  const mcpGroups = useMemo(() => Array.from(mcpByCategory().entries()), []);

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

  const ossCount = filteredOss.reduce((n, [, projects]) => n + projects.length, 0);
  const mcpCount = filteredMcp.reduce((n, [, servers]) => n + servers.length, 0);
  const activeCount = tab === "oss" ? ossCount : mcpCount;

  return (
    <Card>
      <CardHeader
        title="Research toolkit"
        subtitle="Curated open-source projects and MCP servers that empower medical & academic research."
      />
      <CardBody>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2" role="tablist" aria-label="Toolkit category">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "oss"}
              className={`pill-tab ${tab === "oss" ? "pill-tab-active" : ""}`}
              onClick={() => setTab("oss")}
            >
              Open-source projects
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "mcp"}
              className={`pill-tab ${tab === "mcp" ? "pill-tab-active" : ""}`}
              onClick={() => setTab("mcp")}
            >
              MCP servers
            </button>
          </div>
          <div className="text-[12px] text-med-sub">
            {activeCount} {activeCount === 1 ? "entry" : "entries"} shown
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="research-toolkit-search" className="label">
            Filter
          </label>
          <input
            id="research-toolkit-search"
            type="text"
            className="input"
            placeholder={
              tab === "oss"
                ? "Search projects (e.g. Zotero, meta-analysis, PyTorch)…"
                : "Search MCP servers (e.g. PubMed, Postgres, filesystem)…"
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="mt-5 space-y-6">
          {tab === "oss" ? (
            filteredOss.length === 0 ? (
              <p className="muted">No projects match your filter.</p>
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
            <p className="muted">No MCP servers match your filter.</p>
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

        <p className="muted mt-6 border-t border-med-line pt-4 text-[12px]">
          Honesty note: confidence labels and verify links are curated by hand —
          no live metrics, no fabricated URLs. &quot;Established&quot; entries are
          well-known or maintained in the official source linked; &quot;likely&quot;
          entries (often community-built or API-backed) carry a caveat in their
          note. Always open the verify link and confirm a project or server before
          relying on it.
        </p>
      </CardBody>
    </Card>
  );
}
