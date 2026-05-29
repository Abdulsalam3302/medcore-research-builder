"use client";

import type { ProjectState } from "./types";
import { emptyProject } from "./types";

// Browser-only base64 (URL-safe) encode/decode of UTF-8 text.
function utf8ToBase64Url(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToUtf8(b: string): string {
  const fixed = b.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((b.length + 3) % 4);
  const binary = atob(fixed);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function makeShareLink(p: ProjectState): {
  url: string;
  bytes: number;
  warn?: string;
} {
  const json = JSON.stringify(p);
  const encoded = utf8ToBase64Url(json);
  const base =
    typeof window !== "undefined"
      ? `${window.location.origin}${window.location.pathname}`
      : "";
  const url = `${base}#shared=${encoded}`;
  const bytes = encoded.length;
  let warn: string | undefined;
  if (bytes > 50_000) {
    warn = `Link is ${Math.round(bytes / 1024)}KB — some chat apps strip URLs over ~32KB. Consider exporting JSON instead.`;
  }
  return { url, bytes, warn };
}

export function tryParseSharedHash(): ProjectState | null {
  if (typeof window === "undefined") return null;
  const m = window.location.hash.match(/shared=([^&]+)/);
  if (!m) return null;
  try {
    const raw = base64UrlToUtf8(m[1]);
    const parsed = JSON.parse(raw) as ProjectState;
    return { ...emptyProject(), ...parsed };
  } catch {
    return null;
  }
}

/**
 * Create a server-stored, tokenized share link. The project data lives in
 * Supabase (not the URL). Returns null when the server cannot store it
 * (e.g. Supabase not configured → 503) so callers fall back to makeShareLink.
 */
export async function createServerShare(
  project: ProjectState,
): Promise<{ token: string; url: string; expiresAt: string } | null> {
  try {
    const res = await fetch("/api/share", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ state: project }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      token?: string;
      url?: string;
      expiresAt?: string;
    };
    if (!data.token || !data.url || !data.expiresAt) return null;
    return { token: data.token, url: data.url, expiresAt: data.expiresAt };
  } catch {
    return null;
  }
}

/**
 * Resolve a share token into a project. Spread over emptyProject() for safety,
 * mirroring tryParseSharedHash. Returns null on any failure (expired/missing).
 */
export async function fetchServerShare(token: string): Promise<ProjectState | null> {
  try {
    const res = await fetch(`/api/share?token=${encodeURIComponent(token)}`);
    if (!res.ok) return null;
    const data = (await res.json()) as { state?: ProjectState };
    if (!data.state || typeof data.state !== "object") return null;
    return { ...emptyProject(), ...data.state };
  } catch {
    return null;
  }
}

/** Read a `?share=<token>` value from the current URL, or null. */
export function tryParseShareToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = new URLSearchParams(window.location.search).get("share");
  return token && token.trim() ? token : null;
}

// Merge a remote project into the local one, field by field.
export type MergeChoice = "remote" | "local" | "longer";

export type MergePreviewItem = {
  field: string;
  local: string;
  remote: string;
  choice: MergeChoice;
  localLen: number;
  remoteLen: number;
};

export function buildMergePreview(local: ProjectState, remote: ProjectState): MergePreviewItem[] {
  const fields: Array<{ key: string; localVal: string; remoteVal: string }> = [];
  fields.push({
    key: "title",
    localVal: local.titleFinal || local.titleInputs.draftTitle || "",
    remoteVal: remote.titleFinal || remote.titleInputs.draftTitle || "",
  });
  for (const s of ["introduction", "methods", "results", "discussion", "conclusion"] as const) {
    fields.push({
      key: `sections.${s}`,
      localVal: local.sections[s] || "",
      remoteVal: remote.sections[s] || "",
    });
  }
  fields.push({
    key: "references.raw",
    localVal: local.references.raw,
    remoteVal: remote.references.raw,
  });
  return fields.map((f) => ({
    field: f.key,
    local: f.localVal,
    remote: f.remoteVal,
    localLen: f.localVal.length,
    remoteLen: f.remoteVal.length,
    choice:
      f.remoteVal === f.localVal
        ? "local"
        : f.remoteVal.length > f.localVal.length
        ? "longer"
        : "local",
  }));
}

export function applyMerge(
  local: ProjectState,
  remote: ProjectState,
  decisions: MergePreviewItem[],
): ProjectState {
  const next: ProjectState = JSON.parse(JSON.stringify(local));
  for (const d of decisions) {
    const winner =
      d.choice === "remote"
        ? d.remote
        : d.choice === "local"
        ? d.local
        : d.remote.length > d.local.length
        ? d.remote
        : d.local;
    if (d.field === "title") {
      // mirror to titleFinal if previously set, else draftTitle
      if (next.titleFinal) next.titleFinal = winner;
      else next.titleInputs = { ...next.titleInputs, draftTitle: winner };
    } else if (d.field.startsWith("sections.")) {
      const k = d.field.split(".")[1] as keyof typeof next.sections;
      next.sections[k] = winner;
    } else if (d.field === "references.raw") {
      next.references = { ...next.references, raw: winner };
    }
  }
  // Merge appendices: union by id (remote wins on conflict).
  const appLocal = local.appendices || [];
  const appRemote = remote.appendices || [];
  const map = new Map(appLocal.map((a) => [a.id, a]));
  for (const a of appRemote) map.set(a.id, a);
  next.appendices = Array.from(map.values());
  return next;
}
