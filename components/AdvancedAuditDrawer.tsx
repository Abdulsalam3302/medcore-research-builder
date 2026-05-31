"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "./ui/Badge";

type StatusPayload = {
  llm?: { configured: boolean; provider: string | null };
  pubmed?: { configured: boolean; keyConfigured: boolean };
  crossref?: { configured: boolean; mailto: boolean };
  openalex?: { configured: boolean; mailto: boolean; keyConfigured: boolean };
  semanticScholar?: { configured: boolean; keyConfigured: boolean };
  elicit?: { configured: boolean };
  europePMC?: { configured: boolean };
  unpaywall?: { configured: boolean };
  openCitations?: { configured: boolean };
  clinicalTrials?: { configured: boolean };
  webSearch?: { configured: boolean; provider: string | null };
  version?: string;
};

const sourceRows: Array<{ key: keyof StatusPayload; label: string; hint: string }> = [
  { key: "llm", label: "Writing assistant", hint: "Drafting engine status" },
  { key: "pubmed", label: "PubMed / NCBI", hint: "Biomedical literature index" },
  { key: "crossref", label: "Crossref", hint: "DOI metadata and resolution" },
  { key: "openalex", label: "OpenAlex", hint: "Open scholarly graph" },
  { key: "semanticScholar", label: "Semantic Scholar", hint: "Citation graph and relevance" },
  { key: "europePMC", label: "Europe PMC", hint: "Open biomedical literature and preprints" },
  { key: "unpaywall", label: "Unpaywall", hint: "Open access availability checks" },
  { key: "openCitations", label: "OpenCitations", hint: "Citation links and relationships" },
  { key: "clinicalTrials", label: "ClinicalTrials.gov", hint: "Trial registry lookup" },
  { key: "elicit", label: "Elicit", hint: "Optional evidence support source" },
  { key: "webSearch", label: "Web fallback", hint: "General-source web retrieval" },
];

export function AdvancedAuditDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<Element | null>(null);

  // Focus management + Escape-to-close + focus trap while the dialog is open.
  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      // Trap Tab within the dialog (WCAG modal expectation).
      if (e.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const activeEl = document.activeElement;
        if (e.shiftKey && activeEl === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && activeEl === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (previouslyFocused.current instanceof HTMLElement) {
        previouslyFocused.current.focus();
      }
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    fetch("/api/status", { cache: "no-store" })
      .then(async (r) => {
        const json = (await r.json()) as StatusPayload & { error?: string };
        if (!r.ok) throw new Error(json.error || `HTTP ${r.status}`);
        setStatus(json);
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close advanced audit drawer"
        className="absolute inset-0 bg-slate-900/35"
        onClick={onClose}
      />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="audit-drawer-title"
        className="absolute right-0 top-0 h-full w-full max-w-[430px] bg-white border-l border-med-line shadow-elevated overflow-y-auto"
      >
        <div className="card-header sticky top-0 bg-white z-10">
          <div>
            <div className="eyebrow">Advanced</div>
            <h3 id="audit-drawer-title" className="section-title text-[15px]">
              Audit log & source transparency
            </h3>
          </div>
          <button ref={closeRef} type="button" className="btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="p-4 grid gap-4">
          <div className="text-sm text-med-sub">
            This drawer is for technical transparency and debugging. Normal workspace views intentionally
            use plain-language labels.
          </div>
          {error ? (
            <div role="alert" className="text-sm text-med-bad">{error}</div>
          ) : (
            <div className="grid gap-2">
              {sourceRows.map((row) => {
                const entry = status?.[row.key] as { configured?: boolean } | undefined;
                const ok = Boolean(entry?.configured);
                return (
                  <div key={row.key} className="border border-med-line rounded-lg p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium text-sm text-med-ink">{row.label}</div>
                      <Badge kind={ok ? "good" : "neutral"}>{ok ? "connected" : "not set"}</Badge>
                    </div>
                    <div className="text-xs text-med-sub mt-1">{row.hint}</div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="border border-med-line rounded-lg p-3 bg-slate-50 text-xs text-med-sub">
            Audit notes: query strings, source counts, dedup metrics, DOI/PMID checks, and inclusion/exclusion
            rationale can be surfaced here in future API iterations.
          </div>
        </div>
      </aside>
    </div>
  );
}
