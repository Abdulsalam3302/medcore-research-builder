"use client";

import { useMemo, useState } from "react";
import type { UploadedDataProfile } from "@/lib/lifecycle";
import { InfoHint } from "./ui/InfoHint";

const ALLOWED = ".csv,.tsv,.xlsx,.json,.png,.jpg,.jpeg,.webp,.pdf,.docx";

function inferType(value: string): UploadedDataProfile["variableTypes"][string] {
  const v = value.trim();
  if (!v) return "unknown";
  if (!Number.isNaN(Number(v))) return "numeric";
  if (!Number.isNaN(Date.parse(v))) return "date";
  if (v.length > 40) return "text";
  return "categorical";
}

export function FileResourceManager({
  onProfilesChange,
}: {
  onProfilesChange?: (profiles: UploadedDataProfile[]) => void;
}) {
  const [profiles, setProfiles] = useState<UploadedDataProfile[]>([]);

  const summary = useMemo(() => {
    const files = profiles.length;
    const cols = profiles.reduce((n, p) => n + p.columns.length, 0);
    const warnings = profiles.reduce((n, p) => n + p.warnings.length, 0);
    return { files, cols, warnings };
  }, [profiles]);

  async function onFilesSelected(files: FileList | null) {
    if (!files?.length) return;
    const next: UploadedDataProfile[] = [];

    for (const file of Array.from(files)) {
      const profile: UploadedDataProfile = {
        fileId: `${file.name}-${file.size}-${file.lastModified}`,
        name: file.name,
        columns: [],
        variableTypes: {},
        missingness: {},
        detectedRoles: {},
        warnings: [],
      };

      if (/\.(csv|tsv|json)$/i.test(file.name)) {
        let txt = "";
        try {
          txt = await file.text();
        } catch {
          profile.warnings.push("File stored, but text could not be read for preview.");
        }
        if (/\.json$/i.test(file.name)) {
          try {
            const parsed = JSON.parse(txt) as Array<Record<string, unknown>> | Record<string, unknown>;
            const row = Array.isArray(parsed) ? parsed[0] || {} : parsed;
            const columns = Object.keys(row);
            profile.columns = columns;
            for (const key of columns) {
              const val = String((row as Record<string, unknown>)[key] ?? "");
              profile.variableTypes[key] = inferType(val);
            }
            if (!columns.length) profile.warnings.push("No columns detected in JSON.");
          } catch {
            profile.warnings.push("JSON could not be parsed.");
          }
        } else {
          const sep = /\.tsv$/i.test(file.name) ? "\t" : ",";
          const [header, sample] = txt.split("\n").slice(0, 2);
          const cols = (header || "")
            .split(sep)
            .map((c) => c.trim())
            .filter(Boolean);
          profile.columns = cols;
          const sampleVals = (sample || "").split(sep);
          cols.forEach((c, idx) => {
            profile.variableTypes[c] = inferType(sampleVals[idx] || "");
          });
          if (!cols.length) profile.warnings.push("No tabular columns found in file header.");
        }
      } else {
        // xlsx / pdf / docx / images: store the file entry without crashing on
        // binary content — preview/column detection is simply unavailable.
        profile.warnings.push("Stored — column preview unavailable for this file type.");
      }

      if (profile.columns.some((c) => /patient|name|phone|email|mrn|dob|address/i.test(c))) {
        profile.warnings.push("Potential identifiable fields detected. Upload de-identified data only.");
      }
      next.push(profile);
    }

    setProfiles((prev) => {
      const merged = [...prev, ...next];
      onProfilesChange?.(merged);
      return merged;
    });
  }

  function removeFile(fileId: string) {
    setProfiles((prev) => {
      const merged = prev.filter((p) => p.fileId !== fileId);
      onProfilesChange?.(merged);
      return merged;
    });
  }

  return (
    <div className="card-elevated">
      <div className="card-header">
        <div>
          <div className="eyebrow">File resources</div>
          <h3 className="section-title text-[15px]">
            <InfoHint
              title="Upload de-identified data only"
              text="Files stay in your browser, but you are still responsible for what you load. Remove direct identifiers (names, MRNs, dates of birth, contact details, addresses) before uploading — share only data that cannot be traced to an individual. This tool reads column headers to help describe your dataset; it is not a substitute for proper de-identification."
              side="right"
            >
              Upload data, media, and supporting files
            </InfoHint>
          </h3>
        </div>
      </div>
      <div className="p-5 grid gap-3">
        <p className="text-sm text-med-sub">
          Supports CSV, TSV, XLSX, JSON, and common media files. Please upload de-identified data only.
        </p>
        <InfoHint
          title="Strip identifiers first"
          text="CSV/TSV/JSON files are parsed for a column preview; other types (XLSX, PDF, DOCX, images) are listed but not inspected. Either way, the file is your responsibility — remove personally identifiable information before uploading, because even a column header like 'patient_name' signals data that shouldn't be here."
          side="right"
        >
          <label className="btn-secondary cursor-pointer w-fit">
            Upload files
            <input
              type="file"
              className="hidden"
              multiple
              accept={ALLOWED}
              onChange={(e) => {
                void onFilesSelected(e.target.files);
                // Allow re-selecting the same file again.
                e.target.value = "";
              }}
            />
          </label>
        </InfoHint>
        <div className="text-xs text-med-sub inline-flex flex-wrap items-center gap-1">
          <span>
            Files: {summary.files} · Columns detected: {summary.cols} · Warnings: {summary.warnings}
          </span>
          <InfoHint
            title="What column inference does"
            text="For tabular files, MedCore reads the header row and a sample value per column to guess each variable's type — numeric, date, text, or categorical — and flags headers that look identifiable. It's a best-effort heuristic from one sample row, so treat the detected types and warnings as hints to check, not definitive classifications."
            side="top"
          />
        </div>
        <div className="grid gap-2">
          {profiles.map((p) => (
            <div key={p.fileId} className="border border-med-line rounded-lg p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="font-medium text-sm text-med-ink">{p.name}</div>
                <button
                  type="button"
                  className="btn-secondary text-xs leading-none px-2 py-1"
                  aria-label={`Remove ${p.name}`}
                  title="Remove file"
                  onClick={() => removeFile(p.fileId)}
                >
                  ×
                </button>
              </div>
              <div className="text-xs text-med-sub mt-1">
                {p.columns.length
                  ? `Columns: ${p.columns.join(", ")}`
                  : "Column detection unavailable for this file."}
              </div>
              {p.warnings.length > 0 && (
                <ul className="mt-2 list-disc list-inside text-xs text-amber-700 space-y-1">
                  {p.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
