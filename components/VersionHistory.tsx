"use client";

import { useEffect, useMemo, useState } from "react";
import type { ProjectState } from "@/lib/types";
import {
  addSnapshot,
  deleteSnapshot,
  loadSnapshots,
  type ProjectSnapshot,
} from "@/lib/store";
import { diffStrings } from "@/lib/textDiff";
import { Card, CardBody, CardHeader } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { InfoHint } from "./ui/InfoHint";

const SECTIONS: Array<keyof ProjectState["sections"]> = [
  "introduction",
  "methods",
  "results",
  "discussion",
  "conclusion",
];

export function VersionHistory({
  project,
  onRestore,
}: {
  project: ProjectState;
  onRestore: (state: ProjectState) => void;
}) {
  const [snaps, setSnaps] = useState<ProjectSnapshot[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [section, setSection] = useState<keyof ProjectState["sections"]>("introduction");

  function refresh() {
    setSnaps(loadSnapshots());
  }

  useEffect(() => {
    refresh();
  }, []);

  const selected = useMemo(
    () => snaps.find((s) => s.id === selectedId) || null,
    [snaps, selectedId],
  );

  const hunks = useMemo(() => {
    if (!selected) return [];
    return diffStrings(
      selected.state.sections[section] || "",
      project.sections[section] || "",
    );
  }, [selected, section, project.sections]);

  return (
    <div className="grid lg:grid-cols-[320px_1fr] gap-5">
      <Card>
        <CardHeader
          title={
            <InfoHint
              title="Why keep snapshots?"
              text="A snapshot freezes your whole project at a point in time. They let you recover after a bad edit or accidental overwrite and compare an earlier draft against your current text. The app saves automatic snapshots roughly every 30 minutes; add manual ones with a label before any big rewrite so you have a clean point to return to."
              side="right"
            >
              Snapshots
            </InfoHint>
          }
          subtitle={`${snaps.length} saved · auto every ~30 min, plus manual`}
          right={
            <InfoHint
              title="Manual snapshot, your label"
              text="Saves the current project state now with the label above (or 'Manual snapshot' if blank). Take one before restoring, merging, or reworking a section so you always have a way back."
              side="left"
            >
              <button
                className="btn-primary text-[12px]"
                onClick={() => {
                  addSnapshot(project, label.trim() || "Manual snapshot", false);
                  setLabel("");
                  refresh();
                }}
              >
                Save now
              </button>
            </InfoHint>
          }
        />
        <CardBody className="grid gap-3">
          <input
            aria-label="Snapshot label (optional)"
            className="input text-[13px]"
            placeholder="Label (optional)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          {snaps.length === 0 ? (
            <div className="muted text-[12.5px]">
              No snapshots yet. Click Save now to create one.
            </div>
          ) : (
            <ul className="grid gap-1.5 max-h-[60vh] overflow-y-auto pr-1">
              {snaps.map((s) => {
                const isSel = s.id === selectedId;
                return (
                  <li key={s.id}>
                    <button
                      onClick={() => setSelectedId(s.id)}
                      className={`w-full text-left rounded-lg border p-2.5 transition ${
                        isSel
                          ? "border-med-brand bg-sky-50/40"
                          : "border-med-line hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-[12.5px] text-med-ink truncate max-w-[170px]">
                          {s.label}
                        </div>
                        {s.auto ? (
                          <Badge kind="info">auto</Badge>
                        ) : (
                          <Badge kind="neutral">manual</Badge>
                        )}
                      </div>
                      <div className="text-[11px] text-med-sub">
                        {new Date(s.createdAt).toLocaleString()}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>

      <div className="grid gap-4">
        <Card>
          <CardHeader
            title={
              <InfoHint
                title="See exactly what changed"
                text="This shows a word-level diff between the selected snapshot and your current draft for one section. Struck-through red text was removed and green text was added since the snapshot — a quick way to review what you (or a co-author) changed before deciding whether to keep or restore it."
                side="right"
              >
                Compare to current draft
              </InfoHint>
            }
            subtitle={
              selected
                ? `${selected.label} · ${new Date(selected.createdAt).toLocaleString()}`
                : "Pick a snapshot from the left."
            }
            right={
              selected ? (
                <div className="flex items-center gap-2">
                  <select
                    aria-label="Section to compare"
                    className="input text-[12.5px] max-w-[160px]"
                    value={section}
                    onChange={(e) =>
                      setSection(e.target.value as keyof ProjectState["sections"])
                    }
                  >
                    {SECTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <InfoHint
                    title="Restore replaces your draft"
                    text="Restoring rolls your whole project back to this snapshot, discarding any newer edits. The app asks you to confirm and lets you snapshot the current state first — do that if there's recent work you don't want to lose."
                    side="bottom"
                  >
                    <button
                      className="btn-secondary text-[12px]"
                      onClick={() => {
                        if (
                          confirm(
                            "Restore this snapshot? Your current draft will be replaced (you can snapshot it first).",
                          )
                        ) {
                          onRestore(selected.state);
                        }
                      }}
                    >
                      Restore
                    </button>
                  </InfoHint>
                  <button
                    className="btn-ghost text-rose-700 text-[12px]"
                    onClick={() => {
                      if (confirm("Delete this snapshot?")) {
                        deleteSnapshot(selected.id);
                        setSelectedId(null);
                        refresh();
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              ) : null
            }
          />
          <CardBody>
            {!selected ? (
              <div className="muted">No snapshot selected.</div>
            ) : (
              <div className="rounded-lg border border-med-line bg-white p-3 text-[13px] leading-relaxed">
                {hunks.length === 0 ? (
                  <span className="muted">No content for this section in either version.</span>
                ) : (
                  hunks.map((h, i) =>
                    h.op === "eq" ? (
                      <span key={i} className="text-med-ink">
                        {h.text}
                      </span>
                    ) : (
                      <span key={i}>
                        {h.before ? (
                          <span className="bg-rose-50 text-rose-700 line-through px-0.5 rounded">
                            {h.before}
                          </span>
                        ) : null}
                        {h.after ? (
                          <span className="bg-emerald-100 text-emerald-700 px-0.5 rounded">
                            {h.after}
                          </span>
                        ) : null}
                      </span>
                    ),
                  )
                )}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
