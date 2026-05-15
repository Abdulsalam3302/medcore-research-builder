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
  titleConflictsWithDesign?: string[];
  noveltyRisk?: string;
  sectionScores?: Array<{
    section: string;
    coverage: "low" | "medium" | "high";
    missing: string[];
    checklistCovered?: number;
    checklistTotal?: number;
  }>;
  criticalIssues?: string[];
  overstatementWarnings?: string[];
  ethicsRegistrationWarnings?: string[];
  appendixWarnings?: string[];
  manuscriptDesignAlignment?: "aligned" | "partial" | "conflict" | "unknown";
  alignmentNotes?: string[];
  referenceSummary?: {
    total: number;
    pubmedIndexed: number;
    doiVerified: number;
    openAlex?: number;
    europePMC?: number;
    semanticScholar?: number;
    openAccess?: number;
    preprints?: number;
    mismatches: number;
    duplicates: number;
    notFound: number;
    possibleRetractionOrConcern: number;
  };
  finalRecommendations?: string[];
  overallReadiness?: "draft" | "near_submission" | "submission_ready";
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
        body: JSON.stringify({ project, multiCheck: true }),
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
            <CardHeader
              title="Overview"
              right={
                report.overallReadiness ? (
                  <Badge
                    kind={
                      report.overallReadiness === "submission_ready"
                        ? "good"
                        : report.overallReadiness === "near_submission"
                        ? "info"
                        : "warn"
                    }
                  >
                    {report.overallReadiness.replace("_", " ")}
                  </Badge>
                ) : null
              }
            />
            <CardBody className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
              <KV label="Research type" val={report.researchType} />
              <KV label="Primary guideline" val={report.primaryGuideline} />
              <KV label="Extensions" val={(report.extensions || []).join(", ") || "—"} />
              <KV
                label="Design ↔ manuscript alignment"
                val={
                  <Badge
                    kind={
                      report.manuscriptDesignAlignment === "aligned"
                        ? "good"
                        : report.manuscriptDesignAlignment === "partial"
                        ? "warn"
                        : report.manuscriptDesignAlignment === "conflict"
                        ? "bad"
                        : "neutral"
                    }
                  >
                    {report.manuscriptDesignAlignment || "unknown"}
                  </Badge>
                }
              />
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
              <CardHeader title="Reference summary (multi-database)" />
              <CardBody className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Stat label="Total" value={report.referenceSummary.total} />
                <Stat label="PubMed indexed" value={report.referenceSummary.pubmedIndexed} kind="good" />
                <Stat label="DOI verified" value={report.referenceSummary.doiVerified} kind="info" />
                {typeof report.referenceSummary.openAlex === "number" && (
                  <Stat label="OpenAlex" value={report.referenceSummary.openAlex} kind="info" />
                )}
                {typeof report.referenceSummary.europePMC === "number" && (
                  <Stat label="Europe PMC" value={report.referenceSummary.europePMC} kind="info" />
                )}
                {typeof report.referenceSummary.semanticScholar === "number" && (
                  <Stat label="Semantic Scholar" value={report.referenceSummary.semanticScholar} kind="info" />
                )}
                {typeof report.referenceSummary.openAccess === "number" && (
                  <Stat label="Open access" value={report.referenceSummary.openAccess} kind="good" />
                )}
                {typeof report.referenceSummary.preprints === "number" && (
                  <Stat label="Preprints" value={report.referenceSummary.preprints} kind="warn" />
                )}
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

          {(report.titleConflictsWithDesign && report.titleConflictsWithDesign.length > 0) ||
          (report.alignmentNotes && report.alignmentNotes.length > 0) ? (
            <Card>
              <CardHeader
                title="Pipeline alignment"
                right={
                  <Badge
                    kind={
                      report.manuscriptDesignAlignment === "aligned"
                        ? "good"
                        : report.manuscriptDesignAlignment === "partial"
                        ? "warn"
                        : "bad"
                    }
                  >
                    {report.manuscriptDesignAlignment || "—"}
                  </Badge>
                }
              />
              <CardBody className="grid gap-2 text-sm">
                {report.titleConflictsWithDesign?.map((c, i) => (
                  <div key={i} className="border border-rose-200 bg-rose-50 text-rose-800 rounded p-2">
                    {c}
                  </div>
                ))}
                {report.alignmentNotes?.map((c, i) => (
                  <div key={i} className="border border-amber-200 bg-amber-50 text-amber-800 rounded p-2">
                    {c}
                  </div>
                ))}
              </CardBody>
            </Card>
          ) : null}

          {report.appendixWarnings && report.appendixWarnings.length > 0 && (
            <WarnCard
              title="Appendix / supplementary material"
              items={report.appendixWarnings}
              kind="warn"
            />
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
