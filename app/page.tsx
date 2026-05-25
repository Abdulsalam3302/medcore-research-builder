"use client";

import dynamic from "next/dynamic";
import { DisclaimerGate } from "@/components/DisclaimerGate";

const WorkspaceApp = dynamic(() => import("@/components/WorkspaceApp"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-med-bg flex items-center justify-center">
      <p className="text-sm text-med-sub">Loading workspace…</p>
    </div>
  ),
});

export default function Page() {
  return (
    <DisclaimerGate>
      <WorkspaceApp />
    </DisclaimerGate>
  );
}
