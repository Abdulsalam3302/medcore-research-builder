import { ok } from "../_utils";
import { isLLMConfigured, getActiveProvider } from "@/lib/llm";
import { webSearchConfigured } from "@/lib/scholarly/websearch";

export const runtime = "nodejs";

export async function GET() {
  return ok({
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
    openalex: { configured: true, mailto: Boolean(process.env.OPENALEX_MAILTO) },
    webSearch: {
      configured: Boolean(webSearchConfigured()),
      provider: webSearchConfigured(),
    },
  });
}
