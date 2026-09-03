# Workspace Platform

**A self-hosted persistent workspace for humans and AI agents.**

AI conversations are temporary. Projects are not.

Workspace Platform gives humans and AI agents a shared, structured source of truth for long-running work. External agents collaborate through WebMCP, humans remain in control of authoritative decisions, and a read-only Resident Agent provides contextual continuity across the workspace.

> **Agents come and go. Your workspace remembers.**

## Why

Working with multiple AI agents creates a continuity problem. Project context becomes fragmented across conversations, agents, notes, task trackers, and repositories. Each new agent may understand only part of what has already happened.

Workspace Platform moves that continuity into durable project state:

- tasks and blockers
- confirmed decisions and pending proposals
- typed knowledge
- attributable activity
- agent-generated analysis
- project provenance

Agents do not need to share conversations. They share the workspace.

## How it works

### Human

Uses the visual workspace, reviews proposals, manages projects, and controls authoritative decisions.

### External AI Agent

Connects through WebMCP to discover workspaces, inspect context, create or update tasks, add knowledge, and propose decisions.

### Resident Agent

A read-only continuity layer. It interprets the current workspace according to the active view:

- Overview → project continuity
- Tasks → blockers, dependencies, and execution
- Decisions → confirmed direction and pending proposals
- Knowledge → missing context and contradictions
- Activity → what changed and why it matters

Analyses are persisted per workspace and view. Navigation does not cause new model calls.

### Import Agent

An ephemeral specialist that bootstraps existing public GitHub projects. It progressively explores only the evidence needed to understand a project:

```text
metadata → file tree → README → manifests → issues/docs → selected files
```

Exploration is bounded by explicit limits on calls, files, issues, bytes, tokens, and estimated cost. It produces an evidence-backed preview; nothing becomes durable workspace state until a human confirms the import.

## Repository import

Existing projects can be bootstrapped from public GitHub repositories. The importer does not clone or continuously synchronize the repository. It builds enough understanding to create a useful initial workspace while separating:

- facts
- inferences
- unknowns
- suggested tasks
- decision proposals
- open questions
- risks

Every important generated item retains source-level provenance.

```text
Repository → Agentic analysis → Import preview → Human approval → Structured workspace
```

After confirmation, the imported workspace behaves like any manually created workspace and is available to external WebMCP agents and the Resident Agent.

Current import scope is intentionally limited to public GitHub repositories, their default branch, textual content, and one-time initial import. Private repositories, OAuth, synchronization, webhooks, branch selection, repository mutation, and automatic re-import are not supported.

## WebMCP

Workspace Platform exposes semantic application capabilities through `document.modelContext.registerTool(...)`:

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
11. `workspace.analyze_repository`
12. `workspace.get_import_preview`

These are domain operations rather than UI automation. An agent interacts directly with the workspace model instead of locating buttons or reconstructing the interface visually. The React application remains fully usable when WebMCP is unavailable.

Repository crawling primitives remain private to the Import Agent. WebMCP exposes the product capability to analyze a repository, not low-level file or issue readers.

## Human control

Agent proposals and confirmed decisions are deliberately different. An external agent may propose a decision, but only human approval makes it authoritative workspace state.

Repository imports follow the same principle:

> **Agents prepare. Humans authorize.**

## Architecture

```text
                     Human
                       │
                  Visual UI
                       │
                       ▼
                Shared Workspace
                  /     |      \
                 /      |       \
                ▼       ▼        ▼
        WebMCP Agent  Resident  Import Agent
            acts      interprets bootstraps
```

The shared workspace is the source of truth.

- External agents act.
- Humans authorize.
- Resident agents interpret.
- Specialist agents bootstrap.
- The workspace remembers.

## Create a workspace

Create a workspace manually or bootstrap one from an existing public GitHub repository. A manual workspace only needs a name, project type, and optional context. Once created, it becomes immediately discoverable through WebMCP.

## Run locally

Requirements:

- Node.js 22+
- a build toolchain compatible with `better-sqlite3`

```bash
npm install
cp .env.example .env
npm run dev
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

- Frontend: `http://localhost:5173`
- API: `http://localhost:3001`
- Health: `http://localhost:3001/api/health`

Development runs Vite and the API together. Frontend API calls are proxied to port 3001.

## Docker

Docker Compose is the recommended self-hosted deployment. Copy the environment template, set the required access secrets, and optionally configure the OpenAI models and import budgets.

```bash
cp .env.example .env
# Edit .env and set APP_PASSWORD and APP_SESSION_SECRET
docker compose up -d --build
docker compose logs -f
```

The single application service contains the React frontend, Express backend, Resident Agent, Import Agent, and SQLite persistence. SQLite is stored on the host at:

```text
./data/wiki-agent.db
```

Routine operations:

```bash
docker compose restart
docker compose down
docker compose up -d
```

Check the deployment from another machine:

- Application: `http://SERVER_IP:3001`
- Health: `http://SERVER_IP:3001/api/health`

Both `docker compose restart` and `docker compose down` followed by `docker compose up -d` preserve the database. Do not delete `./data` or use `docker compose down -v` when you want to preserve workspace state.

### Access password

The dashboard and data API require the password configured as `APP_PASSWORD`. `APP_SESSION_SECRET` signs a persistent 30-day, `HttpOnly`, `SameSite=Strict` session cookie.

Generate a signing secret with:

```bash
openssl rand -hex 32
```

`/api/health` and the login/session endpoints remain public. Never expose `APP_PASSWORD`, `APP_SESSION_SECRET`, or `OPENAI_API_KEY` through `VITE_` variables or browser code.

## Proxmox + Cloudflare Tunnel

```text
Internet
   ↓
Cloudflare Tunnel
   ↓
http://IP_LXC_O_VM:3001
   ↓
Docker Compose
   ↓
Workspace Platform
   ↓
SQLite at ./data/wiki-agent.db
```

Run Docker Compose inside a Debian-based Proxmox VM or LXC with Docker support. In Cloudflare Tunnel, publish a hostname such as `wiki-agent.example.com` and point its HTTP service to:

```text
http://IP_DEL_SERVIDOR:3001
```

Cloudflare provides the public HTTPS reverse proxy and TLS termination. The application container exposes a single internal HTTP port and includes no Nginx, Traefik, or TLS configuration.

## Configuration

| Variable | Purpose | Default |
| --- | --- | --- |
| `OPENAI_API_KEY` | Server-side OpenAI API credential | none |
| `OPENAI_MODEL` | Resident Agent model | `gpt-5.4-nano` |
| `OPENAI_IMPORT_MODEL` | Import Agent model | `gpt-5.4-nano` |
| `IMPORT_MAX_MODEL_CALLS` | Maximum model calls per import | `8` |
| `IMPORT_MAX_FILES` | Maximum files inspected | `15` |
| `IMPORT_MAX_ISSUES` | Maximum issues fully inspected | `8` |
| `IMPORT_MAX_BYTES` | Maximum textual source bytes | `256000` |
| `IMPORT_MAX_INPUT_TOKENS` | Import input-token budget | `60000` |
| `IMPORT_MAX_OUTPUT_TOKENS` | Import output-token budget | `8000` |
| `IMPORT_MAX_ESTIMATED_COST` | Maximum estimated import cost | `$0.03` |
| `APP_PASSWORD` | Application access password | required |
| `APP_SESSION_SECRET` | Session-signing secret | required |
| `PORT` | Internal HTTP port | `3001` |
| `HOST_PORT` | Docker host port | `3001` |
| `DATABASE_PATH` | SQLite database location | environment-specific |

## Security model

Workspace and repository content is treated as untrusted data rather than agent instructions. Important authority boundaries:

- external agents may perform explicitly exposed WebMCP operations
- pending proposals are not authoritative decisions
- humans approve durable decisions and imports
- the Resident Agent is read-only
- the Import Agent is ephemeral and cannot confirm its own output
- server secrets never enter frontend assets or Docker build layers

Public GitHub repository content may be processed by the optional Import Agent. Private repositories and GitHub OAuth are not supported.

## Backup

For a consistent SQLite backup, briefly stop the writer, copy the complete data directory, and start it again:

```bash
docker compose stop wiki-agent
cp -a data "data-backup-$(date +%Y%m%d-%H%M%S)"
docker compose start wiki-agent
```

## Example workflow

In a WebMCP-capable browser, ask an external agent to list the workspaces and inspect one without making changes. Then ask it to create a task, add a finding, and propose a decision. The dashboard refreshes from the same persistent state; a human can review the proposal before approving it.

For an existing project, ask the agent to analyze its public GitHub URL. Review the evidence, questions, risks, and suggested work in the Import Preview, then authorize creation from the UI.

Use **Reset demo** to restore the seeded esigglol and LockerBoard workspaces. Reset also removes imported and user-created workspaces, so do not use it for state you need to preserve.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [WebMCP](docs/WEBMCP.md)
- [Security](docs/SECURITY.md)
- [Demo](docs/DEMO.md)
- [Development](docs/DEVELOPMENT_PLAN.md)

## Technology

- WebMCP
- OpenAI Agents SDK
- React and Vite
- TypeScript and Node.js
- Express
- SQLite and `better-sqlite3`
- Zod
- Docker and Docker Compose
- GitHub public repository data
- Cloudflare Tunnel

## License

Released under the [MIT License](LICENSE).
