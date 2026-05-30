"use client";

import { useState } from "react";
import type { ExpandedNotes } from "@/lib/types";
import { PlotlyPreview } from "./PlotlyPreview";
import { CopyButton } from "./ui/CopyButton";
import { InfoHint } from "./ui/InfoHint";
import {
  buildBaselineTableScaffold,
  type BaselineTableVariable,
} from "@/lib/agents/figureSpecifier";

type Tab =
  | "descriptive"
  | "twoSample"
  | "chi"
  | "correlation"
  | "recommend"
  | "figure"
  | "table";

type FigurePublicationMeta = {
  figureType: string;
  caption: string;
  legend: string;
  footnotes: string[];
  combinedMarkdown: string;
};

export function StatsAndFigures({
  designId,
  manuscriptType,
  expandedNotes,
  embedded,
}: {
  designId?: string;
  manuscriptType?: string;
  expandedNotes?: ExpandedNotes;
  embedded?: boolean;
} = {}) {
  const [tab, setTab] = useState<Tab>(designId ? "recommend" : "descriptive");
  return (
    <div className="space-y-4">
      {!embedded && (
        <div>
          <div className="eyebrow">Stats & figures</div>
          <h1 className="display-title inline-flex items-center gap-2">
            Statistical analysis & figure specs
            <InfoHint
              side="bottom"
              title="Why analysis and figures together"
              text="Your analysis plan and your figures should answer the same question. Choosing the test from the outcome type and design — and then a figure that shows that estimate with its uncertainty — keeps results, captions, and claims aligned. Treat outputs here as a quick check; re-run confirmatory analyses in R/Stata/Python."
            />
          </h1>
          <p className="muted mt-1">
            Run quick descriptives and classical tests, generate Plotly-compatible
            figure specs, and get test recommendations from study design. For
            confirmatory analyses, re-run in R/Stata/Python.
          </p>
        </div>
      )}
      {embedded && (
        <div className="text-xs text-med-sub">
          Pre-populated with your study context — {designId || "no design selected"}
          {manuscriptType ? ` · ${manuscriptType.replace(/_/g, " ")}` : ""}
          {expandedNotes?.primaryOutcome ? ` · outcome: ${expandedNotes.primaryOutcome}` : ""}
        </div>
      )}
      <div className="flex gap-1 flex-wrap">
        {(
          [
            ["descriptive", "Descriptive"],
            ["twoSample", "Two-sample / paired t"],
            ["chi", "Chi-square / 2×2"],
            ["correlation", "Correlation"],
            ["recommend", "Test recommender"],
            ["figure", "Figure spec"],
            ["table", "Table scaffold"],
          ] as Array<[Tab, string]>
        ).map(([k, label]) => (
          <button
            key={k}
            className={`pill-tab ${tab === k ? "pill-tab-active" : ""}`}
            onClick={() => setTab(k)}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "descriptive" && <Descriptive />}
      {tab === "twoSample" && <TwoSample />}
      {tab === "chi" && <ChiSquare />}
      {tab === "correlation" && <Correlation />}
      {tab === "recommend" && (
        <Recommender
          presetDesign={designId}
          presetOutcome={expandedNotes?.primaryOutcome}
        />
      )}
      {tab === "figure" && <FigureSpec />}
      {tab === "table" && <TableScaffold />}
    </div>
  );
}

function PublicationMetaBlock({ meta }: { meta: FigurePublicationMeta }) {
  return (
    <div className="border border-med-line rounded-lg p-3 space-y-3 bg-slate-50/40">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="text-sm font-semibold text-med-ink inline-flex items-center gap-1.5">
          Recommended figure: {meta.figureType}
          <InfoHint
            title="Why this figure type fits"
            text="A figure should match the estimate it displays: forest plots show effect sizes with CIs across studies/subgroups, Kaplan–Meier curves show time-to-event, box/violin plots show distributions, and scatter shows associations. Choosing the form that encodes your actual estimate and its uncertainty lets readers judge the result, not just its direction."
          />
        </div>
        <CopyButton text={meta.combinedMarkdown} label="Copy all" />
      </div>
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="label inline-flex items-center gap-1.5">
            Caption
            <InfoHint
              title="A caption must stand alone"
              text="Readers and reviewers often read figures out of context, so the caption has to be self-contained: what is shown, the sample size (n), the test or model used, and what the error bars/shaded bands represent (SD, SEM, or 95% CI — they are not interchangeable). Without these, the figure cannot be interpreted."
            />
          </div>
          <CopyButton text={meta.caption} label="Copy caption" />
        </div>
        <p className="text-sm text-med-ink">{meta.caption}</p>
      </div>
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="label inline-flex items-center gap-1.5">
            Legend
            <InfoHint
              title="Legends decode the symbols"
              text="The legend maps every colour, marker, line style, and group to its meaning so the plot is unambiguous. Keep group labels identical to those in your text and tables so readers can cross-reference without guessing."
            />
          </div>
          <CopyButton text={meta.legend} label="Copy legend" />
        </div>
        <p className="text-sm text-med-ink">{meta.legend}</p>
      </div>
      {meta.footnotes.length > 0 && (
        <div>
          <div className="flex items-center justify-between gap-2">
            <div className="label inline-flex items-center gap-1.5">
              Footnotes
              <InfoHint
                title="Footnotes carry the fine print"
                text="Footnotes define every abbreviation, state the test/model and any adjustments, note the error-bar type and significance thresholds, and flag exclusions or missing data. Journals require them because they make the figure reproducible and self-explanatory."
              />
            </div>
            <CopyButton text={meta.footnotes.join("\n")} label="Copy footnotes" />
          </div>
          <ul className="list-disc list-inside text-xs text-med-sub space-y-1">
            {meta.footnotes.map((f, i) => (
              <li key={`${f}-${i}`}>{f}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function parseNumbers(text: string): number[] {
  return text
    .split(/[\s,;]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map(Number)
    .filter((v) => Number.isFinite(v));
}

function ResultBlock({ data }: { data: unknown }) {
  if (data == null) return null;
  return (
    <pre className="card-body text-xs overflow-x-auto bg-slate-50 border border-med-line rounded-lg">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function useApi<T>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);
  async function run(path: string, body: unknown) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || `HTTP ${res.status}`);
      setData(j as T);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }
  return { loading, error, data, run };
}

function Descriptive() {
  const [values, setValues] = useState("");
  const api = useApi();
  return (
    <div className="card">
      <div className="card-body space-y-3">
        <label className="label">Values (comma / space / newline separated)</label>
        <textarea
          className="textarea font-mono"
          rows={4}
          value={values}
          onChange={(e) => setValues(e.target.value)}
          placeholder="e.g. 12.4, 11.8, 13.1, 12.0, 12.9"
        />
        <button
          className="btn-primary"
          onClick={() =>
            api.run("/api/agents/stats-run", {
              test: "descriptive",
              values: parseNumbers(values),
            })
          }
          disabled={api.loading}
        >
          {api.loading ? "Running…" : "Compute"}
        </button>
        {api.error && <div className="badge-bad">{api.error}</div>}
        {api.data != null && <ResultBlock data={api.data} />}
      </div>
    </div>
  );
}

function TwoSample() {
  const [g1, setG1] = useState("");
  const [g2, setG2] = useState("");
  const [mode, setMode] = useState<"welch_t" | "paired_t">("welch_t");
  const api = useApi();
  return (
    <div className="card">
      <div className="card-body space-y-3">
        <div className="flex items-center gap-2">
          <InfoHint
            side="right"
            title="Independent vs paired"
            text="Use Welch's t when the two groups are different people (it does not assume equal variances, so it is the safer default). Use paired t when the same subjects are measured twice (pre/post) — pairing removes between-subject variability and is more powerful. Picking the wrong one mis-states your p-value and CI. Report the mean difference with a 95% CI, not only p."
          />
          <span className="text-[12px] text-med-sub">Match the test to your design</span>
        </div>
        <div className="flex gap-2">
          {(["welch_t", "paired_t"] as const).map((m) => (
            <button
              key={m}
              className={`pill-tab ${mode === m ? "pill-tab-active" : ""}`}
              onClick={() => setMode(m)}
            >
              {m === "welch_t" ? "Welch's t (independent)" : "Paired t (pre/post)"}
            </button>
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="label">{mode === "paired_t" ? "Pre" : "Group 1"}</label>
            <textarea
              className="textarea font-mono"
              rows={4}
              value={g1}
              onChange={(e) => setG1(e.target.value)}
            />
          </div>
          <div>
            <label className="label">{mode === "paired_t" ? "Post" : "Group 2"}</label>
            <textarea
              className="textarea font-mono"
              rows={4}
              value={g2}
              onChange={(e) => setG2(e.target.value)}
            />
          </div>
        </div>
        <button
          className="btn-primary"
          onClick={() =>
            api.run("/api/agents/stats-run", {
              test: mode,
              ...(mode === "welch_t"
                ? { group1: parseNumbers(g1), group2: parseNumbers(g2) }
                : { pre: parseNumbers(g1), post: parseNumbers(g2) }),
            })
          }
          disabled={api.loading}
        >
          {api.loading ? "Running…" : "Run test"}
        </button>
        {api.error && <div className="badge-bad">{api.error}</div>}
        {api.data != null && <ResultBlock data={api.data} />}
      </div>
    </div>
  );
}

function ChiSquare() {
  const [a, setA] = useState("12");
  const [b, setB] = useState("8");
  const [c, setC] = useState("5");
  const [d, setD] = useState("15");
  const api = useApi();
  return (
    <div className="card">
      <div className="card-body space-y-3">
        <div className="text-sm muted inline-flex items-center gap-1.5">
          Enter a 2×2 contingency table (cell counts).
          <InfoHint
            title="Chi-square vs Fisher's exact"
            text="The chi-square test compares observed vs expected counts for a categorical (binary) outcome between groups. Its approximation degrades when any expected cell count is small (a common rule is < 5) — there, use Fisher's exact test instead. Alongside the p-value, report an effect measure such as the risk ratio, odds ratio, or risk difference with a 95% CI."
          />
        </div>
        <table className="text-sm">
          <thead>
            <tr>
              <th></th>
              <th className="px-2 py-1">Outcome+</th>
              <th className="px-2 py-1">Outcome−</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-2 py-1 font-medium">Group 1</td>
              <td>
                <input className="input w-24" value={a} onChange={(e) => setA(e.target.value)} />
              </td>
              <td>
                <input className="input w-24" value={b} onChange={(e) => setB(e.target.value)} />
              </td>
            </tr>
            <tr>
              <td className="px-2 py-1 font-medium">Group 2</td>
              <td>
                <input className="input w-24" value={c} onChange={(e) => setC(e.target.value)} />
              </td>
              <td>
                <input className="input w-24" value={d} onChange={(e) => setD(e.target.value)} />
              </td>
            </tr>
          </tbody>
        </table>
        <button
          className="btn-primary"
          onClick={() =>
            api.run("/api/agents/stats-run", {
              test: "chi_square",
              observed: [
                [Number(a) || 0, Number(b) || 0],
                [Number(c) || 0, Number(d) || 0],
              ],
            })
          }
          disabled={api.loading}
        >
          {api.loading ? "Running…" : "Compute"}
        </button>
        {api.error && <div className="badge-bad">{api.error}</div>}
        {api.data != null && <ResultBlock data={api.data} />}
      </div>
    </div>
  );
}

function Correlation() {
  const [x, setX] = useState("");
  const [y, setY] = useState("");
  const api = useApi();
  return (
    <div className="card">
      <div className="card-body space-y-3">
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="label inline-flex items-center gap-1.5">
              X values
              <InfoHint
                title="Pearson assumes linearity"
                text="Pearson's r captures the strength of a linear association between two continuous variables and is sensitive to outliers and non-linearity. If the relationship is monotonic but curved, or values are ordinal/skewed, prefer Spearman's rank correlation. Report r with its 95% CI, and remember correlation is not causation."
              />
            </label>
            <textarea className="textarea font-mono" rows={4} value={x} onChange={(e) => setX(e.target.value)} />
          </div>
          <div>
            <label className="label">Y values (same length)</label>
            <textarea className="textarea font-mono" rows={4} value={y} onChange={(e) => setY(e.target.value)} />
          </div>
        </div>
        <button
          className="btn-primary"
          onClick={() =>
            api.run("/api/agents/stats-run", {
              test: "pearson",
              x: parseNumbers(x),
              y: parseNumbers(y),
            })
          }
          disabled={api.loading}
        >
          {api.loading ? "Running…" : "Pearson correlation"}
        </button>
        {api.error && <div className="badge-bad">{api.error}</div>}
        {api.data != null && <ResultBlock data={api.data} />}
      </div>
    </div>
  );
}

const OUTCOMES = [
  "continuous",
  "binary",
  "count",
  "time_to_event",
  "ordinal",
  "categorical_multi",
  "rate",
  "repeated_measures",
  "paired_continuous",
  "paired_binary",
] as const;

const GROUPINGS = [
  "single_group",
  "two_independent",
  "k_independent",
  "paired",
  "matched",
  "clustered",
  "crossover",
] as const;

function Recommender({
  presetDesign,
  presetOutcome,
}: {
  presetDesign?: string;
  presetOutcome?: string;
} = {}) {
  const [outcome, setOutcome] = useState<(typeof OUTCOMES)[number]>("continuous");
  const [grouping, setGrouping] = useState<(typeof GROUPINGS)[number]>(
    presetDesign?.startsWith("interv.rct")
      ? "two_independent"
      : presetDesign?.startsWith("obs.cohort")
      ? "two_independent"
      : "two_independent"
  );
  const [context, setContext] = useState(
    [presetDesign && `Design: ${presetDesign}`, presetOutcome && `Primary outcome: ${presetOutcome}`]
      .filter(Boolean)
      .join(". ")
  );
  const [enrich, setEnrich] = useState(false);
  const api = useApi();
  return (
    <div className="card">
      <div className="card-body space-y-3">
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="label inline-flex items-center gap-1.5">
              Outcome shape
              <InfoHint
                title="The test follows the data"
                text="The right test is determined by your outcome type (continuous, binary, count, time-to-event, ordinal…) crossed with your design (independent groups, paired, clustered, repeated measures). Getting this pairing right is what makes the analysis valid — e.g. time-to-event with censoring needs survival methods, and clustered/repeated data need models that account for the correlation."
              />
            </label>
            <select
              className="input"
              value={outcome}
              onChange={(e) => setOutcome(e.target.value as typeof outcome)}
            >
              {OUTCOMES.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label inline-flex items-center gap-1.5">
              Grouping
              <InfoHint
                title="Design dictates the structure"
                text="How units relate — independent, paired/matched, k groups, clustered, or crossover — changes the appropriate test and the degrees of freedom. Paired and clustered designs violate the independence assumption of simple tests, so they require paired or mixed/clustered methods to avoid overstating precision."
              />
            </label>
            <select
              className="input"
              value={grouping}
              onChange={(e) => setGrouping(e.target.value as typeof grouping)}
            >
              {GROUPINGS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Context (optional)</label>
          <textarea
            className="textarea"
            rows={2}
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="e.g. cluster-randomized trial, ICU mortality at 28 days"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={enrich} onChange={(e) => setEnrich(e.target.checked)} />
          Enrich rationale with writing assistant
        </label>
        <button
          className="btn-primary"
          onClick={() =>
            api.run("/api/agents/stat-recommend", {
              outcome,
              grouping,
              context,
              enrichWithLLM: enrich,
            })
          }
          disabled={api.loading}
        >
          {api.loading ? "Working…" : "Recommend test"}
        </button>
        {api.error && <div className="badge-bad">{api.error}</div>}
        {api.data != null && <ResultBlock data={api.data} />}
      </div>
    </div>
  );
}

function FigureSpec() {
  const [resultText, setResultText] = useState("");
  const [recommended, setRecommended] = useState<string | null>(null);
  const [spec, setSpec] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function recommend() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/agents/figure-spec", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind: "recommend", resultText }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || `HTTP ${res.status}`);
      setRecommended(j.recommended);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function sampleForest() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/agents/figure-spec", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind: "forest",
          effectLabel: "Risk ratio (95% CI)",
          refLine: 1,
          logScale: true,
          rows: [
            { label: "Trial A (n=300)", effect: 0.82, lower: 0.65, upper: 1.03, weight: 18 },
            { label: "Trial B (n=540)", effect: 0.71, lower: 0.55, upper: 0.92, weight: 26 },
            { label: "Trial C (n=210)", effect: 0.95, lower: 0.71, upper: 1.28, weight: 12 },
            { label: "Pooled (random)", effect: 0.79, lower: 0.66, upper: 0.94, weight: 30 },
          ],
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || `HTTP ${res.status}`);
      setSpec(j);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <div className="card-body space-y-3">
        <div>
          <label className="label inline-flex items-center gap-1.5">
            Describe the result you want to visualize
            <InfoHint
              title="Describe the estimate, not just the topic"
              text="Naming the quantity (e.g. pooled hazard ratio with 95% CI across 4 trials) lets the recommender pick a figure that shows that estimate and its uncertainty. The clearer the result, the better the match between figure type, axes, and the claim you will make in the text."
            />
          </label>
          <textarea
            className="textarea"
            rows={3}
            value={resultText}
            onChange={(e) => setResultText(e.target.value)}
            placeholder="e.g. Pooled hazard ratio for mortality across 4 trials with 95% CI"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button type="button" className="btn-secondary" onClick={recommend} disabled={loading}>
            Recommend figure kind
          </button>
          <button type="button" className="btn-primary" onClick={sampleForest} disabled={loading}>
            Generate sample forest plot spec
          </button>
        </div>
        {recommended && (
          <div className="badge-info">Recommended kind: <strong>{recommended}</strong></div>
        )}
        {error && <div className="badge-bad">{error}</div>}
        {spec != null && (
          <>
            {(() => {
              const s = spec as {
                plotly?: { data?: unknown; layout?: unknown };
                data?: unknown;
                layout?: unknown;
                publication?: FigurePublicationMeta;
              };
              const plotSpec = s.plotly ?? { data: s.data, layout: s.layout };
              return (
                <>
                  {s.publication && <PublicationMetaBlock meta={s.publication} />}
                  <div className="grid gap-3">
                    <PlotlyPreview spec={plotSpec as { data?: unknown; layout?: unknown }} />
                  </div>
                </>
              );
            })()}
            <div className="muted text-xs">
              Live preview above renders Plotly client-side. Paste the JSON below into any Plotly renderer for downstream use.
            </div>
            <ResultBlock data={spec} />
          </>
        )}
      </div>
    </div>
  );
}

function TableScaffold() {
  const [title, setTitle] = useState("Table 1. Baseline characteristics");
  const [columnText, setColumnText] = useState("Overall, Treatment, Control");
  const [variableText, setVariableText] = useState(
    [
      "Age, years | continuous",
      "Age, years (skewed) | continuous | nonNormal",
      "Sex | categorical | Female; Male",
      "Comorbidity | categorical | Yes; No",
    ].join("\n")
  );
  const [includeP, setIncludeP] = useState(true);
  const [test, setTest] = useState("");
  const [result, setResult] = useState<{ markdown: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function build() {
    setError(null);
    try {
      const columns = columnText
        .split(/[,\n]+/)
        .map((c) => c.trim())
        .filter(Boolean)
        .map((label) => ({ label, n: null }));
      if (!columns.length) throw new Error("Add at least one column.");
      const variables: BaselineTableVariable[] = variableText
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const parts = line.split("|").map((p) => p.trim());
          const label = parts[0] || "[variable]";
          const type = parts[1]?.toLowerCase() === "categorical" ? "categorical" : "continuous";
          if (type === "categorical") {
            const levels = (parts[2] || "")
              .split(/[;,]/)
              .map((l) => l.trim())
              .filter(Boolean);
            return { label, type, levels: levels.length ? levels : undefined };
          }
          const nonNormal = parts.slice(1).some((p) => /nonnormal/i.test(p));
          return { label, type, nonNormal };
        });
      if (!variables.length) throw new Error("Add at least one variable.");
      const out = buildBaselineTableScaffold({
        title,
        columns,
        variables,
        includePValue: includeP,
        statisticalTest: test.trim() || undefined,
      });
      setResult(out);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="card">
      <div className="card-body space-y-3">
        <div className="text-sm muted inline-flex items-start gap-1.5">
          <span>
            Generate a manuscript-ready baseline / characteristics table skeleton
            (Table 1). Cells are author-fillable placeholders in the correct format
            — n (%) for categorical, mean (SD) / median (IQR) for continuous. No
            numbers are invented.
          </span>
          <InfoHint
            title="What Table 1 is for"
            text="Table 1 describes who was studied and shows the groups were comparable at baseline, so readers can judge confounding and generalisability. The scaffold enforces correct formats — n (%) for categorical, mean (SD) for symmetric and median (IQR) for skewed continuous variables — and leaves cells blank because the values must come from your own data, not be invented."
          />
        </div>
        <div>
          <label className="label">Table title</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="label">Columns (comma or newline separated)</label>
          <input
            className="input"
            value={columnText}
            onChange={(e) => setColumnText(e.target.value)}
            placeholder="Overall, Treatment, Control"
          />
        </div>
        <div>
          <label className="label">
            Variables — one per line: <code>label | continuous|categorical | levels/nonNormal</code>
          </label>
          <textarea
            className="textarea font-mono"
            rows={5}
            value={variableText}
            onChange={(e) => setVariableText(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={includeP} onChange={(e) => setIncludeP(e.target.checked)} />
          Include a p-value column
          <InfoHint
            title="Baseline p-values are often discouraged"
            text="In randomised trials, any baseline imbalance is by definition due to chance, so CONSORT and many journals advise against p-values in Table 1 — describe and adjust for imbalance instead. In observational studies a baseline comparison can be informative. If you include p, footnote the exact test used for each variable."
          />
        </label>
        {includeP && (
          <div>
            <label className="label">Statistical test (for the footnote, optional)</label>
            <input
              className="input"
              value={test}
              onChange={(e) => setTest(e.target.value)}
              placeholder="e.g. t-test / Mann–Whitney U / chi-square / Fisher's exact"
            />
          </div>
        )}
        <button type="button" className="btn-primary" onClick={build}>
          Generate table scaffold
        </button>
        {error && (
          <div className="badge-bad" role="alert">
            {error}
          </div>
        )}
        {result && (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="label">Markdown</div>
              <CopyButton text={result.markdown} label="Copy table" />
            </div>
            <pre className="card-body text-xs overflow-x-auto bg-slate-50 border border-med-line rounded-lg whitespace-pre">
              {result.markdown}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
