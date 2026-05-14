"use client";

import { useEffect, useState } from "react";
import { loadProject, saveProject } from "@/lib/store";
import type { ProjectState } from "@/lib/types";

export function useProject(): {
  project: ProjectState;
  setProject: (p: ProjectState) => void;
  update: (fn: (p: ProjectState) => ProjectState) => void;
  ready: boolean;
} {
  const [project, set] = useState<ProjectState>(() => loadProject());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Re-hydrate from localStorage on mount (in case SSR placeholder differed)
    set(loadProject());
    setReady(true);
  }, []);

  function setProject(p: ProjectState) {
    set(p);
    saveProject(p);
  }
  function update(fn: (p: ProjectState) => ProjectState) {
    set((prev) => {
      const next = fn(prev);
      saveProject(next);
      return next;
    });
  }
  return { project, setProject, update, ready };
}
