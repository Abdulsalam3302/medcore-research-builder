"use client";

import { useEffect, useRef, useState } from "react";
import { addSnapshot, loadProject, saveProject } from "@/lib/store";
import type { ProjectState } from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export type AutosaveStatus = {
  savedAt: number | null;
  saving: boolean;
  cloud?: "idle" | "syncing" | "synced" | "error";
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
    cloud: "idle",
  });
  const cloudTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cloudEnabled = isSupabaseConfigured();

  useEffect(() => {
    async function bootstrap() {
      if (cloudEnabled) {
        try {
          const r = await fetch("/api/projects", { cache: "no-store" });
          if (r.ok) {
            const data = (await r.json()) as { project?: ProjectState | null };
            if (data.project && typeof data.project === "object") {
              set({ ...loadProject(), ...data.project });
              saveProject({ ...loadProject(), ...data.project });
            }
          }
        } catch {
          /* guest or offline — local only */
        }
      }
      setReady(true);
      setAutosave({ savedAt: Date.now(), saving: false, cloud: "idle" });
    }
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready) return;
    const id = window.setInterval(() => {
      addSnapshot(project, "Auto snapshot", true);
    }, 1000 * 60 * 30);
    return () => window.clearInterval(id);
  }, [project, ready]);

  function queueCloudSync(p: ProjectState) {
    if (!cloudEnabled) return;
    if (cloudTimer.current) clearTimeout(cloudTimer.current);
    cloudTimer.current = setTimeout(async () => {
      setAutosave((a) => ({ ...a, cloud: "syncing" }));
      try {
        const r = await fetch("/api/projects", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ state: p }),
        });
        if (r.status === 401) {
          setAutosave((a) => ({ ...a, cloud: "idle" }));
          return;
        }
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        setAutosave((a) => ({ ...a, cloud: "synced" }));
      } catch {
        setAutosave((a) => ({ ...a, cloud: "error" }));
      }
    }, 2000);
  }

  function commit(p: ProjectState) {
    setAutosave((a) => ({ ...a, saving: true }));
    saveProject(p);
    setAutosave({ savedAt: Date.now(), saving: false, cloud: autosave.cloud });
    queueCloudSync(p);
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
