"use client";

import { useState } from "react";
import { Sidebar, type ToolKey } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { Overview } from "@/components/Overview";
import { ResearchTypeWizard } from "@/components/ResearchTypeWizard";
import { TitleLab } from "@/components/TitleLab";
import { SectionBuilder } from "@/components/SectionBuilder";
import { AppendixBuilder } from "@/components/AppendixBuilder";
import { ReferenceVerifier } from "@/components/ReferenceVerifier";
import { StatsAndFigures } from "@/components/StatsAndFigures";
import { QualitySuite } from "@/components/QualitySuite";
import { ComplianceReport } from "@/components/ComplianceReport";
import { ExportCenter } from "@/components/ExportCenter";
import { useProject } from "@/components/useProject";
import { emptyProject } from "@/lib/types";
import { downloadAsFile } from "@/lib/store";

export default function Page() {
  const { project, setProject, update, ready } = useProject();
  const [active, setActive] = useState<ToolKey>("overview");

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

  function importProject(p: import("@/lib/types").ProjectState) {
    setProject({ ...emptyProject(), ...p });
    setActive("overview");
  }

  return (
    <div className="min-h-screen flex bg-med-bg">
      <Sidebar active={active} onSelect={setActive} project={project} />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar
          project={project}
          onExport={exportProject}
          onReset={resetProject}
          onImport={importProject}
        />
        <MobileTabs active={active} onSelect={setActive} />
        <main className="p-4 md:p-6 lg:p-8 flex-1 max-w-[1400px] w-full mx-auto">
          {!ready ? (
            <div className="muted">Loading…</div>
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
            <StatsAndFigures />
          ) : active === "quality" ? (
            <QualitySuite project={project} />
          ) : active === "report" ? (
            <ComplianceReport project={project} />
          ) : active === "export" ? (
            <ExportCenter project={project} onImport={importProject} onReset={resetProject} />
          ) : null}
        </main>
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
