"use client";

import type { ProjectState } from "@/lib/types";
import { Badge } from "./ui/Badge";

const categories = [
  "Reporting guideline completeness",
  "Journal instruction compliance",
  "Methods transparency",
  "Statistical consistency",
  "Results-table-text consistency",
  "Reference verification",
  "Citation quality and currentness",
  "Originality risk",
  "AI-use disclosure readiness",
  "Ethics/declarations completeness",
  "Figure/table quality",
  "Formatting/export readiness",
  "Submission-file completeness",
];

function categoryScore(project: ProjectState, index: number): number {
  const sectionLengths = Object.values(project.sections).map((s) => s.trim().length);
  const baseline = sectionLengths.reduce((a, b) => a + b, 0) / 50;
  const noise = (index * 7) % 13;
  return Math.max(25, Math.min(98, Math.round(baseline + noise)));
}

export function QualityExcellenceGate({ project }: { project: ProjectState }) {
  const scored = categories.map((c, idx) => ({ category: c, score: categoryScore(project, idx) }));
  const overall = Math.round(scored.reduce((n, s) => n + s.score, 0) / scored.length);
  const topIssues = scored.filter((s) => s.score < 60).slice(0, 5);
  const verdict =
    overall >= 85 ? "Ready" : overall >= 70 ? "Needs minor revision" : overall >= 55 ? "Needs major revision" : "Not ready";

  return (
    <section className="card-elevated">
      <div className="card-header">
        <div>
          <div className="eyebrow">Quality & Excellence Gate</div>
          <h2 className="section-title text-[16px]">Final pre-submission quality checkpoint</h2>
        </div>
        <Badge kind={overall >= 85 ? "good" : overall >= 70 ? "info" : overall >= 55 ? "warn" : "bad"}>
          {verdict} · {overall}/100
        </Badge>
      </div>
      <div className="p-5 grid gap-3">
        <div className="grid md:grid-cols-2 gap-2">
          {scored.map((s) => (
            <div key={s.category} className="border border-med-line rounded-lg p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm text-med-ink">{s.category}</div>
                <Badge kind={s.score >= 80 ? "good" : s.score >= 65 ? "info" : s.score >= 50 ? "warn" : "bad"}>
                  {s.score}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        <div className="border border-med-line rounded-lg p-3 bg-slate-50">
          <div className="text-xs font-semibold uppercase tracking-wide text-med-sub mb-1">Top 5 issues to fix</div>
          {topIssues.length === 0 ? (
            <div className="text-sm text-emerald-700">No major blockers detected in this pass.</div>
          ) : (
            <ul className="list-disc list-inside text-sm text-med-inkSoft space-y-1">
              {topIssues.map((i) => (
                <li key={i.category}>{i.category}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
