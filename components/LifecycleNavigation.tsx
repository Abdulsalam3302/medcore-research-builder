"use client";

import type { ProjectState } from "@/lib/types";
import { LogoWordmark } from "./ui/Logo";
import { APP_VERSION } from "@/lib/constants";

export type LifecycleKey =
  | "launch"
  | "type"
  | "title"
  | "introduction"
  | "methods"
  | "results"
  | "discussion"
  | "conclusion"
  | "references"
  | "appendix"
  | "submission"
  | "impact-studio"
  | "export";

type NavItem = {
  key: LifecycleKey;
  label: string;
  phase: "Pre-Research" | "Intra-Research" | "Post-Research" | "Post-Publication";
};

const NAV_ITEMS: NavItem[] = [
  { key: "launch", label: "Research Launch", phase: "Pre-Research" },
  { key: "type", label: "Study Design Selector", phase: "Pre-Research" },
  { key: "title", label: "Literature & Gap Explorer", phase: "Pre-Research" },
  { key: "introduction", label: "Introduction", phase: "Intra-Research" },
  { key: "methods", label: "Methods", phase: "Intra-Research" },
  { key: "results", label: "Results", phase: "Intra-Research" },
  { key: "discussion", label: "Discussion", phase: "Intra-Research" },
  { key: "conclusion", label: "Conclusion", phase: "Intra-Research" },
  { key: "references", label: "References", phase: "Intra-Research" },
  { key: "appendix", label: "Appendix (optional)", phase: "Intra-Research" },

  { key: "submission", label: "Submission & Quality", phase: "Post-Research" },

  { key: "impact-studio", label: "Post-Publication Impact Studio", phase: "Post-Publication" },
  { key: "export", label: "Export Center", phase: "Post-Publication" },
];

export function LifecycleNavigation({
  active,
  onSelect,
  project,
}: {
  active: LifecycleKey;
  onSelect: (k: LifecycleKey) => void;
  project: ProjectState;
}) {
  const groups = NAV_ITEMS.reduce<Record<string, NavItem[]>>((acc, item) => {
    (acc[item.phase] ||= []).push(item);
    return acc;
  }, {});

  const readySections = Object.values(project.sections).filter((s) => s.trim().length > 60).length;

  return (
    <aside className="w-[280px] shrink-0 h-screen sticky top-0 border-r border-[var(--mc-line)] bg-[var(--mc-surface)] hidden md:flex md:flex-col">
      <div className="px-5 py-5 border-b border-[var(--mc-line-soft)]">
        <LogoWordmark />
      </div>

      <nav aria-label="Research lifecycle" className="px-3 py-4 flex-1 overflow-y-auto space-y-5">
        {Object.entries(groups).map(([phase, items]) => (
          <section key={phase}>
            <div className="mc-eyebrow px-2 pb-1.5 text-[10.5px] text-[var(--mc-ink-400)]">{phase}</div>
            <div className="space-y-1">
              {items.map((item) => {
                const isActive = active === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => onSelect(item.key)}
                    aria-current={isActive ? "page" : undefined}
                    className={`w-full text-left rounded-lg px-2.5 py-2 text-[13px] transition ${
                      isActive
                        ? "bg-[var(--mc-blue-50)] text-[var(--mc-blue-700)] font-semibold"
                        : "text-[var(--mc-ink-700)] hover:bg-slate-50"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-[var(--mc-line-soft)] space-y-2">
        <div className="text-[11.5px] text-[var(--mc-ink-500)]">Preparing your research workspace</div>
        <div className="text-[11px] text-[var(--mc-ink-400)] mc-mono">v{APP_VERSION} · open-source</div>
        <div className="text-[11px] text-med-sub">
          Manuscript sections drafted: <span className="font-semibold text-med-ink">{readySections}/5</span>
        </div>
      </div>
    </aside>
  );
}
