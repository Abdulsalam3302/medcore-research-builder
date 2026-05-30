"use client";

import { useMemo } from "react";
import type { ProjectState } from "@/lib/types";
import { evaluateManuscript, type DimensionScore } from "@/lib/eval/scorecard";
import { Card, CardBody, CardHeader } from "./ui/Card";
import { Badge } from "./ui/Badge";

function scoreKind(score: number): "good" | "info" | "warn" | "bad" {
  if (score >= 75) return "good";
  if (score >= 55) return "info";
  if (score >= 40) return "warn";
  return "bad";
}

function Bar({ d }: { d: DimensionScore }) {
  return (
    <div className="grid gap-1">
      <div className="flex items-center justify-between text-[12.5px]">
        <span className="font-medium text-med-ink capitalize">{d.dimension.replace(/-/g, " ")}</span>
        <span className="text-med-sub">{d.score}/100 · weight {Math.round(d.weight * 100)}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full ${
            d.score >= 75 ? "bg-emerald-500" : d.score >= 55 ? "bg-sky-500" : d.score >= 40 ? "bg-amber-500" : "bg-rose-500"
          }`}
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

export function ManuscriptScorecard({ project }: { project: ProjectState }) {
  const ev = useMemo(() => evaluateManuscript(project), [project]);

  return (
    <Card>
      <CardHeader
        title="Manuscript Scorecard"
        subtitle="Objective, repeatable multi-dimension evaluation — re-run after edits to confirm the draft is improving."
        right={
          <div className="flex items-center gap-2">
            <Badge kind={scoreKind(ev.overall)}>Grade {ev.grade}</Badge>
            <Badge kind={scoreKind(ev.overall)}>{ev.overall}/100</Badge>
          </div>
        }
      />
      <CardBody className="grid gap-4">
        <div className="grid gap-3">
          {ev.dimensions.map((d) => (
            <Bar key={d.dimension} d={d} />
          ))}
        </div>

        {ev.strengths.length > 0 && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
            <div className="text-[11px] uppercase tracking-wide text-emerald-800 font-semibold">Strengths</div>
            <ul className="list-disc list-inside text-[12.5px] text-emerald-900 mt-1">
              {ev.strengths.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}

        {ev.gaps.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3">
            <div className="text-[11px] uppercase tracking-wide text-amber-800 font-semibold">Top gaps to close</div>
            <ul className="list-disc list-inside text-[12.5px] text-amber-900 mt-1">
              {ev.gaps.map((g, i) => (
                <li key={i}>{g}</li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-[11px] text-med-sub">
          Heuristic, deterministic scoring to track progress — not a substitute for expert peer review or the AI swarm review.
        </p>
      </CardBody>
    </Card>
  );
}
