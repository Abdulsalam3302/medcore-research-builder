import type { SVGProps } from "react";

export function LogoMark({
  size = 32,
  className = "",
  ...rest
}: { size?: number; className?: string } & SVGProps<SVGSVGElement>) {
  const id = "mc-logo-grad";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
      {...rest}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0E7490" />
          <stop offset="0.55" stopColor="#0E6BA8" />
          <stop offset="1" stopColor="#1E3A8A" />
        </linearGradient>
        <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="40" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.25" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="40" height="40" rx="10" fill={`url(#${id})`} />
      <rect x="0" y="0" width="40" height="20" rx="10" fill={`url(#${id}-sheen)`} />
      {/* Pulse / heartbeat through a stylized M */}
      <path
        d="M7 24 L12 24 L14.5 18 L18 28 L21.5 13 L25 28 L28 22 L33 22"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Core dot */}
      <circle cx="33" cy="22" r="1.8" fill="#7DD3FC" />
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
      <LogoMark size={36} className="drop-shadow-sm" />
      <div className="leading-tight">
        <div className="font-display font-semibold text-med-ink text-[15px] tracking-tight">
          MedCore
        </div>
        {showTagline && (
          <div className="text-[10.5px] uppercase tracking-[0.14em] text-med-sub -mt-0.5">
            Research Builder
          </div>
        )}
      </div>
    </div>
  );
}
