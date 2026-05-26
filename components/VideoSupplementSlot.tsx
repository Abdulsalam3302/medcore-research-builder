"use client";

import { videoSupplements } from "@/lib/lifecycle";

export function VideoSupplementSlot({ sectionId }: { sectionId: string }) {
  const item = videoSupplements.find((v) => v.sectionId === sectionId);
  if (!item) return null;

  return (
    <div className="card border-dashed">
      <div className="card-body">
        <div className="eyebrow mb-1">Video demonstration</div>
        <div className="font-medium text-med-ink">{item.title}</div>
        <p className="text-sm text-med-sub mt-1">{item.description}</p>
        <div className="text-xs text-med-subtle mt-2">
          Level: {item.level} {item.duration ? `· Duration: ${item.duration}` : ""}
        </div>
        {item.url ? (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary mt-3 inline-flex"
          >
            Watch full demonstration
          </a>
        ) : (
          <div className="mt-3 rounded-md border border-med-line bg-slate-50 px-3 py-2 text-xs text-med-sub">
            Video demonstration will be added here. You can configure this later in
            <code className="mx-1">lib/lifecycle.ts</code>.
          </div>
        )}
      </div>
    </div>
  );
}
