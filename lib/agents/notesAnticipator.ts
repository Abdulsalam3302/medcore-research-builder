/**
 * Notes anticipator agent — two-pass LLM call.
 *
 * Pass 1 (extraction): given the user's notes + chosen design, extract a
 * structured PICO/PECO-style bundle and flag inconsistencies with the design.
 *
 * Pass 2 (clarification questions): generate 3-5 high-leverage clarifying
 * questions surfaced as one-tap chips. Only runs after extraction.
 *
 * We deliberately ask the LLM for JSON-only output and validate.
 */

import type { ExpandedNotes, ResearchTypeAnswersV2 } from "../types";
import { designById } from "../registry/designs";
import { featureById } from "../registry/features";
import { callLLM, extractJSON, isLLMConfigured } from "../llm";
import { GLOBAL_SYSTEM } from "../prompts";

export async function anticipateNotes(
  answers: ResearchTypeAnswersV2
): Promise<ExpandedNotes> {
  if (!isLLMConfigured()) {
    return {
      confidence: "low",
      clarifyingQuestions: [
        "Configure an LLM API key to enable notes expansion.",
      ],
    };
  }
  const design = answers.designId ? designById(answers.designId) : undefined;
  const featureNames = (answers.featureIds || [])
    .map((id) => featureById(id)?.name)
    .filter(Boolean);

  const prompt = `Extract a structured manuscript context from the author's notes.

DESIGN: ${design?.name || "(not chosen)"}
${design ? `Primary guideline: ${design.primaryGuideline.acronym} (${design.primaryGuideline.year || ""})` : ""}
${design ? `Design "when-to-use" criteria:\n${design.whenToUseChecklist.map((c) => "  - " + c).join("\n")}` : ""}
SPECIAL FEATURES: ${featureNames.length ? featureNames.join(", ") : "(none)"}

AUTHOR NOTES (free text — extract whatever is present; never invent):
"""
${answers.notes || "(no notes provided)"}
"""

Tasks:
1. Extract PICO/PECO-style fields: population, condition, intervention/exposure, comparator, primary outcome, secondary outcomes (list), setting, country, time period, sample size, data source, ethics approval, registration, funding.
2. Detect inconsistencies between the chosen design + features and the notes (e.g., user picked "case-control" but mentions "randomized"; user picked AI-intervention but mentions no AI). List them under conflictsDetected.
3. Generate 3-5 high-leverage clarifying questions to ask the author next. Make each question a single, concrete, ≤120-character sentence; phrased so the author can answer in 1-2 words or a number.
4. Assess overall confidence in the extraction (high/medium/low).
5. Do NOT invent any value the author did not state. Leave fields absent if not supplied.

Return ONLY this JSON object:
{
  "population": "string|null",
  "condition": "string|null",
  "intervention": "string|null",
  "exposure": "string|null",
  "comparator": "string|null",
  "primaryOutcome": "string|null",
  "secondaryOutcomes": ["string"] | null,
  "setting": "string|null",
  "country": "string|null",
  "timePeriod": "string|null",
  "sampleSize": "string|null",
  "dataSource": "string|null",
  "ethicsApproval": "string|null",
  "registration": "string|null",
  "funding": "string|null",
  "conflictsDetected": ["string"],
  "clarifyingQuestions": ["string"],
  "confidence": "high|medium|low"
}`;

  const text = await callLLM({
    system: GLOBAL_SYSTEM,
    prompt,
    maxTokens: 2500,
    temperature: 0.1,
    jsonOnly: true,
      tracking: { route: "agent/notesAnticipator" },
    });
  const raw = extractJSON<Record<string, unknown>>(text);

  const out: ExpandedNotes = {
    confidence: ((raw.confidence as ExpandedNotes["confidence"]) || "medium"),
  };
  const assignStr = (k: keyof ExpandedNotes) => {
    const v = raw[k as string];
    if (typeof v === "string" && v && v.toLowerCase() !== "null") {
      (out as Record<string, unknown>)[k as string] = v;
    }
  };
  for (const k of [
    "population",
    "condition",
    "intervention",
    "exposure",
    "comparator",
    "primaryOutcome",
    "setting",
    "country",
    "timePeriod",
    "sampleSize",
    "dataSource",
    "ethicsApproval",
    "registration",
    "funding",
  ] as Array<keyof ExpandedNotes>) {
    assignStr(k);
  }
  if (Array.isArray(raw.secondaryOutcomes)) {
    const list = (raw.secondaryOutcomes as unknown[]).filter((x): x is string => typeof x === "string");
    if (list.length) out.secondaryOutcomes = list;
  }
  if (Array.isArray(raw.conflictsDetected)) {
    out.conflictsDetected = (raw.conflictsDetected as unknown[]).filter((x): x is string => typeof x === "string");
  }
  if (Array.isArray(raw.clarifyingQuestions)) {
    out.clarifyingQuestions = (raw.clarifyingQuestions as unknown[]).filter((x): x is string => typeof x === "string");
  }
  return out;
}
