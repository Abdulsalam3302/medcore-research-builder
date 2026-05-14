"use client";

import { useState } from "react";
import type { ProjectState } from "@/lib/types";
import { Card, CardBody, CardHeader } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { Spinner } from "./ui/Spinner";
import { CopyButton } from "./ui/CopyButton";

type Report = {
  summary?: string;
  researchType?: string;
  primaryGuideline?: string;
  extensions?: string[];
  titleQualityScore?: "low" | "medium" | "high";
  titleNotes?: string[];
  noveltyRisk?: string;
  sectionScores?: Array<{ section: string; coverage: "low" | "medium" | "high"; missing: string[] }>;
  criticalIssues?: string[];
  overstatementWarnings?: string[];
  ethicsRegistrationWarnings?: string[];
  referenceSummary?: {
    total: number;
    pubmedIndexed: number;
    doiVerified: number;
    mismatches: number;
    duplicates: number;
    notFound: number;
    possibleRetractionOrConcern: number;
  };
  finalRecommendations?: string[];
  _source?: string;
};

export function ComplianceReport({ project }: { project: ProjectState }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);

  async function generate() {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/llm/final-report", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ project }),
      });
      const data = (await r.json()) as Report & { error?: string };
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      setReport(data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader
          title="Final Compliance Report"
          subtitle="Goes through every section of the project and surfaces missing items, overstatement warnings, and a reference summary."
          right={
            <button className="btn-primary" onClick={generate} disabled={busy}>
              {busy && <Spinner />} Generate report
            </button>
          }
        />
        <CardBody>
          {err && <div className="text-sm text-med-bad">{err}</div>}
          {!report && !busy && !err && (
            <div className="muted">
              Click <strong>Generate report</strong> to evaluate your manuscript against the
              selected reporting guideline and verified references.
            </div>
          )}
        </CardBody>
      </Card>

      {report && (
        <>
          {report.summary && (
            <Card>
              <CardHeader
                title="Summary"
                right={
                  <div className="flex items-center gap-2">
                    {report._source === "heuristic" && (
                      <Badge kind="warn">heuristic (no LLM)</Badge>
                    )}
                    <CopyButton text={report.summary} />
                  </div>
                }
              />
              <CardBody>
                <p className="text-sm text-med-ink leading-relaxed">{report.summary}</p>
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader title="Overview" />
            <CardBody className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
              <KV label="Research type" val={report.researchType} />
              <KV label="Primary guideline" val={report.primaryGuideline} />
              <KV label="Extensions" val={(report.extensions || []).join(", ") || "—"} />
              <KV
                label="Title quality"
                val={
                  <Badge
                    kind={
                      report.titleQualityScore === "high"
                        ? "good"
                        : report.titleQualityScore === "medium"
                        ? "info"
                        : "warn"
                    }
                  >
                    {report.titleQualityScore || "—"}
                  </Badge>
                }
              />
              <KV
                label="Novelty risk"
                val={
                  <Badge
                    kind={
                      report.noveltyRisk === "low_duplicate_risk"
                        ? "good"
                        : report.noveltyRisk === "moderate_similarity_risk"
                        ? "warn"
                        : report.noveltyRisk === "exact_or_near_exact_match" ||
                          report.noveltyRisk === "high_duplicate_risk"
                        ? "bad"
                        : "neutral"
                    }
                  >
                    {(report.noveltyRisk || "unknown").replaceAll("_", " ")}
                  </Badge>
                }
              />
            </CardBody>
          </Card>

          {report.sectionScores && report.sectionScores.length > 0 && (
            <Card>
              <CardHeader title="Section coverage" />
              <CardBody className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {report.sectionScores.map((s, i) => (
                  <div key={i} className="border border-med-line rounded-md p-3">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-med-ink capitalize">{s.section}</div>
                      <Badge
                        kind={s.coverage === "high" ? "good" : s.coverage === "medium" ? "info" : "warn"}
                      >
                        {s.coverage}
                      </Badge>
                    </div>
                    {s.missing && s.missing.length > 0 && (
                      <ul className="list-disc list-inside text-xs text-med-sub mt-2 space-y-1">
                        {s.missing.map((m, j) => <li key={j}>{m}</li>)}
                      </ul>
                    )}
                  </div>
                ))}
              </CardBody>
            </Card>
          )}

          {report.referenceSummary && (
            <Card>
              <CardHeader title="Reference summary" />
              <CardBody className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Stat label="Total" value={report.referenceSummary.total} />
                <Stat label="PubMed indexed" value={report.referenceSummary.pubmedIndexed} kind="good" />
                <Stat label="DOI verified" value={report.referenceSummary.doiVerified} kind="info" />
                <Stat label="Mismatches" value={report.referenceSummary.mismatches} kind="warn" />
                <Stat label="Duplicates" value={report.referenceSummary.duplicates} kind="warn" />
                <Stat label="Not found" value={report.referenceSummary.notFound} kind="neutral" />
                <Stat
                  label="Retraction/concern"
                  value={report.referenceSummary.possibleRetractionOrConcern}
                  kind={report.referenceSummary.possibleRetractionOrConcern > 0 ? "bad" : "good"}
                />
              </CardBody>
            </Card>
          )}

          {report.criticalIssues && report.criticalIssues.length > 0 && (
            <WarnCard title="Critical issues" items={report.criticalIssues} kind="bad" />
          )}
          {report.overstatementWarnings && report.overstatementWarnings.length > 0 && (
            <WarnCard title="Overstatement / causality warnings" items={report.overstatementWarnings} kind="warn" />
          )}
          {report.ethicsRegistrationWarnings && report.ethicsRegistrationWarnings.length > 0 && (
            <WarnCard
              title="Ethics / registration warnings"
              items={report.ethicsRegistrationWarnings}
              kind="warn"
            />
          )}
          {report.finalRecommendations && report.finalRecommendations.length > 0 && (
            <Card>
              <CardHeader title="Final recommendations" />
              <CardBody>
                <ul className="list-disc list-inside text-sm text-med-ink space-y-1">
                  {report.finalRecommendations.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </CardBody>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function KV({ label, val }: { label: string; val: React.ReactNode }) {
  return (
    <div>
      <div className="label">{label}</div>
      <div className="text-med-ink">{val || "—"}</div>
    </div>
  );
}

function Stat({
  label,
  value,
  kind = "info",
}: {
  label: string;
  value: number;
  kind?: "good" | "info" | "warn" | "bad" | "neutral";
}) {
  return (
    <div className="border border-med-line rounded-md p-3">
      <div className="text-xs text-med-sub">{label}</div>
      <div className="mt-1 flex items-center justify-between">
        <div className="text-2xl font-semibold text-med-ink">{value}</div>
        <Badge kind={kind}>{label}</Badge>
      </div>
    </div>
  );
}

function WarnCard({ title, items, kind }: { title: string; items: string[]; kind: "bad" | "warn" }) {
  return (
    <Card>
      <CardHeader title={title} right={<Badge kind={kind}>{items.length}</Badge>} />
      <CardBody>
        <ul className={`list-disc list-inside text-sm space-y-1 ${kind === "bad" ? "text-rose-700" : "text-amber-800"}`}>
          {items.map((m, i) => <li key={i}>{m}</li>)}
        </ul>
      </CardBody>
    </Card>
  );
}
