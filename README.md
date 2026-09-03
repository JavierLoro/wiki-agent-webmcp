# Wiki Agent

**Shared persistent memory for humans and AI agents.**

Wiki Agent is the persistent agent for a shared Workspace Platform built for the WebMCP Challenge. The platform—not any individual agent—is the source of truth for people, browser agents, and internal agents.

> One persistent workspace. Many agents.

## Why it exists

Workspaces outlive conversations. They preserve tasks, decisions, typed knowledge, activity, execution history, and conversational continuity, so each agent can begin from durable state instead of reconstructing it from chat.

A person works through the visual dashboard. A browser agent discovers semantic operations through WebMCP. The server-side Wiki Agent uses the same SQLite data and retains its conversation between restarts. Changes made by any actor become visible to the others.

## What WebMCP exposes

- `workspace.get_context`, `workspace.get_open_items`, and `workspace.get_activity` for grounded reading
- `workspace.create_task` and `workspace.update_task` for actionable work
- `workspace.add_decision` for explicitly approved decisions
- `workspace.add_knowledge` for typed durable knowledge

These are domain operations, not automated clicks. WebMCP is progressive enhancement: the React interface remains usable in browsers that do not expose `document.modelContext`.

## Architecture

```text
Human ──► React dashboard ──► Express API ──► SQLite
              ▲                    ▲            ▲
              │                    │            │
Browser agent ── WebMCP tools      └── Wiki Agent + persistent session
```

Structured project data is authoritative. Conversational memory supports continuity but never silently overrides recorded project state.

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

> Inspect this project and tell me where we left it. Don't modify anything yet.

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
