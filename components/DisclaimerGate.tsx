"use client";

import { useCallback, useEffect, useState } from "react";
import {
  acceptDisclaimer,
  clearDisclaimerAcceptance,
  isDisclaimerAccepted,
} from "@/lib/disclaimer";
import { DisclaimerSplash } from "./DisclaimerSplash";

type GatePhase = "boot" | "splash" | "app";

/** Full-screen pre-entry gate before the manuscript workspace loads. */
export function DisclaimerGate({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<GatePhase>("boot");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("resetDisclaimer")) {
      clearDisclaimerAcceptance();
      params.delete("resetDisclaimer");
      const next = params.toString();
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${next ? `?${next}` : ""}`,
      );
    }
    setPhase(isDisclaimerAccepted() ? "app" : "splash");
  }, []);

  const handleContinue = useCallback(() => {
    acceptDisclaimer();
    setPhase("app");
  }, []);

  if (phase === "boot") {
    return <DisclaimerLoadingShell />;
  }

  if (phase === "splash") {
    return <DisclaimerSplash onContinue={handleContinue} />;
  }

  return <>{children}</>;
}

function DisclaimerLoadingShell() {
  return (
    <div
      className="min-h-screen bg-hero-mesh dark:bg-[#0b1220]"
      aria-busy="true"
      aria-label="Loading MedCore Research Builder"
    >
      <div className="mx-auto max-w-3xl px-5 py-16 animate-pulse-soft">
        <div className="mx-auto mb-4 h-8 w-48 rounded-lg bg-white/60 dark:bg-white/10" />
        <div className="mx-auto mb-10 h-4 w-72 rounded bg-white/40 dark:bg-white/10" />
        <div className="h-96 rounded-2xl border border-white/60 bg-white/70 shadow-soft dark:border-white/10 dark:bg-white/5" />
      </div>
    </div>
  );
}
