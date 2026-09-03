export type TaskStatus = "todo" | "in_progress" | "blocked" | "done";
export type TaskPriority = "low" | "medium" | "high" | "critical";

export type WorkspaceType = "hardware_project" | "software_project" | "research" | "campaign" | string;
export type KnowledgeType = "note" | "finding" | "question" | "requirement" | "hypothesis" | "reference";

export interface WorkspaceInfo {
  id: string;
  name: string;
  slug: string;
  type: WorkspaceType;
  description: string;
  status: string;
  parent_workspace_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  workspace_id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Decision {
  id: string;
  workspace_id: string;
  title: string;
  decision: string;
  rationale: string;
  created_by: string;
  created_at: string;
}

export interface KnowledgeItem {
  id: string;
  workspace_id: string;
  type: KnowledgeType;
  title: string;
  content: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AgentRun {
  id: string;
  workspace_id: string;
  agent_name: string;
  input: string;
  output: string;
  status: string;
  created_at: string;
}

export interface ActivityItem {
  id: string;
  workspace_id: string;
  actor: string;
  action: string;
  detail: string;
  created_at: string;
}

export interface Workspace {
  workspace: WorkspaceInfo;
  tasks: Task[];
  decisions: Decision[];
  knowledge: KnowledgeItem[];
  agentRuns: AgentRun[];
  activity: ActivityItem[];
}
