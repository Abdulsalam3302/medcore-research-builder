"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Sidebar, type ToolKey } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { Overview } from "@/components/Overview";
import { ResearchLaunch } from "@/components/ResearchLaunch";
import { FounderContact } from "@/components/FounderContact";
import { useProject } from "@/components/useProject";
import { emptyProject, type ProjectState } from "@/lib/types";
import { downloadAsFile } from "@/lib/store";
import { tryParseSharedHash } from "@/lib/share";
import { projectStudyContext } from "@/lib/projectContext";
import { SkeletonLines } from "@/components/ui/Skeleton";

const RouteSkeleton = () => (
  <div className="card-elevated p-6">
    <SkeletonLines rows={6} />
  </div>
);

// Code-split per route. The first three (Launch / Overview / Sidebar) are eager
// because they're entry-point. Everything else loads on demand.
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
const VersionHistory = dynamic(
  () => import("@/components/VersionHistory").then((m) => m.VersionHistory),
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
const StatisticianCopilot = dynamic(
  () => import("@/components/StatisticianCopilot").then((m) => m.StatisticianCopilot),
  { loading: RouteSkeleton, ssr: false },
);
const ReviewerSimulator = dynamic(
  () => import("@/components/ReviewerSimulator").then((m) => m.ReviewerSimulator),
  { loading: RouteSkeleton, ssr: false },
);
const Collaboration = dynamic(
  () => import("@/components/Collaboration").then((m) => m.Collaboration),
  { loading: RouteSkeleton, ssr: false },
);

export default function Page() {
  const { project, setProject, update, ready, autosave } = useProject();
  const [active, setActive] = useState<ToolKey>("overview");

  // If a co-author shared a #shared=… link, prompt to merge on first load.
  useEffect(() => {
    if (!ready) return;
    const incoming = tryParseSharedHash();
    if (incoming) {
      setActive("collaboration");
      // strip the hash so refresh doesn't re-prompt
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
      <Sidebar active={active} onSelect={setActive} project={project} />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar
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
            <ResearchLaunch
              project={project}
              update={update}
              onJump={(k) => setActive(k as ToolKey)}
            />
          ) : active === "overview" ? (
            <Overview project={project} onJump={(k) => setActive(k as ToolKey)} />
          ) : active === "type" ? (
            <ResearchTypeWizard project={project} update={update} />
          ) : active === "title" ? (
            <TitleLab project={project} update={update} />
          ) : active === "introduction" ? (
            <SectionBuilder section="introduction" project={project} update={update} />
          ) : active === "methods" ? (
            <SectionBuilder section="methods" project={project} update={update} />
          ) : active === "results" ? (
            <SectionBuilder section="results" project={project} update={update} />
          ) : active === "discussion" ? (
            <SectionBuilder section="discussion" project={project} update={update} />
          ) : active === "conclusion" ? (
            <SectionBuilder section="conclusion" project={project} update={update} />
          ) : active === "appendix" ? (
            <AppendixBuilder project={project} update={update} />
          ) : active === "references" ? (
            <ReferenceVerifier project={project} update={update} />
          ) : active === "stats" ? (
            <StatsAndFigures
              designId={study.designId}
              manuscriptType={study.manuscriptType}
              expandedNotes={study.expandedNotes}
            />
          ) : active === "copilot" ? (
            <StatisticianCopilot designId={study.designId} expandedNotes={study.expandedNotes} />
          ) : active === "flow" ? (
            <FlowDiagramBuilder defaultAcronym={study.guidelineAcronym} />
          ) : active === "coverLetter" ? (
            <CoverLetter project={project} />
          ) : active === "reviewer" ? (
            <ReviewerSimulator project={project} />
          ) : active === "history" ? (
            <VersionHistory project={project} onRestore={(s) => setProject(s)} />
          ) : active === "collaboration" ? (
            <Collaboration project={project} onApplyMerged={(s) => setProject(s)} />
          ) : active === "quality" ? (
            <QualitySuite project={project} />
          ) : active === "report" ? (
            <ComplianceReport
              project={project}
              onJump={(k) => setActive(k as ToolKey)}
            />
          ) : active === "export" ? (
            <ExportCenter project={project} onImport={importProject} onReset={resetProject} />
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
  active: ToolKey;
  onSelect: (k: ToolKey) => void;
}) {
  const items: { key: ToolKey; label: string }[] = [
    { key: "launch", label: "Launch" },
    { key: "overview", label: "Overview" },
    { key: "type", label: "Type" },
    { key: "title", label: "Title" },
    { key: "introduction", label: "Intro" },
    { key: "methods", label: "Methods" },
    { key: "results", label: "Results" },
    { key: "discussion", label: "Discussion" },
    { key: "conclusion", label: "Conclusion" },
    { key: "appendix", label: "Appendix" },
    { key: "references", label: "Refs" },
    { key: "stats", label: "Stats" },
    { key: "copilot", label: "Stats copilot" },
    { key: "flow", label: "Flow diagram" },
    { key: "coverLetter", label: "Cover letter" },
    { key: "reviewer", label: "Reviewer" },
    { key: "history", label: "History" },
    { key: "collaboration", label: "Share" },
    { key: "quality", label: "Quality" },
    { key: "report", label: "Report" },
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
