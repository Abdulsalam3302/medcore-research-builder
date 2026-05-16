"use client";

import { useMemo, useState } from "react";
import type { LLMRefineResponse, ProjectState } from "@/lib/types";
import { guidelineById } from "@/lib/guidelines";
import { buildContextBundle } from "@/lib/agents/contextBundle";
import { diffStrings, applyResolutions, changeCount, wordCount } from "@/lib/textDiff";
import { Card, CardBody, CardHeader } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { Spinner } from "./ui/Spinner";
import { SkeletonLines } from "./ui/Skeleton";
import { CopyButton } from "./ui/CopyButton";
import { StatsAndFigures } from "./StatsAndFigures";

const SECTION_HELP: Record<
  string,
  { title: string; placeholder: string; help: string }
> = {
  introduction: {
    title: "Introduction Builder",
    placeholder:
      "Paste your draft introduction or bullet notes: problem importance, current evidence, knowledge gap, rationale, aim/hypothesis…",
    help: "Structure suggested: (1) problem importance · (2) current evidence · (3) knowledge gap · (4) rationale · (5) aim/objective/hypothesis.",
  },
  methods: {
    title: "Methods Builder",
    placeholder:
      "Describe study design, setting, dates, participants, eligibility, intervention/exposure, outcomes, statistical methods, ethics, registration, data availability…",
    help: "Reporting-guideline-driven. Missing items will be flagged, not invented.",
  },
  results: {
    title: "Results Builder",
    placeholder:
      "Paste participant flow, baseline characteristics, outcomes with numbers (n, %, mean ± SD, 95% CI, p), harms, missing data…",
    help: "Strict rule: numbers, p-values, CIs, sample sizes will NEVER be invented. Missing numbers are listed as 'needs author input'.",
  },
  discussion: {
    title: "Discussion Builder",
    placeholder:
      "Outline principal findings, comparison with literature, strengths, limitations, interpretation, implications, future research…",
    help: "Structure: (1) principal findings · (2) comparison with literature · (3) strengths · (4) limitations · (5) interpretation · (6) future research · (7) balanced conclusion.",
  },
  conclusion: {
    title: "Conclusion Builder",
    placeholder:
      "A short, evidence-aligned closing paragraph. No new data, no overstatement.",
    help: "We will warn if the conclusion overstates causality or claims novelty beyond what the data / novelty report supports.",
  },
};

type ItemHelpResp = {
  canDraft: boolean;
  draftAddition: string;
  questionsForAuthor: string[];
  rationale: string;
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
  const [busy, setBusy] = useState<
    null | "refine" | "generate" | "enhance" | "complete"
  >(null);
  const ctx = useMemo(
    () => buildContextBundle(project.researchTypeAnswers || {}),
    [project.researchTypeAnswers],
  );
  const journalLimit = ctx.journal?.mainTextWordLimit;
  const sectionWords = useMemo(
    () => wordCount(project.sections[section] || ""),
    [project.sections, section],
  );
  const totalWords = useMemo(
    () =>
      Object.values(project.sections).reduce(
        (sum, s) => sum + wordCount(s || ""),
        0,
      ),
    [project.sections],
  );
  // Per-section soft budget (rough): intro 15%, methods 25%, results 30%, discussion 25%, conclusion 5%.
  const sectionBudgetPct: Record<typeof section, number> = {
    introduction: 0.15,
    methods: 0.25,
    results: 0.3,
    discussion: 0.25,
    conclusion: 0.05,
  };
  const sectionBudget = journalLimit
    ? Math.round(journalLimit * sectionBudgetPct[section])
    : null;
  const [completingIndex, setCompletingIndex] = useState<number | null>(null);
  const [completeResp, setCompleteResp] = useState<Record<
    number,
    ItemHelpResp
  > | null>(null);
  const [completeAnswers, setCompleteAnswers] = useState<
    Record<string, string>
  >({});
  const [err, setErr] = useState<string | null>(null);
  const [contextNotes, setContextNotes] = useState("");

  const guidelineId = project.researchTypeResult?.primaryGuidelineId || "";
  const v1Guideline = useMemo(
    () => (guidelineId ? guidelineById(guidelineId) : undefined),
    [guidelineId]
  );
  const checklist =
    (project.researchTypeResult?.sectionChecklists?.[section] as
      | string[]
      | undefined) ||
    (v1Guideline?.checklistPrompts[section] as string[] | undefined) ||
    [];
  const guidelineDisplayName =
    project.researchTypeResult?.primaryGuidelineName || v1Guideline?.name || "";
  const guidelineAcronym = (
    guidelineDisplayName.match(/^[A-Z][A-Z0-9+\- ]+/)?.[0] || "Guideline"
  ).trim();

  async function refine() {
    if (!guidelineId) {
      setErr("Select a research type / guideline first.");
      return;
    }
    setBusy("refine");
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
      setBusy(null);
    }
  }

  async function aiGenerate() {
    if (!guidelineId) {
      setErr("Select a research type / guideline first.");
      return;
    }
    setBusy("generate");
    setErr(null);
    try {
      const r = await fetch("/api/llm/generate-section", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          section,
          guidelineId,
          answers: project.researchTypeAnswers,
          project,
          contextNotes: contextNotes || undefined,
        }),
      });
      const data = (await r.json()) as LLMRefineResponse & { error?: string };
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      update((p) => ({
        ...p,
        sections: { ...p.sections, [section]: data.refinedText || p.sections[section] },
        sectionFeedback: { ...p.sectionFeedback, [section]: data },
      }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  async function aiEnhanceDraft() {
    setBusy("enhance");
    setErr(null);
    try {
      const r = await fetch("/api/llm/enhance", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          field: `${section} draft`,
          value: project.sections[section] || "",
          answers: project.researchTypeAnswers,
          hint: `Polish/expand the ${section} section in journal-appropriate scientific English. Do NOT invent numbers, citations, or facts. Preserve every fact already present. Match the chosen reporting guideline structure.`,
        }),
      });
      const data = (await r.json()) as {
        value?: string;
        note?: string;
        error?: string;
      };
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      if (data.value) {
        update((p) => ({
          ...p,
          sections: { ...p.sections, [section]: data.value! },
        }));
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
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

  async function completeItem(index: number, item: string) {
    if (!guidelineId) {
      setErr("Select a research type / guideline first.");
      return;
    }
    setBusy("complete");
    setCompletingIndex(index);
    setErr(null);
    try {
      const r = await fetch("/api/llm/complete-checklist-item", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          item,
          section,
          currentDraft: project.sections[section] || "",
          answers: project.researchTypeAnswers,
        }),
      });
      const data = (await r.json()) as ItemHelpResp & { error?: string };
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      setCompleteResp((prev) => ({ ...(prev || {}), [index]: data }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
      setCompletingIndex(null);
    }
  }

  function applyCompletion(index: number) {
    const c = completeResp?.[index];
    if (!c?.canDraft || !c.draftAddition) return;
    update((p) => ({
      ...p,
      sections: {
        ...p.sections,
        [section]: (p.sections[section] || "") + "\n\n" + c.draftAddition,
      },
    }));
    setCompleteResp((prev) => {
      const next = { ...(prev || {}) };
      delete next[index];
      return next;
    });
  }

  function appendQuestionAnswer(index: number, q: string) {
    const answer = completeAnswers[`${index}::${q}`];
    if (!answer?.trim()) return;
    const cur =
      project.researchTypeAnswers?.notes || "";
    update((p) => ({
      ...p,
      researchTypeAnswers: {
        ...p.researchTypeAnswers,
        notes: cur ? `${cur}\n${q} → ${answer}` : `${q} → ${answer}`,
      },
    }));
    setCompleteAnswers((prev) => {
      const next = { ...prev };
      delete next[`${index}::${q}`];
      return next;
    });
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
            <div className="flex items-center justify-between">
              <label className="label">Draft</label>
              <WordBudgetBadge
                section={sectionWords}
                sectionBudget={sectionBudget}
                total={totalWords}
                journalLimit={journalLimit}
                journalName={ctx.journal?.name}
              />
            </div>
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
              <button
                className="btn-primary"
                onClick={aiGenerate}
                disabled={busy !== null || !guidelineId}
                title="Generate a first draft from the pipeline context (no fabrication)."
              >
                {busy === "generate" && <Spinner />} 🤖 AI generate
              </button>
              <button
                className="btn-secondary"
                onClick={refine}
                disabled={busy !== null || !guidelineId}
                title="Run the draft through the reporting-guideline checklist with deep scientific scrutiny."
              >
                {busy === "refine" && <Spinner dark />} Refine scientifically
              </button>
              <button
                className="btn-secondary"
                onClick={aiEnhanceDraft}
                disabled={busy !== null || !project.sections[section]}
                title="Polish wording without changing the meaning or inventing facts."
              >
                {busy === "enhance" && <Spinner dark />} ✨ AI enhance
              </button>
              <CopyButton text={project.sections[section] || ""} label="Copy draft" />
            </div>
            {err && <div className="text-sm text-med-bad">{err}</div>}
          </CardBody>
        </Card>

        {section === "results" && (
          <Card>
            <CardHeader
              title="Statistical analysis & figure specs"
              subtitle="Lives under Results so the suggested tests & figure types are aware of your study design and outcome."
              right={
                <Badge kind="info">
                  {project.researchTypeAnswers?.designId
                    ? project.researchTypeAnswers.designId
                    : "design-aware"}
                </Badge>
              }
            />
            <CardBody>
              <StatsAndFigures
                designId={project.researchTypeAnswers?.designId}
                manuscriptType={project.researchTypeAnswers?.manuscriptType}
                expandedNotes={project.researchTypeAnswers?.expandedNotes}
                embedded
              />
            </CardBody>
          </Card>
        )}

        {feedback && (
          <RefinementDiffCard
            original={project.sections[section] || ""}
            refined={feedback.refinedText}
            confidence={feedback.confidence}
            onApply={(text) =>
              update((p) => ({
                ...p,
                sections: { ...p.sections, [section]: text },
              }))
            }
          />
        )}
        {busy === "refine" || busy === "generate" || busy === "enhance" ? (
          <Card>
            <CardHeader title="Working — keeping it honest…" />
            <CardBody>
              <SkeletonLines rows={5} />
              <div className="text-[11.5px] text-med-sub mt-3">
                Calls to PubMed/Crossref + the LLM can take 5–10s. We never invent numbers, citations, or claims while we wait.
              </div>
            </CardBody>
          </Card>
        ) : null}
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
              <div className="muted">
                No checklist items for this section in the selected guideline.
              </div>
            ) : (
              <ul className="grid gap-2 text-sm">
                {checklist.map((c, i) => {
                  const cov =
                    feedback?.checklistCoverage.find((x) => x.item === c) ||
                    feedback?.checklistCoverage[i];
                  const kind: "good" | "warn" | "bad" | "neutral" =
                    cov?.status === "covered"
                      ? "good"
                      : cov?.status === "partial"
                      ? "warn"
                      : cov?.status === "missing"
                      ? "bad"
                      : "neutral";
                  const helpResp = completeResp?.[i];
                  const showButton =
                    cov?.status === "missing" || cov?.status === "partial";
                  return (
                    <li
                      key={i}
                      className="border border-med-line rounded-md p-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-med-ink">{c}</span>
                        <Badge kind={kind}>{cov?.status || "—"}</Badge>
                      </div>
                      {cov?.comment && (
                        <div className="text-xs text-med-sub mt-1">
                          {cov.comment}
                        </div>
                      )}
                      {showButton && (
                        <button
                          className="btn-secondary text-xs mt-2"
                          onClick={() => completeItem(i, c)}
                          disabled={busy !== null}
                          title="Ask the assistant to help close this gap — never fabricates."
                        >
                          {busy === "complete" && completingIndex === i ? (
                            <Spinner dark />
                          ) : (
                            <>🔧 Complete this item</>
                          )}
                        </button>
                      )}
                      {helpResp && (
                        <div className="mt-2 border border-med-line rounded p-2 bg-slate-50 text-xs">
                          <div className="text-med-sub italic">
                            {helpResp.rationale}
                          </div>
                          {helpResp.canDraft && helpResp.draftAddition && (
                            <>
                              <div className="label mt-2">Proposed addition</div>
                              <div className="bg-white border border-med-line rounded p-2 text-med-ink whitespace-pre-wrap">
                                {helpResp.draftAddition}
                              </div>
                              <div className="flex gap-2 mt-2">
                                <button
                                  className="btn-primary text-xs"
                                  onClick={() => applyCompletion(i)}
                                >
                                  Append to draft
                                </button>
                                <CopyButton
                                  text={helpResp.draftAddition}
                                  label="Copy"
                                />
                              </div>
                            </>
                          )}
                          {!helpResp.canDraft &&
                            helpResp.questionsForAuthor.length > 0 && (
                              <>
                                <div className="label mt-2 text-rose-700">
                                  Information needed (no hallucination — please
                                  answer)
                                </div>
                                <ul className="grid gap-2 mt-1">
                                  {helpResp.questionsForAuthor.map((q, j) => {
                                    const k = `${i}::${q}`;
                                    return (
                                      <li
                                        key={j}
                                        className="border border-med-line rounded p-2 bg-white"
                                      >
                                        <div className="text-med-ink">
                                          {q}
                                        </div>
                                        <div className="flex gap-2 mt-2">
                                          <input
                                            className="input text-xs"
                                            placeholder="Your answer"
                                            value={completeAnswers[k] || ""}
                                            onChange={(e) =>
                                              setCompleteAnswers((prev) => ({
                                                ...prev,
                                                [k]: e.target.value,
                                              }))
                                            }
                                          />
                                          <button
                                            className="btn-secondary text-xs"
                                            disabled={
                                              !completeAnswers[k]?.trim()
                                            }
                                            onClick={() =>
                                              appendQuestionAnswer(i, q)
                                            }
                                          >
                                            Save
                                          </button>
                                        </div>
                                      </li>
                                    );
                                  })}
                                </ul>
                                <div className="text-[11px] text-med-sub mt-2">
                                  Your answers are stored in the research-type notes so
                                  every later step sees them.
                                </div>
                              </>
                            )}
                        </div>
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
                  right={
                    <Badge kind="warn">
                      {feedback.missingInformation.length}
                    </Badge>
                  }
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
                <CardHeader
                  title="Risk warnings"
                  right={<Badge kind="bad">{feedback.riskWarnings.length}</Badge>}
                />
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
                      <li
                        key={i}
                        className="flex items-center justify-between gap-2"
                      >
                        <span className="font-mono text-xs">{q}</span>
                        <a
                          className="text-med-brand hover:underline text-xs"
                          target="_blank"
                          rel="noopener noreferrer"
                          href={`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(
                            q
                          )}`}
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

function WordBudgetBadge({
  section,
  sectionBudget,
  total,
  journalLimit,
  journalName,
}: {
  section: number;
  sectionBudget: number | null;
  total: number;
  journalLimit?: number;
  journalName?: string;
}) {
  if (!journalLimit) {
    return (
      <span className="text-[11.5px] text-med-sub tabular-nums">
        {section} words · {total} total
      </span>
    );
  }
  const pct = Math.round((total / journalLimit) * 100);
  const tone =
    pct < 75 ? "good" : pct < 100 ? "warn" : "bad";
  const sectionPct = sectionBudget
    ? Math.round((section / sectionBudget) * 100)
    : 0;
  const sectionTone =
    sectionBudget == null
      ? null
      : sectionPct < 90
      ? "good"
      : sectionPct <= 110
      ? "warn"
      : "bad";
  return (
    <div
      className="flex items-center gap-1.5 text-[11.5px]"
      title={`${journalName || "Journal"} main-text limit ≈ ${journalLimit} words`}
    >
      {sectionBudget ? (
        <Badge kind={sectionTone || "neutral"}>
          section {section}/{sectionBudget}
        </Badge>
      ) : null}
      <Badge kind={tone}>
        total {total}/{journalLimit} ({pct}%)
      </Badge>
    </div>
  );
}

function RefinementDiffCard({
  original,
  refined,
  confidence,
  onApply,
}: {
  original: string;
  refined: string;
  confidence: "high" | "medium" | "low";
  onApply: (text: string) => void;
}) {
  const hunks = useMemo(() => diffStrings(original, refined), [original, refined]);
  const total = changeCount(hunks);
  // Default to accept all changes.
  const [accept, setAccept] = useState<boolean[]>(() =>
    hunks.map((h) => h.op === "change"),
  );
  // Reset when hunks change (new refinement run).
  useMemo(() => {
    setAccept(hunks.map((h) => h.op === "change"));
  }, [hunks]);

  const previewText = useMemo(() => applyResolutions(hunks, accept), [hunks, accept]);
  const acceptedCount = accept.reduce(
    (n, v, i) => (hunks[i].op === "change" && v ? n + 1 : n),
    0,
  );

  return (
    <Card>
      <CardHeader
        title="Refinement diff"
        subtitle={`${total} change${total === 1 ? "" : "s"} — accept or reject each one. Nothing is auto-applied.`}
        right={
          <div className="flex items-center gap-2">
            <Badge
              kind={
                confidence === "high"
                  ? "good"
                  : confidence === "medium"
                  ? "info"
                  : "warn"
              }
            >
              confidence: {confidence}
            </Badge>
            <button
              className="btn-ghost text-[11.5px]"
              onClick={() => setAccept(hunks.map((h) => h.op === "change"))}
            >
              Accept all
            </button>
            <button
              className="btn-ghost text-[11.5px]"
              onClick={() => setAccept(hunks.map(() => false))}
            >
              Reject all
            </button>
            <CopyButton text={previewText} label="Copy result" />
            <button className="btn-primary" onClick={() => onApply(previewText)}>
              Apply ({acceptedCount}/{total})
            </button>
          </div>
        }
      />
      <CardBody className="grid gap-3">
        <div className="rounded-lg border border-med-line bg-white p-3 text-sm leading-relaxed">
          {hunks.map((h, i) => {
            if (h.op === "eq") {
              return (
                <span key={i} className="text-med-ink">
                  {h.text}
                </span>
              );
            }
            const accepted = accept[i];
            return (
              <span key={i} className="inline">
                {h.before ? (
                  <span
                    className={`px-0.5 rounded ${
                      accepted
                        ? "bg-rose-50 text-rose-500 line-through opacity-70"
                        : "bg-rose-100 text-rose-700"
                    }`}
                    title={accepted ? "Will be removed" : "Will stay (rejected change)"}
                  >
                    {h.before}
                  </span>
                ) : null}
                {h.after ? (
                  <span
                    className={`px-0.5 rounded ${
                      accepted
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-emerald-50 text-emerald-500 line-through opacity-70"
                    }`}
                    title={accepted ? "Will be inserted" : "Will be skipped"}
                  >
                    {h.after}
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() =>
                    setAccept((prev) => {
                      const next = [...prev];
                      next[i] = !next[i];
                      return next;
                    })
                  }
                  className="text-[10px] align-super ml-0.5 px-1 rounded border border-med-line text-med-sub hover:bg-slate-50"
                  title="Toggle this change"
                >
                  {accepted ? "✓" : "✗"}
                </button>
              </span>
            );
          })}
        </div>
        <details className="text-[12px] text-med-sub">
          <summary className="cursor-pointer">Final preview</summary>
          <div className="mt-2 prose-output text-[13.5px] whitespace-pre-wrap">
            {previewText}
          </div>
        </details>
      </CardBody>
    </Card>
  );
}
