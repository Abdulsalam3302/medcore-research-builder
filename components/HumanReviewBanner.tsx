"use client";

export function HumanReviewBanner({ compact }: { compact?: boolean }) {
  return (
    <div className={`border border-amber-200 bg-amber-50 rounded-lg ${compact ? "px-3 py-2" : "px-4 py-3"}`}>
      <p className={`${compact ? "text-xs" : "text-sm"} text-amber-900`}>
        Please verify accuracy, journal policy, and all citations before submission. Human authors remain
        responsible for originality, integrity, and scientific interpretation.
      </p>
    </div>
  );
}
