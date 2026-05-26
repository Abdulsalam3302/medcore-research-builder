"use client";

import { useEffect, useMemo, useState } from "react";
import type { ProjectState } from "@/lib/types";
import { scoreLaunch } from "@/lib/launchReadiness";
import type { AutosaveStatus } from "./useProject";
import { LogoMark } from "./ui/Logo";
import { AuthButton } from "./AuthButton";
import { IconDownload, IconUpload, IconReset } from "./ui/Icon";

export function TopBar({
  project,
  onExport,
  onReset,
  onImport,
  autosave,
}: {
  project: ProjectState;
  onExport: () => void;
  onReset: () => void;
  onImport: (p: ProjectState) => void;
  autosave?: AutosaveStatus;
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

  const progress = useMemo(() => computeProgress(project), [project]);
  const [savedTick, setSavedTick] = useState(0);
  useEffect(() => {
    if (!autosave?.savedAt) return;
    const id = window.setInterval(() => setSavedTick((t) => t + 1), 5000);
    return () => window.clearInterval(id);
  }, [autosave?.savedAt]);
  const savedAgo = autosave?.savedAt
    ? formatAgo(Date.now() - autosave.savedAt)
    : null;
  // ensure savedTick triggers re-render of timer text
  void savedTick;

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
          {autosave ? (
            <span
              className="hidden md:inline-flex items-center gap-1.5 text-[11.5px] text-[var(--mc-ink-500)]"
              title="Drafts persist to this browser only — export regularly to share or back up."
            >
              <span
                className="rounded-full"
                style={{
                  width: 6,
                  height: 6,
                  background: "var(--mc-verified)",
                  boxShadow: "0 0 0 3px rgba(4,120,87,0.16)",
                }}
              />
              {autosave.saving
                ? "Saving…"
                : savedAgo
                  ? `Your draft is saved locally · ${savedAgo}`
                  : "Your draft is saved locally"}
            </span>
          ) : null}
          <span
            className="hidden xl:inline-flex items-center gap-2 rounded-full border border-med-line bg-white px-2.5 py-1 text-[11px] font-medium text-med-inkSoft"
            title={`Project completion: ${progress}%`}
          >
            <span className="text-med-sub">Workspace readiness</span>
            <span className="h-1.5 w-24 rounded-full bg-slate-100 overflow-hidden">
              <span
                className="block h-full bg-brand-gradient transition-all"
                style={{ width: `${progress}%` }}
              />
            </span>
            <span className="tabular-nums text-med-ink">{progress}%</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {status && (
            <div className="hidden md:flex items-center gap-2 mr-1 rounded-full border border-med-line bg-white px-3 py-1.5 flex-wrap max-w-[640px]">
              <StatusPill ok={status.llm.configured} label="Writing assistant" tip={status.llm.provider || undefined} />
              <span className="h-3 w-px bg-med-line" />
              <StatusPill ok={status.pubmed.keyConfigured} label="Primary index" tip={status.pubmed.keyConfigured ? "Key set" : "Lower rate mode"} />
              <StatusPill ok={status.semanticScholar.keyConfigured} label="Source E" tip="Citation source" />
              <StatusPill ok={status.openalex.configured} label="Source C" tip={status.openalex.mailto ? "Polite mode" : "Anonymous mode"} />
              <StatusPill ok={status.crossref.configured} label="DOI source" tip={status.crossref.mailto ? "Polite mode" : "Anonymous mode"} />
              <StatusPill ok={status.europePMC.configured} label="Source D" tip="Open biomedical source" />
              <StatusPill ok={status.elicit.configured} label="Source F" tip={status.elicit.configured ? "Configured" : "Not configured"} />
              <StatusPill ok={status.unpaywall.configured} label="OA resolver" tip={status.unpaywall.configured ? "Ready" : "Email required"} />
              <StatusPill ok={status.openCitations.configured} label="Citation links" tip="Open citation map" />
              <StatusPill ok={status.clinicalTrials.configured} label="Trial registry" tip="Registry source" />
              <span className="h-3 w-px bg-med-line" />
              <StatusPill ok={status.webSearch.configured} label="Web fallback" tip="General search connector" />
            </div>
          )}

          <AuthButton />

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

function computeProgress(p: ProjectState): number {
  let score = 0;
  let total = 0;
  total += 1;
  if (p.researchLaunch && scoreLaunch(p.researchLaunch).totalScore >= 60) score += 1;
  total += 1;
  if (p.researchTypeResult) score += 1;
  total += 1;
  if (p.titleFinal || p.titleInputs.draftTitle) score += 1;
  for (const s of ["introduction", "methods", "results", "discussion", "conclusion"] as const) {
    total += 1;
    if ((p.sections[s] || "").length > 60) score += 1;
  }
  total += 1;
  if (p.references.verifications.length > 0) score += 1;
  return Math.round((score / total) * 100);
}

function formatAgo(ms: number): string {
  if (ms < 1500) return "just now";
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
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
