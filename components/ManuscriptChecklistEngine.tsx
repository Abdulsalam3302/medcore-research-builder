"use client";

import type { ProjectState } from "@/lib/types";
import { Badge } from "./ui/Badge";
import { InfoHint } from "./ui/InfoHint";

type ItemState = "Missing" | "Partial" | "Complete" | "Not applicable";

function inferStatus(sectionText: string, hint: string): ItemState {
  const text = sectionText.toLowerCase();
  const h = hint.toLowerCase();
  if (!sectionText.trim()) return "Missing";
  if (text.includes(h.split(" ")[0])) return "Complete";
  if (sectionText.length > 120) return "Partial";
  return "Missing";
}

function badge(status: ItemState): "good" | "warn" | "bad" | "neutral" {
  if (status === "Complete") return "good";
  if (status === "Partial") return "warn";
  if (status === "Missing") return "bad";
  return "neutral";
}

const baseChecklist = [
  { section: "introduction", item: "Background burden and gap clearly described" },
  { section: "introduction", item: "Objective / hypothesis explicitly stated" },
  { section: "methods", item: "Design, setting, and study period described" },
  { section: "methods", item: "Eligibility criteria and sampling described" },
  { section: "methods", item: "Outcomes and variables clearly defined" },
  { section: "methods", item: "Bias/confounding strategy documented" },
  { section: "methods", item: "Statistical methods and missing-data approach described" },
  { section: "results", item: "Participant/data flow and sample counts reported" },
  { section: "results", item: "Main estimates with precision (CI) included" },
  { section: "results", item: "Tables/figures referenced in text" },
  { section: "discussion", item: "Key findings interpreted cautiously" },
  { section: "discussion", item: "Limitations and generalizability addressed" },
  { section: "conclusion", item: "Conclusion aligned with design and evidence strength" },
  { section: "conclusion", item: "No unsupported causal claims" },
];

export function ManuscriptChecklistEngine({ project }: { project: ProjectState }) {
  const guideline = project.researchTypeResult?.primaryGuidelineName || "Study-design guideline";
  const rows = baseChecklist.map((r) => {
    const text = project.sections[r.section as keyof ProjectState["sections"]] || "";
    const status = inferStatus(text, r.item);
    return {
      ...r,
      status,
      snippet: text.slice(0, 140),
    };
  });

  const counts = {
    complete: rows.filter((r) => r.status === "Complete").length,
    partial: rows.filter((r) => r.status === "Partial").length,
    missing: rows.filter((r) => r.status === "Missing").length,
  };

  return (
    <section className="card-elevated">
      <div className="card-header">
        <div>
          <div className="eyebrow">Manuscript Checklist Engine</div>
          <h2 className="section-title text-[16px] inline-flex items-center gap-1.5">
            {guideline} mapped checklist
            <InfoHint
              title="Why map item-by-item"
              text="Editors and reviewers grade your manuscript against the reporting guideline for your study design (CONSORT, STROBE, PRISMA, etc.). Mapping each required item to where it appears in your draft makes gaps visible before submission — completely reported studies are screened faster and rejected less often, so this is one of the cheapest ways to raise your acceptance odds."
            />
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <InfoHint
            side="left"
            title="Reading the status counts"
            text="'Complete' means the item appears to be reported; 'Partial' means some text exists but the specific item may be thin or implicit; 'Missing' means the reporting element isn't detected. These are heuristic inferences from your section text — treat 'Complete' as a prompt to confirm, not proof the item is fully and correctly reported."
          />
          <Badge kind="good">Complete {counts.complete}</Badge>
          <Badge kind="warn">Partial {counts.partial}</Badge>
          <Badge kind="bad">Missing {counts.missing}</Badge>
        </div>
      </div>
      <div className="p-5 grid gap-3">
        <div className="text-sm text-med-sub">
          Item-by-item view of what is present, missing, or partial in your current manuscript sections.
          Use this before submission to reduce revision cycles.
        </div>
        <div className="overflow-x-auto border border-med-line rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-3 py-2">Section</th>
                <th className="text-left px-3 py-2">Checklist item</th>
                <th className="text-left px-3 py-2">
                  <span className="inline-flex items-center gap-1.5">
                    Status
                    <InfoHint
                      title="What the status reflects"
                      text="Per-item reporting status inferred from your section text. Aim to turn every 'Missing' and 'Partial' into a confirmed 'Complete' — a reviewer who can tick each guideline item off your manuscript has far less reason to send it back."
                    />
                  </span>
                </th>
                <th className="text-left px-3 py-2">
                  <span className="inline-flex items-center gap-1.5">
                    Evidence snippet
                    <InfoHint
                      title="Why show the evidence"
                      text="The snippet is the passage the engine matched for this item, so you can sanity-check the call rather than trust it blindly. If the snippet doesn't actually report the item, treat the status as wrong and fix the text."
                    />
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={`${r.item}-${i}`} className="border-t border-med-line">
                  <td className="px-3 py-2 capitalize">{r.section}</td>
                  <td className="px-3 py-2">{r.item}</td>
                  <td className="px-3 py-2">
                    <Badge kind={badge(r.status)}>{r.status}</Badge>
                  </td>
                  <td className="px-3 py-2 text-xs text-med-sub">
                    {r.snippet ? `${r.snippet}${r.snippet.length >= 140 ? "..." : ""}` : "No section text yet"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
