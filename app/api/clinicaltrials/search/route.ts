import { bad, handleError, ok } from "../../_utils";
import { ctgSearch } from "@/lib/scholarly/clinicaltrials";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const u = new URL(req.url);
    const q = u.searchParams.get("query") || u.searchParams.get("q") || "";
    if (!q) return bad("query is required");
    const pageSize = Number(u.searchParams.get("page_size") || "25");
    const status = u.searchParams.get("status") || undefined;
    const phase = u.searchParams.get("phase") || undefined;
    const results = await ctgSearch({ query: q, pageSize, status, phase });
    return ok({ results });
  } catch (e) {
    return handleError(e);
  }
}
