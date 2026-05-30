/**
 * Announcements — founder/admin posts shown to users (updates, releases, tips).
 *
 * Two sources, merged at read time:
 *  1. This file (`staticAnnouncements`) — version-controlled, always available,
 *     edit + commit to publish. Works with zero backend.
 *  2. Optional Supabase table `announcements` (when configured) — lets the
 *     founder post live without a deploy. Fetched client-side via /api/announcements.
 *
 * Keep the newest first. `pinned` floats to the top regardless of date.
 */

export type AnnouncementKind = "release" | "update" | "tip" | "notice";

export type Announcement = {
  id: string;
  date: string; // ISO yyyy-mm-dd
  kind: AnnouncementKind;
  title: string;
  body: string;
  pinned?: boolean;
  /** Optional call-to-action. */
  ctaLabel?: string;
  ctaHref?: string;
};

export const staticAnnouncements: Announcement[] = [
  {
    id: "v3-launch",
    date: "2026-05-30",
    kind: "release",
    title: "MedCore v3 is live",
    body: "A major release: live Literature Search (Europe PMC), a Journal Finder spanning WoS SCIE/ESCI, Scopus, PubMed/MEDLINE, DOAJ and Saudi journals, a Protocol/Proposal Studio, Manuscript Coherence checks, an AI Peer-Review Swarm, a Manuscript Scorecard, and curated Skills, Tips, Tools & MCP directories — all usable without an account.",
    pinned: true,
    ctaLabel: "Open the workspace",
    ctaHref: "/",
  },
  {
    id: "instant-accounts",
    date: "2026-05-30",
    kind: "update",
    title: "Instant accounts — no email verification",
    body: "Sign-up is now one step: enter an email and password and you're in immediately. Optional cloud sync keeps your manuscript across devices. Guest mode still gives you every feature with no account at all.",
  },
  {
    id: "guidelines-2025",
    date: "2026-05-30",
    kind: "notice",
    title: "Updated to CONSORT 2025 & SPIRIT 2025",
    body: "Reporting-guideline coverage now reflects the CONSORT 2025 and SPIRIT 2025 statements (published April 2025). Always confirm the current checklist at the official source before submission.",
  },
];

/** Merge static + remote, de-dupe by id (remote wins), sort pinned→newest. */
export function mergeAnnouncements(
  remote: Announcement[] = [],
): Announcement[] {
  const byId = new Map<string, Announcement>();
  for (const a of staticAnnouncements) byId.set(a.id, a);
  for (const a of remote) byId.set(a.id, a);
  return Array.from(byId.values()).sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (b.pinned && !a.pinned) return 1;
    return b.date.localeCompare(a.date);
  });
}
