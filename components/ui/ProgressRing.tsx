"use client";

export function ProgressRing({
  value = 0,
  size = 168,
  stroke = 14,
  label,
  sublabel,
  accent = "var(--mc-blue-500)",
}: {
  value?: number;
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
  accent?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (clamped / 100) * c;

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={label ? `${label}: ${clamped}%` : `${clamped}%`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--mc-blue-100)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={accent}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        <div
          className="mc-numeral leading-none text-[var(--mc-ink-900)]"
          style={{ fontSize: size * 0.36 }}
        >
          {clamped}
          <span
            className="text-[var(--mc-ink-400)]"
            style={{ fontSize: size * 0.14, marginLeft: 1 }}
          >
            %
          </span>
        </div>
        {label && <div className="mc-eyebrow mt-0.5">{label}</div>}
        {sublabel && (
          <div className="text-[11.5px] text-[var(--mc-ink-500)]">{sublabel}</div>
        )}
      </div>
    </div>
  );
}
