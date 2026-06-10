"use client";

import { useEffect, useState } from "react";
import type { ProjectState } from "@/lib/types";
import type { AutosaveStatus } from "./useProject";
import { LogoMark } from "./ui/Logo";
import { AuthButton } from "./AuthButton";
import { IconDownload, IconUpload, IconReset } from "./ui/Icon";
import { AdvancedAuditDrawer } from "./AdvancedAuditDrawer";
import { useConfirm } from "./ui/ConfirmDialog";

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

export function WorkspaceHeader({
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
  const [savedTick, setSavedTick] = useState(0);
  const [openAudit, setOpenAudit] = useState(false);
  const { confirm } = useConfirm();

  useEffect(() => {
    if (!autosave?.savedAt) return;
    const id = window.setInterval(() => setSavedTick((t) => t + 1), 5000);
    return () => window.clearInterval(id);
  }, [autosave?.savedAt]);
  void savedTick;

  const title =
    project.titleFinal || project.titleInputs.draftTitle || "Untitled research project";
  const savedAgo = autosave?.savedAt ? formatAgo(Date.now() - autosave.savedAt) : null;

  return (
    <>
      <header className="sticky top-0 z-20 bg-white/85 backdrop-blur-md border-b border-med-line">
        <div className="px-5 md:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            <div className="md:hidden flex items-center gap-2">
              <LogoMark size={28} />
              <div>
                <div className="font-display font-semibold text-med-ink text-sm leading-none">MedCore</div>
                <div className="text-[10px] uppercase tracking-[0.14em] text-med-sub mt-0.5">
                  Research Platform
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
              Guided research mode
            </span>
            {autosave ? (
              autosave.localError ? (
                <span role="alert" className="inline-flex items-center gap-1.5 text-[11.5px] text-med-bad font-medium">
                  <span className="rounded-full" style={{ width: 6, height: 6, background: "var(--mc-risk)" }} />
                  Couldn&apos;t save locally — storage may be full. Export your work now.
                </span>
              ) : autosave.cloud === "error" ? (
                <span role="alert" className="inline-flex items-center gap-1.5 text-[11.5px] text-amber-700 font-medium">
                  <span className="rounded-full" style={{ width: 6, height: 6, background: "#b45309" }} />
                  Cloud sync failed — your draft is safe in this browser; sync retries on your next edit.
                </span>
              ) : (
                <span
                  aria-live="polite"
                  className="hidden md:inline-flex items-center gap-1.5 text-[11.5px] text-[var(--mc-ink-500)]"
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
                    ? "Saving your workspace..."
                    : savedAgo
                      ? `Workspace saved · ${savedAgo}`
                      : "Workspace saved"}
                </span>
              )
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <button type="button" className="btn-ghost text-xs" onClick={() => setOpenAudit(true)}>
              Advanced audit
            </button>
            <AuthButton />
            <label className="btn-secondary cursor-pointer" title="Import a project.json file">
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
                    onImport(JSON.parse(txt));
                  } catch {
                    alert("Invalid JSON file");
                  }
                  e.target.value = "";
                }}
              />
            </label>
            <button type="button" className="btn-primary" onClick={onExport} title="Export project as JSON">
              <IconDownload size={15} />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              type="button"
              aria-label="Reset project"
              className="btn-icon text-med-bad hover:bg-rose-50 hover:text-med-bad"
              title="Reset project"
              onClick={async () => {
                const yes = await confirm({
                  title: "Reset project",
                  message: "Reset the project? Local drafts will be lost.",
                  confirmLabel: "Reset",
                  danger: true,
                });
                if (yes) onReset();
              }}
            >
              <IconReset size={16} />
            </button>
          </div>
        </div>
      </header>
      <AdvancedAuditDrawer open={openAudit} onClose={() => setOpenAudit(false)} />
    </>
  );
}
