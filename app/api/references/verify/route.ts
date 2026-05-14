import { bad, handleError, ok, safeJson } from "../../_utils";
import type { ParsedReference, ReferenceVerification } from "@/lib/types";
import { markDuplicates, verifyReference } from "@/lib/references/verify";
import { parseReferenceBlock } from "@/lib/references/parser";

export const runtime = "nodejs";

type Body =
  | { raw: string }
  | { items: Array<{ originalText: string; parsed: ParsedReference }> };

export async function POST(req: Request) {
  try {
    const body = await safeJson<Body>(req);
    let items: Array<{ originalText: string; parsed: ParsedReference }> = [];
    if ("items" in body) {
      items = body.items;
    } else if ("raw" in body && body.raw) {
      items = parseReferenceBlock(body.raw);
    } else {
      return bad("Provide either 'raw' text or 'items' array");
    }
    if (items.length === 0) return ok({ verifications: [] });

    // Run in parallel but limit concurrency to avoid hammering APIs.
    const out: ReferenceVerification[] = new Array(items.length);
    const concurrency = 4;
    let idx = 0;
    async function worker() {
      while (true) {
        const i = idx++;
        if (i >= items.length) return;
        out[i] = await verifyReference(items[i]);
      }
    }
    await Promise.all(
      Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
    );
    const withDupes = markDuplicates(out);
    return ok({ verifications: withDupes });
  } catch (e) {
    return handleError(e);
  }
}
