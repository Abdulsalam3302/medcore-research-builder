/**
 * oaResolver — given a DOI, return the best legal open-access PDF
 * by combining Unpaywall (publisher + author-deposited copies) and
 * Semantic Scholar's openAccessPdf field as fallback.
 */

import { unpaywallConfigured, unpaywallLookup } from "@/lib/scholarly/unpaywall";
import { s2Paper } from "@/lib/scholarly/semanticscholar";

export type OAResolution = {
  doi: string;
  isOA: boolean;
  source: "unpaywall" | "s2" | "none";
  oaStatus?: string;
  pdfUrl?: string;
  landingUrl?: string;
};

export async function resolveOpenAccess(doi: string): Promise<OAResolution> {
  if (unpaywallConfigured()) {
    const up = await unpaywallLookup(doi).catch(() => null);
    if (up?.isOA && (up.bestOaPdfUrl || up.bestOaLandingUrl)) {
      return {
        doi,
        isOA: true,
        source: "unpaywall",
        oaStatus: up.oaStatus,
        pdfUrl: up.bestOaPdfUrl,
        landingUrl: up.bestOaLandingUrl,
      };
    }
  }
  const s2 = await s2Paper(`DOI:${doi}`).catch(() => null);
  if (s2?.openAccessPdfUrl) {
    return {
      doi,
      isOA: true,
      source: "s2",
      pdfUrl: s2.openAccessPdfUrl,
      landingUrl: s2.url,
    };
  }
  return { doi, isOA: false, source: "none" };
}
