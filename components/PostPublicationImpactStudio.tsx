"use client";

import { useMemo, useState } from "react";
import type { ProjectState } from "@/lib/types";
import { InfoHint } from "./ui/InfoHint";

type ImpactTab = "social" | "lay" | "poster" | "conference" | "media";

export function PostPublicationImpactStudio({ project }: { project: ProjectState }) {
  const [tab, setTab] = useState<ImpactTab>("social");
  const title = project.titleFinal || project.titleInputs.draftTitle || "[Insert manuscript title]";
  const keyFinding = project.sections.conclusion.slice(0, 180) || "[Insert key finding in one sentence]";

  const socialDrafts = useMemo(
    () => ({
      linkedin: `New publication update: "${title}".\n\nKey finding: ${keyFinding}\n\nThis work supports evidence-informed decisions in clinical research and practice.\n\nDOI: [insert DOI]\n#MedicalResearch #EvidenceBased`,
      x: `New paper: "${title}"\nKey finding: ${keyFinding}\nDOI: [insert DOI]\n(If preprint, mark as not peer-reviewed.)`,
      whatsapp: `Research update: "${title}" is now [accepted/published]. Key finding: ${keyFinding}. DOI/link: [insert].`,
    }),
    [keyFinding, title],
  );

  return (
    <section className="card-elevated">
      <div className="card-header">
        <div>
          <div className="eyebrow">Post-Publication Impact</div>
          <h2 className="section-title text-[16px] inline-flex items-center gap-1.5">
            Visibility and outreach studio
            <InfoHint
              title="Why dissemination matters"
              text="A paper only changes practice if people find it. Sharing your work widens its reach — more visibility tends to lead to more citations and faster real-world uptake. Keep outreach accurate: state findings exactly as your data support them, flag preprints as not peer-reviewed, and never overstate effects or imply clinical recommendations the study can't back."
            />
          </h2>
        </div>
      </div>
      <div className="p-5 grid gap-3">
        <div className="flex gap-1 flex-wrap">
          {(
            [
              ["social", "Social Media Sharing Studio"],
              ["lay", "Plain Language Summary"],
              ["poster", "A4 Poster Generator"],
              ["conference", "Conference Toolkit"],
              ["media", "Marketing / Visibility Toolkit"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              className={`pill-tab ${tab === id ? "pill-tab-active" : ""}`}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
          <InfoHint
            className="self-center"
            title="These are editable starting points"
            text="Each tab gives templates pre-filled from your title and conclusion — social posts, plain-language and clinician summaries, posters, conference materials, and media kits. They're scaffolds, not finished copy: edit every placeholder, insert the real DOI, and check the wording matches your results before posting."
          />
        </div>

        {tab === "social" && (
          <div className="grid md:grid-cols-2 gap-3 text-sm">
            <TemplateCard title="LinkedIn academic post" body={socialDrafts.linkedin} />
            <TemplateCard title="X / Thread starter" body={socialDrafts.x} />
            <TemplateCard title="WhatsApp / short announcement" body={socialDrafts.whatsapp} />
            <TemplateCard
              title="Co-author sharing kit"
              body={"- DOI/link placeholder\n- 1-2 key findings\n- Optional image/visual abstract\n- Suggested 1-3 hashtags\n- Journal + institution tags"}
            />
          </div>
        )}
        {tab === "lay" && (
          <div className="grid gap-2">
            <TemplateCard title="100-word lay summary" body={`This study examined ${title}. Main finding: ${keyFinding}. It suggests [insert practical meaning].`} />
            <TemplateCard title="250-word policy/public summary" body={"Explain problem, what was done, what was found, why it matters, and what should happen next."} />
            <TemplateCard title="Clinician summary" body={"Highlight patient relevance, effect size, limits, and implementation cautions."} />
          </div>
        )}
        {tab === "poster" && (
          <TemplateCard
            title="A4 poster scaffold"
            body={[
              "Title",
              "Authors & affiliations",
              "Background and objective",
              "Methods",
              "Key results",
              "Take-home message",
              "QR code placeholder and contact",
              "Funding / COI",
            ].join("\n")}
          />
        )}
        {tab === "conference" && (
          <div className="grid md:grid-cols-2 gap-3">
            <TemplateCard title="Conference abstract" body={"Objective, methods, results, conclusion (structured)."} />
            <TemplateCard title="5-minute talk script" body={"Opening (30s), background, methods, 3 key findings, implications, limitations, close."} />
            <TemplateCard title="10-slide deck outline" body={"Title, background, question, methods, results 1, results 2, interpretation, limitations, implications, Q&A."} />
            <TemplateCard title="Q&A prep" body={"Prepare responses for methodology, bias, sample size, and generalizability concerns."} />
          </div>
        )}
        {tab === "media" && (
          <div className="grid md:grid-cols-2 gap-3">
            <TemplateCard title="Press release draft" body={"Headline, what changed, key finding, relevance, quote placeholders, contact."} />
            <TemplateCard title="Visual abstract prompt" body={"Create a visual abstract summarizing background, methods, key result, and implication with cautious wording."} />
            <TemplateCard title="Profile update checklist" body={"Update ORCID, Google Scholar, ResearchGate, institutional profile, and CV."} />
            <TemplateCard title="Impact timeline" body={"What to share now, after publication, and after conference presentations."} />
          </div>
        )}
      </div>
    </section>
  );
}

function TemplateCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="border border-med-line rounded-lg p-3 bg-white">
      <div className="font-medium text-sm text-med-ink mb-2">{title}</div>
      <pre className="text-xs text-med-sub whitespace-pre-wrap font-sans">{body}</pre>
    </div>
  );
}
