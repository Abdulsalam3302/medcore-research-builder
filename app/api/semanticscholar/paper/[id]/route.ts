import { bad, handleError, ok } from "../../../_utils";
import { s2Paper } from "@/lib/scholarly/semanticscholar";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const id = decodeURIComponent(params.id);
    if (!id) return bad("id is required");
    const paper = await s2Paper(id);
    if (!paper) return bad("not found", 404);
    return ok({ paper });
  } catch (e) {
    return handleError(e);
  }
}
