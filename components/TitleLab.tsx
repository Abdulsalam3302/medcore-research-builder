"use client";

import { useMemo, useState } from "react";
import type {
  NoveltyReport,
  ProjectState,
  TitleCandidate,
  TitleInputs,
} from "@/lib/types";
import { Card, CardBody, CardHeader } from "./ui/Card";
import { Spinner } from "./ui/Spinner";
import { Badge } from "./ui/Badge";
import { CopyButton } from "./ui/CopyButton";
import { detectTitleConflicts } from "@/lib/alignment";

type TitleAssessment = {
  scores?: Array<{ dimension: string; score: number | null; rationale: string }>;
  overall?: number;
  verdict?: "weak" | "moderate" | "strong" | "excellent";
  topRefinements?: string[];
  designConflictNotes?: string[];
};

const FIELD_DEFS: Array<[keyof TitleInputs, string, string]> = [
  ["draftTitle", "Draft title (or leave blank to generate)", ""],
  ["researchType", "Research type", "e.g. Original research, Systematic review"],
  ["design", "Study design", "e.g. Randomised controlled trial"],
  ["population", "Population (PICO P)", "e.g. Adults with heart failure"],
  ["problem", "Condition / problem", "e.g. 30-day readmission"],
  ["intervention", "Intervention / exposure / index test / model", ""],
  ["comparator", "Comparator (if applicable)", ""],
  ["outcome", "Primary outcome", ""],
  ["setting", "Setting / country", ""],
  ["timePeriod", "Time period", ""],
];

/** Build TitleInputs from the research-type answers + expanded notes so the
 * Title Lab "Load demo" actually pulls from the previous step. */
function deriveInputsFromProject(p: ProjectState): TitleInputs {
  const a = p.researchTypeAnswers || {};
  const en = a.expandedNotes || ({} as NonNullable<typeof a.expandedNotes>);
  const designIdReadable = a.designId
    ? a.designId
        .replace(/^interv\.rct\.parallel$/, "Randomised controlled trial (parallel-group)")
        .replace(/^interv\.rct\./, "RCT — ")
        .replace(/^obs\.cohort\.prospective$/, "Prospective cohort study")
        .replace(/^obs\.cohort\.retrospective$/, "Retrospective cohort study")
        .replace(/^obs\.cross-sectional$/, "Cross-sectional study")
        .replace(/^obs\.case-control$/, "Case-control study")
        .replace(/^syn\.sr$/, "Systematic review")
        .replace(/^syn\.meta$/, "Systematic review and meta-analysis")
        .replace(/^dx\.stard$/, "Diagnostic accuracy study")
        .replace(/^dx\.tripod-ai$/, "Multivariable prediction model")
        .replace(/^case\.care$/, "Case report")
        .replace(/_|\./g, " ")
    : "";
  return {
    researchType: a.manuscriptType
      ? a.manuscriptType.replace(/_/g, " ")
      : p.titleInputs.researchType,
    design: designIdReadable || p.titleInputs.design,
    population: en.population || p.titleInputs.population,
    problem: en.condition || p.titleInputs.problem,
    intervention: en.intervention || en.exposure || p.titleInputs.intervention,
    comparator: en.comparator || p.titleInputs.comparator,
    outcome: en.primaryOutcome || p.titleInputs.outcome,
    setting:
      [en.setting, en.country].filter(Boolean).join(", ") ||
      p.titleInputs.setting,
    timePeriod: en.timePeriod || p.titleInputs.timePeriod,
    draftTitle: p.titleInputs.draftTitle,
  };
}

export function TitleLab({
  project,
  update,
}: {
  project: ProjectState;
  update: (fn: (p: ProjectState) => ProjectState) => void;
}) {
  const inputs = project.titleInputs;
  const [busy, setBusy] = useState<
    "generate" | "refine" | "novelty" | "ai-generate" | "enhance" | null
  >(null);
  const [enhanceField, setEnhanceField] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [titleAssessment, setTitleAssessment] = useState<TitleAssessment | null>(null);

  const designId = project.researchTypeAnswers?.designId;
  const localConflicts = useMemo(
    () => detectTitleConflicts(designId, inputs.draftTitle || ""),
    [designId, inputs.draftTitle]
  );

  function setInputs(patch: Partial<TitleInputs>) {
    update((p) => ({ ...p, titleInputs: { ...p.titleInputs, ...patch } }));
  }

  /** Pull data from previous wizard steps into the form. */
  function pullFromPipeline() {
    const derived = deriveInputsFromProject(project);
    update((p) => ({
      ...p,
      titleInputs: { ...p.titleInputs, ...stripEmpty(derived) },
    }));
  }

  async function generateOrRefine(mode: "generate" | "refine") {
    setBusy(mode);
    setErr(null);
    try {
      const r = await fetch("/api/llm/refine-title", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode,
          inputs,
          answers: project.researchTypeAnswers,
        }),
      });
      const data = (await r.json()) as {
        candidates?: TitleCandidate[];
        error?: string;
      };
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      update((p) => ({ ...p, titleCandidates: data.candidates || [] }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  /** AI generation: zero-input. Pulls everything from the pipeline first, then asks the LLM. */
  async function aiGenerate() {
    setBusy("ai-generate");
    setErr(null);
    try {
      const derived = deriveInputsFromProject(project);
      const mergedInputs = { ...inputs, ...stripEmpty(derived) };
      update((p) => ({ ...p, titleInputs: mergedInputs }));
      const r = await fetch("/api/llm/refine-title", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode: "generate",
          inputs: mergedInputs,
          answers: project.researchTypeAnswers,
        }),
      });
      const data = (await r.json()) as {
        candidates?: TitleCandidate[];
        error?: string;
      };
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      update((p) => ({ ...p, titleCandidates: data.candidates || [] }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  /** AI enhance one field (no fabrication). */
  async function aiEnhanceField(field: keyof TitleInputs) {
    setEnhanceField(field);
    setBusy("enhance");
    setErr(null);
    try {
      const r = await fetch("/api/llm/enhance", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          field,
          value: inputs[field] || "",
          answers: project.researchTypeAnswers,
          hint:
            field === "draftTitle"
              ? "Polish the title to match the chosen study design and journal style; preserve all facts; do not invent numbers, sites, or citations."
              : `Polish or expand the ${field} field; preserve all facts; never invent specifics.`,
        }),
      });
      const data = (await r.json()) as {
        value?: string;
        note?: string;
        error?: string;
      };
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      if (data.value) setInputs({ [field]: data.value } as Partial<TitleInputs>);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
      setEnhanceField(null);
    }
  }

  async function runNovelty() {
    setBusy("novelty");
    setErr(null);
    try {
      const r = await fetch("/api/title/full-check", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ inputs, answers: project.researchTypeAnswers }),
      });
      const data = (await r.json()) as {
        novelty?: NoveltyReport;
        assessment?: TitleAssessment | null;
        designConflicts?: Array<{ keyword: string; reason: string }>;
        error?: string;
      };
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      update((p) => ({
        ...p,
        noveltyReport: data.novelty || p.noveltyReport,
      }));
      setTitleAssessment(data.assessment || null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-5">
      <PipelineBanner project={project} />
      <Card>
        <CardHeader
          title="Title Lab"
          subtitle="Generate, refine, AI-enhance, and run an evidence-based similarity scan. Every action stays aligned with your research type and journal."
          right={
            <div className="flex flex-wrap items-center gap-2">
              <button
                className="btn-ghost text-med-brand text-xs"
                onClick={pullFromPipeline}
                disabled={!project.researchTypeAnswers?.designId}
                title={
                  project.researchTypeAnswers?.designId
                    ? "Pull design, manuscript type, and PICO from the Research Type step."
                    : "Pick a research type first to enable this."
                }
              >
                ⤵ Pull from research step
              </button>
              <button
                className="btn-ghost text-med-brand text-xs"
                onClick={() => update((p) => ({ ...p, titleInputs: DEMO_INPUTS_FALLBACK }))}
              >
                Load demo
              </button>
            </div>
          }
        />
        <CardBody className="grid md:grid-cols-2 gap-4">
          {FIELD_DEFS.map(([key, label, placeholder]) => {
            const isDraft = key === "draftTitle";
            return (
              <div key={key} className={isDraft ? "md:col-span-2" : ""}>
                <div className="flex items-center justify-between">
                  <label className="label">{label}</label>
                  <button
                    className="text-[11px] text-med-brand hover:underline disabled:opacity-50"
                    disabled={busy !== null}
                    onClick={() => aiEnhanceField(key)}
                    title="Polish this field using the project context (no fabrication)."
                  >
                    {busy === "enhance" && enhanceField === key ? (
                      <Spinner dark />
                    ) : (
                      "✨ AI enhance"
                    )}
                  </button>
                </div>
                {isDraft ? (
                  <textarea
                    className="textarea min-h-[80px]"
                    placeholder={placeholder}
                    value={inputs[key] || ""}
                    onChange={(e) =>
                      setInputs({ [key]: e.target.value } as Partial<TitleInputs>)
                    }
                  />
                ) : (
                  <input
                    className="input"
                    placeholder={placeholder}
                    value={inputs[key] || ""}
                    onChange={(e) =>
                      setInputs({ [key]: e.target.value } as Partial<TitleInputs>)
                    }
                  />
                )}
              </div>
            );
          })}

          {localConflicts.length > 0 && (
            <div className="md:col-span-2 border border-rose-200 bg-rose-50 rounded-md p-3 text-sm text-rose-800">
              <div className="font-semibold mb-1">
                ⚠ Title conflicts with your chosen design
              </div>
              <ul className="list-disc list-inside space-y-1">
                {localConflicts.map((c, i) => (
                  <li key={i}>
                    Word <code className="font-mono">"{c.keyword}"</code> — {c.reason}
                  </li>
                ))}
              </ul>
              <div className="mt-2 text-xs text-rose-700">
                Tip: open the Research Type step and either change your design or remove
                the conflicting words from the title.
              </div>
            </div>
          )}

          <div className="md:col-span-2 flex flex-wrap items-center gap-2">
            <button
              className="btn-primary"
              onClick={aiGenerate}
              disabled={!!busy}
              title="Pull data from previous steps and ask the AI to generate candidate titles."
            >
              {busy === "ai-generate" && <Spinner />} 🤖 AI generate from research
            </button>
            <button
              className="btn-secondary"
              onClick={() => generateOrRefine("generate")}
              disabled={!!busy}
            >
              {busy === "generate" && <Spinner dark />} Generate candidates
            </button>
            <button
              className="btn-secondary"
              onClick={() => generateOrRefine("refine")}
              disabled={!!busy || !inputs.draftTitle}
              title="Refine your typed draft — validates against research type before refining."
            >
              {busy === "refine" && <Spinner dark />} Refine draft (scientific check)
            </button>
            <button
              className="btn-secondary"
              onClick={runNovelty}
              disabled={!!busy || !inputs.draftTitle}
            >
              {busy === "novelty" && <Spinner dark />} Check title (novelty + validation + applicability …)
            </button>
            {err && <div className="text-sm text-med-bad">{err}</div>}
          </div>
        </CardBody>
      </Card>

      {project.titleCandidates.length > 0 && (
        <Card>
          <CardHeader title="Candidate titles" />
          <CardBody className="grid gap-3">
            {project.titleCandidates.map((c, i) => {
              const cConflicts = detectTitleConflicts(designId, c.text);
              return (
                <div
                  key={i}
                  className="border border-med-line rounded-lg p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-medium text-med-ink">{c.text}</div>
                    <div className="flex items-center gap-2 shrink-0">
                      <CopyButton text={c.text} label="Copy" />
                      <button
                        className="btn-primary"
                        onClick={() =>
                          update((p) => ({
                            ...p,
                            titleFinal: c.text,
                            titleInputs: {
                              ...p.titleInputs,
                              draftTitle: c.text,
                            },
                          }))
                        }
                      >
                        Use this
                      </button>
                    </div>
                  </div>
                  {c.rationale && <div className="muted mt-1">{c.rationale}</div>}
                  {(c.warnings?.length || cConflicts.length) ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {c.warnings?.map((w, j) => (
                        <Badge key={`w${j}`} kind="warn">{w}</Badge>
                      ))}
                      {cConflicts.map((w, j) => (
                        <Badge key={`c${j}`} kind="bad">
                          design conflict: {w.keyword}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </CardBody>
        </Card>
      )}

      {project.titleFinal && (
        <Card>
          <CardHeader
            title="Selected title"
            right={<CopyButton text={project.titleFinal} />}
          />
          <CardBody>
            <div className="text-lg font-medium text-med-ink">
              {project.titleFinal}
            </div>
          </CardBody>
        </Card>
      )}

      {titleAssessment && <TitleAssessmentCard a={titleAssessment} />}

      {project.noveltyReport &&
        (project.noveltyReport.risk === "exact_or_near_exact_match" ||
          project.noveltyReport.risk === "high_duplicate_risk" ||
          project.noveltyReport.risk === "moderate_similarity_risk") ? (
        <DifferentiatorPanel
          report={project.noveltyReport}
          onAppendNote={(text) =>
            update((p) => ({
              ...p,
              researchTypeAnswers: {
                ...p.researchTypeAnswers,
                notes: p.researchTypeAnswers.notes
                  ? `${p.researchTypeAnswers.notes}\n${text}`
                  : text,
              },
            }))
          }
        />
      ) : null}
      {project.noveltyReport && <NoveltyResult report={project.noveltyReport} />}
    </div>
  );
}

function TitleAssessmentCard({ a }: { a: TitleAssessment }) {
  const verdictKind: "good" | "info" | "warn" | "bad" =
    a.verdict === "excellent" ? "good" : a.verdict === "strong" ? "info" : a.verdict === "moderate" ? "warn" : "bad";
  return (
    <Card>
      <CardHeader
        title="Title — multi-dimensional check"
        subtitle="Validation, reliability, similarity, novelty, importance, applicability, contribution."
        right={
          <div className="flex items-center gap-2">
            {typeof a.overall === "number" && (
              <Badge
                kind={a.overall >= 80 ? "good" : a.overall >= 60 ? "info" : a.overall >= 40 ? "warn" : "bad"}
              >
                {a.overall}/100
              </Badge>
            )}
            {a.verdict && <Badge kind={verdictKind}>{a.verdict}</Badge>}
          </div>
        }
      />
      <CardBody className="grid gap-3">
        {(a.scores || []).length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {(a.scores || []).map((s, i) => {
              const score = s.score;
              const kind: "good" | "info" | "warn" | "bad" | "neutral" =
                score === null
                  ? "neutral"
                  : score >= 80
                  ? "good"
                  : score >= 60
                  ? "info"
                  : score >= 40
                  ? "warn"
                  : "bad";
              const label = s.dimension.replace(/^./, (c) => c.toUpperCase());
              return (
                <div key={i} className="border border-med-line rounded p-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-med-ink">{label}</span>
                    <Badge kind={kind}>{score === null ? "—" : `${score}/100`}</Badge>
                  </div>
                  <div className="text-xs text-med-sub mt-1">{s.rationale}</div>
                </div>
              );
            })}
          </div>
        )}
        {a.topRefinements && a.topRefinements.length > 0 && (
          <section>
            <div className="label">Top refinements</div>
            <ul className="list-disc list-inside text-sm text-med-sub space-y-1">
              {a.topRefinements.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </section>
        )}
        {a.designConflictNotes && a.designConflictNotes.length > 0 && (
          <section>
            <div className="label text-rose-700">Design conflict notes</div>
            <ul className="list-disc list-inside text-sm text-rose-700 space-y-1">
              {a.designConflictNotes.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </section>
        )}
      </CardBody>
    </Card>
  );
}

function stripEmpty<T extends Record<string, unknown>>(o: T): Partial<T> {
  const out: Partial<T> = {};
  for (const [k, v] of Object.entries(o)) {
    if (typeof v === "string" && v.trim()) (out as Record<string, unknown>)[k] = v;
  }
  return out;
}

const DEMO_INPUTS_FALLBACK: TitleInputs = {
  researchType: "Original research",
  design: "Randomized controlled trial",
  population: "Adults with heart failure (≥18y, NYHA II-III)",
  problem: "30-day hospital readmission",
  intervention: "Structured discharge education program",
  comparator: "Usual care",
  outcome: "30-day all-cause readmission",
  setting: "Tertiary teaching hospitals, urban setting",
  timePeriod: "2022–2024",
  draftTitle:
    "Effect of structured discharge education on 30-day readmission among adults with heart failure: a randomized controlled trial",
};

function PipelineBanner({ project }: { project: ProjectState }) {
  const a = project.researchTypeAnswers || {};
  const r = project.researchTypeResult;
  const hasRes = !!a.designId || !!r;
  return (
    <Card>
      <CardBody className="grid gap-2">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-med-subtle">
          Pipeline context
        </div>
        {hasRes ? (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {r?.primaryGuidelineName && (
              <Badge kind="info">{r.primaryGuidelineName}</Badge>
            )}
            {a.designId && <Badge kind="neutral">design: {a.designId}</Badge>}
            {a.manuscriptType && (
              <Badge kind="neutral">type: {a.manuscriptType.replace(/_/g, " ")}</Badge>
            )}
            {a.journalId && (
              <Badge kind="neutral">journal: {a.journalId}</Badge>
            )}
            {(a.featureIds || []).map((f) => (
              <Badge key={f} kind="neutral">+ {f}</Badge>
            ))}
            <span className="text-med-sub">
              The Title Lab uses these to validate refinements and prefill fields.
            </span>
          </div>
        ) : (
          <div className="text-xs text-amber-700">
            No research-type context yet — open the Research Type step first so the
            Title Lab can validate against your design.
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function DifferentiatorPanel({
  report,
  onAppendNote,
}: {
  report: NoveltyReport;
  onAppendNote: (text: string) => void;
}) {
  const [text, setText] = useState("");
  const exampleQs = [
    "What population / setting is different?",
    "What outcome / measurement is different?",
    "What time window / sample size is different?",
    "What method / model / analysis approach is different?",
  ];
  const top = report.exactMatches[0] || report.similar[0];
  if (!top) return null;
  return (
    <Card>
      <CardHeader
        title="What makes yours different?"
        subtitle="Near-match found. Articulate the differentiator before drafting — it will save reviewer pushback."
        right={<Badge kind="bad">Action recommended</Badge>}
      />
      <CardBody className="grid gap-3">
        <div className="text-[12.5px] text-med-sub">
          Closest existing work: <span className="font-medium text-med-ink">{top.title}</span>
          {top.year ? ` (${top.year})` : ""}
          {top.journal ? ` · ${top.journal}` : ""}
        </div>
        <ul className="grid sm:grid-cols-2 gap-1.5 text-[12.5px] text-med-inkSoft">
          {exampleQs.map((q) => (
            <li key={q} className="flex gap-1.5">
              <span className="text-med-brand">•</span>
              <span>{q}</span>
            </li>
          ))}
        </ul>
        <textarea
          className="textarea min-h-[110px]"
          placeholder="Write 2–3 sentences that an editor could quote in the cover letter."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <button
            className="btn-secondary"
            disabled={!text.trim()}
            onClick={() => {
              onAppendNote(`Differentiator vs prior work: ${text.trim()}`);
              setText("");
            }}
          >
            Save into project notes
          </button>
        </div>
      </CardBody>
    </Card>
  );
}

function NoveltyResult({ report }: { report: NoveltyReport }) {
  const riskBadge: { kind: "good" | "warn" | "bad" | "info"; label: string } =
    report.risk === "exact_or_near_exact_match"
      ? { kind: "bad", label: "Exact / near-exact match found" }
      : report.risk === "high_duplicate_risk"
      ? { kind: "bad", label: "High duplicate risk" }
      : report.risk === "moderate_similarity_risk"
      ? { kind: "warn", label: "Moderate similarity risk" }
      : { kind: "good", label: "Low duplicate risk" };
  return (
    <Card>
      <CardHeader
        title="Novelty / similarity report"
        subtitle="Evidence-based scan across PubMed, Crossref, OpenAlex (and web search if configured)."
        right={<Badge kind={riskBadge.kind}>{riskBadge.label}</Badge>}
      />
      <CardBody className="grid gap-4">
        <div className="text-xs text-med-sub bg-slate-50 border border-med-line rounded-md p-3">
          <div className="font-semibold text-med-ink mb-1">Disclaimer</div>
          {report.disclaimer}
        </div>

        {report.exactMatches.length > 0 && (
          <section>
            <div className="label">Exact / near-exact matches</div>
            <ResultList items={report.exactMatches} />
          </section>
        )}

        {report.similar.length > 0 && (
          <section>
            <div className="label">Similar studies</div>
            <ResultList items={report.similar} />
          </section>
        )}

        {report.refinementSuggestions.length > 0 && (
          <section>
            <div className="label">Refinement suggestions</div>
            <ul className="list-disc list-inside text-sm text-med-sub space-y-1">
              {report.refinementSuggestions.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </section>
        )}

        {report.gapsRemaining.length > 0 && (
          <section>
            <div className="label">Notes</div>
            <ul className="list-disc list-inside text-sm text-med-sub space-y-1">
              {report.gapsRemaining.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </section>
        )}

        <details className="text-xs text-med-sub">
          <summary className="cursor-pointer">Queries used</summary>
          <ul className="list-disc list-inside mt-2 space-y-1">
            {report.queriesUsed.map((q, i) => (
              <li key={i}>
                <span className="font-mono">[{q.source}]</span> {q.query}
              </li>
            ))}
          </ul>
        </details>
      </CardBody>
    </Card>
  );
}

function ResultList({ items }: { items: NoveltyReport["similar"] }) {
  return (
    <div className="grid gap-2">
      {items.map((s, i) => (
        <a
          key={i}
          href={s.url || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="border border-med-line rounded-lg p-3 hover:bg-slate-50 block"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="font-medium text-med-ink text-sm">{s.title}</div>
            <Badge kind="neutral">{s.source}</Badge>
          </div>
          <div className="muted mt-0.5">
            {[s.authors?.slice(0, 3).join(", "), s.journal, s.year]
              .filter(Boolean)
              .join(" · ")}
          </div>
          <div className="text-xs text-med-sub mt-1">
            {s.whySimilar}
            {s.pmid && <> · PMID {s.pmid}</>}
            {s.doi && <> · {s.doi}</>}
          </div>
        </a>
      ))}
    </div>
  );
}
