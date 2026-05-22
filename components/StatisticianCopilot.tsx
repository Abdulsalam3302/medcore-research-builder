"use client";

import { useMemo, useState } from "react";
import type { ExpandedNotes } from "@/lib/types";
import {
  descriptive,
  generateSnippets,
  leveneEqualVariance,
  missingDataCheck,
  normalityScreen,
  powerTwoProportions,
  powerTwoSample,
  type CopilotInput,
  type Snippet,
} from "@/lib/agents/statCopilot";
import { Card, CardBody, CardHeader } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { CopyButton } from "./ui/CopyButton";

type Tab = "assumptions" | "power" | "snippets";

export function StatisticianCopilot({
  designId,
  expandedNotes,
}: {
  designId?: string;
  expandedNotes?: ExpandedNotes;
} = {}) {
  const [tab, setTab] = useState<Tab>("assumptions");
  return (
    <div className="grid gap-5">
      {(designId || expandedNotes?.primaryOutcome) && (
        <div className="text-xs text-med-sub rounded-lg border border-med-line bg-med-bg/50 px-3 py-2">
          Study context: {designId || "no design selected"}
          {expandedNotes?.primaryOutcome ? ` · outcome: ${expandedNotes.primaryOutcome}` : ""}
        </div>
      )}
      <Card>
        <CardHeader
          title="Statistician copilot"
          subtitle="Quick assumption checks, sample-size estimates, and code snippets for R / Python / Stata. Use for sanity — confirmatory analysis should still be reviewed by a statistician."
        />
        <CardBody>
          <div className="flex gap-1 flex-wrap">
            {(["assumptions", "power", "snippets"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`pill-tab ${tab === t ? "pill-tab-active" : ""}`}
              >
                {t === "assumptions"
                  ? "Assumption checks"
                  : t === "power"
                  ? "Power / sample size"
                  : "Code snippets"}
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      {tab === "assumptions" ? <Assumptions /> : null}
      {tab === "power" ? <Power /> : null}
      {tab === "snippets" ? <Snippets /> : null}
    </div>
  );
}

function Assumptions() {
  const [a, setA] = useState("12,14,11,13,15,12,16,13,14,15,17,12,11");
  const [b, setB] = useState("18,20,17,19,21,16,22,18,20,19,17,21,20");
  const arrA = parseNumbers(a);
  const arrB = parseNumbers(b);
  const dA = useMemo(() => descriptive(arrA), [arrA]);
  const dB = useMemo(() => descriptive(arrB), [arrB]);
  const checks = useMemo(
    () => [
      normalityScreen(arrA),
      normalityScreen(arrB),
      leveneEqualVariance(arrA, arrB),
      missingDataCheck([...arrA, ...arrB]),
    ],
    [arrA, arrB],
  );

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader title="Group A — paste comma/space-separated values" />
        <CardBody className="grid gap-2">
          <textarea
            className="textarea text-[13px] min-h-[100px]"
            value={a}
            onChange={(e) => setA(e.target.value)}
          />
          <DescriptiveTable d={dA} />
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Group B" />
        <CardBody className="grid gap-2">
          <textarea
            className="textarea text-[13px] min-h-[100px]"
            value={b}
            onChange={(e) => setB(e.target.value)}
          />
          <DescriptiveTable d={dB} />
        </CardBody>
      </Card>
      <div className="lg:col-span-2 grid gap-2">
        {checks.map((c, i) => (
          <div
            key={i}
            className={`rounded-lg border p-3 ${
              c.ok
                ? "border-emerald-200 bg-emerald-50/40"
                : "border-amber-200 bg-amber-50/40"
            }`}
          >
            <div className="flex items-center gap-2">
              <Badge kind={c.ok ? "good" : "warn"}>{c.ok ? "ok" : "flag"}</Badge>
              <span className="font-semibold text-[13px] text-med-ink">{c.label}</span>
            </div>
            <p className="text-[12.5px] text-med-inkSoft mt-1 leading-relaxed">{c.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Power() {
  const [tab, setTab] = useState<"means" | "props">("means");
  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader title="Power calculator" />
        <CardBody>
          <div className="flex gap-1 mb-3">
            <button
              onClick={() => setTab("means")}
              className={`pill-tab ${tab === "means" ? "pill-tab-active" : ""}`}
            >
              Two means (t-test)
            </button>
            <button
              onClick={() => setTab("props")}
              className={`pill-tab ${tab === "props" ? "pill-tab-active" : ""}`}
            >
              Two proportions
            </button>
          </div>
          {tab === "means" ? <PowerMeans /> : <PowerProps />}
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="What you should report" />
        <CardBody>
          <ul className="text-[13px] text-med-inkSoft space-y-2 leading-relaxed list-disc list-inside">
            <li>Primary outcome and effect size that is clinically meaningful, not just detectable.</li>
            <li>α (usually 0.05, two-sided) and power (≥ 0.80).</li>
            <li>Method (Lehr's approximation, normal approximation for proportions, or G*Power).</li>
            <li>Anticipated drop-out / missingness — inflate the sample to compensate.</li>
            <li>Reference for the effect size you assumed (prior trial, pilot, meta-analysis).</li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}

function PowerMeans() {
  const [d, setD] = useState(0.5);
  const [alpha, setAlpha] = useState(0.05);
  const [power, setPower] = useState(0.8);
  const r = powerTwoSample(d, alpha, power);
  return (
    <div className="grid gap-2 text-[13px]">
      <Field label={`Cohen's d (${d})`}>
        <input
          type="range"
          min={0.1}
          max={1.5}
          step={0.05}
          value={d}
          onChange={(e) => setD(Number(e.target.value))}
        />
      </Field>
      <Field label={`α (${alpha})`}>
        <input
          type="range"
          min={0.001}
          max={0.1}
          step={0.005}
          value={alpha}
          onChange={(e) => setAlpha(Number(e.target.value))}
        />
      </Field>
      <Field label={`Power (${power})`}>
        <input
          type="range"
          min={0.5}
          max={0.99}
          step={0.01}
          value={power}
          onChange={(e) => setPower(Number(e.target.value))}
        />
      </Field>
      <div className="rounded-lg border border-med-line bg-slate-50/50 p-3">
        <div className="font-semibold text-med-ink">{r.perGroup} per group · {r.total} total</div>
        <div className="text-[12px] text-med-sub mt-0.5">{r.method}</div>
      </div>
    </div>
  );
}

function PowerProps() {
  const [p1, setP1] = useState(0.2);
  const [p2, setP2] = useState(0.1);
  const [alpha, setAlpha] = useState(0.05);
  const [power, setPower] = useState(0.8);
  const r = powerTwoProportions(p1, p2, alpha, power);
  return (
    <div className="grid gap-2 text-[13px]">
      <Field label={`p₁ (${p1})`}>
        <input
          type="range"
          min={0.01}
          max={0.95}
          step={0.01}
          value={p1}
          onChange={(e) => setP1(Number(e.target.value))}
        />
      </Field>
      <Field label={`p₂ (${p2})`}>
        <input
          type="range"
          min={0.01}
          max={0.95}
          step={0.01}
          value={p2}
          onChange={(e) => setP2(Number(e.target.value))}
        />
      </Field>
      <Field label={`α (${alpha})`}>
        <input
          type="range"
          min={0.001}
          max={0.1}
          step={0.005}
          value={alpha}
          onChange={(e) => setAlpha(Number(e.target.value))}
        />
      </Field>
      <Field label={`Power (${power})`}>
        <input
          type="range"
          min={0.5}
          max={0.99}
          step={0.01}
          value={power}
          onChange={(e) => setPower(Number(e.target.value))}
        />
      </Field>
      <div className="rounded-lg border border-med-line bg-slate-50/50 p-3">
        <div className="font-semibold text-med-ink">{r.perGroup} per group · {r.total} total</div>
        <div className="text-[12px] text-med-sub mt-0.5">{r.method}</div>
      </div>
    </div>
  );
}

function Snippets() {
  const [input, setInput] = useState<CopilotInput>({
    designKind: "regression-logistic",
    outcomeName: "outcome",
    exposureName: "exposure",
    covariates: ["age", "sex"],
  });
  const snippets = useMemo<Snippet[]>(() => generateSnippets(input), [input]);

  return (
    <div className="grid lg:grid-cols-[320px_1fr] gap-4">
      <Card>
        <CardHeader title="Design" />
        <CardBody className="grid gap-2 text-[13px]">
          <Field label="Design / test">
            <select
              className="input"
              value={input.designKind}
              onChange={(e) =>
                setInput((p) => ({
                  ...p,
                  designKind: e.target.value as CopilotInput["designKind"],
                }))
              }
            >
              <option value="twoSample">Two-sample (means)</option>
              <option value="paired">Paired (means)</option>
              <option value="anova">ANOVA</option>
              <option value="chiSquare">Chi-square (counts)</option>
              <option value="fisher">Fisher's exact (small counts)</option>
              <option value="correlation">Correlation</option>
              <option value="regression-linear">Linear regression</option>
              <option value="regression-logistic">Logistic regression</option>
              <option value="survival-cox">Cox survival</option>
            </select>
          </Field>
          <Field label="Outcome variable">
            <input
              className="input"
              value={input.outcomeName || ""}
              onChange={(e) => setInput((p) => ({ ...p, outcomeName: e.target.value }))}
            />
          </Field>
          <Field label="Exposure / grouping variable">
            <input
              className="input"
              value={input.exposureName || ""}
              onChange={(e) => setInput((p) => ({ ...p, exposureName: e.target.value }))}
            />
          </Field>
          <Field label="Covariates (comma-separated)">
            <input
              className="input"
              value={(input.covariates || []).join(", ")}
              onChange={(e) =>
                setInput((p) => ({
                  ...p,
                  covariates: e.target.value
                    .split(/,/)
                    .map((s) => s.trim())
                    .filter(Boolean),
                }))
              }
            />
          </Field>
        </CardBody>
      </Card>
      <div className="grid gap-3">
        {snippets.map((s) => (
          <Card key={s.language}>
            <CardHeader title={s.language} right={<CopyButton text={s.code} label="Copy" />} />
            <CardBody>
              <pre className="text-[12.5px] bg-slate-50 border border-med-line rounded-md p-3 overflow-x-auto whitespace-pre-wrap">
                {s.code}
              </pre>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}

function DescriptiveTable({ d }: { d: ReturnType<typeof descriptive> }) {
  if (d.n === 0) return <div className="muted text-[12px]">No numeric values.</div>;
  return (
    <div className="grid grid-cols-4 gap-2 text-[12px]">
      <KV k="n" v={d.n} />
      <KV k="mean" v={fmt(d.mean)} />
      <KV k="sd" v={fmt(d.sd)} />
      <KV k="missing %" v={fmt(d.missingPct, 1)} />
      <KV k="min" v={fmt(d.min)} />
      <KV k="Q1" v={fmt(d.q1)} />
      <KV k="median" v={fmt(d.median)} />
      <KV k="Q3" v={fmt(d.q3)} />
    </div>
  );
}

function KV({ k, v }: { k: string; v: string | number }) {
  return (
    <div className="rounded border border-med-line bg-white px-2 py-1">
      <div className="text-[10px] uppercase tracking-wide text-med-sub">{k}</div>
      <div className="font-mono text-[12px] text-med-ink">{v}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-med-sub mb-1">{label}</div>
      {children}
    </div>
  );
}

function parseNumbers(s: string): number[] {
  return s
    .split(/[\s,;]+/)
    .map((t) => Number(t))
    .filter((x) => Number.isFinite(x));
}

function fmt(v: number, dp = 2): string {
  if (!Number.isFinite(v)) return "—";
  return v.toFixed(dp);
}
