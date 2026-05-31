"use client";

import { useState } from "react";
import type { ProjectState } from "@/lib/types";
import { Card, CardBody, CardHeader } from "./ui/Card";
import { Spinner } from "./ui/Spinner";
import { Badge } from "./ui/Badge";
import { CopyButton } from "./ui/CopyButton";
import { SkeletonLines } from "./ui/Skeleton";
import { downloadAsFile } from "@/lib/store";
import { InfoHint } from "./ui/InfoHint";

export function CoverLetter({ project }: { project: ProjectState }) {
  const [busy, setBusy] = useState(false);
  const [letter, setLetter] = useState<string>("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [editor, setEditor] = useState("Dear Editor,");
  const [author, setAuthor] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [hint, setHint] = useState("");
  const [journalOverride, setJournalOverride] = useState("");

  async function generate() {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/llm/cover-letter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          project,
          recipientEditor: editor,
          authorName: author,
          authorAffiliation: affiliation,
          hint,
          journalNameOverride: journalOverride || undefined,
        }),
      });
      const data = (await r.json()) as {
        letter?: string;
        warnings?: string[];
        error?: string;
      };
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      setLetter(data.letter || "");
      setWarnings(data.warnings || []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-[360px_1fr] gap-5">
      <Card>
        <CardHeader
          title={
            <InfoHint
              title="Why a tailored cover letter?"
              text="The cover letter is the editor's first read. A letter written for this specific journal frames why your study matters and why it fits the journal's scope and readership — that framing influences whether it's sent out for review. Include the core finding and its significance, fit to the journal, and any required statements (originality, no concurrent submission). Avoid restating the whole abstract or overstating claims."
              side="right"
            >
              Cover letter inputs
            </InfoHint>
          }
        />
        <CardBody className="grid gap-3">
          <Field
            label={
              <InfoHint
                title="Address a real person"
                text="Where possible, address the handling editor by name rather than a generic 'Dear Editor'. It signals you've checked who handles your subject area and adds a small but real touch of fit."
                side="right"
              >
                Salutation
              </InfoHint>
            }
          >
            <input
              aria-label="Salutation"
              className="input text-sm"
              value={editor}
              onChange={(e) => setEditor(e.target.value)}
              placeholder="Dear Dr. Smith,"
            />
          </Field>
          <Field label="Corresponding author name">
            <input
              aria-label="Corresponding author name"
              className="input text-sm"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Your name"
            />
          </Field>
          <Field label="Affiliation">
            <input
              className="input text-sm"
              value={affiliation}
              onChange={(e) => setAffiliation(e.target.value)}
              placeholder="Department, Institution, City"
            />
          </Field>
          <Field
            label={
              <InfoHint
                title="Match the target journal"
                text="The letter should name the journal you're actually submitting to so the fit argument is concrete. By default this uses your Research Type → Journal mapping; override it here if you're targeting a different journal."
                side="right"
              >
                Override journal name (optional)
              </InfoHint>
            }
          >
            <input
              className="input text-sm"
              value={journalOverride}
              onChange={(e) => setJournalOverride(e.target.value)}
              placeholder="Will use Research Type → Journal otherwise"
            />
          </Field>
          <Field label="Tone / hint (optional)">
            <textarea
              className="textarea min-h-[80px] text-sm"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="e.g. emphasise low- and middle-income setting relevance"
            />
          </Field>
          <div className="flex items-center gap-2">
            <button className="btn-primary" onClick={generate} disabled={busy}>
              {busy && <Spinner />} Generate cover letter
            </button>
            <InfoHint
              title="A draft, not a final letter"
              text="This drafts a letter from your design, target journal, and novelty report. It won't invent results or claims that aren't in your manuscript. Read it carefully, confirm every statement matches your work, and edit it in your own voice before sending."
              side="right"
            />
          </div>
          {err ? <div className="text-sm text-med-bad">{err}</div> : null}
          <div className="text-[11.5px] text-med-sub leading-relaxed">
            Uses your design + journal + novelty report. Never invents numbers
            or claims not present in your manuscript.
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-4">
        <Card>
          <CardHeader
            title="Generated letter"
            right={
              letter ? (
                <div className="flex items-center gap-2">
                  <CopyButton text={letter} label="Copy" />
                  <button
                    className="btn-secondary text-[12px]"
                    onClick={() =>
                      downloadAsFile(
                        "cover-letter.md",
                        letter,
                        "text/markdown",
                      )
                    }
                  >
                    Download .md
                  </button>
                </div>
              ) : null
            }
          />
          <CardBody>
            {busy ? (
              <SkeletonLines rows={8} />
            ) : letter ? (
              <pre className="text-[13.5px] text-med-ink whitespace-pre-wrap font-sans leading-relaxed">
                {letter}
              </pre>
            ) : (
              <div className="muted">Fill in inputs and click Generate.</div>
            )}
          </CardBody>
        </Card>
        {warnings.length ? (
          <Card>
            <CardHeader title="Warnings" right={<Badge kind="warn">{warnings.length}</Badge>} />
            <CardBody>
              <ul className="list-disc list-inside text-[13px] text-amber-800 space-y-1">
                {warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </CardBody>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-med-sub mb-1">
        {label}
      </div>
      {children}
    </div>
  );
}
