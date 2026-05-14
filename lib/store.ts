"use client";

import type { ProjectState } from "./types";
import { emptyProject } from "./types";

const KEY = "medcore.project.v1";

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

export function saveProject(p: ProjectState) {
  if (typeof window === "undefined") return;
  const toSave: ProjectState = { ...p, updatedAt: new Date().toISOString() };
  localStorage.setItem(KEY, JSON.stringify(toSave));
}

export function resetProject() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
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
