"use client";

import { useState } from "react";
import type { ProjectState } from "@/lib/types";
import { Card, CardBody, CardHeader } from "./ui/Card";
import { Spinner } from "./ui/Spinner";
import { Badge } from "./ui/Badge";
import { CopyButton } from "./ui/CopyButton";
import { SkeletonLines } from "./ui/Skeleton";
import { downloadAsFile } from "@/lib/store";

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
        <CardHeader title="Cover letter inputs" />
        <CardBody className="grid gap-3">
          <Field label="Salutation">
            <input
              className="input text-sm"
              value={editor}
              onChange={(e) => setEditor(e.target.value)}
              placeholder="Dear Dr. Smith,"
            />
          </Field>
          <Field label="Corresponding author name">
            <input
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
          <Field label="Override journal name (optional)">
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
          <button className="btn-primary" onClick={generate} disabled={busy}>
            {busy && <Spinner />} Generate cover letter
          </button>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-med-sub mb-1">
        {label}
      </div>
      {children}
    </div>
  );
}
