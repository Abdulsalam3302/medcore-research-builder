"use client";

import { useMemo } from "react";
import type { ProjectState } from "@/lib/types";
import {
  assessReferenceSafety,
  type ReferenceSafetyFlag,
  type ReferenceFlagSeverity,
} from "@/lib/references/safety";
import { Card, CardBody, CardHeader } from "./ui/Card";
import { Badge } from "./ui/Badge";

const KIND_LABEL: Record<ReferenceSafetyFlag["kind"], string> = {
  unverified: "Unverified",
  "low-confidence-match": "Low-confidence match",
  "metadata-mismatch": "Metadata mismatch",
  "possibly-irrelevant": "Possibly irrelevant",
  retracted: "Retraction / concern",
  duplicate: "Duplicate",
  "predatory-risk": "Predatory / provenance risk",
  "uncited-in-text": "Not cited in text",
  "cited-not-in-list": "Cited but not in list",
};

const SEVERITY_ORDER: ReferenceFlagSeverity[] = ["critical", "warning", "info"];

const SEVERITY_META: Record<
  ReferenceFlagSeverity,
  { label: string; badge: "bad" | "warn" | "info" }
> = {
  critical: { label: "Critical", badge: "bad" },
  warning: { label: "Warning", badge: "warn" },
  info: { label: "Advisory", badge: "info" },
};

function scoreBadgeKind(score: number): "good" | "warn" | "bad" {
  if (score >= 80) return "good";
  if (score >= 50) return "warn";
  return "bad";
}

export function ReferenceSafetyPanel({ project }: { project: ProjectState }) {
  const verifications = project.references?.verifications || [];

  const sectionsText = useMemo(() => {
    const s = project.sections || ({} as ProjectState["sections"]);
    return [
      project.titleFinal || "",
      s.introduction || "",
      s.methods || "",
      s.results || "",
      s.discussion || "",
      s.conclusion || "",
    ]
      .filter(Boolean)
      .join("\n\n");
  }, [project.sections, project.titleFinal]);

  const assessment = useMemo(
    () => assessReferenceSafety(verifications, sectionsText),
    [verifications, sectionsText]
  );

  const grouped = useMemo(() => {
    const g: Record<ReferenceFlagSeverity, ReferenceSafetyFlag[]> = {
      critical: [],
      warning: [],
      info: [],
    };
    for (const f of assessment.flags) g[f.severity].push(f);
    return g;
  }, [assessment.flags]);

  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader
          title="Reference Safety Layer"
          subtitle="Deterministic anti-hallucination triage over your verified references. It surfaces what to human-check — it never asserts a citation is correct."
          right={
            <Badge kind={scoreBadgeKind(assessment.score)}>
              Safety score: {assessment.score}/100
            </Badge>
          }
        />
        <CardBody className="grid gap-3">
          <div
            role="note"
            className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm text-amber-900"
          >
            <strong>Every citation must be human-verified.</strong> AI parsing and
            automated source-matching can mis-match or hallucinate references. A high
            score is <em>not</em> a guarantee of correctness — confirm each reference
            against the original article before submission.
          </div>

          <p className="text-sm text-med-sub">{assessment.summary}</p>

          {verifications.length === 0 && (
            <p className="text-xs text-med-sub">
              Run the Reference Verifier first to populate this panel.
            </p>
          )}
        </CardBody>
      </Card>

      {assessment.flags.length > 0 && (
        <Card>
          <CardHeader
            title="Flags for human review"
            subtitle={`${assessment.flags.length} item(s) grouped by severity. Resolve critical flags before submission.`}
            right={
              <div className="flex flex-wrap gap-1.5">
                {SEVERITY_ORDER.map((sev) =>
                  grouped[sev].length ? (
                    <Badge key={sev} kind={SEVERITY_META[sev].badge}>
                      {SEVERITY_META[sev].label}: {grouped[sev].length}
                    </Badge>
                  ) : null
                )}
              </div>
            }
          />
          <CardBody className="grid gap-4">
            {SEVERITY_ORDER.map((sev) =>
              grouped[sev].length ? (
                <div key={sev} className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <Badge kind={SEVERITY_META[sev].badge}>
                      {SEVERITY_META[sev].label}
                    </Badge>
                    <span className="text-xs text-med-sub">
                      {grouped[sev].length} item(s)
                    </span>
                  </div>
                  <ul className="grid gap-2">
                    {grouped[sev].map((f, i) => (
                      <li
                        key={`${sev}-${i}`}
                        className="border border-med-line rounded-lg p-3 bg-white"
                      >
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <Badge kind="neutral">
                            {f.refIndex >= 0
                              ? `Reference ${f.refIndex + 1}`
                              : "Reference list"}
                          </Badge>
                          <Badge kind={SEVERITY_META[f.severity].badge}>
                            {KIND_LABEL[f.kind]}
                          </Badge>
                        </div>
                        <p className="text-sm text-med-ink">{f.message}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
