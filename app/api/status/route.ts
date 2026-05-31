import { ok } from "../_utils";
import { APP_VERSION } from "@/lib/constants";
import { isLLMConfigured, getActiveProvider } from "@/lib/llm";
import { webSearchConfigured } from "@/lib/scholarly/websearch";
import { s2Configured } from "@/lib/scholarly/semanticscholar";
import { elicitConfigured } from "@/lib/scholarly/elicit";
import { unpaywallConfigured } from "@/lib/scholarly/unpaywall";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { rateLimitBackend } from "@/lib/rateLimit";

export const runtime = "nodejs";

export async function GET() {
  return ok({
    version: APP_VERSION,
    llm: {
      configured: isLLMConfigured(),
      provider: getActiveProvider(),
    },
    pubmed: {
      // PubMed works without a key but with stricter rate limits.
      configured: true,
      keyConfigured: Boolean(process.env.NCBI_API_KEY),
      tool: process.env.NCBI_TOOL || "MedCoreResearchBuilder",
    },
    crossref: { configured: true, mailto: Boolean(process.env.CROSSREF_MAILTO) },
    openalex: {
      configured: true,
      mailto: Boolean(process.env.OPENALEX_MAILTO),
      keyConfigured: Boolean(process.env.OPENALEX_API_KEY),
    },
    semanticScholar: {
      configured: true, // works without a key
      keyConfigured: s2Configured(),
    },
    elicit: {
      configured: elicitConfigured(),
    },
    europePMC: {
      configured: true, // no key needed
    },
    unpaywall: {
      configured: unpaywallConfigured(),
    },
    openCitations: {
      configured: true, // no key needed
    },
    clinicalTrials: {
      configured: true, // no key needed
    },
    webSearch: {
      configured: Boolean(webSearchConfigured()),
      provider: webSearchConfigured(),
    },
    // Only expose whether cloud sync is available — not the project subdomain,
    // exact LLM provider, app URL, or owner config (avoid fingerprinting the
    // stack on an unauthenticated endpoint).
    supabase: {
      configured: isSupabaseConfigured(),
    },
    rateLimit: {
      durable: rateLimitBackend() === "redis",
    },
  });
}
