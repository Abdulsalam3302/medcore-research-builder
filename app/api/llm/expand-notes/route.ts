import { bad, handleError, ok, safeJson } from "../../_utils";
import { anticipateNotes } from "@/lib/agents/notesAnticipator";
import type { ResearchTypeAnswersV2 } from "@/lib/types";

export const runtime = "nodejs";

type Body = { answers: ResearchTypeAnswersV2 };

export async function POST(req: Request) {
  try {
    const body = await safeJson<Body>(req);
    if (!body?.answers) return bad("answers is required");
    const expanded = await anticipateNotes(body.answers);
    return ok({ expandedNotes: expanded });
  } catch (e) {
    return handleError(e);
  }
}
