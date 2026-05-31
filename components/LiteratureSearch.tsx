"use client";

import { useState } from "react";
import type { ProjectState } from "@/lib/types";
import { Card, CardBody, CardHeader } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { CopyButton } from "./ui/CopyButton";
import { InfoHint } from "./ui/InfoHint";

type Update = (fn: (p: ProjectState) => ProjectState) => void;

type Paper = {
  id: string;
  source: string;
  pmid?: string;
  pmcid?: string;
  doi?: string;
  title: string;
  authors: string[];
  journal?: string;
  year?: string;
  isOpenAccess?: boolean;
  isPreprint?: boolean;
  citedByCount?: number;
  url: string;
  abstract?: string;
};

/** Build a Vancouver-style citation line from a real Europe PMC record. */
function toVancouver(p: Paper): string {
  const a = p.authors || [];
  const authors = a.length
    ? a.slice(0, 6).join(", ") + (a.length > 6 ? ", et al." : "")
    : "[authors]";
  const bits = [`${authors}. ${p.title}.`];
  if (p.journal) bits.push(`${p.journal}.`);
  if (p.year) bits.push(`${p.year}.`);
  if (p.doi) bits.push(`doi:${p.doi}.`);
  else if (p.pmid) bits.push(`PMID:${p.pmid}.`);
  return bits.join(" ");
}

export function LiteratureSearch({ project, update }: { project: ProjectState; update: Update }) {
  const [q, setQ] = useState("");
  const [papers, setPapers] = useState<Paper[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [searched, setSearched] = useState(false);

  async function run() {
    if (!q.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(
        `/api/europepmc/search?query=${encodeURIComponent(q.trim())}&page_size=25`,
        { cache: "no-store" },
      );
      const data = (await res.json()) as { results?: Paper[]; error?: string };
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setPapers(data.results || []);
      setSearched(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  function addToReferences(p: Paper) {
    const line = toVancouver(p);
    update((proj) => {
      const raw = proj.references?.raw || "";
      const next = raw.trim() ? `${raw.trim()}\n${line}` : line;
      return { ...proj, references: { ...proj.references, raw: next } };
    });
    setAdded((s) => new Set(s).add(p.id));
  }

  function useSuggested() {
    const t = project.titleFinal || project.titleInputs?.draftTitle || "";
    const kws = [project.titleInputs?.problem, project.titleInputs?.intervention, project.titleInputs?.outcome]
      .filter(Boolean)
      .join(" ");
    setQ((t || kws || "").slice(0, 200));
  }

  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader
          title={
            <InfoHint
              title="Real papers, from a real database"
              text="This searches Europe PMC — a live index of PubMed records, preprints, and open-access full text. Every result is an actual published or preprinted article that links back to its source record, so nothing here is invented. Use it to ground your references in real literature rather than relying on memory or generated text."
              side="right"
            >
              Literature Search (Europe PMC)
            </InfoHint>
          }
          subtitle="Search real peer-reviewed articles and preprints. Every result links to its source — citations are never fabricated. Add any paper to your reference list with one click."
        />
        <CardBody className="grid gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              aria-label="Literature search query"
              className="input flex-1 min-w-[220px]"
              placeholder="e.g. empagliflozin cardiovascular outcomes type 2 diabetes"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") run();
              }}
            />
            <InfoHint
              title="Search with your own terms"
              text="Builds a query from your final/draft title and PICO fields (problem, intervention, outcome) so results are relevant to your study. It's a starting point — edit the query to broaden or narrow it, since database search rewards specific, well-chosen keywords."
              side="bottom"
            >
              <button type="button" className="btn-secondary" onClick={useSuggested} title="Use your title/PICO as the query">
                From my project
              </button>
            </InfoHint>
            <button type="button" className="btn-primary" onClick={run} disabled={busy || !q.trim()}>
              {busy ? "Searching…" : "Search"}
            </button>
          </div>
          {err && <div role="alert" className="text-sm text-med-bad">{err}</div>}
          <p className="text-[11px] text-med-sub">
            Source: Europe PMC (PubMed + preprints + open access). Always verify the citation against the source record before submission.
          </p>
        </CardBody>
      </Card>

      {searched && papers.length === 0 && !busy && (
        <Card>
          <CardBody>
            <div className="text-sm text-med-sub">No results. Try broader terms or different keywords.</div>
          </CardBody>
        </Card>
      )}

      {papers.length > 0 && (
        <Card>
          <CardHeader
            title={
              <InfoHint
                title="Add pulls a real citation"
                text="'Add to references' builds a Vancouver-style line straight from this record's actual authors, title, journal, year, and DOI/PMID — it never fabricates a citation. Even so, confirm details against the linked source before submission, since database metadata can occasionally be incomplete."
                side="right"
              >
                {`Results (${papers.length})`}
              </InfoHint>
            }
            subtitle="Ranked by Europe PMC relevance."
          />
          <CardBody className="grid gap-2">
            {papers.map((p) => (
              <div key={p.id} className="rounded-lg border border-med-line p-3">
                <div className="flex items-start justify-between gap-3">
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-[13.5px] text-med-brand hover:underline min-w-0"
                  >
                    {p.title || "[untitled]"}
                  </a>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {p.isOpenAccess && <Badge kind="good">OA</Badge>}
                    {p.isPreprint && <Badge kind="warn">preprint</Badge>}
                    {typeof p.citedByCount === "number" && <Badge kind="neutral">{p.citedByCount} cites</Badge>}
                  </div>
                </div>
                <div className="text-[12px] text-med-sub mt-1">
                  {(p.authors || []).slice(0, 4).join(", ")}
                  {(p.authors || []).length > 4 ? ", et al." : ""}
                  {p.journal ? ` · ${p.journal}` : ""}
                  {p.year ? ` · ${p.year}` : ""}
                  {p.pmid ? ` · PMID ${p.pmid}` : ""}
                  {p.doi ? ` · doi:${p.doi}` : ""}
                </div>
                {p.abstract && (
                  <p className="text-[12px] text-med-inkSoft mt-2 line-clamp-3">{p.abstract.slice(0, 320)}…</p>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <button
                    type="button"
                    className="btn-secondary text-xs"
                    onClick={() => addToReferences(p)}
                    disabled={added.has(p.id)}
                  >
                    {added.has(p.id) ? "✓ Added to references" : "Add to references"}
                  </button>
                  <CopyButton text={toVancouver(p)} label="Copy citation" />
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
