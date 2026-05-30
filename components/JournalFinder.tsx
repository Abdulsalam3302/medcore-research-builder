"use client";

import { useMemo, useState } from "react";
import type { ProjectState } from "@/lib/types";
import type { JournalMatch, JournalFilters, WosCollection } from "@/lib/journals/types";
import { buildSubmissionFormat } from "@/lib/journals/formatting";
import { compareJournals, type ComparisonResult } from "@/lib/journals/compare";
import { buildSubmissionStrategy, type LadderTier } from "@/lib/journals/strategy";
import { predatoryQuestions, assessPredatory, type CheckAnswer } from "@/lib/journals/predatoryCheck";
import { anticipateImpact, assessTrust, quickProfile } from "@/lib/journals/anticipate";
import { journalBestPractices } from "@/lib/journals/bestPractices";
import { Card, CardBody, CardHeader } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { CopyButton } from "./ui/CopyButton";
import { downloadAsFile } from "@/lib/store";

function trustBadge(level: ReturnType<typeof assessTrust>["level"]): { kind: "good" | "info" | "warn" | "bad"; label: string } {
  if (level === "high") return { kind: "good", label: "Trusted" };
  if (level === "moderate") return { kind: "info", label: "Likely OK" };
  if (level === "caution") return { kind: "warn", label: "Check carefully" };
  return { kind: "bad", label: "High risk" };
}

function deriveProfile(project: ProjectState) {
  const ti = project.titleInputs || {};
  const title = project.titleFinal || ti.draftTitle || "";
  const keywords = [ti.intervention, ti.outcome, ti.problem, ti.researchType]
    .filter((s): s is string => Boolean(s && s.trim()))
    .map((s) => s.trim());
  const scope = [ti.population, ti.problem, ti.setting].filter(Boolean).join(" ");
  const abstract = project.sections?.introduction?.slice(0, 1200) || "";
  return {
    title,
    abstract,
    keywords,
    scope,
    designCategory:
      project.researchTypeResult?.designId ||
      project.researchTypeAnswers?.designId ||
      project.researchTypeAnswers?.designFamily,
    manuscriptType: project.researchTypeAnswers?.manuscriptType,
  };
}

const WOS_OPTIONS: { value: WosCollection; label: string }[] = [
  { value: "SCIE", label: "WoS SCIE" },
  { value: "ESCI", label: "WoS ESCI (emerging)" },
];

const DECISION_TIME_OPTIONS: { value: number; label: string }[] = [
  { value: 30, label: "≤30 days" },
  { value: 60, label: "≤60 days" },
  { value: 90, label: "≤90 days" },
];

const MAX_COMPARE = 4;

function wosBadge(w: WosCollection) {
  if (w === "SCIE" || w === "SSCI") return <Badge kind="good">SCIE</Badge>;
  if (w === "ESCI") return <Badge kind="info">ESCI</Badge>;
  return <Badge kind="neutral">WoS: no</Badge>;
}

export function JournalFinder({ project }: { project: ProjectState }) {
  const auto = useMemo(() => deriveProfile(project), [project]);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<JournalFilters>({});
  const [matches, setMatches] = useState<JournalMatch[]>([]);
  const [counts, setCounts] = useState<{ total: number; curated: number; saudi: number; generated: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showPractices, setShowPractices] = useState(false);
  // Side-by-side comparison.
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [compareErr, setCompareErr] = useState<string | null>(null);
  // Real-time "check any journal" panel.
  const [checkQ, setCheckQ] = useState("");
  const [checkBusy, setCheckBusy] = useState(false);
  const [checkResult, setCheckResult] = useState<Record<string, unknown> | null>(null);
  const [checkErr, setCheckErr] = useState<string | null>(null);

  async function checkJournal() {
    if (!checkQ.trim()) return;
    setCheckBusy(true);
    setCheckErr(null);
    setCheckResult(null);
    try {
      const isIssn = /^\d{4}-?\d{3}[\dxX]$/.test(checkQ.trim());
      const param = isIssn ? `issn=${encodeURIComponent(checkQ.trim())}` : `q=${encodeURIComponent(checkQ.trim())}`;
      const r = await fetch(`/api/journals/check?${param}`, { cache: "no-store" });
      const data = (await r.json()) as Record<string, unknown> & { error?: string };
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      setCheckResult(data);
    } catch (e) {
      setCheckErr(e instanceof Error ? e.message : String(e));
    } finally {
      setCheckBusy(false);
    }
  }

  async function run() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/journals/finder", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: auto.title,
          abstract: auto.abstract,
          keywords: auto.keywords,
          scope: auto.scope,
          designCategory: auto.designCategory,
          manuscriptType: auto.manuscriptType,
          filters: { ...filters, query: query.trim() || undefined },
          limit: 40,
        }),
      });
      const data = (await res.json()) as { matches?: JournalMatch[]; counts?: typeof counts; error?: string };
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setMatches(data.matches || []);
      setCounts(data.counts || null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  function toggleWos(w: WosCollection) {
    setFilters((f) => {
      const cur = new Set(f.wos || []);
      if (cur.has(w)) cur.delete(w);
      else cur.add(w);
      return { ...f, wos: Array.from(cur) };
    });
  }

  function toggleCompare(id: string) {
    setCompareErr(null);
    setCompareIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= MAX_COMPARE) {
          setCompareErr(`You can compare up to ${MAX_COMPARE} journals at a time.`);
          return prev;
        }
        next.add(id);
      }
      return next;
    });
  }

  function runComparison() {
    const records = matches
      .filter((m) => compareIds.has(m.journal.id))
      .map((m) => m.journal);
    if (records.length < 2) {
      setCompareErr("Select at least 2 journals to compare.");
      return;
    }
    setCompareErr(null);
    setComparison(compareJournals(records));
  }

  function clearComparison() {
    setComparison(null);
    setCompareIds(new Set());
    setCompareErr(null);
  }

  const selected = selectedId ? matches.find((m) => m.journal.id === selectedId)?.journal : undefined;
  const submission = selected ? buildSubmissionFormat(selected, project) : null;

  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader
          title="Journal Finder"
          subtitle="Ranks journals by topical fit + indexing quality from your manuscript. Indexing/metrics must be verified at the official source before you submit."
        />
        <CardBody className="grid gap-4">
          <div className="grid gap-2 rounded-lg border border-med-line bg-slate-50/60 p-3 text-[12.5px] text-med-sub">
            <div>
              <span className="font-semibold text-med-ink">Auto profile from your project:</span>{" "}
              {auto.title ? `“${auto.title}”` : "no title yet"}
              {auto.manuscriptType ? ` · ${auto.manuscriptType.replace(/_/g, " ")}` : ""}
              {auto.keywords.length ? ` · ${auto.keywords.slice(0, 6).join(", ")}` : ""}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              className="input flex-1 min-w-[200px]"
              placeholder="Optional keyword filter (e.g. cardiology, open access)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="button" className="btn-primary" onClick={run} disabled={busy}>
              {busy ? "Finding…" : "Find journals"}
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 text-[12px]">
            {WOS_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => toggleWos(o.value)}
                className={`pill-tab ${filters.wos?.includes(o.value) ? "pill-tab-active" : ""}`}
              >
                {o.label}
              </button>
            ))}
            <FilterToggle label="Scopus" on={!!filters.requireScopus} onClick={() => setFilters((f) => ({ ...f, requireScopus: !f.requireScopus }))} />
            <FilterToggle label="PubMed" on={!!filters.requirePubmed} onClick={() => setFilters((f) => ({ ...f, requirePubmed: !f.requirePubmed }))} />
            <FilterToggle label="MEDLINE" on={!!filters.requireMedline} onClick={() => setFilters((f) => ({ ...f, requireMedline: !f.requireMedline }))} />
            <FilterToggle label="Open access" on={!!filters.openAccessOnly} onClick={() => setFilters((f) => ({ ...f, openAccessOnly: !f.openAccessOnly }))} />
            <FilterToggle label="Free to publish" on={!!filters.freeApcOnly} onClick={() => setFilters((f) => ({ ...f, freeApcOnly: !f.freeApcOnly }))} />
            <FilterToggle label="🇸🇦 Saudi only" on={!!filters.saudiOnly} onClick={() => setFilters((f) => ({ ...f, saudiOnly: !f.saudiOnly }))} />
          </div>

          {/* Decision-time chips. */}
          <div className="flex flex-wrap items-center gap-2 text-[12px]">
            <span className="text-med-sub">Decision time:</span>
            {DECISION_TIME_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() =>
                  setFilters((f) => ({ ...f, maxDecisionDays: f.maxDecisionDays === o.value ? undefined : o.value }))
                }
                className={`pill-tab ${filters.maxDecisionDays === o.value ? "pill-tab-active" : ""}`}
              >
                {o.label}
              </button>
            ))}
            {filters.maxDecisionDays != null && (
              <button
                type="button"
                onClick={() => setFilters((f) => ({ ...f, maxDecisionDays: undefined }))}
                className="text-[11px] text-med-sub hover:text-med-ink underline"
              >
                Clear
              </button>
            )}
          </div>

          {counts && (
            <div className="text-[11.5px] text-med-sub">
              Database: <strong className="text-med-ink">{counts.total.toLocaleString()}</strong> journals
              {" · "}{counts.curated} curated{" · "}{counts.saudi} Saudi
              {counts.generated ? ` · ${counts.generated.toLocaleString()} ingested` : ""}
            </div>
          )}
          <div className="text-[11px] text-amber-700">
            ⚠ Impact factors, quartiles, and indexing shown here are indicative and dated — always
            confirm the current status at the official source (links on each journal) before submitting.
          </div>
          {err && <div role="alert" className="text-sm text-med-bad">{err}</div>}
        </CardBody>
      </Card>

      {/* Real-time check: look up ANY journal live (OpenAlex + DOAJ). */}
      <Card>
        <CardHeader
          title="Check any journal (real-time)"
          subtitle="Considering a journal not in the list? Look it up live by name or ISSN — get an anticipated metric, open-access/APC, and a trust read with official verify links."
        />
        <CardBody className="grid gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              className="input flex-1 min-w-[220px]"
              placeholder="Journal name or ISSN (e.g. 1471-2458)"
              value={checkQ}
              onChange={(e) => setCheckQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") checkJournal(); }}
            />
            <button type="button" className="btn-primary" onClick={checkJournal} disabled={checkBusy || !checkQ.trim()}>
              {checkBusy ? "Checking…" : "Check live"}
            </button>
          </div>
          {checkErr && <div role="alert" className="text-sm text-med-bad">{checkErr}</div>}
          {checkResult && <LiveCheckResult data={checkResult} />}
        </CardBody>
      </Card>

      {/* Best-practice coaching (attributed). */}
      <Card>
        <CardHeader
          title="How to choose well — best practices"
          subtitle="Journal selection is where many strong papers stall. These attributed principles help you choose confidently and avoid predatory venues."
          right={
            <button type="button" className="btn-secondary text-xs" onClick={() => setShowPractices((s) => !s)}>
              {showPractices ? "Hide" : "Show"}
            </button>
          }
        />
        {showPractices && (
          <CardBody className="grid gap-3">
            {journalBestPractices.map((p) => (
              <div key={p.id} className="rounded-lg border border-med-line p-3">
                <div className="font-semibold text-[13px] text-med-ink">{p.step}</div>
                <p className="text-[12.5px] text-med-inkSoft mt-1">{p.principle}</p>
                <p className="text-[11.5px] text-med-sub mt-1"><em>Why:</em> {p.why}</p>
                <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[11.5px] text-med-brand hover:underline mt-1 inline-block">
                  {p.source} →
                </a>
              </div>
            ))}
          </CardBody>
        )}
      </Card>

      {matches.length > 0 && (
        <Card>
          <CardHeader
            title={`Ranked matches (${matches.length})`}
            subtitle="Click a journal for submission formatting and verification links. Use Compare to weigh up to 4 side by side."
          />
          <CardBody className="grid gap-2">
            {matches.map((m) => {
              const isSelected = selectedId === m.journal.id;
              const inCompare = compareIds.has(m.journal.id);
              return (
                <div
                  key={m.journal.id}
                  className={`rounded-lg border p-3 transition ${
                    isSelected ? "border-med-brand bg-sky-50/50" : "border-med-line hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedId(isSelected ? null : m.journal.id)}
                      className="text-left min-w-0 flex-1"
                    >
                      <div className="font-semibold text-[14px] text-med-ink flex items-center gap-2 flex-wrap">
                        {m.journal.name}
                        {m.journal.saudi && <Badge kind="info">🇸🇦 Saudi</Badge>}
                      </div>
                      <div className="text-[12px] text-med-sub mt-0.5">{m.journal.publisher} · {m.journal.country}</div>
                    </button>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {(() => { const t = trustBadge(assessTrust(m.journal).level); return <Badge kind={t.kind}>{t.label}</Badge>; })()}
                      {wosBadge(m.journal.indexing.wos)}
                      <Badge kind={m.score >= 70 ? "good" : m.score >= 45 ? "info" : "neutral"}>{m.score}</Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(() => {
                      const a = anticipateImpact(m.journal);
                      return a.value != null ? (
                        <Badge kind={a.confidence === "reported" ? "neutral" : "info"} >{a.label}</Badge>
                      ) : null;
                    })()}
                    {m.journal.metrics?.quartile && <Badge kind="neutral">{m.journal.metrics.quartile}</Badge>}
                    {m.journal.indexing.medline === "indexed" && <Badge kind="neutral">MEDLINE</Badge>}
                    {m.journal.indexing.scopus === "indexed" && <Badge kind="neutral">Scopus</Badge>}
                    {m.journal.freeApc && <Badge kind="good">Free to publish</Badge>}
                    {m.journal.apcModel === "gold-apc" && typeof m.journal.apcUsd === "number" && <Badge kind="neutral">APC ${m.journal.apcUsd}</Badge>}
                    {m.journal.apcModel === "subscription" && !m.journal.freeApc && <Badge kind="neutral">Subscription</Badge>}
                  </div>
                  <div className="text-[11px] text-med-sub mt-1.5">{quickProfile(m.journal)}</div>
                  {m.reasons.length > 0 && (
                    <div className="text-[11.5px] text-med-sub mt-2">✓ {m.reasons.slice(0, 3).join(" · ")}</div>
                  )}
                  {m.cautions.length > 0 && (
                    <div className="text-[11.5px] text-amber-700 mt-1">⚠ {m.cautions.slice(0, 2).join(" · ")}</div>
                  )}
                  <div className="mt-2.5 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => toggleCompare(m.journal.id)}
                      aria-pressed={inCompare}
                      disabled={!inCompare && compareIds.size >= MAX_COMPARE}
                      className={`pill-tab text-[11.5px] ${inCompare ? "pill-tab-active" : ""} disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      {inCompare ? "✓ Comparing" : "+ Compare"}
                    </button>
                  </div>
                </div>
              );
            })}
          </CardBody>
        </Card>
      )}

      {/* Sticky compare action bar. */}
      {compareIds.size >= 2 && (
        <div className="sticky bottom-4 z-20 flex justify-center">
          <div className="flex items-center gap-3 rounded-full border border-med-line bg-white px-4 py-2 shadow-lg">
            <span className="text-[12.5px] font-medium text-med-ink">
              {compareIds.size} selected{compareIds.size >= MAX_COMPARE ? " (max)" : ""}
            </span>
            <button type="button" className="btn-primary text-xs" onClick={runComparison}>
              Compare ({compareIds.size})
            </button>
            <button
              type="button"
              className="text-[12px] text-med-sub hover:text-med-ink underline"
              onClick={clearComparison}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {compareErr && <div role="alert" className="text-sm text-med-bad">{compareErr}</div>}

      {comparison && comparison.journals.length >= 2 && (
        <Card>
          <CardHeader
            title={`Comparison (${comparison.journals.length})`}
            subtitle="Side by side on the dimensions that matter. Highlighted cells lead their row. Verify current status before submitting."
            right={
              <div className="flex items-center gap-1.5">
                <CopyButton text={renderComparisonText(comparison)} label="Copy summary" />
                <button type="button" className="btn-secondary text-xs" onClick={clearComparison}>
                  Clear comparison
                </button>
              </div>
            }
          />
          <CardBody className="grid gap-3">
            {comparison.suggestion && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-[12.5px]">
                <span className="font-semibold text-emerald-900">
                  Suggested pick: {comparison.journals[comparison.suggestion.index]?.name}
                </span>
                <p className="text-emerald-800 mt-0.5">{comparison.suggestion.rationale}</p>
              </div>
            )}
            <div className="overflow-x-auto -mx-1 px-1">
              <table className="w-full border-collapse text-[12.5px]">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 bg-white text-left p-2 font-medium text-med-sub align-bottom min-w-[120px]">
                      Dimension
                    </th>
                    {comparison.journals.map((j, i) => {
                      const t = trustBadge(assessTrust(j).level);
                      const a = anticipateImpact(j);
                      return (
                        <th key={j.id} className="text-left p-2 align-bottom min-w-[150px]">
                          <div className="font-semibold text-med-ink flex items-center gap-1.5 flex-wrap">
                            {j.name}
                            {comparison.suggestion?.index === i && <Badge kind="good">Pick</Badge>}
                          </div>
                          <div className="text-[11px] text-med-sub font-normal mt-0.5">{j.publisher}</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            <Badge kind={t.kind}>{t.label}</Badge>
                            {a.value != null && (
                              <Badge kind={a.confidence === "reported" ? "neutral" : "info"}>{a.label}</Badge>
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {comparison.rows.map((row) => (
                    <tr key={row.key} className="border-t border-med-line">
                      <th className="sticky left-0 z-10 bg-white text-left p-2 font-medium text-med-sub align-top">
                        {row.label}
                        {row.direction !== "neutral" && (
                          <span className="block text-[10px] text-med-sub font-normal">
                            {row.direction === "higher" ? "higher is better" : "lower is better"}
                          </span>
                        )}
                      </th>
                      {row.cells.map((cell, i) => {
                        const best = row.bestIndexes.includes(i);
                        return (
                          <td
                            key={i}
                            className={`p-2 align-top ${
                              best ? "bg-emerald-50 ring-1 ring-inset ring-emerald-300 rounded text-emerald-900 font-medium" : "text-med-inkSoft"
                            }`}
                          >
                            {cell}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-[11px] text-amber-700">
              ⚠ Metrics, indexing and turnaround are indicative — confirm at the official source before submitting.
            </div>
          </CardBody>
        </Card>
      )}

      {matches.length >= 2 && <SubmissionLadder matches={matches} />}

      <PredatoryChecklist />

      {selected && submission && (
        <Card>
          <CardHeader
            title={`Submission formatting — ${selected.name}`}
            subtitle="Journal-specific package checklist and title-page scaffold."
            right={
              <div className="flex gap-1.5">
                {selected.authorGuideUrl && (
                  <a className="btn-secondary text-xs" href={selected.authorGuideUrl} target="_blank" rel="noopener noreferrer">Author guide</a>
                )}
                <button
                  type="button"
                  className="btn-secondary text-xs"
                  onClick={() => downloadAsFile(`submission-${selected.id}.md`, renderSubmissionMd(submission), "text/markdown")}
                >
                  Download .md
                </button>
              </div>
            }
          />
          <CardBody className="grid gap-4">
            {/* Verify links */}
            <div className="flex flex-wrap gap-1.5 text-[11.5px]">
              {selected.verifyUrls?.wos && <a className="pill-tab" href={selected.verifyUrls.wos} target="_blank" rel="noopener noreferrer">Verify WoS</a>}
              {selected.verifyUrls?.scopus && <a className="pill-tab" href={selected.verifyUrls.scopus} target="_blank" rel="noopener noreferrer">Verify Scopus</a>}
              {selected.verifyUrls?.nlm && <a className="pill-tab" href={selected.verifyUrls.nlm} target="_blank" rel="noopener noreferrer">Verify NLM/MEDLINE</a>}
              {selected.verifyUrls?.doaj && <a className="pill-tab" href={selected.verifyUrls.doaj} target="_blank" rel="noopener noreferrer">Verify DOAJ</a>}
            </div>

            <div className="grid gap-2">
              {submission.items.map((it) => (
                <div key={it.id} className="flex items-start gap-2 text-[12.5px]">
                  <Badge kind={it.status === "ok" ? "good" : it.status === "action" ? "warn" : "neutral"}>
                    {it.status === "ok" ? "✓" : it.status === "action" ? "todo" : "info"}
                  </Badge>
                  <div>
                    <span className="font-medium text-med-ink">{it.label}.</span>{" "}
                    <span className="text-med-sub">{it.detail}</span>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="text-[11px] uppercase tracking-wide text-med-sub">Title page scaffold</div>
                <CopyButton text={submission.titlePage} label="Copy" />
              </div>
              <pre className="text-[12px] bg-slate-50 border border-med-line rounded-lg p-3 whitespace-pre-wrap font-mono">{submission.titlePage}</pre>
            </div>

            <div className="text-[12px] text-med-sub border border-med-line rounded-lg p-3 bg-slate-50/60">
              <strong className="text-med-ink">Reference style:</strong> {submission.referenceStyleNote}
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-wide text-med-sub mb-1">Submission package</div>
              <ul className="list-disc list-inside text-[12.5px] text-med-inkSoft space-y-0.5">
                {submission.packageChecklist.map((p) => <li key={p}>{p}</li>)}
              </ul>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function FilterToggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`pill-tab ${on ? "pill-tab-active" : ""}`}>
      {label}
    </button>
  );
}

function renderComparisonText(c: ComparisonResult): string {
  const names = c.journals.map((j) => j.name);
  const lines: string[] = [`Journal comparison: ${names.join(" vs ")}`, ""];
  for (const row of c.rows) {
    lines.push(`${row.label}:`);
    row.cells.forEach((cell, i) => {
      const win = row.bestIndexes.includes(i) ? "  ← best" : "";
      lines.push(`  - ${names[i]}: ${cell}${win}`);
    });
    lines.push("");
  }
  if (c.suggestion) {
    lines.push(`Suggested pick: ${names[c.suggestion.index]}`);
    lines.push(c.suggestion.rationale);
  }
  lines.push("");
  lines.push("Verify indexing, metrics and turnaround at the official source before submitting.");
  return lines.join("\n");
}

function renderSubmissionMd(s: ReturnType<typeof buildSubmissionFormat>): string {
  return [
    `# Submission formatting — ${s.journalName}`,
    "",
    "## Title page",
    s.titlePage,
    "",
    "## Reference style",
    s.referenceStyleNote,
    "",
    "## Checklist",
    ...s.items.map((i) => `- [${i.status === "ok" ? "x" : " "}] ${i.label}: ${i.detail}`),
    "",
    "## Submission package",
    ...s.packageChecklist.map((p) => `- [ ] ${p}`),
  ].join("\n");
}

/** Renders the live /api/journals/check result with honest framing. */
function LiveCheckResult({ data }: { data: Record<string, unknown> }) {
  if (data.found === false) {
    const verify = (data.verify || {}) as Record<string, string>;
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-[12.5px]">
        <div className="font-medium text-amber-900">{String(data.message || "Not found.")}</div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {Object.entries(verify).map(([k, url]) => (
            <a key={k} href={url} target="_blank" rel="noopener noreferrer" className="pill-tab">{k}</a>
          ))}
        </div>
      </div>
    );
  }
  const j = (data.journal || {}) as Record<string, unknown>;
  const ant = (data.anticipated || {}) as Record<string, unknown>;
  const verify = (data.verify || {}) as Record<string, string>;
  return (
    <div className="rounded-lg border border-med-line p-3 grid gap-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold text-med-ink text-[14px]">{String(j.name)}</div>
          <div className="text-[12px] text-med-sub">{String(j.publisher || "")}{j.country ? ` · ${j.country}` : ""}{j.issn ? ` · ISSN ${j.issn}` : ""}</div>
        </div>
        <Badge kind="info">live · {String(data.source || "OpenAlex")}</Badge>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {ant.impactEstimate != null && <Badge kind="info">≈ {String(ant.impactEstimate)} (est.)</Badge>}
        {j.inDoaj ? <Badge kind="good">DOAJ</Badge> : null}
        {j.isOpenAccess ? <Badge kind="neutral">Open access</Badge> : null}
        {j.freeApc ? <Badge kind="good">Free to publish</Badge> : (typeof j.apcUsd === "number" ? <Badge kind="neutral">APC ${String(j.apcUsd)}</Badge> : null)}
        {typeof j.hIndex === "number" && <Badge kind="neutral">h-index {String(j.hIndex)}</Badge>}
        {typeof j.worksCount === "number" && <Badge kind="neutral">{Number(j.worksCount).toLocaleString()} articles</Badge>}
      </div>
      <p className="text-[11px] text-med-sub">{String(ant.basis || "")}</p>
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(verify).map(([k, url]) => (
          <a key={k} href={url} target="_blank" rel="noopener noreferrer" className="pill-tab text-[11px]">Verify: {k}</a>
        ))}
      </div>
    </div>
  );
}

const TIER_META: Record<LadderTier, { label: string; kind: "bad" | "good" | "info" }> = {
  reach: { label: "Reach", kind: "info" },
  match: { label: "Match", kind: "good" },
  safe: { label: "Safe", kind: "good" },
};

/** Tiered submission ladder (reach → match → safe) from the ranked matches. */
function SubmissionLadder({ matches }: { matches: JournalMatch[] }) {
  const strategy = useMemo(() => buildSubmissionStrategy(matches), [matches]);
  if (!strategy.rungs.length) return null;
  return (
    <Card>
      <CardHeader
        title="Your submission strategy (tiered ladder)"
        subtitle="Aim high, plan your pivots: submit top-down so a rejection costs days, not months."
      />
      <CardBody className="grid gap-3">
        <div className="grid gap-2">
          {strategy.rungs.map((r, i) => {
            const meta = TIER_META[r.tier];
            return (
              <div key={`${r.journal.id}-${i}`} className="rounded-lg border border-med-line p-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Badge kind={meta.kind}>{meta.label}</Badge>
                    <span className="font-semibold text-[13.5px] text-med-ink">{r.journal.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-med-sub">
                    <Badge kind="neutral">{r.impactLabel}</Badge>
                    <Badge kind="neutral">fit {r.fitScore}</Badge>
                    <Badge kind="neutral">{r.cost}</Badge>
                  </div>
                </div>
                <p className="text-[11.5px] text-med-sub mt-1.5">{r.rationale}</p>
              </div>
            );
          })}
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-med-sub mb-1">Action plan</div>
          <ol className="text-[12.5px] text-med-inkSoft list-decimal list-inside grid gap-1">
            {strategy.plan.map((p, i) => <li key={i}>{p.replace(/^\d+\.\s*/, "")}</li>)}
          </ol>
        </div>
        {strategy.cautions.length > 0 && (
          <div className="text-[11.5px] text-amber-700">
            {strategy.cautions.map((c, i) => <div key={i}>⚠ {c}</div>)}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

/** Interactive Think.Check.Submit-style predatory self-assessment. */
function PredatoryChecklist() {
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<string, CheckAnswer>>({});
  const result = useMemo(
    () => (Object.keys(answers).length ? assessPredatory(answers) : null),
    [answers],
  );
  const verdictKind: Record<string, "good" | "info" | "warn" | "bad"> = {
    "looks-legitimate": "good",
    "mostly-ok": "info",
    caution: "warn",
    "likely-predatory": "bad",
  };
  return (
    <Card>
      <CardHeader
        title="Is this journal trustworthy? (Think.Check.Submit self-check)"
        subtitle="Answer a few questions about a journal you're unsure of. An aid, not a verdict — always confirm at thinkchecksubmit.org."
        right={
          <button type="button" className="btn-secondary text-xs" onClick={() => setOpen((s) => !s)}>
            {open ? "Hide" : "Open checklist"}
          </button>
        }
      />
      {open && (
        <CardBody className="grid gap-3">
          {predatoryQuestions.map((q) => (
            <div key={q.id} className="rounded-lg border border-med-line p-3">
              <div className="text-[13px] text-med-ink">{q.question}</div>
              <div className="text-[11px] text-med-sub mt-0.5">{q.help}</div>
              <div className="flex gap-1.5 mt-2">
                {(["yes", "no", "unsure"] as CheckAnswer[]).map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: a }))}
                    className={`pill-tab text-[12px] ${answers[q.id] === a ? "pill-tab-active" : ""}`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {result && (
            <div className={`rounded-lg border p-3 ${result.verdict === "likely-predatory" ? "border-rose-200 bg-rose-50/60" : result.verdict === "caution" ? "border-amber-200 bg-amber-50/60" : "border-emerald-200 bg-emerald-50/60"}`}>
              <div className="flex items-center gap-2">
                <Badge kind={verdictKind[result.verdict]}>{result.verdict.replace(/-/g, " ")}</Badge>
                <span className="text-[13px] font-semibold text-med-ink">Safety score: {result.score}/100</span>
              </div>
              <p className="text-[12.5px] text-med-inkSoft mt-1.5">{result.advice}</p>
              <a href="https://thinkchecksubmit.org/journals/" target="_blank" rel="noopener noreferrer" className="text-[11.5px] text-med-brand hover:underline mt-1 inline-block">
                Complete the full Think.Check.Submit checklist →
              </a>
            </div>
          )}
        </CardBody>
      )}
    </Card>
  );
}
