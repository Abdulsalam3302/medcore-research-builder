/** Client-side feature usage beacon — fire-and-forget, no PII. */
export function trackFeature(feature: string, path?: string): void {
  try {
    void fetch("/api/analytics/collect", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        eventType: "feature_use",
        category: "usage",
        feature,
        path: path ?? (typeof window !== "undefined" ? window.location.pathname : "/"),
      }),
    });
  } catch {
    /* non-blocking */
  }
}
