"use client";

import { useState } from "react";
import type { ProjectState, ResearchTypeAnswers, ResearchTypeResult } from "@/lib/types";
import { Card, CardBody, CardHeader } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { Spinner } from "./ui/Spinner";

const DESIGN_FAMILIES = [
  "Randomized controlled trial (RCT)",
  "Cohort study",
  "Case-control study",
  "Cross-sectional study",
  "Systematic review / meta-analysis",
  "Scoping review",
  "Diagnostic accuracy study",
  "Prognostic / prediction model study",
  "Case report",
  "Case series",
  "Clinical practice guideline",
  "Qualitative study",
  "Mixed-methods study",
  "Animal / preclinical study",
  "Quality improvement project",
  "Economic evaluation",
  "Other / custom",
];

const FEATURES = [
  "Artificial intelligence / machine learning",
  "Diagnostic test",
  "Prediction model",
  "Digital / eHealth intervention",
  "Routinely collected health data / registry",
  "Equity-focused analysis",
  "Harms / adverse events focus",
  "Pediatric population",
  "Surgical intervention",
  "Imaging study",
  "Genetic / molecular",
  "Detailed intervention description (TIDieR)",
];

export function ResearchTypeWizard({
  project,
  update,
}: {
  project: ProjectState;
  update: (fn: (p: ProjectState) => ProjectState) => void;
}) {
  const answers = project.researchTypeAnswers;
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function setAns(patch: Partial<ResearchTypeAnswers>) {
    update((p) => ({ ...p, researchTypeAnswers: { ...p.researchTypeAnswers, ...patch } }));
  }
  function toggleFeature(name: string) {
    const cur = new Set(answers.features || []);
    if (cur.has(name)) cur.delete(name);
    else cur.add(name);
    setAns({ features: Array.from(cur) });
  }

  async function recommend() {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/llm/research-type", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = (await r.json()) as ResearchTypeResult & { _source?: string; error?: string };
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      update((p) => ({ ...p, researchTypeResult: data }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const result = project.researchTypeResult;

  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader
          title="Research Type Wizard"
          subtitle="Answer a few questions to pick the right EQUATOR reporting guideline."
        />
        <CardBody className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="label">Study design family</label>
            <select
              className="input"
              value={answers.designFamily || ""}
              onChange={(e) => setAns({ designFamily: e.target.value })}
            >
              <option value="">— Select —</option>
              {DESIGN_FAMILIES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Target journal / style (optional)</label>
            <input
              className="input"
              value={answers.targetJournal || ""}
              onChange={(e) => setAns({ targetJournal: e.target.value })}
              placeholder="e.g. BMJ, JAMA, Lancet"
            />
          </div>

          <div className="md:col-span-2 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            <Checkbox
              checked={!!answers.isOriginalResearch}
              onChange={(v) => setAns({ isOriginalResearch: v })}
              label="Original research"
            />
            <Checkbox
              checked={!!answers.isProtocol}
              onChange={(v) => setAns({ isProtocol: v })}
              label="Protocol (not completed study)"
            />
            <Checkbox
              checked={!!answers.isReview}
              onChange={(v) => setAns({ isReview: v })}
              label="Review / synthesis"
            />
            <Checkbox
              checked={!!answers.isCaseReport}
              onChange={(v) => setAns({ isCaseReport: v })}
              label="Case report / small series"
            />
            <Checkbox
              checked={!!answers.isGuideline}
              onChange={(v) => setAns({ isGuideline: v })}
              label="Clinical practice guideline"
            />
            <Checkbox
              checked={!!answers.isQualityImprovement}
              onChange={(v) => setAns({ isQualityImprovement: v })}
              label="Quality improvement"
            />
            <Checkbox
              checked={!!answers.isEconomic}
              onChange={(v) => setAns({ isEconomic: v })}
              label="Economic evaluation"
            />
            <Checkbox
              checked={!!answers.isAnimal}
              onChange={(v) => setAns({ isAnimal: v })}
              label="Animal / preclinical"
            />
            <Checkbox
              checked={!!answers.isQualitative}
              onChange={(v) => setAns({ isQualitative: v })}
              label="Qualitative"
            />
            <Checkbox
              checked={!!answers.isMixedMethods}
              onChange={(v) => setAns({ isMixedMethods: v })}
              label="Mixed methods"
            />
            <Checkbox
              checked={!!answers.hasHumanParticipants}
              onChange={(v) => setAns({ hasHumanParticipants: v })}
              label="Human participants"
            />
            <Checkbox
              checked={!!answers.ethicsRequired}
              onChange={(v) => setAns({ ethicsRequired: v })}
              label="Ethics approval required"
            />
            <Checkbox
              checked={!!answers.registrationRequired}
              onChange={(v) => setAns({ registrationRequired: v })}
              label="Trial / review registration required"
            />
          </div>

          <div className="md:col-span-2">
            <label className="label">Special features (optional)</label>
            <div className="flex flex-wrap gap-2">
              {FEATURES.map((f) => {
                const on = (answers.features || []).includes(f);
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => toggleFeature(f)}
                    className={`pill-tab ${on ? "pill-tab-active" : ""}`}
                  >
                    {f}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="label">Notes for the assistant (optional)</label>
            <textarea
              className="textarea"
              value={answers.notes || ""}
              onChange={(e) => setAns({ notes: e.target.value })}
              placeholder="Anything unusual about your design, population, or constraints."
            />
          </div>

          <div className="md:col-span-2 flex items-center gap-3">
            <button className="btn-primary" onClick={recommend} disabled={busy || !answers.designFamily}>
              {busy ? <Spinner /> : null}
              Recommend reporting guideline
            </button>
            {err && <div className="text-sm text-med-bad">{err}</div>}
          </div>
        </CardBody>
      </Card>

      {result && (
        <Card>
          <CardHeader
            title="Recommended guideline"
            subtitle={result.primaryGuidelineName}
            right={
              <Badge kind="info">{result.requiredSections.length} required sections</Badge>
            }
          />
          <CardBody className="grid gap-4">
            {result.warnings.length > 0 && (
              <div className="border border-amber-200 bg-amber-50 rounded-lg p-3 text-sm text-amber-800">
                <div className="font-semibold mb-1">Warnings</div>
                <ul className="list-disc list-inside space-y-1">
                  {result.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
            {result.notes && <p className="muted">{result.notes}</p>}
            {result.possibleExtensionIds.length > 0 && (
              <div>
                <div className="label">Possible extensions / sub-guidelines</div>
                <div className="flex flex-wrap gap-2">
                  {result.possibleExtensionIds.map((e) => (
                    <Badge key={e} kind="neutral">{e}</Badge>
                  ))}
                </div>
              </div>
            )}
            <div>
              <div className="label">Required manuscript sections</div>
              <div className="flex flex-wrap gap-2">
                {result.requiredSections.map((s) => (
                  <Badge key={s} kind="info">{s}</Badge>
                ))}
              </div>
            </div>
            <div>
              <div className="label">Section-specific checklist prompts</div>
              <div className="grid md:grid-cols-2 gap-3">
                {Object.entries(result.sectionChecklists).map(([sec, items]) => (
                  <div key={sec} className="border border-med-line rounded-lg p-3 bg-slate-50">
                    <div className="text-sm font-semibold capitalize mb-1.5 text-med-ink">
                      {sec}
                    </div>
                    <ul className="space-y-1 text-sm text-med-sub list-disc list-inside">
                      {(items as string[]).map((it, i) => (
                        <li key={i}>{it}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded hover:bg-slate-50">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-med-brand"
      />
      <span>{label}</span>
    </label>
  );
}
