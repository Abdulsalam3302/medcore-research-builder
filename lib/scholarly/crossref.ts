/**
 * Crossref REST API client.
 * https://www.crossref.org/documentation/retrieve-metadata/rest-api/
 * Polite pool: send mailto query parameter when configured.
 */

const BASE = "https://api.crossref.org";

function politeMailto(): string {
  return process.env.CROSSREF_MAILTO || "";
}

function ua(): string {
  const mailto = politeMailto();
  return mailto
    ? `MedCoreResearchBuilder/1.0 (mailto:${mailto})`
    : `MedCoreResearchBuilder/1.0`;
}

export type CrossrefWork = {
  doi: string;
  title: string;
  authors: string[];
  journal: string;
  year: string;
  volume?: string;
  issue?: string;
  pages?: string;
  type: string;
  score?: number;
  url: string;
  isRetraction?: boolean;
  relations?: string[];
};

function normalizeItem(item: Record<string, unknown>, score?: number): CrossrefWork {
  const doi = (item.DOI as string) || "";
  const titleArr = (item.title as string[]) || [];
  const journalArr = (item["container-title"] as string[]) || [];
  const authorsArr = ((item.author as Array<{ given?: string; family?: string }>) || [])
    .map((a) => [a.given, a.family].filter(Boolean).join(" "))
    .filter(Boolean);
  const issuedParts =
    ((item.issued as { "date-parts"?: number[][] })?.["date-parts"]?.[0] as number[]) || [];
  const year = issuedParts[0] ? String(issuedParts[0]) : "";
  const type = (item.type as string) || "";
  const isRetraction =
    type === "retraction" ||
    (titleArr[0] || "").toLowerCase().includes("retracted") ||
    (titleArr[0] || "").toLowerCase().includes("retraction");
  const relations = item.relation ? Object.keys(item.relation as Record<string, unknown>) : [];
  return {
    doi,
    title: titleArr[0] || "",
    authors: authorsArr,
    journal: journalArr[0] || "",
    year,
    volume: (item.volume as string) || undefined,
    issue: (item.issue as string) || undefined,
    pages: (item.page as string) || undefined,
    type,
    score,
    url: doi ? `https://doi.org/${doi}` : "",
    isRetraction,
    relations,
  };
}

export async function crossrefSearch(args: {
  query?: string;
  bibliographic?: string;
  rows?: number;
  filter?: string;
}): Promise<CrossrefWork[]> {
  const p = new URLSearchParams();
  if (args.query) p.set("query", args.query);
  if (args.bibliographic) p.set("query.bibliographic", args.bibliographic);
  p.set("rows", String(args.rows ?? 20));
  if (args.filter) p.set("filter", args.filter);
  const mailto = politeMailto();
  if (mailto) p.set("mailto", mailto);
  const res = await fetch(`${BASE}/works?${p.toString()}`, {
    headers: { "user-agent": ua(), accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Crossref ${res.status}`);
  const data = (await res.json()) as {
    message?: { items?: Array<Record<string, unknown>> };
  };
  const items = data.message?.items || [];
  return items.map((it) => normalizeItem(it, (it.score as number) || undefined));
}

export async function crossrefByDOI(doi: string): Promise<CrossrefWork | null> {
  if (!doi) return null;
  const clean = doi.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
  const p = new URLSearchParams();
  const mailto = politeMailto();
  if (mailto) p.set("mailto", mailto);
  const url = `${BASE}/works/${encodeURIComponent(clean)}${
    p.toString() ? `?${p.toString()}` : ""
  }`;
  const res = await fetch(url, {
    headers: { "user-agent": ua(), accept: "application/json" },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Crossref ${res.status}`);
  const data = (await res.json()) as { message?: Record<string, unknown> };
  if (!data.message) return null;
  return normalizeItem(data.message);
}
