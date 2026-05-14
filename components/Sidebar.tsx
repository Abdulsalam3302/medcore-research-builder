"use client";

import type { ProjectState } from "@/lib/types";

export type ToolKey =
  | "overview"
  | "type"
  | "title"
  | "introduction"
  | "methods"
  | "results"
  | "discussion"
  | "conclusion"
  | "references"
  | "report"
  | "export";

const items: { key: ToolKey; label: string; emoji: string }[] = [
  { key: "overview", label: "Project overview", emoji: "🗂" },
  { key: "type", label: "Research type", emoji: "🧭" },
  { key: "title", label: "Title Lab", emoji: "✒️" },
  { key: "introduction", label: "Introduction", emoji: "📝" },
  { key: "methods", label: "Methods", emoji: "🧪" },
  { key: "results", label: "Results", emoji: "📊" },
  { key: "discussion", label: "Discussion", emoji: "💬" },
  { key: "conclusion", label: "Conclusion", emoji: "🏁" },
  { key: "references", label: "Reference Verifier", emoji: "📚" },
  { key: "report", label: "Compliance Report", emoji: "✅" },
  { key: "export", label: "Export Center", emoji: "📤" },
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
  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 border-r border-med-line bg-white hidden md:flex md:flex-col">
      <div className="px-5 py-4 border-b border-med-line">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-med-brand text-white flex items-center justify-center font-bold">
            M
          </div>
          <div>
            <div className="font-semibold text-med-ink">MedCore</div>
            <div className="text-xs text-med-sub -mt-0.5">Research Builder</div>
          </div>
        </div>
      </div>
      <nav className="px-2 py-2 flex-1 overflow-y-auto">
        {items.map((it) => {
          const isActive = it.key === active;
          const status = sectionStatus(it.key, project);
          return (
            <button
              key={it.key}
              onClick={() => onSelect(it.key)}
              className={`w-full text-left flex items-center justify-between gap-2 px-3 py-2 rounded-md text-sm ${
                isActive
                  ? "bg-med-brand text-white"
                  : "text-med-ink hover:bg-slate-100"
              }`}
            >
              <span className="flex items-center gap-2">
                <span aria-hidden>{it.emoji}</span>
                <span>{it.label}</span>
              </span>
              {status && (
                <span
                  className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? "bg-white/20 text-white"
                      : status.color === "good"
                      ? "bg-emerald-100 text-emerald-700"
                      : status.color === "warn"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {status.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>
      <div className="p-4 border-t border-med-line">
        <div className="text-xs text-med-sub mb-1.5 flex items-center justify-between">
          <span>Project progress</span>
          <span>{progress}%</span>
        </div>
        <div className="progress">
          <div style={{ width: `${progress}%` }} />
        </div>
        <div className="text-[11px] text-med-sub mt-3 leading-relaxed">
          No login. All draft data is stored only in your browser.
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
