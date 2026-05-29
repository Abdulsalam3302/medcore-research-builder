import { bad, handleError, ok, enforceRateLimit } from "../../_utils";
import { s2Search } from "@/lib/scholarly/semanticscholar";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const limited = enforceRateLimit(req, "search");
    if (limited) return limited;
    const u = new URL(req.url);
    const q = u.searchParams.get("query") || "";
    if (!q) return bad("query is required");
    const limit = Number(u.searchParams.get("limit") || "20");
    const yearFrom = u.searchParams.get("year_from");
    const yearTo = u.searchParams.get("year_to");
    const types = u.searchParams.get("publication_types");
    const fos = u.searchParams.get("fields_of_study");
    const results = await s2Search({
      query: q,
      limit,
      yearFrom: yearFrom ? Number(yearFrom) : undefined,
      yearTo: yearTo ? Number(yearTo) : undefined,
      publicationTypes: types ? types.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
      fieldsOfStudy: fos ? fos.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
    });
    return ok({ results });
  } catch (e) {
    return handleError(e);
  }
}
