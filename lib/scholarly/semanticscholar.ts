/**
 * Semantic Scholar (S2) Graph API client.
 * https://api.semanticscholar.org/api-docs/
 *
 * Auth: optional API key via x-api-key header. Key bumps quota from
 * shared/anonymous pool to a per-key pool with higher per-second limits.
 *
 * What S2 gives us that PubMed/OpenAlex do not:
 *  - tldr (AI-generated one-sentence summaries)
 *  - influentialCitationCount (citations the authors actually built on,
 *    not just cited in passing)
 *  - paper-to-paper recommendations
 *  - openAccessPdf URL for many papers
 */

const BASE = "https://api.semanticscholar.org/graph/v1";
const REC_BASE = "https://api.semanticscholar.org/recommendations/v1";

const DEFAULT_FIELDS = [
  "paperId",
  "externalIds",
  "title",
  "abstract",
  "year",
  "authors.name",
  "venue",
  "publicationVenue.name",
  "publicationTypes",
  "citationCount",
  "influentialCitationCount",
  "openAccessPdf",
  "tldr",
  "url",
].join(",");

function headers(): HeadersInit {
  const h: Record<string, string> = { accept: "application/json" };
  if (process.env.SEMANTIC_SCHOLAR_API_KEY) {
    h["x-api-key"] = process.env.SEMANTIC_SCHOLAR_API_KEY;
  }
  return h;
}

export type S2Paper = {
  paperId: string;
  doi?: string;
  pmid?: string;
  arxivId?: string;
  title: string;
  abstract?: string;
  year?: string;
  authors: string[];
  venue?: string;
  publicationTypes?: string[];
  citationCount?: number;
  influentialCitationCount?: number;
  openAccessPdfUrl?: string;
  tldr?: string;
  url: string;
};

function normalize(raw: Record<string, unknown>): S2Paper {
  const ext = (raw.externalIds as Record<string, string>) || {};
  const authors = ((raw.authors as Array<{ name?: string }>) || [])
    .map((a) => a.name)
    .filter(Boolean) as string[];
  const venueObj = raw.publicationVenue as Record<string, string> | undefined;
  const oa = raw.openAccessPdf as Record<string, string> | undefined;
  const tldr = raw.tldr as Record<string, string> | undefined;
  return {
    paperId: (raw.paperId as string) || "",
    doi: ext.DOI || undefined,
    pmid: ext.PubMed || undefined,
    arxivId: ext.ArXiv || undefined,
    title: (raw.title as string) || "",
    abstract: (raw.abstract as string) || undefined,
    year: raw.year ? String(raw.year) : undefined,
    authors,
    venue: venueObj?.name || (raw.venue as string) || undefined,
    publicationTypes: (raw.publicationTypes as string[]) || undefined,
    citationCount: (raw.citationCount as number) || 0,
    influentialCitationCount: (raw.influentialCitationCount as number) || 0,
    openAccessPdfUrl: oa?.url || undefined,
    tldr: tldr?.text || undefined,
    url:
      (raw.url as string) ||
      (ext.DOI ? `https://doi.org/${ext.DOI}` : `https://www.semanticscholar.org/paper/${raw.paperId}`),
  };
}

export async function s2Search(args: {
  query: string;
  limit?: number;
  yearFrom?: number;
  yearTo?: number;
  publicationTypes?: string[];
  fieldsOfStudy?: string[];
}): Promise<S2Paper[]> {
  const p = new URLSearchParams();
  p.set("query", args.query);
  p.set("limit", String(Math.min(args.limit ?? 20, 100)));
  p.set("fields", DEFAULT_FIELDS);
  if (args.yearFrom || args.yearTo) {
    const from = args.yearFrom ?? "";
    const to = args.yearTo ?? "";
    p.set("year", `${from}-${to}`);
  }
  if (args.publicationTypes?.length) {
    p.set("publicationTypes", args.publicationTypes.join(","));
  }
  if (args.fieldsOfStudy?.length) {
    p.set("fieldsOfStudy", args.fieldsOfStudy.join(","));
  }
  const res = await fetch(`${BASE}/paper/search?${p.toString()}`, {
    headers: headers(),
  });
  if (!res.ok) throw new Error(`S2 ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as { data?: Array<Record<string, unknown>> };
  return (data.data || []).map(normalize);
}

/**
 * Get a single paper by S2 paperId, DOI, PMID, or ArXiv id.
 * Accepts the prefix-tagged form (DOI:..., PMID:..., ARXIV:...) or
 * we'll add the appropriate prefix.
 */
export async function s2Paper(id: string): Promise<S2Paper | null> {
  const tagged = /^(DOI|PMID|ARXIV|CorpusId):/i.test(id)
    ? id
    : /^10\.\d{4,9}\//.test(id)
    ? `DOI:${id}`
    : /^\d{6,9}$/.test(id)
    ? `PMID:${id}`
    : id;
  const p = new URLSearchParams();
  p.set("fields", DEFAULT_FIELDS);
  const res = await fetch(`${BASE}/paper/${encodeURIComponent(tagged)}?${p.toString()}`, {
    headers: headers(),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`S2 paper ${res.status}`);
  return normalize((await res.json()) as Record<string, unknown>);
}

/**
 * "Papers similar to this one" — uses the recommendations API.
 * Best used after we've identified a strong seed paper, to surface
 * adjacent literature the user might have missed.
 */
export async function s2Recommendations(args: {
  paperId: string;
  limit?: number;
}): Promise<S2Paper[]> {
  const p = new URLSearchParams();
  p.set("limit", String(Math.min(args.limit ?? 20, 100)));
  p.set("fields", DEFAULT_FIELDS);
  const res = await fetch(
    `${REC_BASE}/papers/forpaper/${encodeURIComponent(args.paperId)}?${p.toString()}`,
    { headers: headers() },
  );
  if (!res.ok) throw new Error(`S2 recommendations ${res.status}`);
  const data = (await res.json()) as { recommendedPapers?: Array<Record<string, unknown>> };
  return (data.recommendedPapers || []).map(normalize);
}

export function s2Configured(): boolean {
  return Boolean(process.env.SEMANTIC_SCHOLAR_API_KEY);
}
