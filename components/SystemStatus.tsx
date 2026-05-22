"use client";

import { useEffect, useState } from "react";
import { Badge } from "./ui/Badge";
import { Card, CardBody, CardHeader } from "./ui/Card";
import { Spinner } from "./ui/Spinner";
import { APP_VERSION } from "@/lib/constants";

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

type Row = {
  label: string;
  ok: boolean;
  detail: string;
};

function rowsFrom(data: StatusPayload): Row[] {
  return [
    {
      label: "LLM (drafting & review)",
      ok: Boolean(data.llm?.configured),
      detail: data.llm?.configured
        ? `Active: ${data.llm.provider}`
        : "Add MINIMAX, ANTHROPIC, or OPENAI key",
    },
    {
      label: "PubMed / NCBI",
      ok: Boolean(data.pubmed?.configured),
      detail: data.pubmed?.keyConfigured ? "API key configured" : "Polite pool (slower)",
    },
    {
      label: "Crossref",
      ok: Boolean(data.crossref?.configured),
      detail: data.crossref?.mailto ? "Polite pool" : "Add CROSSREF_MAILTO",
    },
    {
      label: "OpenAlex",
      ok: Boolean(data.openalex?.configured),
      detail: data.openalex?.keyConfigured
        ? "Premium key"
        : data.openalex?.mailto
          ? "Polite pool"
          : "Add OPENALEX_MAILTO",
    },
    {
      label: "Semantic Scholar",
      ok: Boolean(data.semanticScholar?.configured),
      detail: data.semanticScholar?.keyConfigured ? "API key" : "Free tier",
    },
    {
      label: "Europe PMC",
      ok: Boolean(data.europePMC?.configured),
      detail: "No key required",
    },
    {
      label: "Unpaywall (open access)",
      ok: Boolean(data.unpaywall?.configured),
      detail: data.unpaywall?.configured ? "Ready" : "Add UNPAYWALL_EMAIL",
    },
    {
      label: "ClinicalTrials.gov",
      ok: Boolean(data.clinicalTrials?.configured),
      detail: "No key required",
    },
    {
      label: "Web search (novelty)",
      ok: Boolean(data.webSearch?.configured),
      detail: data.webSearch?.configured
        ? `Provider: ${data.webSearch.provider}`
        : "Optional — TAVILY or SERPAPI",
    },
    {
      label: "Elicit",
      ok: Boolean(data.elicit?.configured),
      detail: data.elicit?.configured ? "Configured" : "Optional paid API",
    },
  ];
}

export function SystemStatus() {
  const [data, setData] = useState<StatusPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/status", { cache: "no-store" });
        const json = (await r.json()) as StatusPayload & { error?: string };
        if (!r.ok) throw new Error(json.error || `HTTP ${r.status}`);
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = data ? rowsFrom(data) : [];
  const coreOk = rows.filter((r) => !r.label.includes("Optional") && !r.label.includes("Elicit"))
    .every((r) => r.ok || r.label.includes("Web search"));

  return (
    <Card>
      <CardHeader
        title="System status"
        subtitle={`Integration health for v${data?.version || APP_VERSION}. Scholarly APIs work without LLM; drafting features need an LLM key.`}
        right={
          loading ? (
            <Spinner />
          ) : (
            <Badge kind={coreOk ? "good" : "warn"}>
              {coreOk ? "Core ready" : "Needs setup"}
            </Badge>
          )
        }
      />
      <CardBody>
        {err && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            Could not reach /api/status — {err}. If you see this on localhost:3000, restart the
            dev server (stale processes can break API routes).
          </p>
        )}
        {!err && !loading && (
          <div className="grid gap-2 sm:grid-cols-2">
            {rows.map((row) => (
              <div
                key={row.label}
                className="flex items-start justify-between gap-3 rounded-lg border border-med-line/80 bg-med-bg/40 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-med-ink">{row.label}</div>
                  <div className="text-xs text-med-sub mt-0.5">{row.detail}</div>
                </div>
                <Badge kind={row.ok ? "good" : "neutral"}>{row.ok ? "OK" : "—"}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
