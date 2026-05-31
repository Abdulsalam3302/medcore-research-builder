import { bad, handleError, ok, safeJson, enforceRateLimit, BadRequestError } from "../../_utils";
import type { ParsedReference, ReferenceVerification } from "@/lib/types";
import { markDuplicates, verifyReference } from "@/lib/references/verify";
import { parseReferenceBlock } from "@/lib/references/parser";

export const runtime = "nodejs";

type Body =
  | { raw: string }
  | { items: Array<{ originalText: string; parsed: ParsedReference }> };

export async function POST(req: Request) {
  try {
    const limited = await enforceRateLimit(req, "verify");
    if (limited) return limited;
    const body = await safeJson<Body>(req, "references");
    let items: Array<{ originalText: string; parsed: ParsedReference }> = [];
    if (body && "items" in body) {
      // Validate the shape — bad client input must be a 400, not a 502 from a
      // downstream throw when we dereference a missing `parsed` object.
      if (!Array.isArray(body.items)) throw new BadRequestError("'items' must be an array");
      const valid = body.items.every(
        (it) => it && typeof it === "object" && it.parsed && typeof it.parsed === "object",
      );
      if (!valid) throw new BadRequestError("each item must have a 'parsed' reference object");
      items = body.items;
    } else if (body && "raw" in body && body.raw) {
      if (typeof body.raw !== "string") throw new BadRequestError("'raw' must be a string");
      items = parseReferenceBlock(body.raw);
    } else {
      return bad("Provide either 'raw' text or 'items' array");
    }
    if (items.length === 0) return ok({ verifications: [] });
    // Cap fan-out: a 1 MB payload could otherwise trigger thousands of upstream calls.
    if (items.length > 200) throw new BadRequestError("Too many references in one request (max 200).");

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
