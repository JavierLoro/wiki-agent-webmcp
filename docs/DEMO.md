# Demo Script

Target duration: 2–3 minutes.

## 1. Establish the problem

Show the seeded Compa Friki workspace—tasks, decisions, typed knowledge, activity, and runs—and explain that Workspace Platform owns persistence while Wiki Agent is one consumer.

Briefly click **New workspace** and show the name, type, and context fields. Explain that teams can create spaces for their own projects, research, or campaigns, then cancel and return to Compa Friki for the focused demo.

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

Approve the pending proposal manually, open **Decisions**, and click **Generate analysis** in the Resident Agent panel. Then open **Tasks** and generate its separate execution analysis. Returning to Decisions should show the prior snapshot immediately without another model call.

It should summarize the approved battery decision, dimensions finding, validation task, current blocker, and next action from structured state—not from the browser agent's conversation.

After another WebMCP mutation, show that the existing analysis is marked **STALE**, then use **Refresh analysis** once. Narrate: “The resident agent adapts to what I’m looking at, but its analysis is persisted. Switching views doesn't call the model again. The external agent acts through WebMCP; the resident agent interprets the consequences.”

## 5. Prove persistence

Reload the page and show that the decision and briefing remain. Restart the backend and verify that the briefing still appears.

Close with: “Agents come and go. Your workspace remembers. One persistent workspace. Many agents.”

## Reset

Use the **Reset demo** button or send `POST /api/demo/reset` before each recording. Reset restores the seed and removes user-created test workspaces.
