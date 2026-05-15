/**
 * Europe PMC client.
 * https://europepmc.org/RestfulWebService
 *
 * Free, no key required. Strengths over plain PubMed:
 *  - Indexes preprints (bioRxiv, medRxiv) alongside peer-reviewed papers.
 *  - Open-access full-text retrieval for PMC-hosted articles.
 *  - Surfaces a `hasPDF`/`isOpenAccess` flag inline.
 */

const BASE = "https://www.ebi.ac.uk/europepmc/webservices/rest";

export type EuropePMCPaper = {
  id: string;
  source: string; // MED, PMC, PPR (preprint), etc.
  pmid?: string;
  pmcid?: string;
  doi?: string;
  title: string;
  authors: string[];
  journal?: string;
  year?: string;
  isOpenAccess: boolean;
  isPreprint: boolean;
  hasFullText: boolean;
  citedByCount?: number;
  url: string;
  abstract?: string;
};

export async function europepmcSearch(args: {
  query: string;
  pageSize?: number;
  resultType?: "lite" | "core";
  includePreprints?: boolean;
}): Promise<EuropePMCPaper[]> {
  const p = new URLSearchParams();
  // include preprints by default — that's the main reason to use EuPMC
  const q = args.includePreprints === false
    ? args.query
    : `${args.query} AND (SRC:MED OR SRC:PMC OR SRC:PPR)`;
  p.set("query", q);
  p.set("format", "json");
  p.set("pageSize", String(Math.min(args.pageSize ?? 25, 100)));
  p.set("resultType", args.resultType ?? "lite");
  const res = await fetch(`${BASE}/search?${p.toString()}`, {
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new Error(`EuropePMC ${res.status}`);
  const data = (await res.json()) as {
    resultList?: { result?: Array<Record<string, unknown>> };
  };
  const items = data.resultList?.result || [];
  return items.map((r) => {
    const source = (r.source as string) || "";
    const id = (r.id as string) || "";
    const pmid = (r.pmid as string) || undefined;
    const pmcid = (r.pmcid as string) || undefined;
    const doi = (r.doi as string) || undefined;
    const authorString = (r.authorString as string) || "";
    const authors = authorString
      ? authorString.split(/,\s*/).map((s) => s.trim()).filter(Boolean)
      : [];
    return {
      id,
      source,
      pmid,
      pmcid,
      doi,
      title: (r.title as string) || "",
      authors,
      journal: (r.journalTitle as string) || undefined,
      year: r.pubYear ? String(r.pubYear) : undefined,
      isOpenAccess: (r.isOpenAccess as string) === "Y",
      isPreprint: source === "PPR",
      hasFullText: (r.hasTextMinedTerms as string) === "Y" || (r.hasPDF as string) === "Y",
      citedByCount: (r.citedByCount as number) || undefined,
      url:
        doi ? `https://doi.org/${doi}` :
        pmid ? `https://europepmc.org/article/MED/${pmid}` :
        pmcid ? `https://europepmc.org/article/PMC/${pmcid.replace(/^PMC/i, "")}` :
        `https://europepmc.org/abstract/${source}/${id}`,
      abstract: (r.abstractText as string) || undefined,
    };
  });
}

/**
 * Pull the full-text XML for a PMC article when available.
 * Returns null if not in open-access subset.
 */
export async function europepmcFullText(pmcid: string): Promise<string | null> {
  const id = pmcid.replace(/^PMC/i, "");
  const res = await fetch(`${BASE}/PMC${id}/fullTextXML`, {
    headers: { accept: "application/xml" },
  });
  if (!res.ok) return null;
  return res.text();
}
