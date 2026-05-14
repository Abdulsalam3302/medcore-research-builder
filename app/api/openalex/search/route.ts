import { bad, handleError, ok } from "../../_utils";
import { openalexSearch } from "@/lib/scholarly/openalex";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const u = new URL(req.url);
    const q = u.searchParams.get("query") || "";
    const perPage = Number(u.searchParams.get("per_page") || "20");
    if (!q) return bad("query is required");
    const results = await openalexSearch({ query: q, perPage });
    return ok({ results });
  } catch (e) {
    return handleError(e);
  }
}
