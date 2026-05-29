"use client";

import type { ProjectState } from "./types";
import { emptyProject } from "./types";

const KEY = "medcore.project.v1";
const SNAPSHOTS_KEY = "medcore.snapshots.v1";
const LAUNCH_BASELINE_KEY = "medcore.launchBaseline.v1";

export type ProjectSnapshot = {
  id: string;
  label: string;
  createdAt: string;
  auto: boolean;
  state: ProjectState;
};

export function loadProject(): ProjectState {
  if (typeof window === "undefined") return emptyProject();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyProject();
    const parsed = JSON.parse(raw) as ProjectState;
    if (!parsed || typeof parsed !== "object") return emptyProject();
    return { ...emptyProject(), ...parsed };
  } catch {
    return emptyProject();
  }
}

// Returns true when the project was persisted, false when localStorage rejected
// the write (e.g. quota exceeded). Callers can react to a false result.
export function saveProject(p: ProjectState): boolean {
  if (typeof window === "undefined") return false;
  const toSave: ProjectState = { ...p, updatedAt: new Date().toISOString() };
  try {
    localStorage.setItem(KEY, JSON.stringify(toSave));
    return true;
  } catch (err) {
    console.warn("saveProject: failed to persist to localStorage", err);
    return false;
  }
}

export function resetProject() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

export function loadSnapshots(): ProjectSnapshot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SNAPSHOTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSnapshots(s: ProjectSnapshot[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(s));
  } catch (err) {
    console.warn("saveSnapshots: failed to persist to localStorage", err);
  }
}

export function addSnapshot(p: ProjectState, label: string, auto = false): ProjectSnapshot {
  const snap: ProjectSnapshot = {
    id: `snap-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    label,
    createdAt: new Date().toISOString(),
    auto,
    state: JSON.parse(JSON.stringify(p)),
  };
  const list = loadSnapshots();
  // keep at most 30 snapshots; auto snapshots no more than 1 per hour
  const recentAuto = list.find(
    (x) => x.auto && Date.now() - new Date(x.createdAt).getTime() < 1000 * 60 * 60,
  );
  if (auto && recentAuto) return recentAuto;
  const next = [snap, ...list].slice(0, 30);
  saveSnapshots(next);
  return snap;
}

export function deleteSnapshot(id: string) {
  saveSnapshots(loadSnapshots().filter((x) => x.id !== id));
}

export function getLaunchBaseline(): { score: number; capturedAt: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LAUNCH_BASELINE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setLaunchBaseline(score: number) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      LAUNCH_BASELINE_KEY,
      JSON.stringify({ score, capturedAt: new Date().toISOString() }),
    );
  } catch (err) {
    console.warn("setLaunchBaseline: failed to persist to localStorage", err);
  }
}

export function downloadAsFile(filename: string, content: string, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 100);
}
