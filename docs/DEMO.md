# Demo and Testing Guide

SharedState is a persistent project workspace shared by humans and AI agents.

> Agents come and go. Your workspace remembers.

This guide supports both a short product demo and hands-on testing.

## Recommended environment

- Open the deployed SharedState application in ChatGPT Work's integrated browser.
- Use a model/runtime that exposes the page's site tools.
- Keep the SharedState page active while testing.
- If shared demo state has been modified, use **Reset demo** before starting.
- The default seeded workspaces are **esigglol** and **LockerBoard**.
- For the most reliable interaction, ask the agent to use the **current page's site tools** and explicitly avoid browser control.

## 1. Read shared project state

Recommended prompt:

> Use only the current page's site tools. Do not use browser control or inspect the interface manually. List the available workspaces, inspect their structured state, open work, and recent activity, then tell me which project needs attention first. Do not modify anything.

Expected tools include:

- `workspace.list`
- `workspace.get_context`
- `workspace.get_open_items`
- `workspace.get_activity`

The agent should identify the most urgent project from structured workspace state rather than from visual inspection of the page.

## 2. Let an external agent contribute

Use **esigglol** for the main example.

Recommended prompt:

> In esigglol, use the current page's site tools to:
>
> 1. Create a high-priority task called "Production readiness checklist".
> 2. Add a finding summarizing the current production release risk based on the critical blockers.
> 3. Propose the decision "Require critical blockers before production release", with the recommendation that every critical blocker must be resolved before production approval.
>
> Do not confirm or approve the decision yourself. Do not use browser control or inspect the UI manually.

Expected tools:

- `workspace.create_task`
- `workspace.add_knowledge`
- `workspace.propose_decision`

The new task, finding, and pending proposal should become visible automatically. External WebMCP writes are persisted first; the frontend refreshes silently so the human can see changes without manually reloading the page.

## 3. Continue existing work

Recommended prompt:

> Use the current page's site tools to mark the "Production readiness checklist" task as in progress. Do not make any other changes.

Expected tool:

- `workspace.update_task`

The task should update in the active workspace automatically.

## 4. Human authority

Open **Decisions** and review the pending proposal.

```text
Agent recommendation
        ↓
Pending proposal
        ↓
Human review
   ┌────┴────┐
 Approve   Reject
   ↓
Confirmed decision
```

Approve the proposal manually.

Then open Activity and verify that attribution is preserved: the external agent proposed the decision and the human approved it.

Pending proposals are intentionally not authoritative decisions.

## 5. Resident Agent continuity

The Resident Agent is a read-only contextual interpretation layer over the same persistent workspace state.

Recommended flow:

1. Open Decisions.
2. Generate or refresh the Resident Agent analysis.
3. Verify that the approved production-release direction appears.
4. Open Tasks.
5. Generate the task-focused analysis.
6. Verify that it identifies current priorities and blockers.
7. Return to Decisions.

The previous Decisions analysis should load from its persisted snapshot without another model call.

The Resident Agent does not need access to the external agent's conversation. It reads the same structured workspace state.

> The agents never talked to each other. They collaborated through the workspace.

After a later workspace mutation, a saved Resident Agent analysis may be marked STALE. Refreshing it is an explicit human action; workspace polling never triggers Resident Agent generation.

## 6. Repository Import Agent

SharedState can bootstrap a workspace from a public GitHub repository through a bounded specialist Import Agent.

Recommended prompt:

> Use the current page's site tools to analyze this public GitHub repository for import:
>
> https://github.com/OWNER/REPOSITORY
>
> Inspect the resulting import preview and summarize what the platform detected. Do not confirm or create the workspace.

Expected tools:

- `workspace.analyze_repository`
- `workspace.get_import_preview`

The preview may include project summary, detected type, stack, knowledge, suggested tasks, decision proposals, questions, risks, evidence, provenance, files/issues inspected, and budget metrics.

Repository analysis is one-shot and bounded. It does not clone, execute, synchronize, mirror, poll, or continuously index the repository.

The preview is not applied automatically. A human decides what becomes persistent workspace state.

## 7. Persistence

1. Make a task, knowledge, proposal, or human-approved decision change.
2. Reload the page.
3. Verify that structured state remains.
4. Generate a Resident Agent analysis.
5. Reload again and verify that the saved analysis remains.

State is stored in SQLite.

## 8. Reset

Use Reset demo to remove test mutations and restore the seeded demo workspaces.

Reset removes user-created/imported demo state and restores the current seed.

## Useful WebMCP coverage

A natural end-to-end test can exercise 10 of the 12 current site tools:

- `workspace.list`
- `workspace.get_context`
- `workspace.get_open_items`
- `workspace.get_activity`
- `workspace.create_task`
- `workspace.update_task`
- `workspace.propose_decision`
- `workspace.add_knowledge`
- `workspace.analyze_repository`
- `workspace.get_import_preview`

Situational tools:

- `workspace.get_children` — useful for hierarchical workspaces.
- `workspace.add_decision` — only appropriate when the human has already explicitly made or approved the decision.

## Product model

```text
External WebMCP Agents → act
Humans                → authorize
Resident Agent        → interpret
Import Agent          → bootstrap
SharedState           → remembers
```

There is no requirement for agents to share a conversation.

They share durable project state.
