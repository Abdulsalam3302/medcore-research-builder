"use client";

import { useMemo, useState } from "react";
import type { JournalIndexingRecord } from "@/lib/lifecycle";
import { journals } from "@/lib/registry/journals";
import { Badge } from "./ui/Badge";
import { downloadAsFile } from "@/lib/store";

const OFFICIAL_SOURCES = {
  wos: "https://mjl.clarivate.com/home",
  scopus: "https://www.elsevier.com/products/scopus/content",
  nlm: "https://www.ncbi.nlm.nih.gov/nlmcatalog/journals/",
  medline: "https://www.nlm.nih.gov/medline/medline_journal_selection.html",
  sdl: "https://sdl.edu.sa/SDLPortal/en/saudi_journals.aspx",
  doaj: "https://doaj.org/",
  tcs: "https://thinkchecksubmit.org/",
};

type ShortlistRecord = JournalIndexingRecord & { journalId?: string };

const defaultRecord = (journalName: string, journalId?: string): ShortlistRecord => ({
  journalName,
  journalId,
  indexing: {
    webOfScience: "unknown",
    scopus: "unknown",
    pubMed: "unknown",
    medline: "unknown",
    pmc: "unknown",
    doaj: "unknown",
  },
  verificationSources: [OFFICIAL_SOURCES.wos, OFFICIAL_SOURCES.scopus, OFFICIAL_SOURCES.nlm],
  lastChecked: new Date().toISOString().slice(0, 10),
  redFlags: [],
});

function toBadge(value: "verified" | "unverified" | "unknown") {
  return value === "verified" ? "good" : value === "unverified" ? "bad" : "neutral";
}

export function TargetJournalIndexationPanel() {
  const [query, setQuery] = useState("");
  const [records, setRecords] = useState<ShortlistRecord[]>([]);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const shortlist = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return journals.slice(0, 12);
    return journals.filter(
      (j) =>
        j.name.toLowerCase().includes(q) ||
        j.publisher.toLowerCase().includes(q) ||
        j.id.toLowerCase().includes(q),
    );
  }, [query]);

  const journalMap = useMemo(() => {
    const m = new Map<string, (typeof journals)[number]>();
    journals.forEach((j) => m.set(j.name, j));
    return m;
  }, []);

  function addToShortlist(name: string, id?: string) {
    setRecords((prev) =>
      prev.some((r) => r.journalName === name) ? prev : [...prev, defaultRecord(name, id)],
    );
  }

  async function verifyRecord(name: string) {
    setVerifying(name);
    setGlobalError(null);
    try {
      const res = await fetch("/api/journals/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ journalName: name }),
      });
      const json = (await res.json()) as ShortlistRecord & { error?: string };
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setRecords((prev) =>
        prev.map((r) =>
          r.journalName === name
            ? {
                ...r,
                indexing: json.indexing,
                verificationSources: json.verificationSources || r.verificationSources,
                redFlags: json.redFlags || [],
                lastChecked: json.lastChecked || r.lastChecked,
              }
            : r,
        ),
      );
    } catch (e) {
      setGlobalError(e instanceof Error ? e.message : String(e));
    } finally {
      setVerifying(null);
    }
  }

  function exportChecklistPackage(record: ShortlistRecord) {
    const spec = record.journalId ? journals.find((j) => j.id === record.journalId) : journalMap.get(record.journalName);
    const check = spec?.required;
    const manuscript = spec?.manuscriptTypes?.[0];

    const lines = [
      `# Journal Submission Package — ${record.journalName}`,
      "",
      `Generated: ${new Date().toISOString()}`,
      "",
      "## Indexing Snapshot",
      `- Web of Science: ${record.indexing.webOfScience}`,
      `- Scopus: ${record.indexing.scopus}`,
      `- PubMed: ${record.indexing.pubMed}`,
      `- MEDLINE: ${record.indexing.medline}`,
      `- PMC: ${record.indexing.pmc}`,
      `- DOAJ: ${record.indexing.doaj}`,
      `- Last checked: ${record.lastChecked}`,
      "",
      "## Journal Fit Metadata",
      `- Publisher: ${spec?.publisher || "N/A"}`,
      `- Author guide: ${spec?.authorGuideUrl || "N/A"}`,
      `- Default manuscript type: ${spec?.defaultManuscriptType || "N/A"}`,
      `- Main text word limit: ${manuscript?.mainTextWordLimit ?? "N/A"}`,
      `- Abstract word limit: ${manuscript?.abstractWordLimit ?? "N/A"}`,
      `- Max references: ${manuscript?.referencesMax ?? "N/A"}`,
      `- Max display items: ${manuscript?.displayItemsMax ?? "N/A"}`,
      "",
      "## Required Submission Declarations",
      `- ICMJE authorship: ${check?.icmjeAuthorship ? "Required" : "Check journal policy"}`,
      `- Funding statement: ${check?.fundingStatement ? "Required" : "Check journal policy"}`,
      `- Conflict of interest: ${check?.coiStatement ? "Required" : "Check journal policy"}`,
      `- Data sharing statement: ${check?.dataSharingStatement ? "Required" : "Check journal policy"}`,
      `- Trial registration statement: ${check?.registrationStatement ? "Required" : "Check journal policy"}`,
      `- Ethics statement: ${check?.ethicsStatement ? "Required" : "Check journal policy"}`,
      `- Consent statement: ${check?.consentStatement ? "Required" : "Check journal policy"}`,
      `- AI-use disclosure: ${check?.aiDisclosure ? "Required/Recommended" : "Check journal policy"}`,
      "",
      "## Core File Checklist",
      "- Final manuscript",
      "- Title page",
      "- Cover letter",
      "- Reporting checklist (study-design aligned)",
      "- Figures and tables",
      "- Supplementary files",
      "- Declarations (funding/COI/ethics/consent/data sharing/AI use)",
      "",
      "## Verification Links",
      ...record.verificationSources.map((s) => `- ${s}`),
      "",
      "## Red Flags",
      ...(record.redFlags.length ? record.redFlags.map((f) => `- ${f}`) : ["- None flagged in this pass."]),
    ];

    const fileName = `${record.journalName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-submission-package.md`;
    downloadAsFile(fileName, lines.join("\n"), "text/markdown");
  }

  return (
    <div className="grid gap-5">
      <section className="card-elevated">
        <div className="card-header">
          <div>
            <div className="eyebrow">Target Journals & Indexation</div>
            <h2 className="section-title text-[16px]">Journal fit and official index verification</h2>
          </div>
        </div>
        <div className="p-5 grid gap-3">
          <p className="text-sm text-med-sub">
            Verify every indexing claim from official sources. Journal website claims alone are not sufficient.
          </p>
          <div className="text-[12.5px] text-med-inkSoft border border-sky-200 bg-sky-50/60 rounded-lg p-3">
            💡 Looking for journal suggestions matched to your manuscript? Use the
            dedicated <strong>Journal Finder</strong> lane — it ranks WoS SCIE/ESCI,
            Scopus, PubMed/MEDLINE, DOAJ, and Saudi journals by topical fit and builds
            a submission-formatting package. This panel is for manually verifying a
            shortlist against official index sources.
          </div>
          <input
            className="input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search journal, publisher, or specialty..."
          />
          <div className="grid md:grid-cols-2 gap-2">
            {shortlist.map((j) => (
              <div key={j.id} className="border border-med-line rounded-lg p-3">
                <div className="font-medium text-sm text-med-ink">{j.name}</div>
                <div className="text-xs text-med-sub mt-0.5">{j.publisher}</div>
                <div className="flex gap-2 mt-2">
                  <button className="btn-secondary text-xs" onClick={() => addToShortlist(j.name, j.id)}>
                    Add to shortlist
                  </button>
                  <a className="btn-ghost text-xs" href={j.authorGuideUrl} target="_blank" rel="noopener noreferrer">
                    Author guide
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <h3 className="section-title text-[15px]">Indexing education cards</h3>
        </div>
        <div className="p-5 grid md:grid-cols-2 gap-3 text-sm">
          <EducationCard
            title="Web of Science"
            points={[
              "Verify in Clarivate Master Journal List.",
              "SCIE/SSCI/AHCI/ESCI are different collections; verify exact listing.",
              "Do not trust website claims without title/ISSN verification.",
            ]}
            href={OFFICIAL_SOURCES.wos}
          />
          <EducationCard
            title="Scopus"
            points={[
              "Use official Scopus Sources/content list.",
              "Coverage can change over time (active/inactive).",
              "Record a last-checked date for each verification.",
            ]}
            href={OFFICIAL_SOURCES.scopus}
          />
          <EducationCard
            title="PubMed / MEDLINE / PMC"
            points={[
              "PubMed is a search platform; MEDLINE is a curated subset; PMC is full-text archive.",
              "Use NLM Catalog to verify current indexing/deposit status.",
              "MEDLINE and PMC status may differ for the same journal.",
            ]}
            href={OFFICIAL_SOURCES.nlm}
          />
          <EducationCard
            title="Saudi Journals"
            points={[
              "Saudi Digital Library categories help local/regional context.",
              "Verify title and ISSN in official indexing sources before submission.",
              "Treat any mismatch as a red flag and investigate before payment.",
            ]}
            href={OFFICIAL_SOURCES.sdl}
          />
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <h3 className="section-title text-[15px]">Saved shortlist and index checks</h3>
        </div>
        <div className="p-5 grid gap-3">
          {globalError && (
            <div className="text-sm text-med-bad border border-rose-200 bg-rose-50 rounded-lg p-3">
              {globalError}
            </div>
          )}
          {records.length === 0 ? (
            <div className="text-sm text-med-sub border border-med-line rounded-lg p-3 bg-slate-50">
              No journals saved yet. Add journals above to begin index verification.
            </div>
          ) : (
            <div className="overflow-x-auto border border-med-line rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-3 py-2">Journal</th>
                    <th className="text-left px-3 py-2">WoS</th>
                    <th className="text-left px-3 py-2">Scopus</th>
                    <th className="text-left px-3 py-2">PubMed</th>
                    <th className="text-left px-3 py-2">MEDLINE</th>
                    <th className="text-left px-3 py-2">PMC</th>
                    <th className="text-left px-3 py-2">Saudi Journals</th>
                    <th className="text-left px-3 py-2">DOAJ</th>
                    <th className="text-left px-3 py-2">Last checked</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, idx) => (
                    <tr key={r.journalName} className="border-t border-med-line">
                      <td className="px-3 py-2">
                        <div className="font-medium">{r.journalName}</div>
                        <div className="flex gap-1.5 mt-1">
                          <button
                            className="btn-secondary text-xs"
                            onClick={() => verifyRecord(r.journalName)}
                            disabled={verifying === r.journalName}
                          >
                            {verifying === r.journalName ? "Verifying..." : "Verify now"}
                          </button>
                          <button className="btn-ghost text-xs" onClick={() => exportChecklistPackage(r)}>
                            Export checklist package
                          </button>
                        </div>
                        {r.redFlags.length > 0 && (
                          <div className="mt-1 text-xs text-amber-700">
                            {r.redFlags.length} red flag(s)
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2"><Badge kind={toBadge(r.indexing.webOfScience)}>{r.indexing.webOfScience}</Badge></td>
                      <td className="px-3 py-2"><Badge kind={toBadge(r.indexing.scopus)}>{r.indexing.scopus}</Badge></td>
                      <td className="px-3 py-2"><Badge kind={toBadge(r.indexing.pubMed)}>{r.indexing.pubMed}</Badge></td>
                      <td className="px-3 py-2"><Badge kind={toBadge(r.indexing.medline)}>{r.indexing.medline}</Badge></td>
                      <td className="px-3 py-2"><Badge kind={toBadge(r.indexing.pmc)}>{r.indexing.pmc}</Badge></td>
                      <td className="px-3 py-2">
                        <input
                          className="input text-xs min-w-[120px]"
                          placeholder="ISI / Scopus / ESCI / Non-index"
                          value={r.indexing.saudiDigitalLibraryCategory || ""}
                          onChange={(e) =>
                            setRecords((prev) =>
                              prev.map((it, i) =>
                                i === idx
                                  ? { ...it, indexing: { ...it.indexing, saudiDigitalLibraryCategory: e.target.value } }
                                  : it,
                              ),
                            )
                          }
                        />
                      </td>
                      <td className="px-3 py-2"><Badge kind={toBadge(r.indexing.doaj)}>{r.indexing.doaj}</Badge></td>
                      <td className="px-3 py-2">{r.lastChecked}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="text-xs text-med-sub">
            Sources:
            {" "}
            <a href={OFFICIAL_SOURCES.wos} target="_blank" rel="noopener noreferrer" className="text-med-brand hover:underline">Web of Science</a>
            {" · "}
            <a href={OFFICIAL_SOURCES.scopus} target="_blank" rel="noopener noreferrer" className="text-med-brand hover:underline">Scopus</a>
            {" · "}
            <a href={OFFICIAL_SOURCES.nlm} target="_blank" rel="noopener noreferrer" className="text-med-brand hover:underline">NLM Catalog</a>
            {" · "}
            <a href={OFFICIAL_SOURCES.sdl} target="_blank" rel="noopener noreferrer" className="text-med-brand hover:underline">Saudi Digital Library</a>
            {" · "}
            <a href={OFFICIAL_SOURCES.doaj} target="_blank" rel="noopener noreferrer" className="text-med-brand hover:underline">DOAJ</a>
            {" · "}
            <a href={OFFICIAL_SOURCES.tcs} target="_blank" rel="noopener noreferrer" className="text-med-brand hover:underline">Think. Check. Submit.</a>
          </div>
        </div>
      </section>
    </div>
  );
}

function EducationCard({ title, points, href }: { title: string; points: string[]; href: string }) {
  return (
    <div className="border border-med-line rounded-lg p-3 bg-white">
      <div className="font-medium text-med-ink">{title}</div>
      <ul className="list-disc list-inside text-med-sub mt-1 space-y-1">
        {points.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-xs text-med-brand hover:underline mt-2 inline-block">
        Official verification source
      </a>
    </div>
  );
}
