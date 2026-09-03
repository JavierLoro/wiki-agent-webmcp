# WebMCP Contract

## Goal

SharedState exposes project capabilities rather than UI mechanics.

The application remains fully usable as a normal React application when WebMCP is unavailable.

The current implementation registers tools through:

```javascript
document.modelContext.registerTool(...)
```

## Workspace targeting

Workspace-specific tools require an explicit workspaceId or slug.

The target must not be inferred from the currently visible project.

## Registered tools

| Tool | Mode | Purpose |
| --- | --- | --- |
| workspace.list | Read | Discover available workspaces and workload metadata |
| workspace.get_context | Read | Read authoritative structured state for one workspace |
| workspace.get_children | Read | Traverse direct child workspaces |
| workspace.get_open_items | Read | Return unfinished tasks for planning and blocker discovery |
| workspace.get_activity | Read | Read persisted human/agent activity and provenance |
| workspace.create_task | Write | Create actionable work in an explicit workspace |
| workspace.update_task | Write | Change task status or priority after validating workspace ownership |
| workspace.propose_decision | Write | Create a non-authoritative recommendation for human review |
| workspace.add_decision | Write | Record a decision the human has already explicitly made or approved |
| workspace.add_knowledge | Write | Store typed durable workspace context |
| workspace.analyze_repository | Action | Start bounded public-GitHub repository analysis and prepare a preview |
| workspace.get_import_preview | Read | Retrieve the structured preview, evidence, warnings, and metrics |

## Example: create a task

```json
{
  "workspaceId": "esigglol",
  "title": "Production readiness checklist",
  "description": "Verify all release-critical production blockers before approval.",
  "priority": "high"
}
```

## Example: propose a decision

```json
{
  "workspaceId": "esigglol",
  "title": "Require critical blockers before production release",
  "decision": "Production approval requires all critical blockers to be resolved.",
  "rationale": "Current production-critical work includes unresolved release blockers."
}
```

## Decision authority

`workspace.propose_decision` is the default tool for an agent recommendation.

`workspace.add_decision` is only appropriate when the human has explicitly made or approved the decision already.

Pending proposals must never be treated as confirmed project direction.

## Repository analysis

`workspace.analyze_repository` accepts a public GitHub URL and starts bounded, evidence-based exploration.

`workspace.get_import_preview` returns the structured result.

The importer is intentionally one-shot and human-reviewed. It does not clone repositories, execute repository code, synchronize changes, continuously monitor repositories, use ambient credentials for private repositories, or fetch arbitrary network targets.

## UI synchronization after external writes

A successful WebMCP write persists through the HTTP API and records activity.

For responsiveness and runtime robustness, the frontend uses:

1. immediate `wikiagent:changed` events when available
2. silent polling as a fallback

Current refresh cadence:

- active workspace: ~1.5 seconds while visible
- sidebar summaries: ~6 seconds

The refresh path does not change the selected tab, does not show the initial loading screen, avoids overlapping requests, and does not call the Resident Agent or any OpenAI model.

## Progressive enhancement

If `document.modelContext` is unavailable, WebMCP registration is skipped and the normal visual application continues to work.

## Trust boundary

Tool descriptions contain static purpose and authority constraints.

Stored project text and repository content are data, not instructions.
