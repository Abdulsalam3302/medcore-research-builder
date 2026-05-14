"use client";

import { useState } from "react";
import type { ParsedReference, ProjectState, ReferenceVerification } from "@/lib/types";
import { Card, CardBody, CardHeader } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { Spinner } from "./ui/Spinner";
import { downloadAsFile } from "@/lib/store";
import { referencesToCSV } from "@/lib/export";

const DEMO = `Page MJ, McKenzie JE, Bossuyt PM, Boutron I, Hoffmann TC, Mulrow CD, et al. The PRISMA 2020 statement: an updated guideline for reporting systematic reviews. BMJ. 2021;372:n71.
Schulz KF, Altman DG, Moher D; CONSORT Group. CONSORT 2010 statement: updated guidelines for reporting parallel group randomised trials. BMJ. 2010;340:c332.
Bossuyt PM, Reitsma JB, Bruns DE, Gatsonis CA, Glasziou PP, Irwig L, et al. STARD 2015: an updated list of essential items for reporting diagnostic accuracy studies. BMJ. 2015;351:h5527.
Collins GS, Reitsma JB, Altman DG, Moons KGM. Transparent reporting of a multivariable prediction model for individual prognosis or diagnosis (TRIPOD): the TRIPOD Statement. BMJ. 2015;350:g7594.`;

export function ReferenceVerifier({
  project,
  update,
}: {
  project: ProjectState;
  update: (fn: (p: ProjectState) => ProjectState) => void;
}) {
  const [busy, setBusy] = useState<"parse" | "verify" | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [parsed, setParsed] = useState<Array<{ originalText: string; parsed: ParsedReference }>>(
    []
  );

  const verifications = project.references.verifications;

  async function parse() {
    if (!project.references.raw.trim()) return;
    setBusy("parse");
    setErr(null);
    try {
      const r = await fetch("/api/llm/parse-references", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ raw: project.references.raw }),
      });
      const data = (await r.json()) as { references?: Array<{ originalText: string; parsed: ParsedReference }>; error?: string };
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      setParsed(data.references || []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  async function verify() {
    setBusy("verify");
    setErr(null);
    try {
      const items = parsed.length
        ? parsed
        : undefined; // server will parse if not provided
      const r = await fetch("/api/references/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(items ? { items } : { raw: project.references.raw }),
      });
      const data = (await r.json()) as {
        verifications?: ReferenceVerification[];
        error?: string;
      };
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      update((p) => ({
        ...p,
        references: { ...p.references, verifications: data.verifications || [] },
      }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader
          title="Reference Verifier"
          subtitle="Paste references in any common format. We parse, look up PubMed & Crossref, and produce a verification table."
          right={
            <button
              className="btn-ghost text-med-brand"
              onClick={() =>
                update((p) => ({ ...p, references: { ...p.references, raw: DEMO } }))
              }
            >
              Load demo
            </button>
          }
        />
        <CardBody className="grid gap-3">
          <textarea
            className="textarea min-h-[180px] font-mono text-xs"
            placeholder={`Paste references — one per line, blank-line separated, or numbered (Vancouver, AMA, APA, RIS-like). DOIs and PMIDs are auto-detected.`}
            value={project.references.raw}
            onChange={(e) =>
              update((p) => ({ ...p, references: { ...p.references, raw: e.target.value } }))
            }
          />
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn-secondary" onClick={parse} disabled={busy !== null}>
              {busy === "parse" && <Spinner dark />} Parse
            </button>
            <button
              className="btn-primary"
              onClick={verify}
              disabled={busy !== null || !project.references.raw.trim()}
            >
              {busy === "verify" && <Spinner />} Verify references
            </button>
            {verifications.length > 0 && (
              <button
                className="btn-secondary"
                onClick={() =>
                  downloadAsFile(
                    "medcore-references.csv",
                    referencesToCSV(verifications),
                    "text/csv"
                  )
                }
              >
                Export CSV
              </button>
            )}
            {err && <div className="text-sm text-med-bad">{err}</div>}
          </div>
          {parsed.length > 0 && verifications.length === 0 && (
            <div className="text-xs text-med-sub">
              Parsed {parsed.length} reference(s). Click <strong>Verify references</strong> to look them up in
              PubMed and Crossref.
            </div>
          )}
        </CardBody>
      </Card>

      {verifications.length > 0 && (
        <Card>
          <CardHeader
            title="Verification results"
            right={<SummaryBadges verifications={verifications} />}
          />
          <CardBody>
            <div className="grid gap-3">
              {verifications.map((v, i) => (
                <VerificationRow key={i} index={i + 1} v={v} />
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function SummaryBadges({ verifications }: { verifications: ReferenceVerification[] }) {
  const total = verifications.length;
  const pubmed = verifications.filter((v) => v.pubmed?.found).length;
  const doi = verifications.filter((v) => v.crossref?.found || v.pubmed?.doi).length;
  const mismatch = verifications.filter((v) => v.checks.metadataMatch === "mismatch").length;
  const dup = verifications.filter((v) => v.checks.duplicate).length;
  const retr = verifications.filter((v) => v.checks.possibleRetractionOrConcern === true).length;
  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge kind="neutral">Total: {total}</Badge>
      <Badge kind="good">PubMed: {pubmed}</Badge>
      <Badge kind="info">DOI: {doi}</Badge>
      {mismatch > 0 && <Badge kind="bad">Mismatch: {mismatch}</Badge>}
      {dup > 0 && <Badge kind="warn">Duplicates: {dup}</Badge>}
      {retr > 0 && <Badge kind="bad">Retraction/concern: {retr}</Badge>}
    </div>
  );
}

function VerificationRow({ index, v }: { index: number; v: ReferenceVerification }) {
  const confKind: "good" | "info" | "warn" =
    v.confidence === "high" ? "good" : v.confidence === "medium" ? "info" : "warn";
  return (
    <details className="border border-med-line rounded-lg p-3 bg-white">
      <summary className="cursor-pointer flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm text-med-sub">Reference {index}</div>
          <div className="font-medium text-med-ink truncate">
            {v.pubmed?.title || v.crossref?.title || v.parsed.title || v.originalText.slice(0, 110)}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          {v.pubmed?.found ? (
            <Badge kind="good">PubMed indexed</Badge>
          ) : v.checks.pubmedIndexed === false ? (
            <Badge kind="warn">Not in PubMed</Badge>
          ) : (
            <Badge kind="neutral">PubMed: —</Badge>
          )}
          {v.crossref?.found ? (
            <Badge kind="info">DOI verified</Badge>
          ) : v.checks.doiResolved === false ? (
            <Badge kind="bad">DOI not resolved</Badge>
          ) : (
            <Badge kind="neutral">DOI: —</Badge>
          )}
          {v.checks.duplicate && <Badge kind="warn">duplicate</Badge>}
          {v.checks.possibleRetractionOrConcern === true && (
            <Badge kind="bad">retraction/concern</Badge>
          )}
          <Badge kind={confKind}>confidence: {v.confidence}</Badge>
        </div>
      </summary>
      <div className="mt-3 grid md:grid-cols-2 gap-3 text-sm">
        <div>
          <div className="label">Original</div>
          <pre className="text-xs bg-slate-50 border border-med-line rounded p-2 whitespace-pre-wrap">
{v.originalText}
          </pre>
          <div className="label mt-3">Parsed</div>
          <KV row="Title" val={v.parsed.title} />
          <KV row="Authors" val={(v.parsed.authors || []).join(", ")} />
          <KV row="Journal" val={v.parsed.journal} />
          <KV row="Year" val={v.parsed.year} />
          <KV row="Volume / Issue / Pages" val={[v.parsed.volume, v.parsed.issue, v.parsed.pages].filter(Boolean).join(" / ")} />
          <KV row="DOI" val={v.parsed.doi} />
          <KV row="PMID" val={v.parsed.pmid} />
        </div>
        <div>
          {v.pubmed?.found && (
            <>
              <div className="label">PubMed match</div>
              <KV row="Title" val={v.pubmed.title} />
              <KV row="Authors" val={(v.pubmed.authors || []).join(", ")} />
              <KV row="Journal · Year" val={`${v.pubmed.journal || ""} · ${v.pubmed.year || ""}`} />
              <KV row="PMID" val={v.pubmed.pmid} link={v.pubmed.url} />
              <KV row="DOI" val={v.pubmed.doi} link={v.pubmed.doi ? `https://doi.org/${v.pubmed.doi}` : undefined} />
            </>
          )}
          {v.crossref?.found && (
            <>
              <div className="label mt-3">Crossref match</div>
              <KV row="Title" val={v.crossref.title} />
              <KV row="Authors" val={(v.crossref.authors || []).join(", ")} />
              <KV row="Journal · Year" val={`${v.crossref.journal || ""} · ${v.crossref.year || ""}`} />
              <KV row="DOI" val={v.crossref.doi} link={v.crossref.url} />
            </>
          )}
          {v.problems.length > 0 && (
            <>
              <div className="label mt-3">Problems</div>
              <ul className="text-rose-700 list-disc list-inside text-sm space-y-1">
                {v.problems.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </>
          )}
          {v.correctedCitationVancouver && (
            <>
              <div className="label mt-3">Suggested Vancouver format</div>
              <div className="text-sm bg-slate-50 border border-med-line rounded p-2">
                {v.correctedCitationVancouver}
              </div>
            </>
          )}
        </div>
      </div>
    </details>
  );
}

function KV({ row, val, link }: { row: string; val?: string; link?: string }) {
  if (!val) return null;
  return (
    <div className="text-sm flex gap-2 py-0.5">
      <span className="text-med-sub min-w-[12ch]">{row}:</span>
      {link ? (
        <a
          className="text-med-brand hover:underline break-all"
          target="_blank"
          rel="noopener noreferrer"
          href={link}
        >
          {val}
        </a>
      ) : (
        <span className="text-med-ink break-words">{val}</span>
      )}
    </div>
  );
}
