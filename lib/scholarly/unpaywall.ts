/**
 * Unpaywall client. Resolves a DOI to its best-available open-access
 * PDF/landing page (legal, author-deposited or publisher OA).
 * https://unpaywall.org/products/api
 *
 * Email required (free). Set UNPAYWALL_EMAIL.
 */

const BASE = "https://api.unpaywall.org/v2";

export type UnpaywallResult = {
  doi: string;
  isOA: boolean;
  oaStatus?: string; // gold, hybrid, green, bronze, closed
  bestOaPdfUrl?: string;
  bestOaLandingUrl?: string;
  publishedJournal?: string;
  publishedYear?: string;
  title?: string;
};

export function unpaywallConfigured(): boolean {
  return Boolean(process.env.UNPAYWALL_EMAIL);
}

export async function unpaywallLookup(doi: string): Promise<UnpaywallResult | null> {
  const email = process.env.UNPAYWALL_EMAIL;
  if (!email) throw new Error("UNPAYWALL_EMAIL not configured");
  const clean = doi.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
  const url = `${BASE}/${encodeURIComponent(clean)}?email=${encodeURIComponent(email)}`;
  const res = await fetch(url, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Unpaywall ${res.status}`);
  const data = (await res.json()) as Record<string, unknown>;
  const best = data.best_oa_location as Record<string, string> | null | undefined;
  return {
    doi: clean,
    isOA: (data.is_oa as boolean) === true,
    oaStatus: (data.oa_status as string) || undefined,
    bestOaPdfUrl: best?.url_for_pdf || undefined,
    bestOaLandingUrl: best?.url_for_landing_page || best?.url || undefined,
    publishedJournal: (data.journal_name as string) || undefined,
    publishedYear: data.year ? String(data.year) : undefined,
    title: (data.title as string) || undefined,
  };
}
