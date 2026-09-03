# Submission Readiness

## Links

- Live demo: **TODO — add final HTTPS deployment URL**
- Public repository: https://github.com/JavierLoro/wiki-agent-webmcp
- Demo video: **TODO — add final YouTube URL**
- License: MIT

## Judge access

No account, payment, invitation, or judge-provided API key is required. Recommended environments are the ChatGPT in-app browser with WebMCP support or Google Chrome with WebMCP enabled.

The public demo uses shared SQLite workspace state. Use **Reset demo** before testing if another visitor has modified it.

Position the product as a user-created workspace platform for makers, research teams, product teams, and agent builders. Compa Friki is the memorable demonstration of the model, not a hard-coded single-project product.

## Final test

1. Reset the demo and confirm Compa Friki and LockerBoard appear.
2. Briefly open **New workspace** to show that users can supply a name, type, and context; continue the main story in Compa Friki.
3. Ask a browser agent to list and compare the workspaces without modifying them.
4. Ask it to propose the LP102228 battery, store its dimensions as a finding, and create a high-priority validation task without confirming the proposal.
5. Confirm the pending proposal, knowledge item, task, and WebMCP activity appear immediately.
6. Approve the proposal manually.
7. Generate separate **Decisions** and **Tasks** analyses, return to the first view without a model call, then demonstrate the **STALE** marker after a new WebMCP mutation.
8. Confirm it reads the approved decision and related work from shared state.
9. Create a disposable test workspace, reset again, and confirm it plus proposals, conversations, activity, and mutations are gone while the seed returns.

## Before submitting

- Replace both TODO links above.
- Confirm `OPENAI_API_KEY` is configured only on the server.
- Confirm Docker Compose mounts `./data:/data` and sets `DATABASE_PATH=/data/wiki-agent.db`.
- Confirm Cloudflare Tunnel publishes the final HTTPS hostname to the Debian VM/LXC HTTP service on port 3001.
- Exercise all ten WebMCP tools against the deployed HTTPS application.
- Restart the service after a mutation and verify that SQLite state persists.
