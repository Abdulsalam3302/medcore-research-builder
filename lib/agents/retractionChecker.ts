/**
 * retractionChecker — flags retraction / expression-of-concern signals
 * for a DOI by cross-referencing Crossref (relation types) and OpenAlex
 * (work types and titles).
 */

import { crossrefByDOI } from "@/lib/scholarly/crossref";
import { openalexSearch } from "@/lib/scholarly/openalex";

export type RetractionCheck = {
  doi: string;
  isRetracted: boolean;
  isExpressionOfConcern: boolean;
  signals: string[];
  crossrefType?: string;
  crossrefRelations?: string[];
  retractionWatchLink?: string;
};

export async function checkRetraction(doi: string): Promise<RetractionCheck> {
  const signals: string[] = [];
  let isRetracted = false;
  let isExpressionOfConcern = false;

  const cr = await crossrefByDOI(doi).catch(() => null);
  if (cr) {
    if (cr.type === "retraction") {
      isRetracted = true;
      signals.push("crossref:type=retraction");
    }
    if (cr.relations?.some((r) => /retract/i.test(r))) {
      isRetracted = true;
      signals.push(`crossref:relations=${cr.relations.join(",")}`);
    }
    if (/retracted|withdrawn/i.test(cr.title)) {
      isRetracted = true;
      signals.push("crossref:title contains retraction word");
    }
    if (/expression of concern/i.test(cr.title)) {
      isExpressionOfConcern = true;
      signals.push("crossref:title=expression of concern");
    }
  }

  // OpenAlex doesn't expose a clean retraction field, but a follow-up
  // search by DOI usually reveals retraction notices linked to the work.
  const oa = await openalexSearch({ query: `doi:${doi}`, perPage: 5 }).catch(() => []);
  for (const w of oa) {
    if (/retracted|retraction/i.test(w.title)) {
      isRetracted = true;
      signals.push(`openalex:title flag (${w.title.slice(0, 60)}…)`);
    }
  }

  return {
    doi,
    isRetracted,
    isExpressionOfConcern,
    signals,
    crossrefType: cr?.type,
    crossrefRelations: cr?.relations,
    retractionWatchLink: `https://retractionwatch.com/?s=${encodeURIComponent(doi)}`,
  };
}
