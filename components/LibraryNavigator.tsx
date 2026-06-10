"use client";

import { useMemo, useState } from "react";
import {
  NEED_OPTIONS,
  STAGE_OPTIONS,
  libraryCounts,
  searchLibrary,
  type LibraryKind,
  type NavigatorNeed,
  type NavigatorStage,
} from "@/lib/knowledge/navigator";
import { researchSkills } from "@/lib/knowledge/skills";
import { skillChains } from "@/lib/knowledge/skillchains";
import { researchTips } from "@/lib/knowledge/methods";
import { Badge } from "@/components/ui/Badge";
import { InfoHint } from "@/components/ui/InfoHint";

const KIND_META: Record<LibraryKind, { label: string; badge: "good" | "info" | "warn" | "neutral" }> = {
  platform: { label: "MedCore feature", badge: "good" },
  skill: { label: "Skill", badge: "info" },
  chain: { label: "Workflow", badge: "info" },
  tip: { label: "Tip", badge: "neutral" },
  tool: { label: "Open-source tool", badge: "warn" },
  mcp: { label: "MCP server", badge: "warn" },
};

/** Inline detail for learnable items so users get the content right here. */
function LearnDetail({ kind, id }: { kind: LibraryKind; id: string }) {
  if (kind === "skill") {
    const s = researchSkills.find((x) => x.id === id);
    if (!s) return null;
    return (
      <div className="mt-2 space-y-1.5 text-[12.5px] text-med-sub">
        <ol className="list-decimal pl-5 space-y-1">
          {s.steps.map((st) => (
            <li key={st}>{st}</li>
          ))}
        </ol>
        {s.pitfalls.length > 0 && (
          <p className="text-amber-700">
            <span className="font-semibold">Watch out:</span> {s.pitfalls[0]}
          </p>
        )}
      </div>
    );
  }
  if (kind === "chain") {
    const c = skillChains.find((x) => x.id === id);
    if (!c) return null;
    return (
      <ol className="mt-2 list-decimal pl-5 space-y-1 text-[12.5px] text-med-sub">
        {c.steps.map((st) => (
          <li key={st.title}>
            <span className="font-medium text-med-ink">{st.title}.</span> {st.doThis}
          </li>
        ))}
      </ol>
    );
  }
  if (kind === "tip") {
    const t = researchTips.find((x) => x.id === id);
    if (!t) return null;
    return (
      <div className="mt-2 space-y-1 text-[12.5px] text-med-sub">
        <p><span className="font-semibold text-med-ink">Why:</span> {t.why}</p>
        <p><span className="font-semibold text-med-ink">How:</span> {t.how}</p>
      </div>
    );
  }
  return null;
}

export function LibraryNavigator({ onJump }: { onJump?: (lane: string) => void }) {
  const [stage, setStage] = useState<NavigatorStage | "">("");
  const [need, setNeed] = useState<NavigatorNeed>("any");
  const [beginnerFriendly, setBeginnerFriendly] = useState(false);
  const [text, setText] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const counts = useMemo(() => libraryCounts(), []);
  const hasInput = Boolean(stage || text.trim() || need !== "any");
  const results = useMemo(
    () =>
      hasInput
        ? searchLibrary({
            text: text.trim() || undefined,
            stage: stage || undefined,
            need,
            maxLevel: beginnerFriendly ? "intermediate" : undefined,
            limit: 14,
          })
        : [],
    [stage, need, text, beginnerFriendly, hasInput],
  );

  return (
    <div className="space-y-5">
      <div className="card-elevated p-4 md:p-5 space-y-4">
        <div>
          <h3 className="font-display font-semibold text-med-ink text-[15px] inline-flex items-center gap-1.5">
            Find what you need
            <InfoHint
              title="How the Navigator works"
              text={`One search across all ${counts.total} library entries: ${counts.platform} built-in MedCore features, ${counts.skill} skills, ${counts.chain} step-by-step workflows, ${counts.tip} tips, ${counts.tool} vetted open-source tools, and ${counts.mcp} MCP servers. Ranking is deterministic and offline — it can never invent an entry that doesn't exist. Built-in features rank slightly higher because they need zero setup.`}
            />
          </h3>
          <p className="muted text-[12.5px] mt-0.5">
            Answer two quick questions — or just type what you're trying to do — and get the best
            skill, workflow, tool, MCP server, or built-in feature for it.
          </p>
        </div>

        {/* Q1: stage */}
        <div>
          <span className="text-[11.5px] font-semibold text-med-sub uppercase tracking-wide">
            1 · Where are you in the journey?
          </span>
          <div className="mt-1.5 flex gap-1.5 flex-wrap">
            {STAGE_OPTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                title={s.hint}
                aria-pressed={stage === s.id}
                className={`pill-tab ${stage === s.id ? "pill-tab-active" : ""}`}
                onClick={() => setStage(stage === s.id ? "" : s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Q2: need */}
        <div>
          <span className="text-[11.5px] font-semibold text-med-sub uppercase tracking-wide">
            2 · What kind of help?
          </span>
          <div className="mt-1.5 flex gap-1.5 flex-wrap">
            {NEED_OPTIONS.map((n) => (
              <button
                key={n.id}
                type="button"
                title={n.hint}
                aria-pressed={need === n.id}
                className={`pill-tab ${need === n.id ? "pill-tab-active" : ""}`}
                onClick={() => setNeed(n.id)}
              >
                {n.label}
              </button>
            ))}
          </div>
        </div>

        {/* Free text + level */}
        <div className="flex gap-3 flex-wrap items-center">
          <label className="flex-1 min-w-[260px]">
            <span className="sr-only">Describe what you need</span>
            <input
              type="text"
              className="input w-full"
              value={text}
              placeholder='Or describe it, e.g. "respond to reviewer asking for power calculation"'
              onChange={(e) => setText(e.target.value)}
            />
          </label>
          <label className="inline-flex items-center gap-2 text-[12.5px] text-med-sub">
            <input
              type="checkbox"
              checked={beginnerFriendly}
              onChange={(e) => setBeginnerFriendly(e.target.checked)}
            />
            Beginner-friendly only
          </label>
        </div>
      </div>

      {/* Results */}
      {!hasInput ? (
        <div className="rounded-lg border border-dashed border-med-line bg-slate-50/40 p-6 text-center text-[13px] text-med-sub">
          Pick a stage, a kind of help, or type a goal — the Navigator searches all{" "}
          {counts.total} entries at once.
        </div>
      ) : results.length === 0 ? (
        <div className="rounded-lg border border-dashed border-med-line bg-slate-50/40 p-6 text-center text-[13px] text-med-sub">
          No matches — try fewer words, or clear the beginner-friendly filter.
        </div>
      ) : (
        <ul className="space-y-2.5" aria-label="Navigator results">
          {results.map(({ item, reasons }) => {
            const meta = KIND_META[item.kind];
            const open = expanded === item.key;
            const learnable = item.kind === "skill" || item.kind === "chain" || item.kind === "tip";
            return (
              <li key={item.key} className="card-elevated p-4">
                <div className="flex items-start gap-3 flex-wrap">
                  <div className="flex-1 min-w-[240px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge kind={meta.badge}>{meta.label}</Badge>
                      <span className="text-[11.5px] text-med-subtle">{item.group}</span>
                      {item.level && <span className="text-[11.5px] text-med-subtle">· {item.level}</span>}
                    </div>
                    <h4 className="mt-1 font-semibold text-med-ink text-[13.5px]">{item.title}</h4>
                    <p className="mt-0.5 text-[12.5px] text-med-sub">{item.summary}</p>
                    {reasons.length > 0 && (
                      <p className="mt-1 text-[11px] text-sky-700">{reasons.join(" · ")}</p>
                    )}
                    {learnable && open && <LearnDetail kind={item.kind} id={item.id} />}
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    {learnable && (
                      <button
                        type="button"
                        className="btn-secondary text-xs"
                        aria-expanded={open}
                        onClick={() => setExpanded(open ? null : item.key)}
                      >
                        {open ? "Hide steps" : "Show steps"}
                      </button>
                    )}
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary text-xs"
                      >
                        Verify / official site ↗
                      </a>
                    )}
                    {item.lane && onJump && item.kind === "platform" && (
                      <button
                        type="button"
                        className="btn-primary text-xs"
                        onClick={() => onJump(item.lane!)}
                      >
                        Open in MedCore →
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-[11.5px] text-med-subtle">
        Deterministic by design: the Navigator only surfaces entries that exist in MedCore's curated
        catalogs (each tool and MCP server carries an official verify link) — it cannot invent or
        hallucinate a recommendation.
      </p>
    </div>
  );
}
