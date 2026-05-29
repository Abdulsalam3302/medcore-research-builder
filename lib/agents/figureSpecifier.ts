/**
 * figureSpecifier — given the shape of a result, recommend a figure type
 * and emit a Plotly chart spec the front-end can render or export as JSON.
 *
 * The spec is intentionally minimal: type, traces, layout. The user can
 * paste it into any Plotly renderer (Plotly Studio, plotly.js, Python
 * plotly.io.from_json) without modification.
 */

export type FigureKind =
  | "forest"
  | "kaplan_meier"
  | "bar_grouped"
  | "box_violin"
  | "scatter_fit"
  | "histogram"
  | "heatmap_corr"
  | "roc"
  | "calibration"
  | "flow_consort";

/**
 * Manuscript-ready publication metadata for a figure: a caption (one or two
 * sentences shown above/below the figure), a legend (describes the encoding —
 * what colors/markers/lines mean), and footnotes (abbreviations, n, statistical
 * test, error-bar definition, significance markers). All are deterministic and
 * derived from the spec inputs — no network, no fabricated numbers.
 */
export type FigurePublicationMeta = {
  /** Recommended/selected figure type as a human-readable label. */
  figureType: string;
  /** Manuscript caption (title-style line the journal prints). */
  caption: string;
  /** Legend describing the visual encoding (groups, colors, markers, lines). */
  legend: string;
  /** Footnote lines: abbreviations, n, statistical test, error bars, markers. */
  footnotes: string[];
  /** Combined, copy-pasteable block (caption + legend + footnotes). */
  combinedMarkdown: string;
};

export type FigureSpec = {
  kind: FigureKind;
  title: string;
  rationale: string;
  reportingNotes: string[];
  /** Publication-ready caption/legend/footnotes. Optional for back-compat. */
  publication?: FigurePublicationMeta;
  plotly: {
    data: Array<Record<string, unknown>>;
    layout: Record<string, unknown>;
  };
};

/** Default significance-marker convention used in footnotes. */
const SIGNIFICANCE_CONVENTION =
  "*p<0.05, **p<0.01, ***p<0.001 (two-sided); exact p-values reported in text.";

/**
 * Assemble a FigurePublicationMeta from caption/legend/footnote parts and
 * produce a single copy-pasteable markdown block.
 */
export function buildPublicationMeta(args: {
  figureType: string;
  caption: string;
  legend: string;
  footnotes: string[];
}): FigurePublicationMeta {
  const footnotes = args.footnotes.filter(Boolean);
  const combinedMarkdown = [
    `**${args.figureType}.** ${args.caption}`,
    "",
    `*Legend.* ${args.legend}`,
    "",
    ...(footnotes.length
      ? [`*Footnotes.*`, ...footnotes.map((f) => `- ${f}`)]
      : []),
  ]
    .join("\n")
    .trim();
  return { figureType: args.figureType, caption: args.caption, legend: args.legend, footnotes, combinedMarkdown };
}

export function specifyForest(args: {
  rows: Array<{ label: string; effect: number; lower: number; upper: number; weight?: number }>;
  effectLabel?: string;
  refLine?: number;
  logScale?: boolean;
}): FigureSpec {
  const labels = args.rows.map((r) => r.label);
  const eff = args.rows.map((r) => r.effect);
  const errMinus = args.rows.map((r) => r.effect - r.lower);
  const errPlus = args.rows.map((r) => r.upper - r.effect);
  const weights = args.rows.map((r) => r.weight ?? 8);
  const effectName = args.effectLabel || "Effect (95% CI)";
  return {
    kind: "forest",
    title: "Forest plot",
    rationale: "Visualizes point estimates with 95% CIs across studies/subgroups; reference line marks the null effect.",
    reportingNotes: [
      "Report effect measure clearly (RR, OR, HR, mean difference).",
      "Show heterogeneity statistic (I², τ²) below the plot.",
      "Indicate fixed vs random-effects model in the caption.",
    ],
    publication: buildPublicationMeta({
      figureType: "Forest plot",
      caption: `Pooled and study-level estimates of ${effectName} with 95% confidence intervals across ${args.rows.length} ${args.rows.length === 1 ? "study/subgroup" : "studies/subgroups"}.`,
      legend: `Each square marks a study/subgroup point estimate (marker area ∝ weight); horizontal lines span the 95% confidence interval. The dotted vertical line marks the null effect (${args.refLine ?? 1}). The x-axis is on a ${args.logScale ? "logarithmic" : "linear"} scale.`,
      footnotes: [
        `Effect measure: ${effectName}. CI, confidence interval.`,
        "Error bars denote 95% confidence intervals.",
        "Report the pooling model (fixed- vs random-effects) and heterogeneity (I², τ²) beneath the plot.",
        "[author: insert total n and per-study n].",
      ],
    }),
    plotly: {
      data: [
        {
          type: "scatter",
          mode: "markers",
          x: eff,
          y: labels,
          error_x: {
            type: "data",
            symmetric: false,
            array: errPlus,
            arrayminus: errMinus,
            thickness: 1.5,
          },
          marker: { size: weights, color: "#1f6feb" },
          name: args.effectLabel || "Effect (95% CI)",
        },
      ],
      layout: {
        title: "Forest plot",
        xaxis: {
          title: args.effectLabel || "Effect estimate (95% CI)",
          type: args.logScale ? "log" : "linear",
          zeroline: false,
        },
        yaxis: { autorange: "reversed" },
        shapes: [
          {
            type: "line",
            x0: args.refLine ?? 1,
            x1: args.refLine ?? 1,
            yref: "paper",
            y0: 0,
            y1: 1,
            line: { dash: "dot", color: "#888" },
          },
        ],
        margin: { l: 160, r: 30, t: 50, b: 50 },
      },
    },
  };
}

export function specifyBarGrouped(args: {
  groups: string[]; // x-axis categories
  series: Array<{ name: string; values: number[]; errors?: number[] }>;
  yLabel?: string;
}): FigureSpec {
  return {
    kind: "bar_grouped",
    title: "Grouped bar chart",
    rationale: "Compares a metric across groups for two or more series side-by-side.",
    reportingNotes: [
      "Use SD/SEM/CI bars consistently and state which in the caption.",
      "Order categories meaningfully (e.g., by sample size or by effect).",
    ],
    publication: buildPublicationMeta({
      figureType: "Grouped bar chart",
      caption: `${args.yLabel || "Outcome value"} by ${args.groups.length} ${args.groups.length === 1 ? "group" : "groups"} across ${args.series.length} ${args.series.length === 1 ? "series" : "series"}.`,
      legend: `Bars show ${args.yLabel || "the outcome value"} for each category; series are distinguished by color (${args.series.map((s) => s.name).join(", ")}).`,
      footnotes: [
        `Error bars denote ${args.series.some((s) => s.errors) ? "the reported dispersion measure — state SD, SEM, or 95% CI" : "[author: state SD, SEM, or 95% CI if shown]"}.`,
        "[author: insert n per group and the statistical test used for comparisons].",
        SIGNIFICANCE_CONVENTION,
        "SD, standard deviation; SEM, standard error of the mean; CI, confidence interval.",
      ],
    }),
    plotly: {
      data: args.series.map((s) => ({
        type: "bar",
        name: s.name,
        x: args.groups,
        y: s.values,
        error_y: s.errors ? { type: "data", array: s.errors } : undefined,
      })),
      layout: {
        barmode: "group",
        yaxis: { title: args.yLabel || "Value" },
        margin: { l: 60, r: 30, t: 50, b: 60 },
      },
    },
  };
}

export function specifyBoxViolin(args: {
  groups: Array<{ name: string; values: number[] }>;
  yLabel?: string;
  asViolin?: boolean;
}): FigureSpec {
  return {
    kind: "box_violin",
    title: args.asViolin ? "Violin plot" : "Box plot",
    rationale: "Shows distribution shape, median, IQR, and outliers across groups.",
    reportingNotes: [
      "Overlay individual points when n is small (<50/group).",
      "Box plots can hide bimodality — prefer violin if shape matters.",
    ],
    publication: buildPublicationMeta({
      figureType: args.asViolin ? "Violin plot" : "Box plot",
      caption: `Distribution of ${args.yLabel || "the outcome"} across ${args.groups.length} ${args.groups.length === 1 ? "group" : "groups"} (${args.groups.map((g) => g.name).join(", ")}).`,
      legend: args.asViolin
        ? "Each violin shows the kernel density of the distribution; the inner line marks the mean."
        : "Each box spans the interquartile range (IQR); the center line marks the median, whiskers extend to 1.5×IQR, and points beyond are outliers.",
      footnotes: [
        "IQR, interquartile range.",
        "[author: insert n per group and the statistical test used for comparisons].",
        SIGNIFICANCE_CONVENTION,
      ],
    }),
    plotly: {
      data: args.groups.map((g) => ({
        type: args.asViolin ? "violin" : "box",
        y: g.values,
        name: g.name,
        boxpoints: "outliers",
        meanline: { visible: true },
      })),
      layout: {
        yaxis: { title: args.yLabel || "Value" },
        margin: { l: 60, r: 30, t: 50, b: 50 },
      },
    },
  };
}

export function specifyKaplanMeier(args: {
  groups: Array<{ name: string; time: number[]; survival: number[] }>;
  xLabel?: string;
}): FigureSpec {
  return {
    kind: "kaplan_meier",
    title: "Kaplan–Meier curves",
    rationale: "Cumulative survival probability over time, by group, with censoring respected.",
    reportingNotes: [
      "Always include a number-at-risk table beneath the curves.",
      "Report log-rank p, hazard ratio (95% CI), and median survival per group.",
      "Truncate the x-axis where at-risk drops below ~10% of starting cohort.",
    ],
    publication: buildPublicationMeta({
      figureType: "Kaplan–Meier survival curves",
      caption: `Kaplan–Meier estimates of survival over ${args.xLabel || "time"} by group (${args.groups.map((g) => g.name).join(", ")}).`,
      legend: "Step functions show the cumulative survival probability for each group; tick marks (if shown) denote censored observations.",
      footnotes: [
        "A number-at-risk table should appear beneath the x-axis.",
        "[author: insert hazard ratio (95% CI), log-rank p-value, and median survival per group].",
        "HR, hazard ratio; CI, confidence interval.",
      ],
    }),
    plotly: {
      data: args.groups.map((g) => ({
        type: "scatter",
        mode: "lines",
        x: g.time,
        y: g.survival,
        name: g.name,
        line: { shape: "hv" },
      })),
      layout: {
        xaxis: { title: args.xLabel || "Time" },
        yaxis: { title: "Survival probability", range: [0, 1] },
        margin: { l: 60, r: 30, t: 50, b: 50 },
      },
    },
  };
}

export function specifyROC(args: {
  curves: Array<{ name: string; fpr: number[]; tpr: number[]; auc?: number }>;
}): FigureSpec {
  return {
    kind: "roc",
    title: "ROC curves",
    rationale: "True positive vs false positive rate across thresholds; AUC summarizes overall discrimination.",
    reportingNotes: [
      "Report AUC with 95% CI (bootstrap).",
      "Show diagonal reference line for chance.",
      "Pair with a calibration plot — discrimination without calibration is incomplete.",
    ],
    publication: buildPublicationMeta({
      figureType: "Receiver operating characteristic (ROC) curves",
      caption: `Discrimination of ${args.curves.length} ${args.curves.length === 1 ? "model/marker" : "models/markers"} (${args.curves.map((c) => c.name).join(", ")}) for the outcome, summarized by the area under the curve (AUC).`,
      legend: `Each curve traces sensitivity (true positive rate) against 1 − specificity (false positive rate) across thresholds; the dotted diagonal marks chance discrimination (AUC = 0.5).${args.curves.some((c) => c.auc != null) ? " AUC is shown in the series label." : ""}`,
      footnotes: [
        "AUC, area under the receiver operating characteristic curve.",
        "[author: report each AUC with its 95% CI (e.g. bootstrap or DeLong) and the n used].",
        "Discrimination should be reported alongside calibration; an ROC curve alone does not establish clinical usefulness.",
      ],
    }),
    plotly: {
      data: [
        ...args.curves.map((c) => ({
          type: "scatter",
          mode: "lines",
          x: c.fpr,
          y: c.tpr,
          name: c.auc != null ? `${c.name} (AUC=${c.auc.toFixed(3)})` : c.name,
        })),
        {
          type: "scatter",
          mode: "lines",
          x: [0, 1],
          y: [0, 1],
          line: { dash: "dot", color: "#888" },
          showlegend: false,
        },
      ],
      layout: {
        xaxis: { title: "False positive rate", range: [0, 1] },
        yaxis: { title: "True positive rate", range: [0, 1] },
        margin: { l: 60, r: 30, t: 50, b: 50 },
      },
    },
  };
}

export function specifyScatterFit(args: {
  x: number[];
  y: number[];
  xLabel?: string;
  yLabel?: string;
  fitLine?: { slope: number; intercept: number };
}): FigureSpec {
  const xLabel = args.xLabel || "X";
  const yLabel = args.yLabel || "Y";
  const data: Array<Record<string, unknown>> = [
    {
      type: "scatter",
      mode: "markers",
      x: args.x,
      y: args.y,
      name: "Observations",
      marker: { color: "#1f6feb", size: 6, opacity: 0.7 },
    },
  ];
  if (args.fitLine && args.x.length) {
    const xs = [...args.x].sort((a, b) => a - b);
    const lo = xs[0];
    const hi = xs[xs.length - 1];
    data.push({
      type: "scatter",
      mode: "lines",
      x: [lo, hi],
      y: [args.fitLine.intercept + args.fitLine.slope * lo, args.fitLine.intercept + args.fitLine.slope * hi],
      name: "Fitted line",
      line: { color: "#d1242f" },
    });
  }
  return {
    kind: "scatter_fit",
    title: "Scatter plot with fitted line",
    rationale: "Shows the association between two continuous variables and the fitted relationship.",
    reportingNotes: [
      "Report the correlation/regression coefficient with 95% CI, not just the p-value.",
      "Check linearity and influential points before fitting a straight line.",
    ],
    publication: buildPublicationMeta({
      figureType: "Scatter plot with fitted regression line",
      caption: `Association between ${xLabel} and ${yLabel} (n = ${Math.min(args.x.length, args.y.length)} observations).`,
      legend: `Each point is one observation; the line shows the fitted ${args.fitLine ? "linear regression" : "relationship"}.`,
      footnotes: [
        "CI, confidence interval.",
        "[author: report the correlation or regression coefficient with its 95% CI and the n].",
        "[author: state whether linearity and homoscedasticity assumptions were checked].",
      ],
    }),
    plotly: {
      data,
      layout: {
        xaxis: { title: xLabel },
        yaxis: { title: yLabel },
        margin: { l: 60, r: 30, t: 50, b: 60 },
      },
    },
  };
}

export function specifyHistogram(args: {
  values: number[];
  xLabel?: string;
  nbins?: number;
}): FigureSpec {
  const xLabel = args.xLabel || "Value";
  return {
    kind: "histogram",
    title: "Histogram",
    rationale: "Displays the frequency distribution of a single continuous variable.",
    reportingNotes: [
      "State the bin width or number of bins used.",
      "Comment on skew/modality; consider median (IQR) rather than mean (SD) if skewed.",
    ],
    publication: buildPublicationMeta({
      figureType: "Histogram",
      caption: `Frequency distribution of ${xLabel} (n = ${args.values.length}).`,
      legend: `Bars show the count of observations within each bin of ${xLabel}.`,
      footnotes: [
        `[author: state bin width or number of bins${args.nbins ? ` (here ${args.nbins})` : ""} and the n].`,
        "[author: report central tendency and spread — mean (SD) if symmetric, median (IQR) if skewed].",
      ],
    }),
    plotly: {
      data: [
        {
          type: "histogram",
          x: args.values,
          nbinsx: args.nbins,
          marker: { color: "#1f6feb" },
        },
      ],
      layout: {
        xaxis: { title: xLabel },
        yaxis: { title: "Count" },
        margin: { l: 60, r: 30, t: 50, b: 60 },
      },
    },
  };
}

/**
 * Specify a CONSORT-style participant-flow diagram. There is no native Plotly
 * flow-chart trace, so we emit an annotation-driven layout the author can
 * render or hand to a diagramming tool. Boxes are author-fillable.
 */
export function specifyFlowConsort(args: {
  stages?: Array<{ label: string; n?: number | null }>;
}): FigureSpec {
  const stages =
    args.stages && args.stages.length
      ? args.stages
      : [
          { label: "Assessed for eligibility", n: null },
          { label: "Excluded (with reasons)", n: null },
          { label: "Randomized / included", n: null },
          { label: "Allocated to each group", n: null },
          { label: "Lost to follow-up / discontinued", n: null },
          { label: "Analyzed (per group)", n: null },
        ];
  const n = stages.length;
  const annotations = stages.map((s, i) => ({
    x: 0.5,
    y: 1 - (i + 0.5) / n,
    xref: "paper",
    yref: "paper",
    text: `${s.label}${s.n != null ? ` (n = ${s.n})` : " (n = [author])"}`,
    showarrow: false,
    bordercolor: "#94a3b8",
    borderwidth: 1,
    borderpad: 6,
    bgcolor: "#f8fafc",
  }));
  return {
    kind: "flow_consort",
    title: "Participant flow (CONSORT-style) diagram",
    rationale: "Documents the flow of participants from screening through analysis; required for trials and recommended for cohorts.",
    reportingNotes: [
      "Account for every participant: screened, excluded (with reasons), included, lost, analyzed.",
      "Numbers must reconcile across stages.",
    ],
    publication: buildPublicationMeta({
      figureType: "Participant flow diagram (CONSORT-style)",
      caption: "Flow of participants through the study, from eligibility assessment to analysis.",
      legend: "Each box reports the number of participants at a stage; arrows (top to bottom) show progression, with exclusions/losses and their reasons.",
      footnotes: [
        "Numbers must reconcile across stages (screened = included + excluded).",
        "[author: insert exact n and the reasons for each exclusion / loss to follow-up].",
        "Follows the CONSORT (trials) / STROBE (observational) flow-reporting conventions.",
      ],
    }),
    plotly: {
      data: [
        {
          type: "scatter",
          mode: "markers",
          x: [0.5],
          y: [0.5],
          marker: { opacity: 0 },
          hoverinfo: "skip",
          showlegend: false,
        },
      ],
      layout: {
        xaxis: { visible: false, range: [0, 1] },
        yaxis: { visible: false, range: [0, 1] },
        annotations,
        margin: { l: 20, r: 20, t: 40, b: 20 },
        height: Math.max(360, n * 70),
      },
    },
  };
}

/** Human-readable label + design rationale + reporting checklist per kind. */
export type FigureKindMeta = {
  kind: FigureKind;
  label: string;
  bestFor: string;
  reportingChecklist: string[];
};

const FIGURE_KIND_META: Record<FigureKind, FigureKindMeta> = {
  forest: {
    kind: "forest",
    label: "Forest plot",
    bestFor: "Pooled/subgroup effect estimates with 95% CIs (meta-analysis, subgroup comparisons).",
    reportingChecklist: [
      "State the effect measure (RR/OR/HR/mean difference) and the model (fixed vs random).",
      "Show heterogeneity (I², τ²) and the null reference line.",
    ],
  },
  kaplan_meier: {
    kind: "kaplan_meier",
    label: "Kaplan–Meier survival curves",
    bestFor: "Time-to-event outcomes compared across groups, respecting censoring.",
    reportingChecklist: [
      "Add a number-at-risk table beneath the curves.",
      "Report HR (95% CI), log-rank p, and median survival per group.",
    ],
  },
  bar_grouped: {
    kind: "bar_grouped",
    label: "Grouped bar chart",
    bestFor: "Comparing a summary metric across categories and 2+ series.",
    reportingChecklist: [
      "Define error bars (SD/SEM/95% CI) in the caption.",
      "State n per group and the comparison test.",
    ],
  },
  box_violin: {
    kind: "box_violin",
    label: "Box / violin plot",
    bestFor: "Comparing distributions (median, IQR, spread, outliers) across groups.",
    reportingChecklist: [
      "Overlay raw points when n is small per group.",
      "State n per group and the comparison test.",
    ],
  },
  scatter_fit: {
    kind: "scatter_fit",
    label: "Scatter plot with fitted line",
    bestFor: "Association between two continuous variables.",
    reportingChecklist: [
      "Report the correlation/regression coefficient with 95% CI.",
      "Check linearity and influential points.",
    ],
  },
  histogram: {
    kind: "histogram",
    label: "Histogram",
    bestFor: "Frequency distribution of one continuous variable.",
    reportingChecklist: [
      "State bin width / number of bins.",
      "Comment on skew; choose mean (SD) vs median (IQR) accordingly.",
    ],
  },
  heatmap_corr: {
    kind: "heatmap_corr",
    label: "Correlation heatmap",
    bestFor: "Pairwise correlations across many variables.",
    reportingChecklist: [
      "State the correlation method (Pearson/Spearman) and n.",
      "Note that correlation matrices invite multiple comparisons — interpret cautiously.",
    ],
  },
  roc: {
    kind: "roc",
    label: "ROC curves",
    bestFor: "Discrimination of a classifier/marker for a binary outcome.",
    reportingChecklist: [
      "Report AUC with 95% CI.",
      "Pair with a calibration plot.",
    ],
  },
  calibration: {
    kind: "calibration",
    label: "Calibration plot",
    bestFor: "Agreement between predicted and observed risk for a prediction model.",
    reportingChecklist: [
      "Show the 45° ideal line and grouped/loess observed risk.",
      "Report calibration slope/intercept and (optionally) Brier score.",
    ],
  },
  flow_consort: {
    kind: "flow_consort",
    label: "Participant flow diagram (CONSORT-style)",
    bestFor: "Participant flow from screening to analysis.",
    reportingChecklist: [
      "Account for every participant with exclusion/loss reasons.",
      "Ensure numbers reconcile across stages.",
    ],
  },
};

/** Look up the metadata (label, best-for, checklist) for a figure kind. */
export function figureKindMeta(kind: FigureKind): FigureKindMeta {
  return FIGURE_KIND_META[kind];
}

/**
 * Recommend a figure kind AND return its rationale + reporting checklist in one
 * deterministic call. Convenience over recommendFigureKind for UIs that want to
 * surface the "why" alongside the "what".
 */
export function recommendFigure(resultText: string): FigureKindMeta & { figureType: string } {
  const kind = recommendFigureKind(resultText);
  const meta = figureKindMeta(kind);
  return { ...meta, figureType: meta.label };
}

export type BaselineTableColumn = {
  /** Header shown for the column, e.g. "Overall" or a group name. */
  label: string;
  /** Optional n for the column header line, e.g. "(n=120)". */
  n?: number | null;
};

export type BaselineTableVariable = {
  /** Row label, e.g. "Age, years". */
  label: string;
  /** continuous → mean (SD) / median (IQR); categorical → n (%). */
  type: "continuous" | "categorical";
  /** For categorical variables, the levels to scaffold as sub-rows. */
  levels?: string[];
  /** Use median (IQR) instead of mean (SD) for a skewed continuous variable. */
  nonNormal?: boolean;
};

/**
 * Build a manuscript-ready baseline / characteristics table skeleton (Table 1)
 * as markdown. Cells are author-fillable placeholders in the correct format —
 * NO numbers are fabricated. Deterministic, no network.
 */
export function buildBaselineTableScaffold(args: {
  title?: string;
  columns: BaselineTableColumn[];
  variables: BaselineTableVariable[];
  includePValue?: boolean;
  statisticalTest?: string;
}): { markdown: string; footnote: string } {
  const columns = args.columns.length
    ? args.columns
    : [{ label: "Overall", n: null }];
  const headerCells = [
    "Characteristic",
    ...columns.map((c) => `${c.label}${c.n != null ? ` (n=${c.n})` : " (n=[author])"}`),
  ];
  if (args.includePValue) headerCells.push("p-value");
  const sep = headerCells.map(() => "---");

  const contPlaceholder = (v: BaselineTableVariable) =>
    v.nonNormal ? "[median (IQR)]" : "[mean (SD)]";

  const rows: string[][] = [];
  for (const v of args.variables) {
    if (v.type === "continuous") {
      const cells = [
        `${v.label}${v.nonNormal ? ", median (IQR)" : ", mean (SD)"}`,
        ...columns.map(() => contPlaceholder(v)),
      ];
      if (args.includePValue) cells.push("[p]");
      rows.push(cells);
    } else {
      // categorical: a header row, then one sub-row per level with n (%)
      const head = [`${v.label}, n (%)`, ...columns.map(() => "")];
      if (args.includePValue) head.push("[p]");
      rows.push(head);
      const levels = v.levels && v.levels.length ? v.levels : ["[level 1]", "[level 2]"];
      for (const lvl of levels) {
        const cells = [`  ${lvl}`, ...columns.map(() => "[n (%)]")];
        if (args.includePValue) cells.push("");
        rows.push(cells);
      }
    }
  }

  const toLine = (cells: string[]) => `| ${cells.join(" | ")} |`;
  const md = [
    `**${args.title || "Table 1. Baseline characteristics"}**`,
    "",
    toLine(headerCells),
    toLine(sep),
    ...rows.map(toLine),
  ].join("\n");

  const footnoteParts = [
    "Data are mean (SD) or median (IQR) for continuous variables and n (%) for categorical variables.",
    args.includePValue
      ? `p-values from ${args.statisticalTest || "[author: state test, e.g. t-test / Mann–Whitney U / chi-square / Fisher's exact]"}.`
      : "",
    "SD, standard deviation; IQR, interquartile range.",
    "[author: confirm denominators and report missing data per variable].",
  ].filter(Boolean);
  const footnote = footnoteParts.join(" ");

  return { markdown: `${md}\n\n*${footnote}*`, footnote };
}

/**
 * Recommend a figure kind from a free-text description of the result.
 * No LLM needed for the recommendation; uses keyword heuristics.
 */
export function recommendFigureKind(resultText: string): FigureKind {
  const t = resultText.toLowerCase();
  if (/survival|kaplan|hazard ratio|time-to-event/.test(t)) return "kaplan_meier";
  if (/meta-?analysis|pooled|effect size|forest/.test(t)) return "forest";
  if (/auc|roc|discrimination/.test(t)) return "roc";
  if (/calibration|brier/.test(t)) return "calibration";
  if (/consort|flow diagram|enrollment/.test(t)) return "flow_consort";
  if (/correlation matrix|heatmap/.test(t)) return "heatmap_corr";
  if (/distribution|spread|variance|iqr|median/.test(t)) return "box_violin";
  if (/scatter|regression line|correlation between/.test(t)) return "scatter_fit";
  if (/frequency|histogram/.test(t)) return "histogram";
  return "bar_grouped";
}
