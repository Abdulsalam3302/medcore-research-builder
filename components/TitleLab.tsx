"use client";

import { useState } from "react";
import type { NoveltyReport, ProjectState, TitleCandidate, TitleInputs } from "@/lib/types";
import { Card, CardBody, CardHeader } from "./ui/Card";
import { Spinner } from "./ui/Spinner";
import { Badge } from "./ui/Badge";
import { CopyButton } from "./ui/CopyButton";

const DEMO_INPUTS: TitleInputs = {
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

export function TitleLab({
  project,
  update,
}: {
  project: ProjectState;
  update: (fn: (p: ProjectState) => ProjectState) => void;
}) {
  const inputs = project.titleInputs;
  const [busy, setBusy] = useState<"generate" | "refine" | "novelty" | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function setInputs(patch: Partial<TitleInputs>) {
    update((p) => ({ ...p, titleInputs: { ...p.titleInputs, ...patch } }));
  }

  async function generateOrRefine(mode: "generate" | "refine") {
    setBusy(mode);
    setErr(null);
    try {
      const r = await fetch("/api/llm/refine-title", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode, inputs, answers: project.researchTypeAnswers }),
      });
      const data = (await r.json()) as { candidates?: TitleCandidate[]; error?: string };
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      update((p) => ({ ...p, titleCandidates: data.candidates || [] }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  async function runNovelty() {
    setBusy("novelty");
    setErr(null);
    try {
      const r = await fetch("/api/title/novelty-check", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ inputs }),
      });
      const data = (await r.json()) as NoveltyReport & { error?: string };
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      update((p) => ({ ...p, noveltyReport: data }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader
          title="Title Lab"
          subtitle="Generate, refine, and run an evidence-based similarity scan. We never promise absolute uniqueness."
          right={
            <button
              className="btn-ghost text-med-brand"
              onClick={() => update((p) => ({ ...p, titleInputs: DEMO_INPUTS }))}
            >
              Load demo
            </button>
          }
        />
        <CardBody className="grid md:grid-cols-2 gap-4">
          {(
            [
              ["draftTitle", "Draft title (or leave blank to generate)"],
              ["researchType", "Research type"],
              ["design", "Study design"],
              ["population", "Population (PICO P)"],
              ["problem", "Condition / problem"],
              ["intervention", "Intervention / exposure / index test / model"],
              ["comparator", "Comparator (if applicable)"],
              ["outcome", "Primary outcome"],
              ["setting", "Setting / country"],
              ["timePeriod", "Time period"],
            ] as Array<[keyof TitleInputs, string]>
          ).map(([key, label]) => (
            <div key={key} className={key === "draftTitle" ? "md:col-span-2" : ""}>
              <label className="label">{label}</label>
              {key === "draftTitle" ? (
                <textarea
                  className="textarea min-h-[80px]"
                  value={inputs[key] || ""}
                  onChange={(e) => setInputs({ [key]: e.target.value } as Partial<TitleInputs>)}
                />
              ) : (
                <input
                  className="input"
                  value={inputs[key] || ""}
                  onChange={(e) => setInputs({ [key]: e.target.value } as Partial<TitleInputs>)}
                />
              )}
            </div>
          ))}

          <div className="md:col-span-2 flex flex-wrap items-center gap-2">
            <button
              className="btn-primary"
              onClick={() => generateOrRefine("generate")}
              disabled={!!busy}
            >
              {busy === "generate" && <Spinner />} Generate candidates
            </button>
            <button
              className="btn-secondary"
              onClick={() => generateOrRefine("refine")}
              disabled={!!busy || !inputs.draftTitle}
            >
              {busy === "refine" && <Spinner dark />} Refine draft title
            </button>
            <button
              className="btn-secondary"
              onClick={runNovelty}
              disabled={!!busy || !inputs.draftTitle}
            >
              {busy === "novelty" && <Spinner dark />} Check similarity
            </button>
            {err && <div className="text-sm text-med-bad">{err}</div>}
          </div>
        </CardBody>
      </Card>

      {project.titleCandidates.length > 0 && (
        <Card>
          <CardHeader title="Candidate titles" />
          <CardBody className="grid gap-3">
            {project.titleCandidates.map((c, i) => (
              <div key={i} className="border border-med-line rounded-lg p-3">
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
                          titleInputs: { ...p.titleInputs, draftTitle: c.text },
                        }))
                      }
                    >
                      Use this
                    </button>
                  </div>
                </div>
                {c.rationale && <div className="muted mt-1">{c.rationale}</div>}
                {c.warnings && c.warnings.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {c.warnings.map((w, j) => (
                      <Badge key={j} kind="warn">{w}</Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {project.titleFinal && (
        <Card>
          <CardHeader title="Selected title" right={<CopyButton text={project.titleFinal} />} />
          <CardBody>
            <div className="text-lg font-medium text-med-ink">{project.titleFinal}</div>
          </CardBody>
        </Card>
      )}

      {project.noveltyReport && <NoveltyResult report={project.noveltyReport} />}
    </div>
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
            {[s.authors?.slice(0, 3).join(", "), s.journal, s.year].filter(Boolean).join(" · ")}
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
