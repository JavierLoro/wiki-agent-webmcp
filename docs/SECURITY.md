# Security Model

## Current scope

SharedState currently uses a single shared password and a signed persistent session cookie.

It is a controlled demonstration / early-stage deployment, not yet a production multi-user service.

A production deployment should add per-user identities and authorization, role-based WebMCP permissions, rate limits, stronger CSRF protections where applicable, operational monitoring, and more granular recovery controls.

Do not enter sensitive production data into a shared public demo environment.

An agent should receive no more authority through WebMCP than the current user is allowed to exercise through the product.

## Secrets

`OPENAI_API_KEY` is server-only.

It must never be exposed through Vite client variables, browser JavaScript, HTML, WebMCP results, client-visible logs, or public API responses.

Do not prefix it with `VITE_`.

## Workspace targeting and authorization

Workspace-specific WebMCP tools require an explicit workspace ID or slug.

The currently visible workspace is not an authorization boundary.

Future multi-user authorization must validate access server-side for the workspace identified in every request.

## Human decisions

Agents can create pending recommendations with `workspace.propose_decision`.

Pending proposals are not authoritative.

`workspace.add_decision` is reserved for cases where the human has already explicitly made or approved the decision.

## Prompt injection and untrusted content

Workspace knowledge, activity text, repository source files, issues, READMEs, and documentation are untrusted data.

They must not be treated as system or developer instructions.

Tool descriptions must remain static and must never interpolate stored user or repository content.

## Repository import

Only public GitHub repositories are supported by the current importer.

Repository exploration is bounded by model calls, files, issues, bytes, token use, and estimated cost.

The importer must not execute repository code, clone or mirror working trees as part of analysis, follow arbitrary network URLs, use ambient credentials for private repositories, continuously synchronize repositories, or silently expand traversal beyond configured budgets.

The result is a preview. It grants no automatic authority to write confirmed decisions.

## Auditability

Relevant human, WebMCP, agent, and system changes are persisted with actor/source information.

This makes it possible to distinguish:

```text
External WebMCP Agent → proposed
Human                 → approved
Resident Agent        → interpreted
Import Agent          → analyzed
```

## Recovery and future controls

Before broader autonomy, add snapshots/rollback, stronger version history, per-user identities, per-workspace permissions, explicit agent roles/tool grants, and approval policies for sensitive mutations.
