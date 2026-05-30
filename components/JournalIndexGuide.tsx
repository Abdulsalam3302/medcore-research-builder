"use client";

import { useState } from "react";
import { indexExplainers, indexVerificationNote } from "@/lib/journals/indexGuide";
import { Card, CardBody, CardHeader } from "./ui/Card";
import { Badge } from "./ui/Badge";

/**
 * Collapsible (show/hide) explainer of the indexes that decide a journal's
 * credibility: SCIE, ESCI, Scopus, PubMed, MEDLINE, PMC, DOAJ — what each is,
 * why it matters, how to verify it officially, and the differences that trip
 * researchers up.
 */
export function JournalIndexGuide() {
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <CardHeader
        title="Understanding the indexes (SCIE, ESCI, Scopus, PubMed/MEDLINE…)"
        subtitle="What each index means, how they differ, why they matter, and how to verify a journal's claim at the official source."
        right={
          <button type="button" className="btn-secondary text-xs" onClick={() => setOpen((s) => !s)} aria-expanded={open}>
            {open ? "Hide guide" : "Show guide"}
          </button>
        }
      />
      {open && (
        <CardBody className="grid gap-3">
          <div className="grid gap-3 md:grid-cols-2">
            {indexExplainers.map((e) => (
              <div key={e.id} className="rounded-lg border border-med-line p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold text-[13.5px] text-med-ink">{e.name}</div>
                  <Badge kind="neutral">{e.short}</Badge>
                </div>
                <p className="text-[12px] text-med-inkSoft mt-1.5"><span className="font-medium text-med-ink">What:</span> {e.what}</p>
                <p className="text-[12px] text-med-sub mt-1"><span className="font-medium text-med-ink">Why it matters:</span> {e.importance}</p>
                {e.difference && (
                  <p className="text-[12px] text-amber-700 mt-1"><span className="font-medium">Key difference:</span> {e.difference}</p>
                )}
                <a href={e.verifyUrl} target="_blank" rel="noopener noreferrer" className="text-[11.5px] text-med-brand hover:underline mt-1.5 inline-block">
                  Verify on {e.verifyLabel} →
                </a>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-[12px] text-amber-900">
            <span className="font-semibold">⚠ Beware fake metrics. </span>{indexVerificationNote}
          </div>
        </CardBody>
      )}
    </Card>
  );
}
