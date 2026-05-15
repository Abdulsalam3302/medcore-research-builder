"use client";

import { useMemo, useState } from "react";
import type { LLMRefineResponse, ProjectState } from "@/lib/types";
import { guidelineById } from "@/lib/guidelines";
import { Card, CardBody, CardHeader } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { Spinner } from "./ui/Spinner";
import { CopyButton } from "./ui/CopyButton";

const SECTION_HELP: Record<string, { title: string; placeholder: string; help: string }> = {
  introduction: {
    title: "Introduction Builder",
    placeholder:
      "Paste your draft introduction or bullet notes: problem importance, current evidence, knowledge gap, rationale, aim/hypothesis…",
    help:
      "Structure suggested: (1) problem importance · (2) current evidence · (3) knowledge gap · (4) rationale · (5) aim/objective/hypothesis.",
  },
  methods: {
    title: "Methods Builder",
    placeholder:
      "Describe study design, setting, dates, participants, eligibility, intervention/exposure, outcomes, statistical methods, ethics, registration, data availability…",
    help:
      "Reporting-guideline-driven. Missing items will be flagged, not invented.",
  },
  results: {
    title: "Results Builder",
    placeholder:
      "Paste participant flow, baseline characteristics, outcomes with numbers (n, %, mean ± SD, 95% CI, p), harms, missing data…",
    help:
      "Strict rule: numbers, p-values, CIs, sample sizes will NEVER be invented. Missing numbers are listed as 'needs author input'.",
  },
  discussion: {
    title: "Discussion Builder",
    placeholder:
      "Outline principal findings, comparison with literature, strengths, limitations, interpretation, implications, future research…",
    help:
      "Structure: (1) principal findings · (2) comparison with literature · (3) strengths · (4) limitations · (5) interpretation · (6) future research · (7) balanced conclusion.",
  },
  conclusion: {
    title: "Conclusion Builder",
    placeholder:
      "A short, evidence-aligned closing paragraph. No new data, no overstatement.",
    help:
      "We will warn if the conclusion overstates causality or claims novelty beyond what the data / novelty report supports.",
  },
};

export function SectionBuilder({
  section,
  project,
  update,
}: {
  section: "introduction" | "methods" | "results" | "discussion" | "conclusion";
  project: ProjectState;
  update: (fn: (p: ProjectState) => ProjectState) => void;
}) {
  const meta = SECTION_HELP[section];
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [contextNotes, setContextNotes] = useState("");

  const guidelineId = project.researchTypeResult?.primaryGuidelineId || "";
  const v1Guideline = useMemo(
    () => (guidelineId ? guidelineById(guidelineId) : undefined),
    [guidelineId]
  );
  // Prefer the merged v2 checklist from researchTypeResult when available.
  const checklist =
    (project.researchTypeResult?.sectionChecklists?.[section] as string[] | undefined) ||
    (v1Guideline?.checklistPrompts[section] as string[] | undefined) ||
    [];
  const guidelineDisplayName =
    project.researchTypeResult?.primaryGuidelineName || v1Guideline?.name || "";
  const guidelineAcronym = (guidelineDisplayName.match(/^[A-Z][A-Z0-9+\- ]+/)?.[0] || "Guideline").trim();

  async function refine() {
    if (!guidelineId) {
      setErr("Select a research type / guideline first.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/llm/refine-section", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          section,
          guidelineId,
          draft: project.sections[section] || "",
          contextNotes: contextNotes || undefined,
          answers: project.researchTypeAnswers,
        }),
      });
      const data = (await r.json()) as LLMRefineResponse & { error?: string };
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      update((p) => ({
        ...p,
        sectionFeedback: { ...p.sectionFeedback, [section]: data },
      }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  function applyRefined() {
    const fb = project.sectionFeedback[section];
    if (!fb) return;
    update((p) => ({
      ...p,
      sections: { ...p.sections, [section]: fb.refinedText },
    }));
  }

  const feedback = project.sectionFeedback[section];

  return (
    <div className="grid lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 grid gap-5">
        <Card>
          <CardHeader
            title={meta.title}
            subtitle={meta.help}
            right={
              guidelineId ? (
                <Badge kind="info">{guidelineAcronym}</Badge>
              ) : (
                <Badge kind="warn">Select guideline first</Badge>
              )
            }
          />
          <CardBody className="grid gap-3">
            <label className="label">Draft</label>
            <textarea
              className="textarea min-h-[260px]"
              placeholder={meta.placeholder}
              value={project.sections[section] || ""}
              onChange={(e) =>
                update((p) => ({
                  ...p,
                  sections: { ...p.sections, [section]: e.target.value },
                }))
              }
            />
            <label className="label">Notes for the assistant (optional)</label>
            <textarea
              className="textarea min-h-[80px]"
              placeholder="Anything that's not in the draft but the assistant should know."
              value={contextNotes}
              onChange={(e) => setContextNotes(e.target.value)}
            />
            <div className="flex items-center gap-2 flex-wrap">
              <button className="btn-primary" onClick={refine} disabled={busy || !guidelineId}>
                {busy && <Spinner />} Refine scientifically
              </button>
              <CopyButton text={project.sections[section] || ""} label="Copy draft" />
            </div>
            {err && <div className="text-sm text-med-bad">{err}</div>}
          </CardBody>
        </Card>

        {feedback && (
          <Card>
            <CardHeader
              title="Refined draft"
              right={
                <div className="flex items-center gap-2">
                  <Badge
                    kind={
                      feedback.confidence === "high"
                        ? "good"
                        : feedback.confidence === "medium"
                        ? "info"
                        : "warn"
                    }
                  >
                    confidence: {feedback.confidence}
                  </Badge>
                  <CopyButton text={feedback.refinedText} label="Copy refined" />
                  <button className="btn-primary" onClick={applyRefined}>
                    Use as my draft
                  </button>
                </div>
              }
            />
            <CardBody>
              <div className="prose-output text-sm">{feedback.refinedText}</div>
            </CardBody>
          </Card>
        )}
      </div>

      <div className="grid gap-5">
        <Card>
          <CardHeader
            title="Checklist"
            subtitle={
              guidelineId
                ? `${guidelineDisplayName} — ${section}`
                : "Pick a research type to see the checklist."
            }
          />
          <CardBody>
            {checklist.length === 0 ? (
              <div className="muted">No checklist items for this section in the selected guideline.</div>
            ) : (
              <ul className="grid gap-2 text-sm">
                {checklist.map((c, i) => {
                  const cov = feedback?.checklistCoverage.find((x) => x.item === c) ||
                    feedback?.checklistCoverage[i];
                  const kind: "good" | "warn" | "bad" | "neutral" =
                    cov?.status === "covered"
                      ? "good"
                      : cov?.status === "partial"
                      ? "warn"
                      : cov?.status === "missing"
                      ? "bad"
                      : "neutral";
                  return (
                    <li key={i} className="border border-med-line rounded-md p-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-med-ink">{c}</span>
                        <Badge kind={kind}>{cov?.status || "—"}</Badge>
                      </div>
                      {cov?.comment && (
                        <div className="text-xs text-med-sub mt-1">{cov.comment}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>

        {feedback && (
          <>
            {feedback.missingInformation.length > 0 && (
              <Card>
                <CardHeader
                  title="Needs author input"
                  right={<Badge kind="warn">{feedback.missingInformation.length}</Badge>}
                />
                <CardBody>
                  <ul className="list-disc list-inside text-sm text-med-sub space-y-1">
                    {feedback.missingInformation.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
            )}
            {feedback.riskWarnings.length > 0 && (
              <Card>
                <CardHeader title="Risk warnings" right={<Badge kind="bad">{feedback.riskWarnings.length}</Badge>} />
                <CardBody>
                  <ul className="list-disc list-inside text-sm text-rose-700 space-y-1">
                    {feedback.riskWarnings.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
            )}
            {feedback.claimsNeedingCitation.length > 0 && (
              <Card>
                <CardHeader title="Claims needing citation" />
                <CardBody>
                  <ul className="list-disc list-inside text-sm text-med-sub space-y-1">
                    {feedback.claimsNeedingCitation.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
            )}
            {feedback.suggestedSearchQueries.length > 0 && (
              <Card>
                <CardHeader title="Suggested search queries" />
                <CardBody>
                  <ul className="text-sm text-med-sub grid gap-2">
                    {feedback.suggestedSearchQueries.map((q, i) => (
                      <li key={i} className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs">{q}</span>
                        <a
                          className="text-med-brand hover:underline text-xs"
                          target="_blank"
                          rel="noopener noreferrer"
                          href={`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(q)}`}
                        >
                          PubMed →
                        </a>
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
