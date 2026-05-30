import type { SVGProps } from "react";

/**
 * MedCore mark — a clean monogram: a rounded blue tile holding a stylized "M"
 * formed by an upward research trend, with a single accent "verification" dot.
 * 70% blue / white, one teal-green accent. Reads cleanly at 16px and 64px.
 */
export function LogoMark({
  size = 32,
  className = "",
  ...rest
}: { size?: number; className?: string } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
      {...rest}
    >
      <defs>
        <linearGradient id="mc-logo-g" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0E7490" />
          <stop offset="0.55" stopColor="#0E6BA8" />
          <stop offset="1" stopColor="#1E3A8A" />
        </linearGradient>
      </defs>
      {/* Rounded tile */}
      <rect x="1.5" y="1.5" width="29" height="29" rx="8.5" fill="url(#mc-logo-g)" />
      {/* Stylized M as an ascending research line (peaks = growth / impact) */}
      <path
        d="M8 21.5V12.5L13 17L16 13L19 17L24 12.5V21.5"
        fill="none"
        stroke="white"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Verification accent dot */}
      <circle cx="24" cy="9.5" r="2.6" fill="#34D399" stroke="white" strokeWidth="1.2" />
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
      <LogoMark size={30} />
      <div className="leading-tight">
        <div className="font-display font-bold text-[15.5px] tracking-tight text-[var(--mc-ink-900)]">
          Med<span className="text-[var(--mc-blue-500,#0E6BA8)]">Core</span>
        </div>
        {showTagline && (
          <div className="mc-eyebrow text-[10px] text-[var(--mc-ink-500)] mt-0.5">
            Research Platform
          </div>
        )}
      </div>
    </div>
  );
}
