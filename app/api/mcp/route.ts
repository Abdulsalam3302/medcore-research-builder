/**
 * MedCore MCP endpoint — Model Context Protocol over Streamable HTTP
 * (stateless mode, JSON responses).
 *
 * Connect from any MCP client, e.g. Claude Code:
 *   claude mcp add --transport http medcore https://medcore-research-builder.vercel.app/api/mcp
 *
 * Tool logic lives in lib/mcp/server.ts; this file is only the JSON-RPC 2.0
 * transport: initialize / ping / tools/list / tools/call, notifications get
 * 202, batches and SSE streams are not used (every call here is a single
 * request/response).
 */

import { NextResponse } from "next/server";
import { enforceRateLimit, safeJson } from "../_utils";
import {
  MCP_PROTOCOL_VERSION,
  MCP_TOOLS,
  SERVER_INFO,
  SERVER_INSTRUCTIONS,
  callMcpTool,
} from "@/lib/mcp/server";

export const runtime = "nodejs";
export const maxDuration = 60;

type JsonRpcRequest = {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
};

function rpcResult(id: string | number | null, result: unknown) {
  return NextResponse.json({ jsonrpc: "2.0", id, result });
}

function rpcError(id: string | number | null, code: number, message: string, status = 200) {
  return NextResponse.json({ jsonrpc: "2.0", id, error: { code, message } }, { status });
}

export async function POST(req: Request) {
  let body: JsonRpcRequest;
  try {
    body = await safeJson<JsonRpcRequest>(req, "llm");
  } catch {
    return rpcError(null, -32700, "Parse error: body must be a single JSON-RPC 2.0 message.", 400);
  }
  if (Array.isArray(body)) {
    return rpcError(null, -32600, "Batch requests are not supported.", 400);
  }
  const method = typeof body?.method === "string" ? body.method : "";
  const hasId = body && "id" in body && body.id !== undefined && body.id !== null;
  const id = hasId ? (body.id as string | number) : null;
  const params = (body?.params || {}) as Record<string, unknown>;

  // Notifications (initialized, cancelled, …) need no response body.
  if (!hasId) {
    return new NextResponse(null, { status: 202 });
  }

  switch (method) {
    case "initialize": {
      const requested = typeof params.protocolVersion === "string" ? params.protocolVersion : "";
      return rpcResult(id, {
        protocolVersion: requested === "2024-11-05" ? requested : MCP_PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions: SERVER_INSTRUCTIONS,
      });
    }
    case "ping":
      return rpcResult(id, {});
    case "tools/list":
      return rpcResult(id, { tools: MCP_TOOLS });
    case "tools/call": {
      const name = typeof params.name === "string" ? params.name : "";
      if (!name) return rpcError(id, -32602, "'name' is required.");
      // Reference verification fans out to several upstream APIs — hold it to
      // the stricter verify budget; everything else shares the search tier.
      const tier = name === "verify_references" ? "verify" : "search";
      const limited = await enforceRateLimit(req, tier);
      if (limited) {
        return rpcError(id, -32000, "Rate limit exceeded — please wait and try again.", 429);
      }
      const args = (params.arguments || {}) as Record<string, unknown>;
      const result = await callMcpTool(name, args);
      return rpcResult(id, result);
    }
    case "resources/list":
      return rpcResult(id, { resources: [] });
    case "prompts/list":
      return rpcResult(id, { prompts: [] });
    default:
      return rpcError(id, -32601, `Method '${method}' not found.`);
  }
}

// Stateless server: no server-initiated SSE stream, no session to delete.
export async function GET() {
  return NextResponse.json(
    { error: "This MCP endpoint is stateless — POST JSON-RPC messages instead." },
    { status: 405, headers: { Allow: "POST" } },
  );
}

export async function DELETE() {
  return new NextResponse(null, { status: 405, headers: { Allow: "POST" } });
}
