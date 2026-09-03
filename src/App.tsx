import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { analyzeProjectImport, approveDecisionProposal, confirmProjectImport, createWorkspace, generateBriefing, getAuthSession, getProjectImport, getWorkspaceById, listWorkspaces, login, logout, rejectDecisionProposal, resetDemo, updateTask } from "./api";
import { isWebMCPAvailable, WEBMCP_STATUS_EVENT } from "./webmcp";
import type { ActivityEvent, AgentRun, AnalysisMode, AnalysisSection, Decision, DecisionProposal, ImportAnalysis, KnowledgeItem, Task, TaskStatus, Workspace, WorkspaceSummary } from "./types";

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
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  useEffect(() => { void getAuthSession().then((result) => setAuthenticated(result.authenticated)).catch(() => setAuthenticated(false)); }, []);
  if (authenticated === null) return <LoadingScreen />;
  if (!authenticated) return <LoginScreen onAuthenticated={() => setAuthenticated(true)} />;
  return <WorkspaceApp onLogout={() => void logout().finally(() => setAuthenticated(false))} />;
}

function WorkspaceApp({ onLogout }: { onLogout: () => void }) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [tab, setTab] = useState<Tab>("tasks");
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>("overview");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [briefingRunning, setBriefingRunning] = useState(false);
  const [handoffCopied, setHandoffCopied] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [changingTask, setChangingTask] = useState<string | null>(null);
  const [reviewingProposal, setReviewingProposal] = useState<string | null>(null);
  const [webMcpAvailable, setWebMcpAvailable] = useState(isWebMCPAvailable());
  const [showNewWorkspace, setShowNewWorkspace] = useState(false);
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState({ name: "", type: "general" as "general" | "software_project" | "hardware_project" | "research" | "organization" | "event", description: "" });
  const [showImport, setShowImport] = useState(false);
  const [importForm, setImportForm] = useState({ repositoryUrl: "", additionalContext: "" });
  const [importAnalysis, setImportAnalysis] = useState<ImportAnalysis | null>(null);
  const [importBusy, setImportBusy] = useState(false);

  const loadWorkspace = useCallback(async (workspaceId: string, quiet = false) => {
    if (quiet) setRefreshing(true);
    try { setWorkspace(await getWorkspaceById(workspaceId)); setError(null); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to load workspace."); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => {
    void listWorkspaces().then((items) => {
      setWorkspaces(items);
      const requested = new URLSearchParams(window.location.search).get("workspace");
      const initial = items.find((item) => item.id === requested || item.slug === requested) ?? items[0];
      if (initial) void loadWorkspace(initial.id);
      else setLoading(false);
    }).catch((err: unknown) => { setError(err instanceof Error ? err.message : "Unable to list workspaces."); setLoading(false); });
  }, [loadWorkspace]);

  useEffect(() => {
    const handler = (event: Event) => {
      const targetId = (event as CustomEvent<{ workspaceId?: string }>).detail?.workspaceId;
      if (workspace && (!targetId || targetId === workspace.workspace.id || targetId === workspace.workspace.slug)) void loadWorkspace(workspace.workspace.id, true);
      void listWorkspaces().then(setWorkspaces);
    };
    const statusHandler = (event: Event) => setWebMcpAvailable(Boolean((event as CustomEvent<{ available: boolean }>).detail.available));
    const importHandler = (event: Event) => { const analysis=(event as CustomEvent<ImportAnalysis>).detail;if(analysis?.id){setImportAnalysis(analysis);setShowImport(true);} };
    window.addEventListener("wikiagent:changed", handler);
    window.addEventListener(WEBMCP_STATUS_EVENT, statusHandler);
    window.addEventListener("wikiagent:import-ready", importHandler);
    return () => { window.removeEventListener("wikiagent:changed", handler); window.removeEventListener(WEBMCP_STATUS_EVENT, statusHandler); window.removeEventListener("wikiagent:import-ready", importHandler); };
  }, [loadWorkspace, workspace]);

  const stats = useMemo(() => ({
    open: workspace?.tasks.filter((item) => item.status !== "done").length ?? 0,
    done: workspace?.tasks.filter((item) => item.status === "done").length ?? 0,
    blocked: workspace?.tasks.filter((item) => item.status === "blocked").length ?? 0,
    decisions: workspace?.decisions.length ?? 0,
    runs: workspace?.agentRuns.length ?? 0,
  }), [workspace]);

  const currentAnalysis = workspace?.analyses.find((item) => item.mode === analysisMode) ?? null;
  async function refreshBriefing() { if (!workspace || briefingRunning) return; setBriefingRunning(true); setError(null); try { await generateBriefing(workspace.workspace.id, analysisMode); await loadWorkspace(workspace.workspace.id, true); } catch (err) { setError(err instanceof Error ? err.message : "Could not generate analysis."); } finally { setBriefingRunning(false); } }

  async function copyAgentHandoff() { if (!workspace) return; const overview=workspace.analyses.find((item)=>item.mode==="overview"),section=(key:string)=>overview?.sections.find((item)=>item.key===key)?.items.join("; ")||"Not established";const text=[`WORKSPACE\n${workspace.workspace.name}`,`GOAL / CONTEXT\n${workspace.workspace.context||workspace.workspace.description||"Not established"}`,`CURRENT FOCUS\n${section("current_focus")}`,`CONFIRMED DECISIONS\n${workspace.decisions.map((item)=>`- ${item.title}: ${item.decision}`).join("\n")||"None"}`,`IMPORTANT KNOWLEDGE\n${workspace.knowledge.slice(0,5).map((item)=>`- [${item.type}] ${item.title}: ${item.content}`).join("\n")||"None"}`,`CURRENT BLOCKERS\n${workspace.tasks.filter((item)=>item.status==="blocked").map((item)=>`- ${item.title}`).join("\n")||section("blockers")}`,`PENDING HUMAN REVIEW\n${workspace.decisionProposals.filter((item)=>item.status==="pending").map((item)=>`- ${item.title}: ${item.proposed_decision}`).join("\n")||"None"}`,`MISSING CONTEXT\n${section("gaps_missing_context")}`,`SUGGESTED NEXT ACTION\n${section("suggested_next_action")}`,`DO NOT ASSUME\nPending proposals are not confirmed decisions. Missing context must remain explicit.`].join("\n\n");try{await navigator.clipboard.writeText(text);setHandoffCopied(true);window.setTimeout(()=>setHandoffCopied(false),1600)}catch{setError("Could not copy agent handoff.")}}

  async function handleReset() {
    if (resetting || !window.confirm("Reset the workspace to its original demo data?")) return;
    setResetting(true);
    try { await resetDemo(); setTab("tasks"); const items=await listWorkspaces(); setWorkspaces(items); const initial=items.find((item)=>item.slug==="compa-friki")??items[0]; if(initial) await loadWorkspace(initial.id,true); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not reset the demo."); }
    finally { setResetting(false); }
  }

  async function handleTaskStatus(task: Task, status: TaskStatus) {
    if (changingTask) return;
    setChangingTask(task.id);
    try { await updateTask(task.id, { status }, task.workspace_id, "human"); await loadWorkspace(task.workspace_id, true); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not update the task."); }
    finally { setChangingTask(null); }
  }

  if (loading && !workspace) return <LoadingScreen />;
  if (!workspace) return <ErrorScreen message={error ?? "Workspace unavailable."} retry={() => window.location.reload()} />;

  function switchWorkspace(item: WorkspaceSummary) {
    if (item.id === workspace?.workspace.id) return;
    setLoading(true); setError(null);
    const url = new URL(window.location.href); url.searchParams.set("workspace", item.slug); window.history.replaceState({}, "", url);
    void loadWorkspace(item.id);
  }

  async function reviewProposal(proposal: DecisionProposal, action: "approve" | "reject") {
    setReviewingProposal(proposal.id);
    try { if (action === "approve") await approveDecisionProposal(proposal.id); else await rejectDecisionProposal(proposal.id); await loadWorkspace(proposal.workspace_id, true); }
    catch (err) { setError(err instanceof Error ? err.message : `Could not ${action} proposal.`); }
    finally { setReviewingProposal(null); }
  }

  async function handleCreateWorkspace(event: FormEvent) {
    event.preventDefault();
    if (!newWorkspace.name.trim() || creatingWorkspace) return;
    setCreatingWorkspace(true); setError(null);
    try {
      const created = await createWorkspace({ name: newWorkspace.name.trim(), type: newWorkspace.type, description: newWorkspace.description.trim() || undefined });
      const items = await listWorkspaces();
      setWorkspaces(items); setShowNewWorkspace(false); setNewWorkspace({ name: "", type: "general", description: "" });
      setTab("tasks");
      const url = new URL(window.location.href); url.searchParams.set("workspace", created.slug); window.history.replaceState({}, "", url);
      await loadWorkspace(created.id);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not create workspace."); }
    finally { setCreatingWorkspace(false); }
  }

  function closeImport() { if (importBusy) return; setShowImport(false); setImportAnalysis(null); setImportForm({ repositoryUrl: "", additionalContext: "" }); }
  async function handleAnalyzeImport(event: FormEvent) {
    event.preventDefault(); if (!importForm.repositoryUrl.trim() || importBusy) return;
    setImportBusy(true); setError(null);
    try { const result=await analyzeProjectImport(importForm.repositoryUrl.trim(),importForm.additionalContext); setImportAnalysis(result.status==="analyzing"?await getProjectImport(result.id):result); }
    catch(err){setError(err instanceof Error?err.message:"Could not analyze repository.");}
    finally{setImportBusy(false);}
  }
  async function handleConfirmImport() {
    if (!importAnalysis || importBusy) return; setImportBusy(true); setError(null);
    try { const result=await confirmProjectImport(importAnalysis.id); const created="workspace" in result?result.workspace:result; const items=await listWorkspaces(); setWorkspaces(items); setShowImport(false); setImportAnalysis(null); setImportForm({repositoryUrl:"",additionalContext:""}); setTab("tasks"); setAnalysisMode("overview"); const url=new URL(window.location.href);url.searchParams.set("workspace",created.slug);window.history.replaceState({},"",url);await loadWorkspace(created.id); }
    catch(err){setError(err instanceof Error?err.message:"Could not import workspace.");}
    finally{setImportBusy(false);}
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <a className="brand" href="#main-content" aria-label="Wiki Agent home">
            <span className="brand-mark"><span>W</span></span>
            <span><strong>Wiki Agent</strong><small>Shared memory</small></span>
          </a>
          <nav className="nav" aria-label="Primary navigation">
            <button className={analysisMode === "overview" ? "active" : ""} onClick={() => setAnalysisMode("overview")} aria-current={analysisMode === "overview" ? "page" : undefined}><Icon name="grid" />Overview</button>
            <button className={analysisMode === "tasks" ? "active" : ""} onClick={() => { setTab("tasks"); setAnalysisMode("tasks"); }} aria-current={analysisMode === "tasks" ? "page" : undefined}><Icon name="folder" />Projects</button>
            <button className={analysisMode === "knowledge" ? "active" : ""} onClick={() => { setTab("knowledge"); setAnalysisMode("knowledge"); }} aria-current={analysisMode === "knowledge" ? "page" : undefined}><Icon name="book" />Knowledge</button>
            <button className={tab === "runs" ? "active" : ""} onClick={() => setTab("runs")} aria-current={tab === "runs" ? "page" : undefined}><Icon name="spark" />Agent runs</button>
          </nav>
          <section className="workspace-switcher" aria-label="Your workspaces">
            <span>Your workspaces</span>
            {workspaces.filter((item) => !item.parent_workspace_id).map((item) => <button key={item.id} className={`workspace-choice ${item.id === workspace.workspace.id ? "active" : ""}`} aria-current={item.id === workspace.workspace.id ? "page" : undefined} onClick={() => switchWorkspace(item)}>
              <span className="workspace-avatar">{initials(item.name)}</span>
              <span><strong>{item.name}</strong><small>{formatWorkspaceType(item.type)} · {item.open_task_count} open</small></span>
              {item.id === workspace.workspace.id && <i />}
            </button>)}
            <button className="new-workspace-button" onClick={() => setShowNewWorkspace(true)}><span>+</span> New Workspace</button>
            <button className="import-project-button" onClick={() => setShowImport(true)}><Icon name="folder" /> Import project</button>
          </section>
        </div>
        <div className="sidebar-footer">
          <div className={`protocol-state ${webMcpAvailable ? "connected" : "unavailable"}`}><span className="status-dot" />WebMCP {webMcpAvailable ? "connected" : "unavailable"}</div>
          <p className="protocol-copy">Workspace tools available to browser agents.</p>
          <button className="ghost-button" onClick={handleReset} disabled={resetting}><Icon name="reset" />{resetting ? "Resetting…" : "Reset demo"}</button>
          <button className="logout-button" onClick={onLogout}>Sign out</button>
        </div>
      </aside>

      <main className="main" id="main-content">
        <header className="mobile-header"><span className="brand-mark mini">W</span><strong>Wiki Agent</strong><div className="mobile-actions"><button className="mobile-new" onClick={() => setShowImport(true)}>Import</button><button className="mobile-new" onClick={() => setShowNewWorkspace(true)}>+ New</button><button className="mobile-reset" onClick={handleReset} aria-label="Reset demo"><Icon name="reset" /></button><button className="mobile-signout" onClick={onLogout}>Sign out</button></div></header>
        <section className="project-header">
          <div><div className="eyebrow"><span />Active workspace · {formatWorkspaceType(workspace.workspace.type)}</div><h1>{workspace.workspace.name}</h1><p>{workspace.workspace.description || "A durable workspace ready for human-agent collaboration."}</p>{workspace.importSource&&<small className="import-source">Imported from <a href={workspace.importSource.sourceUrl} target="_blank" rel="noreferrer">{workspace.importSource.repository}</a>{workspace.importSource.importedAt?` at ${new Date(workspace.importSource.importedAt).toLocaleString()}`:""}</small>}<small className="product-positioning">Persistent shared workspaces for humans and AI agents. Create a workspace, then collaborate on the same durable state.</small></div>
          <span className="status-pill"><span />{workspace.workspace.status}</span>
        </section>

        {error && <div className="error-banner" role="alert">{error}<button onClick={() => setError(null)} aria-label="Dismiss error">×</button></div>}

        <section className="progress-summary" aria-label="Workspace progress">
          <div className="progress-summary-main"><span className="summary-label">Workspace progress</span><strong>{stats.done} of {stats.done + stats.open} tasks complete</strong><div className="progress-track"><span style={{ width: `${stats.done + stats.open ? (stats.done / (stats.done + stats.open)) * 100 : 0}%` }} /></div></div>
          <div className="progress-summary-metrics"><span><b>{stats.open}</b> open</span><span><b>{stats.blocked}</b> blocked</span><span><b>{stats.decisions}</b> decisions</span></div>
        </section>

        <div className="content-grid">
          <section className="workspace-panel" aria-label="Project workspace">
            <section className={`proposal-section ${workspace.decisionProposals.filter((proposal) => proposal.status === "pending").length ? "" : "empty"}`} aria-label="Pending decision proposals">
              <div className="proposal-section-title"><div><span>Pending review · {workspace.decisionProposals.filter((proposal) => proposal.status === "pending").length}</span><h2>Agent proposals awaiting your review</h2></div><Icon name="spark" /></div>
              {workspace.decisionProposals.filter((proposal) => proposal.status === "pending").length === 0 && <p className="proposal-empty">No proposals awaiting review.</p>}
              {workspace.decisionProposals.filter((proposal) => proposal.status === "pending").map((proposal) => <article className="proposal-card" key={proposal.id}>
                <div className="proposal-content"><span>Proposed by {humanizeActor(proposal.proposed_by)}</span><h3>{proposal.title}</h3><p>{proposal.proposed_decision}</p>{proposal.rationale && <small>{proposal.rationale}</small>}</div>
                <div className="proposal-actions"><button className="reject" disabled={reviewingProposal === proposal.id} onClick={() => void reviewProposal(proposal, "reject")}>Reject</button><button className="approve" disabled={reviewingProposal === proposal.id} onClick={() => void reviewProposal(proposal, "approve")}><Icon name="check" />{reviewingProposal === proposal.id ? "Reviewing…" : "Approve"}</button></div>
              </article>)}
            </section>
            <div className="tabs" role="tablist" aria-label="Workspace sections">
              {tabs.map((item) => <button key={item.id} id={`tab-${item.id}`} role="tab" aria-selected={tab === item.id} aria-controls="workspace-content" className={tab === item.id ? "tab active" : "tab"} onClick={() => { setTab(item.id); if (item.id !== "runs") setAnalysisMode(item.id); }}>{item.label}<span>{item.id === "tasks" ? workspace.tasks.length : item.id === "decisions" ? workspace.decisions.length : item.id === "knowledge" ? workspace.knowledge.length : item.id === "activity" ? workspace.activity.length : workspace.agentRuns.length}</span></button>)}
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

          <section className="agent-panel briefing-panel" aria-label="Resident Agent">
            <div className="agent-header"><div><div className="eyebrow"><span />Continuity layer</div><h2>Resident Agent</h2></div>{currentAnalysis?.stale ? <span className="stale-badge">Stale</span> : <span className="agent-badge"><i />{formatAnalysisMode(analysisMode)}</span>}</div>
            <div className="agent-description"><p>{analysisSubtitle(analysisMode)}</p></div>
            <div className="briefing-content" aria-live="polite">
              {briefingRunning ? <div className="thinking"><span/><span/><span/><em>Reviewing workspace state…</em></div> : currentAnalysis ? <>
                {currentAnalysis.stale && <p className="stale-notice">Analysis may be outdated. Workspace activity changed after this snapshot.</p>}
                {currentAnalysis.sections.map((section) => <BriefingSection key={section.key} section={section} />)}
                <time className="briefing-time" dateTime={currentAnalysis.generated_at}>Updated {relativeDate(currentAnalysis.generated_at)}</time>
              </> : <div className="empty-agent"><Icon name="book" /><p>Generate analysis for this workspace view.</p></div>}
            </div>
            <div className="briefing-actions"><button type="button" onClick={() => void refreshBriefing()} disabled={briefingRunning}>{briefingRunning ? "Generating…" : currentAnalysis ? "Refresh analysis" : "Generate analysis"}</button><button type="button" className="handoff-button" onClick={() => void copyAgentHandoff()}>{handoffCopied ? "Copied" : "Copy agent handoff"}</button></div>
          </section>
        </div>
        <footer className="app-footer"><span><Icon name="lock" />Workspace state persists across agents and sessions</span><span>One workspace. Many agents.</span></footer>
      </main>
      {showNewWorkspace && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !creatingWorkspace) setShowNewWorkspace(false); }}>
        <section className="workspace-modal" role="dialog" aria-modal="true" aria-labelledby="new-workspace-title">
          <div className="modal-header"><div><span>Create workspace</span><h2 id="new-workspace-title">Start a durable shared space</h2></div><button type="button" onClick={() => setShowNewWorkspace(false)} aria-label="Close new workspace form">×</button></div>
          <p>Humans and agents will collaborate on the same persistent state.</p>
          <form onSubmit={handleCreateWorkspace}>
            <label>Name<input autoFocus required maxLength={120} value={newWorkspace.name} onChange={(event) => setNewWorkspace((value) => ({ ...value, name: event.target.value }))} placeholder="My Research Project" /></label>
            <label>Type<select value={newWorkspace.type} onChange={(event) => setNewWorkspace((value) => ({ ...value, type: event.target.value as typeof value.type }))}><option value="general">General</option><option value="software_project">Software project</option><option value="hardware_project">Hardware project</option><option value="research">Research</option><option value="organization">Organization</option><option value="event">Event</option></select></label>
            <label>Description <span>Optional</span><textarea maxLength={600} rows={3} value={newWorkspace.description} onChange={(event) => setNewWorkspace((value) => ({ ...value, description: event.target.value }))} placeholder="Researching local-first collaboration tools and agent workflows." /></label>
            <div className="modal-actions"><button type="button" className="cancel" onClick={() => setShowNewWorkspace(false)} disabled={creatingWorkspace}>Cancel</button><button type="submit" className="create" disabled={creatingWorkspace || !newWorkspace.name.trim()}>{creatingWorkspace ? "Creating…" : "Create workspace"}</button></div>
          </form>
        </section>
      </div>}
      {showImport && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeImport(); }}>
        <section className="workspace-modal import-modal" role="dialog" aria-modal="true" aria-labelledby="import-title">
          <div className="modal-header"><div><span>{importAnalysis?.preview ? "Import preview" : "Import project"}</span><h2 id="import-title">{importAnalysis?.preview ? importAnalysis.preview.workspace.name : "Turn a repository into a workspace"}</h2></div><button type="button" onClick={closeImport} aria-label="Close import">×</button></div>
          {!importAnalysis?.preview ? <>
            <p>Analyze a repository first. Nothing is imported until you approve the preview.</p>
            <form onSubmit={handleAnalyzeImport}>
              <label>Repository URL<input autoFocus required type="url" value={importForm.repositoryUrl} onChange={(event)=>setImportForm((value)=>({...value,repositoryUrl:event.target.value}))} placeholder="https://github.com/owner/repository" /></label>
              <label>Additional context <span>Optional</span><textarea rows={3} maxLength={2000} value={importForm.additionalContext} onChange={(event)=>setImportForm((value)=>({...value,additionalContext:event.target.value}))} placeholder="What this project is for, current priorities, or useful constraints." /></label>
              {importAnalysis?.error && <p className="import-error" role="alert">{importAnalysis.error}</p>}
              <div className="modal-actions"><button type="button" className="cancel" onClick={closeImport}>Cancel</button><button type="submit" className="create" disabled={importBusy||!importForm.repositoryUrl.trim()}>{importBusy?"Analyzing…":"Analyze repository"}</button></div>
            </form>
          </> : <ImportPreview analysis={importAnalysis} onBack={()=>setImportAnalysis(null)} onConfirm={()=>void handleConfirmImport()} busy={importBusy} />}
        </section>
      </div>}
    </div>
  );
}

function ImportPreview({ analysis, onBack, onConfirm, busy }: { analysis: ImportAnalysis; onBack: () => void; onConfirm: () => void; busy: boolean }) {
  const preview=analysis.preview;if(!preview)return null;
  return <div className="import-preview">
    <p>{preview.importSummary||preview.workspace.description||"A structured workspace generated from the repository."}</p>
    <div className="import-repo"><Icon name="folder"/><span><strong>{analysis.repository.owner}/{analysis.repository.name}</strong><small>{analysis.repository.defaultBranch||"default branch"}</small></span></div>
    <div className="import-metrics"><span><b>{analysis.metrics.filesRead}</b>Files</span><span><b>{analysis.metrics.issuesRead}</b>Issues</span><span><b>{preview.tasks.length}</b>Tasks</span><span><b>{preview.knowledge.length}</b>Knowledge</span></div>
    <div className="import-stack"><span>Detected stack</span>{preview.stack.map(item=><i key={item}>{item}</i>)}<span>{analysis.metrics.modelCalls} model calls · {analysis.metrics.totalTokens.toLocaleString()} tokens · ${analysis.metrics.estimatedCost.toFixed(4)} · {Math.round(analysis.metrics.durationMs/1000)}s</span></div>
    <div className="preview-columns">
      <PreviewSection title={`Tasks · ${preview.tasks.length}`} empty="No tasks detected." items={preview.tasks.map(item=>({title:item.title,meta:item.priority,evidence:item.sourcePaths}))}/>
      <PreviewSection title={`Knowledge · ${preview.knowledge.length}`} empty="No knowledge detected." items={preview.knowledge.map(item=>({title:item.title,meta:item.type,evidence:item.sourcePaths}))}/>
      <PreviewSection title={`Decision proposals · ${preview.decisionProposals.length}`} empty="No decisions proposed." items={preview.decisionProposals.map(item=>({title:item.title,meta:"proposal",evidence:item.sourcePaths}))}/>
      <PreviewSection title={`Questions · ${preview.openQuestions.length}`} empty="No open questions." items={preview.openQuestions.map(item=>({title:item.question,meta:"unknown",evidence:item.sourcePaths}))}/>
      <PreviewSection title={`Risks · ${preview.detectedRisks.length}`} empty="No material risks detected." items={preview.detectedRisks.map(item=>({title:item.risk,meta:"inference",evidence:item.sourcePaths}))}/>
    </div>
    <p className="import-note">Review the evidence-based structure. Importing creates a new workspace; it does not change or synchronize the repository. Stop reason: {analysis.metrics.stopReason.replaceAll("_"," ")}.</p>
    <div className="modal-actions"><button type="button" className="cancel" onClick={onBack} disabled={busy}>Back</button><button type="button" className="create" onClick={onConfirm} disabled={busy}>{busy?"Importing…":"Import workspace"}</button></div>
  </div>;
}

function PreviewSection({title,empty,items}:{title:string;empty:string;items:Array<{title:string;meta:string;evidence:string[]}>}){return <details className="preview-section" open><summary>{title}</summary>{items.length?items.map((item,index)=><div className="preview-row" key={`${item.title}-${index}`}><span><strong>{item.title}</strong>{item.evidence.length>0&&<small>Evidence: {item.evidence.join(", ")}</small>}</span><small>{item.meta}</small></div>):<p>{empty}</p>}</details>}

function BriefingSection({ section }: { section: AnalysisSection }) {
  return <section className={`briefing-section ${section.highlight ? "accent" : ""}`}><h3>{section.title}</h3>{section.items.length ? <ul>{section.items.map((item, index) => <li key={`${section.key}-${index}`}>{item}</li>)}</ul> : <p className="briefing-none">None evidenced</p>}{section.suggestedAction && <p className="section-action">{section.suggestedAction}</p>}</section>;
}

function LoginScreen({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!password || submitting) return;
    setSubmitting(true); setError("");
    try { await login(password); onAuthenticated(); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not sign in."); }
    finally { setSubmitting(false); }
  }
  return <main className="login-page">
    <section className="login-card" aria-labelledby="login-title">
      <span className="brand-mark login-mark">W</span>
      <p className="eyebrow">Private workspace</p>
      <h1 id="login-title">Welcome back</h1>
      <p>Your projects and shared agent memory are protected.</p>
      <form onSubmit={submit}>
        <label htmlFor="app-password">Password</label>
        <input id="app-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} autoFocus />
        {error && <p className="login-error" role="alert">{error}</p>}
        <button type="submit" disabled={!password || submitting}>{submitting ? "Signing in…" : "Sign in"}</button>
      </form>
      <small>Session stays active on this browser for 30 days.</small>
    </section>
  </main>;
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) { return <article className={`stat-card ${tone}`}><span>{label}</span><strong>{String(value).padStart(2, "0")}</strong><i /></article>; }

function TaskList({ tasks, changingTask, onStatus }: { tasks: Task[]; changingTask: string | null; onStatus: (task: Task, status: TaskStatus) => void }) {
  if (!tasks.length) return <Empty message="No tasks yet. Humans and agents can add the first piece of work here." />;
  return <div className="list">{tasks.map((task) => <article key={task.id} className={`list-item task-item status-${task.status}`}>
    <div className="item-row"><div className="task-heading"><span className="task-check"><Icon name={task.status === "done" ? "check" : task.status === "blocked" ? "lock" : "clock"} /></span><h3>{task.title}</h3></div><span className={`priority ${task.priority}`}>{task.priority}</span></div>
    {task.description && <p>{task.description}</p>}
    <div className="meta"><label>Status <select aria-label={`Status for ${task.title}`} value={task.status} disabled={changingTask === task.id} onChange={(event) => onStatus(task, event.target.value as TaskStatus)}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><span>by {humanizeActor(task.created_by)}</span><time dateTime={task.updated_at}>{relativeDate(task.updated_at)}</time></div>
  </article>)}</div>;
}

function DecisionList({ decisions }: { decisions: Decision[] }) { return decisions.length ? <div className="list">{decisions.map((item) => <article key={item.id} className="list-item decision-item"><div className="decision-mark"><Icon name="check" /></div><div><h3>{item.title}</h3><p>{item.decision}</p>{item.rationale && <blockquote>{item.rationale}</blockquote>}<div className="meta"><span>decided by {humanizeActor(item.created_by)}</span><time dateTime={item.created_at}>{relativeDate(item.created_at)}</time></div></div></article>)}</div> : <Empty message="No confirmed decisions yet." />; }
function KnowledgeList({ items }: { items: KnowledgeItem[] }) { return items.length ? <div className="list note-grid">{items.map((item) => <article key={item.id} className={`list-item note-item knowledge-${item.type}`}><div className="note-top"><span><Icon name="book" /></span><span className="knowledge-type">{item.type}</span><time dateTime={item.updated_at}>{relativeDate(item.updated_at)}</time></div><h3>{item.title}</h3><p>{item.content}</p><div className="meta"><span>by {humanizeActor(item.created_by)}</span></div></article>)}</div> : <Empty message="No knowledge items yet." />; }
function ActivityList({ items }: { items: ActivityEvent[] }) { return items.length ? <div className="activity-list">{items.map((item) => <article key={item.id} className="activity-item"><span className={`activity-dot source-${item.source}`} /><div><div><strong>{humanizeActor(item.actor)}</strong><span className={`source-badge ${item.source}`}>{humanizeSource(item.source)}</span><time dateTime={item.created_at}>{relativeDate(item.created_at)}</time></div><p>{humanizeAction(item.action)}</p>{item.summary && <small>{item.summary}</small>}</div></article>)}</div> : <Empty message="No workspace activity yet." />; }
function RunList({ runs }: { runs: AgentRun[] }) { return runs.length ? <div className="list">{runs.map((run) => <article key={run.id} className="list-item run-item"><div className="item-row"><h3><span className="agent-orb small"><Icon name="spark" /></span>{run.agent_name}</h3><span className={`run-status ${run.status}`}>{run.status}</span></div><div className="run-copy"><span>Prompt</span><p>{run.input}</p><span>Response</span><p>{run.output}</p></div><div className="meta"><time dateTime={run.created_at}>{relativeDate(run.created_at)}</time></div></article>)}</div> : <Empty message="No agent runs yet." />; }
function Empty({ message }: { message: string }) { return <div className="empty-list"><Icon name="book" /><p>{message}</p></div>; }
function LoadingScreen() { return <div className="center-screen"><div className="loader-mark">W</div><span>Opening shared memory…</span></div>; }
function ErrorScreen({ message, retry }: { message: string; retry: () => void }) { return <div className="center-screen error-screen"><div className="loader-mark">W</div><h1>Workspace unavailable</h1><p>{message}</p><button onClick={retry}>Try again</button></div>; }
function humanizeActor(actor: string) { if (actor === "webmcp-agent") return "Browser Agent · WebMCP"; if (actor === "wiki-agent") return "Wiki Agent"; if (actor === "human") return "Human"; return actor.replaceAll("-", " "); }
function humanizeAction(action: string) { return action.replaceAll("_", " ").replace(/^\w/, (letter) => letter.toUpperCase()); }
function formatWorkspaceType(type: string) { return type.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function humanizeSource(source: string) { return source === "webmcp" ? "WebMCP" : source === "wiki_agent" ? "Agent" : humanizeAction(source); }
function formatAnalysisMode(mode: AnalysisMode) { return mode === "overview" ? "overview" : mode; }
function analysisSubtitle(mode: AnalysisMode) { return ({ overview: "Workspace continuity briefing.", tasks: "Execution analysis based on current tasks.", decisions: "Review of confirmed and pending project direction.", knowledge: "Knowledge quality and missing context.", activity: "Interpretation of recent workspace changes." } as const)[mode]; }
function initials(name: string) { return name.split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase(); }
function relativeDate(value: string) { const time = new Date(value).getTime(); const diff = Date.now() - time; if (!Number.isFinite(time)) return "recently"; if (diff < 60_000) return "just now"; if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`; if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`; return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(time)); }
