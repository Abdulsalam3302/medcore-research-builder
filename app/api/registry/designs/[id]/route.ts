import { bad, ok } from "../../../_utils";
import { designById } from "@/lib/registry/designs";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  const d = designById(ctx.params.id);
  if (!d) return bad("Unknown design id", 404);
  return ok(d);
}
