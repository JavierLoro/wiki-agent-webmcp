# Development and Deployment Plan

## Current acceptance checklist

- SharedState presents durable workspace state as the primary source of project continuity.
- Workspaces, tasks, decisions, proposals, typed knowledge, activity, runs, analyses, and import state persist in SQLite.
- Twelve workspace.* WebMCP tools register in a compatible environment.
- Workspace-specific tools require explicit workspace IDs/slugs rather than relying on visible UI state.
- Multi-workspace discovery and child traversal work.
- Agent proposals and human-confirmed decisions remain structurally separate.
- External WebMCP writes become visible without a manual reload or project switch.
- The active workspace silently refreshes approximately every 1.5 seconds while visible.
- Sidebar summaries refresh approximately every 6 seconds.
- Silent refresh avoids overlapping requests and does not trigger Resident Agent generation.
- Resident Agent analyses are read-only and persisted by workspace + mode.
- Repository import uses a separate bounded Import Agent and produces a reviewable preview.
- Users can create their own named/typed workspaces.
- Reset removes test/user/import demo state and restores the current seed.
- Production build is served by the Node backend.

## Local verification

1. Install dependencies and copy .env.example to .env.
2. Run npm run dev.
3. Check the frontend and /api/health.
4. Confirm the current seed contains esigglol and LockerBoard.
5. Create a disposable workspace and verify it is selectable.
6. Create/update workspace state through the normal application/API before configuring an OpenAI key.
7. Configure OPENAI_API_KEY.
8. Generate a Resident Agent analysis and verify the persisted snapshot survives navigation/reload.
9. In a WebMCP-capable environment, inspect a workspace through read tools.
10. Create a task, add knowledge, propose a decision, and update a task through WebMCP.
11. Verify each external mutation appears automatically without reloading or switching projects.
12. Verify silent refresh causes no Resident Agent/model calls.
13. Approve a pending proposal as a human and verify provenance in Activity.
14. Analyze a public repository and retrieve the import preview.
15. Verify import budgets and confirm nothing is applied automatically.
16. Reset and verify disposable/imported/test state is removed while esigglol and LockerBoard return.
17. Run npm run check.
18. Run automated tests.
19. Run the production server and repeat the critical WebMCP path against the production origin.

## Docker deployment

- Copy .env.example to .env.
- Configure the server-only OpenAI API key.
- Run docker compose up -d --build.
- Persist SQLite through the configured host volume.
- Publish one stable HTTPS origin through the chosen reverse proxy / tunnel.
- Verify persistence after a normal restart.
- Verify persistence after docker compose down followed by docker compose up -d.
- Test the actual public deployment from ChatGPT Work rather than relying only on local browser tests.

## Release verification

Before calling a deployment ready:

- health endpoint passes
- authentication/demo access works
- WebMCP tool catalog is detected
- read tools are callable
- write tools persist successfully
- active UI refreshes after external writes
- sidebar metadata catches up
- human proposal approval works
- Resident Agent is only invoked explicitly
- import analysis is bounded and preview-only
- SQLite survives restart
- Reset demo restores deterministic seed state
- npm run check and automated tests pass

## Scope discipline

Prefer a reliable end-to-end workflow over additional surface area.

```text
Discover state
→ agent contributes
→ human authorizes
→ resident interprets
→ specialist bootstraps new context
→ state persists
```
