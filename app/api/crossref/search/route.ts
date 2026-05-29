import { bad, handleError, ok, enforceRateLimit } from "../../_utils";
import { crossrefSearch } from "@/lib/scholarly/crossref";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const limited = enforceRateLimit(req, "search");
    if (limited) return limited;
    const u = new URL(req.url);
    const q = u.searchParams.get("query") || "";
    const bibliographic = u.searchParams.get("bibliographic") || "";
    const rowsRaw = Number(u.searchParams.get("rows") || "20");
    const rows = Math.min(Math.max(1, Number.isFinite(rowsRaw) ? rowsRaw : 20), 100);
    if (!q && !bibliographic) return bad("query or bibliographic is required");
    const results = await crossrefSearch({
      query: q || undefined,
      bibliographic: bibliographic || undefined,
      rows,
    });
    return ok({ results });
  } catch (e) {
    return handleError(e);
  }
}
