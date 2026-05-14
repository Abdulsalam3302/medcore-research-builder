"use client";

import type { ProjectState } from "@/lib/types";
import { Card, CardBody, CardHeader } from "./ui/Card";
import { complianceToMarkdown, projectToMarkdown, referencesToCSV } from "@/lib/export";
import { downloadAsFile } from "@/lib/store";

export function ExportCenter({
  project,
  onImport,
  onReset,
}: {
  project: ProjectState;
  onImport: (p: ProjectState) => void;
  onReset: () => void;
}) {
  const titleSlug = (project.titleFinal || project.titleInputs.draftTitle || "manuscript")
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .slice(0, 60)
    .toLowerCase() || "manuscript";

  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader
          title="Export Center"
          subtitle="Download your manuscript and verification artifacts. Nothing leaves your browser unless you export it."
        />
        <CardBody className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          <ExportBtn
            title="Project JSON"
            desc="Full project state — for backup, sharing, or import elsewhere."
            onClick={() => downloadAsFile(`${titleSlug}.project.json`, JSON.stringify(project, null, 2), "application/json")}
          />
          <ExportBtn
            title="Manuscript Markdown"
            desc="Title, intro, methods, results, discussion, conclusion, references, compliance, novelty."
            onClick={() =>
              downloadAsFile(`${titleSlug}.md`, projectToMarkdown(project), "text/markdown")
            }
          />
          <ExportBtn
            title="Compliance report (.md)"
            desc="Checklist coverage with missing-information notes by section."
            onClick={() =>
              downloadAsFile(`${titleSlug}.compliance.md`, complianceToMarkdown(project), "text/markdown")
            }
          />
          <ExportBtn
            title="References CSV"
            desc="One row per reference with verification details. Open in Excel/Sheets."
            onClick={() =>
              downloadAsFile(
                `${titleSlug}.references.csv`,
                referencesToCSV(project.references.verifications),
                "text/csv"
              )
            }
            disabled={project.references.verifications.length === 0}
          />
          <ImportBtn onImport={onImport} />
          <ExportBtn
            title="Reset project"
            desc="Wipe all local drafts. This cannot be undone."
            danger
            onClick={() => {
              if (confirm("Reset the project? Local drafts will be lost.")) onReset();
            }}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="What's in the export?" />
        <CardBody className="text-sm text-med-sub grid gap-2">
          <ol className="list-decimal list-inside space-y-1">
            <li>Selected research type and reporting guideline.</li>
            <li>Title, candidate titles, novelty / similarity report with evidence.</li>
            <li>Refined section text and checklist coverage with confidence.</li>
            <li>References with PubMed/Crossref lookup, problems, suggested Vancouver formatting.</li>
            <li>Disclaimer footer.</li>
          </ol>
        </CardBody>
      </Card>
    </div>
  );
}

function ExportBtn({
  title,
  desc,
  onClick,
  disabled,
  danger,
}: {
  title: string;
  desc: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`text-left rounded-lg border p-4 transition ${
        danger
          ? "border-rose-200 bg-rose-50 hover:bg-rose-100"
          : "border-med-line bg-white hover:bg-slate-50"
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <div className={`font-medium ${danger ? "text-rose-700" : "text-med-ink"}`}>{title}</div>
      <div className="muted mt-1">{desc}</div>
    </button>
  );
}

function ImportBtn({ onImport }: { onImport: (p: ProjectState) => void }) {
  return (
    <label className="text-left rounded-lg border border-med-line bg-white hover:bg-slate-50 p-4 cursor-pointer">
      <div className="font-medium text-med-ink">Import project JSON</div>
      <div className="muted mt-1">Replace the current draft with an exported project JSON.</div>
      <input
        type="file"
        accept="application/json"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          try {
            const txt = await f.text();
            const parsed = JSON.parse(txt);
            onImport(parsed);
          } catch {
            alert("Invalid JSON file");
          }
          e.target.value = "";
        }}
      />
    </label>
  );
}
