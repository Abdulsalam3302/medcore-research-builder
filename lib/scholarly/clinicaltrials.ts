/**
 * ClinicalTrials.gov API v2 client.
 * https://clinicaltrials.gov/data-api/api
 *
 * Free, no key required. Useful for:
 *  - methods sections that need protocol/registration cross-checks
 *  - novelty checks (is this trial already registered?)
 *  - benchmarking endpoints used in similar trials
 */

import { scholarlyHeaders, SCHOLARLY_TIMEOUT_MS } from "./_http";

const BASE = "https://clinicaltrials.gov/api/v2";

export type CTrial = {
  nctId: string;
  title: string;
  conditions: string[];
  interventions: string[];
  phase?: string;
  status: string;
  studyType?: string;
  enrollment?: number;
  primaryOutcome?: string;
  sponsor?: string;
  startDate?: string;
  completionDate?: string;
  url: string;
};

export async function ctgSearch(args: {
  query: string;
  pageSize?: number;
  status?: string; // e.g. RECRUITING | COMPLETED
  phase?: string;  // e.g. PHASE3
}): Promise<CTrial[]> {
  const p = new URLSearchParams();
  p.set("query.term", args.query);
  p.set("pageSize", String(Math.min(args.pageSize ?? 25, 100)));
  if (args.status) p.set("filter.overallStatus", args.status);
  if (args.phase) p.set("filter.phase", args.phase);
  p.set("format", "json");
  const res = await fetch(`${BASE}/studies?${p.toString()}`, {
    headers: scholarlyHeaders(),
    signal: AbortSignal.timeout(SCHOLARLY_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`ClinicalTrials.gov ${res.status}`);
  const data = (await res.json()) as { studies?: Array<Record<string, unknown>> };
  const out: CTrial[] = [];
  for (const s of data.studies || []) {
    const proto = (s.protocolSection as Record<string, unknown>) || {};
    const ident = (proto.identificationModule as Record<string, unknown>) || {};
    const status = (proto.statusModule as Record<string, unknown>) || {};
    const cond = (proto.conditionsModule as Record<string, unknown>) || {};
    const arms = (proto.armsInterventionsModule as Record<string, unknown>) || {};
    const desc = (proto.designModule as Record<string, unknown>) || {};
    const enrollObj = (desc.enrollmentInfo as Record<string, number>) || {};
    const sponsorMod = (proto.sponsorCollaboratorsModule as Record<string, unknown>) || {};
    const leadSponsor = (sponsorMod.leadSponsor as Record<string, string>) || {};
    const outcomes = (proto.outcomesModule as Record<string, unknown>) || {};
    const primary = ((outcomes.primaryOutcomes as Array<Record<string, string>>) || [])[0];
    const interventions = ((arms.interventions as Array<{ name?: string; type?: string }>) || [])
      .map((i) => [i.type, i.name].filter(Boolean).join(": "));
    const nctId = (ident.nctId as string) || "";
    out.push({
      nctId,
      title: (ident.briefTitle as string) || (ident.officialTitle as string) || "",
      conditions: (cond.conditions as string[]) || [],
      interventions,
      phase: ((desc.phases as string[]) || [])[0] || undefined,
      status: (status.overallStatus as string) || "",
      studyType: (desc.studyType as string) || undefined,
      enrollment: enrollObj.count || undefined,
      primaryOutcome: primary?.measure || undefined,
      sponsor: leadSponsor.name || undefined,
      startDate: ((status.startDateStruct as Record<string, string>) || {}).date || undefined,
      completionDate: ((status.completionDateStruct as Record<string, string>) || {}).date || undefined,
      url: nctId ? `https://clinicaltrials.gov/study/${nctId}` : "",
    });
  }
  return out;
}
