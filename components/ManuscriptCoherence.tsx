"use client";

import { useMemo } from "react";
import type { ProjectState } from "@/lib/types";
import {
  analyzeCoherence,
  type CoherenceIssue,
  type CoherenceReport,
} from "@/lib/coherence";
import { Card, CardBody, CardHeader } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { InfoHint } from "./ui/InfoHint";

const SEVERITY_LABEL: Record<CoherenceIssue["severity"], string> = {
  high: "High severity",
  medium: "Medium severity",
  low: "Low severity",
};

function scoreKind(score: number): "good" | "info" | "warn" | "bad" {
  if (score >= 85) return "good";
  if (score >= 70) return "info";
  if (score >= 50) return "warn";
  return "bad";
}

function severityKind(sev: CoherenceIssue["severity"]): "bad" | "warn" | "info" {
  return sev === "high" ? "bad" : sev === "medium" ? "warn" : "info";
}

export function ManuscriptCoherence({ project }: { project: ProjectState }) {
  const report: CoherenceReport = useMemo(
    () => analyzeCoherence(project),
    [project],
  );

  const hasContent =
    !!(project.titleFinal || project.titleInputs?.draftTitle) ||
    Object.values(project.sections || {}).some((v) => (v || "").trim().length > 0);

  if (!hasContent) {
    return (
      <Card>
        <CardHeader
          title="Manuscript coherence"
          subtitle="Cross-section consistency engine — treats the whole manuscript as one connected unit."
        />
        <CardBody>
          <div className="border border-amber-200 bg-amber-50 text-amber-800 rounded p-3 text-sm">
            No manuscript content yet — add a title and draft at least one section to
            run the coherence analysis.
          </div>
        </CardBody>
      </Card>
    );
  }

  const grouped: Record<CoherenceIssue["severity"], CoherenceIssue[]> = {
    high: report.issues.filter((i) => i.severity === "high"),
    medium: report.issues.filter((i) => i.severity === "medium"),
    low: report.issues.filter((i) => i.severity === "low"),
  };

  const checkedAt = (() => {
    try {
      return new Date(report.checkedAt).toLocaleString();
    } catch {
      return report.checkedAt;
    }
  })();

  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader
          title={
            <span className="inline-flex items-center gap-2">
              Manuscript coherence
              <InfoHint
                title="What coherence checks"
                text="A strong paper tells one consistent story: the title should match what the paper actually reports, the stated design should support the claims you make, the results should align with what the discussion concludes, and citations should be ordered and used consistently. This engine flags places where those threads conflict so a reader (or reviewer) is not left confused."
              />
            </span>
          }
          subtitle="Deterministic, local cross-section consistency engine — flags conflicts between title, sections, and references. No content leaves your browser."
          right={
            <span className="inline-flex items-center gap-1.5">
              <Badge kind={scoreKind(report.score)}>
                Coherence {report.score}/100
              </Badge>
              <InfoHint
                title="How to read the score"
                text="A single 0–100 summary of internal consistency, computed deterministically from the issues found — higher means fewer/less severe conflicts. It is a self-check to guide revision, not a measure of scientific quality or a predictor of acceptance; resolve the flagged issues rather than chasing the number."
              />
            </span>
          }
        />
        <CardBody className="grid gap-3 text-sm">
          <div
            className={`rounded p-3 border ${
              report.citationOrder.ok
                ? "border-emerald-200 bg-emerald-50"
                : "border-amber-200 bg-amber-50"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wide text-med-sub font-semibold inline-flex items-center gap-1.5">
                Citation order
                <InfoHint
                  title="Why citation order matters"
                  text="Numbered (Vancouver-style) reference systems require in-text citations to appear in ascending order of first mention, with no gaps or duplicates in the reference list. Out-of-order or orphaned citations are a common, easily-avoided reason for revision; this check flags them so the numbering reconciles with the reference list."
                />
              </span>
              <Badge kind={report.citationOrder.ok ? "good" : "warn"}>
                {report.citationOrder.ok ? "OK" : "Needs review"}
              </Badge>
            </div>
            <div className="text-med-ink mt-1">{report.citationOrder.detail}</div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-med-sub">
            <span>
              {report.issues.length === 0
                ? "No coherence issues detected."
                : `${report.issues.length} issue${
                    report.issues.length === 1 ? "" : "s"
                  } found`}
            </span>
            <span>·</span>
            <span>{grouped.high.length} high</span>
            <span>{grouped.medium.length} medium</span>
            <span>{grouped.low.length} low</span>
            <span>·</span>
            <span>Checked {checkedAt}</span>
          </div>
        </CardBody>
      </Card>

      {report.issues.length === 0 ? (
        <Card>
          <CardBody>
            <div className="border border-emerald-200 bg-emerald-50 text-emerald-800 rounded p-3 text-sm">
              No cross-section conflicts detected. The title, sections, and references
              appear mutually consistent.
            </div>
          </CardBody>
        </Card>
      ) : (
        (["high", "medium", "low"] as const).map((sev) =>
          grouped[sev].length === 0 ? null : (
            <Card key={sev}>
              <CardHeader
                title={SEVERITY_LABEL[sev]}
                right={<Badge kind={severityKind(sev)}>{grouped[sev].length}</Badge>}
              />
              <CardBody className="grid gap-3">
                {grouped[sev].map((issue) => (
                  <IssueRow key={issue.id} issue={issue} />
                ))}
              </CardBody>
            </Card>
          ),
        )
      )}
    </div>
  );
}

function IssueRow({ issue }: { issue: CoherenceIssue }) {
  const tone =
    issue.severity === "high"
      ? "border-rose-200 bg-rose-50"
      : issue.severity === "medium"
      ? "border-amber-200 bg-amber-50"
      : "border-sky-200 bg-sky-50";

  return (
    <div className={`border rounded p-3 ${tone}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-med-sub">
          {issue.area}
        </div>
        <Badge kind={severityKind(issue.severity)}>{issue.severity}</Badge>
      </div>
      <div className="text-med-ink mt-1 text-sm font-medium">{issue.message}</div>
      {issue.relatedSections.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {issue.relatedSections.map((s) => (
            <span
              key={s}
              className="text-[10.5px] uppercase tracking-wide text-med-sub border border-med-line rounded px-1.5 py-0.5 bg-white/60"
            >
              {s}
            </span>
          ))}
        </div>
      )}
      <div className="text-med-sub mt-2 text-xs">
        <span className="font-semibold text-med-ink">Fix: </span>
        {issue.fix}
      </div>
    </div>
  );
}
