"use client";

import { useEffect, useRef, useState } from "react";
import { Spinner } from "./ui/Spinner";

const CDN = "https://cdn.plot.ly/plotly-2.35.2.min.js";

declare global {
  interface Window {
    Plotly?: {
      newPlot: (
        el: HTMLElement,
        data: unknown,
        layout?: unknown,
        config?: unknown,
      ) => Promise<void>;
      purge: (el: HTMLElement) => void;
    };
  }
}

let pendingLoad: Promise<void> | null = null;

function ensurePlotly(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("ssr"));
  if (window.Plotly) return Promise.resolve();
  if (pendingLoad) return pendingLoad;
  pendingLoad = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(
      `script[src="${CDN}"]`,
    ) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Plotly failed to load")));
      return;
    }
    const s = document.createElement("script");
    s.src = CDN;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Plotly failed to load"));
    document.head.appendChild(s);
  });
  return pendingLoad;
}

export function PlotlyPreview({
  spec,
  height = 360,
}: {
  spec: { data?: unknown; layout?: unknown; config?: unknown } | null | undefined;
  height?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!spec || !spec.data) {
      setErr(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const node = ref.current;
    ensurePlotly()
      .then(() => {
        if (cancelled || !ref.current || !window.Plotly) return;
        try {
          window.Plotly.purge(ref.current);
          return window.Plotly.newPlot(
            ref.current,
            spec.data,
            (spec.layout as object) || {},
            { responsive: true, displaylogo: false, ...(spec.config as object) },
          );
        } catch (e) {
          setErr(e instanceof Error ? e.message : String(e));
        }
      })
      .then(() => !cancelled && setLoading(false))
      .catch((e) => {
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : String(e));
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
      if (node && window.Plotly) {
        try {
          window.Plotly.purge(node);
        } catch {
          /* noop */
        }
      }
    };
  }, [spec]);

  if (!spec || !spec.data) {
    return (
      <div className="rounded-lg border border-dashed border-med-line bg-slate-50/40 p-6 text-center text-[13px] text-med-sub">
        No figure spec yet — generate one from the Stats engine.
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-med-line bg-white">
      {loading ? (
        <div className="p-6 flex items-center justify-center text-med-sub text-sm">
          <Spinner dark /> <span className="ml-2">Loading Plotly…</span>
        </div>
      ) : null}
      {err ? <div className="p-3 text-rose-700 text-sm">{err}</div> : null}
      <div ref={ref} style={{ height, width: "100%" }} />
    </div>
  );
}
