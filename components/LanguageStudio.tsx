"use client";

import { useMemo, useState } from "react";
import type { ProjectState } from "@/lib/types";
import {
  aiPatternHeuristics,
  originalityHeuristics,
  estimateReadability,
  type LanguageChange,
  type ReadabilityDelta,
  type AdvisorySignal,
} from "@/lib/language/editor";
import { Card, CardBody, CardHeader } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { Spinner } from "./ui/Spinner";
import { CopyButton } from "./ui/CopyButton";
import { InfoHint } from "./ui/InfoHint";

type SectionKey =
  | "introduction"
  | "methods"
  | "results"
  | "discussion"
  | "conclusion"
  | "paste";

type EditResult = {
  editedText: string;
  changes: LanguageChange[];
  preservedClaims: string[];
  registerNotes: string[];
  uncertainties: string[];
  readability: ReadabilityDelta;
};

const SECTION_OPTIONS: { key: SectionKey; label: string }[] = [
  { key: "introduction", label: "Introduction" },
  { key: "methods", label: "Methods" },
  { key: "results", label: "Results" },
  { key: "discussion", label: "Discussion" },
  { key: "conclusion", label: "Conclusion" },
  { key: "paste", label: "Paste text" },
];

function signalBadge(level: AdvisorySignal["level"]): "good" | "warn" | "bad" {
  return level === "ok" ? "good" : level === "watch" ? "warn" : "bad";
}

function SignalList({
  title,
  signals,
  disclaimer,
  hint,
}: {
  title: string;
  signals: AdvisorySignal[];
  disclaimer: string;
  hint?: { title: string; text: string };
}) {
  return (
    <div className="grid gap-2">
      <div className="label inline-flex items-center gap-1.5">
        {title}
        {hint && <InfoHint title={hint.title} text={hint.text} />}
      </div>
      <ul className="grid gap-1.5">
        {signals.map((s) => (
          <li
            key={s.id}
            className="flex items-start gap-2 border border-med-line rounded-lg p-2.5 bg-white"
          >
            <Badge kind={signalBadge(s.level)}>
              {s.level === "ok" ? "OK" : s.level === "watch" ? "Watch" : "High"}
            </Badge>
            <div className="min-w-0">
              <div className="text-sm font-medium text-med-ink">
                {s.label}
                {typeof s.value === "number" && (
                  <span className="text-med-sub font-normal"> · {s.value}</span>
                )}
              </div>
              <div className="text-xs text-med-sub">{s.detail}</div>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-med-sub leading-relaxed">{disclaimer}</p>
    </div>
  );
}

export function LanguageStudio({ project }: { project: ProjectState }) {
  const [sectionKey, setSectionKey] = useState<SectionKey>("introduction");
  const [pasted, setPasted] = useState("");
  const [variant, setVariant] = useState<"US" | "UK">("US");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<EditResult | null>(null);

  const sourceText = useMemo(() => {
    if (sectionKey === "paste") return pasted;
    return project.sections?.[sectionKey] || "";
  }, [sectionKey, pasted, project.sections]);

  // Pre-edit advisories run live over the source text (pure, no API).
  const aiPatterns = useMemo(() => aiPatternHeuristics(sourceText), [sourceText]);
  const originality = useMemo(
    () => originalityHeuristics(sourceText),
    [sourceText]
  );
  const sourceReadability = useMemo(
    () => estimateReadability(sourceText),
    [sourceText]
  );

  async function runEdit() {
    if (!sourceText.trim()) {
      setErr("Nothing to edit — select a non-empty section or paste some text.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/llm/language-edit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          text: sourceText,
          section: sectionKey === "paste" ? "pasted text" : sectionKey,
          englishVariant: variant,
        }),
      });
      const data = (await r.json()) as EditResult & { error?: string };
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      setResult(data);
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
            <span className="inline-flex items-center gap-2">
              Language Studio
              <InfoHint
                title="Editing must preserve meaning"
                text="A good copy-edit improves clarity, grammar, tone, and readability without changing what the science says — every number, statistic, citation, and claim must survive intact. The AI-pattern and originality panels are heuristic aids to flag stylistic and sourcing concerns; they are advisory only and never guarantee AI-undetectability or freedom from plagiarism, and they do not replace your own integrity checks and citation work."
              />
            </span>
          }
          subtitle="Academic language editing for clarity, grammar, tone and readability — meaning preserved. Includes heuristic AI-pattern and originality advisories."
        />
        <CardBody className="grid gap-3">
          <div
            role="note"
            className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm text-amber-900"
          >
            These tools are <strong>aids, not guarantees</strong>. They reduce
            AI-sounding patterns and improve human readability, and they flag
            potential issues — but no tool can guarantee a text will pass an AI
            detector or is free of plagiarism. You are responsible for academic
            integrity, proper citation, and disclosing any AI use per your target
            journal&apos;s policy.
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="label m-0">Source</label>
            {SECTION_OPTIONS.map((o) => (
              <button
                key={o.key}
                type="button"
                onClick={() => setSectionKey(o.key)}
                className={`pill-tab text-[11px] ${
                  sectionKey === o.key ? "pill-tab-active" : ""
                }`}
              >
                {o.label}
              </button>
            ))}
            <span className="mx-1 text-med-line">|</span>
            <button
              type="button"
              onClick={() => setVariant(variant === "US" ? "UK" : "US")}
              className="pill-tab text-[11px]"
            >
              English: {variant}
            </button>
          </div>

          {sectionKey === "paste" ? (
            <textarea
              className="textarea min-h-[160px] text-sm"
              placeholder="Paste any passage to language-edit…"
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
            />
          ) : (
            <div className="text-xs text-med-sub">
              Editing the <strong>{sectionKey}</strong> section
              {sourceText.trim()
                ? ` (${sourceText.trim().split(/\s+/).length} words).`
                : " — this section is currently empty."}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="btn-primary"
              onClick={runEdit}
              disabled={busy || !sourceText.trim()}
            >
              {busy && <Spinner />} Run language edit
            </button>
            <span className="text-xs text-med-sub inline-flex items-center gap-1.5">
              Source readability — Flesch {sourceReadability.flesch}, grade{" "}
              {sourceReadability.fleschKincaidGrade}, avg sentence{" "}
              {sourceReadability.avgSentenceLength} words
              <InfoHint
                title="What these readability numbers mean"
                text="Flesch Reading Ease runs 0–100 (higher = easier); Flesch–Kincaid grade estimates the US school grade needed to follow the text; average sentence length tracks how dense the prose is. Academic writing is naturally complex, but very long sentences and a high grade often signal passages worth simplifying. These are guides, not targets — clarity and accuracy come first."
              />
            </span>
            {err && (
              <div role="alert" className="text-sm text-med-bad">
                {err}
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Live heuristic advisories on the source text. */}
      <Card>
        <CardHeader
          title="Heuristic advisories (source)"
          subtitle="Pure local signals on the current source text. Advisory only — not detectors."
        />
        <CardBody className="grid gap-4 md:grid-cols-2">
          <SignalList
            title="AI-pattern signals"
            signals={aiPatterns.signals}
            disclaimer={aiPatterns.disclaimer}
            hint={{
              title: "Heuristic, not a detector",
              text: "These flag stylistic tics often associated with AI-generated prose (formulaic transitions, hedging boilerplate, low lexical variety) so you can revise them for a more natural human voice. They are pattern heuristics only — they cannot prove text was or was not AI-written, and reducing them is no guarantee of passing any AI detector. Disclose AI assistance per your journal's policy.",
            }}
          />
          <SignalList
            title="Originality / citation signals"
            signals={originality.signals}
            disclaimer={originality.disclaimer}
            hint={{
              title: "An integrity prompt, not a plagiarism scan",
              text: "These surface passages that may need a citation or look closely paraphrased, prompting you to check sourcing and attribution. They do not compare your text against any database, so they cannot confirm originality or guarantee zero plagiarism — run a proper similarity check and cite every source you relied on.",
            }}
          />
        </CardBody>
      </Card>

      {result && (
        <Card>
          <CardHeader
            title={
              <span className="inline-flex items-center gap-2">
                Edited text
                <InfoHint
                  title="Verify before you accept"
                  text="An automated edit can subtly shift meaning or drop a qualifier. Read the edited version against your original and confirm that every number, unit, statistic, citation, and claim is unchanged before adopting it — you remain accountable for accuracy."
                />
              </span>
            }
            subtitle="Meaning-preserving copy-edit. Review every change before accepting."
            right={<CopyButton text={result.editedText} label="Copy edited text" />}
          />
          <CardBody className="grid gap-4">
            <div className="flex flex-wrap gap-1.5">
              <Badge kind="info">
                Flesch {result.readability.before.flesch} →{" "}
                {result.readability.after.flesch} (
                {result.readability.fleschDelta >= 0 ? "+" : ""}
                {result.readability.fleschDelta})
              </Badge>
              <Badge kind="info">
                Grade {result.readability.before.fleschKincaidGrade} →{" "}
                {result.readability.after.fleschKincaidGrade} (
                {result.readability.fkGradeDelta >= 0 ? "+" : ""}
                {result.readability.fkGradeDelta})
              </Badge>
              <Badge kind="info">
                Avg sentence {result.readability.before.avgSentenceLength} →{" "}
                {result.readability.after.avgSentenceLength} words
              </Badge>
            </div>

            <pre className="text-sm bg-slate-50 border border-med-line rounded-lg p-3 whitespace-pre-wrap leading-relaxed">
{result.editedText}
            </pre>

            {result.changes.length > 0 && (
              <div className="grid gap-2">
                <div className="label">Changes ({result.changes.length})</div>
                <ul className="grid gap-2">
                  {result.changes.map((c, i) => (
                    <li
                      key={i}
                      className="border border-med-line rounded-lg p-2.5 bg-white text-sm"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Badge kind="neutral">{c.type}</Badge>
                        <span className="text-xs text-med-sub">{c.reason}</span>
                      </div>
                      <div className="grid gap-1 text-xs">
                        {c.before && (
                          <div className="text-rose-700 line-through break-words">
                            {c.before}
                          </div>
                        )}
                        {c.after && (
                          <div className="text-emerald-700 break-words">
                            {c.after}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.preservedClaims.length > 0 && (
              <div className="grid gap-1">
                <div className="label">Claims confirmed unchanged</div>
                <ul className="list-disc list-inside text-sm text-med-sub space-y-0.5">
                  {result.preservedClaims.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.registerNotes.length > 0 && (
              <div className="grid gap-1">
                <div className="label">Register notes</div>
                <ul className="list-disc list-inside text-sm text-med-sub space-y-0.5">
                  {result.registerNotes.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.uncertainties.length > 0 && (
              <div className="grid gap-1">
                <div className="label">For your review (editor was unsure)</div>
                <ul className="list-disc list-inside text-sm text-amber-800 space-y-0.5">
                  {result.uncertainties.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-[11px] text-med-sub leading-relaxed">
              An AI edit can subtly change meaning. Compare against your original,
              confirm every number, citation, and claim is intact, and remember:
              improving readability does not guarantee AI-undetectability or zero
              plagiarism. Disclose AI assistance per your journal&apos;s policy.
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
