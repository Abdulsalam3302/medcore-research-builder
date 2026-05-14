"use client";

import type { ProjectState } from "@/lib/types";
import { Card, CardBody, CardHeader } from "./ui/Card";
import { Badge } from "./ui/Badge";

export function Overview({
  project,
  onJump,
}: {
  project: ProjectState;
  onJump: (k:
    | "type"
    | "title"
    | "introduction"
    | "methods"
    | "results"
    | "discussion"
    | "conclusion"
    | "references"
    | "report"
    | "export") => void;
}) {
  const cards: Array<{
    title: string;
    desc: string;
    target: Parameters<typeof onJump>[0];
    status: "good" | "warn" | "neutral";
    statusLabel: string;
  }> = [
    {
      title: "1. Research type",
      desc: "Pick the design family and we'll recommend the right reporting guideline.",
      target: "type",
      status: project.researchTypeResult ? "good" : "warn",
      statusLabel: project.researchTypeResult
        ? `Primary: ${project.researchTypeResult.primaryGuidelineName}`
        : "Not selected",
    },
    {
      title: "2. Title Lab",
      desc: "Generate, refine, and run an evidence-based novelty/similarity scan.",
      target: "title",
      status:
        project.titleFinal || project.titleInputs.draftTitle ? "good" : "warn",
      statusLabel:
        project.titleFinal ||
        project.titleInputs.draftTitle ||
        "No title yet",
    },
    {
      title: "3. Manuscript sections",
      desc: "Introduction → Methods → Results → Discussion → Conclusion. Checklist-driven, no fabrication.",
      target: "introduction",
      status:
        Object.values(project.sections).filter((s) => s.length > 60).length >=
        3
          ? "good"
          : "warn",
      statusLabel: `${Object.values(project.sections).filter((s) => s.length > 60).length}/5 drafted`,
    },
    {
      title: "4. Reference Verifier",
      desc: "Parse, look up in PubMed & Crossref, and produce a verification table.",
      target: "references",
      status: project.references.verifications.length > 0 ? "good" : "warn",
      statusLabel: project.references.verifications.length
        ? `${project.references.verifications.length} references`
        : "No references yet",
    },
    {
      title: "5. Compliance Report",
      desc: "Final checklist coverage, novelty risk, reference summary, recommendations.",
      target: "report",
      status: "neutral",
      statusLabel: "Run anytime",
    },
    {
      title: "6. Export",
      desc: "Export project JSON, manuscript Markdown, compliance MD, references CSV.",
      target: "export",
      status: "neutral",
      statusLabel: "Available",
    },
  ];

  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader
          title="MedCore Research Builder"
          subtitle="A reporting-guideline-aware workspace for building the core of a medical research manuscript."
        />
        <CardBody>
          <p className="text-sm text-med-sub leading-relaxed">
            MedCore refines your draft against EQUATOR-Network reporting
            guidelines (CONSORT, STROBE, PRISMA, STARD, TRIPOD, CARE, SPIRIT,
            ARRIVE, SQUIRE, CHEERS, SRQR/COREQ, AGREE/RIGHT and more), runs
            evidence-based novelty checks, and verifies references against
            PubMed, Crossref and OpenAlex. We never invent studies, PMIDs,
            DOIs, results, statistics, or claims. Missing information is{" "}
            <em>flagged</em>, not filled in.
          </p>
        </CardBody>
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <button
            key={c.title}
            onClick={() => onJump(c.target)}
            className="card hover:shadow-md transition text-left"
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="section-title">{c.title}</div>
                <Badge kind={c.status}>{c.statusLabel}</Badge>
              </div>
              <div className="muted">{c.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
