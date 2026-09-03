# Workspace Platform

**Persistent shared context for humans and AI agents.**

AI conversations are temporary. Projects are not.

Workspace Platform moves continuity into structured shared state that humans, browser agents through WebMCP, and the persistent Wiki Agent can inspect and modify together. The workspace—not a chat or an individual agent—is the source of truth.

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

Agents can propose decisions. Humans approve or reject them. Only approved decisions become authoritative workspace state.

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

Requirements: Node.js 22 or newer and a build toolchain supported by `better-sqlite3`.

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

## Docker deployment

The production image contains the compiled React frontend and Express backend in one service. SQLite remains on the host through the explicit `./data:/data` bind mount.

```bash
cp .env.example .env
# Edit .env and set OPENAI_API_KEY. Keep it server-side.
docker compose up -d --build
docker compose logs -f
```

Routine operations:

```bash
docker compose restart
docker compose down
docker compose up -d
```

From another machine, replace `SERVER_IP` with the Debian VM or LXC address:

- Application: `http://SERVER_IP:3001`
- Health check: `http://SERVER_IP:3001/api/health`

`HOST_PORT` controls the host port and defaults to `3001`; `PORT` controls the single internal HTTP listener and also defaults to `3001`.

### SQLite persistence and backup

The database is stored at `./data/wiki-agent.db` on the Docker host. Both `docker compose restart` and `docker compose down` followed by `docker compose up -d` preserve it.

Do not delete `./data`. Do not use `docker compose down -v` when you intend to preserve state. The bind mount is intentionally visible on the host to simplify backup and migration.

For a consistent backup before judging or updating, briefly stop the service, copy the complete data directory, and start it again:

```bash
docker compose stop wiki-agent
cp -a data "data-backup-$(date +%Y%m%d-%H%M%S)"
docker compose start wiki-agent
```

Stopping the writer ensures the SQLite database and any WAL files form a consistent copy.

## Proxmox and Cloudflare Tunnel

Run Docker Compose inside a Debian-based Proxmox VM or LXC with nesting and Docker support. No Nginx, Traefik, certificate, or HTTPS listener is included in this project.

```text
Internet
   ↓
Cloudflare Tunnel
   ↓
http://IP_LXC_O_VM:3001
   ↓
Docker Compose
   ↓
Wiki Agent
   ↓
SQLite at ./data/wiki-agent.db
```

In Cloudflare Tunnel, publish a hostname such as `wiki-agent.example.com` and point its HTTP service to `http://IP_DEL_SERVIDOR:3001`. Cloudflare provides the public HTTPS reverse proxy and TLS termination; the container exposes only HTTP on the internal network.

The challenge deployment intentionally has no authentication. Restrict direct access to port 3001 at the network/firewall layer as appropriate and expose the public application through the tunnel.

## Try the collaboration flow

In a WebMCP-capable browser environment, open the deployed app and ask:

> List the workspaces, inspect hardware, and summarize unresolved work and recent activity. Don't modify anything yet.

Then:

> In Compa Friki, propose LP102228 as the battery, store its dimensions as a finding, and create a high-priority validation task. Do not confirm the decision.

The browser agent should call `workspace.propose_decision`, `workspace.add_knowledge`, and `workspace.create_task`; the dashboard should refresh immediately. Approve the proposal manually, then ask the integrated Wiki Agent what changed to demonstrate that both agents share the same state.

Use **Reset demo** in the UI, or `POST /api/demo/reset`, to restore the seeded Compa Friki and LockerBoard workspaces.

## Judge Testing

Live demo: **TODO — add final HTTPS deployment URL**

No account, payment, invitation, or judge-provided API key is required. The app is intended to be publicly testable.

Recommended environments:

- ChatGPT in-app browser with WebMCP support
- Google Chrome with WebMCP enabled

Suggested test:

1. Open the live application and confirm the sidebar reports **WebMCP connected**.
2. Ask: “List my workspaces and tell me which one needs attention first. Do not modify anything.”
3. Ask: “In Compa Friki, propose LP102228 as the battery, store its dimensions as a finding, and create a high-priority validation task. Do not confirm the decision.”
4. Confirm the UI shows a pending proposal, knowledge item, task, and WebMCP activity.
5. Approve the proposal manually.
6. Ask Wiki Agent: “What changed in this workspace and what should I do next?”

Wiki Agent should recognize the changes despite not participating in the browser-agent conversation. The public demo uses shared state; use **Reset demo** before testing if another visitor has modified it.

## Hackathon Development

This repository was created and meaningfully developed during the WebMCP Challenge submission period. Challenge-specific work includes:

- multi-workspace support
- semantic WebMCP tools
- persistent activity auditing and actor attribution
- agent decision proposals with human approval and rejection
- persistent Wiki Agent integration

Relevant history:

- `97888ad` — Initial Wiki Agent workspace platform
- `6520975` — `feat: add audited multi-workspace collaboration flow`
- `608c973` — `docs: update challenge architecture and demo flow`

## Configuration

| Variable | Purpose | Default |
| --- | --- | --- |
| `OPENAI_API_KEY` | Server-only credential for the internal agent | none |
| `OPENAI_MODEL` | Model used by the internal agent | `gpt-5.4` |
| `PORT` | Express server port | `3001` |
| `HOST_PORT` | Host port published by Docker Compose | `3001` |
| `DATABASE_PATH` | SQLite path (`/data/wiki-agent.db` in Docker) | `./data/wiki-agent.db` locally |

Never place the API key in HTML, browser code, or a `VITE_` variable.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [WebMCP integration](docs/WEBMCP.md)
- [Development and deployment plan](docs/DEVELOPMENT_PLAN.md)
- [Demo script](docs/DEMO.md)
- [Security model](docs/SECURITY.md)
- [Submission readiness](docs/SUBMISSION.md)

## Third-party technologies

- OpenAI Agents SDK — persistent internal Wiki Agent
- React and Vite — browser interface and production build
- Express — HTTP API and static application server
- SQLite and better-sqlite3 — durable workspace and session persistence
- Zod — runtime input validation

No third-party data source or API is used besides OpenAI for the optional server-side Wiki Agent.

## License

Released under the [MIT License](LICENSE).

## MVP boundaries

This challenge build intentionally omits authentication, multi-user permissions, autonomous background execution, and rollback. Review the security notes before exposing it beyond a controlled demo. The next evolution is an orchestration layer where specialized research, coding, and QA agents return evidence and proposed changes to this shared, human-governed workspace.
