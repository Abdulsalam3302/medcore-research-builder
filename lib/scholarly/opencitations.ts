/**
 * OpenCitations COCI client.
 * https://opencitations.net/index/coci/api/v1
 *
 * Free, no key required. Provides:
 *  - incoming citations for a DOI (papers that cite this paper)
 *  - outgoing references for a DOI (what this paper cites)
 *
 * Useful for: building a citation network around a seed paper, and
 * finding under-cited but topically central papers.
 */

const BASE = "https://opencitations.net/index/coci/api/v1";

export type OCRecord = {
  citingDoi: string;
  citedDoi: string;
  creation?: string;
  timespan?: string;
  journalSelfCitation?: boolean;
  authorSelfCitation?: boolean;
};

function normalize(raw: Record<string, unknown>): OCRecord {
  return {
    citingDoi: (raw.citing as string) || "",
    citedDoi: (raw.cited as string) || "",
    creation: (raw.creation as string) || undefined,
    timespan: (raw.timespan as string) || undefined,
    journalSelfCitation: (raw.journal_sc as string) === "yes",
    authorSelfCitation: (raw.author_sc as string) === "yes",
  };
}

export async function openCitationsCitedBy(doi: string): Promise<OCRecord[]> {
  const clean = doi.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
  const res = await fetch(`${BASE}/citations/${encodeURIComponent(clean)}`, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`OpenCitations ${res.status}`);
  const data = (await res.json()) as Array<Record<string, unknown>>;
  return data.map(normalize);
}

export async function openCitationsReferences(doi: string): Promise<OCRecord[]> {
  const clean = doi.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
  const res = await fetch(`${BASE}/references/${encodeURIComponent(clean)}`, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`OpenCitations ${res.status}`);
  const data = (await res.json()) as Array<Record<string, unknown>>;
  return data.map(normalize);
}
