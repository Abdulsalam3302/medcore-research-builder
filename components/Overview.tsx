"use client";

import type { ProjectState } from "@/lib/types";
import type { ComponentType } from "react";
import { Badge } from "./ui/Badge";
import { LogoMark } from "./ui/Logo";
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
} from "./ui/Icon";

type IconCmp = ComponentType<{ size?: number; className?: string }>;
type Target =
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
        "Parse, look up in PubMed & Crossref, and produce a verification table.",
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
        onJump={onJump}
      />

      <div>
        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="eyebrow">Workflow</div>
            <h2 className="section-title mt-0.5">Build the manuscript, step by step</h2>
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
  onJump,
}: {
  draftedSections: number;
  hasType: boolean;
  hasTitle: boolean;
  refCount: number;
  onJump: (k: Target) => void;
}) {
  const nextStep: { label: string; target: Target } = !hasType
    ? { label: "Start with research type", target: "type" }
    : !hasTitle
    ? { label: "Draft the title", target: "title" }
    : draftedSections < 3
    ? { label: "Continue manuscript sections", target: "introduction" }
    : refCount === 0
    ? { label: "Verify references", target: "references" }
    : { label: "View compliance report", target: "report" };

  const stats = [
    { label: "Research type", value: hasType ? "Set" : "Pending", good: hasType },
    { label: "Title", value: hasTitle ? "Drafted" : "Pending", good: hasTitle },
    { label: "Sections", value: `${draftedSections}/5`, good: draftedSections >= 3 },
    { label: "References", value: refCount ? `${refCount}` : "0", good: refCount > 0 },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-med-line bg-hero-mesh shadow-soft">
      <div className="absolute -top-12 -right-12 h-56 w-56 rounded-full bg-brand-gradient opacity-10 blur-2xl" />
      <div className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-brand-gradient opacity-10 blur-2xl" />

      <div className="relative p-6 md:p-8 grid md:grid-cols-[1fr_auto] gap-6 items-center">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-3">
            <LogoMark size={36} />
            <span className="badge-brand">EQUATOR-aware</span>
            <span className="hidden sm:inline-flex badge-info">
              <IconSpark size={11} /> Evidence-first
            </span>
          </div>
          <h1 className="display-title">
            A research-grade workspace for{" "}
            <span className="text-transparent bg-clip-text bg-brand-gradient">
              medical manuscripts
            </span>
          </h1>
          <p className="muted mt-2 leading-relaxed">
            MedCore refines your draft against EQUATOR-Network reporting
            guidelines (CONSORT, STROBE, PRISMA, STARD, TRIPOD, CARE, SPIRIT,
            ARRIVE, SQUIRE, CHEERS, SRQR/COREQ, AGREE/RIGHT and more), runs
            evidence-based novelty checks, and verifies references against
            PubMed, Crossref, and OpenAlex. We never invent studies, PMIDs,
            DOIs, results, statistics, or claims.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button
              className="btn-primary"
              onClick={() => onJump(nextStep.target)}
            >
              {nextStep.label}
              <IconArrowRight size={15} />
            </button>
            <button
              className="btn-secondary"
              onClick={() => onJump("export")}
            >
              <IconUpload size={15} />
              Export center
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 md:gap-3 min-w-[260px]">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-med-line bg-white/80 backdrop-blur px-3.5 py-3"
            >
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-med-sub">
                {s.label}
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <span
                  className={`status-dot ${
                    s.good ? "bg-emerald-500 ring-2 ring-emerald-100" : "bg-amber-400 ring-2 ring-amber-100"
                  }`}
                />
                <span className="font-display font-semibold text-med-ink text-sm truncate">
                  {s.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
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
        "Every reference is verified against PubMed, Crossref, and OpenAlex with citation-level evidence.",
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
          <h3 className="section-title mt-0.5">Built for rigour, not for shortcuts</h3>
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
