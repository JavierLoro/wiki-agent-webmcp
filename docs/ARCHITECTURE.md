# Architecture

## Core idea

Workspace Platform separates durable workspace memory from agent memory. Wiki Agent understands and administers that platform, but does not own its state.

## Actors and source of truth

- **Human:** uses the dashboard to inspect tasks, decisions, typed knowledge, and agent activity.
- **Browser agent:** reads and changes structured state through WebMCP.
- **Persistent Wiki Agent:** runs server-side with the OpenAI Agents SDK, a SQLite-backed session, and workspace tools.
- **Specialist agents (future):** ephemeral research, coding, QA, or documentation workers whose results return to the workspace.

Information precedence is: explicit human decision, structured workspace state, execution records, then conversational memory. Conversation history must not silently override structured state.

## Data model

```text
Workspace (type, context, optional parent)
├── Tasks
├── Decisions
├── Knowledge Items
├── Child Workspaces
├── Agent Runs
└── Agent Session
```

## Shared write flow

```text
Human request → Browser agent → WebMCP tool → HTTP API → SQLite
                                                      ├→ React refresh
                                                      └→ Wiki Agent reads new state
```

Successful WebMCP writes emit `wikiagent:changed`; the React application listens and reloads workspace state.

## Internal agent flow

```text
Wiki Agent UI → POST /api/agent/chat → persistent Session → Wiki Agent
                                                        ├→ list/get_workspace_context
                                                        ├→ create/update_task
                                                        ├→ add_decision
                                                        └→ add_knowledge
```

Agent runs and session items are persisted independently from structured project entities.

## Why semantic tools

Without WebMCP, an agent must infer layout and simulate a fragile sequence of clicks. `workspace.create_task({ title, priority })` is explicit, reliable, auditable, and independent of the visual layout.

## Future direction

The Workspace Platform can support hardware, software, research, campaign, and nested workspaces through one shared core. Wiki Agent can orchestrate specialist research, coding, and QA agents, while each worker returns evidence, artifacts, proposed decisions, and follow-up tasks to the same human-governed state.
