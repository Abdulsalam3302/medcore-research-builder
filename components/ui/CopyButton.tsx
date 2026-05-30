"use client";

import { useState } from "react";

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [state, setState] = useState<"idle" | "done" | "error">("idle");
  return (
    <button
      type="button"
      className="btn-secondary"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setState("done");
          setTimeout(() => setState("idle"), 1200);
        } catch (e) {
          // Clipboard API can fail on insecure origins or when permission is denied.
          console.warn("[CopyButton] clipboard write failed", e);
          setState("error");
          setTimeout(() => setState("idle"), 2400);
        }
      }}
      disabled={!text}
      aria-live="polite"
    >
      {state === "done" ? "Copied ✓" : state === "error" ? "Press Ctrl+C" : label}
    </button>
  );
}
