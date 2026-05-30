"use client";

import { useState } from "react";
import type { ProjectState } from "@/lib/types";
import { Card, CardBody, CardHeader } from "./ui/Card";
import { complianceToMarkdown, projectToMarkdown, referencesToCSV } from "@/lib/export";
import { complianceToDocxBlob, downloadBlob, projectToDocxBlob } from "@/lib/docx";
import { downloadAsFile } from "@/lib/store";
import { InfoHint } from "./ui/InfoHint";

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

  const [busy, setBusy] = useState<string | null>(null);

  async function exportDocx() {
    setBusy("docx");
    try {
      const blob = await projectToDocxBlob(project);
      downloadBlob(`${titleSlug}.docx`, blob);
    } finally {
      setBusy(null);
    }
  }
  async function exportComplianceDocx() {
    setBusy("compliance-docx");
    try {
      const blob = await complianceToDocxBlob(project);
      downloadBlob(`${titleSlug}.compliance.docx`, blob);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader
          title={
            <InfoHint
              title="Pick the right format"
              text="Each format serves a different purpose: DOCX is what most journals want for submission; Markdown and CSV are portable plain-text for git, pandoc, or spreadsheets; Project JSON is a complete snapshot for backup or moving your work to another device. Everything is generated in your browser — nothing is uploaded unless you choose to share it."
              side="right"
            >
              Export Center
            </InfoHint>
          }
          subtitle="Download your manuscript and verification artifacts as Word (DOCX). Nothing leaves your browser unless you export it."
        />
        <CardBody className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          <ExportBtn
            title="Manuscript (DOCX)"
            desc="Word file with title, sections, appendices, references, and reporting-guideline compliance table."
            primary
            onClick={exportDocx}
            disabled={busy !== null}
            badge={busy === "docx" ? "Working…" : "Recommended"}
          />
          <ExportBtn
            title="Compliance report (DOCX)"
            desc="Checklist coverage with missing-information notes by section."
            onClick={exportComplianceDocx}
            disabled={busy !== null}
            badge={busy === "compliance-docx" ? "Working…" : undefined}
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
          <ExportBtn
            title="Project JSON"
            desc="Full project state — for backup, sharing, or import elsewhere."
            onClick={() => downloadAsFile(`${titleSlug}.project.json`, JSON.stringify(project, null, 2), "application/json")}
          />
          <ImportBtn onImport={onImport} />
          <ExportBtn
            title="Manuscript Markdown (raw)"
            desc="Plain markdown version — useful for git or pandoc post-processing."
            onClick={() =>
              downloadAsFile(`${titleSlug}.md`, projectToMarkdown(project), "text/markdown")
            }
          />
          <ExportBtn
            title="Compliance Markdown (raw)"
            desc="Compliance checklist as plain markdown."
            onClick={() =>
              downloadAsFile(`${titleSlug}.compliance.md`, complianceToMarkdown(project), "text/markdown")
            }
          />
          <ExportBtn
            title="Reset project"
            desc="Wipe all local drafts. This cannot be undone."
            danger
            onClick={() => {
              if (confirm("Reset the project? Local drafts will be lost.")) onReset();
            }}
          />
          <div className="md:col-span-2 lg:col-span-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-med-sub">
            <InfoHint
              title="Back up before big changes"
              text="Project JSON captures your entire project state. Export it before resetting, importing, or merging — it's the only way to transfer your work to another device or recover it later. Import replaces the current draft entirely, so save a copy first."
              side="top"
            >
              <span className="font-medium text-med-ink">Backup &amp; transfer</span>
            </InfoHint>
            <InfoHint
              title="Reset is destructive"
              text="Reset permanently wipes all local drafts in this browser and cannot be undone. There's no server copy — if you might need this work again, export the Project JSON first."
              side="top"
            >
              <span className="font-medium text-rose-700">Reset is permanent</span>
            </InfoHint>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title={
            <InfoHint
              title="Submission-ready, with provenance"
              text="The DOCX bundles your manuscript together with the reporting-guideline checklist and reference verification details, so a reviewer can trace every claim. Use it as a strong starting draft — confirm formatting against your target journal's author instructions before you submit."
              side="right"
            >
              What&apos;s in the export?
            </InfoHint>
          }
        />
        <CardBody className="text-sm text-med-sub grid gap-2">
          <ol className="list-decimal list-inside space-y-1">
            <li>Selected research type and reporting guideline.</li>
            <li>Title, candidate titles, novelty / similarity report with evidence.</li>
            <li>Refined section text and checklist coverage with confidence.</li>
            <li>References with trusted-source lookup, detected issues, and suggested Vancouver formatting.</li>
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
  primary,
  badge,
}: {
  title: string;
  desc: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  primary?: boolean;
  badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`text-left rounded-lg border p-4 transition ${
        danger
          ? "border-rose-200 bg-rose-50 hover:bg-rose-100"
          : primary
          ? "border-med-brand bg-sky-50 hover:bg-sky-100"
          : "border-med-line bg-white hover:bg-slate-50"
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={`font-medium ${danger ? "text-rose-700" : "text-med-ink"}`}>
          {title}
        </div>
        {badge && (
          <span className="text-[10px] uppercase tracking-wide font-semibold bg-med-brand text-white px-1.5 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </div>
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
