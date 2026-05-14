import { ok } from "../_utils";
import { guidelines } from "@/lib/guidelines";

export const runtime = "nodejs";

export async function GET() {
  return ok({ guidelines });
}
