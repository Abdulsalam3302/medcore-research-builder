/**
 * Elicit API client.
 * https://elicit.com/ — paid AI research assistant.
 *
 * Auth: bearer token via Authorization header.
 *
 * Note: Elicit's public API surface has evolved over time. We use the
 * documented /search endpoint shape (POST body with `query` and optional
 * filters) and gracefully handle response variations. If a request fails
 * we surface the error so the caller can fall back to S2/PubMed.
 */

const BASE = (process.env.ELICIT_BASE_URL || "https://api.elicit.com").replace(/\/+$/, "");

function headers(): HeadersInit {
  const key = process.env.ELICIT_API_KEY;
  if (!key) throw new Error("ELICIT_API_KEY not configured");
  return {
    Authorization: `Bearer ${key}`,
    "content-type": "application/json",
    accept: "application/json",
  };
}

export type ElicitPaper = {
  id?: string;
  doi?: string;
  pmid?: string;
  title: string;
  abstract?: string;
  authors: string[];
  journal?: string;
  year?: string;
  url?: string;
  citationCount?: number;
  // Elicit's value-add: per-paper extracted answers / summary blurbs
  summary?: string;
  extractedAnswers?: Array<{ question: string; answer: string }>;
};

function pickStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => {
      if (typeof x === "string") return x;
      if (x && typeof x === "object") {
        const o = x as Record<string, unknown>;
        return (o.name as string) || (o.fullName as string) || "";
      }
      return "";
    })
    .filter(Boolean);
}

function normalize(raw: Record<string, unknown>): ElicitPaper {
  const ids = (raw.externalIds as Record<string, string>) || {};
  const doi = (raw.doi as string) || ids.DOI || ids.doi;
  const pmid = (raw.pmid as string) || ids.PMID || ids.pubmed;
  const year = raw.year ? String(raw.year) : (raw.publicationYear ? String(raw.publicationYear) : undefined);
  return {
    id: (raw.id as string) || (raw.paperId as string) || undefined,
    doi,
    pmid,
    title: (raw.title as string) || "",
    abstract: (raw.abstract as string) || (raw.summary as string) || undefined,
    authors: pickStringArray(raw.authors),
    journal: (raw.journal as string) || (raw.venue as string) || (raw.source as string) || undefined,
    year,
    url:
      (raw.url as string) ||
      (doi ? `https://doi.org/${doi}` : undefined),
    citationCount: (raw.citationCount as number) || undefined,
    summary: (raw.aiSummary as string) || (raw.tldr as string) || undefined,
    extractedAnswers: (raw.extractedAnswers as Array<{ question: string; answer: string }>) || undefined,
  };
}

export async function elicitSearch(args: {
  query: string;
  limit?: number;
  yearFrom?: number;
  yearTo?: number;
}): Promise<ElicitPaper[]> {
  const body = {
    query: args.query,
    limit: Math.min(args.limit ?? 20, 50),
    filters: {
      ...(args.yearFrom || args.yearTo
        ? { year: { from: args.yearFrom, to: args.yearTo } }
        : {}),
    },
  };
  const res = await fetch(`${BASE}/v1/search`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Elicit ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as { results?: unknown[]; papers?: unknown[]; data?: unknown[] };
  const arr =
    (Array.isArray(data.results) ? data.results : null) ||
    (Array.isArray(data.papers) ? data.papers : null) ||
    (Array.isArray(data.data) ? data.data : null) ||
    [];
  return arr.map((x) => normalize(x as Record<string, unknown>));
}

export function elicitConfigured(): boolean {
  return Boolean(process.env.ELICIT_API_KEY);
}
