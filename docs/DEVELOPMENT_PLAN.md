# Development and Deployment Plan

## MVP acceptance checklist

- First screen explains the workspace-first difference and shows activity.
- Workspaces, tasks, decisions, typed knowledge, runs, and agent sessions persist in SQLite.
- The final ten `workspace.*` tools register in a compatible secure context.
- Multi-workspace discovery and child traversal work.
- Proposal and confirmation remain visibly separate.
- WebMCP writes immediately refresh the UI.
- The internal Wiki Agent reads the same state and retains its session.
- Demo reset is repeatable.
- A user can create a named, typed workspace with useful starting context.
- Reset removes test workspaces and restores only the seeded demo.
- Production build is served by the Node backend.

## Local verification

1. Install dependencies and copy `.env.example` to `.env`.
2. Run `npm run dev`.
3. Check `http://localhost:5173` and `http://localhost:3001/api/health`.
4. Confirm `/api/bootstrap` returns seeded Compa Friki, then create a temporary workspace and verify it is selectable.
5. Create and update state through the UI/API before adding an OpenAI key.
6. Configure `OPENAI_API_KEY`, chat with the Wiki Agent, restart, and test a contextual follow-up.
7. In a WebMCP-capable environment, read context, add a decision, create a task, and confirm the dashboard and internal agent both see the changes.
8. Reset and verify the temporary workspace is removed while seeded workspaces are restored.
9. Run `npm run check`, then `npm start`; confirm `/` and `/api/health` work from the production server.

## Docker deployment on Proxmox

- Copy `.env.example` to `.env` and configure the server-only OpenAI key.
- Run `docker compose up -d --build` inside the Debian VM or LXC.
- Persist SQLite through `./data:/data`; the container uses `/data/wiki-agent.db`.
- Publish the single HTTP origin through Cloudflare Tunnel, which provides public HTTPS and TLS termination.
- Test persistence after both a restart and `docker compose down` followed by `docker compose up -d`.

## Submission order

Prioritize a reliable end-to-end path: database and seed, dashboard, context read, decision/task writes, visible refresh, persistent Wiki Agent, deployment, video, and documentation. Freeze feature scope once these pass; spend remaining time on repeatability and explanation rather than extra tools.
