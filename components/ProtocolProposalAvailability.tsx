"use client";

import { useMemo, useState } from "react";
import type { ProjectState } from "@/lib/types";
import type { ProtocolReadinessItem, ProtocolStatus } from "@/lib/lifecycle";
import { Badge } from "./ui/Badge";

const STATUSES: Array<{ id: ProtocolStatus; label: string }> = [
  { id: "not-started", label: "Not started" },
  { id: "needed", label: "Needed" },
  { id: "draft-available", label: "Draft available" },
  { id: "uploaded", label: "Uploaded" },
  { id: "complete", label: "Complete" },
  { id: "needs-revision", label: "Needs revision" },
  { id: "not-applicable", label: "Not applicable" },
];

const DEFAULT_ITEMS: ProtocolReadinessItem[] = [
  { id: "protocol", label: "Research protocol", requiredByStudyTypes: ["all"], status: "needed", guidance: "Core blueprint of your study.", missingItems: [] },
  { id: "proposal", label: "Research proposal", requiredByStudyTypes: ["all"], status: "needed", guidance: "Proposal for supervisor/institution approval.", missingItems: [] },
  { id: "sap", label: "Statistical analysis plan", requiredByStudyTypes: ["interventional", "observational"], status: "needed", guidance: "Pre-specify outcomes, models, and subgroup plans.", missingItems: [] },
  { id: "crf", label: "Data collection sheet / CRF", requiredByStudyTypes: ["prospective"], status: "needed", guidance: "Standardize field-level data capture.", missingItems: [] },
  { id: "dictionary", label: "Data dictionary", requiredByStudyTypes: ["all"], status: "needed", guidance: "Define each variable, code, and unit.", missingItems: [] },
  { id: "ethics", label: "Ethics / IRB application", requiredByStudyTypes: ["human"], status: "needed", guidance: "Required for most human-subject studies.", missingItems: [] },
  { id: "consent", label: "Informed consent form", requiredByStudyTypes: ["human"], status: "needed", guidance: "Include if consent is applicable.", missingItems: [] },
  { id: "admin", label: "Administrative permissions", requiredByStudyTypes: ["institutional"], status: "needed", guidance: "Site-level permissions and approvals.", missingItems: [] },
  { id: "trial-reg", label: "Trial registration", requiredByStudyTypes: ["trial"], status: "needed", guidance: "ClinicalTrials.gov/ISRCTN/etc.", missingItems: [] },
  { id: "review-reg", label: "Systematic review registration", requiredByStudyTypes: ["systematic-review"], status: "needed", guidance: "PROSPERO/OSF registration details.", missingItems: [] },
  { id: "budget", label: "Budget and timeline", requiredByStudyTypes: ["all"], status: "needed", guidance: "Resources, milestones, and risk planning.", missingItems: [] },
  { id: "authors", label: "Authorship contribution plan", requiredByStudyTypes: ["all"], status: "needed", guidance: "Define contributor roles early using CRediT principles.", missingItems: [] },
  { id: "dmp", label: "Data management plan", requiredByStudyTypes: ["all"], status: "needed", guidance: "Storage, access control, and retention strategy.", missingItems: [] },
  { id: "dissemination", label: "Dissemination plan", requiredByStudyTypes: ["all"], status: "needed", guidance: "Journal, conference, and post-publication pathway.", missingItems: [] },
];

const DESIGN_GUIDANCE: Array<{ design: string; guidance: string }> = [
  { design: "Randomized / clinical trial", guidance: "Use SPIRIT + CONSORT, register trial, and prepare participant flow plan." },
  { design: "Systematic review / meta-analysis", guidance: "Use PRISMA-P, register protocol (PROSPERO/OSF), and prepare PRISMA flow fields." },
  { design: "Observational cohort/case-control/cross-sectional", guidance: "Use STROBE guidance and pre-specify confounding strategy." },
  { design: "Diagnostic accuracy", guidance: "Use STARD with clear index test and reference standard definitions." },
  { design: "Prediction / prognostic / ML", guidance: "Use TRIPOD (+AI extensions where relevant) and pre-plan validation." },
  { design: "Case report / case series", guidance: "Use CARE and ensure consent and timeline documentation." },
  { design: "Qualitative / mixed methods", guidance: "Use COREQ/SRQR and describe reflexivity + trustworthiness strategy." },
];

function badgeKind(status: ProtocolStatus): "good" | "warn" | "bad" | "neutral" | "info" {
  if (status === "complete") return "good";
  if (status === "needs-revision") return "bad";
  if (status === "uploaded" || status === "draft-available") return "info";
  if (status === "needed") return "warn";
  return "neutral";
}

export function ProtocolProposalAvailability({ project }: { project: ProjectState }) {
  const [items, setItems] = useState<ProtocolReadinessItem[]>(DEFAULT_ITEMS);
  const [selectedDesign, setSelectedDesign] = useState("");

  const score = useMemo(() => {
    const total = items.length;
    const complete = items.filter((i) => i.status === "complete").length;
    const partial = items.filter((i) => i.status === "uploaded" || i.status === "draft-available").length;
    return Math.round(((complete + partial * 0.5) / total) * 100);
  }, [items]);

  function setStatus(id: string, status: ProtocolStatus) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status } : it)));
  }

  const checklistSummary = useMemo(() => {
    const missingCritical = items
      .filter((i) => ["protocol", "proposal", "sap", "dictionary", "ethics"].includes(i.id))
      .filter((i) => i.status === "not-started" || i.status === "needed" || i.status === "needs-revision")
      .map((i) => i.label);
    return missingCritical;
  }, [items]);

  return (
    <div className="grid gap-5">
      <section className="card-elevated">
        <div className="card-header">
          <div>
            <div className="eyebrow">Protocol & Proposal Readiness</div>
            <h2 className="section-title text-[16px]">Document readiness ladder</h2>
          </div>
          <Badge kind={score >= 75 ? "good" : score >= 50 ? "info" : "warn"}>
            {score}% ready
          </Badge>
        </div>
        <div className="p-5 grid gap-3">
          <div className="text-sm text-med-sub">
            Track all protocol-critical documents before drafting. This reduces ethics, methods, and submission failures.
          </div>
          <div className="overflow-x-auto border border-med-line rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold text-med-ink">Document</th>
                  <th className="text-left px-3 py-2 font-semibold text-med-ink">Status</th>
                  <th className="text-left px-3 py-2 font-semibold text-med-ink">Guidance</th>
                  <th className="text-left px-3 py-2 font-semibold text-med-ink">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t border-med-line">
                    <td className="px-3 py-2 text-med-ink">{item.label}</td>
                    <td className="px-3 py-2">
                      <select
                        className="input text-xs min-w-[160px]"
                        value={item.status}
                        onChange={(e) => setStatus(item.id, e.target.value as ProtocolStatus)}
                      >
                        {STATUSES.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2 text-xs text-med-sub">{item.guidance}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1.5 flex-wrap">
                        <Badge kind={badgeKind(item.status)}>{item.status.replaceAll("-", " ")}</Badge>
                        <button className="btn-secondary text-xs">Upload</button>
                        <button className="btn-secondary text-xs">Generate skeleton</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {checklistSummary.length > 0 && (
            <div className="border border-amber-200 bg-amber-50 rounded-lg p-3">
              <div className="text-xs font-semibold text-amber-800 uppercase tracking-wide">
                Missing critical items
              </div>
              <ul className="list-disc list-inside text-sm text-amber-900 mt-1">
                {checklistSummary.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <h3 className="section-title text-[15px]">Study-design-aware protocol guidance</h3>
        </div>
        <div className="p-5 grid gap-3">
          <div className="flex flex-wrap gap-2">
            {DESIGN_GUIDANCE.map((d) => (
              <button
                key={d.design}
                onClick={() => setSelectedDesign(d.design)}
                className={`pill-tab ${selectedDesign === d.design ? "pill-tab-active" : ""}`}
              >
                {d.design}
              </button>
            ))}
          </div>
          <div className="text-sm text-med-inkSoft border border-med-line rounded-lg p-3 bg-slate-50">
            {selectedDesign
              ? DESIGN_GUIDANCE.find((d) => d.design === selectedDesign)?.guidance
              : "Select a design to view focused protocol guidance."}
          </div>
          <div className="text-xs text-med-sub">
            Project context (auto): {project.researchTypeAnswers.designId || "No design selected yet"}.
          </div>
        </div>
      </section>
    </div>
  );
}
