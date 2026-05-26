"use client";

import { learningResources, type ResearchResource } from "@/lib/lifecycle";
import { Badge } from "./ui/Badge";

function tone(kind: ResearchResource["type"]): "good" | "info" | "warn" | "neutral" {
  if (kind === "template" || kind === "checklist") return "good";
  if (kind === "guide" || kind === "diagram") return "info";
  if (kind === "example") return "warn";
  return "neutral";
}

export function LearningResourcePanel({
  sectionId,
  quickExplanation,
  whyItMatters,
  commonMistake,
  example,
}: {
  sectionId: string;
  quickExplanation: string;
  whyItMatters: string;
  commonMistake: string;
  example: string;
}) {
  const resources = learningResources.filter((r) => r.sectionId === sectionId);

  return (
    <section className="card-elevated">
      <div className="card-header">
        <div>
          <div className="eyebrow">Learning Hub</div>
          <h3 className="section-title text-[15px]">Research knowledge & resources</h3>
        </div>
      </div>
      <div className="p-5 grid gap-4">
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <InfoBlock title="Quick explanation" body={quickExplanation} />
          <InfoBlock title="Why this matters" body={whyItMatters} />
          <InfoBlock title="Common mistake" body={commonMistake} />
          <InfoBlock title="Example" body={example} />
        </div>

        <div>
          <div className="text-[12px] font-semibold text-med-ink mb-2">Templates, guides, and checklists</div>
          {resources.length === 0 ? (
            <div className="text-sm text-med-sub border border-med-line rounded-lg p-3 bg-slate-50">
              Section-specific resources will appear here as they are added.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-2">
              {resources.map((r) => (
                <div key={r.id} className="border border-med-line rounded-lg p-3 bg-white">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium text-sm text-med-ink">{r.title}</div>
                    <Badge kind={tone(r.type)}>{r.type}</Badge>
                  </div>
                  <div className="text-xs text-med-sub mt-1">{r.description}</div>
                  <div className="text-[11px] text-med-subtle mt-2">
                    Level: {r.level}
                    {r.standards?.length ? ` · Standards: ${r.standards.join(", ")}` : ""}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function InfoBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="border border-med-line rounded-lg bg-white p-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-med-sub mb-1">{title}</div>
      <p className="text-sm text-med-inkSoft leading-relaxed">{body}</p>
    </div>
  );
}
