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
  context: string;
  status: string;
  parent_workspace_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceSummary extends WorkspaceInfo {
  open_task_count: number;
  child_count: number;
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

export interface ActivityEvent {
  id: string;
  workspace_id: string;
  actor: string;
  source: "human" | "webmcp" | "wiki_agent" | "system" | string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  summary: string;
  metadata_json: string;
  created_at: string;
}

export interface DecisionProposal {
  id: string;
  workspace_id: string;
  title: string;
  proposed_decision: string;
  rationale: string;
  proposed_by: string;
  status: "pending" | "approved" | "rejected";
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export type AnalysisMode = "overview" | "tasks" | "decisions" | "knowledge" | "activity";

export interface AnalysisSection {
  key: string;
  title: string;
  items: string[];
  highlight?: boolean;
  suggestedAction?: string;
}

export interface ResidentAnalysis {
  workspace_id: string;
  mode: AnalysisMode;
  sections: AnalysisSection[];
  generated_at: string;
  source_last_activity_at: string | null;
  agent_run_id: string | null;
  stale: boolean;
}

export interface Workspace {
  workspace: WorkspaceInfo;
  tasks: Task[];
  decisions: Decision[];
  knowledge: KnowledgeItem[];
  agentRuns: AgentRun[];
  activity: ActivityEvent[];
  children: WorkspaceInfo[];
  decisionProposals: DecisionProposal[];
  analyses: ResidentAnalysis[];
}
