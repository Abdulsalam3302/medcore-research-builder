"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

/**
 * Themed, accessible replacement for native window.confirm()/alert().
 *
 * Provides a promise-based `confirm()` (resolves true/false) and a transient
 * `notify()` toast, via a context provider mounted once near the app root.
 * The dialog is a real modal (role="dialog", Escape to cancel, focus moved in
 * and restored, backdrop click cancels) so confirmations are consistent with
 * the design system and testable — unlike blocking native dialogs.
 */

type ConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Style the confirm button as destructive (red). */
  danger?: boolean;
};

type Toast = { id: number; text: string; kind: "info" | "error" | "success" };

type Ctx = {
  confirm: (opts: ConfirmOptions | string) => Promise<boolean>;
  notify: (text: string, kind?: Toast["kind"]) => void;
};

const ConfirmCtx = createContext<Ctx | null>(null);

/** Hook used by any component to ask for confirmation or show a toast. */
export function useConfirm(): Ctx {
  const ctx = useContext(ConfirmCtx);
  if (ctx) return ctx;
  // Graceful fallback when used outside a provider (keeps components safe).
  return {
    confirm: async (opts) =>
      typeof window !== "undefined"
        ? window.confirm(typeof opts === "string" ? opts : opts.message)
        : true,
    notify: (text) => {
      if (typeof window !== "undefined") console.info("[notify]", text);
    },
  };
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const prevFocus = useRef<Element | null>(null);

  const confirm = useCallback<Ctx["confirm"]>((opts) => {
    const o = typeof opts === "string" ? { message: opts } : opts;
    return new Promise<boolean>((resolve) => setDialog({ ...o, resolve }));
  }, []);

  const notify = useCallback<Ctx["notify"]>((text, kind = "info") => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  const close = useCallback(
    (value: boolean) => {
      setDialog((d) => {
        d?.resolve(value);
        return null;
      });
    },
    [],
  );

  // Focus management + Escape while the dialog is open.
  useEffect(() => {
    if (!dialog) return;
    prevFocus.current = document.activeElement;
    confirmBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (prevFocus.current instanceof HTMLElement) prevFocus.current.focus();
    };
  }, [dialog, close]);

  return (
    <ConfirmCtx.Provider value={{ confirm, notify }}>
      {children}

      {dialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Cancel"
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => close(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            className="relative card-elevated w-full max-w-md p-5"
          >
            <h2 id="confirm-title" className="section-title text-[16px]">
              {dialog.title || "Please confirm"}
            </h2>
            <p className="mt-2 text-sm text-med-inkSoft leading-relaxed">{dialog.message}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => close(false)}>
                {dialog.cancelLabel || "Cancel"}
              </button>
              <button
                ref={confirmBtnRef}
                type="button"
                className={dialog.danger ? "btn-danger" : "btn-primary"}
                onClick={() => close(true)}
              >
                {dialog.confirmLabel || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2" aria-live="polite">
          {toasts.map((t) => (
            <div
              key={t.id}
              role={t.kind === "error" ? "alert" : "status"}
              className={`rounded-lg px-3.5 py-2.5 text-sm shadow-elevated border ${
                t.kind === "error"
                  ? "bg-rose-50 border-rose-200 text-rose-800"
                  : t.kind === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-white border-med-line text-med-ink"
              }`}
            >
              {t.text}
            </div>
          ))}
        </div>
      )}
    </ConfirmCtx.Provider>
  );
}
