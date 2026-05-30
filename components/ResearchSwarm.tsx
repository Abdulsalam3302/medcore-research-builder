"use client";

import { useState } from "react";
import type { ProjectState } from "@/lib/types";
import type {
  AgentRole,
  AgentFinding,
  Severity,
  SwarmReport,
  OverallVerdict,
} from "@/lib/swarm/types";
import { ALL_AGENTS, AGENT_LABELS } from "@/lib/swarm/agents";
import { Card, CardBody, CardHeader } from "./ui/Card";
import { Badge, type BadgeKind } from "./ui/Badge";
import { Spinner } from "./ui/Spinner";
import { InfoHint } from "./ui/InfoHint";

const LAYERS = ["quality", "safety", "literature", "peer-review"] as const;

const LAYER_LABEL: Record<string, string> = {
  quality: "Quality",
  safety: "Safety & integrity",
  literature: "Literature",
  "peer-review": "Peer review",
};

const VERDICT_META: Record<OverallVerdict, { label: string; kind: BadgeKind }> = {
  ready: { label: "Ready", kind: "good" },
  "minor-revisions": { label: "Minor revisions", kind: "info" },
  "major-revisions": { label: "Major revisions", kind: "warn" },
  "not-ready": { label: "Not ready", kind: "bad" },
};

const SEVERITY_ORDER: Severity[] = ["critical", "major", "minor", "praise"];

const SEVERITY_LABEL: Record<Severity, string> = {
  critical: "Critical",
  major: "Major",
  minor: "Minor",
  praise: "Strength",
};

function severityKind(sev: Severity): BadgeKind {
  return sev === "critical"
    ? "bad"
    : sev === "major"
    ? "warn"
    : sev === "praise"
    ? "good"
    : "info";
}

function scoreKind(score: number): BadgeKind {
  if (score >= 85) return "good";
  if (score >= 70) return "info";
  if (score >= 50) return "warn";
  return "bad";
}

function severityTone(sev: Severity): string {
  return sev === "critical"
    ? "border-rose-200 bg-rose-50"
    : sev === "major"
    ? "border-amber-200 bg-amber-50"
    : sev === "praise"
    ? "border-emerald-200 bg-emerald-50"
    : "border-sky-200 bg-sky-50";
}

type ApiResponse = {
  report?: SwarmReport;
  mode?: "swarm" | "coherence-only";
  agentsRun?: AgentRole[];
  agentsFailed?: Array<{ agent: AgentRole; error: string }>;
  error?: string;
};

export function ResearchSwarm({ project }: { project: ProjectState }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [report, setReport] = useState<SwarmReport | null>(null);
  const [mode, setMode] = useState<"swarm" | "coherence-only" | null>(null);
  const [failed, setFailed] = useState<Array<{ agent: AgentRole; error: string }>>([]);
  const [selected, setSelected] = useState<Set<AgentRole>>(new Set(ALL_AGENTS));

  function toggle(role: AgentRole) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role);
      else next.add(role);
      return next;
    });
  }

  async function run() {
    setBusy(true);
    setErr(null);
    setReport(null);
    setMode(null);
    setFailed([]);
    try {
      const r = await fetch("/api/swarm/review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ project, agents: Array.from(selected) }),
      });
      const data = (await r.json()) as ApiResponse;
      if (!r.ok || !data.report) throw new Error(data.error || `HTTP ${r.status}`);
      setReport(data.report);
      setMode(data.mode || null);
      setFailed(data.agentsFailed || []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const findingsByAgent = (() => {
    if (!report) return [] as Array<{ agent: AgentRole; findings: AgentFinding[] }>;
    const map = new Map<AgentRole, AgentFinding[]>();
    for (const f of report.findings) {
      const list = map.get(f.agent) || [];
      list.push(f);
      map.set(f.agent, list);
    }
    // Order agents by the canonical ALL_AGENTS order; coherence-only findings
    // arrive under "methodologist".
    return ALL_AGENTS.filter((a) => map.has(a)).map((agent) => ({
      agent,
      findings: (map.get(agent) || []).sort(
        (a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity),
      ),
    }));
  })();

  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader
          title={
            <span className="inline-flex items-center gap-1.5">
              AI peer-review swarm
              <InfoHint
                title="What the swarm does"
                text="Each agent inspects your manuscript through one lens: methodology checks study design, statistics checks analyses and reporting, literature checks how your work sits against prior evidence, peer review and editorial weigh overall soundness and fit, integrity looks for fabrication or overstatement risks, clarity reads for writing, and reproducibility checks whether methods could be repeated. It's a structured second read to catch issues early — it does not replace formal human peer review or ethics review."
              />
            </span>
          }
          subtitle="A swarm of specialist agents — methodology, statistics, literature, peer review, editorial, integrity, clarity, reproducibility — reviews your manuscript through layered quality and safety lenses. Folds in the deterministic coherence engine."
          right={
            report ? (
              <Badge kind={VERDICT_META[report.overallVerdict].kind}>
                {VERDICT_META[report.overallVerdict].label}
              </Badge>
            ) : null
          }
        />
        <CardBody className="grid gap-4">
          <fieldset className="grid gap-2" disabled={busy}>
            <legend className="text-xs font-semibold uppercase tracking-wide text-med-sub inline-flex items-center gap-1.5">
              Agents
              <InfoHint
                title="Pick which reviewers run"
                text="Tick the lenses you want for this pass — run all for a broad review, or just a few (e.g. statistics and integrity) to focus. Fewer agents run faster and cost fewer LLM calls. You can re-run with a different selection any time."
              />
            </legend>
            <div className="flex flex-wrap gap-2">
              {ALL_AGENTS.map((role) => (
                <label
                  key={role}
                  className="flex items-center gap-1.5 text-sm border border-med-line rounded px-2 py-1 cursor-pointer bg-white/60 hover:bg-white"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(role)}
                    onChange={() => toggle(role)}
                  />
                  {AGENT_LABELS[role]}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="btn-primary"
              onClick={run}
              disabled={busy || selected.size === 0}
            >
              {busy ? (
                <span className="flex items-center gap-2">
                  <Spinner /> Running swarm…
                </span>
              ) : (
                "Run AI peer-review swarm"
              )}
            </button>
            {selected.size === 0 && !busy ? (
              <span className="text-xs text-med-sub">Select at least one agent.</span>
            ) : null}
          </div>

          <div
            className="text-[11px] text-med-sub border border-med-line rounded p-2 bg-white/40 flex items-start gap-1.5"
            role="note"
          >
            <span>
              AI assistance — not a substitute for human peer review. Findings may be
              incomplete or wrong; verify every clinical claim, statistic, and citation
              against source data before acting on them.
            </span>
            <InfoHint
              side="top"
              title="Two ways this runs"
              text="With an LLM key configured, the specialist agents run and write tailored findings. Without one — or if every agent fails — it falls back to offline coherence-only mode: a deterministic check for internal consistency, no AI reasoning. Either way, a qualified human must still do the real peer and ethics review before you act on the output."
            />
          </div>
        </CardBody>
      </Card>

      {err ? (
        <div
          role="alert"
          className="border border-rose-200 bg-rose-50 text-rose-800 rounded p-3 text-sm"
        >
          {err}
        </div>
      ) : null}

      {report ? (
        <>
          {mode === "coherence-only" ? (
            <div className="border border-amber-200 bg-amber-50 text-amber-800 rounded p-3 text-sm">
              Coherence-only mode: no LLM agents ran (LLM not configured or all agents
              failed). The report below reflects the deterministic coherence engine only.
            </div>
          ) : null}

          {failed.length ? (
            <div className="border border-amber-200 bg-amber-50 text-amber-800 rounded p-3 text-sm">
              {failed.length} agent{failed.length === 1 ? "" : "s"} failed and were
              skipped: {failed.map((f) => AGENT_LABELS[f.agent]).join(", ")}.
            </div>
          ) : null}

          {/* Human-review panel — prominent, safety-first. */}
          <Card>
            <CardHeader
              title={
                <span className="inline-flex items-center gap-1.5">
                  Requires human review
                  <InfoHint
                    title="Why this list matters most"
                    text="These are claims the AI cannot confirm — things like whether a statistic matches the source data, whether ethics approval is in place, or whether a clinical interpretation is sound. Treat them as a to-do list for you and your co-authors, not findings the tool has resolved."
                  />
                </span>
              }
              subtitle="The swarm cannot verify these — a qualified human must."
              right={<Badge kind="bad">{report.humanReviewRequired.length}</Badge>}
            />
            <CardBody>
              <div
                role="alert"
                className="border border-rose-300 bg-rose-50 rounded p-3 text-sm"
              >
                <ul className="grid gap-1.5 list-disc pl-5 text-med-ink">
                  {report.humanReviewRequired.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </CardBody>
          </Card>

          {/* Scorecard per layer. */}
          <Card>
            <CardHeader
              title={
                <span className="inline-flex items-center gap-1.5">
                  Layered scorecard
                  <InfoHint
                    title="How to read the scores"
                    text="Each layer gets a rough 0–100 from the agents that ran — higher means fewer or less severe issues raised in that lens. Use it to spot which areas need the most attention, not as a publishable grade or a guarantee of quality. A high score still requires human peer review."
                  />
                </span>
              }
              subtitle="0–100 per quality/safety layer."
            />
            <CardBody>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {LAYERS.map((layer) => {
                  const score = report.scorecard[layer] ?? 0;
                  return (
                    <div
                      key={layer}
                      className="border border-med-line rounded p-3 bg-white/60"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-med-sub">
                          {LAYER_LABEL[layer] || layer}
                        </span>
                        <Badge kind={scoreKind(score)}>{score}/100</Badge>
                      </div>
                      <div className="text-xs text-med-sub mt-2">
                        {report.layerSummaries[layer] || "—"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>

          {/* Findings grouped by agent, then ordered critical → praise. */}
          {findingsByAgent.length === 0 ? (
            <Card>
              <CardBody>
                <div className="border border-emerald-200 bg-emerald-50 text-emerald-800 rounded p-3 text-sm">
                  No findings produced.
                </div>
              </CardBody>
            </Card>
          ) : (
            findingsByAgent.map(({ agent, findings }) => {
              const summary = report.layerSummaries[`agent:${agent}`];
              return (
                <Card key={agent}>
                  <CardHeader
                    title={AGENT_LABELS[agent]}
                    subtitle={summary || undefined}
                    right={<Badge kind="neutral">{findings.length}</Badge>}
                  />
                  <CardBody className="grid gap-2.5">
                    {findings.map((f, i) => (
                      <FindingRow key={`${agent}-${i}`} finding={f} />
                    ))}
                  </CardBody>
                </Card>
              );
            })
          )}
        </>
      ) : null}
    </div>
  );
}

function FindingRow({ finding }: { finding: AgentFinding }) {
  return (
    <div className={`border rounded p-3 ${severityTone(finding.severity)}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge kind={severityKind(finding.severity)}>
            {SEVERITY_LABEL[finding.severity]}
          </Badge>
          {finding.section ? (
            <span className="text-[10.5px] uppercase tracking-wide text-med-sub border border-med-line rounded px-1.5 py-0.5 bg-white/60">
              {finding.section}
            </span>
          ) : null}
        </div>
        <span className="text-[10.5px] uppercase tracking-wide text-med-sub">
          {finding.confidence} confidence
        </span>
      </div>
      <div className="text-med-ink mt-1.5 text-sm font-medium">{finding.issue}</div>
      <div className="text-med-sub mt-1.5 text-xs">
        <span className="font-semibold text-med-ink">Recommendation: </span>
        {finding.recommendation}
      </div>
    </div>
  );
}
