import { createAdminClient } from "@/lib/supabase/admin";
import {
  clientIp,
  geoFromHeaders,
  hashIp,
  referrerFromHeaders,
  sessionIdFromRequest,
  userAgentFamily,
} from "./parse";
import type { TrackEventInput } from "./types";

/** Fire-and-forget analytics insert. Never throws to callers. */
export function trackEvent(input: TrackEventInput): void {
  void trackEventAsync(input);
}

export async function trackEventAsync(input: TrackEventInput): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;

  try {
    const { error } = await admin.from("analytics_events").insert({
      event_type: input.eventType,
      category: input.category,
      path: input.path ?? null,
      method: input.method ?? null,
      user_id: input.userId ?? null,
      session_id: input.sessionId ?? null,
      ip_hash: input.ipHash ?? null,
      country: input.country ?? null,
      region: input.region ?? null,
      referrer: input.referrer ?? null,
      user_agent_family: input.userAgentFamily ?? null,
      metadata: input.metadata ?? {},
      severity: input.severity ?? "info",
    });
    if (error) console.warn("[analytics] insert failed:", error.message);
  } catch (e) {
    console.warn("[analytics] track error:", e);
  }
}

export function trackFromRequest(
  req: Request,
  input: Omit<TrackEventInput, "ipHash" | "country" | "region" | "referrer" | "userAgentFamily" | "sessionId"> & {
    sessionId?: string | null;
  },
): void {
  const ip = clientIp(req);
  trackEvent({
    ...input,
    ipHash: hashIp(ip),
    country: geoFromHeaders(req).country,
    region: geoFromHeaders(req).region,
    referrer: referrerFromHeaders(req),
    userAgentFamily: userAgentFamily(req.headers.get("user-agent")),
    sessionId: input.sessionId ?? sessionIdFromRequest(req),
  });
}
