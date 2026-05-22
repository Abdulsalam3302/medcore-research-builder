import type { SVGProps } from "react";

/** Geometric mark: paper sheet + lines + teal verification dot. */
export function LogoMark({
  size = 32,
  className = "",
  ...rest
}: { size?: number; className?: string } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
      {...rest}
    >
      <rect x="2" y="2" width="24" height="24" rx="7" fill="var(--mc-blue-500, #0E6BA8)" />
      <path
        d="M9 7h8a2 2 0 012 2v12a2 2 0 01-2 2H9a2 2 0 01-2-2V9a2 2 0 012-2z"
        fill="none"
        stroke="white"
        strokeWidth="1.6"
        opacity="0.95"
      />
      <path
        d="M13 12h4M13 15h4M13 18h2"
        stroke="white"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.85"
      />
      <circle
        cx="22"
        cy="7"
        r="3"
        fill="var(--mc-teal-500, #0D9488)"
        stroke="var(--mc-blue-500, #0E6BA8)"
        strokeWidth="1.5"
      />
      <path d="M22 5.5v3M20.5 7h3" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function LogoWordmark({
  className = "",
  showTagline = true,
}: {
  className?: string;
  showTagline?: boolean;
}) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={28} />
      <div className="leading-tight">
        <div className="font-display font-bold text-[15px] tracking-tight text-[var(--mc-ink-900)]">
          MedCore
        </div>
        {showTagline && (
          <div className="mc-eyebrow text-[10px] text-[var(--mc-ink-500)] mt-0.5">
            Research Builder
          </div>
        )}
      </div>
    </div>
  );
}
