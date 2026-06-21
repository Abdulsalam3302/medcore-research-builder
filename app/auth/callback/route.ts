import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { promoteOwnerIfNeeded } from "@/lib/auth";
import { trackFromRequest } from "@/lib/analytics/track";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const requestedNext = searchParams.get("next") ?? "/";
  // Only allow same-origin relative paths to prevent open-redirect abuse.
  const next =
    requestedNext.startsWith("/") &&
    !requestedNext.startsWith("//") &&
    !requestedNext.startsWith("/\\")
      ? requestedNext
      : "/";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) {
        await promoteOwnerIfNeeded(user.id, user.email);
        trackFromRequest(request, {
          eventType: "login",
          category: "auth",
          path: "/auth/callback",
          userId: user.id,
        });
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth?error=auth_callback_failed`);
}
