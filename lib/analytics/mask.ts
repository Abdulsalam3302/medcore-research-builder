/** Mask email for admin display — no full PII in observability UI. */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return "—";
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}

/** Short opaque user ref for audit trails (first 8 chars of UUID). */
export function userRef(userId: string | null | undefined): string {
  if (!userId) return "anonymous";
  return userId.slice(0, 8);
}

/** Truncate IP hash for display. */
export function maskIpHash(hash: string | null | undefined): string {
  if (!hash) return "—";
  return `${hash.slice(0, 8)}…`;
}
