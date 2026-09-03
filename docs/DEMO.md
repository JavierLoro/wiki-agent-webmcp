# Demo Script

Target duration: 2–3 minutes.

## 1. Establish the problem

Show the seeded Compa Friki workspace—tasks, decisions, typed knowledge, activity, and runs—and explain that Workspace Platform owns persistence while Wiki Agent is one consumer.

## 2. Let WebMCP read

In a WebMCP-capable environment, ask:

> List workspaces, inspect hardware, and summarize unresolved items and recent activity. Don't modify anything.

Expected: `workspace.list`, followed by `workspace.get_context` for the relevant workspaces and a grounded summary. No mutation should occur.

## 3. Let the browser agent write

Ask:

> Propose LP102228 as the battery, add its dimensions as a finding, and create a verification task. Do not confirm it.

Expected: `workspace.propose_decision`, `workspace.add_knowledge`, and `workspace.create_task`. The proposal is not authoritative until a human approves it. Keep the dashboard visible so the audience sees it refresh.

Optionally ask it to mark the enclosure task blocked until validation is complete; expect `workspace.update_task`.

## 4. Show shared memory

Switch to the integrated Wiki Agent and ask:

Approve the pending proposal manually, then ask:

> What changed in this workspace, and what should I work on next?

It should discover the approved battery decision, dimensions finding, validation task, and current blocker from structured state—not from the browser agent's conversation.

## 5. Prove persistence

Reload the page and show that the decision remains. Ask a contextual follow-up, then restart the backend and verify that the internal conversation also remains.

Close with: “Agents come and go. Your workspace remembers. One persistent workspace. Many agents.”

## Reset

Use the **Reset demo** button or send `POST /api/demo/reset` before each recording.
