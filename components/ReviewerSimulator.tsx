"use client";

import { useState } from "react";
import type { ProjectState } from "@/lib/types";
import { Card, CardBody, CardHeader } from "./ui/Card";
import { Spinner } from "./ui/Spinner";
import { Badge } from "./ui/Badge";
import { CopyButton } from "./ui/CopyButton";
import { SkeletonLines } from "./ui/Skeleton";

type Persona = "statistician" | "methodologist" | "editor";

type Review = {
  persona: Persona;
  label: string;
  verdict?: "accept" | "minor" | "major" | "reject";
  summary?: string;
  majorIssues?: string[];
  minorIssues?: string[];
  requestedRevisions?: string[];
  questionsForAuthors?: string[];
  raw?: string;
};

const ALL: Persona[] = ["statistician", "methodologist", "editor"];

export function ReviewerSimulator({ project }: { project: ProjectState }) {
  const [busy, setBusy] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<Persona>>(new Set(ALL));

  async function run() {
    setBusy(true);
    setErr(null);
    setReviews([]);
    try {
      const r = await fetch("/api/llm/reviewer-simulator", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ project, personas: Array.from(selected) }),
      });
      const data = (await r.json()) as { reviews?: Review[]; error?: string };
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      setReviews(data.reviews || []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const consolidated = reviews.length
    ? `# Consolidated pre-submission critique\n\n${reviews
        .map(
          (r) =>
            `## ${r.label} — verdict: ${r.verdict || "—"}\n\n${
              r.summary || ""
            }\n\n**Major:**\n${(r.majorIssues || []).map((x) => `- ${x}`).join("\n") || "—"}\n\n**Minor:**\n${(r.minorIssues || []).map((x) => `- ${x}`).join("\n") || "—"}\n\n**Requested revisions:**\n${(r.requestedRevisions || []).map((x) => `- ${x}`).join("\n") || "—"}\n\n**Questions for authors:**\n${(r.questionsForAuthors || []).map((x) => `- ${x}`).join("\n") || "—"}`,
        )
        .join("\n\n---\n\n")}`
    : "";

  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader
          title="Reviewer simulator"
          subtitle="Three personas read your manuscript: a statistical reviewer, a methodologist, and an editor. Pre-submission critique, not a guarantee."
          right={
            <div className="flex items-center gap-2">
              {reviews.length ? (
                <CopyButton text={consolidated} label="Copy critique" />
              ) : null}
              <button className="btn-primary" onClick={run} disabled={busy || selected.size === 0}>
                {busy && <Spinner />} Run review pass
              </button>
            </div>
          }
        />
        <CardBody className="grid gap-3">
          <div className="flex flex-wrap gap-2">
            {ALL.map((p) => {
              const on = selected.has(p);
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() =>
                    setSelected((prev) => {
                      const next = new Set(prev);
                      if (next.has(p)) next.delete(p);
                      else next.add(p);
                      return next;
                    })
                  }
                  className={`pill-tab ${on ? "pill-tab-active" : ""}`}
                >
                  {p}
                </button>
              );
            })}
          </div>
          {err ? <div className="text-sm text-med-bad">{err}</div> : null}
        </CardBody>
      </Card>

      {busy ? (
        <Card>
          <CardHeader title="Reviewing — three passes…" />
          <CardBody>
            <SkeletonLines rows={6} />
            <div className="text-[12px] text-med-sub mt-3">
              Each persona makes a separate LLM call (~5–10s each).
            </div>
          </CardBody>
        </Card>
      ) : null}

      <div className="grid lg:grid-cols-3 gap-4">
        {reviews.map((r) => (
          <ReviewCard key={r.persona} review={r} />
        ))}
      </div>
    </div>
  );
}

function ReviewCard({ review: r }: { review: Review }) {
  const tone =
    r.verdict === "accept"
      ? "good"
      : r.verdict === "minor"
      ? "info"
      : r.verdict === "major"
      ? "warn"
      : r.verdict === "reject"
      ? "bad"
      : "neutral";
  return (
    <Card>
      <CardHeader
        title={r.label}
        right={r.verdict ? <Badge kind={tone}>{r.verdict}</Badge> : null}
      />
      <CardBody className="grid gap-3 text-[13px]">
        {r.summary ? (
          <p className="text-med-inkSoft leading-relaxed">{r.summary}</p>
        ) : null}
        <Bucket title="Major" tone="bad" items={r.majorIssues} />
        <Bucket title="Minor" tone="warn" items={r.minorIssues} />
        <Bucket title="Requested revisions" tone="info" items={r.requestedRevisions} />
        <Bucket title="Questions for authors" tone="neutral" items={r.questionsForAuthors} />
        {r.raw ? (
          <details className="text-[11.5px] text-med-sub">
            <summary>Raw response</summary>
            <pre className="whitespace-pre-wrap mt-1">{r.raw}</pre>
          </details>
        ) : null}
      </CardBody>
    </Card>
  );
}

function Bucket({
  title,
  tone,
  items,
}: {
  title: string;
  tone: "good" | "warn" | "bad" | "info" | "neutral";
  items?: string[];
}) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Badge kind={tone}>{items.length}</Badge>
        <span className="text-[12px] uppercase tracking-wide text-med-sub font-semibold">
          {title}
        </span>
      </div>
      <ul className="text-[12.5px] text-med-inkSoft space-y-1 list-disc list-inside">
        {items.map((x, i) => (
          <li key={i}>{x}</li>
        ))}
      </ul>
    </div>
  );
}
