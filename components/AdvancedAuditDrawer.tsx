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
  supabase?: { configured: boolean };
  rateLimit?: { durable: boolean };
  version?: string;
};

/**
 * Verified access/configuration suggestions. Each maps to an environment
 * variable the app actually reads (see app/api/status/route.ts and
 * lib/scholarly/*), so enabling it has a real, predictable benefit. `active`
 * reads the live status payload so the drawer shows what is already unlocked.
 */
const accessSuggestions: Array<{
  envVar: string;
  label: string;
  benefit: string;
  active: (s: StatusPayload | null) => boolean;
}> = [
  {
    envVar: "NCBI_API_KEY",
    label: "PubMed / NCBI key",
    benefit: "Raises the NCBI E-utilities rate limit (~3→10 requests/sec) so reference checks and searches are faster and fail less.",
    active: (s) => Boolean(s?.pubmed?.keyConfigured),
  },
  {
    envVar: "CROSSREF_MAILTO",
    label: "Crossref polite-pool email",
    benefit: "Enters Crossref's faster, more reliable 'polite pool' for DOI metadata resolution.",
    active: (s) => Boolean(s?.crossref?.mailto),
  },
  {
    envVar: "OPENALEX_MAILTO",
    label: "OpenAlex polite-pool email",
    benefit: "Enters OpenAlex's polite pool for more reliable open scholarly-graph lookups.",
    active: (s) => Boolean(s?.openalex?.mailto),
  },
  {
    envVar: "SEMANTIC_SCHOLAR_API_KEY",
    label: "Semantic Scholar key",
    benefit: "Higher rate limits for citation-graph and relevance lookups.",
    active: (s) => Boolean(s?.semanticScholar?.keyConfigured),
  },
  {
    envVar: "UNPAYWALL_EMAIL",
    label: "Unpaywall email",
    benefit: "Unlocks open-access availability checks so the app can point you to free full text legally.",
    active: (s) => Boolean(s?.unpaywall?.configured),
  },
  {
    envVar: "TAVILY_API_KEY / SERPAPI_API_KEY",
    label: "Web-search fallback",
    benefit: "Enables a general-web fallback when scholarly indexes don't cover a query.",
    active: (s) => Boolean(s?.webSearch?.configured),
  },
  {
    envVar: "SUPABASE_URL / SUPABASE_ANON_KEY",
    label: "Cloud sync & sharing",
    benefit: "Enables server-stored share links and multi-device project sync (otherwise drafts stay local-only).",
    active: (s) => Boolean(s?.supabase?.configured),
  },
  {
    envVar: "REDIS / UPSTASH credentials",
    label: "Durable rate limiting",
    benefit: "Uses a shared store for rate limits so protection holds across serverless instances.",
    active: (s) => Boolean(s?.rateLimit?.durable),
  },
];

/**
 * High-impact, verified integrations a deployer can connect. Each links to the
 * canonical source so it can be confirmed first-hand — consistent with the
 * platform's no-fabrication ethos. The full vetted catalogue lives in the
 * Tools & MCP Directory.
 */
const recommendedIntegrations: Array<{
  name: string;
  category: string;
  why: string;
  verifyUrl: string;
}> = [
  {
    name: "NCBI E-utilities (PubMed)",
    category: "Biomedical literature",
    why: "Official PubMed/PMC programmatic access — already used for reference verification; add a key for higher throughput.",
    verifyUrl: "https://www.ncbi.nlm.nih.gov/books/NBK25501/",
  },
  {
    name: "Crossref REST API",
    category: "DOI metadata",
    why: "Authoritative DOI metadata and resolution for reference integrity.",
    verifyUrl: "https://www.crossref.org/documentation/retrieve-metadata/rest-api/",
  },
  {
    name: "OpenAlex",
    category: "Scholarly graph",
    why: "Open works/authors/venues graph for positioning, fields, and citation context.",
    verifyUrl: "https://docs.openalex.org/",
  },
  {
    name: "Unpaywall",
    category: "Open access",
    why: "Legal open-access full-text locations for cited works.",
    verifyUrl: "https://unpaywall.org/products/api",
  },
  {
    name: "ClinicalTrials.gov API",
    category: "Trial registry",
    why: "Verify trial registration, status, and outcomes for trial manuscripts.",
    verifyUrl: "https://clinicaltrials.gov/data-api/api",
  },
  {
    name: "Model Context Protocol servers",
    category: "MCP",
    why: "Connect AI assistants to databases, filesystems, and scientific data sources — see the full vetted list in Tools & MCP Directory.",
    verifyUrl: "https://github.com/modelcontextprotocol/servers",
  },
];

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
          {/* Verified access & configuration suggestions. */}
          <section className="grid gap-2">
            <div className="text-[11px] uppercase tracking-wide text-med-sub font-semibold">
              Access & configuration suggestions
            </div>
            <div className="text-xs text-med-sub">
              Each suggestion maps to an environment variable the app actually reads, so enabling it
              has a real, predictable benefit. Items already active are marked.
            </div>
            <div className="grid gap-2">
              {accessSuggestions.map((sug) => {
                const on = sug.active(status);
                return (
                  <div key={sug.envVar} className="border border-med-line rounded-lg p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium text-sm text-med-ink">{sug.label}</div>
                      <Badge kind={on ? "good" : "neutral"}>{on ? "active" : "suggested"}</Badge>
                    </div>
                    <div className="text-xs text-med-sub mt-1">{sug.benefit}</div>
                    <code className="mt-1 inline-block text-[10.5px] text-med-ink bg-slate-100 rounded px-1.5 py-0.5">
                      {sug.envVar}
                    </code>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Verified recommended integrations & MCP servers. */}
          <section className="grid gap-2">
            <div className="text-[11px] uppercase tracking-wide text-med-sub font-semibold">
              Recommended integrations & MCP servers
            </div>
            <div className="text-xs text-med-sub">
              High-impact, verifiable sources. Every link points to the canonical documentation so you
              can confirm it first-hand before connecting.
            </div>
            <div className="grid gap-2">
              {recommendedIntegrations.map((it) => (
                <div key={it.name} className="border border-med-line rounded-lg p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium text-sm text-med-ink">{it.name}</div>
                    <Badge kind="neutral">{it.category}</Badge>
                  </div>
                  <div className="text-xs text-med-sub mt-1">{it.why}</div>
                  <a
                    href={it.verifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-med-brand hover:underline mt-1 inline-block"
                  >
                    Verify at source →
                  </a>
                </div>
              ))}
            </div>
          </section>

          <div className="border border-med-line rounded-lg p-3 bg-slate-50 text-xs text-med-sub">
            Audit notes: query strings, source counts, dedup metrics, DOI/PMID checks, and inclusion/exclusion
            rationale can be surfaced here in future API iterations.
          </div>
        </div>
      </aside>
    </div>
  );
}
