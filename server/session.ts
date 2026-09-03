import type { AgentInputItem, Session } from "@openai/agents";
import { db } from "./db.js";

export class SqliteSession implements Session {
  constructor(private readonly sessionId: string) {}
  async getSessionId(): Promise<string> { return this.sessionId; }
  async getItems(limit?: number): Promise<AgentInputItem[]> {
    if (limit !== undefined && (!Number.isSafeInteger(limit) || limit < 0)) throw new RangeError("Session item limit must be a non-negative integer.");
    if (limit === 0) return [];
    const rows = limit === undefined
      ? db.prepare("SELECT item_json FROM session_items WHERE session_id=? ORDER BY id ASC").all(this.sessionId)
      : db.prepare("SELECT item_json FROM (SELECT id,item_json FROM session_items WHERE session_id=? ORDER BY id DESC LIMIT ?) ORDER BY id ASC").all(this.sessionId, limit);
    return (rows as Array<{ item_json: string }>).map(({ item_json }) => JSON.parse(item_json) as AgentInputItem);
  }
  async addItems(items: AgentInputItem[]): Promise<void> {
    if (items.length === 0) return;
    const insert = db.prepare("INSERT INTO session_items (session_id,item_json,created_at) VALUES (?,?,?)");
    db.transaction((values: AgentInputItem[]) => { for (const item of values) insert.run(this.sessionId, JSON.stringify(item), new Date().toISOString()); })(items);
  }
  async popItem(): Promise<AgentInputItem | undefined> {
    return db.transaction(() => {
      const row = db.prepare("SELECT id,item_json FROM session_items WHERE session_id=? ORDER BY id DESC LIMIT 1").get(this.sessionId) as { id: number; item_json: string } | undefined;
      if (!row) return undefined;
      db.prepare("DELETE FROM session_items WHERE id=?").run(row.id);
      return JSON.parse(row.item_json) as AgentInputItem;
    })();
  }
  async clearSession(): Promise<void> { db.prepare("DELETE FROM session_items WHERE session_id=?").run(this.sessionId); }
}
