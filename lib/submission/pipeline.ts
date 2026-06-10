/**
 * Submission pipeline knowledge — deterministic guidance for every stage of
 * the journey from journal shortlist to publication. No LLM, no fabrication:
 * this is editorial-process best practice (ICMJE/COPE-aligned), surfaced at
 * the moment each stage begins.
 */

import type { SubmissionRecord, SubmissionStatus } from "@/lib/types";

export type StageSpec = {
  status: SubmissionStatus;
  label: string;
  /** Short phase grouping for the stepper. */
  group: "selection" | "submission" | "peer-review" | "decision" | "closed";
  color: "sky" | "amber" | "violet" | "emerald" | "rose" | "slate";
  /** What this stage means. */
  meaning: string;
  /** Concrete do-this-now checklist for the researcher. */
  actions: string[];
  /** The classic mistake at this stage. */
  pitfall: string;
};

export const STAGES: StageSpec[] = [
  {
    status: "shortlisted",
    label: "Shortlisted",
    group: "selection",
    color: "sky",
    meaning: "The journal is a candidate target — fit, indexing, and cost still need confirmation.",
    actions: [
      "Verify indexing claims at the official source (Web of Science Master Journal List, Scopus source list, NLM Catalog, DOAJ).",
      "Read the aims & scope page and 2–3 recent papers similar to yours.",
      "Confirm the APC (article-processing charge) and any waiver policy in writing.",
      "Run the predatory self-check in Journal Finder before investing formatting time.",
    ],
    pitfall: "Trusting a journal's own marketing claims about impact factor or indexing without checking the official lists.",
  },
  {
    status: "formatting",
    label: "Formatting",
    group: "submission",
    color: "amber",
    meaning: "You committed to this journal and are preparing the manuscript to its author guidelines.",
    actions: [
      "Apply the journal's reference style, abstract structure, and word/figure limits (see Journal Finder → submission formatting).",
      "Prepare required statements: ethics approval, consent, conflicts of interest, data availability, funding, AI-use disclosure.",
      "Complete the reporting-guideline checklist (CONSORT/STROBE/PRISMA/…) — many journals require it as a supplement.",
      "Draft the cover letter (Cover Letter tool) naming the journal and why the work fits its scope.",
    ],
    pitfall: "Reformatting references manually at the last minute — lock the target journal before final reference formatting.",
  },
  {
    status: "submitted",
    label: "Submitted",
    group: "submission",
    color: "amber",
    meaning: "The manuscript is in the journal's system awaiting editorial triage (desk review).",
    actions: [
      "Record the manuscript/tracking ID from the submission system here.",
      "Confirm all co-authors received and approved the submitted version (ICMJE authorship).",
      "Do not submit the same manuscript elsewhere — duplicate submission is a COPE violation.",
      "Expect desk-decision in ~1–4 weeks; only query the editor after the journal's stated triage window passes.",
    ],
    pitfall: "Querying the editorial office too early — check the journal's published average time-to-first-decision first.",
  },
  {
    status: "under_review",
    label: "Under review",
    group: "peer-review",
    color: "violet",
    meaning: "The manuscript passed desk review and is with peer reviewers.",
    actions: [
      "Use the waiting time well: run the Reviewer Simulator and fix what it finds — real reviewers often flag the same issues.",
      "Keep your dataset and analysis code organized — reviewers may request them.",
      "If no decision after the journal's stated review window (often 8–12 weeks), send one polite status query.",
    ],
    pitfall: "Letting the project go cold — prepare your revision infrastructure (point-by-point response template) now.",
  },
  {
    status: "major_revision",
    label: "Major revision",
    group: "peer-review",
    color: "violet",
    meaning: "Reviewers see merit but require substantial changes — this is a positive signal, not a rejection.",
    actions: [
      "Build a point-by-point response: quote every reviewer comment, answer it, and cite the exact manuscript change (page/line).",
      "Be gracious and specific; where you disagree, rebut with evidence and citations, never with tone.",
      "Track all manuscript changes (tracked-changes copy + clean copy are usually both required).",
      "Re-run the coherence check and quality gate after edits — revisions often break numbers between sections.",
      "Respect the revision deadline; ask for an extension early if the new analyses need it.",
    ],
    pitfall: "Answering reviewers in the response letter but forgetting to make the matching change in the manuscript itself.",
  },
  {
    status: "minor_revision",
    label: "Minor revision",
    group: "peer-review",
    color: "violet",
    meaning: "The journal intends to accept once small issues are fixed.",
    actions: [
      "Address every point — 'minor' still requires a complete point-by-point response.",
      "Proofread the full manuscript again, not only the changed parts.",
      "Verify references one final time (Citation Verification lane) — retraction status can change during review.",
    ],
    pitfall: "Introducing new errors while rushing minor fixes — re-run the quality gate before resubmitting.",
  },
  {
    status: "accepted",
    label: "Accepted",
    group: "decision",
    color: "emerald",
    meaning: "Editorial acceptance — production (proofs, copy-editing) begins.",
    actions: [
      "Check proofs carefully within the publisher's window — numbers, author names, affiliations, and tables are where errors hide.",
      "Confirm the license you sign (CC BY vs publisher transfer) matches your funder's open-access mandate.",
      "Register/Update the trial or protocol registry record with the publication reference if applicable.",
      "Prepare your Impact Studio assets (lay summary, social post) for publication day.",
    ],
    pitfall: "Rubber-stamping proofs — production introduces real errors, especially in tables and units.",
  },
  {
    status: "rejected",
    label: "Rejected",
    group: "closed",
    color: "rose",
    meaning: "This journal said no — most published papers were rejected at least once.",
    actions: [
      "Mine the reviews: every substantive reviewer point fixed now raises the odds at the next journal.",
      "Return to Journal Finder and pick the next target from your tiered strategy (reach → match → safe).",
      "Reformat for the new journal before resubmitting; do not send the old journal's formatting.",
      "If you believe the decision was procedurally unfair, a measured appeal is possible — but moving on is usually faster.",
    ],
    pitfall: "Resubmitting elsewhere unchanged — reviewers overlap between journals and may receive it again.",
  },
  {
    status: "withdrawn",
    label: "Withdrawn",
    group: "closed",
    color: "slate",
    meaning: "You formally withdrew the submission (e.g., excessive delay or a better venue).",
    actions: [
      "Withdraw in writing and wait for confirmation before submitting elsewhere — until confirmed, it counts as duplicate submission.",
      "Record the reason here for your own audit trail.",
    ],
    pitfall: "Submitting to a new journal before the withdrawal is acknowledged.",
  },
  {
    status: "published",
    label: "Published",
    group: "decision",
    color: "emerald",
    meaning: "The paper is out — time to convert publication into impact.",
    actions: [
      "Add the DOI to your ORCID, institutional repository, and CV.",
      "Launch outreach via the Impact Studio (lay summary, conference assets, social posts).",
      "Deposit data/code as promised in the data-availability statement.",
      "Track citations and post-publication comments; correct errors transparently if found.",
    ],
    pitfall: "Stopping at publication — visibility work in the first weeks drives long-term citations.",
  },
];

export const stageByStatus = (s: SubmissionStatus): StageSpec =>
  STAGES.find((x) => x.status === s) || STAGES[0];

/** Statuses a record can move to next (forward-biased but flexible). */
export function nextStatuses(s: SubmissionStatus): SubmissionStatus[] {
  switch (s) {
    case "shortlisted":
      return ["formatting", "withdrawn"];
    case "formatting":
      return ["submitted", "shortlisted", "withdrawn"];
    case "submitted":
      return ["under_review", "rejected", "withdrawn"];
    case "under_review":
      return ["minor_revision", "major_revision", "accepted", "rejected", "withdrawn"];
    case "major_revision":
      return ["submitted", "under_review", "accepted", "rejected", "withdrawn"];
    case "minor_revision":
      return ["submitted", "under_review", "accepted", "rejected", "withdrawn"];
    case "accepted":
      return ["published"];
    case "rejected":
      return ["shortlisted"];
    case "withdrawn":
      return ["shortlisted"];
    case "published":
      return [];
  }
}

export function daysBetween(aIso: string, bIso: string): number {
  const a = Date.parse(aIso);
  const b = Date.parse(bIso);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

export type PipelineSummary = {
  total: number;
  active: number;
  inReview: number;
  outcomes: { accepted: number; published: number; rejected: number };
  /** Days since submission for records currently in review. */
  daysInReview: Array<{ journalName: string; days: number }>;
};

export function summarizePipeline(records: SubmissionRecord[]): PipelineSummary {
  const now = new Date().toISOString();
  const inReviewStatuses: SubmissionStatus[] = [
    "submitted",
    "under_review",
    "major_revision",
    "minor_revision",
  ];
  const closed: SubmissionStatus[] = ["rejected", "withdrawn", "published"];
  const daysInReview = records
    .filter((r) => inReviewStatuses.includes(r.status))
    .map((r) => {
      const submittedEvent = [...r.history].reverse().find((h) => h.status === "submitted");
      return {
        journalName: r.journalName,
        days: daysBetween(submittedEvent?.at || r.updatedAt, now),
      };
    });
  return {
    total: records.length,
    active: records.filter((r) => !closed.includes(r.status)).length,
    inReview: daysInReview.length,
    outcomes: {
      accepted: records.filter((r) => r.status === "accepted").length,
      published: records.filter((r) => r.status === "published").length,
      rejected: records.filter((r) => r.status === "rejected").length,
    },
    daysInReview,
  };
}
