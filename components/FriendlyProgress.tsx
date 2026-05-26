"use client";

export function FriendlyProgress({
  label,
  detail,
  value,
}: {
  label: string;
  detail: string;
  value: number;
}) {
  return (
    <div className="card">
      <div className="card-body">
        <div className="text-sm font-medium text-med-ink">{label}</div>
        <div className="text-xs text-med-sub mt-0.5">{detail}</div>
        <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full bg-brand-gradient transition-all"
            style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
          />
        </div>
      </div>
    </div>
  );
}
