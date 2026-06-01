"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * InfoHint — an inline, accessible explainer that appears on pointer-on (and
 * keyboard focus) and disappears on pointer-off (and blur), with a tap toggle
 * for touch. Used across the platform to make the journey educational: each
 * step/field can carry a short "why this matters" note.
 *
 * The explainer bubble is rendered in a PORTAL with fixed positioning computed
 * from the trigger's bounding box. This is deliberate: earlier the bubble was
 * an absolutely-positioned descendant, so any ancestor with `overflow` (the
 * scrollable sidebar, cards, drawers) clipped it and the text was unreadable.
 * A portal escapes every overflow context, and we clamp the bubble into the
 * viewport so the full interpretation is always visible.
 *
 * Usage:
 *   <InfoHint text="Having a team accelerates research." />
 *   <InfoHint title="Why a team?" text="...">Do you have a team?</InfoHint>
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
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const id = useId();
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const BUBBLE_W = 280;
  const GAP = 8;
  const MARGIN = 8;

  const reposition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const r = trigger.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const bubbleH = bubbleRef.current?.offsetHeight ?? 120;
    const bubbleW = bubbleRef.current?.offsetWidth ?? BUBBLE_W;

    let top: number;
    let left: number;
    switch (side) {
      case "bottom":
        top = r.bottom + GAP;
        left = r.left;
        break;
      case "right":
        top = r.top;
        left = r.right + GAP;
        break;
      case "left":
        top = r.top;
        left = r.left - bubbleW - GAP;
        break;
      default: // top
        top = r.top - bubbleH - GAP;
        left = r.left;
    }
    // If a vertical placement would go off-screen, flip it.
    if (side === "top" && top < MARGIN) top = r.bottom + GAP;
    if (side === "bottom" && top + bubbleH > vh - MARGIN) top = r.top - bubbleH - GAP;
    // Clamp into the viewport so the full text is always readable.
    left = Math.max(MARGIN, Math.min(left, vw - bubbleW - MARGIN));
    top = Math.max(MARGIN, Math.min(top, vh - bubbleH - MARGIN));
    setCoords({ top, left });
  }, [side]);

  // Position before paint to avoid a flash at (0,0), then keep it pinned while
  // open as the page scrolls or resizes.
  useLayoutEffect(() => {
    if (!open) return;
    reposition();
    const onMove = () => reposition();
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [open, reposition]);

  const show = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const hide = () => {
    // Small delay so moving the pointer from trigger to bubble doesn't flicker.
    closeTimer.current = setTimeout(() => setOpen(false), 80);
  };

  return (
    <span
      className={`relative inline-flex items-center gap-1 ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      {children}
      <button
        ref={triggerRef}
        type="button"
        aria-label={title || "More information"}
        aria-describedby={open ? id : undefined}
        // 24px touch target (WCAG 2.5.8) with a smaller visual glyph; negative
        // margin keeps it from disturbing inline layout.
        className="inline-flex h-6 w-6 -my-1.5 items-center justify-center text-med-sub hover:text-med-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-med-brand/40 rounded-full"
        onFocus={show}
        onBlur={hide}
        onKeyDown={(e) => {
          if (e.key === "Escape" && open) {
            e.stopPropagation();
            setOpen(false);
          }
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        <span
          aria-hidden
          className="inline-flex h-[15px] w-[15px] items-center justify-center rounded-full border border-med-line bg-white text-[10px] font-semibold leading-none"
        >
          i
        </span>
      </button>
      {open &&
        mounted &&
        createPortal(
          <div
            ref={bubbleRef}
            id={id}
            role="tooltip"
            style={{
              position: "fixed",
              top: coords?.top ?? -9999,
              left: coords?.left ?? -9999,
              width: BUBBLE_W,
              maxWidth: "calc(100vw - 16px)",
              visibility: coords ? "visible" : "hidden",
            }}
            className="z-[1000] rounded-lg border border-med-line bg-white p-3 text-[11.5px] leading-relaxed text-med-inkSoft shadow-elevated"
            onMouseEnter={show}
            onMouseLeave={hide}
          >
            {title && <span className="block font-semibold text-med-ink mb-0.5">{title}</span>}
            {text}
          </div>,
          document.body,
        )}
    </span>
  );
}
