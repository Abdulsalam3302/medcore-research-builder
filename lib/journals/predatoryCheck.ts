/**
 * Interactive predatory-journal self-assessment, modeled on Think.Check.Submit
 * and standard COPE/DOAJ red-flag guidance. The researcher answers yes/no to
 * concrete questions; we compute a risk read. This is an aid, not a verdict —
 * always cross-check at thinkchecksubmit.org and the official indexes.
 */

export type CheckQuestion = {
  id: string;
  question: string;
  /** "yes" is the SAFE answer for green items; "yes" is the RISK for redFlag items. */
  kind: "green" | "redFlag";
  weight: number;
  help: string;
};

export const predatoryQuestions: CheckQuestion[] = [
  { id: "known", kind: "green", weight: 2, question: "Do you or colleagues know this journal, or have you read/cited articles from it?", help: "Familiarity is the first Think.Check.Submit check." },
  { id: "indexed", kind: "green", weight: 3, question: "Is it indexed where it claims (verified on MEDLINE/Scopus/WoS/DOAJ — not just the journal's own page)?", help: "Verify indexing at the official registry, never the journal's marketing." },
  { id: "editors", kind: "green", weight: 2, question: "Does it list a real, identifiable editorial board with verifiable affiliations?", help: "Predatory journals often list fake or non-consenting editors." },
  { id: "contact", kind: "green", weight: 1, question: "Can you easily find the publisher's full name, address, and a real contact?", help: "Transparency of the publisher is a trust signal." },
  { id: "fees", kind: "green", weight: 2, question: "Are the publishing fees (APC) clearly stated up front?", help: "Hidden or surprise fees after acceptance are a red flag." },
  { id: "peer", kind: "green", weight: 2, question: "Is there a clearly described, plausible peer-review process?", help: "Legitimate review takes weeks, not hours." },
  { id: "cope", kind: "green", weight: 1, question: "Is the journal/publisher a member of COPE, DOAJ, OASPA, or ICMJE?", help: "Membership signals commitment to ethics standards." },

  { id: "spam", kind: "redFlag", weight: 2, question: "Did they reach you via an unsolicited, flattering email inviting a submission?", help: "Aggressive solicitation is a hallmark of predatory publishing." },
  { id: "fast", kind: "redFlag", weight: 3, question: "Do they promise very fast review or guaranteed acceptance (e.g. days)?", help: "Unrealistically fast 'peer review' is a major red flag." },
  { id: "fakeMetric", kind: "redFlag", weight: 3, question: "Do they advertise an unusual 'impact factor' (e.g. GIF, UIF, Index Copernicus, Citefactor)?", help: "Only Clarivate JIF, Scopus CiteScore, and SCImago SJR are standard; others are often fake." },
  { id: "quality", kind: "redFlag", weight: 1, question: "Is the website full of spelling/grammar errors or broken links?", help: "Low production quality often accompanies predatory operations." },
  { id: "scope", kind: "redFlag", weight: 1, question: "Is the scope absurdly broad (one journal covering unrelated fields)?", help: "Mega-broad scope to maximize fee volume is a warning sign." },
];

export type CheckAnswer = "yes" | "no" | "unsure";

export type PredatoryResult = {
  score: number; // 0..100 (higher = safer)
  verdict: "looks-legitimate" | "mostly-ok" | "caution" | "likely-predatory";
  greenHits: number;
  redFlagHits: number;
  advice: string;
};

export function assessPredatory(answers: Record<string, CheckAnswer>): PredatoryResult {
  let earned = 0;
  let possible = 0;
  let greenHits = 0;
  let redFlagHits = 0;

  for (const q of predatoryQuestions) {
    const a = answers[q.id] || "unsure";
    if (q.kind === "green") {
      possible += q.weight;
      if (a === "yes") { earned += q.weight; greenHits++; }
      else if (a === "unsure") earned += q.weight * 0.4;
    } else {
      // red flags subtract from the safety pool when answered "yes".
      possible += q.weight;
      if (a === "no") earned += q.weight;
      else if (a === "unsure") earned += q.weight * 0.4;
      else if (a === "yes") redFlagHits++;
    }
  }

  let score = Math.round((earned / possible) * 100);
  if (redFlagHits >= 1) score = Math.min(score, 60);
  if (redFlagHits >= 3) score = Math.min(score, 30);
  score = Math.max(0, Math.min(100, score));

  const verdict: PredatoryResult["verdict"] =
    redFlagHits >= 3 || score < 35 ? "likely-predatory" : score < 55 ? "caution" : score < 75 ? "mostly-ok" : "looks-legitimate";

  const advice =
    verdict === "looks-legitimate"
      ? "Signals look healthy. Still confirm scope fit and complete the Think.Check.Submit checklist for peace of mind."
      : verdict === "mostly-ok"
        ? "Mostly reassuring, but resolve the unsure/weak items before committing — verify indexing officially."
        : verdict === "caution"
          ? "Enough concerns to pause. Independently verify the journal before submitting or paying any fee."
          : "Strong predatory signals. Do NOT submit or pay until you have independently confirmed legitimacy (Think.Check.Submit, DOAJ, your librarian).";

  return { score, verdict, greenHits, redFlagHits, advice };
}
