import { ok, bad, safeJson, handleError, enforceRateLimit } from "../../_utils";
import { findJournals, journalCount, profileFromInputs, getJournalById } from "@/lib/journals";
import type { JournalFilters } from "@/lib/journals/types";

export const runtime = "nodejs";

type FinderBody = {
  title?: string;
  abstract?: string;
  keywords?: string[];
  scope?: string;
  specialties?: string[];
  designCategory?: string;
  manuscriptType?: string;
  filters?: JournalFilters;
  limit?: number;
};

/** GET — dataset stats, or a single journal record via ?id=. */
export async function GET(req: Request) {
  try {
    const limited = await enforceRateLimit(req, "search");
    if (limited) return limited;
    const id = new URL(req.url).searchParams.get("id");
    if (id) {
      const journal = getJournalById(id);
      if (!journal) return bad("Journal not found", 404);
      return ok({ journal });
    }
    return ok({ counts: journalCount() });
  } catch (e) {
    return handleError(e);
  }
}

/** POST — rank journals for a manuscript profile + filters. */
export async function POST(req: Request) {
  try {
    const limited = await enforceRateLimit(req, "search");
    if (limited) return limited;
    const body = await safeJson<FinderBody>(req, "default");

    const profile = profileFromInputs({
      title: body.title,
      abstract: body.abstract,
      keywords: Array.isArray(body.keywords) ? body.keywords.slice(0, 40) : undefined,
      scope: body.scope,
      specialties: Array.isArray(body.specialties) ? body.specialties.slice(0, 20) : undefined,
      designCategory: body.designCategory,
      manuscriptType: body.manuscriptType,
    });

    const limit = Math.min(Math.max(1, Number(body.limit) || 30), 100);
    const matches = findJournals(profile, body.filters || {}, limit);

    return ok({ counts: journalCount(), matches });
  } catch (e) {
    return handleError(e);
  }
}
