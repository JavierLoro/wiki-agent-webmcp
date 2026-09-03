import type { Decision, KnowledgeItem, KnowledgeType, Task, TaskPriority, TaskStatus, Workspace } from "./types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });

  const contentType = response.headers.get("content-type") ?? "";
  const data: unknown = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = typeof data === "object" && data && "error" in data
      ? String(data.error)
      : typeof data === "string" && data
        ? data
        : "Request failed.";
    throw new Error(message);
  }

  return data as T;
}

export const getWorkspace = () => request<Workspace>("/api/bootstrap");

export const createTask = (input: {
  workspaceId: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  createdBy?: string;
}) => request<Task>("/api/tasks", { method: "POST", body: JSON.stringify(input) });

export const updateTask = (taskId: string, changes: Partial<Pick<Task, "title" | "description" | "priority" | "status">>) =>
  request<Task>(`/api/tasks/${encodeURIComponent(taskId)}`, { method: "PATCH", body: JSON.stringify(changes) });

export const addDecision = (input: {
  workspaceId: string;
  title: string;
  decision: string;
  rationale?: string;
  createdBy?: string;
}) => request<Decision>("/api/decisions", { method: "POST", body: JSON.stringify(input) });

export const addKnowledge = (input: {
  workspaceId: string;
  title: string;
  content: string;
  type?: KnowledgeType;
  createdBy?: string;
}) => request<KnowledgeItem>("/api/knowledge", { method: "POST", body: JSON.stringify(input) });

export const chatWithWikiAgent = (workspaceId: string, message: string) =>
  request<{ output: string }>("/api/agent/chat", { method: "POST", body: JSON.stringify({ workspaceId, message }) });

export const resetDemo = () => request<{ ok: boolean }>("/api/demo/reset", { method: "POST" });

export type { TaskPriority, TaskStatus };
