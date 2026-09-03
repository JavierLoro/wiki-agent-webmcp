# Architecture

## Core idea

Workspace Platform separates durable workspace memory from agent memory. Wiki Agent understands and administers that platform, but does not own its state.

## Actors and source of truth

- **Human:** uses the dashboard to inspect tasks, decisions, typed knowledge, and agent activity.
- **Browser agent:** reads and changes structured state through WebMCP.
- **Resident Wiki Agent:** runs server-side with the OpenAI Agents SDK and a SQLite-backed session, producing read-only continuity briefings from shared state.
- **Specialist agents (future):** ephemeral research, coding, QA, or documentation workers whose results return to the workspace.

Information precedence is: explicit human decision, structured workspace state, execution records, then conversational memory. Conversation history must not silently override structured state.

## Data model

```text
Workspace (type, context, optional parent)
├── Tasks
├── Decisions
├── Decision Proposals
├── Knowledge Items
├── Child Workspaces
├── Activity Events
├── Agent Runs
├── Workspace Briefing
└── Agent Session
```

## Shared write flow

```text
Human request → Browser agent → WebMCP tool → HTTP API → SQLite
                                                      ├→ React refresh
                                                      └→ Wiki Agent reads new state
```

Successful WebMCP writes emit `wikiagent:changed`; the React application listens and reloads workspace state.

## Resident agent flow

```text
Briefing UI → POST /api/agent/briefing → persistent Session → Resident Wiki Agent
                                                          ↓
                                            workspace_briefings + agent_runs
```

Agent runs and session items are persisted independently from structured project entities.

## Human-reviewed decisions

```text
Agent proposes
      │
      ▼
Pending Proposal
      │
 Human review
  ┌───┴───┐
  ▼       ▼
Approve  Reject
  │
  ▼
Confirmed Decision
```

Approval is transactional: a pending proposal becomes approved and creates exactly one authoritative decision. Rejected and already-reviewed proposals cannot be approved later through the same operation.

## Why semantic tools

Without WebMCP, an agent must infer layout and simulate a fragile sequence of clicks. `workspace.create_task({ title, priority })` is explicit, reliable, auditable, and independent of the visual layout.

## Future direction

The Workspace Platform can support hardware, software, research, campaign, and nested workspaces through one shared core. External agents can act, humans authorize, and the Resident Wiki Agent interprets continuity. The resident agent is not the source of truth; it reads the same structured state as everyone else.
