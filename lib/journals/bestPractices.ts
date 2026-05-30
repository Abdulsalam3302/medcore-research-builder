/**
 * Journal-selection best practices — curated, attributed guidance shown in the
 * Journal Finder to actively coach researchers through the hardest, most
 * error-prone step of publishing: choosing where to submit.
 *
 * Sources are real, authoritative initiatives. We quote the principle and
 * attribute it; users should consult the linked source for the full checklist.
 */

export type BestPractice = {
  id: string;
  step: string;
  principle: string;
  why: string;
  source: string;
  sourceUrl: string;
};

export const journalBestPractices: BestPractice[] = [
  {
    id: "tcs-think",
    step: "Think — is this journal right and trustworthy?",
    principle:
      "Before submitting, confirm you (or colleagues) know the journal, can easily find and contact the publisher, the journal is clearly indexed where it claims, and the editorial board lists real, identifiable experts.",
    why: "Trusted-journal verification is the single best defense against predatory venues that waste your work, fees, and reputation.",
    source: "Think. Check. Submit. (10 years; 2025)",
    sourceUrl: "https://thinkchecksubmit.org/journals/",
  },
  {
    id: "scope-fit",
    step: "Match scope before metrics",
    principle:
      "Read the journal's Aims & Scope and the last 1–2 years of articles. Your topic, study type, and methods should resemble what they already publish.",
    why: "Scope mismatch is a leading cause of desk rejection — editors reject out-of-scope papers without review, costing weeks.",
    source: "EIFL journal-selection checklist",
    sourceUrl: "https://eifl.net/choosing-journal-your-research-checklist-researchers-and-librarians",
  },
  {
    id: "indexing-verify",
    step: "Verify indexing at the official source",
    principle:
      "Confirm MEDLINE/PubMed, Web of Science (SCIE vs ESCI), Scopus, and DOAJ status on the official registries — not on the journal's own marketing page.",
    why: "Predatory journals routinely claim fake or non-standard 'impact factors' (e.g. GIF, UIF, Index Copernicus). Only Clarivate JIF, Scopus CiteScore, and SCImago SJR are standard.",
    source: "Beall's List / DOAJ / Clarivate",
    sourceUrl: "https://beallslist.net/",
  },
  {
    id: "predatory-redflags",
    step: "Screen for predatory red flags",
    principle:
      "Be wary of: unsolicited flattering invitations, promises of acceptance in days, guaranteed publication, hidden or surprise fees, fake editors, and poor-quality websites.",
    why: "Unrealistically fast 'peer review' and aggressive solicitation are hallmarks of predatory publishing.",
    source: "COPE / OASPA red-flag guidance",
    sourceUrl: "https://publicationethics.org/",
  },
  {
    id: "cost-model",
    step: "Decide on the cost & access model up front",
    principle:
      "Know whether the journal is subscription (no APC, paywalled), gold OA (you pay an APC), hybrid, or diamond/platinum OA (free to publish AND free to read). Check waiver eligibility if cost is a barrier.",
    why: "APCs range from $0 to >$5,000. Many excellent society and diamond-OA journals charge nothing — cost should be a deliberate choice, not a surprise.",
    source: "DOAJ open-access directory",
    sourceUrl: "https://doaj.org/",
  },
  {
    id: "timeline",
    step: "Factor in speed (time to decision)",
    principle:
      "If timing matters (graduation, grant, priority), weigh the journal's typical time to first decision and publication frequency — but never trade rigor for speed.",
    why: "Review timelines range from days (often a red flag) to many months; align the journal to your real deadline.",
    source: "ThinkScience journal-selection guide",
    sourceUrl: "https://thinkscience.co.jp/en/articles/choosing-the-right-journal",
  },
  {
    id: "matching-tools",
    step: "Use matching tools as a shortlist, not a verdict",
    principle:
      "Tools like JANE (PubMed-based), Elsevier Journal Finder, and Web of Science Manuscript Matcher suggest journals from your title/abstract — use them to build a shortlist, then verify each candidate manually.",
    why: "Automated matchers rank by textual similarity and metrics; they don't judge scope fit, ethics, or your specific constraints.",
    source: "Medical-library journal-matching guides (JANE/Elsevier/WoS)",
    sourceUrl: "https://jane.biosemantics.org/",
  },
  {
    id: "tier-strategy",
    step: "Build a tiered submission ladder",
    principle:
      "Pick a realistic first-choice plus 2–3 backups across impact tiers. Don't aim only at the top or only at the safe option — sequence them.",
    why: "A planned ladder turns a rejection into a fast pivot instead of months of indecision.",
    source: "Editage publication guidance",
    sourceUrl: "https://www.editage.com/all-about-publication/journal-submissions/how-to-choose-the-right-journal-fo-your-research",
  },
];
