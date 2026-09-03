import { FormEvent, KeyboardEvent, useCallback, useEffect, useMemo, useState } from "react";
import { chatWithWikiAgent, getWorkspace, resetDemo, updateTask } from "./api";
import type { ActivityItem, AgentRun, Decision, KnowledgeItem, Task, TaskStatus, Workspace } from "./types";

type Tab = "tasks" | "decisions" | "knowledge" | "runs" | "activity";
const tabs: Array<{ id: Tab; label: string }> = [
  { id: "tasks", label: "Tasks" }, { id: "decisions", label: "Decisions" },
  { id: "knowledge", label: "Knowledge" }, { id: "runs", label: "Agent runs" }, { id: "activity", label: "Activity" },
];

const statusLabels: Record<TaskStatus, string> = {
  todo: "To do", in_progress: "In progress", blocked: "Blocked", done: "Done",
};

function Icon({ name }: { name: "grid" | "folder" | "book" | "spark" | "reset" | "send" | "check" | "clock" | "lock" }) {
  const paths: Record<typeof name, React.ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></>,
    folder: <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2h8.5A1.5 1.5 0 0 1 21 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z"/>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v17H6.5A2.5 2.5 0 0 0 4 22z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v17h4.5a2.5 2.5 0 0 1 2.5 2z"/></>,
    spark: <path d="m12 3 1.3 4.2L17.5 9l-4.2 1.8L12 15l-1.3-4.2L6.5 9l4.2-1.8zM5 15l.8 2.2L8 18l-2.2.8L5 21l-.8-2.2L2 18l2.2-.8zM19 14l.7 1.8 1.8.7-1.8.7L19 19l-.7-1.8-1.8-.7 1.8-.7z"/>,
    reset: <><path d="M4 4v6h6"/><path d="M5.5 17a8 8 0 1 0 .5-10.5L4 10"/></>,
    send: <><path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/></>,
    check: <path d="m5 12 4 4L19 6"/>, clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
  };
  return <svg className="icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export default function App() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [tab, setTab] = useState<Tab>("tasks");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentInput, setAgentInput] = useState("");
  const [agentOutput, setAgentOutput] = useState("");
  const [agentRunning, setAgentRunning] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [changingTask, setChangingTask] = useState<string | null>(null);

  const loadWorkspace = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    try { setWorkspace(await getWorkspace()); setError(null); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to load workspace."); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => {
    void loadWorkspace();
    const handler = () => void loadWorkspace(true);
    window.addEventListener("wikiagent:changed", handler);
    return () => window.removeEventListener("wikiagent:changed", handler);
  }, [loadWorkspace]);

  const stats = useMemo(() => ({
    open: workspace?.tasks.filter((item) => item.status !== "done").length ?? 0,
    blocked: workspace?.tasks.filter((item) => item.status === "blocked").length ?? 0,
    decisions: workspace?.decisions.length ?? 0,
    runs: workspace?.agentRuns.length ?? 0,
  }), [workspace]);

  async function submitAgent(event: FormEvent) {
    event.preventDefault();
    const message = agentInput.trim();
    if (!workspace || !message || agentRunning) return;
    setAgentRunning(true); setAgentOutput(""); setError(null);
    try {
      const result = await chatWithWikiAgent(workspace.workspace.id, message);
      setAgentOutput(result.output); setAgentInput(""); await loadWorkspace(true);
    } catch (err) { setAgentOutput(err instanceof Error ? err.message : "Agent execution failed."); }
    finally { setAgentRunning(false); }
  }

  function onAgentKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") event.currentTarget.form?.requestSubmit();
  }

  async function handleReset() {
    if (resetting || !window.confirm("Reset the workspace to its original demo data?")) return;
    setResetting(true);
    try { await resetDemo(); setAgentOutput(""); setAgentInput(""); setTab("tasks"); await loadWorkspace(true); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not reset the demo."); }
    finally { setResetting(false); }
  }

  async function handleTaskStatus(task: Task, status: TaskStatus) {
    if (changingTask) return;
    setChangingTask(task.id);
    try { await updateTask(task.id, { status }); await loadWorkspace(true); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not update the task."); }
    finally { setChangingTask(null); }
  }

  if (loading && !workspace) return <LoadingScreen />;
  if (!workspace) return <ErrorScreen message={error ?? "Workspace unavailable."} retry={() => void loadWorkspace()} />;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <a className="brand" href="#main-content" aria-label="Wiki Agent home">
            <span className="brand-mark"><span>W</span></span>
            <span><strong>Wiki Agent</strong><small>Shared memory</small></span>
          </a>
          <nav className="nav" aria-label="Primary navigation">
            <button className="active"><Icon name="grid" />Overview</button>
            <button onClick={() => setTab("tasks")}><Icon name="folder" />Projects</button>
            <button onClick={() => setTab("knowledge")}><Icon name="book" />Knowledge</button>
            <button onClick={() => setTab("runs")}><Icon name="spark" />Agent runs</button>
          </nav>
          <section className="workspace-switcher" aria-label="Your workspaces">
            <span>Your workspaces</span>
            <button className="workspace-choice active" aria-current="page">
              <span className="workspace-avatar">CF</span>
              <span><strong>{workspace.workspace.name}</strong><small>{formatWorkspaceType(workspace.workspace.type)}</small></span>
              <i />
            </button>
          </section>
        </div>
        <div className="sidebar-footer">
          <div className="protocol-state"><span className="status-dot" />WebMCP ready</div>
          <p className="protocol-copy">Workspace tools available to browser agents.</p>
          <button className="ghost-button" onClick={handleReset} disabled={resetting}><Icon name="reset" />{resetting ? "Resetting…" : "Reset demo"}</button>
        </div>
      </aside>

      <main className="main" id="main-content">
        <header className="mobile-header"><span className="brand-mark mini">W</span><strong>Wiki Agent</strong><button className="mobile-reset" onClick={handleReset} aria-label="Reset demo"><Icon name="reset" /></button></header>
        <section className="project-header">
          <div><div className="eyebrow"><span />Active workspace · {formatWorkspaceType(workspace.workspace.type)}</div><h1>{workspace.workspace.name}</h1><p>{workspace.workspace.description}</p></div>
          <span className="status-pill"><span />{workspace.workspace.status}</span>
        </section>

        {error && <div className="error-banner" role="alert">{error}<button onClick={() => setError(null)} aria-label="Dismiss error">×</button></div>}

        <section className="stats-grid" aria-label="Project overview">
          <Stat label="Open work" value={stats.open} tone="blue" />
          <Stat label="Blocked" value={stats.blocked} tone="orange" />
          <Stat label="Decisions" value={stats.decisions} tone="violet" />
          <Stat label="Agent runs" value={stats.runs} tone="green" />
        </section>

        <div className="content-grid">
          <section className="workspace-panel" aria-label="Project workspace">
            <div className="tabs" role="tablist" aria-label="Workspace sections">
              {tabs.map((item) => <button key={item.id} id={`tab-${item.id}`} role="tab" aria-selected={tab === item.id} aria-controls="workspace-content" className={tab === item.id ? "tab active" : "tab"} onClick={() => setTab(item.id)}>{item.label}<span>{item.id === "tasks" ? workspace.tasks.length : item.id === "decisions" ? workspace.decisions.length : item.id === "knowledge" ? workspace.knowledge.length : item.id === "activity" ? workspace.activity.length : workspace.agentRuns.length}</span></button>)}
              {refreshing && <span className="syncing" aria-label="Syncing workspace" />}
            </div>
            <div className="panel-body" id="workspace-content" role="tabpanel" aria-labelledby={`tab-${tab}`}>
              {tab === "tasks" && <TaskList tasks={workspace.tasks} changingTask={changingTask} onStatus={handleTaskStatus} />}
              {tab === "decisions" && <DecisionList decisions={workspace.decisions} />}
              {tab === "knowledge" && <KnowledgeList items={workspace.knowledge} />}
              {tab === "runs" && <RunList runs={workspace.agentRuns} />}
              {tab === "activity" && <ActivityList items={workspace.activity} />}
            </div>
          </section>

          <section className="agent-panel" aria-label="Persistent Wiki Agent">
            <div className="agent-header"><div><div className="eyebrow"><span />Persistent agent</div><h2><span className="agent-orb"><Icon name="spark" /></span>Wiki Agent</h2></div><span className="agent-badge"><i />online</span></div>
            <div className="agent-description"><p>This agent shares the same workspace state as humans and external WebMCP agents.</p><button className="agent-example" type="button" onClick={() => setAgentInput("Where did we leave this workspace?")}><span>Try asking</span>“Where did we leave this workspace?”</button></div>
            <div className="agent-response" aria-live="polite">
              {agentRunning ? <div className="thinking"><span/><span/><span/><em>Reading shared memory…</em></div> : agentOutput ? <p>{agentOutput}</p> : <div className="empty-agent"><Icon name="book" /><p>Ask about project context, recent changes, or what to do next.</p></div>}
            </div>
            <form className="agent-form" onSubmit={submitAgent}>
              <label className="sr-only" htmlFor="agent-prompt">Message the persistent Wiki Agent</label>
              <textarea id="agent-prompt" value={agentInput} onChange={(event) => setAgentInput(event.target.value)} onKeyDown={onAgentKeyDown} placeholder="Ask the persistent Wiki Agent…" rows={3} disabled={agentRunning} />
              <div className="form-footer"><span><kbd>Ctrl</kbd> + <kbd>Enter</kbd></span><button type="submit" disabled={agentRunning || !agentInput.trim()}>{agentRunning ? "Running…" : "Run agent"}<Icon name="send" /></button></div>
            </form>
          </section>
        </div>
        <footer className="app-footer"><span><Icon name="lock" />Project state persists across agents and sessions</span><span>One workspace. Many agents.</span></footer>
      </main>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) { return <article className={`stat-card ${tone}`}><span>{label}</span><strong>{String(value).padStart(2, "0")}</strong><i /></article>; }

function TaskList({ tasks, changingTask, onStatus }: { tasks: Task[]; changingTask: string | null; onStatus: (task: Task, status: TaskStatus) => void }) {
  if (!tasks.length) return <Empty message="No tasks in this workspace yet." />;
  return <div className="list">{tasks.map((task) => <article key={task.id} className={`list-item task-item status-${task.status}`}>
    <div className="item-row"><div className="task-heading"><span className="task-check"><Icon name={task.status === "done" ? "check" : task.status === "blocked" ? "lock" : "clock"} /></span><h3>{task.title}</h3></div><span className={`priority ${task.priority}`}>{task.priority}</span></div>
    {task.description && <p>{task.description}</p>}
    <div className="meta"><label>Status <select aria-label={`Status for ${task.title}`} value={task.status} disabled={changingTask === task.id} onChange={(event) => onStatus(task, event.target.value as TaskStatus)}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><span>by {humanizeActor(task.created_by)}</span><time dateTime={task.updated_at}>{relativeDate(task.updated_at)}</time></div>
  </article>)}</div>;
}

function DecisionList({ decisions }: { decisions: Decision[] }) { return decisions.length ? <div className="list">{decisions.map((item) => <article key={item.id} className="list-item decision-item"><div className="decision-mark"><Icon name="check" /></div><div><h3>{item.title}</h3><p>{item.decision}</p>{item.rationale && <blockquote>{item.rationale}</blockquote>}<div className="meta"><span>decided by {humanizeActor(item.created_by)}</span><time dateTime={item.created_at}>{relativeDate(item.created_at)}</time></div></div></article>)}</div> : <Empty message="No decisions have been recorded." />; }
function KnowledgeList({ items }: { items: KnowledgeItem[] }) { return items.length ? <div className="list note-grid">{items.map((item) => <article key={item.id} className={`list-item note-item knowledge-${item.type}`}><div className="note-top"><span><Icon name="book" /></span><span className="knowledge-type">{item.type}</span><time dateTime={item.updated_at}>{relativeDate(item.updated_at)}</time></div><h3>{item.title}</h3><p>{item.content}</p><div className="meta"><span>by {humanizeActor(item.created_by)}</span></div></article>)}</div> : <Empty message="No durable knowledge has been added." />; }
function ActivityList({ items }: { items: ActivityItem[] }) { return items.length ? <div className="activity-list">{items.map((item) => <article key={item.id} className="activity-item"><span className="activity-dot" /><div><div><strong>{humanizeActor(item.actor)}</strong><time dateTime={item.created_at}>{relativeDate(item.created_at)}</time></div><p>{humanizeAction(item.action)}</p>{item.detail && <small>{item.detail}</small>}</div></article>)}</div> : <Empty message="No workspace activity yet." />; }
function RunList({ runs }: { runs: AgentRun[] }) { return runs.length ? <div className="list">{runs.map((run) => <article key={run.id} className="list-item run-item"><div className="item-row"><h3><span className="agent-orb small"><Icon name="spark" /></span>{run.agent_name}</h3><span className={`run-status ${run.status}`}>{run.status}</span></div><div className="run-copy"><span>Prompt</span><p>{run.input}</p><span>Response</span><p>{run.output}</p></div><div className="meta"><time dateTime={run.created_at}>{relativeDate(run.created_at)}</time></div></article>)}</div> : <Empty message="No agent runs yet. Ask Wiki Agent to start the shared history." />; }
function Empty({ message }: { message: string }) { return <div className="empty-list"><Icon name="book" /><p>{message}</p></div>; }
function LoadingScreen() { return <div className="center-screen"><div className="loader-mark">W</div><span>Opening shared memory…</span></div>; }
function ErrorScreen({ message, retry }: { message: string; retry: () => void }) { return <div className="center-screen error-screen"><div className="loader-mark">W</div><h1>Workspace unavailable</h1><p>{message}</p><button onClick={retry}>Try again</button></div>; }
function humanizeActor(actor: string) { return actor === "webmcp-agent" ? "WebMCP agent" : actor.replaceAll("-", " "); }
function humanizeAction(action: string) { return action.replaceAll("_", " ").replace(/^\w/, (letter) => letter.toUpperCase()); }
function formatWorkspaceType(type: string) { return type.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function relativeDate(value: string) { const time = new Date(value).getTime(); const diff = Date.now() - time; if (!Number.isFinite(time)) return "recently"; if (diff < 60_000) return "just now"; if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`; if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`; return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(time)); }
