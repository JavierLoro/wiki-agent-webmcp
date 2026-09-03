import { addDecision, addKnowledge, createTask, getWorkspace, updateTask } from "./api";
import type { TaskPriority, TaskStatus } from "./types";

const changed = () => window.dispatchEvent(new CustomEvent("wikiagent:changed"));

export function registerWikiAgentWebMCP(): AbortController {
  const controller = new AbortController();
  const context = document.modelContext;

  if (!context) {
    console.info("WebMCP is unavailable; Wiki Agent continues in browser-only mode.");
    return controller;
  }

  const register = (tool: WebMCPTool) => {
    void context.registerTool(tool, { signal: controller.signal }).catch((error: unknown) => {
      if (!controller.signal.aborted) console.error(`Could not register ${tool.name}`, error);
    });
  };

  register({
    name: "workspace.get_context",
    title: "Get workspace context",
    description: "Read the complete current workspace including metadata, tasks, decisions, typed knowledge, recent agent runs, and activity. Use this before reasoning about its status.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true },
    execute: async () => JSON.stringify(await getWorkspace()),
  });

  register({
    name: "workspace.get_open_items",
    title: "Get open work",
    description: "Return all unfinished workspace tasks. Use this to identify blockers, prioritize work, or resume the workspace.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true },
    execute: async () => JSON.stringify((await getWorkspace()).tasks.filter((task) => task.status !== "done")),
  });

  register({
    name: "workspace.create_task",
    title: "Create workspace task",
    description: "Create a concrete task in the current workspace when the user asks to record actionable work.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Short, actionable task title." },
        description: { type: "string", description: "Optional details and acceptance context." },
        priority: { type: "string", enum: ["low", "medium", "high", "critical"] },
      },
      required: ["title"],
      additionalProperties: false,
    },
    execute: async (input) => {
      const workspace = await getWorkspace();
      const result = await createTask({
        workspaceId: workspace.workspace.id,
        title: String(input.title),
        description: input.description ? String(input.description) : undefined,
        priority: input.priority as TaskPriority | undefined,
        createdBy: "webmcp-agent",
      });
      changed();
      return JSON.stringify(result);
    },
  });

  register({
    name: "workspace.update_task",
    title: "Update workspace task",
    description: "Update the status or priority of an existing workspace task.",
    inputSchema: {
      type: "object",
      properties: {
        taskId: { type: "string", description: "ID of the task to modify." },
        status: { type: "string", enum: ["todo", "in_progress", "blocked", "done"] },
        priority: { type: "string", enum: ["low", "medium", "high", "critical"] },
      },
      required: ["taskId"],
      additionalProperties: false,
    },
    execute: async (input) => {
      const result = await updateTask(String(input.taskId), {
        ...(input.status ? { status: input.status as TaskStatus } : {}),
        ...(input.priority ? { priority: input.priority as TaskPriority } : {}),
      });
      changed();
      return JSON.stringify(result);
    },
  });

  register({
    name: "workspace.add_decision",
    title: "Record workspace decision",
    description: "Record a decision explicitly made or approved by the user. Never use for a suggestion, assumption, or unapproved recommendation.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Short name of the decision." },
        decision: { type: "string", description: "The decision that was actually made." },
        rationale: { type: "string", description: "Optional reasoning or evidence." },
      },
      required: ["title", "decision"],
      additionalProperties: false,
    },
    execute: async (input) => {
      const workspace = await getWorkspace();
      const result = await addDecision({
        workspaceId: workspace.workspace.id,
        title: String(input.title),
        decision: String(input.decision),
        rationale: input.rationale ? String(input.rationale) : undefined,
        createdBy: "webmcp-agent",
      });
      changed();
      return JSON.stringify(result);
    },
  });

  register({
    name: "workspace.add_knowledge",
    title: "Add workspace knowledge",
    description: "Store durable typed workspace context, evidence, findings, questions, requirements, hypotheses, or references for future work.",
    inputSchema: {
      type: "object",
      properties: { title: { type: "string" }, content: { type: "string" }, type: { type: "string", enum: ["note", "finding", "question", "requirement", "hypothesis", "reference"] } },
      required: ["title", "content"],
      additionalProperties: false,
    },
    execute: async (input) => {
      const workspace = await getWorkspace();
      const result = await addKnowledge({
        workspaceId: workspace.workspace.id,
        title: String(input.title),
        content: String(input.content),
        type: input.type as import("./types").KnowledgeType | undefined,
        createdBy: "webmcp-agent",
      });
      changed();
      return JSON.stringify(result);
    },
  });

  register({
    name: "workspace.get_activity",
    title: "Get workspace activity",
    description: "Read recent human and agent activity in the current workspace to understand what changed and who changed it.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true },
    execute: async () => JSON.stringify((await getWorkspace()).activity),
  });

  return controller;
}
