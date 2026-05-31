"use client";

import { useEffect, useState } from "react";
import type { ProjectState } from "@/lib/types";
import { Card, CardBody, CardHeader } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { CopyButton } from "./ui/CopyButton";
import {
  applyMerge,
  buildMergePreview,
  createServerShare,
  makeShareLink,
  tryParseSharedHash,
  type MergeChoice,
  type MergePreviewItem,
} from "@/lib/share";
import { InfoHint } from "./ui/InfoHint";

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
  const [busy, setBusy] = useState(false);
  const [serverLink, setServerLink] = useState<string>("");
  const [serverExpiry, setServerExpiry] = useState<string>("");
  const [serverNote, setServerNote] = useState<string>("");

  function regenerate() {
    const r = makeShareLink(project);
    setLink(r.url);
    setBytes(r.bytes);
    setWarn(r.warn);
  }

  async function createPrivateLink() {
    if (busy) return;
    setBusy(true);
    setServerNote("");
    try {
      const res = await createServerShare(project);
      if (res) {
        setServerLink(res.url);
        setServerExpiry(res.expiresAt);
      } else {
        setServerLink("");
        setServerExpiry("");
        setServerNote("Private links need cloud storage — using inline link instead.");
      }
    } finally {
      setBusy(false);
    }
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
        <CardHeader
          title={
            <InfoHint
              title="Two ways to share"
              text="An inline link embeds your entire project — including any names or PII it contains — directly in the URL. Anyone who sees the link (browser history, chat logs, proxies) can read everything. A private link instead stores the project on the server and shares only a short token, so the data isn't exposed in the URL. Prefer the private link when your project holds anything sensitive."
              side="right"
            >
              Share by link
            </InfoHint>
          }
          subtitle="Inline link embeds the entire project (including any PII) directly in the URL. The private link stores it server-side and shares only a token."
        />
        <CardBody className="grid gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-med-sub mb-1 inline-flex items-center gap-1">
              Inline link (data in URL)
              <InfoHint
                title="Everything is in the URL"
                text="This link encodes the whole project into the web address itself. It works with no server and never expires, but the trade-off is privacy: the full content travels wherever the link goes. Don't post it publicly if your project contains identifiable or unpublished material."
                side="right"
              />
            </div>
            <div className="flex items-center gap-2">
              <input aria-label="Inline share link (data in URL)" className="input text-[12.5px] font-mono" value={link} readOnly />
              <CopyButton text={link} label="Copy" />
              <button type="button" className="btn-ghost text-[12px]" onClick={regenerate}>
                Refresh
              </button>
            </div>
            <div className="flex flex-wrap gap-2 items-center text-[11.5px] text-med-sub mt-2">
              <Badge kind="neutral">{Math.round(bytes / 1024)} KB encoded</Badge>
              {warn ? <Badge kind="warn">{warn}</Badge> : null}
              <span>
                The recipient pastes the URL into their browser → MedCore detects the
                <code className="mx-1 font-mono">#shared=…</code> fragment and offers to merge.
                All project data is embedded in this link.
              </span>
            </div>
          </div>

          <div className="border-t border-med-line pt-3">
            <div className="text-[11px] uppercase tracking-wide text-med-sub mb-1 inline-flex items-center gap-1">
              Private link (data not in URL)
              <InfoHint
                title="Token, not data"
                text="The project is stored server-side and the link carries only a short token, so the URL itself reveals nothing. This needs cloud storage to be configured; if it isn't, MedCore falls back to an inline link. Server copies here expire after 7 days — treat sharing as temporary, not as a backup."
                side="right"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="btn-secondary text-[12px]"
                onClick={createPrivateLink}
                disabled={busy}
              >
                {busy ? "Creating…" : "Create private link"}
              </button>
              {serverLink ? (
                <>
                  <input aria-label="Private share link (token only)" className="input text-[12.5px] font-mono flex-1 min-w-[200px]" value={serverLink} readOnly />
                  <CopyButton text={serverLink} label="Copy" />
                </>
              ) : null}
            </div>
            {serverLink ? (
              <div className="flex flex-wrap gap-2 items-center text-[11.5px] text-med-sub mt-2">
                <Badge kind="info">Server link · data NOT in URL</Badge>
                {serverExpiry ? (
                  <Badge kind="neutral">
                    Expires {new Date(serverExpiry).toLocaleDateString()}
                  </Badge>
                ) : null}
                <span>
                  Stored server-side for 7 days. The recipient opens the
                  <code className="mx-1 font-mono">?share=…</code> link and MedCore fetches the project.
                </span>
              </div>
            ) : null}
            {serverNote ? (
              <div className="text-[11.5px] text-med-sub mt-2">{serverNote}</div>
            ) : null}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title={
            <InfoHint
              title="Bring in a co-author's work"
              text="Paste the JSON a collaborator exported (or that arrived via a share link) to compare it against your own draft field by field. Loading it here only previews a merge — nothing changes until you confirm. This is local-only; it doesn't submit anything to a journal."
              side="right"
            >
              Receive a project (paste JSON)
            </InfoHint>
          }
          subtitle="Or paste a co-author's exported JSON below."
        />
        <CardBody className="grid gap-3">
          <textarea
            aria-label="Co-author exported project JSON"
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
        title={
          <InfoHint
            title="Merge overwrites — choose per field"
            text="For each field you pick a single winner: your local text or the incoming remote text. The default is whichever is longer, but length isn't quality — read both sides before deciding. Applying the merge replaces the chosen fields outright and can't be undone, so export or snapshot your project first."
            side="right"
          >
            Merge preview
          </InfoHint>
        }
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
