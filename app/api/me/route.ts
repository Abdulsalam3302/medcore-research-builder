import { ok, handleError, enforceRateLimit } from "../_utils";
import { getAppUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Who am I — server-side truth for the signed-in user and role.
 * Honors OWNER_EMAIL promotion (which client-side profile reads cannot see),
 * so admin-only UI like the announcements composer shows reliably.
 */
export async function GET(req: Request) {
  try {
    const limited = await enforceRateLimit(req, "default");
    if (limited) return limited;
    const user = await getAppUser();
    if (!user) return ok({ signedIn: false });
    return ok({ signedIn: true, email: user.email, role: user.role });
  } catch (e) {
    return handleError(e);
  }
}
