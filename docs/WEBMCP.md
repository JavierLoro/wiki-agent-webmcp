# WebMCP Contract

## Goal

Expose workspace capabilities—not UI mechanics—to browser agents. The application remains fully usable when `document.modelContext` is unavailable.

## Registered tools

| Tool | Mode | Purpose |
| --- | --- | --- |
| `workspace.list` | Read | Discover available workspaces |
| `workspace.get_context` | Read | Return the workspace, tasks, decisions, knowledge, children, activity, and recent runs |
| `workspace.get_children` | Read | Traverse the workspace hierarchy |
| `workspace.get_open_items` | Read | Return unfinished work for planning and blocker discovery |
| `workspace.get_activity` | Read | Return recent activity across the workspace |
| `workspace.create_task` | Write | Create actionable workspace work |
| `workspace.update_task` | Write | Change a task's status or priority |
| `workspace.propose_decision` | Write | Record a recommendation awaiting approval |
| `workspace.add_decision` | Write | Record a decision the human has explicitly made or approved |
| `workspace.add_knowledge` | Write | Store a typed note, finding, question, requirement, hypothesis, or reference |
| `workspace.analyze_repository` | Analysis | Produce a bounded, evidence-backed import preview |
| `workspace.get_import_preview` | Read | Retrieve the latest preview and its warnings/budget use |

Example task input:

```json
{
  "workspaceId": "compa-friki",
  "title": "Validate battery dimensions",
  "description": "Measure the physical cell before enclosure revision.",
  "priority": "high"
}
```

Example decision input:

```json
{
  "workspaceId": "compa-friki",
  "title": "Battery selection",
  "decision": "Use LP102228 for the prototype.",
  "rationale": "It meets current capacity and enclosure constraints."
}
```

`workspace.propose_decision` creates a non-authoritative proposal for human review. `workspace.add_decision` writes an authoritative decision and is only appropriate after explicit approval. Repository analysis also creates previews only: it does not apply, clone, sync, mirror, watch, or continuously index. Defaults are 8 calls, 15 files, 8 issues, 256000 bytes, 60000 input tokens, 8000 output tokens, and USD 0.03 estimated cost.

## Progressive enhancement and synchronization

Registration first checks for `document.modelContext`. If it is missing, normal React workflows continue. Every successful WebMCP mutation dispatches `wikiagent:changed`; the UI listens for that event and reloads the workspace, making agent actions immediately visible and correctable by the human.

Tool descriptions are part of the trust boundary. They contain purpose and constraints only, never untrusted stored content.
