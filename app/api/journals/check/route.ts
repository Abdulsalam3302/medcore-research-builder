import { ok, bad, handleError, enforceRateLimit } from "../../_utils";
import { scholarlyHeaders, SCHOLARLY_TIMEOUT_MS } from "@/lib/scholarly/_http";

export const runtime = "nodejs";

/**
 * Real-time journal check — looks up a journal the user is considering (by name
 * or ISSN) live in OpenAlex + DOAJ, so the finder works for ANY journal, not
 * just our curated/ingested set. Returns normalized facts + anticipated metrics
 * the client can score for trust. Honest: OpenAlex citedness is a proxy, never
 * an official Clarivate Impact Factor.
 */

const MAILTO = process.env.SCHOLARLY_MAILTO || process.env.OPENALEX_MAILTO || "";

async function getJson(url: string) {
  const res = await fetch(url, {
    headers: scholarlyHeaders(),
    signal: AbortSignal.timeout(SCHOLARLY_TIMEOUT_MS),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

export async function GET(req: Request) {
  try {
    const limited = await enforceRateLimit(req, "search");
    if (limited) return limited;

    const u = new URL(req.url);
    // Bound the inputs: a journal name is short, and an ISSN must match the
    // standard format. This caps the upstream request size (no amplification)
    // and rejects junk before we build the OpenAlex/DOAJ URL.
    const q = (u.searchParams.get("q") || "").trim().slice(0, 200);
    const issnRaw = (u.searchParams.get("issn") || "").trim().toUpperCase();
    const issn = /^\d{4}-?\d{3}[\dX]$/.test(issnRaw) ? issnRaw : "";
    if (issnRaw && !issn) return bad("issn must be a valid ISSN, e.g. 1234-5678");
    if (!q && !issn) return bad("q (journal name) or a valid issn is required");

    // 1) OpenAlex source lookup (rich metrics + indexing hints).
    const oaUrl = issn
      ? `https://api.openalex.org/sources/issn:${encodeURIComponent(issn)}${MAILTO ? `?mailto=${encodeURIComponent(MAILTO)}` : ""}`
      : `https://api.openalex.org/sources?search=${encodeURIComponent(q)}&per-page=5${MAILTO ? `&mailto=${encodeURIComponent(MAILTO)}` : ""}`;

    let oa: Record<string, unknown> | null = null;
    try {
      const data = await getJson(oaUrl);
      oa = issn ? (data as Record<string, unknown>) : ((data as { results?: Record<string, unknown>[] }).results?.[0] ?? null);
    } catch {
      oa = null;
    }

    if (!oa || !oa.display_name) {
      return ok({
        found: false,
        message:
          "Not found in OpenAlex. This does not mean the journal is illegitimate — verify it directly via Think.Check.Submit, DOAJ, and the official indexes.",
        verify: {
          thinkCheckSubmit: "https://thinkchecksubmit.org/journals/",
          doaj: "https://doaj.org/",
          nlm: "https://www.ncbi.nlm.nih.gov/nlmcatalog/journals/",
        },
      });
    }

    const stats = (oa.summary_stats as Record<string, number>) || {};
    const issnL = (oa.issn_l as string) || (Array.isArray(oa.issn) ? (oa.issn as string[])[0] : undefined);
    const isInDoaj = Boolean(oa.is_in_doaj);
    const isOa = Boolean(oa.is_oa);
    const apcUsd = (oa.apc_usd as number) ?? null;

    // 2) DOAJ cross-check for APC/OA transparency when we have an ISSN.
    let doaj: { inDoaj: boolean; hasApc?: boolean; apc?: { max?: number; currency?: string } } = { inDoaj: isInDoaj };
    if (issnL) {
      try {
        const dj = await getJson(`https://doaj.org/api/v2/search/journals/issn:${encodeURIComponent(issnL)}`);
        const rec = (dj as { results?: Array<{ bibjson?: Record<string, unknown> }> }).results?.[0]?.bibjson;
        if (rec) {
          const apc = rec.apc as { has_apc?: boolean; max?: Array<{ price?: number; currency?: string }> } | undefined;
          doaj = {
            inDoaj: true,
            hasApc: apc?.has_apc,
            apc: apc?.max?.[0] ? { max: apc.max[0].price, currency: apc.max[0].currency } : undefined,
          };
        }
      } catch {
        /* DOAJ optional */
      }
    }

    const citedness = stats["2yr_mean_citedness"];
    return ok({
      found: true,
      journal: {
        name: oa.display_name as string,
        publisher: (oa.host_organization_name as string) || "Unknown",
        country: (oa.country_code as string) || undefined,
        issn: issnL,
        homepage: (oa.homepage_url as string) || undefined,
        worksCount: (oa.works_count as number) || undefined,
        citedByCount: (oa.cited_by_count as number) || undefined,
        isOpenAccess: isOa,
        inDoaj: doaj.inDoaj,
        apcUsd: doaj.apc?.max ?? apcUsd ?? undefined,
        freeApc: doaj.inDoaj && (doaj.hasApc === false || apcUsd === 0),
        // Proxy metric — explicitly NOT a Clarivate JIF.
        openAlex2yrMeanCitedness: typeof citedness === "number" ? Math.round(citedness * 100) / 100 : undefined,
        hIndex: stats["h_index"],
        i10Index: stats["i10_index"],
      },
      anticipated: {
        // Conservative JIF-equivalent estimate from OpenAlex 2-yr citedness.
        impactEstimate: typeof citedness === "number" ? Math.round(citedness * 10) / 10 : null,
        basis: "Estimated from OpenAlex 2-year mean citedness — NOT an official Clarivate Impact Factor.",
      },
      source: "OpenAlex" + (doaj.inDoaj ? " + DOAJ" : ""),
      verify: {
        thinkCheckSubmit: "https://thinkchecksubmit.org/journals/",
        doaj: issnL ? `https://doaj.org/toc/${issnL}` : "https://doaj.org/",
        wos: "https://mjl.clarivate.com/home",
        scopus: "https://www.scopus.com/sources",
        nlm: "https://www.ncbi.nlm.nih.gov/nlmcatalog/journals/",
      },
    });
  } catch (e) {
    return handleError(e);
  }
}
