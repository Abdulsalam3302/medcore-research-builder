"use client";

/**
 * ReviewImprove — the unified "initial → AI swarm → final" manuscript
 * improvement loop.
 *
 * STEP 1  Initial score   : instant, deterministic evaluateManuscript(project).
 * STEP 2  AI swarm review  : POST /api/swarm/review → { report }. Tolerates the
 *                            offline / no-LLM path (coherence-only report).
 * STEP 3  Final score      : evaluateWithReport(project, report) folds the
 *                            swarm findings in, then we show the per-dimension
 *                            delta vs the initial score and a motivating verdict.
 *
 * The whole loop is repeatable: fix issues, re-run the swarm, watch the score
 * climb. All scoring is heuristic — an aid to track progress, never a guarantee
 * of acceptance, AI-undetectability, or originality.
 */

import { useMemo, useState } from "react";
import type { ProjectState } from "@/lib/types";
import type { SwarmReport } from "@/lib/swarm/types";
import { buildExpertise, type AppliedLens } from "@/lib/swarm/expertise";
import {
  evaluateManuscript,
  evaluateWithReport,
  type ManuscriptEvaluation,
  type DimensionScore,
} from "@/lib/eval/scorecard";
import { Card, CardBody, CardHeader } from "./ui/Card";
import { Badge, type BadgeKind } from "./ui/Badge";
import { InfoHint } from "./ui/InfoHint";
import { ProgressRing } from "./ui/ProgressRing";
import { CopyButton } from "./ui/CopyButton";
import { Spinner } from "./ui/Spinner";

/* ------------------------------------------------------------------ */
/* Small presentational helpers                                       */
/* ------------------------------------------------------------------ */

function scoreKind(score: number): BadgeKind {
  if (score >= 75) return "good";
  if (score >= 55) return "info";
  if (score >= 40) return "warn";
  return "bad";
}

function barColor(score: number): string {
  return score >= 75
    ? "bg-emerald-500"
    : score >= 55
    ? "bg-sky-500"
    : score >= 40
    ? "bg-amber-500"
    : "bg-rose-500";
}

function ringAccent(score: number): string {
  return score >= 75
    ? "#10b981"
    : score >= 55
    ? "#0ea5e9"
    : score >= 40
    ? "#f59e0b"
    : "#f43f5e";
}

function dimLabel(d: string): string {
  return d.replace(/-/g, " ");
}

function MetricBar({
  d,
  delta,
}: {
  d: DimensionScore;
  delta?: number;
}) {
  return (
    <div className="grid gap-1">
      <div className="flex items-center justify-between text-[12.5px]">
        <span className="font-medium text-med-ink capitalize">{dimLabel(d.dimension)}</span>
        <span className="flex items-center gap-2 text-med-sub">
          {typeof delta === "number" && delta !== 0 && (
            <span
              className={`tabular-nums font-semibold ${
                delta > 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {delta > 0 ? "+" : ""}
              {delta}
            </span>
          )}
          <span className="tabular-nums">
            {d.score}/100 · {Math.round(d.weight * 100)}%
          </span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor(d.score)}`}
          style={{ width: `${d.score}%` }}
        />
      </div>
      <div className="text-[11.5px] text-med-sub">{d.detail}</div>
      {d.signals.length > 0 && (
        <ul className="text-[11px] text-med-sub list-disc list-inside">
          {d.signals.slice(0, 4).map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ScorePanel({
  title,
  ev,
  deltas,
}: {
  title: string;
  ev: ManuscriptEvaluation;
  deltas?: Record<string, number>;
}) {
  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-4">
        <ProgressRing value={ev.overall} size={120} stroke={12} label={`Grade ${ev.grade}`} accent={ringAccent(ev.overall)} />
        <div className="grid gap-1">
          <div className="text-sm font-semibold text-med-ink">{title}</div>
          <div className="flex flex-wrap gap-2">
            <Badge kind={scoreKind(ev.overall)}>{ev.overall}/100</Badge>
            <Badge kind={scoreKind(ev.overall)}>Grade {ev.grade}</Badge>
            <Badge kind="neutral">{ev.dimensions.length} dimensions</Badge>
          </div>
        </div>
      </div>
      <div className="grid gap-3">
        {ev.dimensions.map((d) => (
          <MetricBar key={d.dimension} d={d} delta={deltas?.[d.dimension]} />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Swarm findings rendering                                           */
/* ------------------------------------------------------------------ */

const SEVERITY_KIND: Record<string, BadgeKind> = {
  critical: "bad",
  major: "warn",
  minor: "info",
  praise: "good",
};

function SwarmPanel({ report, mode }: { report: SwarmReport; mode: string }) {
  const layers = Object.keys(report.scorecard || {});
  const findings = report.findings || [];
  return (
    <div className="grid gap-4">
      {mode === "coherence-only" && (
        <div className="rounded-lg border border-sky-200 bg-sky-50/60 p-3 text-[12px] text-sky-900">
          Offline mode: no LLM is configured, so only the deterministic coherence layer ran. The
          review is still valid and the score reflects real structural/consistency signals. Configure
          an LLM to add methodology, statistics, literature, integrity, clarity, and reproducibility
          agents.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[12px] text-med-sub">Overall swarm verdict:</span>
        <Badge
          kind={
            report.overallVerdict === "ready"
              ? "good"
              : report.overallVerdict === "minor-revisions"
              ? "info"
              : report.overallVerdict === "major-revisions"
              ? "warn"
              : "bad"
          }
        >
          {report.overallVerdict.replace(/-/g, " ")}
        </Badge>
      </div>

      {/* Per-layer scorecard */}
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] uppercase tracking-wide text-med-sub font-semibold">
          Per-layer scorecard
        </span>
        <InfoHint
          title="What each layer score means"
          text="Each layer is one review dimension scored 0–100 (e.g. methodology, statistics, clarity). A low layer points you straight at the weakest part of the manuscript — the most efficient place to spend your next revision. Read it alongside the findings below, which say exactly what to fix."
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {layers.map((layer) => {
          const s = report.scorecard[layer];
          return (
            <div key={layer} className="rounded-lg border border-slate-200 p-3 grid gap-1">
              <div className="flex items-center justify-between text-[12.5px]">
                <span className="font-medium capitalize text-med-ink">{layer.replace(/-/g, " ")}</span>
                <span className="tabular-nums text-med-sub">{s}/100</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className={`h-full rounded-full ${barColor(s)}`} style={{ width: `${s}%` }} />
              </div>
              <div className="text-[11px] text-med-sub">{report.layerSummaries?.[layer]}</div>
            </div>
          );
        })}
      </div>

      {/* Findings */}
      {findings.length > 0 && (
        <div className="grid gap-2">
          <div className="text-[11px] uppercase tracking-wide text-med-sub font-semibold">
            Findings ({findings.length})
          </div>
          <ul className="grid gap-2">
            {findings.slice(0, 30).map((f, i) => (
              <li key={i} className="rounded-lg border border-slate-200 p-2.5 grid gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge kind={SEVERITY_KIND[f.severity] || "neutral"}>{f.severity}</Badge>
                  <span className="text-[11px] text-med-sub">{f.agent}</span>
                  {f.section && <span className="text-[11px] text-med-sub">· {f.section}</span>}
                </div>
                <div className="text-[12.5px] text-med-ink">{f.issue}</div>
                {f.recommendation && (
                  <div className="text-[11.5px] text-med-sub">→ {f.recommendation}</div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Human review reminders */}
      {report.humanReviewRequired?.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3">
          <div className="flex items-center gap-1.5">
            <div className="text-[11px] uppercase tracking-wide text-amber-800 font-semibold">
              Human review required
            </div>
            <InfoHint
              title="Why human review still matters"
              text="Automated review can flag patterns, but it cannot confirm that your data are real, your ethics approval is valid, or your clinical claims are sound. These items demand a human expert — a co-author, statistician, or mentor. Treat them as non-negotiable checks the tool deliberately refuses to sign off on for you."
            />
          </div>
          <ul className="list-disc list-inside text-[12px] text-amber-900 mt-1">
            {report.humanReviewRequired.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Applied expert lenses (auto-derived from the Study Design Selector) */
/* ------------------------------------------------------------------ */

const LENS_META: Record<AppliedLens["kind"], { label: string; tone: BadgeKind; icon: string }> = {
  guideline: { label: "Reporting guideline", tone: "good", icon: "📋" },
  feature: { label: "Special-feature lens", tone: "info", icon: "✨" },
  extension: { label: "Guideline extension", tone: "neutral", icon: "➕" },
  pitfall: { label: "Design pitfall watch", tone: "warn", icon: "⚠️" },
};

function ExpertLensPanel({ project }: { project: ProjectState }) {
  const expertise = useMemo(() => buildExpertise(project), [project]);
  const { lenses, directives, designName, guidelineLabel } = expertise;

  if (lenses.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-[12px] text-med-sub">
        No design-specific lenses yet. Pick a study design (and its special features) in the{" "}
        <strong>Study Design Selector</strong> and they will be applied here automatically — the
        review then checks your draft against your exact reporting guideline, its known pitfalls, and
        every feature you enabled.
      </div>
    );
  }

  const grouped = lenses.reduce<Record<AppliedLens["kind"], AppliedLens[]>>(
    (acc, l) => {
      (acc[l.kind] ||= []).push(l);
      return acc;
    },
    {} as Record<AppliedLens["kind"], AppliedLens[]>,
  );
  const order: AppliedLens["kind"][] = ["guideline", "feature", "extension", "pitfall"];

  return (
    <div className="rounded-xl border border-fuchsia-200 bg-fuchsia-50/50 p-4 grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-fuchsia-900 inline-flex items-center gap-1.5">
          🧠 Applied expert lenses
          <InfoHint
            title="Where these come from"
            text="Everything you chose in the Study Design Selector — your design's reporting guideline, its known pitfalls, and every special feature you enabled — is converted into review directives and handed to every agent in the swarm. So the review doesn't just check generic quality: it checks your draft against the exact standard your study must meet, automatically. The more you configure upfront, the more expert reviewers you get here for free."
          />
        </span>
        <Badge kind="info">{lenses.length} lenses</Badge>
        <Badge kind="neutral">{directives.length} directives</Badge>
        {guidelineLabel && <Badge kind="good">{guidelineLabel}</Badge>}
      </div>
      <p className="text-[12px] text-fuchsia-900/80">
        {designName ? (
          <>
            Because you selected <strong>{designName}</strong>, the swarm below automatically applies{" "}
            <strong>{lenses.length}</strong> design-specific reviewers on top of its standard methodology,
            statistics, literature, integrity, clarity and reproducibility passes.
          </>
        ) : (
          <>These reviewers run on top of the standard swarm passes.</>
        )}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {order
          .filter((k) => grouped[k]?.length)
          .map((kind) => (
            <div key={kind} className="rounded-lg border border-fuchsia-200/70 bg-white p-3 grid gap-1.5">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-fuchsia-700 inline-flex items-center gap-1">
                <span aria-hidden>{LENS_META[kind].icon}</span>
                {LENS_META[kind].label}
                <span className="text-med-sub font-normal">· {grouped[kind].length}</span>
              </div>
              <ul className="grid gap-1">
                {grouped[kind].slice(0, 8).map((l, i) => (
                  <li key={i} className="text-[12px] text-med-ink">
                    <span className="font-medium">{l.label}</span>
                    {l.detail ? <span className="text-med-sub"> — {l.detail}</span> : null}
                  </li>
                ))}
                {grouped[kind].length > 8 && (
                  <li className="text-[11px] text-med-sub">+ {grouped[kind].length - 8} more</li>
                )}
              </ul>
            </div>
          ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                     */
/* ------------------------------------------------------------------ */

export function ReviewImprove({ project }: { project: ProjectState }) {
  // STEP 1 — deterministic, instant.
  const initial = useMemo(() => evaluateManuscript(project), [project]);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<SwarmReport | null>(null);
  const [mode, setMode] = useState<string>("");

  // STEP 3 — final score folds the swarm report in (only once a report exists).
  const final = useMemo(
    () => (report ? evaluateWithReport(project, report) : null),
    [project, report],
  );

  const deltas = useMemo(() => {
    if (!final) return undefined;
    const map: Record<string, number> = {};
    for (const d of final.dimensions) {
      const prev = initial.dimensions.find((x) => x.dimension === d.dimension);
      map[d.dimension] = d.score - (prev?.score ?? 0);
    }
    return map;
  }, [final, initial]);

  const overallDelta = final ? final.overall - initial.overall : 0;

  const verdictText = (() => {
    if (!final) return "";
    if (overallDelta >= 8) return `Strong signal: your draft scored +${overallDelta} after the full review.`;
    if (overallDelta >= 2) return `Your draft improved by +${overallDelta} after the review.`;
    if (overallDelta <= -2)
      return `The review lowered the score by ${overallDelta} — the swarm surfaced issues the quick score missed. Fix them and re-run.`;
    return "No net change — the deterministic score and the swarm-adjusted score agree.";
  })();

  async function runSwarm() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/swarm/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project }),
      });
      const data = (await res.json().catch(() => null)) as
        | { report?: SwarmReport; mode?: string; error?: string }
        | null;
      if (!res.ok || !data?.report) {
        throw new Error(data?.error || `Swarm review failed (HTTP ${res.status}).`);
      }
      setReport(data.report);
      setMode(data.mode || "swarm");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const copyText = useMemo(() => {
    const lines: string[] = [];
    lines.push(`Initial score: ${initial.overall}/100 (grade ${initial.grade})`);
    if (final) {
      lines.push(`Final score (swarm-adjusted): ${final.overall}/100 (grade ${final.grade})`);
      lines.push(`Overall delta: ${overallDelta >= 0 ? "+" : ""}${overallDelta}`);
      lines.push("");
      lines.push("Per-dimension (final / delta):");
      for (const d of final.dimensions) {
        const dl = deltas?.[d.dimension] ?? 0;
        lines.push(`  - ${dimLabel(d.dimension)}: ${d.score}/100 (${dl >= 0 ? "+" : ""}${dl})`);
      }
    }
    return lines.join("\n");
  }, [initial, final, deltas, overallDelta]);

  return (
    <Card>
      <CardHeader
        title="Review & Improve"
        subtitle="Initial score → AI swarm review → final score. Fix the issues, re-run, and watch your draft improve. Heuristic aid — not a guarantee of acceptance, originality, or AI-undetectability."
        right={
          <div className="flex items-center gap-2">
            <Badge kind={scoreKind(initial.overall)}>Initial {initial.overall}/100</Badge>
            {final && <Badge kind={scoreKind(final.overall)}>Final {final.overall}/100</Badge>}
          </div>
        }
      />
      <CardBody className="grid gap-6">
        {/* STEP 1 */}
        <section className="grid gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white text-[12px] font-semibold">
              1
            </span>
            <h3 className="text-sm font-semibold text-med-ink">Initial score (instant, deterministic)</h3>
            <InfoHint
              title="Why a baseline first?"
              text="This is a fast, rule-based read of your draft computed locally — no AI. It gives you a fixed starting line. Capturing it before the peer-review pass is what lets you prove improvement: same yardstick, before and after, so any gain is real and not just a re-worded opinion."
            />
          </div>
          <ScorePanel title="Quick heuristic evaluation" ev={initial} />
        </section>

        {/* Applied expert lenses — auto-derived from the Study Design Selector. */}
        <section className="grid gap-3 border-t border-slate-100 pt-5">
          <ExpertLensPanel project={project} />
        </section>

        {/* STEP 2 */}
        <section className="grid gap-3 border-t border-slate-100 pt-5">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white text-[12px] font-semibold">
              2
            </span>
            <h3 className="text-sm font-semibold text-med-ink">AI swarm review</h3>
            <InfoHint
              title="What the swarm checks"
              text="A set of specialist agents each take one lens — methodology, statistics, literature, integrity, clarity, reproducibility — the way a real peer-review panel divides labour. Splitting the job catches issues a single pass misses. It is an aid, not a verdict: it cannot guarantee acceptance or originality, and its findings still need your judgement."
            />
          </div>
          <p className="text-[12px] text-med-sub">
            Runs the specialist peer-review agents (methodology, statistics, literature, integrity,
            clarity, reproducibility). Works offline too — without an LLM it returns a
            coherence-based review.
          </p>
          <div className="flex items-center gap-3">
            <button type="button" className="btn-primary" onClick={runSwarm} disabled={busy} aria-busy={busy}>
              {busy ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner /> Reviewing…
                </span>
              ) : report ? (
                "Re-run swarm review"
              ) : (
                "Run AI swarm review"
              )}
            </button>
            {report && <CopyButton text={copyText} label="Copy report" />}
          </div>

          {error && (
            <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50/70 p-3 text-[12.5px] text-rose-900">
              {error}
            </div>
          )}

          {report && <SwarmPanel report={report} mode={mode} />}
        </section>

        {/* STEP 3 */}
        {final && (
          <section className="grid gap-3 border-t border-slate-100 pt-5">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white text-[12px] font-semibold">
                3
              </span>
              <h3 className="text-sm font-semibold text-med-ink">Final score (swarm-adjusted)</h3>
              <InfoHint
                title="Why re-score?"
                text="The final score re-runs the same baseline metric but folds the swarm's critical and major findings into the relevant dimensions. Comparing it against your initial score is the proof of improvement — and because serious findings drag the number down, a clean quick score can't hide a real problem the review surfaced."
              />
            </div>

            <div
              className={`rounded-lg border p-3 text-[13px] font-medium ${
                overallDelta > 0
                  ? "border-emerald-200 bg-emerald-50/70 text-emerald-900"
                  : overallDelta < 0
                  ? "border-amber-200 bg-amber-50/70 text-amber-900"
                  : "border-slate-200 bg-slate-50 text-med-ink"
              }`}
            >
              {verdictText}
            </div>

            <ScorePanel title="Final swarm-adjusted evaluation" ev={final} deltas={deltas} />

            <p className="text-[11px] text-med-sub">
              This is a repeatable loop: address the findings above, then press “Re-run swarm review”
              to recompute the final score. Final scoring folds the swarm’s critical/major findings
              into the relevant dimensions, so a clean quick score cannot hide a serious issue.
            </p>
          </section>
        )}
      </CardBody>
    </Card>
  );
}
