import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { stripTypeScriptTypes } from 'node:module';

// Exercise the actual App hooks with deterministic timers and deferred HTTP reads.
const source = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const body = source.split('function WorkspaceApp({ onLogout }: { onLogout: () => void }) {')[1].split('  const stats = useMemo')[0];
const slots = [], pendingEffects = [], timers = new Map(), listeners = new Map();
let cursor = 0, timerId = 0, contextReads = 0, sidebarReads = 0, held = null;
let data = { workspace: { id: 'esigglol', slug: 'esigglol' }, tasks: [], knowledge: [], decisionProposals: [] };
const document = { visibilityState: 'visible', addEventListener: (key, fn) => listeners.set(key, fn), removeEventListener: (key) => listeners.delete(key) };
const context = {
  AbortController, URLSearchParams, document,
  window: { location: { search: '?workspace=esigglol' }, setInterval: (fn, ms) => { assert.equal(ms, 1500); timers.set(++timerId, fn); return timerId; }, clearInterval: (id) => timers.delete(id), addEventListener: (key, fn) => listeners.set(key, fn), removeEventListener: (key) => listeners.delete(key) },
  useState(initial) { const i = cursor++; slots[i] ??= { value: initial }; return [slots[i].value, (next) => { slots[i].value = typeof next === 'function' ? next(slots[i].value) : next; }]; },
  useRef(initial) { const i = cursor++; slots[i] ??= { current: initial }; return slots[i]; },
  useCallback(fn) { cursor++; return fn; },
  useEffect(fn, deps) {
    const i = cursor++;
    // Callbacks are stable in React; compare their source in this minimal harness.
    const normalized = deps.map((x) => typeof x === 'function' ? x.toString() : x);
    if (!slots[i] || normalized.some((x, j) => x !== slots[i].deps[j])) pendingEffects.push(() => { slots[i]?.cleanup?.(); slots[i] = { deps: normalized, cleanup: fn() }; });
  },
  isWebMCPAvailable: () => true, WEBMCP_STATUS_EVENT: 'status',
  listWorkspaces: async () => { sidebarReads++; return [{ id: 'esigglol', slug: 'esigglol', taskCount: data.tasks.length }]; },
  getWorkspaceById: async (id, signal) => {
    contextReads++;
    if (held) await held.promise;
    if (signal.aborted) throw new Error('aborted');
    return structuredClone({ ...data, workspace: { id, slug: id } });
  },
};
vm.createContext(context);
vm.runInContext(stripTypeScriptTypes(`function render() { ${body}\nreturn { workspace, workspaces, tab, loading, loadWorkspace }; }`), context);
const flush = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
const render = () => { cursor = 0; const result = context.render(); while (pendingEffects.length) pendingEffects.shift()(); return result; };
const tick = async () => { for (const fn of timers.values()) fn(); await flush(); return render(); };
render(); await flush(); render();
assert.equal(timers.size, 1);
// Mutations arrive without dispatching wikiagent:changed.
data.tasks.push({ id: 'task', status: 'todo' });
let result = await tick(); assert.equal(result.workspace.tasks.length, 1);
data.knowledge.push({ title: 'External knowledge', content: 'Evidence' });
result = await tick(); assert.equal(result.workspace.knowledge.length, 1);
data.decisionProposals.push({ status: 'pending' });
result = await tick(); assert.equal(result.workspace.decisionProposals.length, 1);
data.tasks[0].status = 'done';
result = await tick(); assert.equal(result.workspace.tasks[0].status, 'done');
assert.equal(result.tab, 'tasks'); assert.equal(result.loading, false);
const previous = result.workspace;
result = await tick(); assert.equal(result.workspace, previous, 'unchanged data preserves React state identity');
assert.ok(sidebarReads >= 2);
document.visibilityState = 'hidden';
let count = contextReads; await tick(); assert.equal(contextReads, count);
document.visibilityState = 'visible';
listeners.get('visibilitychange')(); await flush(); assert.equal(contextReads, count + 1);
let release;
held = { promise: new Promise((resolve) => { release = resolve; }) };
count = contextReads; await tick(); await tick(); listeners.get('wikiagent:changed')({ detail: {} });
assert.equal(contextReads, count + 1, 'poll and event refreshes never overlap');
release(); held = null; await flush();
// A stale workspace response must not overwrite navigation.
held = { promise: new Promise((resolve) => { release = resolve; }) };
await tick();
const switching = result.loadWorkspace('other');
release(); held = null; await switching; await flush();
result = render(); assert.equal(result.workspace.workspace.id, 'other'); assert.equal(timers.size, 1);
for (const slot of slots) slot?.cleanup?.();
assert.equal(timers.size, 0); assert.equal(listeners.size, 0);
// No model utility is supplied to the harness: any accidental call fails the test.
console.log('PASS: external mutations, visibility, overlap, stable state, sidebar, navigation, cleanup; no model calls.');
