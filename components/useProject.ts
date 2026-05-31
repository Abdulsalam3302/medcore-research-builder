"use client";

import { useEffect, useRef, useState } from "react";
import { addSnapshot, loadProject, saveProject } from "@/lib/store";
import type { ProjectState } from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export type AutosaveStatus = {
  savedAt: number | null;
  saving: boolean;
  cloud?: "idle" | "syncing" | "synced" | "error";
  /** True when the last local (browser) save failed — e.g. storage full/disabled. */
  localError?: boolean;
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
  // Holds the latest project so the snapshot interval can read it without
  // listing `project` as a dependency (which would reset the timer per edit).
  const projectRef = useRef<ProjectState>(project);
  const cloudEnabled = isSupabaseConfigured();

  function hasContent(p: ProjectState): boolean {
    return Boolean(
      p.titleFinal ||
        p.titleInputs?.draftTitle ||
        p.sections?.introduction ||
        p.sections?.methods ||
        p.sections?.results ||
        p.sections?.discussion ||
        p.sections?.conclusion ||
        (p.references?.verifications?.length ?? 0) > 0,
    );
  }

  useEffect(() => {
    async function bootstrap() {
      if (cloudEnabled) {
        try {
          const r = await fetch("/api/projects", { cache: "no-store" });
          if (r.ok) {
            const data = (await r.json()) as {
              project?: ProjectState | null;
              updatedAt?: string | null;
            };
            if (data.project && typeof data.project === "object") {
              const local = loadProject();
              const cloud = data.project;
              const cloudUpdatedAt = data.updatedAt ?? cloud.updatedAt ?? "";
              const localUpdatedAt = local.updatedAt ?? "";
              // Only let cloud overwrite local when cloud is strictly newer, or
              // when local has no meaningful content / no timestamp to trust.
              const cloudIsNewer =
                !hasContent(local) ||
                !localUpdatedAt ||
                (Boolean(cloudUpdatedAt) && cloudUpdatedAt > localUpdatedAt);
              if (cloudIsNewer) {
                const merged = { ...local, ...cloud };
                set(merged);
                projectRef.current = merged;
                saveProject(merged);
              }
              // When local is newer we keep it; queueCloudSync will push it up
              // on the next commit.
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
      addSnapshot(projectRef.current, "Auto snapshot", true);
    }, 1000 * 60 * 30);
    return () => window.clearInterval(id);
  }, [ready]);

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
    projectRef.current = p;
    setAutosave((a) => ({ ...a, saving: true }));
    const okSaved = saveProject(p);
    if (!okSaved) {
      console.warn("useProject: local save failed (storage quota?)");
    }
    // Use the functional updater so we never write a stale `cloud` value, and
    // record localError so the header can warn instead of falsely showing "saved".
    setAutosave((a) => ({
      savedAt: okSaved ? Date.now() : a.savedAt,
      saving: false,
      cloud: a.cloud,
      localError: !okSaved,
    }));
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
