"use client";

import { useMemo } from "react";
import type { ProjectState } from "@/lib/types";
import { Badge } from "./ui/Badge";
import { InfoHint } from "./ui/InfoHint";

function repeatedPhraseWarnings(text: string) {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const windows: Record<string, number> = {};
  for (let i = 0; i < words.length - 7; i += 1) {
    const phrase = words.slice(i, i + 8).join(" ");
    windows[phrase] = (windows[phrase] || 0) + 1;
  }
  return Object.entries(windows)
    .filter(([, count]) => count > 1)
    .slice(0, 4)
    .map(([phrase, count]) => `"${phrase.slice(0, 62)}..." repeated ${count} times`);
}

export function OriginalityCitationGuard({ project }: { project: ProjectState }) {
  const manuscript = [
    project.sections.introduction,
    project.sections.methods,
    project.sections.results,
    project.sections.discussion,
    project.sections.conclusion,
  ].join("\n\n");

  const warnings = useMemo(() => {
    const out: string[] = [];
    const repeated = repeatedPhraseWarnings(manuscript);
    if (repeated.length) out.push(...repeated);
    if (!project.references.verifications.length) out.push("No verified references added yet.");
    if (!/AI-assisted tools were used/i.test(manuscript)) {
      out.push("AI-use disclosure statement not detected in current draft.");
    }
    if ((manuscript.match(/"/g) || []).length > 10) {
      out.push("High number of quoted segments detected; verify paraphrasing by synthesis.");
    }
    return out;
  }, [manuscript, project.references.verifications.length]);

  return (
    <section className="card-elevated">
      <div className="card-header">
        <div>
          <div className="eyebrow">Originality & Citation Guard</div>
          <h2 className="section-title text-[16px] inline-flex items-center gap-1.5">
            Human-review mode for originality and integrity
            <InfoHint
              title="Why originality and citation matter"
              text="Originality means your contribution is genuinely new and your words are your own; citation integrity means every borrowed claim is attributed to its source. Getting these wrong — reusing your own earlier text (self-plagiarism), copying phrasing, or stating findings without a reference — is treated as a research-integrity breach and can lead to rejection or retraction. These checks are heuristic aids to prompt your own review, not a clearance certificate."
            />
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <InfoHint
            side="left"
            title="What the warning count means"
            text="This counts heuristic flags raised in your current draft — repeated phrasing, a missing AI-use statement, heavy quotation, or no verified references. They are pattern hints, not proof of a problem and not proof of its absence. 'No major warning' simply means these particular patterns weren't triggered; you must still run your institutional/journal originality tools."
          />
          <Badge kind={warnings.length ? "warn" : "good"}>
            {warnings.length ? `${warnings.length} warning(s)` : "No major warning"}
          </Badge>
        </div>
      </div>
      <div className="p-5 grid gap-3">
        <div className="text-sm text-med-sub">
          Originality-optimized output supports synthesis and citation integrity, but you must verify with your institutional/journal tools before submission.
        </div>

        <div className="border border-med-line rounded-lg p-3 bg-slate-50">
          <div className="text-xs font-semibold uppercase tracking-wide text-med-sub mb-1 inline-flex items-center gap-1.5">
            Default safeguards
            <InfoHint
              title="What the safeguards mean"
              text="These are the non-negotiable integrity rules: never cite a source that doesn't exist, make every literature claim traceable to a real reference, avoid predatory or unvetted sources, keep direct quotes minimal and clearly marked, and remember that you — the human author — are accountable for the final manuscript. The tool supports these habits but cannot enforce or vouch for them."
            />
          </div>
          <ul className="list-disc list-inside text-sm text-med-inkSoft space-y-1">
            <li>No fabricated citations.</li>
            <li>Literature claims should be traceable to sources.</li>
            <li>Predatory-source citations should be avoided.</li>
            <li>Quoted text should be minimal and clearly marked.</li>
            <li>Human authors remain fully responsible for final scientific integrity.</li>
          </ul>
        </div>

        <div className="border border-med-line rounded-lg p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-med-sub mb-1 inline-flex items-center gap-1.5">
            AI-use disclosure template
            <InfoHint
              title="Why disclose AI use"
              text="ICMJE and most journals now require authors to state any AI assistance and to take full responsibility for the content. AI cannot be an author. Adapt this template to describe exactly how tools were used (e.g. language editing) — transparent disclosure protects your integrity; an undisclosed-but-discovered use can sink a submission."
            />
          </div>
          <p className="text-sm text-med-inkSoft">
            AI-assisted tools were used for language editing and drafting support. The authors reviewed and edited all content and take full responsibility for the accuracy, integrity, and originality of the manuscript.
          </p>
        </div>

        {warnings.length > 0 && (
          <div className="border border-amber-200 bg-amber-50 rounded-lg p-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-amber-800 mb-1 inline-flex items-center gap-1.5">
              Heuristic warnings (review required)
              <InfoHint
                title="How to use these flags"
                text="Each item is a pattern worth a second look — e.g. a phrase repeated verbatim may signal copy-paste or self-overlap, and a missing disclosure or many quotes may need attention. They are prompts for human judgement, not accusations or verdicts. Investigate each, then confirm with your journal's plagiarism and originality checks."
              />
            </div>
            <ul className="list-disc list-inside text-sm text-amber-900 space-y-1">
              {warnings.map((w, i) => (
                <li key={`${w}-${i}`}>{w}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
