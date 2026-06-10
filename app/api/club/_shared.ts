/**
 * True when the club tables haven't been created yet (docs/CLUB_TABLES.sql not
 * run). Must degrade to "not configured" — not a 502 — so the UI shows the
 * setup notice instead of an error.
 */
export function clubTablesMissing(
  error: { code?: string; message?: string } | null | undefined,
): boolean {
  const msg = error?.message || "";
  return (
    error?.code === "42P01" ||
    error?.code === "PGRST205" ||
    /club_(posts|joins).*(does not exist|schema cache)/i.test(msg) ||
    /relation .* does not exist/i.test(msg)
  );
}
