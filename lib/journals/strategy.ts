/**
 * Journal submission strategy — turns a ranked match list into a sequenced,
 * tiered submission ladder (Reach → Match → Safe), the best-practice approach
 * to publishing: aim high but plan your pivots so a rejection costs days, not
 * months.
 *
 * Pure + offline. Uses anticipated impact + trust + fit score to tier.
 */

import type { JournalMatch, JournalRecord } from "./types";
import { anticipateImpact, assessTrust } from "./anticipate";

export type LadderTier = "reach" | "match" | "safe";

export type LadderRung = {
  tier: LadderTier;
  journal: JournalRecord;
  fitScore: number;
  impactLabel: string;
  trustLevel: string;
  rationale: string;
  cost: string;
};

export type SubmissionStrategy = {
  rungs: LadderRung[];
  plan: string[];
  cautions: string[];
};

function costLabel(j: JournalRecord): string {
  if (j.freeApc || j.apcModel === "none" || j.oaModel === "diamond") return "free to publish";
  if (typeof j.apcUsd === "number") return `APC ≈ $${j.apcUsd.toLocaleString()}`;
  if (j.apcModel === "subscription") return "subscription (no APC)";
  return "cost unconfirmed";
}

/**
 * Build a 3-tier ladder from ranked matches. We rank by a blend of the finder's
 * fit score and anticipated impact, then split into reach / match / safe so the
 * author submits top-down and pivots fast.
 */
export function buildSubmissionStrategy(matches: JournalMatch[]): SubmissionStrategy {
  const cautions: string[] = [];
  // Only consider reasonably-credible venues for the ladder.
  const credible = matches.filter((m) => {
    const t = assessTrust(m.journal);
    if (t.level === "high-risk") {
      cautions.push(`Excluded "${m.journal.name}" from the ladder — credibility red flags (verify via Think.Check.Submit).`);
      return false;
    }
    return true;
  });

  if (credible.length === 0) {
    return {
      rungs: [],
      plan: ["Run the finder first, or broaden filters — no credible matches to plan a ladder yet."],
      cautions,
    };
  }

  // Composite rank: fit (0..100) + anticipated impact (scaled).
  const ranked = [...credible]
    .map((m) => {
      const imp = anticipateImpact(m.journal);
      const impVal = imp.value ?? 0;
      const composite = m.score + Math.min(40, impVal * 2);
      return { m, imp, impVal, composite };
    })
    .sort((a, b) => b.composite - a.composite);

  const rungs: LadderRung[] = [];
  const assign = (tier: LadderTier, entry: (typeof ranked)[number]) => {
    const t = assessTrust(entry.m.journal);
    rungs.push({
      tier,
      journal: entry.m.journal,
      fitScore: entry.m.score,
      impactLabel: entry.imp.label,
      trustLevel: t.level,
      cost: costLabel(entry.m.journal),
      rationale:
        tier === "reach"
          ? "Ambitious target — highest impact/fit; expect tougher review."
          : tier === "match"
            ? "Realistic best-fit — strong alignment of scope, impact, and credibility."
            : "Reliable fallback — solid, credible venue likely to accept sound work.",
    });
  };

  // Pick spread across the ranked list: top = reach, middle = match, lower = safe.
  if (ranked.length === 1) {
    assign("match", ranked[0]);
  } else if (ranked.length === 2) {
    assign("reach", ranked[0]);
    assign("safe", ranked[1]);
  } else {
    assign("reach", ranked[0]);
    // 1-2 match-tier from the upper-middle.
    const midStart = 1;
    assign("match", ranked[midStart]);
    if (ranked.length >= 5) assign("match", ranked[midStart + 1]);
    // safe from the lower third.
    assign("safe", ranked[ranked.length - 1]);
    if (ranked.length >= 6) assign("safe", ranked[ranked.length - 2]);
  }

  const plan = [
    `1. Submit first to your top choice (${rungs.find((r) => r.tier === "reach")?.journal.name || rungs[0].journal.name}). Format to its author guidelines before submitting.`,
    "2. If rejected, do NOT delay — read the reviewer comments, address what's fair, and pivot to your next tier within days.",
    `3. Keep a credible fallback (${rungs.find((r) => r.tier === "safe")?.journal.name || rungs[rungs.length - 1].journal.name}) so the paper always has a home.`,
    "4. Re-verify each journal's current indexing, scope, and APC at the official source before each submission.",
    "5. Never submit to more than one journal at a time (simultaneous submission breaches publication ethics).",
  ];
  cautions.push("This ladder is a planning aid based on fit + anticipated metrics — confirm scope fit by reading recent issues of each journal.");

  return { rungs, plan, cautions };
}
