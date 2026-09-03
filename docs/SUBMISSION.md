# Submission Readiness

## Links

- Live demo: **TODO — add final HTTPS deployment URL**
- Public repository: https://github.com/JavierLoro/wiki-agent-webmcp
- Demo video: **TODO — add final YouTube URL**
- License: MIT

## Judge access

No account, payment, invitation, or judge-provided API key is required. Recommended environments are the ChatGPT in-app browser with WebMCP support or Google Chrome with WebMCP enabled.

The public demo uses shared SQLite workspace state. Use **Reset demo** before testing if another visitor has modified it.

## Final test

1. Reset the demo and confirm Compa Friki and LockerBoard appear.
2. Ask a browser agent to list and compare the workspaces without modifying them.
3. Ask it to propose the LP102228 battery, store its dimensions as a finding, and create a high-priority validation task without confirming the proposal.
4. Confirm the pending proposal, knowledge item, task, and WebMCP activity appear immediately.
5. Approve the proposal manually.
6. Ask Wiki Agent what changed and what to do next.
7. Confirm it reads the approved decision and related work from shared state.
8. Reset again and confirm proposals, conversations, activity, and mutations are gone.

## Before submitting

- Replace both TODO links above.
- Confirm `OPENAI_API_KEY` is configured only on the server.
- Confirm Docker Compose mounts `./data:/data` and sets `DATABASE_PATH=/data/wiki-agent.db`.
- Confirm Cloudflare Tunnel publishes the final HTTPS hostname to the Debian VM/LXC HTTP service on port 3001.
- Exercise all ten WebMCP tools against the deployed HTTPS application.
- Restart the service after a mutation and verify that SQLite state persists.
