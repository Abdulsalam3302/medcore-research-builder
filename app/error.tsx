"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[MedCore]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-med-bg p-6">
      <div className="card-elevated max-w-lg w-full p-6 text-center">
        <h1 className="display-title text-xl">Something went wrong</h1>
        <p className="muted mt-2 text-sm">
          An unexpected error occurred. Your draft in browser storage is usually safe — try
          reloading this section.
        </p>
        <p className="mt-3 text-xs text-med-sub font-mono break-all">{error.message}</p>
        <div className="mt-5 flex gap-2 justify-center">
          <button type="button" className="btn-primary" onClick={() => reset()}>
            Try again
          </button>
          <button type="button" className="btn-ghost" onClick={() => window.location.reload()}>
            Reload page
          </button>
        </div>
      </div>
    </div>
  );
}
