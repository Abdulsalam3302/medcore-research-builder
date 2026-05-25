import { ok } from "../_utils";
import { APP_VERSION } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { isLLMConfigured, getActiveProvider } from "@/lib/llm";

export const runtime = "nodejs";

export async function GET() {
  return ok({
    ok: true,
    service: "medcore-research-builder",
    version: APP_VERSION,
    timestamp: new Date().toISOString(),
    supabase: isSupabaseConfigured(),
    llm: isLLMConfigured(),
    llmProvider: getActiveProvider(),
  });
}
