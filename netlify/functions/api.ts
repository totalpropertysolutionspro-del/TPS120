import express from "express";
import cors from "cors";
import serverless from "serverless-http";
import { createClient } from "@libsql/client/web";

const sqlite = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Lazy init
let initialized = false;
async function ensureInit() {
  if (initialized) return;
  const statements = [
    `CREATE TABLE IF NOT EXISTS properties (id TEXT PRIMARY KEY, name TEXT NOT NULL, address TEXT NOT NULL, type TEXT NOT NULL, units INTEGER NOT NULL, status TEXT NOT NULL, contact_name TEXT, email TEXT, phone TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS tenants (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT NOT NULL, property_id TEXT NOT NULL, unit TEXT NOT NULL, lease_start TEXT NOT NULL, lease_end TEXT NOT NULL, rent_amount REAL NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS work_orders (id TEXT PRIMARY KEY, title TEXT NOT NULL, property_id TEXT NOT NULL, priority TEXT NOT NULL, urgency TEXT, type TEXT, status TEXT NOT NULL, assigned_vendor_id TEXT, notes TEXT, due_date TEXT, contact_phone TEXT, contact_email TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS invoices (id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, amount REAL NOT NULL, due_date TEXT NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS vendors (id TEXT PRIMARY KEY, name TEXT NOT NULL, company TEXT, email TEXT, phone TEXT, service TEXT NOT NULL, rate REAL, notes TEXT, status TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS contacts (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT, phone TEXT, company TEXT, role TEXT, type TEXT NOT NULL, notes TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS notes (id TEXT PRIMARY KEY, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL, title TEXT, content TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS files (id TEXT PRIMARY KEY, entity_type TEXT NOT NULL, entity_id TEXT, filename TEXT NOT NULL, original_name TEXT NOT NULL, mime_type TEXT NOT NULL, size INTEGER NOT NULL, data TEXT NOT NULL, created_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS calendar_events (id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT, start_date TEXT NOT NULL, end_date TEXT, all_day INTEGER NOT NULL DEFAULT 0, type TEXT NOT NULL, entity_type TEXT, entity_id TEXT, color TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS reminders (id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT, due_date TEXT NOT NULL, priority TEXT NOT NULL, status TEXT NOT NULL, entity_type TEXT, entity_id TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY, type TEXT NOT NULL, title TEXT NOT NULL, message TEXT NOT NULL, is_read INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL)`,
  ];
  for (const s of statements) await sqlite.execute(s);
  initialized = true;
}

const now = () => new Date().toISOString();
const uid = () => crypto.randomUUID();

function toCamel(row: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(row)) {
    out[k.replace(/_([a-z])/g, (_, c) => c.toUpperCase())] = v;
  }
  return out;
}

function toSnake(key: string): string {
  return key.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase());
}

// Generic CRUD helper
function crud(table: string, cols: string[]) {
  const router = express.Router();

  router.get("/", async (req, res) => {
    try {
      await ensureInit();
      const result = await sqlite.execute(`SELECT * FROM ${table}`);
      res.json(result.rows.map(toCamel));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  router.get("/:id", async (req, res) => {
    try {
      await ensureInit();
      const result = await sqlite.execute({ sql: `SELECT * FROM ${table} WHERE id = ?`, args: [req.params.id] });
      result.rows.length ? res.json(toCamel(result.rows[0] as any)) : res.status(404).json({ error: "Not found" });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  router.post("/", async (req, res) => {
    try {
      await ensureInit();
      const id = uid(); const ts = now();
      const insertCols: string[] = ["id"];
      const insertVals: any[] = [id];
      for (const [k, v] of Object.entries(req.body)) {
        const col = toSnake(k);
        if (cols.includes(col) && col !== "id" && col !== "created_at" && col !== "updated_at") {
          insertCols.push(col);
          insertVals.push(v ?? null);
        }
      }
      if (cols.includes("created_at")) { insertCols.push("created_at"); insertVals.push(ts); }
      if (cols.includes("updated_at")) { insertCols.push("updated_at"); insertVals.push(ts); }
      const placeholders = insertVals.map(() => "?").join(", ");
      await sqlite.execute({ sql: `INSERT INTO ${table} (${insertCols.join(", ")}) VALUES (${placeholders})`, args: insertVals });
      const result = await sqlite.execute({ sql: `SELECT * FROM ${table} WHERE id = ?`, args: [id] });
      res.status(201).json(toCamel(result.rows[0] as any));
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  router.put("/:id", async (req, res) => {
    try {
      await ensureInit();
      const sets: string[] = [];
      const args: any[] = [];
      for (const [k, v] of Object.entries(req.body)) {
        const col = toSnake(k);
        if (cols.includes(col) && col !== "id") { sets.push(`${col} = ?`); args.push(v); }
      }
      if (cols.includes("updated_at")) { sets.push("updated_at = ?"); args.push(now()); }
      args.push(req.params.id);
      if (sets.length > 0) await sqlite.execute({ sql: `UPDATE ${table} SET ${sets.join(", ")} WHERE id = ?`, args });
      const result = await sqlite.execute({ sql: `SELECT * FROM ${table} WHERE id = ?`, args: [req.params.id] });
      result.rows.length ? res.json(toCamel(result.rows[0] as any)) : res.status(404).json({ error: "Not found" });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  router.delete("/:id", async (req, res) => {
    try {
      await ensureInit();
      await sqlite.execute({ sql: `DELETE FROM ${table} WHERE id = ?`, args: [req.params.id] });
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  return router;
}

// Mount CRUD routes
app.use("/api/properties", crud("properties", ["id","name","address","type","units","status","contact_name","email","phone","created_at","updated_at"]));
app.use("/api/tenants", crud("tenants", ["id","name","email","phone","property_id","unit","lease_start","lease_end","rent_amount","created_at","updated_at"]));
app.use("/api/work-orders", crud("work_orders", ["id","title","property_id","priority","urgency","type","status","assigned_vendor_id","notes","due_date","contact_phone","contact_email","created_at","updated_at"]));
app.use("/api/invoices", crud("invoices", ["id","tenant_id","amount","due_date","status","created_at","updated_at"]));
app.use("/api/vendors", crud("vendors", ["id","name","company","email","phone","service","rate","notes","status","created_at","updated_at"]));
app.use("/api/contacts", crud("contacts", ["id","name","email","phone","company","role","type","notes","created_at","updated_at"]));
app.use("/api/reminders", crud("reminders", ["id","title","description","due_date","priority","status","entity_type","entity_id","created_at","updated_at"]));

// Notes with entity filtering
app.get("/api/notes", async (req, res) => {
  try {
    await ensureInit();
    const { entityType, entityId } = req.query;
    const result = entityType && entityId
      ? await sqlite.execute({ sql: "SELECT * FROM notes WHERE entity_type = ? AND entity_id = ?", args: [entityType as string, entityId as string] })
      : await sqlite.execute("SELECT * FROM notes");
    res.json(result.rows.map(toCamel));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.use("/api/notes", crud("notes", ["id","entity_type","entity_id","title","content","created_at","updated_at"]));

// Files - listing without data column
app.get("/api/files", async (req, res) => {
  try {
    await ensureInit();
    const { entityType, entityId } = req.query;
    const cols = "id, entity_type, entity_id, filename, original_name, mime_type, size, created_at";
    const result = entityType && entityId
      ? await sqlite.execute({ sql: `SELECT ${cols} FROM files WHERE entity_type = ? AND entity_id = ?`, args: [entityType as string, entityId as string] })
      : await sqlite.execute(`SELECT ${cols} FROM files`);
    res.json(result.rows.map(toCamel));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.get("/api/files/:id", async (req, res) => {
  try {
    await ensureInit();
    const result = await sqlite.execute({ sql: "SELECT * FROM files WHERE id = ?", args: [req.params.id] });
    result.rows.length ? res.json(toCamel(result.rows[0] as any)) : res.status(404).json({ error: "Not found" });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.post("/api/files", async (req, res) => {
  try {
    await ensureInit();
    const { data, originalName, mimeType, size, entityType: et, entityId: ei } = req.body;
    if (!data || size > 5 * 1024 * 1024) return res.status(400).json({ error: "File too large (5MB max)" });
    const id = uid(); const ts = now();
    await sqlite.execute({
      sql: "INSERT INTO files (id, entity_type, entity_id, filename, original_name, mime_type, size, data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      args: [id, et || "general", ei || null, id + "-" + (originalName || "file"), originalName || "file", mimeType || "application/octet-stream", size, data, ts],
    });
    res.status(201).json({ id, originalName, mimeType, size, entityType: et, entityId: ei, createdAt: ts });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.delete("/api/files/:id", async (req, res) => {
  try {
    await ensureInit();
    await sqlite.execute({ sql: "DELETE FROM files WHERE id = ?", args: [req.params.id] });
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Calendar with date filtering
app.get("/api/calendar", async (req, res) => {
  try {
    await ensureInit();
    const { start, end } = req.query;
    const result = start && end
      ? await sqlite.execute({ sql: "SELECT * FROM calendar_events WHERE start_date >= ? AND start_date <= ?", args: [start as string, end as string] })
      : await sqlite.execute("SELECT * FROM calendar_events");
    res.json(result.rows.map(toCamel));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.use("/api/calendar", crud("calendar_events", ["id","title","description","start_date","end_date","all_day","type","entity_type","entity_id","color","created_at","updated_at"]));

// Notifications
app.get("/api/notifications", async (_req, res) => {
  try { await ensureInit(); res.json((await sqlite.execute("SELECT * FROM notifications")).rows.map(toCamel)); } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.get("/api/notifications/unread", async (_req, res) => {
  try { await ensureInit(); res.json((await sqlite.execute({ sql: "SELECT * FROM notifications WHERE is_read = 0", args: [] })).rows.map(toCamel)); } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.get("/api/notifications/unread/count", async (_req, res) => {
  try { await ensureInit(); const r = await sqlite.execute("SELECT COUNT(*) as cnt FROM notifications WHERE is_read = 0"); res.json({ count: Number((r.rows[0] as any)?.cnt ?? 0) }); } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.put("/api/notifications/:id/read", async (req, res) => {
  try { await ensureInit(); await sqlite.execute({ sql: "UPDATE notifications SET is_read = 1 WHERE id = ?", args: [req.params.id] }); res.json({ success: true }); } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.put("/api/notifications/all/read", async (_req, res) => {
  try { await ensureInit(); await sqlite.execute("UPDATE notifications SET is_read = 1 WHERE is_read = 0"); res.json({ success: true }); } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Health
app.get("/api/health", (_req, res) => res.json({ status: "ok", db: "turso-cloud" }));

export const handler = serverless(app);
