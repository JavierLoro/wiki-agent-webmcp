import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

const databasePath = path.resolve(process.env.DATABASE_PATH?.trim() || "./data/wiki-agent.db");
fs.mkdirSync(path.dirname(databasePath), { recursive: true });
export const db = new Database(databasePath);
db.pragma("journal_mode = WAL"); db.pragma("busy_timeout = 5000");
const exists = (name: string) => Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(name));

function migrateLegacy(): void {
  if (!exists("projects")) return;
  db.pragma("foreign_keys = OFF");
  try { db.transaction(() => db.exec(`
    CREATE TABLE workspaces_new (id TEXT PRIMARY KEY,name TEXT NOT NULL,slug TEXT NOT NULL UNIQUE,type TEXT NOT NULL DEFAULT 'general',description TEXT NOT NULL,context TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'active',parent_workspace_id TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,FOREIGN KEY(parent_workspace_id) REFERENCES workspaces_new(id) ON DELETE CASCADE);
    INSERT INTO workspaces_new SELECT id,name,slug,CASE WHEN slug='compa-friki' THEN 'hardware_project' ELSE 'general' END,description,'',status,NULL,created_at,updated_at FROM projects;
    CREATE TABLE tasks_new (id TEXT PRIMARY KEY,workspace_id TEXT NOT NULL,title TEXT NOT NULL,description TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'todo',priority TEXT NOT NULL DEFAULT 'medium',created_by TEXT NOT NULL DEFAULT 'human',created_at TEXT NOT NULL,updated_at TEXT NOT NULL,FOREIGN KEY(workspace_id) REFERENCES workspaces_new(id) ON DELETE CASCADE);
    INSERT INTO tasks_new SELECT id,project_id,title,description,status,priority,created_by,created_at,updated_at FROM tasks;
    CREATE TABLE decisions_new (id TEXT PRIMARY KEY,workspace_id TEXT NOT NULL,title TEXT NOT NULL,decision TEXT NOT NULL,rationale TEXT NOT NULL DEFAULT '',created_by TEXT NOT NULL DEFAULT 'human',created_at TEXT NOT NULL,FOREIGN KEY(workspace_id) REFERENCES workspaces_new(id) ON DELETE CASCADE);
    INSERT INTO decisions_new SELECT id,project_id,title,decision,rationale,created_by,created_at FROM decisions;
    CREATE TABLE knowledge_items_new (id TEXT PRIMARY KEY,workspace_id TEXT NOT NULL,type TEXT NOT NULL DEFAULT 'note',title TEXT NOT NULL,content TEXT NOT NULL,created_by TEXT NOT NULL DEFAULT 'human',created_at TEXT NOT NULL,updated_at TEXT NOT NULL,FOREIGN KEY(workspace_id) REFERENCES workspaces_new(id) ON DELETE CASCADE);
    INSERT INTO knowledge_items_new SELECT id,project_id,'note',title,content,created_by,created_at,updated_at FROM notes;
    CREATE TABLE agent_runs_new (id TEXT PRIMARY KEY,workspace_id TEXT NOT NULL,agent_name TEXT NOT NULL,input TEXT NOT NULL,output TEXT NOT NULL,status TEXT NOT NULL,created_at TEXT NOT NULL,FOREIGN KEY(workspace_id) REFERENCES workspaces_new(id) ON DELETE CASCADE);
    INSERT INTO agent_runs_new SELECT id,project_id,agent_name,input,output,status,created_at FROM agent_runs;
    DROP TABLE agent_runs; DROP TABLE notes; DROP TABLE decisions; DROP TABLE tasks; DROP TABLE projects;
    ALTER TABLE workspaces_new RENAME TO workspaces; ALTER TABLE tasks_new RENAME TO tasks; ALTER TABLE decisions_new RENAME TO decisions; ALTER TABLE knowledge_items_new RENAME TO knowledge_items; ALTER TABLE agent_runs_new RENAME TO agent_runs;
  `))(); } finally { db.pragma("foreign_keys = ON"); }
}

migrateLegacy();
db.exec(`
  CREATE TABLE IF NOT EXISTS workspaces (id TEXT PRIMARY KEY,name TEXT NOT NULL,slug TEXT NOT NULL UNIQUE,type TEXT NOT NULL DEFAULT 'general',description TEXT NOT NULL,context TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'active',parent_workspace_id TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,FOREIGN KEY(parent_workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE);
  CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY,workspace_id TEXT NOT NULL,title TEXT NOT NULL,description TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'todo' CHECK(status IN ('todo','in_progress','blocked','done')),priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low','medium','high','critical')),created_by TEXT NOT NULL DEFAULT 'human',created_at TEXT NOT NULL,updated_at TEXT NOT NULL,FOREIGN KEY(workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE);
  CREATE TABLE IF NOT EXISTS decisions (id TEXT PRIMARY KEY,workspace_id TEXT NOT NULL,title TEXT NOT NULL,decision TEXT NOT NULL,rationale TEXT NOT NULL DEFAULT '',created_by TEXT NOT NULL DEFAULT 'human',created_at TEXT NOT NULL,FOREIGN KEY(workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE);
  CREATE TABLE IF NOT EXISTS knowledge_items (id TEXT PRIMARY KEY,workspace_id TEXT NOT NULL,type TEXT NOT NULL DEFAULT 'note' CHECK(type IN ('note','finding','question','requirement','hypothesis','reference')),title TEXT NOT NULL,content TEXT NOT NULL,created_by TEXT NOT NULL DEFAULT 'human',created_at TEXT NOT NULL,updated_at TEXT NOT NULL,FOREIGN KEY(workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE);
  CREATE TABLE IF NOT EXISTS agent_runs (id TEXT PRIMARY KEY,workspace_id TEXT NOT NULL,agent_name TEXT NOT NULL,input TEXT NOT NULL,output TEXT NOT NULL,status TEXT NOT NULL,created_at TEXT NOT NULL,FOREIGN KEY(workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE);
  CREATE TABLE IF NOT EXISTS session_items (id INTEGER PRIMARY KEY AUTOINCREMENT,session_id TEXT NOT NULL,item_json TEXT NOT NULL,created_at TEXT NOT NULL);
  CREATE INDEX IF NOT EXISTS idx_workspaces_parent ON workspaces(parent_workspace_id); CREATE INDEX IF NOT EXISTS idx_tasks_workspace ON tasks(workspace_id); CREATE INDEX IF NOT EXISTS idx_decisions_workspace ON decisions(workspace_id); CREATE INDEX IF NOT EXISTS idx_knowledge_workspace ON knowledge_items(workspace_id); CREATE INDEX IF NOT EXISTS idx_runs_workspace ON agent_runs(workspace_id); CREATE INDEX IF NOT EXISTS idx_session_items_session ON session_items(session_id,id);
`);
db.pragma("foreign_keys = ON");
const now = () => new Date().toISOString(); const id = (p: string) => `${p}_${randomUUID()}`;

export function seedDatabase(): void {
  const { count } = db.prepare("SELECT COUNT(*) count FROM workspaces").get() as { count: number }; if (count) return;
  db.transaction(() => {
    const wid="workspace_compa_friki", ts=now();
    db.prepare("INSERT INTO workspaces VALUES (?,?,?,?,?,?,?,?,?,?)").run(wid,"Compa Friki","compa-friki","hardware_project","A persistent AI companion built around an ESP32-class device, display, local interaction and agent orchestration.","Hardware, firmware and persistent agent orchestration.","active",null,ts,ts);
    const task=db.prepare("INSERT INTO tasks VALUES (?,?,?,?,?,?,?,?,?)");
    task.run(id("task"),wid,"Validate display integration","Confirm the final MCU/display combination and driver compatibility.","todo","high","human",ts,ts); task.run(id("task"),wid,"Prototype persistent agent gateway","Define how the device communicates with the persistent Wiki Agent.","in_progress","high","human",ts,ts); task.run(id("task"),wid,"Design enclosure revision","Adapt the enclosure after the battery and board dimensions are finalized.","blocked","medium","human",ts,ts);
    const decision=db.prepare("INSERT INTO decisions VALUES (?,?,?,?,?,?,?)"); decision.run(id("decision"),wid,"Persistent workspace memory","The workspace is the persistent source of context instead of individual conversations.","Agents can be ephemeral while workspace state remains durable.","human",ts); decision.run(id("decision"),wid,"Shared agent workspace","External agents and the Wiki Agent manipulate the same structured state.","Human and agent workflows remain synchronized.","human",ts);
    db.prepare("INSERT INTO knowledge_items VALUES (?,?,?,?,?,?,?,?)").run(id("knowledge"),wid,"note","Current hardware context","Battery candidate: LP102228, 3.7 V, 600 mAh, approximately 10 × 22 × 28 mm. MCU/display combination remains an open integration question.","human",ts,ts);
  })();
}
export function resetDatabase(): void { db.transaction(() => db.exec("DELETE FROM session_items;DELETE FROM agent_runs;DELETE FROM knowledge_items;DELETE FROM decisions;DELETE FROM tasks;DELETE FROM workspaces;"))(); seedDatabase(); }
seedDatabase();
