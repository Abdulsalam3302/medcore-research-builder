"use client";

import { useMemo, useState } from "react";
import type { ProjectState, SubmissionRecord, SubmissionStatus } from "@/lib/types";
import {
  STAGES,
  daysBetween,
  nextStatuses,
  stageByStatus,
  summarizePipeline,
} from "@/lib/submission/pipeline";
import { Badge } from "@/components/ui/Badge";
import { InfoHint } from "@/components/ui/InfoHint";

type Update = (fn: (p: ProjectState) => ProjectState) => void;

const STAGE_BADGE: Record<string, "good" | "warn" | "bad" | "info" | "neutral"> = {
  shortlisted: "info",
  formatting: "warn",
  submitted: "warn",
  under_review: "info",
  major_revision: "warn",
  minor_revision: "warn",
  accepted: "good",
  rejected: "bad",
  withdrawn: "neutral",
  published: "good",
};

function newRecord(journalName: string): SubmissionRecord {
  const now = new Date().toISOString();
  return {
    id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    journalName: journalName.trim(),
    status: "shortlisted",
    history: [{ status: "shortlisted", at: now }],
    createdAt: now,
    updatedAt: now,
  };
}

export function SubmissionPipeline({
  project,
  update,
  onJump,
}: {
  project: ProjectState;
  update: Update;
  onJump?: (k: string) => void;
}) {
  const records = useMemo(() => project.submissions || [], [project.submissions]);
  const summary = useMemo(() => summarizePipeline(records), [records]);
  const [draftName, setDraftName] = useState("");
  const [expanded, setExpanded] = useState<string | null>(records[0]?.id ?? null);

  function patch(id: string, fn: (r: SubmissionRecord) => SubmissionRecord) {
    update((p) => ({
      ...p,
      submissions: (p.submissions || []).map((r) => (r.id === id ? fn(r) : r)),
    }));
  }

  function addRecord() {
    const name = draftName.trim();
    if (!name) return;
    const rec = newRecord(name);
    update((p) => ({ ...p, submissions: [rec, ...(p.submissions || [])] }));
    setDraftName("");
    setExpanded(rec.id);
  }

  function moveTo(id: string, status: SubmissionStatus) {
    const now = new Date().toISOString();
    patch(id, (r) => ({
      ...r,
      status,
      history: [...r.history, { status, at: now }],
      updatedAt: now,
    }));
  }

  function removeRecord(id: string) {
    update((p) => ({
      ...p,
      submissions: (p.submissions || []).filter((r) => r.id !== id),
    }));
  }

  return (
    <div className="space-y-5">
      {/* Summary strip */}
      <div className="card-elevated p-4 md:p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="font-display font-semibold text-med-ink text-[15px] inline-flex items-center gap-1.5">
              Submission Pipeline
              <InfoHint
                title="Why track submissions here?"
                text="One journal at a time, formally: this tracker keeps the status, dates, and stage-specific best practice (ICMJE/COPE-aligned) for every target journal — from shortlist to publication. It also computes how long each submission has been in review."
              />
            </h3>
            <p className="muted text-[12.5px] mt-0.5">
              Track each target journal from shortlist → formatting → submission → peer review → decision.
              Drafts stay in your browser like the rest of your project.
            </p>
          </div>
          <div className="flex gap-4 text-[12px] text-med-sub">
            <span>Total <span className="font-semibold text-med-ink tabular-nums">{summary.total}</span></span>
            <span>Active <span className="font-semibold text-med-ink tabular-nums">{summary.active}</span></span>
            <span>In review <span className="font-semibold text-med-ink tabular-nums">{summary.inReview}</span></span>
            <span>Accepted/Published <span className="font-semibold text-emerald-700 tabular-nums">{summary.outcomes.accepted + summary.outcomes.published}</span></span>
          </div>
        </div>

        <div className="mt-4 flex gap-2 flex-wrap items-end">
          <label className="flex-1 min-w-[240px]">
            <span className="text-[11.5px] font-semibold text-med-sub uppercase tracking-wide">Add a target journal</span>
            <input
              type="text"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addRecord()}
              placeholder="e.g. Annals of Saudi Medicine"
              className="input mt-1 w-full"
            />
          </label>
          <button type="button" className="btn-primary" onClick={addRecord} disabled={!draftName.trim()}>
            Add to pipeline
          </button>
          {onJump && (
            <button type="button" className="btn-ghost text-xs" onClick={() => onJump("journal-finder")}>
              Pick from Journal Finder →
            </button>
          )}
        </div>

        <p className="mt-2 text-[11.5px] text-med-subtle">
          Integrity rule: submit to <strong>one journal at a time</strong>. Parallel submission of the same
          manuscript is a COPE violation — the pipeline is for sequenced targets, not simultaneous ones.
        </p>
      </div>

      {/* Records */}
      {records.length === 0 ? (
        <div className="rounded-lg border border-dashed border-med-line bg-slate-50/40 p-6 text-center text-[13px] text-med-sub">
          No journals in the pipeline yet — shortlist one above, or rank candidates in the Journal Finder first.
        </div>
      ) : (
        records.map((r) => {
          const stage = stageByStatus(r.status);
          const open = expanded === r.id;
          const submittedEvent = [...r.history].reverse().find((h) => h.status === "submitted");
          const reviewDays = submittedEvent &&
            ["submitted", "under_review", "major_revision", "minor_revision"].includes(r.status)
            ? daysBetween(submittedEvent.at, new Date().toISOString())
            : null;
          return (
            <div key={r.id} className="card-elevated overflow-hidden">
              <button
                type="button"
                onClick={() => setExpanded(open ? null : r.id)}
                aria-expanded={open}
                className="w-full text-left px-4 md:px-5 py-3.5 flex items-center gap-3 flex-wrap hover:bg-slate-50/60 transition"
              >
                <span className="font-semibold text-med-ink text-[14px] flex-1 min-w-[180px]">{r.journalName}</span>
                <Badge kind={STAGE_BADGE[r.status]}>{stage.label}</Badge>
                {reviewDays !== null && (
                  <span className="text-[11.5px] text-med-sub tabular-nums">{reviewDays}d in review</span>
                )}
                <span className="text-med-subtle text-xs" aria-hidden>{open ? "▾" : "▸"}</span>
              </button>

              {open && (
                <div className="px-4 md:px-5 pb-5 border-t border-med-line/60 pt-4 space-y-4">
                  {/* Stage stepper */}
                  <ol className="flex flex-wrap gap-1.5" aria-label="Submission stages">
                    {STAGES.filter((s) => !["withdrawn", "rejected"].includes(s.status)).map((s) => {
                      const reached = r.history.some((h) => h.status === s.status);
                      const isCurrent = r.status === s.status;
                      return (
                        <li
                          key={s.status}
                          aria-current={isCurrent ? "step" : undefined}
                          className={`text-[11px] px-2 py-1 rounded-full border ${
                            isCurrent
                              ? "border-med-brand bg-sky-50 text-sky-800 font-semibold"
                              : reached
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-med-line text-med-subtle"
                          }`}
                        >
                          {s.label}
                        </li>
                      );
                    })}
                  </ol>

                  {/* Stage guidance */}
                  <div className="rounded-lg bg-slate-50/70 border border-med-line/60 p-3.5">
                    <p className="text-[12.5px] text-med-ink font-medium">{stage.meaning}</p>
                    <ul className="mt-2 space-y-1 text-[12.5px] text-med-sub list-disc pl-5">
                      {stage.actions.map((a) => (
                        <li key={a}>{a}</li>
                      ))}
                    </ul>
                    <p className="mt-2 text-[11.5px] text-amber-700">
                      <span className="font-semibold">Common mistake:</span> {stage.pitfall}
                    </p>
                  </div>

                  {/* Move to next status */}
                  {nextStatuses(r.status).length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11.5px] font-semibold text-med-sub uppercase tracking-wide">Move to</span>
                      {nextStatuses(r.status).map((s) => (
                        <button
                          key={s}
                          type="button"
                          className="btn-secondary text-xs"
                          onClick={() => moveTo(r.id, s)}
                        >
                          {stageByStatus(s).label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Details */}
                  <div className="grid md:grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-[11.5px] font-semibold text-med-sub uppercase tracking-wide">
                        Manuscript / tracking ID
                      </span>
                      <input
                        type="text"
                        className="input mt-1 w-full"
                        value={r.manuscriptId || ""}
                        placeholder="e.g. ASM-2026-0142"
                        onChange={(e) => patch(r.id, (x) => ({ ...x, manuscriptId: e.target.value }))}
                      />
                    </label>
                    <label className="block">
                      <span className="text-[11.5px] font-semibold text-med-sub uppercase tracking-wide">Notes</span>
                      <input
                        type="text"
                        className="input mt-1 w-full"
                        value={r.notes || ""}
                        placeholder="e.g. editor requested STROBE checklist"
                        onChange={(e) => patch(r.id, (x) => ({ ...x, notes: e.target.value }))}
                      />
                    </label>
                  </div>

                  {/* Timeline */}
                  <div>
                    <span className="text-[11.5px] font-semibold text-med-sub uppercase tracking-wide">Timeline</span>
                    <ol className="mt-1.5 space-y-1">
                      {r.history.map((h, i) => (
                        <li key={`${h.status}-${h.at}-${i}`} className="text-[12px] text-med-sub flex gap-2">
                          <span className="tabular-nums text-med-subtle">{h.at.slice(0, 10)}</span>
                          <span className="font-medium text-med-ink">{stageByStatus(h.status).label}</span>
                          {i > 0 && (
                            <span className="text-med-subtle">
                              (+{daysBetween(r.history[i - 1].at, h.at)}d)
                            </span>
                          )}
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="btn-ghost text-xs text-med-bad"
                      onClick={() => removeRecord(r.id)}
                    >
                      Remove from pipeline
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
