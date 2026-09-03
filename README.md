# Workspace Platform

**Persistent shared context for humans and AI agents.**

Workspace Platform makes durable work—not a conversation—the source of truth. Humans, browser agents, Wiki Agent, and future specialist agents consume hierarchical workspace state.

> One persistent workspace. Many agents.

## Why it exists

Workspaces outlive conversations. They preserve tasks, decisions, typed knowledge, activity, execution history, and conversational continuity, so each agent can begin from durable state instead of reconstructing it from chat.

A person works through the visual dashboard. A browser agent discovers semantic operations through WebMCP. The server-side Wiki Agent uses the same SQLite data and retains its conversation between restarts. Changes made by any actor become visible to the others.

## Final WebMCP surface

1. `workspace.list`
2. `workspace.get_context`
3. `workspace.get_children`
4. `workspace.get_open_items`
5. `workspace.get_activity`
6. `workspace.create_task`
7. `workspace.update_task`
8. `workspace.propose_decision`
9. `workspace.add_decision`
10. `workspace.add_knowledge`

Recommendations remain proposals until explicit human approval authorizes confirmation.

These are domain operations, not automated clicks. WebMCP is progressive enhancement: the React interface remains usable in browsers that do not expose `document.modelContext`.

## Architecture

```text
Human ──► React dashboard ──► Express API ──► SQLite
              ▲                    ▲            ▲
              │                    │            │
Browser agent ── WebMCP tools      └── Wiki Agent + persistent session
```

Structured workspace data is authoritative. Conversational memory supports continuity but never silently overrides recorded workspace state.

## Run locally

Requirements: Node.js 20 or newer and a build toolchain supported by `better-sqlite3`.

```bash
npm install
cp .env.example .env
npm run dev
```

On Windows PowerShell, use `Copy-Item .env.example .env`. Add an `OPENAI_API_KEY` to enable the internal agent; the dashboard and project API can still be exercised independently.

- Dashboard: `http://localhost:5173`
- API health: `http://localhost:3001/api/health`

Development runs Vite and the API together. API calls from the frontend are proxied to port 3001.

## Verify and run production locally

```bash
npm run check
npm start
```

`npm run check` type-checks both client and server and creates the Vite production bundle. When `dist/` exists, the Express server serves it alongside `/api`.

## Try the collaboration flow

In a WebMCP-capable browser environment, open the deployed app and ask:

> List the workspaces, inspect hardware, and summarize unresolved work and recent activity. Don't modify anything yet.

Then:

> We've selected the LP102228 battery. Record that decision and create a high-priority task to verify its physical dimensions before changing the enclosure.

The browser agent should call the semantic tools, and the dashboard should refresh immediately. Ask the integrated Wiki Agent what changed to demonstrate that both agents share the same state.

Use **Reset demo** in the UI, or `POST /api/demo/reset`, to restore the seeded Compa Friki workspace.

## Configuration

| Variable | Purpose | Default |
| --- | --- | --- |
| `OPENAI_API_KEY` | Server-only credential for the internal agent | none |
| `OPENAI_MODEL` | Model used by the internal agent | `gpt-5.4` |
| `PORT` | Express server port | `3001` |
| `DATABASE_PATH` | SQLite database location | `./data/wiki-agent.db` |

Never place the API key in HTML, browser code, or a `VITE_` variable.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [WebMCP integration](docs/WEBMCP.md)
- [Development and deployment plan](docs/DEVELOPMENT_PLAN.md)
- [Demo script](docs/DEMO.md)
- [Security model](docs/SECURITY.md)

## MVP boundaries

This challenge build intentionally omits authentication, multi-user permissions, autonomous background execution, and rollback. Review the security notes before exposing it beyond a controlled demo. The next evolution is an orchestration layer where specialized research, coding, and QA agents return evidence and proposed changes to this shared, human-governed workspace.
