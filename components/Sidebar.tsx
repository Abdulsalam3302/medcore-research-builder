"use client";

import type { ProjectState } from "@/lib/types";
import type { ComponentType } from "react";
import { scoreLaunch } from "@/lib/launchReadiness";
import { LogoWordmark } from "./ui/Logo";
import { APP_VERSION } from "@/lib/constants";
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
  IconBolt,
  IconSpark,
  IconReset,
} from "./ui/Icon";

export type ToolKey =
  | "launch"
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
  | "copilot"
  | "flow"
  | "coverLetter"
  | "reviewer"
  | "history"
  | "collaboration"
  | "quality"
  | "report"
  | "export";

type IconCmp = ComponentType<{ size?: number; className?: string }>;

const items: { key: ToolKey; label: string; Icon: IconCmp; group?: string }[] = [
  { key: "launch", label: "Research launch", Icon: IconBolt, group: "Workspace" },
  { key: "overview", label: "Project overview", Icon: IconOverview, group: "Workspace" },
  { key: "type", label: "Research type", Icon: IconCompass, group: "Workspace" },
  { key: "title", label: "Title Lab", Icon: IconPen, group: "Workspace" },
  { key: "introduction", label: "Introduction", Icon: IconDocument, group: "Manuscript" },
  { key: "methods", label: "Methods", Icon: IconFlask, group: "Manuscript" },
  { key: "results", label: "Results", Icon: IconChart, group: "Manuscript" },
  { key: "discussion", label: "Discussion", Icon: IconChat, group: "Manuscript" },
  { key: "conclusion", label: "Conclusion", Icon: IconFlag, group: "Manuscript" },
  { key: "appendix", label: "Appendices", Icon: IconDocument, group: "Manuscript" },
  { key: "stats", label: "Stats & figures", Icon: IconChart, group: "Analysis" },
  { key: "copilot", label: "Stats copilot", Icon: IconSpark, group: "Analysis" },
  { key: "flow", label: "Flow diagram", Icon: IconCompass, group: "Analysis" },
  { key: "references", label: "Reference Verifier", Icon: IconBooks, group: "Quality" },
  { key: "quality", label: "Quality Suite", Icon: IconShield, group: "Quality" },
  { key: "reviewer", label: "Reviewer simulator", Icon: IconChat, group: "Quality" },
  { key: "report", label: "Compliance Report", Icon: IconShield, group: "Quality" },
  { key: "coverLetter", label: "Cover letter", Icon: IconPen, group: "Submission" },
  { key: "history", label: "Version history", Icon: IconReset, group: "Submission" },
  { key: "collaboration", label: "Share / merge", Icon: IconUpload, group: "Submission" },
  { key: "export", label: "Export Center", Icon: IconUpload, group: "Submission" },
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
    <aside className="w-[260px] shrink-0 h-screen sticky top-0 border-r border-[var(--mc-line)] bg-[var(--mc-surface)] hidden md:flex md:flex-col">
      <div className="px-5 py-5 border-b border-[var(--mc-line-soft)]">
        <LogoWordmark />
      </div>

      <nav className="px-2.5 py-3.5 flex-1 overflow-y-auto space-y-5">
        {Object.entries(groups).map(([group, list]) => (
          <div key={group}>
            <div className="mc-eyebrow px-2.5 pb-1.5 text-[10.5px] text-[var(--mc-ink-400)]">
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
                    className={`relative w-full text-left flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition ${
                      isActive
                        ? "bg-[var(--mc-blue-50)] text-[var(--mc-blue-700)]"
                        : "text-[var(--mc-ink-700)] hover:bg-slate-50"
                    }`}
                  >
                    {isActive && (
                      <span
                        className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-[var(--mc-blue-500)]"
                        aria-hidden
                      />
                    )}
                    <span
                      className={`inline-flex items-center justify-center shrink-0 ${
                        isActive ? "text-[var(--mc-blue-500)]" : "text-[var(--mc-ink-400)]"
                      }`}
                    >
                      <Icon size={15} />
                    </span>
                    <span className="truncate flex-1">{it.label}</span>
                    {status && <NavStatusDot color={status.color} />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-[var(--mc-line-soft)] space-y-2">
        <div className="flex items-center gap-2 text-[11.5px] text-[var(--mc-ink-500)]">
          <IconShield size={13} className="text-[var(--mc-teal-500)]" />
          <span>Local-only · No login</span>
        </div>
        <div className="text-[11px] text-[var(--mc-ink-400)] mc-mono">v{APP_VERSION} · open-source</div>
        <div className="pt-1">
          <div className="text-[11px] text-[var(--mc-ink-500)] mb-1 flex justify-between font-medium">
            <span>Progress</span>
            <span className="tabular-nums text-[var(--mc-ink-900)]">{progress}%</span>
          </div>
          <div className="progress">
            <div style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
    </aside>
  );
}

function NavStatusDot({ color }: { color: "good" | "warn" | "neutral" }) {
  const bg =
    color === "good"
      ? "var(--mc-verified)"
      : color === "warn"
        ? "var(--mc-draft)"
        : "var(--mc-ink-300)";
  return (
    <span
      className="shrink-0 rounded-full"
      style={{ width: 6, height: 6, background: bg }}
      aria-hidden
    />
  );
}

function sectionStatus(
  key: ToolKey,
  p: ProjectState
): { color: "good" | "warn" | "neutral"; label: string } | null {
  switch (key) {
    case "launch": {
      if (!p.researchLaunch) return { color: "warn", label: "todo" };
      const score = scoreLaunch(p.researchLaunch).totalScore;
      if (score >= 75) return { color: "good", label: `${score}%` };
      if (score >= 30) return { color: "warn", label: `${score}%` };
      return { color: "warn", label: "todo" };
    }
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
  total += 1;
  if (p.researchLaunch && scoreLaunch(p.researchLaunch).totalScore >= 60) score += 1;
  total += 1; if (p.researchTypeResult) score += 1;
  total += 1; if (p.titleFinal || p.titleInputs.draftTitle) score += 1;
  for (const s of ["introduction", "methods", "results", "discussion", "conclusion"] as const) {
    total += 1;
    if ((p.sections[s] || "").length > 60) score += 1;
  }
  total += 1; if (p.references.verifications.length > 0) score += 1;
  return Math.round((score / total) * 100);
}
