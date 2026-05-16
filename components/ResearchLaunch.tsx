"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  ProjectState,
  ResearchLaunchAnswers,
  DurationBucket,
  YesNoMaybe,
} from "@/lib/types";
import { scoreLaunch, durationLabel } from "@/lib/launchReadiness";
import { getLaunchBaseline, setLaunchBaseline } from "@/lib/store";
import { Badge } from "./ui/Badge";
import {
  IconBolt,
  IconCheck,
  IconShield,
  IconSpark,
  IconArrowRight,
  IconFlag,
} from "./ui/Icon";

type Update = (fn: (p: ProjectState) => ProjectState) => void;

const DURATION_OPTIONS: { value: DurationBucket; label: string; hint: string }[] = [
  { value: "lt1m", label: "< 1 month", hint: "Sprint window" },
  { value: "1to3m", label: "1–3 months", hint: "Short cycle" },
  { value: "3to6m", label: "3–6 months", hint: "Standard" },
  { value: "6to12m", label: "6–12 months", hint: "Long cycle" },
  { value: "gt12m", label: "> 12 months", hint: "Programme" },
];

const YNM: { value: YesNoMaybe; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "partial", label: "Partial" },
  { value: "no", label: "No" },
];

export function ResearchLaunch({
  project,
  update,
  onJump,
}: {
  project: ProjectState;
  update: Update;
  onJump?: (k: string) => void;
}) {
  const answers = project.researchLaunch || {};
  const summary = useMemo(() => scoreLaunch(answers), [answers]);
  const [baseline, setBaseline] = useState<{ score: number; capturedAt: string } | null>(
    null,
  );
  useEffect(() => {
    const existing = getLaunchBaseline();
    if (existing) {
      setBaseline(existing);
    } else if (project.researchLaunch) {
      setLaunchBaseline(summary.totalScore);
      setBaseline({ score: summary.totalScore, capturedAt: new Date().toISOString() });
    }
  }, [project.researchLaunch, summary.totalScore]);
  const delta = baseline ? summary.totalScore - baseline.score : null;

  const setLaunch = (patch: Partial<ResearchLaunchAnswers>) =>
    update((p) => ({
      ...p,
      researchLaunch: { ...(p.researchLaunch || {}), ...patch },
      updatedAt: new Date().toISOString(),
    }));

  const setBudgetItem = (
    key: keyof NonNullable<ResearchLaunchAnswers["budgetItems"]>,
    value: boolean,
  ) =>
    update((p) => {
      const prev = p.researchLaunch || {};
      return {
        ...p,
        researchLaunch: {
          ...prev,
          budgetItems: { ...(prev.budgetItems || {}), [key]: value },
        },
        updatedAt: new Date().toISOString(),
      };
    });

  return (
    <div className="grid gap-6 animate-fade-in">
      <Hero
        summary={summary}
        answers={answers}
        onJump={onJump}
        delta={delta}
        baseline={baseline}
        onResetBaseline={() => {
          setLaunchBaseline(summary.totalScore);
          setBaseline({ score: summary.totalScore, capturedAt: new Date().toISOString() });
        }}
      />

      <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
        <div className="grid gap-5">
          <SectionCard
            step="01"
            title="Team & leadership"
            desc="Most journals require a senior author. Solo work is publishable but slower — peer review of drafts is what catches Methods/Results errors before reviewers do."
            tone="teal"
          >
            <div className="grid gap-3">
              <YnmRow
                label="Do you have a team?"
                value={answers.hasTeam}
                onChange={(v) => setLaunch({ hasTeam: v })}
              />
              {answers.hasTeam === "yes" || answers.hasTeam === "partial" ? (
                <FieldRow label="Approximate team size">
                  <input
                    className="input max-w-[140px]"
                    type="number"
                    min={1}
                    value={answers.teamSize ?? ""}
                    onChange={(e) =>
                      setLaunch({
                        teamSize: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    placeholder="e.g. 4"
                  />
                </FieldRow>
              ) : null}

              <YnmRow
                label="Do you have a consultant / Principal Investigator (PI)?"
                value={answers.hasPI}
                onChange={(v) => setLaunch({ hasPI: v })}
              />
              {answers.hasPI === "yes" ? (
                <FieldRow label="PI name (optional)">
                  <input
                    className="input"
                    value={answers.piName ?? ""}
                    onChange={(e) => setLaunch({ piName: e.target.value })}
                    placeholder="Dr. Jane Doe"
                  />
                </FieldRow>
              ) : null}

              <YnmRow
                label="Do you have a senior / expert researcher on the team?"
                value={answers.hasSeniorResearcher}
                onChange={(v) => setLaunch({ hasSeniorResearcher: v })}
              />

              <YnmRow
                label="Do you have a clear leader?"
                value={answers.hasLeader}
                onChange={(v) => setLaunch({ hasLeader: v })}
              />
              {answers.hasLeader === "yes" ? (
                <FieldRow label="Who leads?">
                  <select
                    className="input max-w-[260px]"
                    value={answers.leaderRole ?? ""}
                    onChange={(e) =>
                      setLaunch({
                        leaderRole: (e.target.value || undefined) as
                          | ResearchLaunchAnswers["leaderRole"]
                          | undefined,
                      })
                    }
                  >
                    <option value="">— select —</option>
                    <option value="PI">PI</option>
                    <option value="senior">Senior researcher</option>
                    <option value="first-author">First author</option>
                    <option value="consultant">External consultant</option>
                    <option value="other">Other</option>
                  </select>
                </FieldRow>
              ) : null}

              <CheckRow
                label="Roles assigned (data, analysis, writing, submission)"
                checked={!!answers.rolesAssigned}
                onChange={(v) => setLaunch({ rolesAssigned: v })}
              />
            </div>
          </SectionCard>

          <SectionCard
            step="02"
            title="Authorship"
            desc="Authorship disputes are the single most common cause of late-stage manuscript collapse. Decide before drafting starts."
            tone="blue"
          >
            <div className="grid gap-3">
              <CheckRow
                label="First author decided"
                checked={!!answers.firstAuthorDecided}
                onChange={(v) => setLaunch({ firstAuthorDecided: v })}
              />
              {answers.firstAuthorDecided ? (
                <FieldRow label="First author name (optional)">
                  <input
                    className="input"
                    value={answers.firstAuthorName ?? ""}
                    onChange={(e) => setLaunch({ firstAuthorName: e.target.value })}
                    placeholder="Full name"
                  />
                </FieldRow>
              ) : null}
              <CheckRow
                label="Authorship order agreed by all contributors"
                checked={!!answers.authorshipOrderAgreed}
                onChange={(v) => setLaunch({ authorshipOrderAgreed: v })}
              />
              <CheckRow
                label="Corresponding author decided"
                checked={!!answers.correspondingAuthorDecided}
                onChange={(v) => setLaunch({ correspondingAuthorDecided: v })}
              />
              <CheckRow
                label="ICMJE authorship criteria reviewed with the team"
                checked={!!answers.icmjeReviewed}
                onChange={(v) => setLaunch({ icmjeReviewed: v })}
              />
            </div>
          </SectionCard>

          <SectionCard
            step="03"
            title="Research type & pre-requirements"
            desc="IRB, data, and instruments are the gating items. If any of these are 'not started', most realistic timelines move out by months."
            tone="indigo"
          >
            <div className="grid gap-3">
              <CheckRow
                label="Research type / design known"
                checked={!!answers.researchTypeKnown}
                onChange={(v) => setLaunch({ researchTypeKnown: v })}
              />
              <FieldRow label="Working description (e.g. 'retrospective cohort, T2DM patients, single centre')">
                <input
                  className="input"
                  value={answers.researchTypeNote ?? ""}
                  onChange={(e) => setLaunch({ researchTypeNote: e.target.value })}
                  placeholder="Short free-text"
                />
              </FieldRow>

              <FieldRow label="IRB / Ethics status">
                <select
                  className="input max-w-[260px]"
                  value={answers.irbStatus ?? ""}
                  onChange={(e) =>
                    setLaunch({
                      irbStatus: (e.target.value || undefined) as
                        | ResearchLaunchAnswers["irbStatus"]
                        | undefined,
                    })
                  }
                >
                  <option value="">— select —</option>
                  <option value="approved">Approved</option>
                  <option value="submitted">Submitted, awaiting decision</option>
                  <option value="not-required">Not required</option>
                  <option value="not-started">Not started</option>
                </select>
              </FieldRow>
              {answers.irbStatus === "approved" ? (
                <FieldRow label="IRB / approval number (optional)">
                  <input
                    className="input"
                    value={answers.irbNumber ?? ""}
                    onChange={(e) => setLaunch({ irbNumber: e.target.value })}
                    placeholder="e.g. IRB-2025-417"
                  />
                </FieldRow>
              ) : null}

              <FieldRow label="Data status">
                <select
                  className="input max-w-[320px]"
                  value={answers.dataStatus ?? ""}
                  onChange={(e) =>
                    setLaunch({
                      dataStatus: (e.target.value || undefined) as
                        | ResearchLaunchAnswers["dataStatus"]
                        | undefined,
                    })
                  }
                >
                  <option value="">— select —</option>
                  <option value="collected-clean">Collected & cleaned (analysis-ready)</option>
                  <option value="collected-raw">Collected, needs cleaning</option>
                  <option value="in-collection">Currently being collected</option>
                  <option value="secondary-available">Secondary data already available</option>
                  <option value="not-started">Not started</option>
                </select>
              </FieldRow>

              <FieldRow label="Questionnaire / instrument">
                <select
                  className="input max-w-[260px]"
                  value={answers.questionnaireStatus ?? ""}
                  onChange={(e) =>
                    setLaunch({
                      questionnaireStatus: (e.target.value || undefined) as
                        | ResearchLaunchAnswers["questionnaireStatus"]
                        | undefined,
                    })
                  }
                >
                  <option value="">— select —</option>
                  <option value="validated">Validated instrument selected</option>
                  <option value="draft">Draft, not yet validated</option>
                  <option value="not-needed">Not needed</option>
                  <option value="not-started">Not started</option>
                </select>
              </FieldRow>

              <FieldRow label="Trial / study registration">
                <select
                  className="input max-w-[260px]"
                  value={answers.registrationStatus ?? ""}
                  onChange={(e) =>
                    setLaunch({
                      registrationStatus: (e.target.value || undefined) as
                        | ResearchLaunchAnswers["registrationStatus"]
                        | undefined,
                    })
                  }
                >
                  <option value="">— select —</option>
                  <option value="registered">Registered</option>
                  <option value="in-progress">In progress</option>
                  <option value="not-required">Not required</option>
                  <option value="not-started">Not started</option>
                </select>
              </FieldRow>
              {answers.registrationStatus === "registered" ? (
                <FieldRow label="Registration ID (NCT / PROSPERO / etc.)">
                  <input
                    className="input"
                    value={answers.registrationId ?? ""}
                    onChange={(e) => setLaunch({ registrationId: e.target.value })}
                    placeholder="NCT0123456"
                  />
                </FieldRow>
              ) : null}

              <FieldRow label="Informed consent">
                <select
                  className="input max-w-[260px]"
                  value={answers.consentStatus ?? ""}
                  onChange={(e) =>
                    setLaunch({
                      consentStatus: (e.target.value || undefined) as
                        | ResearchLaunchAnswers["consentStatus"]
                        | undefined,
                    })
                  }
                >
                  <option value="">— select —</option>
                  <option value="obtained">Obtained</option>
                  <option value="in-progress">In progress</option>
                  <option value="not-required">Not required</option>
                  <option value="not-started">Not started</option>
                </select>
              </FieldRow>
            </div>
          </SectionCard>

          <SectionCard
            step="04"
            title="Budget & funding"
            desc="≈99% of publications carry third-party costs — APC for open access, language editing, statistics, figure design. Budget early so submission isn't blocked."
            tone="amber"
          >
            <div className="grid gap-3">
              <CheckRow
                label="Budget planned"
                checked={!!answers.budgetPlanned}
                onChange={(v) => setLaunch({ budgetPlanned: v })}
              />
              <YnmRow
                label="Funding secured"
                value={answers.fundingSecured}
                onChange={(v) => setLaunch({ fundingSecured: v })}
              />
              <FieldRow label="Estimated total budget (USD, optional)">
                <input
                  className="input max-w-[180px]"
                  type="number"
                  min={0}
                  value={answers.estimatedBudgetUSD ?? ""}
                  onChange={(e) =>
                    setLaunch({
                      estimatedBudgetUSD: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                  placeholder="e.g. 3500"
                />
              </FieldRow>

              <div>
                <div className="text-[12px] font-semibold text-med-ink mb-2">
                  Budget items considered
                </div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {BUDGET_ITEMS.map((it) => (
                    <CheckRow
                      key={it.key}
                      label={it.label}
                      checked={!!answers.budgetItems?.[it.key]}
                      onChange={(v) => setBudgetItem(it.key, v)}
                      compact
                    />
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            step="05"
            title="Methodology readiness"
            desc="A pre-specified analysis plan and a defined primary outcome cut review cycles dramatically and protect against p-hacking accusations."
            tone="violet"
          >
            <div className="grid gap-3">
              <YnmRow
                label="Statistician available?"
                value={answers.statisticianAvailable}
                onChange={(v) => setLaunch({ statisticianAvailable: v })}
                extra="external"
                extraLabel="External / paid"
              />
              <CheckRow
                label="Analysis plan ready (pre-specified)"
                checked={!!answers.analysisPlanReady}
                onChange={(v) => setLaunch({ analysisPlanReady: v })}
              />
              <CheckRow
                label="Primary & secondary outcomes defined"
                checked={!!answers.outcomeMeasuresDefined}
                onChange={(v) => setLaunch({ outcomeMeasuresDefined: v })}
              />
              <CheckRow
                label="Sample size justified (power calc / saturation)"
                checked={!!answers.sampleSizeJustified}
                onChange={(v) => setLaunch({ sampleSizeJustified: v })}
              />
            </div>
          </SectionCard>

          <SectionCard
            step="06"
            title="Journal, tools & compliance"
            desc="Choosing the journal first locks word limits, abstract structure, and reference style — saves the typical late-stage reformat cycle."
            tone="sky"
          >
            <div className="grid gap-3">
              <CheckRow
                label="Target journal known"
                checked={!!answers.targetJournalKnown}
                onChange={(v) => setLaunch({ targetJournalKnown: v })}
              />
              {answers.targetJournalKnown ? (
                <FieldRow label="Target journal name">
                  <input
                    className="input"
                    value={answers.targetJournalName ?? ""}
                    onChange={(e) =>
                      setLaunch({ targetJournalName: e.target.value })
                    }
                    placeholder="e.g. BMJ Open"
                  />
                </FieldRow>
              ) : null}
              <CheckRow
                label="Manuscript type decided (article / brief / case report / review)"
                checked={!!answers.manuscriptTypeKnown}
                onChange={(v) => setLaunch({ manuscriptTypeKnown: v })}
              />
              <CheckRow
                label="Reference manager set up (Zotero / EndNote / Mendeley)"
                checked={!!answers.referenceManagerReady}
                onChange={(v) => setLaunch({ referenceManagerReady: v })}
              />
              <CheckRow
                label="Conflicts of interest collected from all authors"
                checked={!!answers.coiDisclosed}
                onChange={(v) => setLaunch({ coiDisclosed: v })}
              />
              <CheckRow
                label="AI / LLM use policy reviewed (ICMJE 2026)"
                checked={!!answers.aiUsePolicyReviewed}
                onChange={(v) => setLaunch({ aiUsePolicyReviewed: v })}
              />
              <CheckRow
                label="Data sharing plan agreed"
                checked={!!answers.dataSharingPlanned}
                onChange={(v) => setLaunch({ dataSharingPlanned: v })}
              />
            </div>
          </SectionCard>

          <SectionCard
            step="07"
            title="Quick survey — duration → design"
            desc="Pick the duration you actually have. The recommender below adjusts to realistic designs — a 12-month project can finish in ≈10 days when team, data, journal, and IRB are all ready."
            tone="teal"
          >
            <div className="grid gap-3">
              <div className="flex flex-wrap gap-2">
                {DURATION_OPTIONS.map((d) => {
                  const active = answers.durationTarget === d.value;
                  return (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => setLaunch({ durationTarget: d.value })}
                      className={`px-3.5 py-2 rounded-lg text-[13px] font-medium border transition ${
                        active
                          ? "bg-brand-gradient text-white border-transparent shadow-soft"
                          : "bg-white border-med-line text-med-ink hover:border-med-lineStrong hover:bg-slate-50"
                      }`}
                    >
                      <span className="block">{d.label}</span>
                      <span
                        className={`text-[10.5px] uppercase tracking-wide ${
                          active ? "text-white/85" : "text-med-subtle"
                        }`}
                      >
                        {d.hint}
                      </span>
                    </button>
                  );
                })}
              </div>
              <CheckRow
                label="Hard deadline (grant, conference, thesis defence)"
                checked={!!answers.hasHardDeadline}
                onChange={(v) => setLaunch({ hasHardDeadline: v })}
              />
              {answers.hasHardDeadline ? (
                <FieldRow label="Deadline date">
                  <input
                    type="date"
                    className="input max-w-[220px]"
                    value={answers.deadlineDate ?? ""}
                    onChange={(e) => setLaunch({ deadlineDate: e.target.value })}
                  />
                </FieldRow>
              ) : null}
            </div>

            <DurationRecommender summary={summary} answers={answers} />
          </SectionCard>

          <SectionCard
            step="08"
            title="Notes"
            desc="Anything else the team should know on day one — scope constraints, language, multi-site logistics, etc."
            tone="indigo"
          >
            <textarea
              className="textarea"
              value={answers.notes ?? ""}
              onChange={(e) => setLaunch({ notes: e.target.value })}
              placeholder="Free text — these notes carry into Project overview."
            />
          </SectionCard>

          <div className="flex flex-wrap gap-2 items-center justify-between">
            <button
              className="btn-secondary"
              onClick={() => setLaunch({ completedAt: new Date().toISOString() })}
            >
              <IconCheck size={15} />
              Mark launch checklist complete
            </button>
            {onJump ? (
              <button className="btn-primary" onClick={() => onJump("type")}>
                Continue to Research type
                <IconArrowRight size={15} />
              </button>
            ) : null}
          </div>
        </div>

        <ReadinessSidebar summary={summary} answers={answers} />
      </div>
    </div>
  );
}

const BUDGET_ITEMS: { key: keyof NonNullable<ResearchLaunchAnswers["budgetItems"]>; label: string }[] = [
  { key: "apc", label: "Open-access / APC fees" },
  { key: "submissionFees", label: "Submission / handling fees" },
  { key: "languageEdit", label: "English / language editing" },
  { key: "statisticsConsult", label: "Statistics consult" },
  { key: "figureDesign", label: "Figure / illustration design" },
  { key: "plagiarismCheck", label: "Plagiarism / iThenticate" },
  { key: "referenceManager", label: "Reference manager license" },
  { key: "softwareLicenses", label: "Stats software (SPSS, REDCap…)" },
  { key: "transcription", label: "Transcription (qualitative)" },
  { key: "travelConferences", label: "Travel / conferences" },
  { key: "irbFees", label: "IRB / ethics fees" },
  { key: "reprints", label: "Reprints / colour figures" },
];

function Hero({
  summary,
  answers,
  onJump,
  delta,
  baseline,
  onResetBaseline,
}: {
  summary: ReturnType<typeof scoreLaunch>;
  answers: ResearchLaunchAnswers;
  onJump?: (k: string) => void;
  delta: number | null;
  baseline: { score: number; capturedAt: string } | null;
  onResetBaseline: () => void;
}) {
  const score = summary.totalScore;
  const tone =
    score >= 75 ? "good" : score >= 45 ? "warn" : "bad";
  const verdict =
    score >= 75
      ? "Ready to start drafting"
      : score >= 45
      ? "Workable, but pre-work outstanding"
      : "Pre-research preparation incomplete";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-med-line bg-hero-mesh shadow-soft">
      <div className="absolute -top-12 -right-12 h-56 w-56 rounded-full bg-brand-gradient opacity-10 blur-2xl" />
      <div className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-brand-gradient opacity-10 blur-2xl" />
      <div className="relative p-6 md:p-8 grid md:grid-cols-[1fr_auto] gap-6 items-center">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="badge-brand">Research launch</span>
            <span className="hidden sm:inline-flex badge-info">
              <IconSpark size={11} /> Pre-research preparation
            </span>
            {answers.completedAt ? (
              <Badge kind="good">Checklist marked complete</Badge>
            ) : null}
          </div>
          <h1 className="display-title">
            Get ready before you{" "}
            <span className="text-transparent bg-clip-text bg-brand-gradient">
              start writing
            </span>
          </h1>
          <p className="muted mt-2 leading-relaxed">
            A research that would normally take a year can finish in ≈10 days
            when team, data, journal, IRB and budget are all ready on day one.
            Run this checklist first — every "no" here is a week (or a month)
            you're spending later.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Badge kind={tone}>
              {verdict} · {score}%
            </Badge>
            {delta !== null && delta !== 0 ? (
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11.5px] font-semibold tabular-nums ${
                  delta > 0
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-rose-200 bg-rose-50 text-rose-700"
                }`}
                title={
                  baseline
                    ? `Baseline ${baseline.score}% captured ${new Date(
                        baseline.capturedAt,
                      ).toLocaleString()}`
                    : ""
                }
              >
                {delta > 0 ? "▲" : "▼"} {delta > 0 ? "+" : ""}
                {delta} since baseline
              </span>
            ) : null}
            <span className="muted text-[12.5px]">
              Duration target: {durationLabel(answers.durationTarget)}
            </span>
            <button
              type="button"
              onClick={onResetBaseline}
              className="text-[11px] text-med-sub underline-offset-2 hover:underline"
              title="Reset baseline to current score"
            >
              reset baseline
            </button>
            {onJump ? (
              <button className="btn-secondary ml-auto" onClick={() => onJump("overview")}>
                View project overview
              </button>
            ) : null}
          </div>
        </div>
        <ScoreRing score={score} />
      </div>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <div className="relative h-[140px] w-[140px] shrink-0">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} stroke="#e5e9f1" strokeWidth="10" fill="none" />
        <circle
          cx="60"
          cy="60"
          r={r}
          stroke="url(#g1)"
          strokeWidth="10"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0e7490" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-display text-[28px] font-semibold text-med-ink leading-none">
          {score}
          <span className="text-[14px] text-med-sub">%</span>
        </div>
        <div className="text-[10.5px] uppercase tracking-[0.14em] text-med-subtle mt-1">
          Readiness
        </div>
      </div>
    </div>
  );
}

function ReadinessSidebar({
  summary,
  answers,
}: {
  summary: ReturnType<typeof scoreLaunch>;
  answers: ResearchLaunchAnswers;
}) {
  const pillars: { key: keyof typeof summary.pillarScores; label: string }[] = [
    { key: "team", label: "Team" },
    { key: "authorship", label: "Authorship" },
    { key: "prereqs", label: "IRB / Data / Instrument" },
    { key: "budget", label: "Budget" },
    { key: "methodology", label: "Methodology" },
    { key: "journalAndTimeline", label: "Journal & tools" },
  ];

  return (
    <aside className="grid gap-4 lg:sticky lg:top-4">
      <div className="card-elevated">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-teal-50 text-teal-700">
              <IconShield size={16} />
            </span>
            <div>
              <div className="eyebrow">Readiness scorecard</div>
              <div className="section-title text-[14px]">By pillar</div>
            </div>
          </div>
        </div>
        <div className="p-4 grid gap-3">
          {pillars.map((p) => {
            const v = summary.pillarScores[p.key];
            const tone =
              v >= 75 ? "bg-emerald-500" : v >= 45 ? "bg-amber-400" : "bg-slate-300";
            return (
              <div key={p.key}>
                <div className="flex items-center justify-between text-[12px] mb-1">
                  <span className="text-med-ink font-medium">{p.label}</span>
                  <span className="text-med-sub tabular-nums">{v}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full ${tone}`} style={{ width: `${v}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <FactorCard
        title="Accelerators"
        kind="good"
        Icon={IconBolt}
        items={summary.acceleratingFactors}
        empty="Mark items above to see what's speeding things up."
      />
      <FactorCard
        title="Decelerators"
        kind="warn"
        Icon={IconFlag}
        items={summary.deceleratingFactors}
        empty="No drag detected — fill the checklist to refine."
      />
      {summary.blockers.length ? (
        <FactorCard
          title="Blockers"
          kind="bad"
          Icon={IconShield}
          items={summary.blockers}
          empty=""
        />
      ) : null}
      {answers.deadlineDate ? (
        <DeadlineHint date={answers.deadlineDate} />
      ) : null}
    </aside>
  );
}

function FactorCard({
  title,
  kind,
  Icon,
  items,
  empty,
}: {
  title: string;
  kind: "good" | "warn" | "bad";
  Icon: React.ComponentType<{ size?: number }>;
  items: string[];
  empty: string;
}) {
  const ringTone =
    kind === "good"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200/60"
      : kind === "warn"
      ? "bg-amber-50 text-amber-700 ring-amber-200/60"
      : "bg-rose-50 text-rose-700 ring-rose-200/60";
  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center justify-center h-8 w-8 rounded-lg ring-1 ${ringTone}`}>
            <Icon size={15} />
          </span>
          <div className="section-title text-[14px]">{title}</div>
        </div>
        <Badge kind={kind === "bad" ? "bad" : kind}>{items.length}</Badge>
      </div>
      <div className="p-4">
        {items.length ? (
          <ul className="space-y-2 text-[12.5px] text-med-inkSoft leading-relaxed">
            {items.map((it, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-current opacity-50" />
                <span>{it}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="muted text-[12.5px]">{empty}</div>
        )}
      </div>
    </div>
  );
}

function DeadlineHint({ date }: { date: string }) {
  const today = new Date();
  const target = new Date(date);
  const diffDays = Math.ceil(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  const tone = diffDays < 14 ? "bad" : diffDays < 60 ? "warn" : "info";
  const text =
    diffDays < 0
      ? `Deadline passed ${Math.abs(diffDays)} day(s) ago`
      : diffDays === 0
      ? "Deadline is today"
      : `${diffDays} day(s) until deadline`;
  return (
    <div className="card">
      <div className="p-4">
        <div className="eyebrow mb-1">Deadline</div>
        <div className="flex items-center gap-2">
          <Badge kind={tone}>{text}</Badge>
          <span className="muted text-[12px]">{target.toDateString()}</span>
        </div>
      </div>
    </div>
  );
}

function DurationRecommender({
  summary,
  answers,
}: {
  summary: ReturnType<typeof scoreLaunch>;
  answers: ResearchLaunchAnswers;
}) {
  if (!answers.durationTarget) {
    return (
      <div className="muted text-[12.5px] mt-2">
        Pick a duration above to see realistic design suggestions.
      </div>
    );
  }
  return (
    <div className="mt-4 rounded-xl border border-med-line bg-slate-50/60 p-4">
      <div className="eyebrow mb-1">Recommended designs</div>
      <p className="text-[13px] text-med-inkSoft leading-relaxed mb-2">
        {summary.recommendationRationale}
      </p>
      <ul className="grid sm:grid-cols-2 gap-1.5 text-[13px] text-med-ink">
        {summary.recommendedDesigns.map((d) => (
          <li key={d} className="flex gap-2">
            <IconCheck size={14} className="mt-1 text-emerald-600 shrink-0" />
            <span>{d}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SectionCard({
  step,
  title,
  desc,
  tone,
  children,
}: {
  step: string;
  title: string;
  desc: string;
  tone: "teal" | "blue" | "indigo" | "sky" | "amber" | "violet";
  children: React.ReactNode;
}) {
  const t: Record<typeof tone, string> = {
    teal: "bg-teal-50 text-teal-700 ring-teal-200/60",
    blue: "bg-sky-50 text-sky-700 ring-sky-200/60",
    indigo: "bg-indigo-50 text-indigo-700 ring-indigo-200/60",
    sky: "bg-cyan-50 text-cyan-700 ring-cyan-200/60",
    amber: "bg-amber-50 text-amber-700 ring-amber-200/60",
    violet: "bg-violet-50 text-violet-700 ring-violet-200/60",
  };
  return (
    <div className="card-elevated">
      <div className="card-header">
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center justify-center h-9 w-9 rounded-xl ring-1 font-semibold text-[12px] tabular-nums ${t[tone]}`}
          >
            {step}
          </span>
          <div>
            <div className="section-title text-[15px]">{title}</div>
            <p className="muted text-[12.5px] leading-relaxed mt-0.5 max-w-2xl">
              {desc}
            </p>
          </div>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[12px] font-medium text-med-sub mb-1">{label}</div>
      {children}
    </div>
  );
}

function YnmRow<T extends string>({
  label,
  value,
  onChange,
  extra,
  extraLabel,
}: {
  label: string;
  value?: T;
  onChange: (v: T) => void;
  extra?: T;
  extraLabel?: string;
}) {
  const baseOpts = YNM as unknown as { value: T; label: string }[];
  const opts: { value: T; label: string }[] = extra
    ? [...baseOpts, { value: extra, label: extraLabel || String(extra) }]
    : baseOpts;
  return (
    <div>
      <div className="text-[13px] text-med-ink mb-1.5">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {opts.map((o) => {
          const active = value === o.value;
          return (
            <button
              key={String(o.value)}
              type="button"
              onClick={() => onChange(o.value)}
              className={`px-3 py-1.5 rounded-lg text-[12.5px] font-medium border transition ${
                active
                  ? "bg-med-ink text-white border-med-ink"
                  : "bg-white border-med-line text-med-inkSoft hover:border-med-lineStrong hover:bg-slate-50"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CheckRow({
  label,
  checked,
  onChange,
  compact,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  compact?: boolean;
}) {
  return (
    <label
      className={`flex items-start gap-2.5 cursor-pointer ${
        compact ? "text-[12.5px]" : "text-[13px]"
      } text-med-ink`}
    >
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 rounded border-med-line text-med-brand focus:ring-med-brand/30"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="leading-snug">{label}</span>
    </label>
  );
}
