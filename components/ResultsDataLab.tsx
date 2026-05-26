"use client";

import { useMemo, useState } from "react";
import type { ProjectState } from "@/lib/types";
import type { GeneratedOutput, UploadedDataProfile } from "@/lib/lifecycle";
import { FileResourceManager } from "./FileResourceManager";
import { Badge } from "./ui/Badge";

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
          <div className="text-sm text-med-sub">
            Read uploaded data, confirm variable roles, and generate structured outputs for Methods/Results/Tables/Figures.
            Never upload identifiable patient data.
          </div>
          <FileResourceManager onProfilesChange={setProfiles} />

          <div className="card">
            <div className="card-body grid md:grid-cols-2 gap-3">
              <div>
                <label className="label">Primary outcome</label>
                <input className="input" value={primaryOutcome} onChange={(e) => setPrimaryOutcome(e.target.value)} />
              </div>
              <div>
                <label className="label">Outcome type</label>
                <select className="input" value={outcomeType} onChange={(e) => setOutcomeType(e.target.value as OutcomeType)}>
                  <option value="continuous">Continuous</option>
                  <option value="binary">Binary</option>
                  <option value="time-to-event">Time-to-event</option>
                  <option value="count">Count</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="label">Comparison groups / exposure</label>
                <input className="input" value={groups} onChange={(e) => setGroups(e.target.value)} />
              </div>
              <div>
                <label className="label">Covariates / confounders</label>
                <input className="input" value={covariates} onChange={(e) => setCovariates(e.target.value)} />
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
            <button className="btn-primary" onClick={generatePlan}>
              Generate analysis plan
            </button>
            <button className="btn-secondary" onClick={appendResultsTemplate}>
              Create results draft scaffold
            </button>
          </div>
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
