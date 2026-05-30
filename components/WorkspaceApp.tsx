"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { LifecycleNavigation, type LifecycleKey } from "@/components/LifecycleNavigation";
import { WorkspaceHeader } from "@/components/WorkspaceHeader";
import { ResearchLaunch } from "@/components/ResearchLaunch";
import { FounderContact } from "@/components/FounderContact";
import { useProject } from "@/components/useProject";
import { emptyProject, type ProjectState } from "@/lib/types";
import { downloadAsFile } from "@/lib/store";
import { fetchServerShare, tryParseShareToken, tryParseSharedHash } from "@/lib/share";
import { SkeletonLines } from "@/components/ui/Skeleton";
import { ProtocolProposalAvailability } from "@/components/ProtocolProposalAvailability";
import { LearningResourcePanel } from "@/components/LearningResourcePanel";
import { VideoSupplementSlot } from "@/components/VideoSupplementSlot";
import { TargetJournalIndexationPanel } from "@/components/TargetJournalIndexationPanel";
import { ResultsDataLab } from "@/components/ResultsDataLab";
import { QualityExcellenceGate } from "@/components/QualityExcellenceGate";
import { OriginalityCitationGuard } from "@/components/OriginalityCitationGuard";
import { PostPublicationImpactStudio } from "@/components/PostPublicationImpactStudio";
import { ResearchPhaseShell } from "@/components/ResearchPhaseShell";

const RouteSkeleton = () => (
  <div className="card-elevated p-6">
    <SkeletonLines rows={6} />
  </div>
);

const ResearchTypeWizard = dynamic(
  () => import("@/components/ResearchTypeWizard").then((m) => m.ResearchTypeWizard),
  { loading: RouteSkeleton, ssr: false },
);
const TitleLab = dynamic(() => import("@/components/TitleLab").then((m) => m.TitleLab), {
  loading: RouteSkeleton,
  ssr: false,
});
const SectionBuilder = dynamic(
  () => import("@/components/SectionBuilder").then((m) => m.SectionBuilder),
  { loading: RouteSkeleton, ssr: false },
);
const AppendixBuilder = dynamic(
  () => import("@/components/AppendixBuilder").then((m) => m.AppendixBuilder),
  { loading: RouteSkeleton, ssr: false },
);
const ReferenceVerifier = dynamic(
  () => import("@/components/ReferenceVerifier").then((m) => m.ReferenceVerifier),
  { loading: RouteSkeleton, ssr: false },
);
const QualitySuite = dynamic(
  () => import("@/components/QualitySuite").then((m) => m.QualitySuite),
  { loading: RouteSkeleton, ssr: false },
);
const ComplianceReport = dynamic(
  () => import("@/components/ComplianceReport").then((m) => m.ComplianceReport),
  { loading: RouteSkeleton, ssr: false },
);
const ExportCenter = dynamic(
  () => import("@/components/ExportCenter").then((m) => m.ExportCenter),
  { loading: RouteSkeleton, ssr: false },
);
const CoverLetter = dynamic(
  () => import("@/components/CoverLetter").then((m) => m.CoverLetter),
  { loading: RouteSkeleton, ssr: false },
);
const ProtocolStudio = dynamic(
  () => import("@/components/ProtocolStudio").then((m) => m.ProtocolStudio),
  { loading: RouteSkeleton, ssr: false },
);
const ManuscriptCoherence = dynamic(
  () => import("@/components/ManuscriptCoherence").then((m) => m.ManuscriptCoherence),
  { loading: RouteSkeleton, ssr: false },
);
const LanguageStudio = dynamic(
  () => import("@/components/LanguageStudio").then((m) => m.LanguageStudio),
  { loading: RouteSkeleton, ssr: false },
);
const JournalFinder = dynamic(
  () => import("@/components/JournalFinder").then((m) => m.JournalFinder),
  { loading: RouteSkeleton, ssr: false },
);
const ReferenceSafetyPanel = dynamic(
  () => import("@/components/ReferenceSafetyPanel").then((m) => m.ReferenceSafetyPanel),
  { loading: RouteSkeleton, ssr: false },
);
const StatsAndFigures = dynamic(
  () => import("@/components/StatsAndFigures").then((m) => m.StatsAndFigures),
  { loading: RouteSkeleton, ssr: false },
);
const ResearchSwarm = dynamic(
  () => import("@/components/ResearchSwarm").then((m) => m.ResearchSwarm),
  { loading: RouteSkeleton, ssr: false },
);
const ManuscriptScorecard = dynamic(
  () => import("@/components/ManuscriptScorecard").then((m) => m.ManuscriptScorecard),
  { loading: RouteSkeleton, ssr: false },
);
const ResearchSkills = dynamic(
  () => import("@/components/ResearchSkills").then((m) => m.ResearchSkills),
  { loading: RouteSkeleton, ssr: false },
);
const ResearchToolkit = dynamic(
  () => import("@/components/ResearchToolkit").then((m) => m.ResearchToolkit),
  { loading: RouteSkeleton, ssr: false },
);
const LiteratureSearch = dynamic(
  () => import("@/components/LiteratureSearch").then((m) => m.LiteratureSearch),
  { loading: RouteSkeleton, ssr: false },
);

export default function WorkspaceApp() {
  const { project, setProject, update, ready, autosave } = useProject();
  const [active, setActive] = useState<LifecycleKey>("launch");

  useEffect(() => {
    if (!ready) return;
    // Existing inline-fragment path (#shared=…): data already lives in the URL,
    // Collaboration reads it and offers a merge — just open the export view.
    const incoming = tryParseSharedHash();
    if (incoming) {
      setActive("export");
      if (typeof window !== "undefined") {
        history.replaceState(null, "", window.location.pathname);
      }
      return;
    }
    // Server-stored token path (?share=<token>): fetch the project, import it,
    // then clean the token out of the URL. Degrades silently if unavailable.
    const token = tryParseShareToken();
    if (token) {
      let cancelled = false;
      void (async () => {
        const remote = await fetchServerShare(token);
        if (cancelled) return;
        if (remote) {
          importProject(remote);
          setActive("export");
        }
        if (typeof window !== "undefined") {
          history.replaceState(null, "", window.location.pathname);
        }
      })();
      return () => {
        cancelled = true;
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  function exportProject() {
    const slug =
      (project.titleFinal || project.titleInputs.draftTitle || "manuscript")
        .replace(/\s+/g, "-")
        .replace(/[^\w\-]+/g, "")
        .slice(0, 60)
        .toLowerCase() || "manuscript";
    downloadAsFile(`${slug}.project.json`, JSON.stringify(project, null, 2), "application/json");
  }

  function resetProject() {
    setProject(emptyProject());
    setActive("launch");
  }

  function importProject(p: ProjectState) {
    setProject({ ...emptyProject(), ...p });
    setActive("launch");
  }

  return (
    <div className="min-h-screen flex bg-med-bg">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-elevated focus:ring-2 focus:ring-med-brand"
      >
        Skip to content
      </a>
      <LifecycleNavigation active={active} onSelect={setActive} project={project} />
      <div className="flex-1 min-w-0 flex flex-col">
        <WorkspaceHeader
          project={project}
          onExport={exportProject}
          onReset={resetProject}
          onImport={importProject}
          autosave={autosave}
        />
        <MobileTabs active={active} onSelect={setActive} />
        <main id="main-content" className="p-4 md:p-6 lg:p-8 flex-1 max-w-[1400px] w-full mx-auto">
          {!ready ? (
            <div className="muted">Loading…</div>
          ) : active === "launch" ? (
            <ResearchPhaseShell
              phaseLabel="Pre-Research Workspace"
              title="Research Launch"
              subtitle="Move from idea to feasible, protocol-ready research."
            >
              <ResearchLaunch project={project} update={update} onJump={(k) => setActive(k as LifecycleKey)} />
              <ProtocolProposalAvailability project={project} />
              <LearningResourcePanel
                sectionId="launch"
                quickExplanation="Capture your study question, design intent, timeline, and feasibility assumptions."
                whyItMatters="A strong launch avoids expensive redesign later in Methods and Submission."
                commonMistake="Drafting manuscript sections before clarifying outcomes and ethical pathway."
                example="PICO-framed objective + feasibility score + action checklist."
              />
              <VideoSupplementSlot sectionId="launch" />
            </ResearchPhaseShell>
          ) : active === "protocol" ? (
            <ResearchPhaseShell
              phaseLabel="Pre-Research Workspace"
              title="Protocol / Proposal Studio"
              subtitle="Generate a study-design-aware protocol or proposal — develop it here, not just upload it."
            >
              <ProtocolStudio project={project} />
              <ProtocolProposalAvailability project={project} />
            </ResearchPhaseShell>
          ) : active === "type" ? (
            <ResearchPhaseShell
              phaseLabel="Pre-Research Workspace"
              title="Study Design Selector"
              subtitle="Select design, align guideline requirements, and configure context."
            >
              <ResearchTypeWizard project={project} update={update} />
            </ResearchPhaseShell>
          ) : active === "title" ? (
            <ResearchPhaseShell
              phaseLabel="Pre-Research Workspace"
              title="Literature & Gap Explorer"
              subtitle="Develop title and novelty positioning with trusted evidence support."
            >
              <TitleLab project={project} update={update} />
            </ResearchPhaseShell>
          ) : active === "literature" ? (
            <ResearchPhaseShell
              phaseLabel="Pre-Research Workspace"
              title="Literature Search (live)"
              subtitle="Search real peer-reviewed papers and preprints via Europe PMC, then add any to your references in one click."
            >
              <LiteratureSearch project={project} update={update} />
            </ResearchPhaseShell>
          ) : active === "methods" ? (
            <ResearchPhaseShell
              phaseLabel="Intra-Research Manuscript"
              title="Methods"
              subtitle="Create transparent, guideline-aligned methods reporting."
            >
              <SectionBuilder section="methods" project={project} update={update} />
            </ResearchPhaseShell>
          ) : active === "introduction" ? (
            <ResearchPhaseShell
              phaseLabel="Intra-Research Manuscript"
              title="Introduction"
              subtitle="Frame burden, gap, rationale, and objective clearly."
            >
              <SectionBuilder section="introduction" project={project} update={update} />
            </ResearchPhaseShell>
          ) : active === "results" ? (
            <ResearchPhaseShell
              phaseLabel="Intra-Research Manuscript"
              title="Analysis & Results Lab"
              subtitle="Transform uploaded data and analysis context into results-ready output."
            >
              <ResultsDataLab project={project} update={update} />
              <StatsAndFigures
                designId={project.researchTypeAnswers?.designId}
                manuscriptType={project.researchTypeAnswers?.manuscriptType}
                expandedNotes={project.researchTypeAnswers?.expandedNotes}
              />
              <SectionBuilder section="results" project={project} update={update} />
              <VideoSupplementSlot sectionId="intra-results-lab" />
            </ResearchPhaseShell>
          ) : active === "discussion" ? (
            <ResearchPhaseShell
              phaseLabel="Intra-Research Manuscript"
              title="Discussion"
              subtitle="Build cautious, clinically meaningful interpretation without overclaiming."
            >
              <SectionBuilder section="discussion" project={project} update={update} />
            </ResearchPhaseShell>
          ) : active === "conclusion" ? (
            <ResearchPhaseShell
              phaseLabel="Intra-Research Manuscript"
              title="Conclusion"
              subtitle="Summarize findings with cautious, evidence-aligned language."
            >
              <SectionBuilder section="conclusion" project={project} update={update} />
            </ResearchPhaseShell>
          ) : active === "appendix" ? (
            <ResearchPhaseShell
              phaseLabel="Intra-Research Manuscript"
              title="Appendices & Supplementary Files"
              subtitle="Manage supplementary content and structured appendices."
            >
              <AppendixBuilder project={project} update={update} />
            </ResearchPhaseShell>
          ) : active === "references" ? (
            <ResearchPhaseShell
              phaseLabel="Post-Research Submission"
              title="Citation Verification"
              subtitle="Check citation metadata quality and source integrity before submission."
            >
              <ReferenceVerifier project={project} update={update} />
              <ReferenceSafetyPanel project={project} />
            </ResearchPhaseShell>
          ) : active === "coherence" ? (
            <ResearchPhaseShell
              phaseLabel="Post-Research Submission"
              title="Manuscript Coherence"
              subtitle="One connected manuscript: checks title, sections, results, discussion, and citation order for conflicts."
            >
              <ManuscriptCoherence project={project} />
            </ResearchPhaseShell>
          ) : active === "language" ? (
            <ResearchPhaseShell
              phaseLabel="Post-Research Submission"
              title="Language Studio"
              subtitle="Academic language editing, readability, and writing-integrity advisories — meaning preserved, every number intact."
            >
              <LanguageStudio project={project} />
            </ResearchPhaseShell>
          ) : active === "journal-finder" ? (
            <ResearchPhaseShell
              phaseLabel="Post-Research Submission"
              title="Journal Finder"
              subtitle="Find and compare target journals (WoS SCIE/ESCI, Scopus, PubMed/MEDLINE, DOAJ, Saudi) with submission formatting."
            >
              <JournalFinder project={project} />
            </ResearchPhaseShell>
          ) : active === "submission" ? (
            <ResearchPhaseShell
              phaseLabel="Post-Research Submission"
              title="Submission & Quality"
              subtitle="Simple final lane: journal fit, quality gate, originality check, and submission report."
            >
              <TargetJournalIndexationPanel />
              <CoverLetter project={project} />
              <QualityExcellenceGate project={project} />
              <QualitySuite project={project} />
              <OriginalityCitationGuard project={project} />
              <ComplianceReport project={project} onJump={(k) => setActive(k as LifecycleKey)} />
            </ResearchPhaseShell>
          ) : active === "swarm" ? (
            <ResearchPhaseShell
              phaseLabel="Quality & Empowerment"
              title="AI Peer-Review Swarm"
              subtitle="A swarm of specialist agents (methodologist, statistician, reviewer, editor, integrity officer…) reviews your manuscript across layers of quality and safety."
            >
              <ResearchSwarm project={project} />
            </ResearchPhaseShell>
          ) : active === "scorecard" ? (
            <ResearchPhaseShell
              phaseLabel="Quality & Empowerment"
              title="Manuscript Scorecard"
              subtitle="Objective, repeatable multi-dimension evaluation. Re-run after edits to prove the draft is getting better."
            >
              <ManuscriptScorecard project={project} />
            </ResearchPhaseShell>
          ) : active === "skills" ? (
            <ResearchPhaseShell
              phaseLabel="Quality & Empowerment"
              title="Research Skills & Methods"
              subtitle="A focused skills library and best-practice tips to empower every part of your research."
            >
              <ResearchSkills />
            </ResearchPhaseShell>
          ) : active === "toolkit" ? (
            <ResearchPhaseShell
              phaseLabel="Quality & Empowerment"
              title="Tools & MCP Directory"
              subtitle="Curated open-source projects and MCP servers that empower medical and academic research — each with a verify link."
            >
              <ResearchToolkit />
            </ResearchPhaseShell>
          ) : active === "impact-studio" ? (
            <ResearchPhaseShell
              phaseLabel="Post-Publication Impact"
              title="Post-Publication Impact Studio"
              subtitle="Create social, conference, and outreach assets responsibly."
            >
              <PostPublicationImpactStudio project={project} />
            </ResearchPhaseShell>
          ) : active === "export" ? (
            <ResearchPhaseShell
              phaseLabel="Post-Publication Impact"
              title="Export Center"
              subtitle="Export project assets for submission, collaboration, and outreach."
            >
              <ExportCenter project={project} onImport={importProject} onReset={resetProject} />
            </ResearchPhaseShell>
          ) : null}
        </main>
        <FounderContact />
        <footer className="px-5 md:px-6 py-4 text-[11.5px] text-med-sub border-t border-med-line bg-white">
          <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <p className="leading-relaxed">
              MedCore supports research writing and reporting-guideline
              compliance. It does not replace expert scientific, statistical,
              ethical, or journal review.
            </p>
            <p className="text-med-subtle whitespace-nowrap">
              Drafts stored in your browser · API calls processed server-side
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

function MobileTabs({
  active,
  onSelect,
}: {
  active: LifecycleKey;
  onSelect: (k: LifecycleKey) => void;
}) {
  const items: { key: LifecycleKey; label: string }[] = [
    { key: "launch", label: "Launch" },
    { key: "protocol", label: "Protocol" },
    { key: "type", label: "Design" },
    { key: "title", label: "Gap" },
    { key: "literature", label: "Lit search" },
    { key: "introduction", label: "Intro" },
    { key: "methods", label: "Methods" },
    { key: "results", label: "Results" },
    { key: "discussion", label: "Discussion" },
    { key: "conclusion", label: "Conclusion" },
    { key: "references", label: "Refs" },
    { key: "appendix", label: "Appendix" },
    { key: "coherence", label: "Coherence" },
    { key: "language", label: "Language" },
    { key: "journal-finder", label: "Journals" },
    { key: "submission", label: "Submit" },
    { key: "swarm", label: "Swarm" },
    { key: "scorecard", label: "Score" },
    { key: "skills", label: "Skills" },
    { key: "toolkit", label: "Tools" },
    { key: "impact-studio", label: "Impact" },
    { key: "export", label: "Export" },
  ];
  return (
    <nav
      aria-label="Section navigation"
      className="md:hidden border-b border-med-line bg-white/85 backdrop-blur px-2 py-2 overflow-x-auto sticky top-[57px] z-10"
    >
      <div className="flex gap-1 min-w-max">
        {items.map((it) => (
          <button
            key={it.key}
            type="button"
            onClick={() => onSelect(it.key)}
            aria-current={active === it.key ? "page" : undefined}
            className={`pill-tab whitespace-nowrap ${
              active === it.key ? "pill-tab-active" : ""
            }`}
          >
            {it.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
