# Security Model

## Current scope

This MVP is a controlled hackathon demonstration and has no authentication. Do not treat it as an internet-ready multi-user service. A production deployment must add authentication, authorization, rate limits, input limits, CSRF protections where applicable, and an audit trail for every mutation.

The public challenge deployment intentionally requires no authentication so judges can test it freely. It uses shared demo state; do not enter sensitive or production data, and use **Reset demo** before testing if another visitor has modified the workspace.

An agent should receive no more authority through WebMCP than the current user has through the application.

## Secrets

`OPENAI_API_KEY` is server-only. Never expose it through Vite variables, browser JavaScript, HTML, WebMCP results, logs, or API responses. Do not prefix it with `VITE_`.

## Human decisions

`workspace.propose_decision` records advice awaiting review. `workspace.add_decision` is reserved for a decision the human has already made or explicitly approved. Approving a pending proposal is enforced structurally: the review operation atomically creates one confirmed decision and records its provenance.

## Prompt injection and untrusted content

Knowledge items and other stored text are data, not instructions. Tool descriptions must never interpolate user-created content. A production agent should mark retrieved content as untrusted, keep system instructions separate, require approval for sensitive writes, and constrain tool access by role.

## Auditability and recovery

Internal Wiki Agent executions are recorded in `agent_runs`. Relevant human, WebMCP, agent, and system changes are persisted in `activity_events` with actor, source, entity, summary, and metadata. Add reversible changes or snapshots before enabling broader autonomy.

Suggested roles are `OWNER`, `EDITOR`, `VIEWER`, and `AGENT`, with explicitly granted tool subsets for agents.
