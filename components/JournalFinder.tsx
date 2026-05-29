"use client";

import { useMemo, useState } from "react";
import type { ProjectState } from "@/lib/types";
import type { JournalMatch, JournalFilters, WosCollection } from "@/lib/journals/types";
import { buildSubmissionFormat } from "@/lib/journals/formatting";
import { getJournalById } from "@/lib/journals";
import { Card, CardBody, CardHeader } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { CopyButton } from "./ui/CopyButton";
import { downloadAsFile } from "@/lib/store";

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

  const selected = selectedId ? getJournalById(selectedId) : undefined;
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
            <FilterToggle label="🇸🇦 Saudi only" on={!!filters.saudiOnly} onClick={() => setFilters((f) => ({ ...f, saudiOnly: !f.saudiOnly }))} />
          </div>

          {counts && (
            <div className="text-[11.5px] text-med-sub">
              Database: <strong className="text-med-ink">{counts.total.toLocaleString()}</strong> journals
              {" · "}{counts.curated} curated{" · "}{counts.saudi} Saudi
              {counts.generated ? ` · ${counts.generated.toLocaleString()} ingested` : ""}
            </div>
          )}
          {err && <div role="alert" className="text-sm text-med-bad">{err}</div>}
        </CardBody>
      </Card>

      {matches.length > 0 && (
        <Card>
          <CardHeader title={`Ranked matches (${matches.length})`} subtitle="Click a journal for submission formatting and verification links." />
          <CardBody className="grid gap-2">
            {matches.map((m) => (
              <button
                key={m.journal.id}
                type="button"
                onClick={() => setSelectedId(m.journal.id === selectedId ? null : m.journal.id)}
                className={`text-left rounded-lg border p-3 transition ${
                  selectedId === m.journal.id ? "border-med-brand bg-sky-50/50" : "border-med-line hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-[14px] text-med-ink flex items-center gap-2 flex-wrap">
                      {m.journal.name}
                      {m.journal.saudi && <Badge kind="info">🇸🇦 Saudi</Badge>}
                    </div>
                    <div className="text-[12px] text-med-sub mt-0.5">{m.journal.publisher} · {m.journal.country}</div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {wosBadge(m.journal.indexing.wos)}
                    <Badge kind={m.score >= 70 ? "good" : m.score >= 45 ? "info" : "neutral"}>{m.score}</Badge>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {m.journal.metrics?.impactFactor != null && (
                    <Badge kind="neutral">IF {m.journal.metrics.impactFactor}</Badge>
                  )}
                  {m.journal.metrics?.quartile && <Badge kind="neutral">{m.journal.metrics.quartile}</Badge>}
                  {m.journal.indexing.medline === "indexed" && <Badge kind="neutral">MEDLINE</Badge>}
                  {m.journal.indexing.scopus === "indexed" && <Badge kind="neutral">Scopus</Badge>}
                  {(m.journal.oaModel === "gold" || m.journal.oaModel === "diamond") && <Badge kind="neutral">OA</Badge>}
                </div>
                {m.reasons.length > 0 && (
                  <div className="text-[11.5px] text-med-sub mt-2">✓ {m.reasons.slice(0, 3).join(" · ")}</div>
                )}
                {m.cautions.length > 0 && (
                  <div className="text-[11.5px] text-amber-700 mt-1">⚠ {m.cautions.slice(0, 2).join(" · ")}</div>
                )}
              </button>
            ))}
          </CardBody>
        </Card>
      )}

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
