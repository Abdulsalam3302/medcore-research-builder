/**
 * Side-by-side journal comparison.
 *
 * Builds a normalized comparison matrix across the dimensions researchers
 * actually weigh when choosing where to submit: fit, credibility/trust,
 * metric (real or anticipated), indexing, cost (APC model), speed, and
 * open-access. Pure + offline. Highlights the "best on each row" so a
 * researcher can decide at a glance.
 */

import type { JournalRecord } from "./types";
import { anticipateImpact, assessTrust } from "./anticipate";

export type CompareRow = {
  key: string;
  label: string;
  /** Per-journal display cell. */
  cells: string[];
  /** Index of the journal(s) that "win" this row (for highlighting), or []. */
  bestIndexes: number[];
  /** Higher-is-better hint for the UI legend. */
  direction: "higher" | "lower" | "neutral";
};

export type ComparisonResult = {
  journals: JournalRecord[];
  rows: CompareRow[];
  /** Index of the overall suggested pick + a one-line rationale. */
  suggestion: { index: number; rationale: string } | null;
};

const APC_LABEL: Record<string, string> = {
  none: "Free (no APC)",
  "gold-apc": "Gold OA (APC)",
  "hybrid-apc": "Hybrid (optional APC)",
  subscription: "Subscription (paywalled)",
  "waiver-available": "APC, waiver available",
  unknown: "Unknown",
};

function apcCost(j: JournalRecord): number {
  if (j.freeApc || j.apcModel === "none" || j.oaModel === "diamond") return 0;
  if (typeof j.apcUsd === "number") return j.apcUsd;
  if (j.apcModel === "subscription") return 0; // no APC to publish
  return Number.POSITIVE_INFINITY; // unknown cost ranks worst on the "lower cost" row
}

export function compareJournals(journals: JournalRecord[]): ComparisonResult {
  const n = journals.length;
  if (n === 0) return { journals, rows: [], suggestion: null };

  const trust = journals.map((j) => assessTrust(j));
  const impact = journals.map((j) => anticipateImpact(j));

  const rows: CompareRow[] = [];

  const pushRow = (
    key: string,
    label: string,
    values: number[],
    cells: string[],
    direction: CompareRow["direction"],
  ) => {
    let bestIndexes: number[] = [];
    if (direction !== "neutral" && values.some((v) => Number.isFinite(v))) {
      const finite = values.map((v) => (Number.isFinite(v) ? v : direction === "higher" ? -Infinity : Infinity));
      const best = direction === "higher" ? Math.max(...finite) : Math.min(...finite);
      bestIndexes = finite.map((v, i) => (v === best ? i : -1)).filter((i) => i >= 0);
    }
    rows.push({ key, label, cells, bestIndexes, direction });
  };

  // Trust / credibility
  pushRow(
    "trust",
    "Trust & credibility",
    trust.map((t) => t.score),
    trust.map((t) => `${t.level} (${t.score})`),
    "higher",
  );
  // Metric (real or anticipated)
  pushRow(
    "impact",
    "Impact (JIF or est.)",
    impact.map((m) => m.value ?? -1),
    impact.map((m) => m.label),
    "higher",
  );
  // Indexing tier
  const indexRank = (j: JournalRecord) =>
    (j.indexing.medline === "indexed" ? 3 : 0) +
    (j.indexing.wos === "SCIE" ? 3 : j.indexing.wos === "ESCI" ? 1 : 0) +
    (j.indexing.scopus === "indexed" ? 2 : 0) +
    (j.indexing.doaj === "indexed" ? 1 : 0);
  pushRow(
    "indexing",
    "Indexing",
    journals.map(indexRank),
    journals.map((j) => {
      const tags = [];
      if (j.indexing.medline === "indexed") tags.push("MEDLINE");
      else if (j.indexing.pubmed === "indexed") tags.push("PubMed");
      if (j.indexing.wos !== "none") tags.push(`WoS ${j.indexing.wos}`);
      if (j.indexing.scopus === "indexed") tags.push("Scopus");
      if (j.indexing.doaj === "indexed") tags.push("DOAJ");
      return tags.join(", ") || "Not indexed";
    }),
    "higher",
  );
  // Cost (lower is better)
  pushRow(
    "cost",
    "Cost to publish",
    journals.map(apcCost),
    journals.map((j) => {
      const model = APC_LABEL[j.apcModel || "unknown"];
      if (apcCost(j) === 0) return model;
      if (typeof j.apcUsd === "number") return `$${j.apcUsd.toLocaleString()} · ${model}`;
      return model;
    }),
    "lower",
  );
  // Speed (lower days is better)
  pushRow(
    "speed",
    "Time to decision",
    journals.map((j) => (typeof j.decisionTimeDays === "number" ? j.decisionTimeDays : Infinity)),
    journals.map((j) => (typeof j.decisionTimeDays === "number" ? `~${j.decisionTimeDays} days` : "Unknown")),
    "lower",
  );
  // Open access (neutral — just inform)
  pushRow(
    "oa",
    "Open access",
    journals.map(() => 0),
    journals.map((j) => (j.oaModel === "subscription" ? "Subscription" : j.oaModel)),
    "neutral",
  );
  // Scope (neutral)
  pushRow(
    "scope",
    "Scope",
    journals.map(() => 0),
    journals.map((j) => j.scope.slice(0, 90) + (j.scope.length > 90 ? "…" : "")),
    "neutral",
  );

  // Overall suggestion: weight trust 0.4, impact 0.35, cost (free bonus) 0.15, speed 0.1.
  const norm = (vals: number[], dir: "higher" | "lower") => {
    const finite = vals.filter((v) => Number.isFinite(v));
    if (!finite.length) return vals.map(() => 0.5);
    const min = Math.min(...finite);
    const max = Math.max(...finite);
    const span = max - min || 1;
    return vals.map((v) => {
      if (!Number.isFinite(v)) return 0.3;
      const x = (v - min) / span;
      return dir === "higher" ? x : 1 - x;
    });
  };
  const ts = norm(trust.map((t) => t.score), "higher");
  const is = norm(impact.map((m) => m.value ?? 0), "higher");
  const cs = norm(journals.map(apcCost), "lower");
  const ss = norm(journals.map((j) => (typeof j.decisionTimeDays === "number" ? j.decisionTimeDays : 365)), "lower");
  const composite = journals.map((_, i) => ts[i] * 0.4 + is[i] * 0.35 + cs[i] * 0.15 + ss[i] * 0.1);
  let bestIdx = 0;
  for (let i = 1; i < n; i++) if (composite[i] > composite[bestIdx]) bestIdx = i;
  const j = journals[bestIdx];
  const rationale = `Strong balance of credibility (${trust[bestIdx].level}), ${impact[bestIdx].label}, ${j.freeApc ? "no APC" : "cost"} and turnaround. Verify fit and current status before submitting.`;

  return { journals, rows, suggestion: { index: bestIdx, rationale } };
}
