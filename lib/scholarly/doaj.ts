/**
 * DOAJ (Directory of Open Access Journals) client.
 * https://doaj.org/api/docs
 *
 * Free, no key required. Two uses on the platform:
 *  - Journal verification: DOAJ listing is a strong legitimacy signal for an
 *    open-access journal (and supports the predatory self-check).
 *  - Open-access article discovery with license metadata.
 */

import { scholarlyHeaders, SCHOLARLY_TIMEOUT_MS } from "./_http";

const BASE = "https://doaj.org/api";

export type DoajJournal = {
  id: string;
  title: string;
  publisher?: string;
  country?: string;
  issn: string[];
  /** SPDX-ish license labels, e.g. "CC BY". */
  licenses: string[];
  apcUsd?: number;
  hasApc: boolean;
  subjects: string[];
  url: string;
};

export type DoajArticle = {
  id: string;
  title: string;
  journal?: string;
  year?: string;
  doi?: string;
  authors: string[];
  abstract?: string;
  url: string;
};

function esc(q: string): string {
  // DOAJ uses Elasticsearch query syntax — escape reserved characters so a
  // pasted title can't break (or steer) the query.
  return q.replace(/[+\-=&|><!(){}\[\]^"~*?:\\\/]/g, " ").replace(/\s+/g, " ").trim();
}

export async function doajSearchJournals(query: string, pageSize = 10): Promise<DoajJournal[]> {
  const q = esc(query);
  if (!q) return [];
  const res = await fetch(
    `${BASE}/search/journals/${encodeURIComponent(q)}?pageSize=${Math.min(pageSize, 50)}`,
    { headers: scholarlyHeaders(), signal: AbortSignal.timeout(SCHOLARLY_TIMEOUT_MS) },
  );
  if (!res.ok) throw new Error(`DOAJ ${res.status}`);
  const data = (await res.json()) as { results?: Array<{ id: string; bibjson?: Record<string, unknown> }> };
  return (data.results || []).map((r) => {
    const b = (r.bibjson || {}) as {
      title?: string;
      publisher?: { name?: string; country?: string };
      eissn?: string;
      pissn?: string;
      license?: Array<{ type?: string }>;
      apc?: { has_apc?: boolean; max?: Array<{ price?: number; currency?: string }> };
      subject?: Array<{ term?: string }>;
      ref?: { journal?: string };
    };
    const usd = (b.apc?.max || []).find((m) => m.currency === "USD")?.price;
    return {
      id: r.id,
      title: b.title || "",
      publisher: b.publisher?.name,
      country: b.publisher?.country,
      issn: [b.pissn, b.eissn].filter((x): x is string => Boolean(x)),
      licenses: (b.license || []).map((l) => l.type || "").filter(Boolean),
      apcUsd: typeof usd === "number" ? usd : undefined,
      hasApc: Boolean(b.apc?.has_apc),
      subjects: (b.subject || []).map((s) => s.term || "").filter(Boolean),
      url: `https://doaj.org/toc/${r.id}`,
    };
  });
}

export async function doajSearchArticles(query: string, pageSize = 10): Promise<DoajArticle[]> {
  const q = esc(query);
  if (!q) return [];
  const res = await fetch(
    `${BASE}/search/articles/${encodeURIComponent(q)}?pageSize=${Math.min(pageSize, 50)}`,
    { headers: scholarlyHeaders(), signal: AbortSignal.timeout(SCHOLARLY_TIMEOUT_MS) },
  );
  if (!res.ok) throw new Error(`DOAJ ${res.status}`);
  const data = (await res.json()) as { results?: Array<{ id: string; bibjson?: Record<string, unknown> }> };
  return (data.results || []).map((r) => {
    const b = (r.bibjson || {}) as {
      title?: string;
      year?: string;
      journal?: { title?: string };
      identifier?: Array<{ type?: string; id?: string }>;
      author?: Array<{ name?: string }>;
      abstract?: string;
      link?: Array<{ url?: string }>;
    };
    const doi = (b.identifier || []).find((i) => i.type === "doi")?.id;
    return {
      id: r.id,
      title: b.title || "",
      journal: b.journal?.title,
      year: b.year,
      doi,
      authors: (b.author || []).map((a) => a.name || "").filter(Boolean),
      abstract: b.abstract,
      url: doi ? `https://doi.org/${doi}` : (b.link || [])[0]?.url || `https://doaj.org/article/${r.id}`,
    };
  });
}
