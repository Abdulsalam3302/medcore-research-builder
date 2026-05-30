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
import { InfoHint } from "./ui/InfoHint";
import { StatsAndFigures } from "./StatsAndFigures";
import { HumanReviewBanner } from "./HumanReviewBanner";

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

/** Per-section "why this section exists" coaching, in a mentoring voice. */
const SECTION_PURPOSE: Record<string, { title: string; text: string }> = {
  introduction: {
    title: "Purpose of the Introduction",
    text: "The Introduction earns the reader's attention in three moves: establish the burden (why the problem matters), expose the gap (what's still unknown), and state a single, specific objective. Reviewers should finish it knowing exactly what question you set out to answer — and why it was worth asking.",
  },
  methods: {
    title: "Purpose of the Methods",
    text: "Methods exist for reproducibility: another team should be able to repeat your study from this section alone. Report design, setting, participants, variables, and analysis in enough detail to be checked. This is where the reporting guideline bites hardest — completeness here is what makes the results trustworthy.",
  },
  results: {
    title: "Purpose of the Results",
    text: "Report, don't interpret. Present the findings — numbers, estimates, confidence intervals, and flow — neutrally and completely, including results that don't favour your hypothesis. Save the meaning for the Discussion. Mixing in interpretation here is a classic reviewer complaint.",
  },
  discussion: {
    title: "Purpose of the Discussion",
    text: "Interpret without overclaiming. Summarise the principal findings, compare them with prior work, and state implications strictly within what your design and data support — an observational study shows association, not causation. State limitations honestly; reviewers trust authors who name their own weaknesses.",
  },
  conclusion: {
    title: "Purpose of the Conclusion",
    text: "Match the evidence. A strong conclusion restates what you actually showed, at the strength your data justify — no new results, no leap from 'associated with' to 'causes', no novelty claim beyond what the literature supports. Overstated conclusions are one of the fastest routes to rejection.",
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
            title={
              <span className="inline-flex items-center gap-1.5">
                {meta.title}
                {SECTION_PURPOSE[section] && (
                  <InfoHint
                    title={SECTION_PURPOSE[section].title}
                    text={SECTION_PURPOSE[section].text}
                  />
                )}
              </span>
            }
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
              <InfoHint
                title="Three tools, you stay the author"
                text="Generate drafts a first version from your pipeline context. Refine scores the draft against the reporting-guideline checklist and proposes edits you accept or reject one by one. Enhance polishes wording without changing meaning. None of them invent numbers, citations, or facts — and every output is a suggestion: read it critically and verify every figure against your data before it ships."
              />
              <CopyButton text={project.sections[section] || ""} label="Copy draft" />
            </div>
            {err && <div role="alert" className="text-sm text-med-bad">{err}</div>}
            <HumanReviewBanner compact />
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
                Checking trusted sources and drafting support can take 5–10s. We never invent numbers, citations, or claims while we wait.
              </div>
            </CardBody>
          </Card>
        ) : null}
      </div>

      <div className="grid gap-5">
        <Card>
          <CardHeader
            title={
              <span className="inline-flex items-center gap-1.5">
                Checklist
                <InfoHint
                  title="Why work the checklist"
                  text="These are the exact reporting-guideline items reviewers tick off for this section. Covering each one is what 'complete reporting' means — and many journals require a filled-in checklist at submission. After you Refine, each item is marked covered, partial, or missing so you can close gaps before a reviewer finds them. 'Complete this item' helps draft the missing piece, but asks you for any fact it doesn't have rather than inventing it."
                />
              </span>
            }
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
                  title={
                    <span className="inline-flex items-center gap-1.5">
                      Needs author input
                      <InfoHint
                        title="Why these are left blank"
                        text="These are facts the assistant deliberately did not fill in — sample sizes, dates, approvals, exact numbers — because inventing them would be fabrication. Supply each one from your own records. A blank here is a gap a reviewer would catch; better that you close it now with the real value."
                      />
                    </span>
                  }
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
                  title={
                    <span className="inline-flex items-center gap-1.5">
                      Risk warnings
                      <InfoHint
                        title="Why heed these"
                        text="These flag statements that could draw a reviewer's objection or cross an integrity line — overclaiming causation from an observational design, spin that oversells a null result, unsupported novelty, or numbers that don't reconcile. They're judgement calls, not errors: read each one and decide, but addressing them before submission is usually cheaper than a revision letter."
                      />
                    </span>
                  }
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
                          Open source search →
                        </a>
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
            )}
            {(feedback.languageNotes?.length ?? 0) > 0 && (
              <Card>
                <CardHeader
                  title={
                    <span className="inline-flex items-center gap-1.5">
                      Language editing applied
                      <InfoHint
                        title="What this panel means"
                        text="The refinement also tidied grammar, wording, and academic register so non-native and native authors read equally clearly — meaning is preserved, no facts changed. These notes list the kinds of edits made. Clear prose lets reviewers focus on your science rather than stumbling over the writing; still skim the result, as you remain responsible for the final words."
                      />
                    </span>
                  }
                  subtitle="Clarity, flow, and academic register improved by default — meaning preserved."
                  right={<Badge kind="info">{feedback.languageNotes!.length}</Badge>}
                />
                <CardBody>
                  <ul className="text-sm text-med-sub list-disc list-inside grid gap-1">
                    {feedback.languageNotes!.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
            )}
            {(feedback.coherenceNotes?.length ?? 0) > 0 && (
              <Card>
                <CardHeader
                  title={
                    <span className="inline-flex items-center gap-1.5">
                      Coherence checks
                      <InfoHint
                        title="Why cross-section consistency matters"
                        text="A manuscript is judged as a whole: the objective in your Introduction must match what the Results report and what the Conclusion claims, and your stated design must line up everywhere. These notes flag drift between sections — an outcome named here but not analysed there, a claim with no matching result. Catching that internal contradiction yourself is one of the strongest signals of a carefully prepared paper."
                      />
                    </span>
                  }
                  subtitle="Consistency with title, objective, design, and sibling sections."
                  right={<Badge kind="warn">{feedback.coherenceNotes!.length}</Badge>}
                />
                <CardBody>
                  <ul className="text-sm text-med-sub list-disc list-inside grid gap-1">
                    {feedback.coherenceNotes!.map((m, i) => (
                      <li key={i}>{m}</li>
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
