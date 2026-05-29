/**
 * Shared HTTP helpers for scholarly API clients.
 *
 * Many scholarly providers (NCBI E-utilities, OpenAlex, EuropePMC, Unpaywall,
 * OpenCitations, ClinicalTrials.gov) ask callers to identify themselves with a
 * descriptive User-Agent — and several will return 403/throttle anonymous
 * datacenter traffic that omits one. Centralizing this keeps identification
 * consistent and lets a single mailto improve "polite pool" standing.
 */

const APP_VERSION = "3.0.0";

/** A descriptive User-Agent including a contact mailto when one is configured. */
export function scholarlyUserAgent(): string {
  const mailto =
    process.env.SCHOLARLY_MAILTO ||
    process.env.OPENALEX_MAILTO ||
    process.env.CROSSREF_MAILTO ||
    process.env.NCBI_EMAIL ||
    process.env.UNPAYWALL_EMAIL ||
    "";
  return mailto
    ? `MedCoreResearchBuilder/${APP_VERSION} (+https://medcore-research-builder.vercel.app; mailto:${mailto})`
    : `MedCoreResearchBuilder/${APP_VERSION} (+https://medcore-research-builder.vercel.app)`;
}

/** Standard request headers for a scholarly GET, with identification. */
export function scholarlyHeaders(
  accept = "application/json",
): Record<string, string> {
  return {
    accept,
    "user-agent": scholarlyUserAgent(),
  };
}

/** Default outbound timeout for scholarly requests (ms). */
export const SCHOLARLY_TIMEOUT_MS =
  Number(process.env.SCHOLARLY_TIMEOUT_MS) || 20000;
