/** ISO 3166-1 alpha-2 → display name (English). Falls back to code if unknown. */
const displayNames =
  typeof Intl !== "undefined" && "DisplayNames" in Intl
    ? new Intl.DisplayNames(["en"], { type: "region" })
    : null;

export function countryLabel(code: string | null | undefined): string {
  if (!code) return "Unknown";
  const upper = code.toUpperCase();
  const name = displayNames?.of(upper);
  if (name && name !== upper) return `${name} (${upper})`;
  return upper;
}

export function countryFlag(code: string | null | undefined): string {
  if (!code || code.length !== 2) return "🌍";
  const upper = code.toUpperCase();
  const base = 0x1f1e6;
  return String.fromCodePoint(
    ...[...upper].map((c) => base + c.charCodeAt(0) - 65),
  );
}

/** Primary beta market — highlight Saudi Arabia traffic. */
export const PRIMARY_GEO_CODE = "SA";

export function isPrimaryGeo(code: string | null | undefined): boolean {
  return (code || "").toUpperCase() === PRIMARY_GEO_CODE;
}
