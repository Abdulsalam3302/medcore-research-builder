"use client";

import { useState } from "react";
import type { ExpandedNotes } from "@/lib/types";
import { PlotlyPreview } from "./PlotlyPreview";
import { CopyButton } from "./ui/CopyButton";
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
          <h1 className="display-title">Statistical analysis & figure specs</h1>
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
        <div className="text-sm font-semibold text-med-ink">
          Recommended figure: {meta.figureType}
        </div>
        <CopyButton text={meta.combinedMarkdown} label="Copy all" />
      </div>
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="label">Caption</div>
          <CopyButton text={meta.caption} label="Copy caption" />
        </div>
        <p className="text-sm text-med-ink">{meta.caption}</p>
      </div>
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="label">Legend</div>
          <CopyButton text={meta.legend} label="Copy legend" />
        </div>
        <p className="text-sm text-med-ink">{meta.legend}</p>
      </div>
      {meta.footnotes.length > 0 && (
        <div>
          <div className="flex items-center justify-between gap-2">
            <div className="label">Footnotes</div>
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
        <div className="text-sm muted">Enter a 2×2 contingency table (cell counts).</div>
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
            <label className="label">X values</label>
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
            <label className="label">Outcome shape</label>
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
            <label className="label">Grouping</label>
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
          <label className="label">Describe the result you want to visualize</label>
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
        <div className="text-sm muted">
          Generate a manuscript-ready baseline / characteristics table skeleton
          (Table 1). Cells are author-fillable placeholders in the correct format
          — n (%) for categorical, mean (SD) / median (IQR) for continuous. No
          numbers are invented.
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
