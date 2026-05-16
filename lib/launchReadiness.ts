import type {
  ResearchLaunchAnswers,
  LaunchReadinessSummary,
  DurationBucket,
} from "./types";

const DURATION_LABEL: Record<DurationBucket, string> = {
  lt1m: "Under 1 month",
  "1to3m": "1–3 months",
  "3to6m": "3–6 months",
  "6to12m": "6–12 months",
  gt12m: "Over 12 months",
};

export function durationLabel(b?: DurationBucket): string {
  return b ? DURATION_LABEL[b] : "Not set";
}

export function recommendedDesignsFor(b?: DurationBucket): {
  designs: string[];
  rationale: string;
} {
  switch (b) {
    case "lt1m":
      return {
        designs: [
          "Narrative review (if data not yet collected)",
          "Case report / case series (if patient data already gathered)",
          "Letter to the editor / commentary",
          "Original article — only if dataset is already cleaned and analysis-ready",
        ],
        rationale:
          "Under one month, the only realistic original work is a write-up of an already-collected, already-cleaned dataset. Otherwise pick a synthesis or short-form publication that needs no new data.",
      };
    case "1to3m":
      return {
        designs: [
          "Retrospective chart review / cross-sectional study (secondary data)",
          "Scoping review or rapid review",
          "Diagnostic accuracy study with existing data",
          "Quality-improvement report (single PDSA cycle)",
          "Case series",
        ],
        rationale:
          "1–3 months fits secondary-data designs and retrospective/cross-sectional questions. Skip prospective recruitment unless your IRB and instruments are already in place.",
      };
    case "3to6m":
      return {
        designs: [
          "Prospective cohort (short follow-up)",
          "Case-control study",
          "Systematic review (without meta-analysis)",
          "Pilot / feasibility RCT",
          "Mixed-methods quality-improvement",
        ],
        rationale:
          "3–6 months supports light prospective work and structured synthesis. PRISMA/CONSORT-pilot timelines are realistic if the team and protocol are ready on day one.",
      };
    case "6to12m":
      return {
        designs: [
          "Systematic review with meta-analysis",
          "Single-centre RCT",
          "Cost-effectiveness / economic evaluation (CHEERS)",
          "Diagnostic / prognostic prediction model (TRIPOD)",
          "Multi-site cohort",
        ],
        rationale:
          "6–12 months is the natural window for a full RCT, a meta-analysis with PROSPERO registration, or an economic evaluation paired with a clinical study.",
      };
    case "gt12m":
      return {
        designs: [
          "Multi-centre RCT",
          "Long-term cohort with hard outcomes",
          "Implementation / hybrid effectiveness-implementation trial",
          "Qualitative or mixed-methods programme of work",
          "Health-technology assessment / full economic evaluation",
        ],
        rationale:
          "Over 12 months unlocks designs that need long follow-up, multi-site coordination, or layered qualitative + quantitative components.",
      };
    default:
      return {
        designs: [],
        rationale: "Set a target duration to see design suggestions.",
      };
  }
}

export function scoreLaunch(a: ResearchLaunchAnswers | undefined): LaunchReadinessSummary {
  const v = a || {};
  const yes = (x?: string) => x === "yes";
  const partial = (x?: string) => x === "partial";

  // Pillar: team (0–100)
  let team = 0;
  if (yes(v.hasTeam)) team += 25;
  else if (partial(v.hasTeam)) team += 12;
  if (yes(v.hasPI)) team += 25;
  else if (partial(v.hasPI)) team += 12;
  if (yes(v.hasSeniorResearcher)) team += 20;
  else if (partial(v.hasSeniorResearcher)) team += 10;
  if (yes(v.hasLeader)) team += 20;
  if (v.rolesAssigned) team += 10;

  // Pillar: authorship
  let authorship = 0;
  if (v.firstAuthorDecided) authorship += 35;
  if (v.authorshipOrderAgreed) authorship += 25;
  if (v.correspondingAuthorDecided) authorship += 20;
  if (v.icmjeReviewed) authorship += 20;

  // Pillar: pre-requisites
  let prereqs = 0;
  if (v.researchTypeKnown) prereqs += 15;
  const irbReady =
    v.irbStatus === "approved" || v.irbStatus === "not-required";
  if (irbReady) prereqs += 25;
  else if (v.irbStatus === "submitted") prereqs += 12;
  const dataReady =
    v.dataStatus === "collected-clean" || v.dataStatus === "secondary-available";
  if (dataReady) prereqs += 30;
  else if (v.dataStatus === "collected-raw") prereqs += 18;
  else if (v.dataStatus === "in-collection") prereqs += 8;
  if (v.questionnaireStatus === "validated" || v.questionnaireStatus === "not-needed")
    prereqs += 15;
  else if (v.questionnaireStatus === "draft") prereqs += 7;
  if (
    v.registrationStatus === "registered" ||
    v.registrationStatus === "not-required"
  )
    prereqs += 10;
  else if (v.registrationStatus === "in-progress") prereqs += 5;
  if (v.consentStatus === "obtained" || v.consentStatus === "not-required")
    prereqs += 5;

  // Pillar: budget
  let budget = 0;
  if (v.budgetPlanned) budget += 30;
  if (yes(v.fundingSecured)) budget += 40;
  else if (partial(v.fundingSecured)) budget += 20;
  const items = v.budgetItems || {};
  const itemKeys = Object.values(items).filter(Boolean).length;
  budget += Math.min(30, itemKeys * 4);

  // Pillar: methodology
  let methodology = 0;
  if (yes(v.statisticianAvailable) || v.statisticianAvailable === "external")
    methodology += 30;
  if (v.analysisPlanReady) methodology += 25;
  if (v.outcomeMeasuresDefined) methodology += 25;
  if (v.sampleSizeJustified) methodology += 20;

  // Pillar: journal & timeline
  let journalAndTimeline = 0;
  if (v.targetJournalKnown) journalAndTimeline += 30;
  if (v.manuscriptTypeKnown) journalAndTimeline += 20;
  if (v.referenceManagerReady) journalAndTimeline += 15;
  if (v.coiDisclosed) journalAndTimeline += 10;
  if (v.aiUsePolicyReviewed) journalAndTimeline += 10;
  if (v.dataSharingPlanned) journalAndTimeline += 15;

  const pillarScores = {
    team: clamp(team),
    authorship: clamp(authorship),
    prereqs: clamp(prereqs),
    budget: clamp(budget),
    methodology: clamp(methodology),
    journalAndTimeline: clamp(journalAndTimeline),
  };
  const totalScore = Math.round(
    (pillarScores.team * 0.18 +
      pillarScores.authorship * 0.12 +
      pillarScores.prereqs * 0.25 +
      pillarScores.budget * 0.13 +
      pillarScores.methodology * 0.18 +
      pillarScores.journalAndTimeline * 0.14)
  );

  // Accelerators
  const acc: string[] = [];
  if (dataReady) acc.push("Dataset is already collected and analysis-ready.");
  if (v.questionnaireStatus === "validated")
    acc.push("Validated instrument in hand — no instrument-development cycle.");
  if (v.targetJournalKnown)
    acc.push("Target journal chosen — format & limits locked from day one.");
  if (yes(v.statisticianAvailable))
    acc.push("Statistician on the team — analysis won't bottleneck.");
  if (v.firstAuthorDecided && v.authorshipOrderAgreed)
    acc.push("Authorship is settled — no late re-ordering disputes.");
  if (irbReady) acc.push("IRB cleared (or not required) — no regulatory wait.");
  if (yes(v.fundingSecured))
    acc.push("Funding secured — APC and tooling won't stall submission.");
  if (v.referenceManagerReady)
    acc.push("Reference manager configured — citation format painless.");
  if (v.analysisPlanReady)
    acc.push("Analysis plan pre-specified — protects against p-hacking and reviewer pushback.");

  // Decelerators / blockers
  const dec: string[] = [];
  const blockers: string[] = [];
  if (v.dataStatus === "in-collection")
    dec.push("Data collection still running — analysis can't start.");
  if (v.dataStatus === "not-started")
    blockers.push("Data has not been collected yet.");
  if (v.irbStatus === "not-started")
    blockers.push("IRB submission has not started — required before any human-subject data.");
  if (v.irbStatus === "submitted")
    dec.push("IRB submitted but not approved — recruitment / collection must wait.");
  if (v.questionnaireStatus === "not-started")
    dec.push("Questionnaire / instrument not chosen — instrument development is slow.");
  if (v.hasPI === "no") blockers.push("No PI / consultant — most journals require senior author with ICMJE authorship.");
  if (v.hasTeam === "no") dec.push("Solo work — no peer review of drafts before submission.");
  if (v.statisticianAvailable === "no")
    dec.push("No statistician — expect rework on Methods/Results.");
  if (!v.firstAuthorDecided)
    dec.push("First author not decided — authorship disputes derail timelines.");
  if (!v.budgetPlanned)
    dec.push("No budget plan — APC and editing fees often surface late.");
  if (v.fundingSecured === "no")
    dec.push("No funding secured — open-access journals may be unaffordable.");
  if (!v.targetJournalKnown)
    dec.push("Target journal not chosen — formatting will need redo at submission.");
  if (!v.coiDisclosed)
    dec.push("Conflicts of interest not collected — required at submission.");
  if (v.registrationStatus === "not-started" && v.researchTypeNote?.match(/trial|RCT|prospective/i))
    blockers.push("Trial registration not started — required before first participant for prospective trials.");

  const reco = recommendedDesignsFor(v.durationTarget);

  return {
    totalScore,
    pillarScores,
    acceleratingFactors: acc,
    deceleratingFactors: dec,
    recommendedDesigns: reco.designs,
    recommendationRationale: reco.rationale,
    blockers,
  };
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}
