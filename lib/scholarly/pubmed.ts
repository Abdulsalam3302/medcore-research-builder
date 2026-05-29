/**
 * PubMed E-utilities client.
 * https://www.ncbi.nlm.nih.gov/books/NBK25501/
 *
 * Polite usage: include tool, email, and api_key when configured.
 * Rate limits: 3 req/sec without key, 10 req/sec with key.
 */

const EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

import { scholarlyHeaders, SCHOLARLY_TIMEOUT_MS } from "./_http";

function commonParams(): URLSearchParams {
  const p = new URLSearchParams();
  p.set("tool", process.env.NCBI_TOOL || "MedCoreResearchBuilder");
  if (process.env.NCBI_EMAIL) p.set("email", process.env.NCBI_EMAIL);
  if (process.env.NCBI_API_KEY) p.set("api_key", process.env.NCBI_API_KEY);
  return p;
}

export type PubMedSummary = {
  pmid: string;
  title: string;
  authors: string[];
  journal: string;
  year: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  pubtypes: string[];
  url: string;
};

export async function pubmedSearch(args: {
  query: string;
  retmax?: number;
}): Promise<{ ids: string[]; count: number }> {
  const p = commonParams();
  p.set("db", "pubmed");
  p.set("term", args.query);
  p.set("retmax", String(args.retmax ?? 20));
  p.set("retmode", "json");
  const url = `${EUTILS}/esearch.fcgi?${p.toString()}`;
  const res = await fetch(url, {
    headers: scholarlyHeaders(),
    signal: AbortSignal.timeout(SCHOLARLY_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`PubMed esearch ${res.status}`);
  const data = (await res.json()) as {
    esearchresult?: { idlist?: string[]; count?: string };
  };
  const ids = data.esearchresult?.idlist || [];
  const count = Number(data.esearchresult?.count || "0") || 0;
  return { ids, count };
}

export async function pubmedSummary(
  pmids: string[]
): Promise<PubMedSummary[]> {
  if (pmids.length === 0) return [];
  const p = commonParams();
  p.set("db", "pubmed");
  p.set("id", pmids.join(","));
  p.set("retmode", "json");
  const url = `${EUTILS}/esummary.fcgi?${p.toString()}`;
  const res = await fetch(url, {
    headers: scholarlyHeaders(),
    signal: AbortSignal.timeout(SCHOLARLY_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`PubMed esummary ${res.status}`);
  const data = (await res.json()) as { result?: Record<string, unknown> };
  const result = data.result || {};
  const uids = (result.uids as string[]) || pmids;
  const out: PubMedSummary[] = [];
  for (const uid of uids) {
    const r = result[uid] as Record<string, unknown> | undefined;
    if (!r) continue;
    const articleIds = (r.articleids as Array<{ idtype: string; value: string }>) || [];
    const doi = articleIds.find((x) => x.idtype === "doi")?.value;
    const authors = ((r.authors as Array<{ name: string }>) || []).map((a) => a.name);
    const pubDate = (r.pubdate as string) || "";
    const yearMatch = pubDate.match(/\d{4}/);
    out.push({
      pmid: uid,
      title: (r.title as string) || "",
      authors,
      journal: (r.fulljournalname as string) || (r.source as string) || "",
      year: yearMatch ? yearMatch[0] : "",
      volume: (r.volume as string) || undefined,
      issue: (r.issue as string) || undefined,
      pages: (r.pages as string) || undefined,
      doi: doi || undefined,
      pubtypes: ((r.pubtype as string[]) || []) as string[],
      url: `https://pubmed.ncbi.nlm.nih.gov/${uid}/`,
    });
  }
  return out;
}

export async function pubmedSearchAndSummarize(args: {
  query: string;
  retmax?: number;
}): Promise<PubMedSummary[]> {
  const { ids } = await pubmedSearch(args);
  if (ids.length === 0) return [];
  return pubmedSummary(ids);
}

/**
 * PubMed Citation Matcher API.
 * https://pubmed.ncbi.nlm.nih.gov/help/#citation-matcher-api
 * Fields: jtitle, year, volume, page, name (first author surname).
 * Returns a single PMID or null.
 */
export async function pubmedCitationMatch(args: {
  journal?: string;
  year?: string;
  volume?: string;
  page?: string;
  author?: string;
  title?: string;
}): Promise<string | null> {
  const p = commonParams();
  p.set("retmode", "json");
  // ecitmatch is the formal endpoint but it's text-only and quirky;
  // we use esearch with field qualifiers, which is reliable.
  const parts: string[] = [];
  if (args.journal) parts.push(`"${args.journal}"[Journal]`);
  if (args.year) parts.push(`${args.year}[PDAT]`);
  if (args.volume) parts.push(`${args.volume}[Volume]`);
  if (args.page) parts.push(`${args.page}[Pagination]`);
  if (args.author) parts.push(`${args.author}[Author]`);
  if (args.title) parts.push(`"${args.title}"[Title]`);
  const term = parts.join(" AND ");
  if (!term) return null;
  const { ids } = await pubmedSearch({ query: term, retmax: 3 });
  return ids[0] || null;
}
