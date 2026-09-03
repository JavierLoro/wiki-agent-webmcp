# Architecture

## Core idea

SharedState separates durable workspace memory from the memory of any individual agent.

Agents may enter or leave a workflow, use different models, or have completely separate conversations. The workspace remains the durable source of project continuity.

> No shared conversation. Shared state.

## Actors and source of truth

- Human: inspects and edits tasks, decisions, knowledge, activity, and project structure through the visual application.
- External WebMCP Agent: reads and changes structured workspace state through semantic site tools.
- Resident Agent: server-side, read-only contextual interpretation over the current workspace. Its analyses are persisted by workspace and mode.
- Import Agent: bounded specialist agent that explores a public GitHub repository and produces an evidence-backed preview for human review.
- Future specialist agents: research, coding, QA, documentation, or other workers whose useful outputs return to the workspace.

Information precedence:

1. explicit human-approved decisions
2. structured workspace state
3. persisted activity and execution records
4. agent interpretation or conversational memory

Conversation history must never silently override authoritative structured state.

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
├── Resident Analyses (workspace + mode)
└── Agent Session / execution state
```

## External WebMCP flow

```text
Human request
    ↓
External AI Agent
    ↓
WebMCP semantic tool
    ↓
HTTP API
    ↓
SQLite
    ├──→ Activity / provenance
    └──→ Frontend silent refresh
```

WebMCP tools target a workspace explicitly through workspaceId or slug. They must not infer the target from whichever project happens to be visually active.

The frontend keeps the immediate `wikiagent:changed` event path and uses silent polling as a robustness fallback for changes originating outside the visible React execution context:

- active workspace: approximately every 1.5 seconds while visible
- workspace sidebar summaries: approximately every 6 seconds
- overlapping refresh requests are avoided
- polling never triggers Resident Agent generation

## Resident Agent flow

```text
Structured workspace state
        ↓
Explicit Generate / Refresh
        ↓
Resident Agent
        ↓
Persisted analysis snapshot
        ↓
Overview / Tasks / Decisions / Knowledge / Activity
```

Each analysis is keyed by workspace and mode: overview, tasks, decisions, knowledge, or activity.

Navigation reads persisted snapshots. A model call occurs only after explicit Generate analysis or Refresh analysis.

Saved analyses can be marked stale when workspace state changes after the snapshot.

The Resident Agent is an interpreter, not the source of truth and not an autonomous writer.

## Human-reviewed decisions

```text
External agent
    ↓
Proposal
    ↓
Pending human review
 ┌───────┴───────┐
 ↓               ↓
Approve          Reject
 ↓
Confirmed Decision
```

`workspace.propose_decision` creates a non-authoritative proposal.

Approval is transactional: an approved pending proposal creates exactly one authoritative decision and preserves provenance.

`workspace.add_decision` exists for the narrower case where the human has already explicitly made or approved the decision.

## Import Agent flow

```text
Public GitHub repository
        ↓
Bounded progressive exploration
        ↓
Evidence + unresolved questions
        ↓
Structured import preview
        ↓
Human review
        ↓
Selected persistent workspace state
```

Repository content is treated as untrusted data.

The importer is an intake adapter, not a synchronization subsystem. It does not clone a working tree, execute repository code, mirror changes, poll, or continuously index a repository.

## Why semantic site tools

Without WebMCP, an agent may have to interpret visual layout and reproduce fragile click sequences.

Semantic operations are explicit, auditable, layout-independent, and can carry structured authority constraints.

## Persistence

SQLite owns durable workspace state.

A fresh database receives the current demo seed. User-created or imported workspaces live in SQLite and move between deployments only when the database is migrated.

## Design principle

External agents act.
Humans authorize.
Resident agents interpret.
Specialist agents bootstrap.
The workspace remembers.
