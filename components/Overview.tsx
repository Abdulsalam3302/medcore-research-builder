"use client";

import type { ProjectState } from "@/lib/types";
import type { ComponentType } from "react";
import { scoreLaunch } from "@/lib/launchReadiness";
import { Badge } from "./ui/Badge";
import { ProgressRing } from "./ui/ProgressRing";
import {
  IconCompass,
  IconPen,
  IconDocument,
  IconBooks,
  IconShield,
  IconUpload,
  IconArrowRight,
  IconCheck,
  IconSpark,
  IconBolt,
} from "./ui/Icon";
import { InfoHint } from "./ui/InfoHint";

type IconCmp = ComponentType<{ size?: number; className?: string }>;
type Target =
  | "launch"
  | "type"
  | "title"
  | "introduction"
  | "methods"
  | "results"
  | "discussion"
  | "conclusion"
  | "references"
  | "quality"
  | "report"
  | "export";

export function Overview({
  project,
  onJump,
}: {
  project: ProjectState;
  onJump: (k: Target) => void;
}) {
  const draftedSections = Object.values(project.sections).filter(
    (s) => s.length > 60,
  ).length;

  const launchScore = project.researchLaunch
    ? scoreLaunch(project.researchLaunch).totalScore
    : 0;

  const cards: Array<{
    step: string;
    title: string;
    desc: string;
    target: Target;
    status: "good" | "warn" | "neutral";
    statusLabel: string;
    Icon: IconCmp;
    tone: "teal" | "blue" | "indigo" | "sky" | "amber" | "violet";
  }> = [
    {
      step: "00",
      title: "Research launch",
      desc:
        "Pre-research preparation: team, PI, first author, budget, IRB, data, target journal — and a duration → design recommender.",
      target: "launch",
      status: launchScore >= 75 ? "good" : launchScore >= 30 ? "warn" : "warn",
      statusLabel: project.researchLaunch
        ? `Readiness ${launchScore}%`
        : "Not started",
      Icon: IconBolt,
      tone: "amber",
    },
    {
      step: "01",
      title: "Research type",
      desc:
        "Pick the design family and we'll recommend the right EQUATOR reporting guideline.",
      target: "type",
      status: project.researchTypeResult ? "good" : "warn",
      statusLabel: project.researchTypeResult
        ? `Primary: ${project.researchTypeResult.primaryGuidelineName}`
        : "Not selected",
      Icon: IconCompass,
      tone: "teal",
    },
    {
      step: "02",
      title: "Title Lab",
      desc:
        "Generate, refine, and run an evidence-based novelty & similarity scan.",
      target: "title",
      status:
        project.titleFinal || project.titleInputs.draftTitle ? "good" : "warn",
      statusLabel:
        project.titleFinal ||
        project.titleInputs.draftTitle ||
        "No title yet",
      Icon: IconPen,
      tone: "blue",
    },
    {
      step: "03",
      title: "Manuscript sections",
      desc:
        "Introduction → Methods → Results → Discussion → Conclusion. Checklist-driven, no fabrication.",
      target: "introduction",
      status: draftedSections >= 3 ? "good" : "warn",
      statusLabel: `${draftedSections}/5 drafted`,
      Icon: IconDocument,
      tone: "indigo",
    },
    {
      step: "04",
      title: "Reference Verifier",
      desc:
        "Parse references, verify metadata through trusted citation databases, and produce a verification table.",
      target: "references",
      status: project.references.verifications.length > 0 ? "good" : "warn",
      statusLabel: project.references.verifications.length
        ? `${project.references.verifications.length} references`
        : "No references yet",
      Icon: IconBooks,
      tone: "sky",
    },
    {
      step: "05",
      title: "Compliance Report",
      desc:
        "Final checklist coverage, novelty risk, reference summary, and recommendations.",
      target: "report",
      status: "neutral",
      statusLabel: "Run anytime",
      Icon: IconShield,
      tone: "amber",
    },
    {
      step: "06",
      title: "Export",
      desc:
        "Project JSON, manuscript Markdown, compliance MD, and references CSV.",
      target: "export",
      status: "neutral",
      statusLabel: "Available",
      Icon: IconUpload,
      tone: "violet",
    },
  ];

  return (
    <div className="grid gap-6 animate-fade-in">
      <HeroCard
        draftedSections={draftedSections}
        hasType={!!project.researchTypeResult}
        hasTitle={!!(project.titleFinal || project.titleInputs.draftTitle)}
        refCount={project.references.verifications.length}
        launchScore={launchScore}
        onJump={onJump}
      />

      <div>
        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="eyebrow">Workflow</div>
            <h2 className="section-title mt-0.5 inline-flex items-center gap-1.5">
              Build the manuscript, step by step
              <InfoHint
                title="How the workflow works"
                text="These seven steps are independent — you can start anywhere and return later. The status badge on each card reflects what you've drafted so far, drawn from your project on this device, not a measure of quality."
              />
            </h2>
          </div>
          <span className="muted hidden md:block">
            Each step is independent — pick up where you left off.
          </span>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((c) => (
            <StepCard key={c.title} {...c} onJump={onJump} />
          ))}
        </div>
      </div>

      <PrinciplesCard />
    </div>
  );
}

function HeroCard({
  draftedSections,
  hasType,
  hasTitle,
  refCount,
  launchScore,
  onJump,
}: {
  draftedSections: number;
  hasType: boolean;
  hasTitle: boolean;
  refCount: number;
  launchScore: number;
  onJump: (k: Target) => void;
}) {
  const nextStep: { label: string; target: Target } = launchScore < 60
    ? { label: "Run pre-research launch checklist", target: "launch" }
    : !hasType
      ? { label: "Continue in Research Type", target: "type" }
      : !hasTitle
        ? { label: "Continue in Title Lab", target: "title" }
        : draftedSections < 3
          ? { label: "Continue manuscript sections", target: "introduction" }
          : refCount === 0
            ? { label: "Verify references", target: "references" }
            : { label: "View compliance report", target: "report" };

  const progress = computeHeroProgress({
    launchScore,
    hasType,
    hasTitle,
    draftedSections,
    refCount,
  });
  const sectionsDone = draftedSections + (hasType ? 1 : 0) + (hasTitle ? 1 : 0);
  const refIssues = 0;

  return (
    <div
      className="rounded-[var(--mc-r-xl)] border border-[var(--mc-line)] p-7 md:p-8 shadow-[var(--mc-shadow-sm)]"
      style={{
        background: "linear-gradient(180deg, #FFFFFF 0%, #F8FAFE 100%)",
      }}
    >
      <div className="grid lg:grid-cols-[200px_1fr_auto] gap-8 items-center">
        <ProgressRing
          value={progress}
          size={168}
          label="Manuscript readiness"
          sublabel={`${draftedSections}/5 sections drafted`}
          accent={progress >= 75 ? "var(--mc-teal-500)" : "var(--mc-blue-500)"}
        />

        <div className="min-w-0">
          <div className="mc-eyebrow text-[var(--mc-teal-700)]">Pick up where you left off</div>
          <h1
            className="mt-2 mb-2.5 text-[28px] md:text-[30px] leading-tight text-[var(--mc-ink-900)]"
            style={{ fontFamily: "var(--font-serif)", fontWeight: 500, letterSpacing: "-0.015em" }}
          >
            Your draft is{" "}
            <span className="text-[var(--mc-blue-500)]">
              {progress >= 80 ? "nearly ready" : "building well"}
            </span>
            .
          </h1>
          <p className="text-sm text-[var(--mc-ink-500)] leading-relaxed max-w-xl">
            {nextStep.label}. Everything stays on your device until you choose to export.
            MedCore never invents studies, statistics, or citations.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="btn-primary" onClick={() => onJump(nextStep.target)}>
              {nextStep.label}
              <IconArrowRight size={15} />
            </button>
            <button className="btn-secondary" onClick={() => onJump("quality")}>
              <IconSpark size={15} />
              Quality Suite
            </button>
          </div>
        </div>

        <div className="hidden xl:flex flex-col gap-2 min-w-[150px]">
          <KeyMetric value={String(sectionsDone)} unit="steps" label="workflow" />
          <KeyMetric value={String(refCount)} unit="refs" label="verified" />
          {refIssues > 0 && (
            <KeyMetric value={String(refIssues)} unit="flags" label="integrity" tone="warn" />
          )}
        </div>
      </div>
    </div>
  );
}

function KeyMetric({
  value,
  unit,
  label,
  tone = "neutral",
}: {
  value: string;
  unit: string;
  label: string;
  tone?: "neutral" | "warn";
}) {
  const color =
    tone === "warn" ? "var(--mc-draft)" : "var(--mc-ink-900)";
  return (
    <div className="flex items-baseline gap-2 py-1">
      <div className="flex-1 text-right">
        <div className="mc-eyebrow text-[9.5px]">{label}</div>
      </div>
      <div className="mc-numeral text-[26px] leading-none" style={{ color }}>
        {value}
      </div>
      <div className="mc-mono text-[10.5px] text-[var(--mc-ink-400)] w-10">{unit}</div>
    </div>
  );
}

function computeHeroProgress(args: {
  launchScore: number;
  hasType: boolean;
  hasTitle: boolean;
  draftedSections: number;
  refCount: number;
}): number {
  let score = 0;
  if (args.launchScore >= 60) score += 15;
  else score += Math.round((args.launchScore / 100) * 15);
  if (args.hasType) score += 15;
  if (args.hasTitle) score += 10;
  score += Math.round((args.draftedSections / 5) * 40);
  if (args.refCount > 0) score += 20;
  return Math.min(100, score);
}

const TONE_STYLES: Record<
  "teal" | "blue" | "indigo" | "sky" | "amber" | "violet",
  { bg: string; ring: string; text: string }
> = {
  teal: { bg: "bg-teal-50", ring: "ring-teal-200/60", text: "text-teal-700" },
  blue: { bg: "bg-sky-50", ring: "ring-sky-200/60", text: "text-sky-700" },
  indigo: { bg: "bg-indigo-50", ring: "ring-indigo-200/60", text: "text-indigo-700" },
  sky: { bg: "bg-cyan-50", ring: "ring-cyan-200/60", text: "text-cyan-700" },
  amber: { bg: "bg-amber-50", ring: "ring-amber-200/60", text: "text-amber-700" },
  violet: { bg: "bg-violet-50", ring: "ring-violet-200/60", text: "text-violet-700" },
};

function StepCard({
  step,
  title,
  desc,
  target,
  status,
  statusLabel,
  Icon,
  tone,
  onJump,
}: {
  step: string;
  title: string;
  desc: string;
  target: Target;
  status: "good" | "warn" | "neutral";
  statusLabel: string;
  Icon: IconCmp;
  tone: keyof typeof TONE_STYLES;
  onJump: (k: Target) => void;
}) {
  const t = TONE_STYLES[tone];
  return (
    <button
      onClick={() => onJump(target)}
      className="card lift text-left group relative overflow-hidden hover:border-med-lineStrong hover:shadow-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-med-brand/30 focus-visible:ring-offset-2 focus-visible:ring-offset-med-bg"
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className={`inline-flex items-center justify-center h-10 w-10 rounded-xl ring-1 ${t.bg} ${t.ring} ${t.text}`}
            >
              <Icon size={18} />
            </span>
            <div className="min-w-0">
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-med-subtle">
                Step {step}
              </div>
              <div className="section-title text-[15px] truncate">{title}</div>
            </div>
          </div>
          <Badge kind={status}>{statusLabel}</Badge>
        </div>
        <p className="muted leading-relaxed">{desc}</p>
        <div className="mt-4 flex items-center justify-between text-[12px]">
          <span className="inline-flex items-center gap-1.5 text-med-brand font-medium opacity-0 -translate-x-1 transition group-hover:opacity-100 group-hover:translate-x-0">
            Open <IconArrowRight size={13} />
          </span>
          <span className="text-med-subtle">{statusLabel}</span>
        </div>
      </div>
    </button>
  );
}

function PrinciplesCard() {
  const items = [
    {
      title: "No fabrication",
      desc:
        "Numbers, p-values, CIs, sample sizes, PMIDs and DOIs are never invented — missing items are flagged for author input.",
    },
    {
      title: "Reporting-guideline-first",
      desc:
        "Every section is checked against the relevant EQUATOR checklist (CONSORT, STROBE, PRISMA, and more).",
    },
    {
      title: "Verified references",
      desc:
        "References are cross-checked against trusted literature and citation sources with evidence-level traceability.",
    },
  ];
  return (
    <div className="card-elevated overflow-hidden">
      <div className="p-5 md:p-6 grid md:grid-cols-[auto_1fr] gap-5 items-start">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-brand-gradient text-white shadow-glow">
          <IconCheck size={22} />
        </div>
        <div>
          <div className="eyebrow">Core principles</div>
          <h3 className="section-title mt-0.5 inline-flex items-center gap-1.5">
            Built for rigour, not for shortcuts
            <InfoHint
              title="Why these guardrails matter"
              text="MedCore drafts and checks, but it never invents statistics, sample sizes, or citations — missing items are flagged for you to supply. These tools assist your work; they do not replace your judgment, your co-authors, or formal peer and ethics review."
            />
          </h3>
          <div className="mt-3 grid sm:grid-cols-3 gap-4">
            {items.map((it) => (
              <div key={it.title}>
                <div className="font-semibold text-med-ink text-sm">{it.title}</div>
                <p className="muted mt-1 leading-relaxed text-[13px]">{it.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
