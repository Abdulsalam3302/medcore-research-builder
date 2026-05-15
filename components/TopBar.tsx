"use client";

import { useEffect, useState } from "react";
import type { ProjectState } from "@/lib/types";
import { LogoMark } from "./ui/Logo";
import { IconDownload, IconUpload, IconReset } from "./ui/Icon";

export function TopBar({
  project,
  onExport,
  onReset,
  onImport,
}: {
  project: ProjectState;
  onExport: () => void;
  onReset: () => void;
  onImport: (p: ProjectState) => void;
}) {
  const [status, setStatus] = useState<{
    llm: { configured: boolean; provider: string | null };
    pubmed: { configured: boolean; keyConfigured: boolean };
    crossref: { configured: boolean; mailto: boolean };
    openalex: { configured: boolean; mailto: boolean; keyConfigured: boolean };
    semanticScholar: { configured: boolean; keyConfigured: boolean };
    elicit: { configured: boolean };
    europePMC: { configured: boolean };
    unpaywall: { configured: boolean };
    openCitations: { configured: boolean };
    clinicalTrials: { configured: boolean };
    webSearch: { configured: boolean };
  } | null>(null);

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);

  const title =
    project.titleFinal ||
    project.titleInputs.draftTitle ||
    "Untitled manuscript";

  return (
    <header className="sticky top-0 z-20 bg-white/85 backdrop-blur-md border-b border-med-line">
      <div className="px-5 md:px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <div className="md:hidden flex items-center gap-2">
            <LogoMark size={28} />
            <div>
              <div className="font-display font-semibold text-med-ink text-sm leading-none">
                MedCore
              </div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-med-sub mt-0.5">
                Research Builder
              </div>
            </div>
          </div>
          <div className="hidden md:flex flex-col min-w-0">
            <div className="text-[10.5px] uppercase tracking-[0.14em] text-med-sub font-semibold">
              Current project
            </div>
            <div className="font-display font-semibold text-med-ink text-[15px] truncate max-w-[48ch] leading-snug">
              {title}
            </div>
          </div>
          <span className="hidden lg:inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-medium text-sky-700">
            <span className="status-dot bg-sky-500 animate-pulse-soft" />
            No login · Local draft only
          </span>
        </div>

        <div className="flex items-center gap-2">
          {status && (
            <div className="hidden md:flex items-center gap-2 mr-1 rounded-full border border-med-line bg-white px-3 py-1.5 flex-wrap max-w-[640px]">
              <StatusPill ok={status.llm.configured} label="LLM" tip={status.llm.provider || undefined} />
              <span className="h-3 w-px bg-med-line" />
              <StatusPill ok={status.pubmed.keyConfigured} label="PubMed" tip={status.pubmed.keyConfigured ? "API key set" : "Works without key (lower rate limit)"} />
              <StatusPill ok={status.semanticScholar.keyConfigured} label="S2" tip="Semantic Scholar" />
              <StatusPill ok={status.openalex.configured} label="OpenAlex" tip={status.openalex.mailto ? "polite pool" : "anonymous"} />
              <StatusPill ok={status.crossref.configured} label="Crossref" tip={status.crossref.mailto ? "polite pool" : "anonymous"} />
              <StatusPill ok={status.europePMC.configured} label="EuPMC" tip="Europe PMC + preprints" />
              <StatusPill ok={status.elicit.configured} label="Elicit" tip={status.elicit.configured ? "API key set" : "Not configured"} />
              <StatusPill ok={status.unpaywall.configured} label="Unpaywall" tip={status.unpaywall.configured ? "OA resolver" : "Set UNPAYWALL_EMAIL"} />
              <StatusPill ok={status.openCitations.configured} label="OC" tip="OpenCitations" />
              <StatusPill ok={status.clinicalTrials.configured} label="Trials" tip="ClinicalTrials.gov" />
              <span className="h-3 w-px bg-med-line" />
              <StatusPill ok={status.webSearch.configured} label="Web" tip="Tavily/SerpAPI" />
            </div>
          )}

          <label
            className="btn-secondary cursor-pointer"
            title="Import a project.json file"
          >
            <IconUpload size={15} />
            <span className="hidden sm:inline">Import</span>
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const txt = await file.text();
                  const parsed = JSON.parse(txt);
                  onImport(parsed);
                } catch {
                  alert("Invalid JSON file");
                }
                e.target.value = "";
              }}
            />
          </label>
          <button className="btn-primary" onClick={onExport} title="Export project as JSON">
            <IconDownload size={15} />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            className="btn-icon text-med-bad hover:bg-rose-50 hover:text-med-bad"
            title="Reset project"
            onClick={() => {
              if (confirm("Reset the project? Local drafts will be lost.")) onReset();
            }}
          >
            <IconReset size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}

function StatusPill({ ok, label, tip }: { ok: boolean; label: string; tip?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-medium text-med-inkSoft whitespace-nowrap"
      title={`${label}${tip ? ` — ${tip}` : ""}${ok ? "" : " (not configured)"}`}
    >
      <span
        className={`status-dot ${ok ? "bg-emerald-500" : "bg-slate-300"} ${
          ok ? "ring-2 ring-emerald-100" : ""
        }`}
      />
      {label}
    </span>
  );
}
