# MedCore MCP Server

MedCore exposes its research engines as a first-party **Model Context Protocol
(MCP)** server over Streamable HTTP at `/api/mcp`. Any MCP-capable client
(Claude Desktop, Claude Code, IDE agents, custom SDK clients) can use the
platform's journal finder, study-design registry, reference verifier,
coherence checker, and preprint search as tools.

## Connect

```bash
# Claude Code
claude mcp add --transport http medcore https://medcore-research-builder.vercel.app/api/mcp

# Local development
claude mcp add --transport http medcore http://localhost:3000/api/mcp
```

Claude Desktop (`claude_desktop_config.json` via mcp-remote, or any client that
speaks Streamable HTTP) can point at the same URL. The server is **stateless**:
each JSON-RPC message is one POST request/response — no sessions, no SSE
streams, nothing stored server-side.

## Tools

| Tool | What it does |
|------|--------------|
| `find_journals` | Rank candidate journals for a manuscript over the curated + ingested dataset (WoS, Scopus, PubMed/MEDLINE, PMC, DOAJ) with reasons, cautions, and verify links. |
| `list_study_designs` | List the EQUATOR-aligned design registry (RCTs, observational, synthesis, protocols, prediction, case reports, …). |
| `get_study_design` | Full detail for one design: when-to-use checklist, manuscript sections, per-section reporting checklist, extensions, pitfalls. |
| `verify_references` | Parse a citation block and verify each entry against PubMed, Crossref, OpenAlex, Europe PMC, Semantic Scholar. Flags unverified / mismatched / duplicate / possibly-retracted references (max 20 per call). |
| `check_coherence` | Deterministic offline coherence analysis: title↔content, design↔claims, objective↔conclusion, results↔discussion numbers + causal language, citation order. Returns 0–100 score with located issues. |
| `search_preprints` | Search bioRxiv/medRxiv and other preprints via Europe PMC's `SRC:PPR` source. |

## Honesty & safety guarantees

The platform's no-fabrication ethos carries over verbatim:

- Tools **never invent** PMIDs, DOIs, impact factors, or indexing claims.
- Reference verification results are **advisory** — flagged items require
  human confirmation before submission.
- Preprint results carry an explicit *not peer reviewed* note.
- Rate limits apply per IP (`search` tier for most tools, the stricter
  `verify` tier for `verify_references`).

## Protocol details

- Transport: Streamable HTTP (JSON responses, stateless mode).
- Protocol version: `2025-03-26` (also accepts `2024-11-05` clients).
- Implemented methods: `initialize`, `ping`, `tools/list`, `tools/call`;
  `resources/list` and `prompts/list` return empty sets; notifications get
  `202 Accepted`; JSON-RPC batches are rejected.
- Transport code: `app/api/mcp/route.ts` · tool logic: `lib/mcp/server.ts`.

## Quick check

```bash
curl -s https://medcore-research-builder.vercel.app/api/mcp \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | jq '.result.tools[].name'
```
