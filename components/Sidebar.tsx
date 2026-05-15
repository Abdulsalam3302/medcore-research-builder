"use client";

import type { ProjectState } from "@/lib/types";
import type { ComponentType } from "react";
import { LogoWordmark } from "./ui/Logo";
import {
  IconOverview,
  IconCompass,
  IconPen,
  IconDocument,
  IconFlask,
  IconChart,
  IconChat,
  IconFlag,
  IconBooks,
  IconShield,
  IconUpload,
} from "./ui/Icon";

export type ToolKey =
  | "overview"
  | "type"
  | "title"
  | "introduction"
  | "methods"
  | "results"
  | "discussion"
  | "conclusion"
  | "appendix"
  | "references"
  | "stats"
  | "report"
  | "export";

type IconCmp = ComponentType<{ size?: number; className?: string }>;

const items: { key: ToolKey; label: string; Icon: IconCmp; group?: string }[] = [
  { key: "overview", label: "Project overview", Icon: IconOverview, group: "Workspace" },
  { key: "type", label: "Research type", Icon: IconCompass, group: "Workspace" },
  { key: "title", label: "Title Lab", Icon: IconPen, group: "Workspace" },
  { key: "introduction", label: "Introduction", Icon: IconDocument, group: "Manuscript" },
  { key: "methods", label: "Methods", Icon: IconFlask, group: "Manuscript" },
  { key: "results", label: "Results", Icon: IconChart, group: "Manuscript" },
  { key: "discussion", label: "Discussion", Icon: IconChat, group: "Manuscript" },
  { key: "conclusion", label: "Conclusion", Icon: IconFlag, group: "Manuscript" },
  { key: "appendix", label: "Appendices", Icon: IconDocument, group: "Manuscript" },
  { key: "references", label: "Reference Verifier", Icon: IconBooks, group: "Quality" },
  { key: "stats", label: "Stats & Figures", Icon: IconChart, group: "Quality" },
  { key: "report", label: "Compliance Report", Icon: IconShield, group: "Quality" },
  { key: "export", label: "Export Center", Icon: IconUpload, group: "Quality" },
];

export function Sidebar({
  active,
  onSelect,
  project,
}: {
  active: ToolKey;
  onSelect: (k: ToolKey) => void;
  project: ProjectState;
}) {
  const progress = computeProgress(project);
  const groups = items.reduce<Record<string, typeof items>>((acc, it) => {
    const g = it.group || "Other";
    (acc[g] ||= []).push(it);
    return acc;
  }, {});

  return (
    <aside className="w-[260px] shrink-0 h-screen sticky top-0 border-r border-med-line bg-white hidden md:flex md:flex-col">
      <div className="px-5 py-4 border-b border-med-line">
        <LogoWordmark />
      </div>

      <nav className="px-3 py-3 flex-1 overflow-y-auto space-y-4">
        {Object.entries(groups).map(([group, list]) => (
          <div key={group}>
            <div className="px-2.5 mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-med-subtle">
              {group}
            </div>
            <div className="space-y-0.5">
              {list.map((it) => {
                const isActive = it.key === active;
                const status = sectionStatus(it.key, project);
                const Icon = it.Icon;
                return (
                  <button
                    key={it.key}
                    onClick={() => onSelect(it.key)}
                    className={`nav-item group ${
                      isActive
                        ? "bg-brand-gradient text-white shadow-soft"
                        : "text-med-inkSoft hover:bg-slate-50"
                    }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`nav-item-icon ${
                          isActive
                            ? "bg-white/15 text-white"
                            : "bg-slate-50 text-med-sub group-hover:bg-white group-hover:text-med-brand"
                        }`}
                      >
                        <Icon size={15} />
                      </span>
                      <span className="truncate">{it.label}</span>
                    </span>
                    {status && (
                      <span
                        className={`text-[9.5px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded-full ${
                          isActive
                            ? "bg-white/20 text-white"
                            : status.color === "good"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : status.color === "warn"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-slate-50 text-slate-500 border border-slate-200"
                        }`}
                      >
                        {status.label}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-med-line bg-gradient-to-b from-white to-slate-50">
        <div className="text-[11px] text-med-sub mb-1.5 flex items-center justify-between font-medium">
          <span>Project progress</span>
          <span className="text-med-ink tabular-nums">{progress}%</span>
        </div>
        <div className="progress">
          <div style={{ width: `${progress}%` }} />
        </div>
        <div className="text-[10.5px] text-med-subtle mt-3 leading-relaxed">
          No login required. Draft data is stored only in your browser.
        </div>
      </div>
    </aside>
  );
}

function sectionStatus(
  key: ToolKey,
  p: ProjectState
): { color: "good" | "warn" | "neutral"; label: string } | null {
  switch (key) {
    case "type":
      return p.researchTypeResult
        ? { color: "good", label: "set" }
        : { color: "warn", label: "todo" };
    case "title":
      return p.titleFinal || p.titleInputs.draftTitle
        ? { color: "good", label: "set" }
        : { color: "warn", label: "todo" };
    case "introduction":
    case "methods":
    case "results":
    case "discussion":
    case "conclusion":
      return (p.sections[key] || "").length > 60
        ? { color: "good", label: "draft" }
        : { color: "warn", label: "todo" };
    case "references":
      return p.references.verifications.length > 0
        ? { color: "good", label: `${p.references.verifications.length}` }
        : { color: "warn", label: "todo" };
    case "appendix":
      return (p.appendices || []).length > 0
        ? { color: "good", label: `${(p.appendices || []).length}` }
        : { color: "neutral", label: "opt" };
    default:
      return null;
  }
}

function computeProgress(p: ProjectState): number {
  let score = 0;
  let total = 0;
  total += 1; if (p.researchTypeResult) score += 1;
  total += 1; if (p.titleFinal || p.titleInputs.draftTitle) score += 1;
  for (const s of ["introduction", "methods", "results", "discussion", "conclusion"] as const) {
    total += 1;
    if ((p.sections[s] || "").length > 60) score += 1;
  }
  total += 1; if (p.references.verifications.length > 0) score += 1;
  return Math.round((score / total) * 100);
}
