"use client";

import type { CSSProperties, ReactNode } from "react";

export function Skeleton({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      aria-hidden
      className={`inline-block animate-pulse rounded-md bg-slate-200/70 ${className || ""}`}
      style={style}
    />
  );
}

export function SkeletonLines({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className || ""}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton
          key={i}
          className="block h-3 w-full"
          style={{ width: `${85 - i * 8}%` }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({
  title = "Working…",
  subtitle,
  rows = 4,
  children,
}: {
  title?: string;
  subtitle?: string;
  rows?: number;
  children?: ReactNode;
}) {
  return (
    <div className="card-elevated p-5">
      <div className="flex items-center gap-2 mb-1">
        <span className="inline-flex h-2 w-2 rounded-full bg-med-brand animate-pulse" />
        <div className="font-display font-semibold text-med-ink text-sm">{title}</div>
      </div>
      {subtitle ? (
        <div className="text-[12px] text-med-sub mb-3">{subtitle}</div>
      ) : null}
      <SkeletonLines rows={rows} />
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}

export function SkeletonRow({ cols = 4 }: { cols?: number }) {
  return (
    <div className="flex gap-2">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
  );
}
