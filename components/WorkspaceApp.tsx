"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { LifecycleNavigation, type LifecycleKey } from "@/components/LifecycleNavigation";
import { WorkspaceHeader } from "@/components/WorkspaceHeader";
import { Overview } from "@/components/Overview";
import { ResearchLaunch } from "@/components/ResearchLaunch";
import { FounderContact } from "@/components/FounderContact";
import { useProject } from "@/components/useProject";
import { emptyProject, type ProjectState } from "@/lib/types";
import { downloadAsFile } from "@/lib/store";
import { tryParseSharedHash } from "@/lib/share";
import { projectStudyContext } from "@/lib/projectContext";
import { SkeletonLines } from "@/components/ui/Skeleton";
import { ProtocolProposalAvailability } from "@/components/ProtocolProposalAvailability";
import { LearningResourcePanel } from "@/components/LearningResourcePanel";
import { VideoSupplementSlot } from "@/components/VideoSupplementSlot";
import { TargetJournalIndexationPanel } from "@/components/TargetJournalIndexationPanel";
import { ManuscriptChecklistEngine } from "@/components/ManuscriptChecklistEngine";
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
const StatsAndFigures = dynamic(
  () => import("@/components/StatsAndFigures").then((m) => m.StatsAndFigures),
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
const FlowDiagramBuilder = dynamic(
  () => import("@/components/FlowDiagramBuilder").then((m) => m.FlowDiagramBuilder),
  { loading: RouteSkeleton, ssr: false },
);

export default function WorkspaceApp() {
  const { project, setProject, update, ready, autosave } = useProject();
  const [active, setActive] = useState<LifecycleKey>("launch");

  useEffect(() => {
    if (!ready) return;
    const incoming = tryParseSharedHash();
    if (incoming) {
      setActive("export");
      if (typeof window !== "undefined") {
        history.replaceState(null, "", window.location.pathname);
      }
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
    setActive("overview");
  }

  function importProject(p: ProjectState) {
    setProject({ ...emptyProject(), ...p });
    setActive("overview");
  }

  const study = projectStudyContext(project);

  return (
    <div className="min-h-screen flex bg-med-bg">
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
        <main className="p-4 md:p-6 lg:p-8 flex-1 max-w-[1400px] w-full mx-auto">
          {!ready ? (
            <div className="muted">Loading…</div>
          ) : active === "launch" ? (
            <ResearchPhaseShell
              phaseLabel="Pre-Research Workspace"
              title="Research Launch"
              subtitle="Move from idea to feasible, protocol-ready research."
            >
              <ResearchLaunch project={project} update={update} onJump={(k) => setActive(k as LifecycleKey)} />
              <LearningResourcePanel
                sectionId="launch"
                quickExplanation="Capture your study question, design intent, timeline, and feasibility assumptions."
                whyItMatters="A strong launch avoids expensive redesign later in Methods and Submission."
                commonMistake="Drafting manuscript sections before clarifying outcomes and ethical pathway."
                example="PICO-framed objective + feasibility score + action checklist."
              />
              <VideoSupplementSlot sectionId="launch" />
            </ResearchPhaseShell>
          ) : active === "pre-protocol" ? (
            <ResearchPhaseShell
              phaseLabel="Pre-Research Workspace"
              title="Protocol & Proposal Availability"
              subtitle="Track critical documents, identify gaps, and prepare skeletons."
            >
              <ProtocolProposalAvailability project={project} />
              <LearningResourcePanel
                sectionId="pre-protocol"
                quickExplanation="Use the readiness ladder to track protocol, proposal, SAP, ethics, and dissemination files."
                whyItMatters="Complete protocol packs reduce revision loops and improve compliance confidence."
                commonMistake="Assuming draft text is enough without supporting operational documents."
                example="Protocol status board + missing critical items + design-aware guidance."
              />
              <VideoSupplementSlot sectionId="pre-protocol" />
            </ResearchPhaseShell>
          ) : active === "pre-resources" ? (
            <ResearchPhaseShell
              phaseLabel="Pre-Research Workspace"
              title="Resources & Learning Hub"
              subtitle="Templates and educational aids to build strong research foundations."
            >
              <LearningResourcePanel
                sectionId="launch"
                quickExplanation="Use these worksheets to structure your question, design, and feasibility pathway."
                whyItMatters="Strong setup improves quality across every downstream phase."
                commonMistake="Skipping documentation and trying to reconstruct decisions later."
                example="Idea worksheet + PICO/PECO worksheet + protocol template."
              />
              <VideoSupplementSlot sectionId="launch" />
            </ResearchPhaseShell>
          ) : active === "overview" ? (
            <ResearchPhaseShell
              phaseLabel="Intra-Research Manuscript"
              title="Manuscript Workspace"
              subtitle="Write, refine, and verify your manuscript with guided support."
            >
              <Overview project={project} onJump={(k) => setActive(k as LifecycleKey)} />
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
          ) : active === "methods" ? (
            <ResearchPhaseShell
              phaseLabel="Intra-Research Manuscript"
              title="Methods Builder"
              subtitle="Create transparent, guideline-aligned methods reporting."
            >
              <SectionBuilder section="methods" project={project} update={update} />
            </ResearchPhaseShell>
          ) : active === "introduction" ? (
            <ResearchPhaseShell
              phaseLabel="Intra-Research Manuscript"
              title="Introduction Builder"
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
              <SectionBuilder section="results" project={project} update={update} />
              <VideoSupplementSlot sectionId="intra-results-lab" />
            </ResearchPhaseShell>
          ) : active === "discussion" ? (
            <ResearchPhaseShell
              phaseLabel="Intra-Research Manuscript"
              title="Interpretation Assistant"
              subtitle="Build cautious, clinically meaningful interpretation without overclaiming."
            >
              <SectionBuilder section="discussion" project={project} update={update} />
              <SectionBuilder section="conclusion" project={project} update={update} />
            </ResearchPhaseShell>
          ) : active === "conclusion" ? (
            <ResearchPhaseShell
              phaseLabel="Intra-Research Manuscript"
              title="Conclusion Builder"
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
            </ResearchPhaseShell>
          ) : active === "stats" ? (
            <ResearchPhaseShell
              phaseLabel="Intra-Research Manuscript"
              title="Tables & Figures"
              subtitle="Generate figure specifications and test recommendations."
            >
              <StatsAndFigures
                designId={study.designId}
                manuscriptType={study.manuscriptType}
                expandedNotes={study.expandedNotes}
              />
            </ResearchPhaseShell>
          ) : active === "flow" ? (
            <ResearchPhaseShell
              phaseLabel="Intra-Research Manuscript"
              title="Flow Diagram Generator"
              subtitle="Create and export study flow diagrams for Methods transparency."
            >
              <FlowDiagramBuilder defaultAcronym={study.guidelineAcronym} />
            </ResearchPhaseShell>
          ) : active === "intra-checklist" ? (
            <ResearchPhaseShell
              phaseLabel="Intra-Research Manuscript"
              title="Manuscript Checklist Engine"
              subtitle="Map guideline requirements to manuscript sections item-by-item."
            >
              <ManuscriptChecklistEngine project={project} />
            </ResearchPhaseShell>
          ) : active === "intra-resources" ? (
            <ResearchPhaseShell
              phaseLabel="Intra-Research Manuscript"
              title="Resources & Learning Hub"
              subtitle="Examples, templates, and learning aids for manuscript development."
            >
              <LearningResourcePanel
                sectionId="intra-manuscript"
                quickExplanation="Use this hub to improve methods, results, and interpretation quality."
                whyItMatters="Strong manuscript structure improves reviewer confidence and reduces revisions."
                commonMistake="Treating checklist items as optional rather than core reporting requirements."
                example="Methods checklist + data dictionary + reporting templates."
              />
              <VideoSupplementSlot sectionId="intra-results-lab" />
            </ResearchPhaseShell>
          ) : active === "post-journals" ? (
            <ResearchPhaseShell
              phaseLabel="Post-Research Submission"
              title="Target Journals & Indexation"
              subtitle="Compare fit and verify indexing status from official sources."
            >
              <TargetJournalIndexationPanel />
            </ResearchPhaseShell>
          ) : active === "coverLetter" ? (
            <ResearchPhaseShell
              phaseLabel="Post-Research Submission"
              title="Submission Package Builder"
              subtitle="Prepare cover letter, declarations, and submission-ready package files."
            >
              <CoverLetter project={project} />
              <AppendixBuilder project={project} update={update} />
            </ResearchPhaseShell>
          ) : active === "quality" ? (
            <ResearchPhaseShell
              phaseLabel="Post-Research Submission"
              title="Quality & Excellence Gate"
              subtitle="Final readiness checks before journal submission."
            >
              <QualityExcellenceGate project={project} />
              <QualitySuite project={project} />
            </ResearchPhaseShell>
          ) : active === "post-originality" ? (
            <ResearchPhaseShell
              phaseLabel="Post-Research Submission"
              title="Originality / Citation / AI-use Disclosure Check"
              subtitle="Validate originality safeguards and disclosure readiness."
            >
              <OriginalityCitationGuard project={project} />
            </ResearchPhaseShell>
          ) : active === "report" ? (
            <ResearchPhaseShell
              phaseLabel="Post-Research Submission"
              title="Submission Readiness Report"
              subtitle="Consolidated compliance and quality summary for final review."
            >
              <ComplianceReport project={project} onJump={(k) => setActive(k as LifecycleKey)} />
            </ResearchPhaseShell>
          ) : active === "post-resources" ? (
            <ResearchPhaseShell
              phaseLabel="Post-Research Submission"
              title="Resources & Learning Hub"
              subtitle="Submission checklists, declarations, and journal prep resources."
            >
              <LearningResourcePanel
                sectionId="post-quality"
                quickExplanation="Use this hub to complete submission essentials before uploading files."
                whyItMatters="Most rejections at first pass come from fit and compliance issues."
                commonMistake="Submitting without fully aligned declarations and reporting checklists."
                example="Journal-ready package checklist and declaration templates."
              />
              <VideoSupplementSlot sectionId="post-journals" />
            </ResearchPhaseShell>
          ) : active === "impact-studio" ? (
            <ResearchPhaseShell
              phaseLabel="Post-Publication Impact"
              title="Post-Publication Impact Studio"
              subtitle="Create social, conference, and outreach assets responsibly."
            >
              <PostPublicationImpactStudio project={project} />
            </ResearchPhaseShell>
          ) : active === "impact-resources" ? (
            <ResearchPhaseShell
              phaseLabel="Post-Publication Impact"
              title="Resources & Learning Hub"
              subtitle="Promotion playbooks, examples, and post-publication timelines."
            >
              <LearningResourcePanel
                sectionId="impact-studio"
                quickExplanation="Build practical outreach assets for audiences beyond your specialty."
                whyItMatters="Visibility and translation increase citation uptake and practical impact."
                commonMistake="Overstating findings or omitting publication status context."
                example="Platform-specific posts + lay summary + conference toolkit."
              />
              <VideoSupplementSlot sectionId="impact-studio" />
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
    { key: "pre-protocol", label: "Protocol" },
    { key: "type", label: "Design" },
    { key: "title", label: "Gap" },
    { key: "overview", label: "Manuscript" },
    { key: "methods", label: "Methods" },
    { key: "results", label: "Results" },
    { key: "flow", label: "Flow" },
    { key: "stats", label: "Figures" },
    { key: "intra-checklist", label: "Checklist" },
    { key: "post-journals", label: "Journals" },
    { key: "references", label: "Refs" },
    { key: "quality", label: "Quality" },
    { key: "post-originality", label: "Originality" },
    { key: "impact-studio", label: "Impact" },
    { key: "export", label: "Export" },
  ];
  return (
    <div className="md:hidden border-b border-med-line bg-white/85 backdrop-blur px-2 py-2 overflow-x-auto sticky top-[57px] z-10">
      <div className="flex gap-1 min-w-max">
        {items.map((it) => (
          <button
            key={it.key}
            onClick={() => onSelect(it.key)}
            className={`pill-tab whitespace-nowrap ${
              active === it.key ? "pill-tab-active" : ""
            }`}
          >
            {it.label}
          </button>
        ))}
      </div>
    </div>
  );
}
