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
  Community:
    "Research is a team sport: post or join research opportunities, share MedCore projects to find collaborators, and meet researchers in your specialty — so projects are initiated and finished on the platform.",
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
  | "pipeline"
  | "submission"
  | "club"
  | "review"
  | "library"
  | "toolkit"
  | "skills"
  | "impact-studio"
  | "export"
  | "announcements"
  | "about";

type PhaseName =
  | "Platform"
  | "Pre-Research"
  | "Intra-Research"
  | "Post-Research"
  | "Quality & Empowerment"
  | "Post-Publication"
  | "Community";

type NavItem = {
  key: LifecycleKey;
  label: string;
  phase: PhaseName;
};

/**
 * Per-phase accent colours. Each group header is rendered bold and in its own
 * colour so the lifecycle reads as distinct, scannable stages. The active item
 * inside a group also picks up the phase colour for a cohesive feel.
 * `dotClass` paints the small leading marker; `headClass` paints the header
 * label + the hairline divider.
 */
const PHASE_THEME: Record<
  PhaseName,
  { headClass: string; dotClass: string; activeClass: string; barClass: string }
> = {
  Platform: {
    headClass: "text-violet-700",
    dotClass: "bg-violet-500",
    activeClass: "bg-violet-50 text-violet-800",
    barClass: "bg-violet-400",
  },
  "Pre-Research": {
    headClass: "text-sky-700",
    dotClass: "bg-sky-500",
    activeClass: "bg-sky-50 text-sky-800",
    barClass: "bg-sky-400",
  },
  "Intra-Research": {
    headClass: "text-teal-700",
    dotClass: "bg-teal-500",
    activeClass: "bg-teal-50 text-teal-800",
    barClass: "bg-teal-400",
  },
  "Post-Research": {
    headClass: "text-amber-700",
    dotClass: "bg-amber-500",
    activeClass: "bg-amber-50 text-amber-800",
    barClass: "bg-amber-400",
  },
  "Quality & Empowerment": {
    headClass: "text-fuchsia-700",
    dotClass: "bg-fuchsia-500",
    activeClass: "bg-fuchsia-50 text-fuchsia-800",
    barClass: "bg-fuchsia-400",
  },
  "Post-Publication": {
    headClass: "text-rose-700",
    dotClass: "bg-rose-500",
    activeClass: "bg-rose-50 text-rose-800",
    barClass: "bg-rose-400",
  },
  Community: {
    headClass: "text-emerald-700",
    dotClass: "bg-emerald-500",
    activeClass: "bg-emerald-50 text-emerald-800",
    barClass: "bg-emerald-400",
  },
};

/** Order the groups render in. Platform sits first, at the top. */
const PHASE_ORDER: PhaseName[] = [
  "Platform",
  "Pre-Research",
  "Intra-Research",
  "Post-Research",
  "Quality & Empowerment",
  "Post-Publication",
  "Community",
];

const NAV_ITEMS: NavItem[] = [
  { key: "announcements", label: "Announcements", phase: "Platform" },
  { key: "about", label: "About MedCore", phase: "Platform" },

  { key: "overview", label: "Overview", phase: "Pre-Research" },
  { key: "launch", label: "Research Launch", phase: "Pre-Research" },
  { key: "protocol", label: "Protocol / Proposal Studio", phase: "Pre-Research" },
  { key: "type", label: "Study Design Selector", phase: "Pre-Research" },
  // Literature & Gap Explorer now contains the live Literature Search too —
  // one circle for evidence work (title/gap + live search). No separate lane.
  { key: "title", label: "Literature & Gap Explorer", phase: "Pre-Research" },

  { key: "introduction", label: "Introduction", phase: "Intra-Research" },
  { key: "methods", label: "Methods", phase: "Intra-Research" },
  { key: "results", label: "Results", phase: "Intra-Research" },
  { key: "discussion", label: "Discussion", phase: "Intra-Research" },
  { key: "conclusion", label: "Conclusion", phase: "Intra-Research" },
  { key: "references", label: "References", phase: "Intra-Research" },
  { key: "appendix", label: "Appendix (optional)", phase: "Intra-Research" },

  { key: "journal-finder", label: "Journal Finder", phase: "Post-Research" },
  { key: "pipeline", label: "Submission Pipeline", phase: "Post-Research" },
  { key: "submission", label: "Submission & Quality", phase: "Post-Research" },

  { key: "review", label: "Review & Improve (score + AI swarm)", phase: "Quality & Empowerment" },
  { key: "library", label: "Library Navigator (find what you need)", phase: "Quality & Empowerment" },
  { key: "skills", label: "Research Skills & Tips", phase: "Quality & Empowerment" },
  { key: "toolkit", label: "Tools & MCP Directory", phase: "Quality & Empowerment" },

  { key: "impact-studio", label: "Post-Publication Impact Studio", phase: "Post-Publication" },
  { key: "export", label: "Export Center", phase: "Post-Publication" },

  { key: "club", label: "Publication Club", phase: "Community" },
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
  const orderedPhases = PHASE_ORDER.filter((p) => groups[p]?.length);

  const readySections = Object.values(project.sections).filter((s) => s.trim().length > 60).length;

  return (
    <aside className="w-[280px] shrink-0 h-screen sticky top-0 border-r border-[var(--mc-line)] bg-[var(--mc-surface)] hidden md:flex md:flex-col">
      <div className="px-5 py-5 border-b border-[var(--mc-line-soft)]">
        <LogoWordmark />
      </div>

      <nav aria-label="Research lifecycle" className="px-3 py-4 flex-1 overflow-y-auto space-y-5">
        {orderedPhases.map((phase) => {
          const items = groups[phase];
          const theme = PHASE_THEME[phase];
          return (
            <section key={phase}>
              <div
                className={`px-2 pb-1.5 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] ${theme.headClass}`}
              >
                <span className={`h-2 w-2 rounded-full ${theme.dotClass}`} aria-hidden />
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
                      className={`relative w-full text-left rounded-lg pl-3.5 pr-2.5 py-2 text-[13px] transition ${
                        isActive
                          ? `${theme.activeClass} font-semibold`
                          : "text-[var(--mc-ink-700)] hover:bg-slate-50"
                      }`}
                    >
                      {isActive && (
                        <span
                          className={`absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r ${theme.barClass}`}
                          aria-hidden
                        />
                      )}
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
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
