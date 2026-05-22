"use client";

import { IconCheck, IconPen, IconSpark, IconWarn } from "./Icon";

export type ProvenanceKind = "verified" | "draft" | "user" | "risk";

const CFG: Record<
  ProvenanceKind,
  { label: string; fg: string; bg: string; Icon: typeof IconCheck }
> = {
  verified: {
    label: "Verified",
    fg: "var(--mc-verified)",
    bg: "var(--mc-verified-bg)",
    Icon: IconCheck,
  },
  draft: {
    label: "AI-drafted",
    fg: "var(--mc-draft)",
    bg: "var(--mc-draft-bg)",
    Icon: IconSpark,
  },
  user: {
    label: "You",
    fg: "var(--mc-user)",
    bg: "var(--mc-user-bg)",
    Icon: IconPen,
  },
  risk: {
    label: "Unverified",
    fg: "var(--mc-risk)",
    bg: "var(--mc-risk-bg)",
    Icon: IconWarn,
  },
};

export function ProvenanceChip({
  kind = "verified",
  source,
  size = "sm",
}: {
  kind?: ProvenanceKind;
  source?: string;
  size?: "sm" | "md";
}) {
  const cfg = CFG[kind];
  const Icon = cfg.Icon;
  const px = size === "sm" ? "py-[3px] px-2 text-[11px]" : "py-1.5 px-2.5 text-[12.5px]";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold leading-tight ${px}`}
      style={{ background: cfg.bg, color: cfg.fg }}
    >
      <Icon size={size === "sm" ? 11 : 13} />
      <span>{cfg.label}</span>
      {source && (
        <span
          className="opacity-70 font-medium font-mono ml-0.5"
          style={{ fontSize: size === "sm" ? 10 : 11.5 }}
        >
          · {source}
        </span>
      )}
    </span>
  );
}
