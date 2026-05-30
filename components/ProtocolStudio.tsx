"use client";

import { useMemo, useState } from "react";
import type { ProjectState } from "@/lib/types";
import {
  buildProtocolSkeleton,
  detectDesignFamily,
  type ProtocolDraftResult,
} from "@/lib/protocol/generator";
import { downloadAsFile } from "@/lib/store";
import { CopyButton } from "./ui/CopyButton";
import { Badge } from "./ui/Badge";

function slugify(s: string): string {
  return (s || "protocol").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60) || "protocol";
}

function draftToMarkdown(d: ProtocolDraftResult): string {
  const lines: string[] = [];
  lines.push(`# ${d.title || "Study Protocol / Proposal (AI Draft)"}`);
  lines.push("");
  lines.push(`**Design family:** ${d.designFamily || "—"}`);
  lines.push(`**Guideline:** ${d.guideline || "—"}`);
  lines.push("");
  lines.push(
    `> DRAFT generated with AI — requires human methodological and ethics review before use. Resolve all \`[needs author input: ...]\` placeholders.`,
  );
  lines.push("");
  for (const s of d.sections || []) {
    lines.push(`## ${s.heading}`);
    lines.push("");
    lines.push(s.markdown || "");
    lines.push("");
  }
  if (d.placeholders?.length) {
    lines.push(`## Unresolved placeholders`);
    lines.push("");
    lines.push(...d.placeholders.map((p) => `- ${p}`));
    lines.push("");
  }
  if (d.humanReviewRequired?.length) {
    lines.push(`## Requires human review`);
    lines.push("");
    lines.push(...d.humanReviewRequired.map((p) => `- ${p}`));
    lines.push("");
  }
  if (d.warnings?.length) {
    lines.push(`## Warnings`);
    lines.push("");
    lines.push(...d.warnings.map((p) => `- ${p}`));
    lines.push("");
  }
  return lines.join("\n");
}

export function ProtocolStudio({ project }: { project: ProjectState }) {
  const profile = useMemo(() => detectDesignFamily(project), [project]);
  const [notes, setNotes] = useState("");
  const [content, setContent] = useState("");
  const [source, setSource] = useState<"" | "offline" | "ai">("");
  const [busy, setBusy] = useState<"" | "offline" | "ai">("");
  const [error, setError] = useState("");

  function generateOffline() {
    setError("");
    setBusy("offline");
    try {
      const md = buildProtocolSkeleton(project);
      setContent(md);
      setSource("offline");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate skeleton.");
    } finally {
      setBusy("");
    }
  }

  async function draftWithAI() {
    setError("");
    setBusy("ai");
    try {
      const res = await fetch("/api/llm/protocol-draft", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ project, contextNotes: notes }),
      });
      const data = (await res.json()) as ProtocolDraftResult & { error?: string };
      if (!res.ok) {
        throw new Error(data?.error || "AI drafting failed. You can use the offline skeleton instead.");
      }
      setContent(draftToMarkdown(data));
      setSource("ai");
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI drafting failed.");
    } finally {
      setBusy("");
    }
  }

  const filename = `${slugify(project.titleFinal || project.titleInputs?.draftTitle || "study")}-protocol.md`;
  const isBusy = busy !== "";

  return (
    <div className="card-elevated">
      <div className="card-header">
        <div>
          <div className="eyebrow">Protocol & proposal generator</div>
          <h3 className="section-title text-[15px]">Develop a study-design-aware protocol</h3>
        </div>
        <Badge kind="info">{profile.guideline}</Badge>
      </div>

      <div className="p-5 grid gap-3">
        <div className="text-sm text-med-sub">
          Generate a structured protocol/proposal tailored to your design ({profile.label}). The
          offline skeleton works with no API key. AI drafting expands it into prose.
        </div>
        <div className="text-xs text-med-sub border border-med-line rounded-lg p-3 bg-slate-50">
          {profile.guidance}
        </div>

        <label className="text-xs font-semibold text-med-ink" htmlFor="protocol-notes">
          Additional context for AI drafting (optional)
        </label>
        <textarea
          id="protocol-notes"
          className="input min-h-[80px]"
          placeholder="Add any context the model should use (e.g., specific aims, known constraints). Never paste identifiable patient data."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-primary text-sm"
            onClick={generateOffline}
            disabled={isBusy}
          >
            {busy === "offline" ? "Generating…" : "Generate skeleton (offline)"}
          </button>
          <button
            type="button"
            className="btn-secondary text-sm"
            onClick={draftWithAI}
            disabled={isBusy}
          >
            {busy === "ai" ? "Drafting with AI…" : "Draft with AI"}
          </button>
        </div>

        {error && (
          <div role="alert" className="border border-rose-200 bg-rose-50 text-rose-800 rounded-lg p-3 text-sm">
            {error}
          </div>
        )}

        {content && (
          <div className="grid gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge kind={source === "ai" ? "info" : "neutral"}>
                {source === "ai" ? "AI draft" : "Offline skeleton"}
              </Badge>
              <span className="text-xs text-med-sub">
                Draft only — requires human methodological & ethics review.
              </span>
              <div className="ml-auto flex gap-2">
                <CopyButton text={content} label="Copy" />
                <button
                  type="button"
                  className="btn-secondary text-sm"
                  onClick={() => downloadAsFile(filename, content, "text/markdown")}
                >
                  Download .md
                </button>
              </div>
            </div>
            <pre className="border border-med-line rounded-lg p-3 bg-slate-50 text-xs text-med-ink whitespace-pre-wrap overflow-x-auto max-h-[480px]">
              {content}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
