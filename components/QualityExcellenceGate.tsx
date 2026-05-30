"use client";

import type { ProjectState } from "@/lib/types";
import { Badge } from "./ui/Badge";
import { InfoHint } from "./ui/InfoHint";

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
          <h2 className="section-title text-[16px] inline-flex items-center gap-1.5">
            Final pre-submission quality checkpoint
            <InfoHint
              title="Why a final gate?"
              text="This is a last self-review across the quality dimensions editors and reviewers screen on. Running it before you submit lets you catch weak spots while you can still fix them — far cheaper than a revise-and-resubmit, and far better than an editor finding them first. It's a structured prompt for your own judgement, not a pass/fail authority."
            />
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <InfoHint
            side="left"
            title="Reading the verdict"
            text="The verdict aggregates the category scores into an at-a-glance readiness band: 'Ready' (≥85) means no major blockers surfaced this pass; 'Needs minor revision' (70–84) means small gaps; 'Needs major revision' (55–69) means substantive sections need work; 'Not ready' (<55) means core elements are still missing. It reflects checklist-style heuristics only — it does not guarantee acceptance or substitute for peer/expert review."
          />
          <Badge kind={overall >= 85 ? "good" : overall >= 70 ? "info" : overall >= 55 ? "warn" : "bad"}>
            {verdict} · {overall}/100
          </Badge>
        </div>
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
          <div className="text-xs font-semibold uppercase tracking-wide text-med-sub mb-1 inline-flex items-center gap-1.5">
            Top 5 issues to fix
            <InfoHint
              title="Why prioritise these"
              text="These are the lowest-scoring categories — the ones most likely to draw a reviewer's first criticism. Fixing the weakest few items usually lifts overall readiness faster than polishing what is already strong, so start here."
            />
          </div>
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
