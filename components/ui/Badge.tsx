import { ReactNode } from "react";

export type BadgeKind = "good" | "warn" | "bad" | "info" | "neutral";

export function Badge({
  kind = "neutral",
  children,
}: {
  kind?: BadgeKind;
  children: ReactNode;
}) {
  const cls =
    kind === "good"
      ? "badge-good"
      : kind === "warn"
      ? "badge-warn"
      : kind === "bad"
      ? "badge-bad"
      : kind === "info"
      ? "badge-info"
      : "badge-neutral";
  return <span className={cls}>{children}</span>;
}
