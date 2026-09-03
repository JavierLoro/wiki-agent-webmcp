# Submission Readiness

## Links

- Live demo: TODO — add final HTTPS deployment URL
- Public repository: https://github.com/JavierLoro/wiki-agent-webmcp
- Demo video: TODO — add final video URL
- License: MIT
- Testing guide: [docs/DEMO.md](DEMO.md)

## Evaluator access

Open the application in ChatGPT Work's integrated browser using a WebMCP-capable model/runtime.

If a demo password is configured, provide it in the submission form.

The deployment uses shared demo state. Use Reset demo before testing if a previous visitor has modified it.

Recommended first prompt:

> Use only the current page's site tools. Do not use browser control or inspect the interface manually. List the available workspaces, inspect their structured state, open work, and recent activity, then tell me which project needs attention first. Do not modify anything.

## Expected seeded state

A fresh/reset demo contains:

- esigglol
- LockerBoard

esigglol is the main end-to-end testing workspace because it contains realistic production blockers and open work.

## Final end-to-end test

1. Reset the demo.
2. Confirm esigglol and LockerBoard are available.
3. Ask the external agent to use the current page's site tools to list workspaces and inspect state without modifying anything.
4. In esigglol, create a high-priority Production readiness checklist.
5. Add a finding describing the current production release risk.
6. Propose that all critical blockers must be resolved before production approval.
7. Confirm the task, finding, and pending proposal appear automatically without manually reloading.
8. Mark the checklist in progress through WebMCP and confirm the UI updates.
9. Approve the proposal manually.
10. Open Activity and confirm provenance distinguishes external-agent proposal from human approval.
11. Generate Resident Agent analyses in Decisions and Tasks.
12. Return to a previous mode and verify its persisted snapshot loads without a new model call.
13. Make another change and verify prior analysis can be marked stale without auto-regeneration.
14. Analyze a public GitHub repository through workspace.analyze_repository.
15. Retrieve the preview with workspace.get_import_preview.
16. Verify the preview is bounded, evidence-backed, and not automatically imported.
17. Reload and verify SQLite-backed state persists.
18. Reset again and verify test state is removed and the seed is restored.

## Deployment verification

Before final submission:

- configure OPENAI_API_KEY only on the server
- persist SQLite outside the container
- expose a stable HTTPS origin
- confirm the health endpoint responds
- verify state survives restart
- test Reset demo on the deployed environment
- test WebMCP from the same environment evaluators will use
- verify repository analysis remains public-GitHub-only and bounded

## Demo narrative

External agents act.
Humans authorize.
Resident agents interpret.
Specialist agents bootstrap.
The workspace remembers.

> The agents never talked to each other. They collaborated through the workspace.
