/**
 * Server-side LLM client. Supports MiniMax (default), Anthropic, and OpenAI.
 * Never import this from client components.
 */

const ANTHROPIC_DEFAULT_MODEL = "claude-sonnet-4-5";
const OPENAI_DEFAULT_MODEL = "gpt-4o-mini";
const MINIMAX_DEFAULT_MODEL = "MiniMax-M2.7-highspeed";
// Default to MiniMax's OpenAI-compatible international endpoint.
// Override via MINIMAX_BASE_URL — e.g. a gateway/proxy that fronts MiniMax models.
const MINIMAX_DEFAULT_BASE_URL = "https://api.minimaxi.chat/v1";

export type Provider = "minimax" | "anthropic" | "openai";

export type LLMCallOptions = {
  system?: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  jsonOnly?: boolean;
};

export class LLMUnconfiguredError extends Error {
  constructor() {
    super(
      "No LLM provider configured. Set MINIMAX_API_KEY (default), ANTHROPIC_API_KEY, or OPENAI_API_KEY in .env.local"
    );
    this.name = "LLMUnconfiguredError";
  }
}

export function getActiveProvider(): Provider | null {
  const pref = (process.env.LLM_PROVIDER || "minimax").toLowerCase();
  if (pref === "minimax" && process.env.MINIMAX_API_KEY) return "minimax";
  if (pref === "anthropic" && process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (pref === "openai" && process.env.OPENAI_API_KEY) return "openai";
  // Fallback chain: prefer whatever is configured.
  if (process.env.MINIMAX_API_KEY) return "minimax";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.OPENAI_API_KEY) return "openai";
  return null;
}

export function isLLMConfigured(): boolean {
  return getActiveProvider() !== null;
}

export async function callLLM(opts: LLMCallOptions): Promise<string> {
  const provider = getActiveProvider();
  if (!provider) throw new LLMUnconfiguredError();
  if (provider === "minimax") return callMiniMax(opts);
  if (provider === "anthropic") return callAnthropic(opts);
  return callOpenAI(opts);
}

async function callMiniMax(opts: LLMCallOptions): Promise<string> {
  const apiKey = process.env.MINIMAX_API_KEY!;
  const baseUrl = (process.env.MINIMAX_BASE_URL || MINIMAX_DEFAULT_BASE_URL).replace(/\/+$/, "");
  const model = process.env.MINIMAX_MODEL || MINIMAX_DEFAULT_MODEL;
  const messages: Array<{ role: string; content: string }> = [];
  if (opts.system) messages.push({ role: "system", content: opts.system });
  messages.push({ role: "user", content: opts.prompt });
  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: opts.temperature ?? 0.2,
    max_tokens: opts.maxTokens ?? 4000,
  };
  // Many gateways respect this — gracefully ignored otherwise.
  if (opts.jsonOnly) body.response_format = { type: "json_object" };
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`MiniMax (${baseUrl}) ${res.status}: ${text.slice(0, 400)}`);
  }
  const data = (await res.json()) as
    | { choices?: Array<{ message?: { content?: string } }> }
    | { reply?: string; base_resp?: { status_code?: number; status_msg?: string } };
  // OpenAI-compatible shape
  if ("choices" in data && data.choices?.[0]?.message?.content) {
    return data.choices[0].message!.content!.trim();
  }
  // Native MiniMax shape
  if ("reply" in data && typeof data.reply === "string") return data.reply.trim();
  throw new Error("MiniMax: unexpected response shape");
}

async function callAnthropic(opts: LLMCallOptions): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY!;
  const model = process.env.ANTHROPIC_MODEL || ANTHROPIC_DEFAULT_MODEL;
  const body = {
    model,
    max_tokens: opts.maxTokens ?? 4000,
    temperature: opts.temperature ?? 0.2,
    system: opts.system,
    messages: [{ role: "user", content: opts.prompt }],
  };
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic ${res.status}: ${text.slice(0, 400)}`);
  }
  const data = (await res.json()) as {
    content: Array<{ type: string; text?: string }>;
  };
  const text = data.content
    .filter((c) => c.type === "text" && c.text)
    .map((c) => c.text)
    .join("")
    .trim();
  return text;
}

async function callOpenAI(opts: LLMCallOptions): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY!;
  const model = process.env.OPENAI_MODEL || OPENAI_DEFAULT_MODEL;
  const messages: Array<{ role: string; content: string }> = [];
  if (opts.system) messages.push({ role: "system", content: opts.system });
  messages.push({ role: "user", content: opts.prompt });
  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: opts.temperature ?? 0.2,
    max_tokens: opts.maxTokens ?? 4000,
  };
  if (opts.jsonOnly) body.response_format = { type: "json_object" };
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI ${res.status}: ${text.slice(0, 400)}`);
  }
  const data = (await res.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices[0]?.message?.content?.trim() || "";
}

/**
 * Extract a JSON object from a possibly noisy LLM response.
 * Handles ```json fences, leading prose, trailing prose.
 */
export function extractJSON<T = unknown>(text: string): T {
  let s = text.trim();
  // Strip <think>...</think> reasoning blocks that some MiniMax models emit
  // before the actual answer (single or multi-line, possibly multiple).
  s = s.replace(/<think>[\s\S]*?<\/think>\s*/gi, "").trim();
  // strip ```json ... ``` or ``` ... ```
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  // find first { or [
  const startObj = s.indexOf("{");
  const startArr = s.indexOf("[");
  let start = -1;
  if (startObj === -1) start = startArr;
  else if (startArr === -1) start = startObj;
  else start = Math.min(startObj, startArr);
  if (start === -1) {
    throw new Error("No JSON object found in LLM output");
  }
  s = s.slice(start);
  // scan for matching end
  const open = s[0];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  let escape = false;
  let end = -1;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === "\\") {
        escape = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
    } else if (ch === open) {
      depth++;
    } else if (ch === close) {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end === -1) throw new Error("Unterminated JSON in LLM output");
  const slice = s.slice(0, end + 1);
  return JSON.parse(slice) as T;
}
