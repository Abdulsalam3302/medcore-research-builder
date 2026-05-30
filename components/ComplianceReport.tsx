"use client";

import { useMemo, useState } from "react";
import type { ProjectState } from "@/lib/types";
import { buildContextBundle } from "@/lib/agents/contextBundle";
import { Card, CardBody, CardHeader } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { Spinner } from "./ui/Spinner";
import { CopyButton } from "./ui/CopyButton";
import { InfoHint } from "./ui/InfoHint";

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
          title={
            <span className="inline-flex items-center gap-1.5">
              Final Compliance Report
              <InfoHint
                title="What 'compliance' means here"
                text="Compliance is how completely your manuscript meets the reporting standards editors expect: the EQUATOR reporting guideline for your study design (e.g. CONSORT, STROBE, PRISMA) plus ICMJE submission requirements (authorship, conflicts, registration, ethics). This report maps your draft against those checklists so gaps are visible to you before they reach a reviewer."
              />
            </span>
          }
          subtitle="Goes through every section of the project and surfaces missing items, overstatement warnings, and a reference summary."
          right={
            <div className="flex items-center gap-2">
              <InfoHint
                side="left"
                title="Why generate this before submitting"
                text="A pre-submission pass lets you catch missing checklist items, overstated claims, and reference problems while you can still fix them cheaply. It does not replace human or editorial review, and a clean report is not a guarantee of acceptance — it just removes avoidable reasons for rejection."
              />
              <button className="btn-primary" onClick={generate} disabled={busy}>
                {busy && <Spinner />} Generate report
              </button>
            </div>
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
              title={
                <span className="inline-flex items-center gap-1.5">
                  Overview
                  <InfoHint
                    title="Reading the overview"
                    text="These fields summarise the spine of your submission: the study type, the reporting guideline it locks, and whether the manuscript still matches the design you registered. Mismatches here (e.g. a title implying a stronger design than your methods support) are the kind of thing reviewers notice first."
                  />
                </span>
              }
              right={
                report.overallReadiness ? (
                  <div className="flex items-center gap-2">
                    <InfoHint
                      side="left"
                      title="Readiness, not a verdict"
                      text="'Draft' means sections or checks are still incomplete; 'near submission' means most items pass but something still needs your attention; 'submission ready' means no blocker was detected in this pass. It reflects checklist coverage only — final judgement on quality and ethics stays with you and the journal."
                    />
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
                  </div>
                ) : null
              }
            />
            <CardBody className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
              <KV label="Research type" val={report.researchType} />
              <KV
                label="Primary guideline"
                val={
                  <span className="inline-flex items-center gap-1.5">
                    {report.primaryGuideline || "—"}
                    <InfoHint
                      title="Why the guideline matters"
                      text="The EQUATOR reporting guideline tied to your design (CONSORT for trials, STROBE for observational, PRISMA for reviews, etc.) is the checklist editors and reviewers actually grade against. Reporting every required item is one of the cheapest ways to raise the odds your paper survives screening."
                    />
                  </span>
                }
              />
              <KV
                label="Extensions"
                val={
                  <span className="inline-flex items-center gap-1.5">
                    {(report.extensions || []).join(", ") || "—"}
                    <InfoHint
                      title="Guideline extensions"
                      text="Many guidelines have design-specific extensions (e.g. CONSORT for pilot/cluster trials, PRISMA for scoping reviews). Using the right extension means you report the items unique to your study type rather than a generic subset."
                    />
                  </span>
                }
              />
              <KV
                label="Design ↔ manuscript alignment"
                val={
                  <span className="inline-flex items-center gap-1.5">
                  <InfoHint
                    title="Does the write-up match the design?"
                    text="'Aligned' means the manuscript reports the study you actually designed and registered; 'partial' or 'conflict' means the text drifts from it (e.g. claiming a comparison the methods can't support). Reviewers treat design–manuscript conflicts as a serious integrity signal, so resolve these before submission."
                  />
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
                  </span>
                }
              />
              <KV
                label="Title quality"
                val={
                  <span className="inline-flex items-center gap-1.5">
                  <InfoHint
                    title="Why title quality is scored"
                    text="The title is the first thing an editor screens and the line indexers and readers search on. A strong title states population, design, and outcome without overclaiming. 'Low' usually means it's vague, inflated, or mismatched to the methods — all easy fixes that improve discoverability and first impressions."
                  />
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
                  </span>
                }
              />
              <KV
                label="Novelty risk"
                val={
                  <span className="inline-flex items-center gap-1.5">
                  <InfoHint
                    title="Novelty / similarity risk"
                    text="This estimates how much your title and framing overlap with existing literature. High overlap can signal limited new contribution or, at the extreme, self-plagiarism. It's a heuristic prompt to double-check positioning and citations — not a plagiarism verdict."
                  />
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
                  </span>
                }
              />
            </CardBody>
          </Card>

          {report.sectionScores && report.sectionScores.length > 0 && (
            <Card>
              <CardHeader
                title={
                  <span className="inline-flex items-center gap-1.5">
                    Section coverage
                    <InfoHint
                      title="Coverage per section"
                      text="Each section is checked for the guideline items it should carry. 'Missing' items are checklist points a reviewer expects but can't find — addressing them section by section is what turns a draft into a complete, screenable manuscript."
                    />
                  </span>
                }
              />
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
              <CardHeader
                title={
                  <span className="inline-flex items-center gap-1.5">
                    Reference summary (multi-database)
                    <InfoHint
                      title="Why cross-check references"
                      text="Each reference is matched across several scholarly databases and by DOI. Mismatches, duplicates, 'not found', and possible retraction/concern counts flag citations that need your eyes before submission — fabricated or retracted references are a fast route to desk rejection. Counts are screening aids, not proof a citation is correct."
                    />
                  </span>
                }
              />
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
            <WarnCard
              title="Critical issues"
              items={report.criticalIssues}
              kind="bad"
              hint="Critical issues are problems likely to trigger a desk reject or major revision — missing core methods, unsupported primary claims, or absent mandatory declarations. Clear these first."
            />
          )}
          {report.overstatementWarnings && report.overstatementWarnings.length > 0 && (
            <WarnCard
              title="Overstatement / causality warnings"
              items={report.overstatementWarnings}
              kind="warn"
              hint="These flag language that claims more than the design supports — e.g. causal wording ('reduces', 'leads to') for an observational study. Toning claims to match your evidence is core to scientific integrity and a common reviewer complaint."
            />
          )}
          {report.ethicsRegistrationWarnings && report.ethicsRegistrationWarnings.length > 0 && (
            <WarnCard
              title="Ethics / registration warnings"
              items={report.ethicsRegistrationWarnings}
              kind="warn"
              hint="Most journals require an ethics/IRB statement and, for trials and systematic reviews, prospective registration. Missing or late registration can make a study ineligible regardless of quality, so confirm these early — and remember this tool flags gaps but does not perform ethics review."
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

function WarnCard({
  title,
  items,
  kind,
  hint,
}: {
  title: string;
  items: string[];
  kind: "bad" | "warn";
  hint?: string;
}) {
  return (
    <Card>
      <CardHeader
        title={
          hint ? (
            <span className="inline-flex items-center gap-1.5">
              {title}
              <InfoHint title={title} text={hint} />
            </span>
          ) : (
            title
          )
        }
        right={<Badge kind={kind}>{items.length}</Badge>}
      />
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
        title={
          <span className="inline-flex items-center gap-1.5">
            Submission readiness — stoplight
            <InfoHint
              title="How to read the stoplight"
              text="Each row is one concrete submission requirement — guideline picked, title finalised, references verified, ICMJE authorship and conflicts, ethics/registration, word limits. Green is clear, amber needs attention, red is a blocker. Clearing reds removes the items most likely to stall your paper before peer review even begins."
            />
          </span>
        }
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
