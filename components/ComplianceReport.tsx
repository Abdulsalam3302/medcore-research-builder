"use client";

import { useMemo, useState } from "react";
import type { ProjectState } from "@/lib/types";
import { buildContextBundle } from "@/lib/agents/contextBundle";
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

export function ComplianceReport({
  project,
  onJump,
}: {
  project: ProjectState;
  onJump?: (k: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const stoplight = useMemo(() => computeSubmissionStoplight(project), [project]);

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

      <SubmissionStoplight items={stoplight} onJump={onJump} />

      {report && (
        <>
          {report.summary && (
            <Card>
              <CardHeader
                title="Summary"
                right={
                  <div className="flex items-center gap-2">
                    {report._source === "heuristic" && (
                      <Badge kind="warn">heuristic (no writing assistant)</Badge>
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
                <Stat label="Primary index coverage" value={report.referenceSummary.pubmedIndexed} kind="good" />
                <Stat label="DOI verified" value={report.referenceSummary.doiVerified} kind="info" />
                {typeof report.referenceSummary.openAlex === "number" && (
                  <Stat label="Source C" value={report.referenceSummary.openAlex} kind="info" />
                )}
                {typeof report.referenceSummary.europePMC === "number" && (
                  <Stat label="Source D" value={report.referenceSummary.europePMC} kind="info" />
                )}
                {typeof report.referenceSummary.semanticScholar === "number" && (
                  <Stat label="Source E" value={report.referenceSummary.semanticScholar} kind="info" />
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

type StoplightItem = {
  label: string;
  status: "go" | "warn" | "stop" | "na";
  detail: string;
  fixTarget?: string;
};

function computeSubmissionStoplight(project: ProjectState): StoplightItem[] {
  const ctx = buildContextBundle(project.researchTypeAnswers || {});
  const launch = project.researchLaunch;
  const req = ctx.journal?.required;
  const items: StoplightItem[] = [];

  const yn = (b: boolean | undefined, ok: string, miss: string): "go" | "stop" =>
    b ? "go" : "stop";

  // 1. Reporting guideline picked
  items.push({
    label: "Reporting guideline selected",
    status: project.researchTypeResult ? "go" : "stop",
    detail: project.researchTypeResult
      ? `Primary: ${project.researchTypeResult.primaryGuidelineName}`
      : "Pick a research type to lock the EQUATOR guideline.",
    fixTarget: "type",
  });

  // 2. Title finalised
  items.push({
    label: "Title finalised",
    status: project.titleFinal
      ? "go"
      : project.titleInputs.draftTitle
      ? "warn"
      : "stop",
    detail: project.titleFinal
      ? project.titleFinal
      : project.titleInputs.draftTitle
      ? "Draft title only — finalise in Title Lab."
      : "No title yet.",
    fixTarget: "title",
  });

  // 3. Novelty risk
  const novRisk = project.noveltyReport?.risk;
  items.push({
    label: "Novelty / similarity risk",
    status:
      !novRisk
        ? "warn"
        : novRisk === "low_duplicate_risk"
        ? "go"
        : novRisk === "moderate_similarity_risk"
        ? "warn"
        : "stop",
    detail: novRisk
      ? `Risk: ${novRisk.replaceAll("_", " ")}.`
      : "Run novelty scan in Title Lab.",
    fixTarget: "title",
  });

  // 4. Sections drafted
  const drafted = (["introduction", "methods", "results", "discussion", "conclusion"] as const).filter(
    (s) => (project.sections[s] || "").length > 60,
  ).length;
  items.push({
    label: "Sections drafted (5)",
    status: drafted === 5 ? "go" : drafted >= 3 ? "warn" : "stop",
    detail: `${drafted}/5 sections have substantive drafts.`,
    fixTarget: "introduction",
  });

  // 5. Reference verification
  const verifs = project.references.verifications;
  const verified = verifs.filter((v) => v.confidence !== "low").length;
  items.push({
    label: "References verified",
    status:
      verifs.length === 0
        ? "stop"
        : verified === verifs.length
        ? "go"
        : "warn",
    detail:
      verifs.length === 0
        ? "No references verified."
        : `${verified}/${verifs.length} confidently verified.`,
    fixTarget: "references",
  });

  // 6. Word limit
  const limit = ctx.journal?.mainTextWordLimit;
  const total = Object.values(project.sections).reduce(
    (n, s) => n + (s || "").trim().split(/\s+/).filter(Boolean).length,
    0,
  );
  if (limit) {
    const pct = (total / limit) * 100;
    items.push({
      label: `Word limit (${ctx.journal?.name || "journal"})`,
      status: pct < 90 ? "go" : pct < 105 ? "warn" : "stop",
      detail: `${total}/${limit} (${Math.round(pct)}%)`,
      fixTarget: "introduction",
    });
  }

  // 7. ICMJE authorship + COI
  if (launch) {
    items.push({
      label: "ICMJE authorship reviewed",
      status: launch.icmjeReviewed ? "go" : "stop",
      detail: launch.icmjeReviewed
        ? "Team has reviewed ICMJE authorship criteria."
        : "Confirm in Research Launch.",
      fixTarget: "launch",
    });
    items.push({
      label: "COI disclosed (all authors)",
      status: launch.coiDisclosed ? "go" : "stop",
      detail: launch.coiDisclosed ? "Yes." : "Collect COI for every author.",
      fixTarget: "launch",
    });
  }

  // 8. Journal-required items
  if (req) {
    if (req.dataSharingStatement) {
      items.push({
        label: "Data-sharing statement",
        status: launch?.dataSharingPlanned ? "go" : "stop",
        detail: launch?.dataSharingPlanned
          ? "Planned."
          : `Required by ${ctx.journal?.name || "this journal"}.`,
        fixTarget: "launch",
      });
    }
    if (req.aiDisclosure) {
      items.push({
        label: "AI-use disclosure (ICMJE 2026)",
        status: launch?.aiUsePolicyReviewed ? "go" : "warn",
        detail: launch?.aiUsePolicyReviewed
          ? "Policy reviewed."
          : "Disclose any AI assistance in acknowledgements.",
        fixTarget: "launch",
      });
    }
    if (req.registrationStatement) {
      const ok =
        launch?.registrationStatus === "registered" ||
        launch?.registrationStatus === "not-required";
      items.push({
        label: "Registration statement",
        status: ok ? "go" : "stop",
        detail: ok
          ? `Status: ${launch?.registrationStatus}.`
          : "Required for trials / SR by most journals.",
        fixTarget: "launch",
      });
    }
    if (req.ethicsStatement) {
      const ok =
        launch?.irbStatus === "approved" ||
        launch?.irbStatus === "not-required";
      items.push({
        label: "Ethics / IRB",
        status: ok ? "go" : "stop",
        detail: ok ? `Status: ${launch?.irbStatus}.` : "IRB approval not in place.",
        fixTarget: "launch",
      });
    }
    if (req.fundingStatement) {
      items.push({
        label: "Funding statement",
        status: launch?.fundingSecured ? "go" : "warn",
        detail: launch?.fundingSecured
          ? `Funding ${launch.fundingSecured}.`
          : "Disclose funding (or 'none').",
        fixTarget: "launch",
      });
    }
  }

  void yn;
  return items;
}

function SubmissionStoplight({
  items,
  onJump,
}: {
  items: StoplightItem[];
  onJump?: (k: string) => void;
}) {
  const go = items.filter((i) => i.status === "go").length;
  const warn = items.filter((i) => i.status === "warn").length;
  const stop = items.filter((i) => i.status === "stop").length;
  return (
    <Card>
      <CardHeader
        title="Submission readiness — stoplight"
        subtitle="One row per required item. Tap a red item to fix it."
        right={
          <div className="flex items-center gap-2">
            <Badge kind="good">{go} go</Badge>
            <Badge kind="warn">{warn} warn</Badge>
            <Badge kind="bad">{stop} stop</Badge>
          </div>
        }
      />
      <CardBody>
        <ul className="grid sm:grid-cols-2 gap-2">
          {items.map((it, i) => (
            <li
              key={i}
              className={`flex items-start gap-2.5 rounded-lg border p-2.5 ${
                it.status === "go"
                  ? "border-emerald-200 bg-emerald-50/40"
                  : it.status === "warn"
                  ? "border-amber-200 bg-amber-50/40"
                  : it.status === "stop"
                  ? "border-rose-200 bg-rose-50/40"
                  : "border-med-line bg-white"
              }`}
            >
              <span
                className={`mt-1 inline-block h-2.5 w-2.5 rounded-full shrink-0 ${
                  it.status === "go"
                    ? "bg-emerald-500"
                    : it.status === "warn"
                    ? "bg-amber-400"
                    : it.status === "stop"
                    ? "bg-rose-500"
                    : "bg-slate-300"
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-med-ink text-[13px]">{it.label}</div>
                <div className="text-[12px] text-med-sub leading-snug">{it.detail}</div>
                {it.fixTarget && it.status !== "go" && onJump ? (
                  <button
                    className="text-[11px] text-med-brand hover:underline mt-1"
                    onClick={() => onJump(it.fixTarget!)}
                  >
                    Fix →
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
