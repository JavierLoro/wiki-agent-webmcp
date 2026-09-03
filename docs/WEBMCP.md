# WebMCP Integration

## Goal

Expose project capabilities—not UI mechanics—to browser agents. The application remains fully usable when `document.modelContext` is unavailable.

## Registered tools

| Tool | Mode | Purpose |
| --- | --- | --- |
| `workspace.get_context` | Read | Return the workspace, tasks, decisions, knowledge, children, activity, and recent runs |
| `workspace.get_open_items` | Read | Return unfinished work for planning and blocker discovery |
| `workspace.get_activity` | Read | Return recent activity across the workspace |
| `workspace.create_task` | Write | Create actionable workspace work |
| `workspace.update_task` | Write | Change a task's status or priority |
| `workspace.add_decision` | Write | Record an explicit, human-approved decision |
| `workspace.add_knowledge` | Write | Store a typed note, finding, question, requirement, hypothesis, or reference |

Example task input:

```json
{
  "title": "Validate battery dimensions",
  "description": "Measure the physical cell before enclosure revision.",
  "priority": "high"
}
```

Example decision input:

```json
{
  "title": "Battery selection",
  "decision": "Use LP102228 for the prototype.",
  "rationale": "It meets current capacity and enclosure constraints."
}
```

Suggestions and hypotheses must not be persisted as decisions without explicit approval.

## Progressive enhancement and synchronization

Registration first checks for `document.modelContext`. If it is missing, normal React workflows continue. Every successful WebMCP mutation dispatches `wikiagent:changed`; the UI listens for that event and reloads the workspace, making agent actions immediately visible and correctable by the human.

Tool descriptions are part of the trust boundary. They contain purpose and constraints only, never untrusted stored content.
