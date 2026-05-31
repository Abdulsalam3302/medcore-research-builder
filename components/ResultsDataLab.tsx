"use client";

import { useId, useMemo, useState } from "react";
import type { ProjectState } from "@/lib/types";
import type { GeneratedOutput, UploadedDataProfile } from "@/lib/lifecycle";
import type { ResultsInterpretation } from "@/lib/results/interpret";
import { FileResourceManager } from "./FileResourceManager";
import { Badge } from "./ui/Badge";
import { CopyButton } from "./ui/CopyButton";
import { InfoHint } from "./ui/InfoHint";

type OutcomeType = "continuous" | "binary" | "time-to-event" | "count" | "other";

export function ResultsDataLab({
  project,
  update,
}: {
  project: ProjectState;
  update: (fn: (p: ProjectState) => ProjectState) => void;
}) {
  const [profiles, setProfiles] = useState<UploadedDataProfile[]>([]);
  const [outcomeType, setOutcomeType] = useState<OutcomeType>("continuous");
  const [primaryOutcome, setPrimaryOutcome] = useState(project.researchTypeAnswers.expandedNotes?.primaryOutcome || "");
  const [groups, setGroups] = useState(project.researchTypeAnswers.expandedNotes?.comparator || "");
  const [covariates, setCovariates] = useState("");
  const [outputs, setOutputs] = useState<GeneratedOutput[]>([]);
  const [interpreting, setInterpreting] = useState(false);
  const [interpretError, setInterpretError] = useState<string | null>(null);
  const [interpretation, setInterpretation] = useState<ResultsInterpretation | null>(null);
  const primaryOutcomeId = useId();
  const outcomeTypeId = useId();
  const groupsId = useId();
  const covariatesId = useId();

  const resultsText = project.sections.results || "";

  const warnings = useMemo(() => {
    const all = profiles.flatMap((p) => p.warnings);
    if (!primaryOutcome.trim()) all.push("Primary outcome not set yet.");
    if (!groups.trim()) all.push("Comparison group/exposure not set yet.");
    return all;
  }, [profiles, primaryOutcome, groups]);

  function generatePlan() {
    const plan: GeneratedOutput = {
      id: crypto.randomUUID(),
      type: "analysis-plan",
      usedSources: ["uploaded files", "study design context"],
      usedFiles: profiles.map((p) => p.name),
      humanReviewRequired: [
        "Confirm variable roles and coding decisions.",
        "Verify model assumptions and confounder strategy.",
        "Confirm clinical interpretation before submission.",
      ],
      originalityWarnings: [
        "Results narrative must be generated from your own data summary and interpretation.",
      ],
      citationWarnings: [
        "Add source citations for all external claims in Discussion and Interpretation.",
      ],
      exportFormats: ["markdown", "docx", "json"],
    };
    setOutputs((prev) => [plan, ...prev]);
  }

  function appendResultsTemplate() {
    const draft = [
      "## Results (Data-informed draft)",
      "",
      `Primary outcome: ${primaryOutcome || "[author: define primary outcome]"}`,
      `Outcome type: ${outcomeType}`,
      `Comparison groups/exposures: ${groups || "[author: define groups or exposure]"}`,
      `Covariates/confounders: ${covariates || "[author: list key confounders]"}`,
      "",
      "### Data quality summary",
      "- Missing values: [author: fill from data profile]",
      "- Duplicates: [author: confirm]",
      "- Outliers/impossible values: [author: confirm]",
      "",
      "### Descriptive findings",
      "- Sample size and baseline characteristics: [author: insert Table 1 summary]",
      "- Outcome distribution: [author: insert descriptive stats with CI where available]",
      "",
      "### Main analysis",
      "- Primary comparison effect size with 95% CI and p value: [author: fill]",
      "- Sensitivity or adjusted model summary: [author: fill]",
      "",
      "### Interpretation (cautious and design-aware)",
      "- Clinical meaning: [author: fill]",
      "- Limitations from data quality: [author: fill]",
      "- Avoid causal overstatement for non-randomized designs.",
    ].join("\n");

    update((p) => ({
      ...p,
      sections: { ...p.sections, results: draft },
    }));
  }

  async function interpretResults() {
    setInterpreting(true);
    setInterpretError(null);
    setInterpretation(null);
    try {
      if (!resultsText.trim()) {
        throw new Error(
          "No Results text yet — write or scaffold a Results section first."
        );
      }
      const designLabel =
        project.researchTypeResult?.primaryGuidelineName ||
        project.researchTypeResult?.designId ||
        undefined;
      const dataContext = [
        profiles.length ? `Uploaded files: ${profiles.map((p) => p.name).join(", ")}` : "",
        covariates.trim() ? `Covariates/confounders: ${covariates}` : "",
      ]
        .filter(Boolean)
        .join(". ");
      const res = await fetch("/api/llm/interpret-results", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          resultsText,
          dataContext: dataContext || undefined,
          designLabel,
          primaryOutcome: primaryOutcome || undefined,
          outcomeType,
          groups: groups || undefined,
          randomized: /random/i.test(designLabel || ""),
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || `HTTP ${res.status}`);
      setInterpretation(j as ResultsInterpretation);
    } catch (e) {
      setInterpretError(e instanceof Error ? e.message : String(e));
    } finally {
      setInterpreting(false);
    }
  }

  return (
    <div className="grid gap-5">
      <section className="card-elevated">
        <div className="card-header">
          <div>
            <div className="eyebrow">Analysis & Results Lab</div>
            <h2 className="section-title text-[16px]">Ingest files and build manuscript-ready results</h2>
          </div>
        </div>
        <div className="p-5 grid gap-4">
          <div className="text-sm text-med-sub inline-flex items-start gap-1.5">
            <span>
              Read uploaded data, confirm variable roles, and generate structured outputs for Methods/Results/Tables/Figures.
              Never upload identifiable patient data.
            </span>
            <InfoHint
              title="Upload de-identified data only"
              text="Strip every direct and indirect identifier — names, MRNs, dates of birth, addresses, rare combinations — before uploading. Sharing identifiable patient data without authorisation breaches privacy law (HIPAA/GDPR) and your IRB approval. When in doubt, aggregate or remove the field."
            />
          </div>
          <FileResourceManager onProfilesChange={setProfiles} />

          <div className="card">
            <div className="card-body grid md:grid-cols-2 gap-3">
              <div>
                <label className="label inline-flex items-center gap-1.5" htmlFor={primaryOutcomeId}>
                  Primary outcome
                  <InfoHint
                    title="Define variable roles"
                    text="Naming your primary outcome, its type, comparison groups, and confounders tells the tool how to infer each variable's role and which analysis fits. The primary outcome should be the single pre-specified endpoint your study is powered to answer — fixing it now guards against cherry-picking a more flattering result later."
                  />
                </label>
                <input id={primaryOutcomeId} className="input" value={primaryOutcome} onChange={(e) => setPrimaryOutcome(e.target.value)} />
              </div>
              <div>
                <label className="label inline-flex items-center gap-1.5" htmlFor={outcomeTypeId}>
                  Outcome type
                  <InfoHint
                    title="Why outcome type drives the test"
                    text="The outcome's data type decides the right analysis: continuous outcomes use means and mean differences, binary use risk/odds ratios, time-to-event use hazard ratios and survival curves, counts use rate ratios. Mislabelling it here leads to the wrong effect measure and a misleading result, so pick the type that matches how the variable was actually measured."
                  />
                </label>
                <select id={outcomeTypeId} className="input" value={outcomeType} onChange={(e) => setOutcomeType(e.target.value as OutcomeType)}>
                  <option value="continuous">Continuous</option>
                  <option value="binary">Binary</option>
                  <option value="time-to-event">Time-to-event</option>
                  <option value="count">Count</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="label" htmlFor={groupsId}>Comparison groups / exposure</label>
                <input id={groupsId} className="input" value={groups} onChange={(e) => setGroups(e.target.value)} />
              </div>
              <div>
                <label className="label" htmlFor={covariatesId}>Covariates / confounders</label>
                <input id={covariatesId} className="input" value={covariates} onChange={(e) => setCovariates(e.target.value)} />
              </div>
            </div>
          </div>

          {warnings.length > 0 && (
            <div className="border border-amber-200 bg-amber-50 rounded-lg p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-amber-800 mb-1">
                Human review required before final analysis
              </div>
              <ul className="list-disc list-inside text-sm text-amber-900 space-y-1">
                {warnings.map((w, i) => (
                  <li key={`${w}-${i}`}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-primary" onClick={generatePlan}>
              Generate analysis plan
            </button>
            <InfoHint
              title="Generate analysis plan"
              text="Drafts a pre-specified plan — variable roles, model choice, confounder strategy — from your uploaded files and design context. Writing it before you run the analysis is what keeps the study honest: it pins down what you'll test in advance, so the final stats can't drift toward whatever looks best. It still flags the decisions a human must confirm."
            />
            <button type="button" className="btn-secondary" onClick={appendResultsTemplate}>
              Create results draft scaffold
            </button>
            <InfoHint
              title="Results draft scaffold"
              text="Inserts a correctly-ordered Results skeleton — data quality, descriptives, main analysis, cautious interpretation — with every number left as a labelled [author: …] placeholder. Nothing is invented: it gives you the structure reviewers expect while you supply the real figures from your own analysis."
            />
            <button
              type="button"
              className="btn-secondary"
              onClick={interpretResults}
              disabled={interpreting || !resultsText.trim()}
            >
              {interpreting ? "Interpreting…" : "Interpret results (AI-assisted)"}
            </button>
            <InfoHint
              title="Interpret results"
              text="Reframes your Results text around effect sizes with 95% confidence intervals rather than bare p-values: an effect size says how large and how precise the finding is, while a p-value alone says nothing about clinical importance. The AI assists with phrasing — it can misread numbers, so verify every estimate, CI, and p-value against your own analysis."
            />
          </div>

          {interpretError && (
            <div className="badge-bad" role="alert">
              {interpretError}
            </div>
          )}

          {interpretation && (
            <InterpretationPanel data={interpretation} />
          )}
        </div>
      </section>

      {outputs.length > 0 && (
        <section className="card">
          <div className="card-header">
            <h3 className="section-title text-[15px]">Generated outputs</h3>
          </div>
          <div className="p-5 grid gap-3">
            {outputs.map((o) => (
              <div key={o.id} className="border border-med-line rounded-lg p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium text-sm text-med-ink">{o.type}</div>
                  <Badge kind="info">{o.exportFormats.join(", ")}</Badge>
                </div>
                <div className="text-xs text-med-sub mt-2">
                  Files used: {o.usedFiles.length ? o.usedFiles.join(", ") : "none uploaded"}
                </div>
                <ul className="list-disc list-inside text-xs text-med-sub mt-2">
                  {o.humanReviewRequired.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StringList({
  title,
  items,
  tone = "neutral",
}: {
  title: string;
  items: string[];
  tone?: "neutral" | "warn" | "info";
}) {
  if (!items?.length) return null;
  const toneClass =
    tone === "warn"
      ? "text-amber-900"
      : tone === "info"
      ? "text-med-ink"
      : "text-med-sub";
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <div className="label">{title}</div>
        <CopyButton text={items.join("\n")} label="Copy" />
      </div>
      <ul className={`list-disc list-inside text-sm space-y-1 ${toneClass}`}>
        {items.map((it, i) => (
          <li key={`${it}-${i}`}>{it}</li>
        ))}
      </ul>
    </div>
  );
}

function FindingCard({
  f,
}: {
  f: ResultsInterpretation["findings"][number];
}) {
  const sigBadge =
    f.statisticalSignificance === "yes"
      ? "info"
      : f.statisticalSignificance === "no"
      ? "neutral"
      : "warn";
  const copyText = [
    `Finding: ${f.label}`,
    f.effectMeasure ? `Effect measure: ${f.effectMeasure}` : "Effect measure: not stated",
    f.pointEstimate ? `Point estimate: ${f.pointEstimate}` : "Point estimate: not stated",
    f.confidenceInterval ? `95% CI: ${f.confidenceInterval}` : "95% CI: not stated",
    f.pValue ? `p-value: ${f.pValue}` : "p-value: not stated",
    `Statistical significance: ${f.statisticalSignificance}`,
    `Interpretation: ${f.plainLanguage}`,
    `Clinical significance: ${f.clinicalSignificance}`,
    ...(f.cautions?.length ? [`Cautions: ${f.cautions.join("; ")}`] : []),
  ].join("\n");
  return (
    <div className="border border-med-line rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="font-medium text-sm text-med-ink">{f.label}</div>
        <div className="flex items-center gap-2">
          <Badge kind={sigBadge as "info" | "neutral" | "warn"}>
            stat. sig: {f.statisticalSignificance}
          </Badge>
          {f.missingInputs && <Badge kind="warn">missing inputs</Badge>}
          <CopyButton text={copyText} label="Copy finding" />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-med-sub">
        <div>
          <span className="font-medium text-med-ink">Effect: </span>
          {f.effectMeasure || "—"}
          {f.pointEstimate ? ` = ${f.pointEstimate}` : ""}
        </div>
        <div>
          <span className="font-medium text-med-ink">95% CI: </span>
          {f.confidenceInterval || "not reported"}
        </div>
        <div>
          <span className="font-medium text-med-ink">p-value: </span>
          {f.pValue || "not reported"}
        </div>
      </div>
      <p className="text-sm text-med-ink">{f.plainLanguage}</p>
      {f.clinicalSignificance && (
        <p className="text-sm text-med-sub">
          <span className="font-medium text-med-ink">Clinical significance: </span>
          {f.clinicalSignificance}
        </p>
      )}
      {f.cautions?.length > 0 && (
        <ul className="list-disc list-inside text-xs text-amber-900 space-y-1">
          {f.cautions.map((c, i) => (
            <li key={`${c}-${i}`}>{c}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function InterpretationPanel({ data }: { data: ResultsInterpretation }) {
  return (
    <div className="border border-med-line rounded-lg p-4 space-y-4 bg-slate-50/40">
      <div className="border border-amber-300 bg-amber-50 rounded-lg p-3" role="note">
        <div className="text-xs font-semibold uppercase tracking-wide text-amber-800">
          AI-assisted — verify every number
        </div>
        <p className="text-sm text-amber-900 mt-1">
          This interpretation is generated by an AI assistant from your Results
          text only. It may misread or omit values. Confirm every effect size,
          confidence interval, and p-value against your source analysis before
          using any of this in a manuscript.
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between gap-2">
          <h3 className="section-title text-[15px]">Overall summary</h3>
          <CopyButton text={data.overallSummary} label="Copy summary" />
        </div>
        <p className="text-sm text-med-ink mt-1">{data.overallSummary}</p>
      </div>

      {data.findings?.length > 0 && (
        <div className="space-y-2">
          <h3 className="section-title text-[15px]">Findings</h3>
          <div className="grid gap-2">
            {data.findings.map((f, i) => (
              <FindingCard key={`${f.label}-${i}`} f={f} />
            ))}
          </div>
        </div>
      )}

      <StringList title="Effect-size emphasis (effect + CI, not p-values)" items={data.effectSizeEmphasis} tone="info" />
      <StringList title="Cautions" items={data.cautions} tone="warn" />
      <StringList title="Limitations" items={data.limitations} tone="warn" />
      <StringList title="Missing information (author must supply)" items={data.missingInformation} tone="warn" />
      <StringList title="Human review required" items={data.humanReviewRequired} tone="warn" />

      {data.causalLanguageNote && (
        <div>
          <div className="flex items-center justify-between gap-2">
            <div className="label">Causal-language note</div>
            <CopyButton text={data.causalLanguageNote} label="Copy" />
          </div>
          <p className="text-sm text-med-ink">{data.causalLanguageNote}</p>
        </div>
      )}
    </div>
  );
}
