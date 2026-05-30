"use client";

import { useId, useRef, useState } from "react";

/**
 * InfoHint — an inline, accessible explainer that appears on pointer-on (and
 * keyboard focus) and disappears on pointer-off (and blur), with a tap toggle
 * for touch. Used across the platform to make the journey educational: each
 * step/field can carry a short "why this matters" note.
 *
 * Usage:
 *   <InfoHint text="Having a team accelerates research and distributes accountability." />
 *   <InfoHint title="Why a team?" text="...">Do you have a team?</InfoHint>
 *
 * - With children: the children are the hover trigger (e.g. a question label),
 *   and a small ⓘ is appended.
 * - Without children: just the ⓘ icon is the trigger.
 */
export function InfoHint({
  text,
  title,
  children,
  side = "top",
  className = "",
}: {
  text: string;
  title?: string;
  children?: React.ReactNode;
  side?: "top" | "bottom" | "right" | "left";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const hide = () => {
    // Small delay so moving the pointer from trigger to bubble doesn't flicker.
    closeTimer.current = setTimeout(() => setOpen(false), 60);
  };

  const pos =
    side === "bottom"
      ? "top-full mt-2 left-0"
      : side === "right"
        ? "left-full ml-2 top-0"
        : side === "left"
          ? "right-full mr-2 top-0"
          : "bottom-full mb-2 left-0";

  return (
    <span
      className={`relative inline-flex items-center gap-1 ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      {children}
      <button
        type="button"
        aria-label={title || "More information"}
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        className="inline-flex h-[15px] w-[15px] items-center justify-center rounded-full border border-med-line bg-white text-[10px] font-semibold leading-none text-med-sub hover:border-med-brand hover:text-med-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-med-brand/40"
        onFocus={show}
        onBlur={hide}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        i
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className={`absolute z-50 ${pos} w-[260px] max-w-[80vw] rounded-lg border border-med-line bg-white p-2.5 text-[11.5px] leading-relaxed text-med-inkSoft shadow-elevated`}
          // Keep open while the pointer is over the bubble itself.
          onMouseEnter={show}
          onMouseLeave={hide}
        >
          {title && <span className="block font-semibold text-med-ink mb-0.5">{title}</span>}
          {text}
        </span>
      )}
    </span>
  );
}
