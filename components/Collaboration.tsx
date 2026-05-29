"use client";

import { useEffect, useState } from "react";
import type { ProjectState } from "@/lib/types";
import { Card, CardBody, CardHeader } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { CopyButton } from "./ui/CopyButton";
import {
  applyMerge,
  buildMergePreview,
  makeShareLink,
  tryParseSharedHash,
  type MergeChoice,
  type MergePreviewItem,
} from "@/lib/share";

export function Collaboration({
  project,
  onApplyMerged,
}: {
  project: ProjectState;
  onApplyMerged: (state: ProjectState) => void;
}) {
  const [link, setLink] = useState<string>("");
  const [bytes, setBytes] = useState(0);
  const [warn, setWarn] = useState<string | undefined>();
  const [pasted, setPasted] = useState("");
  const [remote, setRemote] = useState<ProjectState | null>(null);
  const [decisions, setDecisions] = useState<MergePreviewItem[]>([]);
  const [parseErr, setParseErr] = useState<string | null>(null);

  function regenerate() {
    const r = makeShareLink(project);
    setLink(r.url);
    setBytes(r.bytes);
    setWarn(r.warn);
  }

  useEffect(() => {
    regenerate();
    const fromHash = tryParseSharedHash();
    if (fromHash) {
      setRemote(fromHash);
      setDecisions(buildMergePreview(project, fromHash));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function loadFromPaste() {
    setParseErr(null);
    try {
      const parsed = JSON.parse(pasted) as ProjectState;
      setRemote(parsed);
      setDecisions(buildMergePreview(project, parsed));
    } catch (e) {
      setParseErr(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader title="Share by link" subtitle="Encodes the entire project into the URL fragment. Nothing is sent to a server." />
        <CardBody className="grid gap-3">
          <div className="flex items-center gap-2">
            <input className="input text-[12.5px] font-mono" value={link} readOnly />
            <CopyButton text={link} label="Copy" />
            <button type="button" className="btn-ghost text-[12px]" onClick={regenerate}>
              Refresh
            </button>
          </div>
          <div className="flex flex-wrap gap-2 items-center text-[11.5px] text-med-sub">
            <Badge kind="neutral">{Math.round(bytes / 1024)} KB encoded</Badge>
            {warn ? <Badge kind="warn">{warn}</Badge> : null}
            <span>
              The recipient pastes the URL into their browser → MedCore detects the
              <code className="mx-1 font-mono">#shared=…</code> fragment and offers to merge.
            </span>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Receive a project (paste JSON)" subtitle="Or paste a co-author's exported JSON below." />
        <CardBody className="grid gap-3">
          <textarea
            className="textarea min-h-[120px] font-mono text-[12px]"
            placeholder='{"version":"2.1.0", ... }'
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={loadFromPaste} disabled={!pasted.trim()}>
              Load for merge
            </button>
          </div>
          {parseErr ? <div role="alert" className="text-sm text-med-bad">{parseErr}</div> : null}
        </CardBody>
      </Card>

      {remote ? (
        <MergeView
          decisions={decisions}
          onChange={setDecisions}
          onApply={() => {
            if (
              !confirm(
                "Apply this merge? Selected fields will overwrite your current project and cannot be undone (consider exporting or saving a snapshot first).",
              )
            ) {
              return;
            }
            onApplyMerged(applyMerge(project, remote, decisions));
          }}
        />
      ) : null}
    </div>
  );
}

function MergeView({
  decisions,
  onChange,
  onApply,
}: {
  decisions: MergePreviewItem[];
  onChange: (next: MergePreviewItem[]) => void;
  onApply: () => void;
}) {
  function setChoice(i: number, c: MergeChoice) {
    onChange(decisions.map((d, idx) => (idx === i ? { ...d, choice: c } : d)));
  }
  return (
    <Card>
      <CardHeader
        title="Merge preview"
        subtitle="Pick a winner per field. Default = the longer side. Nothing applies until you confirm."
        right={
          <button type="button" className="btn-primary" onClick={onApply}>
            Apply merge
          </button>
        }
      />
      <CardBody className="grid gap-3">
        {decisions.map((d, i) => (
          <div key={d.field} className="rounded-lg border border-med-line p-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-[13px] text-med-ink">{d.field}</div>
              <div className="flex items-center gap-2">
                <Badge kind="neutral">local {d.localLen}c</Badge>
                <Badge kind="info">remote {d.remoteLen}c</Badge>
                <select
                  aria-label={`Merge choice for ${d.field}`}
                  className="input text-[12px] max-w-[140px]"
                  value={d.choice}
                  onChange={(e) => setChoice(i, e.target.value as MergeChoice)}
                >
                  <option value="local">use local</option>
                  <option value="remote">use remote</option>
                  <option value="longer">use longer</option>
                </select>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-2 mt-2 text-[12px] text-med-inkSoft">
              <div className="rounded border border-med-line bg-slate-50/50 p-2 max-h-[120px] overflow-y-auto whitespace-pre-wrap">
                <div className="text-[10px] uppercase tracking-wide text-med-sub mb-1">Local</div>
                {d.local || "(empty)"}
              </div>
              <div className="rounded border border-med-line bg-slate-50/50 p-2 max-h-[120px] overflow-y-auto whitespace-pre-wrap">
                <div className="text-[10px] uppercase tracking-wide text-med-sub mb-1">Remote</div>
                {d.remote || "(empty)"}
              </div>
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
