# Security Model

## Current scope

This MVP is a controlled hackathon demonstration and has no authentication. Do not treat it as an internet-ready multi-user service. A production deployment must add authentication, authorization, rate limits, input limits, CSRF protections where applicable, and an audit trail for every mutation.

An agent should receive no more authority through WebMCP than the current user has through the application.

## Secrets

`OPENAI_API_KEY` is server-only. Never expose it through Vite variables, browser JavaScript, HTML, WebMCP results, logs, or API responses. Do not prefix it with `VITE_`.

## Human decisions

`workspace.add_decision` is reserved for decisions the human has explicitly made or approved. Agents must not turn a suggestion, hypothesis, or recommendation into durable workspace policy automatically.

## Prompt injection and untrusted content

Notes and other stored text are data, not instructions. Tool descriptions must never interpolate user-created content. A production agent should mark retrieved content as untrusted, keep system instructions separate, require approval for sensitive writes, and constrain tool access by role.

## Auditability and recovery

Internal Wiki Agent executions are recorded in `agent_runs`. Production should also record every WebMCP mutation with actor, tool, arguments, result, timestamp, user, and project. Add reversible changes or snapshots before enabling broader autonomy.

Suggested roles are `OWNER`, `EDITOR`, `VIEWER`, and `AGENT`, with explicitly granted tool subsets for agents.
