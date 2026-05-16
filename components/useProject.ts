"use client";

import { useEffect, useState } from "react";
import { addSnapshot, loadProject, saveProject } from "@/lib/store";
import type { ProjectState } from "@/lib/types";

export type AutosaveStatus = {
  savedAt: number | null;
  saving: boolean;
};

export function useProject(): {
  project: ProjectState;
  setProject: (p: ProjectState) => void;
  update: (fn: (p: ProjectState) => ProjectState) => void;
  ready: boolean;
  autosave: AutosaveStatus;
} {
  const [project, set] = useState<ProjectState>(() => loadProject());
  const [ready, setReady] = useState(false);
  const [autosave, setAutosave] = useState<AutosaveStatus>({
    savedAt: null,
    saving: false,
  });

  useEffect(() => {
    set(loadProject());
    setReady(true);
    setAutosave({ savedAt: Date.now(), saving: false });
  }, []);

  // Periodic auto-snapshot (one per hour, deduped in addSnapshot).
  useEffect(() => {
    if (!ready) return;
    const id = window.setInterval(() => {
      addSnapshot(project, "Auto snapshot", true);
    }, 1000 * 60 * 30);
    return () => window.clearInterval(id);
  }, [project, ready]);

  function commit(p: ProjectState) {
    setAutosave((a) => ({ ...a, saving: true }));
    saveProject(p);
    setAutosave({ savedAt: Date.now(), saving: false });
  }

  function setProject(p: ProjectState) {
    set(p);
    commit(p);
  }
  function update(fn: (p: ProjectState) => ProjectState) {
    set((prev) => {
      const next = fn(prev);
      commit(next);
      return next;
    });
  }
  return { project, setProject, update, ready, autosave };
}
