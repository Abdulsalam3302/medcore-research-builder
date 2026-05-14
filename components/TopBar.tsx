"use client";

import { useEffect, useState } from "react";
import type { ProjectState } from "@/lib/types";

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
  const [status, setStatus] = useState<{ llm: { configured: boolean; provider: string | null }; webSearch: { configured: boolean } } | null>(null);

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-med-line">
      <div className="px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="md:hidden">
            <div className="font-semibold text-med-ink">MedCore</div>
            <div className="text-[11px] text-med-sub -mt-0.5">Research Builder</div>
          </div>
          <div className="hidden md:flex flex-col">
            <div className="text-sm text-med-sub">Project</div>
            <div className="font-semibold text-med-ink truncate max-w-[40ch]">
              {project.titleFinal || project.titleInputs.draftTitle || "Untitled manuscript"}
            </div>
          </div>
          <span className="badge-info hidden lg:inline-flex">No login · Local draft only</span>
        </div>
        <div className="flex items-center gap-2">
          {status && (
            <div className="hidden md:flex items-center gap-1.5 text-[11px]">
              <Dot ok={status.llm.configured} /> LLM
              <Dot ok={true} className="ml-2" /> PubMed
              <Dot ok={status.webSearch.configured} className="ml-2" /> Web
            </div>
          )}
          <label className="btn-secondary cursor-pointer">
            Import JSON
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
          <button className="btn-secondary" onClick={onExport}>
            Export project
          </button>
          <button
            className="btn-ghost text-med-bad hover:bg-rose-50"
            onClick={() => {
              if (confirm("Reset the project? Local drafts will be lost.")) onReset();
            }}
          >
            Reset
          </button>
        </div>
      </div>
    </header>
  );
}

function Dot({ ok, className = "" }: { ok: boolean; className?: string }) {
  return (
    <span
      className={`inline-block h-1.5 w-1.5 rounded-full ${
        ok ? "bg-emerald-500" : "bg-slate-300"
      } ${className}`}
      title={ok ? "Configured" : "Not configured"}
    />
  );
}
