"use client";

import { useMemo, useState } from "react";
import type { ProjectState } from "@/lib/types";
import { Card, CardBody, CardHeader } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { Spinner } from "./ui/Spinner";
import { aiHeuristic, readability } from "@/lib/readability";
import { InfoHint } from "./ui/InfoHint";

type DimScore = { dimension: string; score: number | null; rationale: string };
type Concern = { section: string; issue: string; resolution: string };
type Remark = { section: string; remark: string };

type QualityReport = {
  summary?: string;
  scores?: DimScore[];
  overall?: number;
  verdict?: "needs-major-revision" | "needs-minor-revision" | "near-ready" | "ready";
  positiveRemarks?: Remark[];
  majorConcerns?: Concern[];
  minorConcerns?: Concern[];
  homeKeyMessageSuggestion?: string;
  visualizationSuggestions?: string[];
  additionalChecks?: string[];
};

const DIMENSIONS_HELP: Record<string, string> = {
  novelty: "Originality / new contribution.",
  contribution: "Clear contribution to the discipline.",
  significance: "Importance of the question; potential impact.",
  gapIdentified: "Clarity of the knowledge gap addressed.",
  aimAndHypothesis: "Clarity of aim / hypothesis / objective.",
  methodologicalRigor: "Design–question alignment, validity, reliability.",
  ethics: "Consent, IRB, vulnerable populations, data protection.",
  integrity: "No overstatement, no causal language unsupported by design.",
  coherence: "Logical flow across sections.",
  readability: "Accessibility for the target reader.",
  scientificQuality: "Precision, terminology, statistical reporting.",
  academicTone: "Objective, balanced, neutral voice.",
  applicability: "Translation to practice / policy.",
  conclusionKeyMessage: "Strong, evidence-aligned take-home message.",
  visualization: "Figure/table appropriateness vs. study design.",
  validation: "Internal + external validation, sensitivity analyses.",
  reliability: "Reproducibility, code/data availability, transparency.",
  similarityRisk: "Overlap with existing literature.",
};

export function QualitySuite({ project }: { project: ProjectState }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [report, setReport] = useState<QualityReport | null>(null);

  const allText = useMemo(() => {
    return [
      project.titleFinal || project.titleInputs.draftTitle || "",
      project.sections.introduction,
      project.sections.methods,
      project.sections.results,
      project.sections.discussion,
      project.sections.conclusion,
    ]
      .filter(Boolean)
      .join("\n\n");
  }, [project]);

  const localReadability = useMemo(() => readability(allText), [allText]);
  const localAiHeuristic = useMemo(() => aiHeuristic(allText), [allText]);

  async function runReview() {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/llm/quality-review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ project }),
      });
      const data = (await r.json()) as QualityReport & { error?: string };
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
              Quality Suite
              <InfoHint
                title="What this suite does"
                text="A mock peer-review pass: it scores your manuscript across the dimensions reviewers weigh (rigour, integrity, clarity, ethics) and lists concrete fixes. Treat it as a rehearsal of the critique you'll face — it sharpens the draft but does not replace real peer, expert, or ethics review, and a good score is not a promise of acceptance."
              />
            </span>
          }
          subtitle="Peer review, scientific scoring, AI-detect heuristic, readability, and plagiarism guidance — all in one place."
          right={
            <div className="flex items-center gap-2">
              <InfoHint
                side="left"
                title="Why run a full review"
                text="Running every check together gives you a single, honest picture before an editor forms one. The earlier you see weak rigour, overstated claims, or thin reporting, the cheaper they are to fix — this is your private dry run."
              />
              <button className="btn-primary" onClick={runReview} disabled={busy || !allText.trim()}>
                {busy && <Spinner />} Run full quality review
              </button>
            </div>
          }
        />
        <CardBody className="grid gap-3">
          {!allText.trim() && (
            <div className="border border-amber-200 bg-amber-50 text-amber-800 rounded p-3 text-sm">
              No manuscript text yet — draft at least one section before running the review.
            </div>
          )}
          {err && <div className="text-sm text-med-bad">{err}</div>}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title={
            <span className="inline-flex items-center gap-1.5">
              Readability
              <InfoHint
                title="Why readability matters"
                text="Reviewers read faster and judge more kindly when prose is clear. These indices estimate how demanding your sentences are — overly long sentences, heavy passive voice, and dense vocabulary slow comprehension and can obscure your argument. Aim for precision, not simplicity for its own sake."
              />
            </span>
          }
          subtitle="Local Flesch-Kincaid, Gunning-Fog, passive voice — no API call, no upload."
          right={
            <Badge
              kind={
                localReadability.verdict === "easy" || localReadability.verdict === "very-easy"
                  ? "good"
                  : localReadability.verdict === "average"
                  ? "info"
                  : "warn"
              }
            >
              {localReadability.verdict}
            </Badge>
          }
        />
        <CardBody className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <Stat label="Words" value={localReadability.words} />
          <Stat label="Sentences" value={localReadability.sentences} />
          <Stat label="Avg sentence length" value={localReadability.avgSentenceLength} />
          <Stat label="% long words" value={localReadability.pctLongWords} suffix="%" />
          <Stat label="Flesch reading ease" value={localReadability.flesch} />
          <Stat label="F-K grade level" value={localReadability.fleschKincaidGrade} />
          <Stat label="Gunning fog" value={localReadability.gunningFog} />
          <Stat label="Passive voice" value={localReadability.passiveVoicePct} suffix="%" />
          <div className="col-span-2 md:col-span-4 text-xs text-med-sub italic">
            {localReadability.recommendation}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title={
            <span className="inline-flex items-center gap-1.5">
              AI-detect heuristic
              <InfoHint
                title="What this signal is (and isn't)"
                text="This looks at local patterns — sentence-length variation (burstiness), transition-word density, and hedging — that tend to be flatter in machine-generated text. It's a rough self-check to prompt revision toward your own voice, not a verdict on authorship. AI-detection is unreliable in general; never treat any score here as proof, and disclose genuine AI assistance regardless."
              />
            </span>
          }
          subtitle="Local burstiness + transition-density + AI-hedge signal. Not a replacement for GPTZero / Originality.ai — flags suspicious patterns only."
          right={
            <Badge
              kind={
                localAiHeuristic.verdict === "likely-human"
                  ? "good"
                  : localAiHeuristic.verdict === "uncertain"
                  ? "info"
                  : "bad"
              }
            >
              {localAiHeuristic.verdict} ({localAiHeuristic.score0to100}/100)
            </Badge>
          }
        />
        <CardBody className="grid gap-2 text-sm">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Burstiness" value={localAiHeuristic.burstiness} />
            <Stat label="Transition density" value={localAiHeuristic.transitionDensity} suffix="%" />
            <Stat label="Hedge density" value={localAiHeuristic.hedgeWordDensity} suffix="%" />
          </div>
          <ul className="list-disc list-inside text-xs text-med-sub space-y-1">
            {localAiHeuristic.notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title={
            <span className="inline-flex items-center gap-1.5">
              Plagiarism guidance
              <InfoHint
                title="Why a real similarity check"
                text="Reliable plagiarism detection needs a curated similarity corpus and a real comparison engine — something this tool deliberately does not fake. Many journals run iThenticate/Turnitin themselves, so checking with a publisher-grade service first lets you catch accidental overlap, missing quotation marks, or self-plagiarism before an editor does."
              />
            </span>
          }
          subtitle="External plagiarism services require a paid API key. We never send your draft anywhere without your action."
        />
        <CardBody className="grid gap-2 text-sm">
          <p className="text-med-sub">
            For a serious plagiarism check, run one of the following with your manuscript file:
          </p>
          <ul className="list-disc list-inside text-med-sub space-y-1">
            <li>
              <strong>iThenticate / Turnitin</strong> — publisher-grade, required by many journals before submission.
            </li>
            <li>
              <strong>Copyleaks</strong> — has a REST API + an AI-detect mode.
            </li>
            <li>
              <strong>Plagscan</strong> / <strong>Quetext</strong> — lighter-weight alternatives.
            </li>
          </ul>
          <p className="text-xs text-med-sub italic">
            Tip: most universities provide free iThenticate access through the library. We deliberately do
            not embed an unverified "plagiarism score" because reliable detection requires a curated
            similarity corpus.
          </p>
        </CardBody>
      </Card>

      {report && (
        <>
          {report.summary && (
            <Card>
              <CardHeader
                title="Peer-reviewer summary"
                right={
                  report.verdict && (
                    <span className="inline-flex items-center gap-1.5">
                    <InfoHint
                      side="left"
                      title="Reading the verdict"
                      text="This mirrors a journal decision band: 'ready' means no major issue surfaced; 'near ready' / 'needs minor revision' means small, addressable gaps; 'needs major revision' means substantive rework before it would survive review. It's a simulated reviewer's read to guide your next edit — not the journal's actual decision."
                    />
                    <Badge
                      kind={
                        report.verdict === "ready"
                          ? "good"
                          : report.verdict === "near-ready" || report.verdict === "needs-minor-revision"
                          ? "info"
                          : "bad"
                      }
                    >
                      {report.verdict.replaceAll("-", " ")}
                    </Badge>
                    </span>
                  )
                }
              />
              <CardBody>
                <p className="text-sm text-med-ink leading-relaxed">{report.summary}</p>
                {typeof report.overall === "number" && (
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <span className="text-med-sub inline-flex items-center gap-1.5">
                      Overall:
                      <InfoHint
                        title="The overall score"
                        text="A single 0–100 roll-up of the dimension scores below, meant to track progress across drafts. Use it to see whether revisions are moving the needle — but always read the individual dimensions and concerns, since one serious flaw (e.g. an ethics or integrity gap) matters more than a high average."
                      />
                    </span>
                    <Badge
                      kind={
                        report.overall >= 80 ? "good" : report.overall >= 60 ? "info" : "warn"
                      }
                    >
                      {report.overall}/100
                    </Badge>
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {report.scores && report.scores.length > 0 && (
            <Card>
              <CardHeader
                title={
                  <span className="inline-flex items-center gap-1.5">
                    Multi-dimensional scoring
                    <InfoHint
                      title="Why split the score apart"
                      text="A manuscript can be well-written yet methodologically weak, or rigorous yet poorly framed. Breaking the assessment into dimensions — novelty, rigour, ethics, integrity, clarity, and more — shows exactly where to invest effort, so you fix the real weakness rather than polishing strengths."
                    />
                  </span>
                }
              />
              <CardBody className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {report.scores.map((s, i) => (
                  <ScoreCard key={i} dim={s} />
                ))}
              </CardBody>
            </Card>
          )}

          {report.positiveRemarks && report.positiveRemarks.length > 0 && (
            <Card>
              <CardHeader
                title="Strengths"
                right={<Badge kind="good">{report.positiveRemarks.length}</Badge>}
              />
              <CardBody className="grid gap-2 text-sm">
                {report.positiveRemarks.map((r, i) => (
                  <div key={i} className="border border-emerald-200 bg-emerald-50 rounded p-2">
                    <div className="text-xs text-emerald-700 font-semibold uppercase tracking-wide">
                      {r.section}
                    </div>
                    <div className="text-med-ink">{r.remark}</div>
                  </div>
                ))}
              </CardBody>
            </Card>
          )}

          {report.majorConcerns && report.majorConcerns.length > 0 && (
            <ConcernCard
              title="Major concerns"
              concerns={report.majorConcerns}
              tone="bad"
            />
          )}
          {report.minorConcerns && report.minorConcerns.length > 0 && (
            <ConcernCard
              title="Minor concerns"
              concerns={report.minorConcerns}
              tone="warn"
            />
          )}

          {report.homeKeyMessageSuggestion && (
            <Card>
              <CardHeader title="Suggested home key message" />
              <CardBody>
                <div className="text-sm text-med-ink bg-slate-50 border border-med-line rounded p-3">
                  {report.homeKeyMessageSuggestion}
                </div>
              </CardBody>
            </Card>
          )}

          {report.visualizationSuggestions && report.visualizationSuggestions.length > 0 && (
            <Card>
              <CardHeader title="Visualization suggestions" />
              <CardBody>
                <ul className="list-disc list-inside text-sm text-med-sub space-y-1">
                  {report.visualizationSuggestions.map((v, i) => (
                    <li key={i}>{v}</li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          )}

          {report.additionalChecks && report.additionalChecks.length > 0 && (
            <Card>
              <CardHeader title="Additional checks" />
              <CardBody>
                <ul className="list-disc list-inside text-sm text-med-sub space-y-1">
                  {report.additionalChecks.map((v, i) => (
                    <li key={i}>{v}</li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  suffix = "",
}: {
  label: string;
  value: number | string;
  suffix?: string;
}) {
  return (
    <div className="border border-med-line rounded p-2">
      <div className="text-[10.5px] uppercase tracking-wide text-med-sub">{label}</div>
      <div className="font-semibold text-med-ink mt-0.5">
        {value}
        {suffix}
      </div>
    </div>
  );
}

function ScoreCard({ dim }: { dim: DimScore }) {
  const score = dim.score;
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
  const label = dim.dimension.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
  return (
    <div className="border border-med-line rounded p-3">
      <div className="flex items-center justify-between">
        <div className="font-medium text-med-ink text-sm">{label}</div>
        <Badge kind={kind}>{score === null ? "—" : `${score}/100`}</Badge>
      </div>
      <div className="text-xs text-med-sub mt-1">{dim.rationale}</div>
      {DIMENSIONS_HELP[dim.dimension] && (
        <div className="text-[11px] text-med-subtle italic mt-1">
          {DIMENSIONS_HELP[dim.dimension]}
        </div>
      )}
    </div>
  );
}

function ConcernCard({
  title,
  concerns,
  tone,
}: {
  title: string;
  concerns: Concern[];
  tone: "bad" | "warn";
}) {
  return (
    <Card>
      <CardHeader
        title={
          <span className="inline-flex items-center gap-1.5">
            {title}
            <InfoHint
              title={tone === "bad" ? "Major concerns" : "Minor concerns"}
              text={
                tone === "bad"
                  ? "Major concerns are issues a reviewer would likely treat as blockers — unsupported primary claims, methodological gaps, or missing declarations. Each comes with a suggested resolution; clear these before submitting, as they are the usual reasons for rejection or major revision."
                  : "Minor concerns are smaller fixes — wording, missing detail, inconsistent reporting — that rarely block acceptance but add up. Resolving them now reduces reviewer friction and shortens revision rounds."
              }
            />
          </span>
        }
        right={<Badge kind={tone}>{concerns.length}</Badge>}
      />
      <CardBody className="grid gap-3">
        {concerns.map((c, i) => (
          <div
            key={i}
            className={`border rounded p-3 ${
              tone === "bad" ? "border-rose-200 bg-rose-50" : "border-amber-200 bg-amber-50"
            }`}
          >
            <div className="text-xs font-semibold uppercase tracking-wide text-med-sub">
              {c.section}
            </div>
            <div className="text-med-ink mt-1 text-sm font-medium">{c.issue}</div>
            <div className="text-med-sub mt-2 text-xs">
              <span className="font-semibold text-med-ink">Resolution: </span>
              {c.resolution}
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
