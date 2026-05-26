import { bad, handleError, ok, safeJson, enforceRateLimit } from "../../_utils";
import { journals } from "@/lib/registry/journals";

export const runtime = "nodejs";

type VerifyReq = {
  journalName: string;
};

type IndexingValue = "verified" | "unverified" | "unknown";

type VerifyResp = {
  journalName: string;
  indexing: {
    webOfScience: IndexingValue;
    scopus: IndexingValue;
    pubMed: IndexingValue;
    medline: IndexingValue;
    pmc: IndexingValue;
    doaj: IndexingValue;
  };
  verificationSources: string[];
  redFlags: string[];
  lastChecked: string;
};

const OFFICIAL = {
  wos: "https://mjl.clarivate.com/home",
  scopus: "https://www.elsevier.com/products/scopus/content",
  nlm: "https://www.ncbi.nlm.nih.gov/nlmcatalog/journals/",
  doaj: "https://doaj.org/",
};

const KNOWN_INDEXING: Record<string, Partial<VerifyResp["indexing"]>> = {
  "the bmj": { webOfScience: "verified", scopus: "verified", pubMed: "verified", medline: "verified" },
  "jama": { webOfScience: "verified", scopus: "verified", pubMed: "verified", medline: "verified" },
  "new england journal of medicine": { webOfScience: "verified", scopus: "verified", pubMed: "verified", medline: "verified" },
  "the lancet": { webOfScience: "verified", scopus: "verified", pubMed: "verified", medline: "verified" },
  "nature": { webOfScience: "verified", scopus: "verified", pubMed: "unknown", medline: "unknown" },
  "nature medicine": { webOfScience: "verified", scopus: "verified", pubMed: "verified", medline: "verified" },
  "plos medicine": { webOfScience: "verified", scopus: "verified", pubMed: "verified", medline: "verified", pmc: "verified", doaj: "verified" },
  "bmj open": { webOfScience: "verified", scopus: "verified", pubMed: "verified", medline: "unknown", pmc: "verified", doaj: "verified" },
};

async function nlmSearch(journalName: string): Promise<{ found: boolean; id?: string }> {
  const term = `${journalName}[Title]`;
  const url =
    "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=nlmcatalog&retmode=json&term=" +
    encodeURIComponent(term);
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return { found: false };
  const json = (await res.json()) as { esearchresult?: { idlist?: string[] } };
  const id = json.esearchresult?.idlist?.[0];
  return { found: Boolean(id), id };
}

async function doajSearch(journalName: string): Promise<boolean | null> {
  // DOAJ API endpoint may vary by deployment; return null on any incompatibility.
  const url = `https://doaj.org/api/search/journals/${encodeURIComponent(journalName)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  const json = (await res.json()) as { total?: number; results?: unknown[] };
  if (typeof json.total === "number") return json.total > 0;
  if (Array.isArray(json.results)) return json.results.length > 0;
  return null;
}

async function crossrefJournalExists(journalName: string): Promise<boolean | null> {
  const url = `https://api.crossref.org/journals?query=${encodeURIComponent(journalName)}&rows=1`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  const json = (await res.json()) as { message?: { items?: unknown[] } };
  return Boolean(json.message?.items?.length);
}

export async function POST(req: Request) {
  try {
    const limited = enforceRateLimit(req, "default");
    if (limited) return limited;

    const body = await safeJson<VerifyReq>(req, "default");
    const journalName = body.journalName?.trim();
    if (!journalName) return bad("journalName is required");

    const seed = journals.find((j) => j.name.toLowerCase() === journalName.toLowerCase());
    const known = KNOWN_INDEXING[journalName.toLowerCase()] || {};

    const result: VerifyResp = {
      journalName,
      indexing: {
        webOfScience: known.webOfScience || "unknown",
        scopus: known.scopus || "unknown",
        pubMed: known.pubMed || "unknown",
        medline: known.medline || "unknown",
        pmc: known.pmc || "unknown",
        doaj: known.doaj || "unknown",
      },
      verificationSources: [OFFICIAL.wos, OFFICIAL.scopus, OFFICIAL.nlm, OFFICIAL.doaj],
      redFlags: [],
      lastChecked: new Date().toISOString().slice(0, 10),
    };

    const [nlm, doaj, crossrefExists] = await Promise.all([
      nlmSearch(journalName),
      doajSearch(journalName),
      crossrefJournalExists(journalName),
    ]);

    if (nlm.found) {
      if (result.indexing.pubMed === "unknown") result.indexing.pubMed = "verified";
      if (result.indexing.medline === "unknown") result.indexing.medline = "unknown";
      result.verificationSources.push(`${OFFICIAL.nlm}?term=${encodeURIComponent(journalName)}`);
    } else if (result.indexing.pubMed === "unknown") {
      result.indexing.pubMed = "unverified";
      result.redFlags.push("Journal not found in NLM Catalog search by title. Verify using ISSN manually.");
    }

    if (doaj === true) result.indexing.doaj = "verified";
    if (doaj === false && result.indexing.doaj === "unknown") result.indexing.doaj = "unverified";

    if (crossrefExists === false) {
      result.redFlags.push("Crossref metadata lookup did not return a journal match.");
    }

    if (!seed) {
      result.redFlags.push("Journal not found in local curated registry; verify all submission requirements manually.");
    }

    if (result.indexing.webOfScience === "unknown") {
      result.redFlags.push("Web of Science status requires manual Clarivate Master Journal List verification.");
    }
    if (result.indexing.scopus === "unknown") {
      result.redFlags.push("Scopus status requires manual Scopus Sources verification.");
    }

    return ok(result);
  } catch (e) {
    return handleError(e);
  }
}
