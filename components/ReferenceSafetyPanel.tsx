"use client";

import { useMemo } from "react";
import type { ProjectState } from "@/lib/types";
import {
  assessReferenceSafety,
  type ReferenceSafetyFlag,
  type ReferenceFlagSeverity,
} from "@/lib/references/safety";
import { Card, CardBody, CardHeader } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { InfoHint } from "./ui/InfoHint";

const KIND_LABEL: Record<ReferenceSafetyFlag["kind"], string> = {
  unverified: "Unverified",
  "low-confidence-match": "Low-confidence match",
  "metadata-mismatch": "Metadata mismatch",
  "possibly-irrelevant": "Possibly irrelevant",
  retracted: "Retraction / concern",
  duplicate: "Duplicate",
  "predatory-risk": "Predatory / provenance risk",
  "uncited-in-text": "Not cited in text",
  "cited-not-in-list": "Cited but not in list",
};

const KIND_HELP: Record<ReferenceSafetyFlag["kind"], string> = {
  unverified:
    "This reference was never confirmed against a source database, so its very existence is unconfirmed. Open the original article and check author, title, journal, year, and DOI before you rely on it.",
  "low-confidence-match":
    "An automated match was found, but the match score was weak — the system may have linked your citation to the wrong record. Eyeball the matched article to confirm it's truly the one you mean.",
  "metadata-mismatch":
    "The matched record's details (title, year, authors, page/volume) disagree with what you entered. Mismatches often mean a typo, the wrong edition, or the wrong paper entirely — reconcile them against the source.",
  "possibly-irrelevant":
    "The reference doesn't obviously connect to the claim or section it supports. Confirm it genuinely backs the statement, rather than being a loosely related or padded citation.",
  retracted:
    "The source matched a retraction or expression-of-concern signal. Citing retracted work without flagging it undermines your evidence base — verify its status (e.g. Retraction Watch / the publisher) and remove or annotate it.",
  duplicate:
    "The same work appears more than once in your list. Merge duplicates so numbering and counts stay correct.",
  "predatory-risk":
    "The source's venue shows provenance red flags (e.g. unindexed or predatory). Predatory citations weaken credibility — confirm the journal is legitimately indexed before keeping it.",
  "uncited-in-text":
    "This reference sits in your list but is never cited in the text. Either cite it where relevant or remove it — orphan references are a common formatting reject.",
  "cited-not-in-list":
    "An in-text citation has no matching entry in the reference list. Add the full reference so every citation resolves.",
};

const SEVERITY_ORDER: ReferenceFlagSeverity[] = ["critical", "warning", "info"];

const SEVERITY_META: Record<
  ReferenceFlagSeverity,
  { label: string; badge: "bad" | "warn" | "info" }
> = {
  critical: { label: "Critical", badge: "bad" },
  warning: { label: "Warning", badge: "warn" },
  info: { label: "Advisory", badge: "info" },
};

function scoreBadgeKind(score: number): "good" | "warn" | "bad" {
  if (score >= 80) return "good";
  if (score >= 50) return "warn";
  return "bad";
}

export function ReferenceSafetyPanel({ project }: { project: ProjectState }) {
  const verifications = project.references?.verifications || [];

  const sectionsText = useMemo(() => {
    const s = project.sections || ({} as ProjectState["sections"]);
    return [
      project.titleFinal || "",
      s.introduction || "",
      s.methods || "",
      s.results || "",
      s.discussion || "",
      s.conclusion || "",
    ]
      .filter(Boolean)
      .join("\n\n");
  }, [project.sections, project.titleFinal]);

  const assessment = useMemo(
    () => assessReferenceSafety(verifications, sectionsText),
    [verifications, sectionsText]
  );

  const grouped = useMemo(() => {
    const g: Record<ReferenceFlagSeverity, ReferenceSafetyFlag[]> = {
      critical: [],
      warning: [],
      info: [],
    };
    for (const f of assessment.flags) g[f.severity].push(f);
    return g;
  }, [assessment.flags]);

  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader
          title={
            <span className="inline-flex items-center gap-1.5">
              Reference Safety Layer
              <InfoHint
                title="Why a safety layer for references"
                text="Fabricated, retracted, or mismatched citations are one of the fastest routes to desk rejection — and AI-assisted drafting makes hallucinated references a real risk. This layer triages your references so you know which ones a human must check, in priority order. It flags what to verify; it never certifies that a citation is correct."
              />
            </span>
          }
          subtitle="Deterministic anti-hallucination triage over your verified references. It surfaces what to human-check — it never asserts a citation is correct."
          right={
            <span className="inline-flex items-center gap-1.5">
              <InfoHint
                side="left"
                title="Reading the safety score"
                text="A rough 0–100 roll-up of how many references are clean versus flagged, weighted by severity. Higher is better, but it's a triage signal only — a high score does not prove your citations are accurate, and a single critical flag (e.g. a retraction) matters more than the number itself. Every citation still needs human verification."
              />
              <Badge kind={scoreBadgeKind(assessment.score)}>
                Safety score: {assessment.score}/100
              </Badge>
            </span>
          }
        />
        <CardBody className="grid gap-3">
          <div
            role="note"
            className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm text-amber-900"
          >
            <strong>Every citation must be human-verified.</strong> AI parsing and
            automated source-matching can mis-match or hallucinate references. A high
            score is <em>not</em> a guarantee of correctness — confirm each reference
            against the original article before submission.
          </div>

          <p className="text-sm text-med-sub">{assessment.summary}</p>

          {verifications.length === 0 && (
            <p className="text-xs text-med-sub">
              Run the Reference Verifier first to populate this panel.
            </p>
          )}
        </CardBody>
      </Card>

      {assessment.flags.length > 0 && (
        <Card>
          <CardHeader
            title={
              <span className="inline-flex items-center gap-1.5">
                Flags for human review
                <InfoHint
                  title="How severity is grouped"
                  text="Flags are sorted by how much they threaten a submission: 'Critical' items (e.g. retractions, fabricated or unmatched citations) can sink the paper and must be cleared first; 'Warning' items need attention; 'Advisory' items are lower-risk tidy-ups. Each flag points you to a specific reference to inspect against the original source."
                />
              </span>
            }
            subtitle={`${assessment.flags.length} item(s) grouped by severity. Resolve critical flags before submission.`}
            right={
              <div className="flex flex-wrap gap-1.5">
                {SEVERITY_ORDER.map((sev) =>
                  grouped[sev].length ? (
                    <Badge key={sev} kind={SEVERITY_META[sev].badge}>
                      {SEVERITY_META[sev].label}: {grouped[sev].length}
                    </Badge>
                  ) : null
                )}
              </div>
            }
          />
          <CardBody className="grid gap-4">
            {SEVERITY_ORDER.map((sev) =>
              grouped[sev].length ? (
                <div key={sev} className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <Badge kind={SEVERITY_META[sev].badge}>
                      {SEVERITY_META[sev].label}
                    </Badge>
                    <span className="text-xs text-med-sub">
                      {grouped[sev].length} item(s)
                    </span>
                  </div>
                  <ul className="grid gap-2">
                    {grouped[sev].map((f, i) => (
                      <li
                        key={`${sev}-${i}`}
                        className="border border-med-line rounded-lg p-3 bg-white"
                      >
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <Badge kind="neutral">
                            {f.refIndex >= 0
                              ? `Reference ${f.refIndex + 1}`
                              : "Reference list"}
                          </Badge>
                          <Badge kind={SEVERITY_META[f.severity].badge}>
                            {KIND_LABEL[f.kind]}
                          </Badge>
                          <InfoHint
                            side="right"
                            title={`Why "${KIND_LABEL[f.kind]}" needs review`}
                            text={KIND_HELP[f.kind]}
                          />
                        </div>
                        <p className="text-sm text-med-ink">{f.message}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
