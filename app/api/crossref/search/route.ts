import { bad, handleError, ok } from "../../_utils";
import { crossrefSearch } from "@/lib/scholarly/crossref";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const u = new URL(req.url);
    const q = u.searchParams.get("query") || "";
    const bibliographic = u.searchParams.get("bibliographic") || "";
    const rows = Number(u.searchParams.get("rows") || "20");
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
