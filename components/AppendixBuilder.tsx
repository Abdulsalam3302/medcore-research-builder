"use client";

import { useMemo, useState } from "react";
import type { AppendixSection, ProjectState } from "@/lib/types";
import { Card, CardBody, CardHeader } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { Spinner } from "./ui/Spinner";
import { CopyButton } from "./ui/CopyButton";
import { needsQuestionnaireAppendix } from "@/lib/alignment";

const QUESTIONNAIRE_TEMPLATE = `Section A — Demographics
A1. Age (years):
A2. Sex (M/F/Other/Prefer not to say):
A3. Highest education level:
A4. Marital status:
A5. Employment status:

Section B — Clinical / exposure variables
B1. [primary exposure or condition]:
B2. Duration since diagnosis (months):
B3. Comorbidities (check all that apply):
B4. Current medications:

Section C — Primary outcome measure
C1. [primary outcome — Likert / validated scale items]:
C2. Date of measurement:

Section D — Secondary outcome measures
D1. [secondary outcome 1]:
D2. [secondary outcome 2]:

Section E — Data quality / consent
E1. Informed consent obtained: ☐ Yes  ☐ No  ☐ Waived (specify reason)
E2. Date of completion:
E3. Investigator initials:

— Notes —
- Use validated instruments where available; cite the original source for each scale.
- Document any local translation/cultural adaptation and back-translation procedure.
- Pre-test on a pilot sample before full deployment.`;

export function AppendixBuilder({
  project,
  update,
}: {
  project: ProjectState;
  update: (fn: (p: ProjectState) => ProjectState) => void;
}) {
  const designId = project.researchTypeAnswers?.designId;
  const recommended = needsQuestionnaireAppendix(designId);
  const appendices = project.appendices || [];
  const [busy, setBusy] = useState<null | "ai" | "enhance">(null);
  const [busyIndex, setBusyIndex] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function addBlank(kind: AppendixSection["kind"], title: string, content = "") {
    update((p) => ({
      ...p,
      appendices: [
        ...(p.appendices || []),
        {
          id: `apx-${Date.now()}`,
          kind,
          title,
          content,
        },
      ],
    }));
  }

  function patch(i: number, patchObj: Partial<AppendixSection>) {
    update((p) => ({
      ...p,
      appendices: (p.appendices || []).map((a, idx) =>
        idx === i ? { ...a, ...patchObj } : a
      ),
    }));
  }

  function remove(i: number) {
    update((p) => ({
      ...p,
      appendices: (p.appendices || []).filter((_, idx) => idx !== i),
    }));
  }

  async function aiGenerateQuestionnaire(i: number) {
    setBusy("ai");
    setBusyIndex(i);
    setErr(null);
    try {
      const r = await fetch("/api/llm/enhance", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          field: "appendix-questionnaire",
          value: appendices[i].content || "",
          answers: project.researchTypeAnswers,
          hint: `Draft a survey/questionnaire appendix tailored to the chosen study design (${
            designId || "unspecified"
          }). Include numbered items grouped by section (demographics, exposures, outcomes, consent). Use validated instruments where the study's primary outcome maps to one, and reference them by name without inventing publication details. Do NOT invent numeric scale values or response options that the author hasn't specified — leave blanks or "[author: specify response options]" placeholders.`,
        }),
      });
      const data = (await r.json()) as {
        value?: string;
        note?: string;
        error?: string;
      };
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      if (data.value) patch(i, { content: data.value });
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
      setBusyIndex(null);
    }
  }

  async function aiEnhance(i: number) {
    setBusy("enhance");
    setBusyIndex(i);
    setErr(null);
    try {
      const r = await fetch("/api/llm/enhance", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          field: `appendix-${appendices[i].kind}`,
          value: appendices[i].content || "",
          answers: project.researchTypeAnswers,
          hint:
            "Polish the appendix wording for scientific clarity. Preserve all author-supplied content. Do not invent response options, scale values, or citations.",
        }),
      });
      const data = (await r.json()) as {
        value?: string;
        note?: string;
        error?: string;
      };
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      if (data.value) patch(i, { content: data.value });
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
      setBusyIndex(null);
    }
  }

  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader
          title="Appendices & Supplementary Material"
          subtitle="Add survey instruments, questionnaires, supplementary tables, and figures. Each appendix is included in exports and the compliance report."
          right={
            recommended ? (
              <Badge kind="warn">Questionnaire recommended for this design</Badge>
            ) : (
              <Badge kind="neutral">Optional</Badge>
            )
          }
        />
        <CardBody className="grid gap-3">
          {recommended && (
            <div className="border border-amber-200 bg-amber-50 rounded p-3 text-sm text-amber-800">
              Your selected design (<strong>{designId}</strong>) typically requires the
              full survey/questionnaire instrument to be included as an appendix so
              reviewers can evaluate the instrument validity. We've added one below if
              you don't already have it.
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              className="btn-primary"
              onClick={() =>
                addBlank(
                  "questionnaire",
                  "Appendix A — Survey instrument",
                  QUESTIONNAIRE_TEMPLATE
                )
              }
            >
              + Add questionnaire template
            </button>
            <button
              className="btn-secondary"
              onClick={() => addBlank("instrument", "Appendix B — Validated instrument", "")}
            >
              + Add validated instrument
            </button>
            <button
              className="btn-secondary"
              onClick={() => addBlank("supplementary", "Appendix C — Supplementary material", "")}
            >
              + Add supplementary
            </button>
            <button
              className="btn-secondary"
              onClick={() => addBlank("other", "Appendix — Other", "")}
            >
              + Add custom appendix
            </button>
          </div>
          {err && <div className="text-sm text-med-bad">{err}</div>}
        </CardBody>
      </Card>

      {appendices.length === 0 ? (
        <Card>
          <CardBody>
            <div className="muted">
              No appendices yet.{" "}
              {recommended && (
                <span className="text-amber-700">
                  Cross-sectional / survey designs benefit from including the full
                  questionnaire — click "Add questionnaire template" to start.
                </span>
              )}
            </div>
          </CardBody>
        </Card>
      ) : (
        appendices.map((a, i) => (
          <Card key={a.id}>
            <CardHeader
              title={`Appendix ${i + 1}`}
              right={
                <div className="flex items-center gap-2">
                  <Badge kind="info">{a.kind}</Badge>
                  <button
                    className="btn-ghost text-xs text-rose-600"
                    onClick={() => remove(i)}
                  >
                    Remove
                  </button>
                </div>
              }
            />
            <CardBody className="grid gap-2">
              <label className="label">Title</label>
              <input
                className="input"
                value={a.title}
                onChange={(e) => patch(i, { title: e.target.value })}
              />
              <label className="label">Content</label>
              <textarea
                className="textarea min-h-[260px] font-mono text-xs"
                value={a.content}
                onChange={(e) => patch(i, { content: e.target.value })}
                placeholder={
                  a.kind === "questionnaire"
                    ? "Numbered items grouped by section. Use validated instruments where applicable."
                    : "Free text."
                }
              />
              <div className="flex flex-wrap items-center gap-2">
                {a.kind === "questionnaire" && (
                  <button
                    className="btn-primary"
                    onClick={() => aiGenerateQuestionnaire(i)}
                    disabled={busy !== null}
                  >
                    {busy === "ai" && busyIndex === i && <Spinner />} 🤖 AI generate
                  </button>
                )}
                <button
                  className="btn-secondary"
                  onClick={() => aiEnhance(i)}
                  disabled={busy !== null || !a.content.trim()}
                >
                  {busy === "enhance" && busyIndex === i && <Spinner dark />} ✨ AI enhance
                </button>
                <CopyButton text={a.content} label="Copy" />
              </div>
            </CardBody>
          </Card>
        ))
      )}
    </div>
  );
}
