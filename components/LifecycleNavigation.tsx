"use client";

import type { ProjectState } from "@/lib/types";
import { LogoWordmark } from "./ui/Logo";
import { InfoHint } from "./ui/InfoHint";
import { APP_VERSION } from "@/lib/constants";

/** What each phase of the journey accomplishes — shown as a hover explainer. */
const PHASE_HELP: Record<string, string> = {
  "Pre-Research":
    "Lay the groundwork before you write: define the question and feasibility, draft a protocol, pick the study design (which dictates the reporting guideline), and explore the literature and gap. Decisions here prevent expensive rework later.",
  "Intra-Research":
    "Build the manuscript section by section with guideline-aware drafting. Language editing and cross-section coherence checks run by default, so each section stays clear and consistent with the others.",
  "Post-Research":
    "Prepare a submission-ready package: verify references, find and compare target journals, and pass the final quality and compliance gates before you submit.",
  "Quality & Empowerment":
    "Sharpen and verify: run the AI peer-review swarm and re-score your manuscript, and tap the skills, tips, and tools that level up your craft.",
  "Post-Publication":
    "Extend impact after acceptance: create responsible outreach assets, then export everything for submission and your records.",
  Platform:
    "Platform information: product news and updates, and the mission, vision, and principles behind MedCore.",
};

export type LifecycleKey =
  | "overview"
  | "launch"
  | "protocol"
  | "type"
  | "title"
  | "literature"
  | "introduction"
  | "methods"
  | "results"
  | "discussion"
  | "conclusion"
  | "references"
  | "appendix"
  | "journal-finder"
  | "submission"
  | "review"
  | "toolkit"
  | "skills"
  | "impact-studio"
  | "export"
  | "announcements"
  | "about";

type NavItem = {
  key: LifecycleKey;
  label: string;
  phase: "Pre-Research" | "Intra-Research" | "Post-Research" | "Quality & Empowerment" | "Post-Publication" | "Platform";
};

const NAV_ITEMS: NavItem[] = [
  { key: "overview", label: "Overview", phase: "Pre-Research" },
  { key: "launch", label: "Research Launch", phase: "Pre-Research" },
  { key: "protocol", label: "Protocol / Proposal Studio", phase: "Pre-Research" },
  { key: "type", label: "Study Design Selector", phase: "Pre-Research" },
  { key: "title", label: "Literature & Gap Explorer", phase: "Pre-Research" },
  { key: "literature", label: "Literature Search (live)", phase: "Pre-Research" },
  { key: "introduction", label: "Introduction", phase: "Intra-Research" },
  { key: "methods", label: "Methods", phase: "Intra-Research" },
  { key: "results", label: "Results", phase: "Intra-Research" },
  { key: "discussion", label: "Discussion", phase: "Intra-Research" },
  { key: "conclusion", label: "Conclusion", phase: "Intra-Research" },
  { key: "references", label: "References", phase: "Intra-Research" },
  { key: "appendix", label: "Appendix (optional)", phase: "Intra-Research" },

  { key: "journal-finder", label: "Journal Finder", phase: "Post-Research" },
  { key: "submission", label: "Submission & Quality", phase: "Post-Research" },

  { key: "review", label: "Review & Improve (score + AI swarm)", phase: "Quality & Empowerment" },
  { key: "skills", label: "Research Skills & Tips", phase: "Quality & Empowerment" },
  { key: "toolkit", label: "Tools & MCP Directory", phase: "Quality & Empowerment" },

  { key: "impact-studio", label: "Post-Publication Impact Studio", phase: "Post-Publication" },
  { key: "export", label: "Export Center", phase: "Post-Publication" },

  { key: "announcements", label: "Announcements", phase: "Platform" },
  { key: "about", label: "About MedCore", phase: "Platform" },
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
            <div className="mc-eyebrow px-2 pb-1.5 text-[10.5px] text-[var(--mc-ink-400)] inline-flex items-center gap-1">
              {phase}
              {PHASE_HELP[phase] && <InfoHint side="right" title={`${phase} phase`} text={PHASE_HELP[phase]} />}
            </div>
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
