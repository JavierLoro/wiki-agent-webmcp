import type { ActivityEvent, Decision, DecisionProposal, KnowledgeItem, KnowledgeType, Task, TaskPriority, TaskStatus, Workspace, WorkspaceInfo, WorkspaceSummary } from "./types";

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
export const listWorkspaces = () => request<WorkspaceSummary[]>("/api/workspaces");
export const getWorkspaceById = (workspaceId: string) => request<Workspace>(`/api/workspaces/${encodeURIComponent(workspaceId)}/context`);
export const getWorkspaceChildren = (workspaceId: string) => request<WorkspaceInfo[]>(`/api/workspaces/${encodeURIComponent(workspaceId)}/children`);
export const getWorkspaceActivity = (workspaceId: string) => request<ActivityEvent[]>(`/api/workspaces/${encodeURIComponent(workspaceId)}/activity`);

export const createTask = (input: {
  workspaceId: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  createdBy?: string;
  source?: "human" | "webmcp" | "wiki_agent" | "system";
}) => request<Task>("/api/tasks", { method: "POST", body: JSON.stringify(input) });

export const updateTask = (taskId: string, changes: Partial<Pick<Task, "title" | "description" | "priority" | "status">>, workspaceId?: string, actor = "human", source: "human" | "webmcp" = "human") =>
  request<Task>(`/api/tasks/${encodeURIComponent(taskId)}`, { method: "PATCH", body: JSON.stringify({ ...changes, actor, source }) }).then((task) => {
    if (workspaceId && task.workspace_id !== workspaceId) throw new Error("Task does not belong to the selected workspace.");
    return task;
  });

export const addDecision = (input: {
  workspaceId: string;
  title: string;
  decision: string;
  rationale?: string;
  createdBy?: string;
  source?: "human" | "webmcp" | "wiki_agent" | "system";
}) => request<Decision>("/api/decisions", { method: "POST", body: JSON.stringify(input) });

export const addKnowledge = (input: {
  workspaceId: string;
  title: string;
  content: string;
  type?: KnowledgeType;
  createdBy?: string;
  source?: "human" | "webmcp" | "wiki_agent" | "system";
}) => request<KnowledgeItem>("/api/knowledge", { method: "POST", body: JSON.stringify(input) });

export const chatWithWikiAgent = (workspaceId: string, message: string) =>
  request<{ output: string }>("/api/agent/chat", { method: "POST", body: JSON.stringify({ workspaceId, message }) });

export const resetDemo = () => request<{ ok: boolean }>("/api/demo/reset", { method: "POST" });

export const proposeDecision = (input: { workspaceId: string; title: string; decision: string; rationale?: string; proposedBy?: string }) =>
  request<DecisionProposal>("/api/decision-proposals", { method: "POST", body: JSON.stringify(input) });
export const approveDecisionProposal = (proposalId: string) => request<{ proposal: DecisionProposal; decision: Decision }>(`/api/decision-proposals/${encodeURIComponent(proposalId)}/approve`, { method: "POST", body: JSON.stringify({ reviewedBy: "human", source: "human" }) });
export const rejectDecisionProposal = (proposalId: string) => request<DecisionProposal>(`/api/decision-proposals/${encodeURIComponent(proposalId)}/reject`, { method: "POST", body: JSON.stringify({ reviewedBy: "human", source: "human" }) });

export type { TaskPriority, TaskStatus };
