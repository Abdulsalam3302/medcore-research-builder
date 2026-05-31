/** Public app version — keep in sync with package.json. */
export const APP_VERSION = "3.7.0";
export const PROJECT_STATE_VERSION = "2.2.0";

/** Max JSON body sizes by route tier (bytes). */
export const BODY_LIMITS = {
  default: 256_000,
  llm: 512_000,
  references: 1_024_000,
} as const;

/** Per-minute rate limits by tier (per client IP). */
export const RATE_LIMITS = {
  default: { limit: 120, windowMs: 60_000 },
  search: { limit: 60, windowMs: 60_000 },
  llm: { limit: 24, windowMs: 60_000 },
  verify: { limit: 12, windowMs: 60_000 },
} as const;
