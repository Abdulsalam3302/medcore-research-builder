// AI peer-review swarm endpoint.
//
// POST { project, agents? } → SwarmReport
//
// Runs the selected specialist agents (default: all) sequentially with
// callLLM + extractJSON, tolerating individual agent failures. If no LLM is
// configured, returns a coherence-only SwarmReport so the feature still works
// offline. The deterministic coherence analysis is always folded in.

import { bad, handleError, ok, safeJson, enforceRateLimit } from "../../_utils";
import { callLLM, extractJSON, isLLMConfigured } from "@/lib/llm";
import { analyzeCoherence } from "@/lib/coherence";
import type { ProjectState } from "@/lib/types";
import { buildAgentPrompt, parseAgentResponse, ALL_AGENTS, AGENT_LAYER } from "@/lib/swarm/agents";
import { buildSwarmContext, synthesizeReport } from "@/lib/swarm/orchestrator";
import type { AgentRole, AgentFinding, RawAgentResponse } from "@/lib/swarm/types";

export const runtime = "nodejs";

/** Hard cap on how many agents we will run per request. */
const MAX_AGENTS = 8;

type Body = {
  project?: ProjectState;
  agents?: AgentRole[];
};

function selectAgents(requested?: AgentRole[]): AgentRole[] {
  if (!requested || requested.length === 0) return ALL_AGENTS;
  const valid = requested.filter((r) => (ALL_AGENTS as string[]).includes(r));
  const unique = Array.from(new Set(valid));
  return (unique.length ? unique : ALL_AGENTS).slice(0, MAX_AGENTS);
}

export async function POST(req: Request) {
  const rl = await enforceRateLimit(req, "llm");
  if (rl) return rl;
  try {
    const body = await safeJson<Body>(req, "llm");
    const project = body?.project;
    if (!project) return bad("project is required");

    const agents = selectAgents(body?.agents);
    const coherence = analyzeCoherence(project);
    const ctx = buildSwarmContext(project);

    // Offline / no-LLM path: coherence-only report.
    if (!isLLMConfigured()) {
      const report = synthesizeReport([], coherence, {
        humanReviewRequired: [
          "LLM not configured — only the deterministic coherence layer ran. Run the full swarm with an LLM configured for methodology, statistics, literature, integrity, clarity, and reproducibility review.",
        ],
      });
      return ok({ report, mode: "coherence-only", agentsRun: [], agentsFailed: [] });
    }

    const llmFindings: AgentFinding[] = [];
    const layerSummaries: Record<string, string> = {};
    const humanReviewRequired: string[] = [];
    const agentsRun: AgentRole[] = [];
    const agentsFailed: Array<{ agent: AgentRole; error: string }> = [];

    // Overall wall-clock budget so a stack of slow agents can't run for
    // minutes; once exceeded we stop launching new agents and return what we
    // have (synthesized with the deterministic coherence signals).
    const deadline = Date.now() + (Number(process.env.SWARM_BUDGET_MS) || 120000);

    for (const role of agents) {
      if (Date.now() > deadline) {
        agentsFailed.push({ agent: role, error: "skipped — overall time budget exceeded" });
        continue;
      }
      try {
        const spec = buildAgentPrompt(role, ctx);
        const text = await callLLM({
          system: spec.system,
          prompt: spec.prompt,
          jsonOnly: true,
          maxTokens: 1800,
        });
        const raw = extractJSON<RawAgentResponse>(text);
        const parsed = parseAgentResponse(role, raw);
        llmFindings.push(...parsed.findings);
        if (parsed.summary) {
          // Aggregate per-agent summaries onto a per-agent key for the UI.
          layerSummaries[`agent:${role}`] = parsed.summary;
        }
        humanReviewRequired.push(...parsed.humanReviewRequired);
        // Feed the agent's summary into its quality LAYER so the scorecard
        // layer cards show LLM-authored summaries (not just the count fallback).
        if (parsed.summary) {
          const layer = AGENT_LAYER[role] || "quality";
          layerSummaries[layer] = layerSummaries[layer]
            ? `${layerSummaries[layer]} ${parsed.summary}`
            : parsed.summary;
        }
        agentsRun.push(role);
      } catch (e) {
        // Tolerate a single agent failing — skip and note it.
        agentsFailed.push({
          agent: role,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    const report = synthesizeReport(llmFindings, coherence, {
      layerSummaries,
      humanReviewRequired,
    });

    return ok({
      report,
      mode: agentsRun.length ? "swarm" : "coherence-only",
      agentsRun,
      agentsFailed,
    });
  } catch (e) {
    return handleError(e);
  }
}
