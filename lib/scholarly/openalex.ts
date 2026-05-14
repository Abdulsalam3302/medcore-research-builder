/**
 * OpenAlex API client.
 * https://docs.openalex.org/
 * Polite pool: include mailto query parameter when configured.
 */

const BASE = "https://api.openalex.org";

export type OpenAlexWork = {
  id: string;
  doi?: string;
  title: string;
  authors: string[];
  journal: string;
  year: string;
  type?: string;
  url: string;
  pmid?: string;
};

export async function openalexSearch(args: {
  query: string;
  perPage?: number;
}): Promise<OpenAlexWork[]> {
  const p = new URLSearchParams();
  p.set("search", args.query);
  p.set("per_page", String(args.perPage ?? 20));
  const mailto = process.env.OPENALEX_MAILTO;
  if (mailto) p.set("mailto", mailto);
  const res = await fetch(`${BASE}/works?${p.toString()}`, {
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new Error(`OpenAlex ${res.status}`);
  const data = (await res.json()) as { results?: Array<Record<string, unknown>> };
  const items = data.results || [];
  return items.map((w) => {
    const ids = (w.ids as Record<string, string>) || {};
    const host = (w.primary_location as Record<string, unknown>) || {};
    const src = (host.source as Record<string, unknown>) || {};
    const authorships = ((w.authorships as Array<{ author: { display_name?: string } }>) || [])
      .map((a) => a.author?.display_name)
      .filter(Boolean) as string[];
    const doi = ids.doi ? ids.doi.replace(/^https?:\/\/doi\.org\//, "") : undefined;
    const pmid = ids.pmid ? ids.pmid.replace(/^https?:\/\/pubmed\.ncbi\.nlm\.nih\.gov\//, "") : undefined;
    return {
      id: (w.id as string) || "",
      doi,
      title: (w.title as string) || (w.display_name as string) || "",
      authors: authorships,
      journal: (src.display_name as string) || "",
      year: w.publication_year ? String(w.publication_year) : "",
      type: (w.type as string) || undefined,
      url: doi ? `https://doi.org/${doi}` : (w.id as string) || "",
      pmid,
    };
  });
}
