import express from "express";
import cors from "cors";
import { createClient } from "@libsql/client/web";
import { v4 as uuidv4 } from "uuid";

// Initialize Turso cloud database
const sqlite = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:./data/tps.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Lazy init - creates tables on first request
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
    `CREATE TABLE IF NOT EXISTS email_templates (id TEXT PRIMARY KEY, name TEXT NOT NULL, subject TEXT NOT NULL, body TEXT NOT NULL, type TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS sent_emails (id TEXT PRIMARY KEY, to_email TEXT NOT NULL, to_name TEXT, subject TEXT NOT NULL, body TEXT NOT NULL, status TEXT NOT NULL, template_id TEXT, entity_type TEXT, entity_id TEXT, created_at TEXT NOT NULL)`,
  ];
  for (const s of statements) await sqlite.execute(s);
  initialized = true;
}

// Helper: current ISO timestamp
const now = () => new Date().toISOString();

// Helper: convert snake_case row to camelCase
function toCamel(row: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(row)) {
    const camel = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    out[camel] = v;
  }
  return out;
}

// Helper: convert camelCase body keys to snake_case for SQL columns
function toSnake(key: string): string {
  return key.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase());
}

// ===== PROPERTIES =====
const PROPERTY_COLS = ["id", "name", "address", "type", "units", "status", "contact_name", "email", "phone", "created_at", "updated_at"];

app.get("/api/properties", async (_req, res) => {
  await ensureInit();
  const result = await sqlite.execute("SELECT * FROM properties");
  res.json(result.rows.map(toCamel));
});

app.get("/api/properties/:id", async (req, res) => {
  await ensureInit();
  const result = await sqlite.execute({ sql: "SELECT * FROM properties WHERE id = ?", args: [req.params.id] });
  result.rows.length ? res.json(toCamel(result.rows[0] as any)) : res.status(404).json({ error: "Not found" });
});

app.post("/api/properties", async (req, res) => {
  await ensureInit();
  const id = uuidv4();
  const ts = now();
  const { name, address, type, units, status, contactName, email, phone } = req.body;
  await sqlite.execute({
    sql: "INSERT INTO properties (id, name, address, type, units, status, contact_name, email, phone, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    args: [id, name, address, type, units, status, contactName ?? null, email ?? null, phone ?? null, ts, ts],
  });
  const result = await sqlite.execute({ sql: "SELECT * FROM properties WHERE id = ?", args: [id] });
  res.status(201).json(toCamel(result.rows[0] as any));
});

app.put("/api/properties/:id", async (req, res) => {
  await ensureInit();
  const sets: string[] = [];
  const args: any[] = [];
  for (const [k, v] of Object.entries(req.body)) {
    const col = toSnake(k);
    if (PROPERTY_COLS.includes(col) && col !== "id") {
      sets.push(`${col} = ?`);
      args.push(v);
    }
  }
  sets.push("updated_at = ?");
  args.push(now());
  args.push(req.params.id);
  await sqlite.execute({ sql: `UPDATE properties SET ${sets.join(", ")} WHERE id = ?`, args });
  const result = await sqlite.execute({ sql: "SELECT * FROM properties WHERE id = ?", args: [req.params.id] });
  result.rows.length ? res.json(toCamel(result.rows[0] as any)) : res.status(404).json({ error: "Not found" });
});

app.delete("/api/properties/:id", async (req, res) => {
  await ensureInit();
  await sqlite.execute({ sql: "DELETE FROM properties WHERE id = ?", args: [req.params.id] });
  res.json({ success: true });
});

// ===== TENANTS =====
const TENANT_COLS = ["id", "name", "email", "phone", "property_id", "unit", "lease_start", "lease_end", "rent_amount", "created_at", "updated_at"];

app.get("/api/tenants", async (_req, res) => {
  await ensureInit();
  const result = await sqlite.execute("SELECT * FROM tenants");
  res.json(result.rows.map(toCamel));
});

app.get("/api/tenants/:id", async (req, res) => {
  await ensureInit();
  const result = await sqlite.execute({ sql: "SELECT * FROM tenants WHERE id = ?", args: [req.params.id] });
  result.rows.length ? res.json(toCamel(result.rows[0] as any)) : res.status(404).json({ error: "Not found" });
});

app.post("/api/tenants", async (req, res) => {
  await ensureInit();
  const id = uuidv4();
  const ts = now();
  const { name, email, phone, propertyId, unit, leaseStart, leaseEnd, rentAmount } = req.body;
  await sqlite.execute({
    sql: "INSERT INTO tenants (id, name, email, phone, property_id, unit, lease_start, lease_end, rent_amount, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    args: [id, name, email, phone, propertyId, unit, leaseStart, leaseEnd, rentAmount, ts, ts],
  });
  const result = await sqlite.execute({ sql: "SELECT * FROM tenants WHERE id = ?", args: [id] });
  res.status(201).json(toCamel(result.rows[0] as any));
});

app.put("/api/tenants/:id", async (req, res) => {
  await ensureInit();
  const sets: string[] = [];
  const args: any[] = [];
  for (const [k, v] of Object.entries(req.body)) {
    const col = toSnake(k);
    if (TENANT_COLS.includes(col) && col !== "id") {
      sets.push(`${col} = ?`);
      args.push(v);
    }
  }
  sets.push("updated_at = ?");
  args.push(now());
  args.push(req.params.id);
  await sqlite.execute({ sql: `UPDATE tenants SET ${sets.join(", ")} WHERE id = ?`, args });
  const result = await sqlite.execute({ sql: "SELECT * FROM tenants WHERE id = ?", args: [req.params.id] });
  result.rows.length ? res.json(toCamel(result.rows[0] as any)) : res.status(404).json({ error: "Not found" });
});

app.delete("/api/tenants/:id", async (req, res) => {
  await ensureInit();
  await sqlite.execute({ sql: "DELETE FROM tenants WHERE id = ?", args: [req.params.id] });
  res.json({ success: true });
});

// ===== WORK ORDERS / TICKETS =====
const WORK_ORDER_COLS = ["id", "title", "property_id", "priority", "urgency", "type", "status", "assigned_vendor_id", "notes", "due_date", "contact_phone", "contact_email", "created_at", "updated_at"];

app.get("/api/work-orders", async (_req, res) => {
  await ensureInit();
  const result = await sqlite.execute("SELECT * FROM work_orders");
  res.json(result.rows.map(toCamel));
});

app.get("/api/work-orders/:id", async (req, res) => {
  await ensureInit();
  const result = await sqlite.execute({ sql: "SELECT * FROM work_orders WHERE id = ?", args: [req.params.id] });
  result.rows.length ? res.json(toCamel(result.rows[0] as any)) : res.status(404).json({ error: "Not found" });
});

app.post("/api/work-orders", async (req, res) => {
  await ensureInit();
  const id = uuidv4();
  const ts = now();
  const { title, propertyId, priority, urgency, type, status, assignedVendorId, notes, dueDate, contactPhone, contactEmail } = req.body;
  await sqlite.execute({
    sql: "INSERT INTO work_orders (id, title, property_id, priority, urgency, type, status, assigned_vendor_id, notes, due_date, contact_phone, contact_email, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    args: [id, title, propertyId, priority, urgency ?? null, type ?? null, status, assignedVendorId ?? null, notes ?? null, dueDate ?? null, contactPhone ?? null, contactEmail ?? null, ts, ts],
  });
  // Create notification for new ticket
  await sqlite.execute({
    sql: "INSERT INTO notifications (id, type, title, message, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    args: [uuidv4(), "work_order_created", "New Ticket", `Ticket created: ${title}`, 0, ts],
  });
  const result = await sqlite.execute({ sql: "SELECT * FROM work_orders WHERE id = ?", args: [id] });
  res.status(201).json(toCamel(result.rows[0] as any));
});

app.put("/api/work-orders/:id", async (req, res) => {
  await ensureInit();
  const sets: string[] = [];
  const args: any[] = [];
  for (const [k, v] of Object.entries(req.body)) {
    const col = toSnake(k);
    if (WORK_ORDER_COLS.includes(col) && col !== "id") {
      sets.push(`${col} = ?`);
      args.push(v);
    }
  }
  sets.push("updated_at = ?");
  args.push(now());
  args.push(req.params.id);
  await sqlite.execute({ sql: `UPDATE work_orders SET ${sets.join(", ")} WHERE id = ?`, args });
  const result = await sqlite.execute({ sql: "SELECT * FROM work_orders WHERE id = ?", args: [req.params.id] });
  result.rows.length ? res.json(toCamel(result.rows[0] as any)) : res.status(404).json({ error: "Not found" });
});

app.delete("/api/work-orders/:id", async (req, res) => {
  await ensureInit();
  await sqlite.execute({ sql: "DELETE FROM work_orders WHERE id = ?", args: [req.params.id] });
  res.json({ success: true });
});

// ===== INVOICES =====
const INVOICE_COLS = ["id", "tenant_id", "amount", "due_date", "status", "created_at", "updated_at"];

app.get("/api/invoices", async (_req, res) => {
  await ensureInit();
  const result = await sqlite.execute("SELECT * FROM invoices");
  res.json(result.rows.map(toCamel));
});

app.get("/api/invoices/:id", async (req, res) => {
  await ensureInit();
  const result = await sqlite.execute({ sql: "SELECT * FROM invoices WHERE id = ?", args: [req.params.id] });
  result.rows.length ? res.json(toCamel(result.rows[0] as any)) : res.status(404).json({ error: "Not found" });
});

app.post("/api/invoices", async (req, res) => {
  await ensureInit();
  const id = uuidv4();
  const ts = now();
  const { tenantId, amount, dueDate, status } = req.body;
  await sqlite.execute({
    sql: "INSERT INTO invoices (id, tenant_id, amount, due_date, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    args: [id, tenantId, amount, dueDate, status, ts, ts],
  });
  const result = await sqlite.execute({ sql: "SELECT * FROM invoices WHERE id = ?", args: [id] });
  res.status(201).json(toCamel(result.rows[0] as any));
});

app.put("/api/invoices/:id", async (req, res) => {
  await ensureInit();
  const sets: string[] = [];
  const args: any[] = [];
  for (const [k, v] of Object.entries(req.body)) {
    const col = toSnake(k);
    if (INVOICE_COLS.includes(col) && col !== "id") {
      sets.push(`${col} = ?`);
      args.push(v);
    }
  }
  sets.push("updated_at = ?");
  args.push(now());
  args.push(req.params.id);
  await sqlite.execute({ sql: `UPDATE invoices SET ${sets.join(", ")} WHERE id = ?`, args });
  const result = await sqlite.execute({ sql: "SELECT * FROM invoices WHERE id = ?", args: [req.params.id] });
  result.rows.length ? res.json(toCamel(result.rows[0] as any)) : res.status(404).json({ error: "Not found" });
});

app.delete("/api/invoices/:id", async (req, res) => {
  await ensureInit();
  await sqlite.execute({ sql: "DELETE FROM invoices WHERE id = ?", args: [req.params.id] });
  res.json({ success: true });
});

// ===== VENDORS =====
const VENDOR_COLS = ["id", "name", "company", "email", "phone", "service", "rate", "notes", "status", "created_at", "updated_at"];

app.get("/api/vendors", async (_req, res) => {
  await ensureInit();
  const result = await sqlite.execute("SELECT * FROM vendors");
  res.json(result.rows.map(toCamel));
});

app.get("/api/vendors/:id", async (req, res) => {
  await ensureInit();
  const result = await sqlite.execute({ sql: "SELECT * FROM vendors WHERE id = ?", args: [req.params.id] });
  result.rows.length ? res.json(toCamel(result.rows[0] as any)) : res.status(404).json({ error: "Not found" });
});

app.post("/api/vendors", async (req, res) => {
  await ensureInit();
  const id = uuidv4();
  const ts = now();
  const { name, company, email, phone, service, rate, notes, status } = req.body;
  await sqlite.execute({
    sql: "INSERT INTO vendors (id, name, company, email, phone, service, rate, notes, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    args: [id, name, company ?? null, email ?? null, phone ?? null, service, rate ?? null, notes ?? null, status, ts, ts],
  });
  const result = await sqlite.execute({ sql: "SELECT * FROM vendors WHERE id = ?", args: [id] });
  res.status(201).json(toCamel(result.rows[0] as any));
});

app.put("/api/vendors/:id", async (req, res) => {
  await ensureInit();
  const sets: string[] = [];
  const args: any[] = [];
  for (const [k, v] of Object.entries(req.body)) {
    const col = toSnake(k);
    if (VENDOR_COLS.includes(col) && col !== "id") {
      sets.push(`${col} = ?`);
      args.push(v);
    }
  }
  sets.push("updated_at = ?");
  args.push(now());
  args.push(req.params.id);
  await sqlite.execute({ sql: `UPDATE vendors SET ${sets.join(", ")} WHERE id = ?`, args });
  const result = await sqlite.execute({ sql: "SELECT * FROM vendors WHERE id = ?", args: [req.params.id] });
  result.rows.length ? res.json(toCamel(result.rows[0] as any)) : res.status(404).json({ error: "Not found" });
});

app.delete("/api/vendors/:id", async (req, res) => {
  await ensureInit();
  await sqlite.execute({ sql: "DELETE FROM vendors WHERE id = ?", args: [req.params.id] });
  res.json({ success: true });
});

// ===== CONTACTS =====
const CONTACT_COLS = ["id", "name", "email", "phone", "company", "role", "type", "notes", "created_at", "updated_at"];

app.get("/api/contacts", async (_req, res) => {
  await ensureInit();
  const result = await sqlite.execute("SELECT * FROM contacts");
  res.json(result.rows.map(toCamel));
});

app.get("/api/contacts/:id", async (req, res) => {
  await ensureInit();
  const result = await sqlite.execute({ sql: "SELECT * FROM contacts WHERE id = ?", args: [req.params.id] });
  result.rows.length ? res.json(toCamel(result.rows[0] as any)) : res.status(404).json({ error: "Not found" });
});

app.post("/api/contacts", async (req, res) => {
  await ensureInit();
  const id = uuidv4();
  const ts = now();
  const { name, email, phone, company, role, type, notes } = req.body;
  await sqlite.execute({
    sql: "INSERT INTO contacts (id, name, email, phone, company, role, type, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    args: [id, name, email ?? null, phone ?? null, company ?? null, role ?? null, type, notes ?? null, ts, ts],
  });
  const result = await sqlite.execute({ sql: "SELECT * FROM contacts WHERE id = ?", args: [id] });
  res.status(201).json(toCamel(result.rows[0] as any));
});

app.put("/api/contacts/:id", async (req, res) => {
  await ensureInit();
  const sets: string[] = [];
  const args: any[] = [];
  for (const [k, v] of Object.entries(req.body)) {
    const col = toSnake(k);
    if (CONTACT_COLS.includes(col) && col !== "id") {
      sets.push(`${col} = ?`);
      args.push(v);
    }
  }
  sets.push("updated_at = ?");
  args.push(now());
  args.push(req.params.id);
  await sqlite.execute({ sql: `UPDATE contacts SET ${sets.join(", ")} WHERE id = ?`, args });
  const result = await sqlite.execute({ sql: "SELECT * FROM contacts WHERE id = ?", args: [req.params.id] });
  result.rows.length ? res.json(toCamel(result.rows[0] as any)) : res.status(404).json({ error: "Not found" });
});

app.delete("/api/contacts/:id", async (req, res) => {
  await ensureInit();
  await sqlite.execute({ sql: "DELETE FROM contacts WHERE id = ?", args: [req.params.id] });
  res.json({ success: true });
});

// ===== NOTES =====
const NOTE_COLS = ["id", "entity_type", "entity_id", "title", "content", "created_at", "updated_at"];

app.get("/api/notes", async (req, res) => {
  await ensureInit();
  const { entityType, entityId } = req.query;
  if (entityType && entityId) {
    const result = await sqlite.execute({ sql: "SELECT * FROM notes WHERE entity_type = ? AND entity_id = ?", args: [entityType as string, entityId as string] });
    res.json(result.rows.map(toCamel));
  } else {
    const result = await sqlite.execute("SELECT * FROM notes");
    res.json(result.rows.map(toCamel));
  }
});

app.post("/api/notes", async (req, res) => {
  await ensureInit();
  const id = uuidv4();
  const ts = now();
  const { entityType, entityId, title, content } = req.body;
  await sqlite.execute({
    sql: "INSERT INTO notes (id, entity_type, entity_id, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    args: [id, entityType, entityId, title ?? null, content, ts, ts],
  });
  const result = await sqlite.execute({ sql: "SELECT * FROM notes WHERE id = ?", args: [id] });
  res.status(201).json(toCamel(result.rows[0] as any));
});

app.put("/api/notes/:id", async (req, res) => {
  await ensureInit();
  const sets: string[] = [];
  const args: any[] = [];
  for (const [k, v] of Object.entries(req.body)) {
    const col = toSnake(k);
    if (NOTE_COLS.includes(col) && col !== "id") {
      sets.push(`${col} = ?`);
      args.push(v);
    }
  }
  sets.push("updated_at = ?");
  args.push(now());
  args.push(req.params.id);
  await sqlite.execute({ sql: `UPDATE notes SET ${sets.join(", ")} WHERE id = ?`, args });
  const result = await sqlite.execute({ sql: "SELECT * FROM notes WHERE id = ?", args: [req.params.id] });
  result.rows.length ? res.json(toCamel(result.rows[0] as any)) : res.status(404).json({ error: "Not found" });
});

app.delete("/api/notes/:id", async (req, res) => {
  await ensureInit();
  await sqlite.execute({ sql: "DELETE FROM notes WHERE id = ?", args: [req.params.id] });
  res.json({ success: true });
});

// ===== FILES =====
app.get("/api/files", async (req, res) => {
  await ensureInit();
  const { entityType, entityId } = req.query;
  // Return files WITHOUT the data column for listing
  let result;
  if (entityType && entityId) {
    result = await sqlite.execute({
      sql: "SELECT id, entity_type, entity_id, filename, original_name, mime_type, size, created_at FROM files WHERE entity_type = ? AND entity_id = ?",
      args: [entityType as string, entityId as string],
    });
  } else {
    result = await sqlite.execute("SELECT id, entity_type, entity_id, filename, original_name, mime_type, size, created_at FROM files");
  }
  res.json(result.rows.map(toCamel));
});

app.get("/api/files/:id", async (req, res) => {
  await ensureInit();
  const result = await sqlite.execute({ sql: "SELECT * FROM files WHERE id = ?", args: [req.params.id] });
  result.rows.length ? res.json(toCamel(result.rows[0] as any)) : res.status(404).json({ error: "Not found" });
});

app.post("/api/files", async (req, res) => {
  await ensureInit();
  const { data, originalName, mimeType, size, entityType: et, entityId: ei } = req.body;
  if (!data || size > 5 * 1024 * 1024) return res.status(400).json({ error: "File too large or missing data (5MB max)" });
  const id = uuidv4();
  const ts = now();
  const fname = id + "-" + (originalName || "file");
  const oname = originalName || "file";
  const mime = mimeType || "application/octet-stream";
  await sqlite.execute({
    sql: "INSERT INTO files (id, entity_type, entity_id, filename, original_name, mime_type, size, data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    args: [id, et || "general", ei || null, fname, oname, mime, size, data, ts],
  });
  res.status(201).json({ id, originalName: oname, mimeType: mime, size, entityType: et, entityId: ei, createdAt: ts });
});

app.delete("/api/files/:id", async (req, res) => {
  await ensureInit();
  await sqlite.execute({ sql: "DELETE FROM files WHERE id = ?", args: [req.params.id] });
  res.json({ success: true });
});

// ===== CALENDAR =====
const CALENDAR_COLS = ["id", "title", "description", "start_date", "end_date", "all_day", "type", "entity_type", "entity_id", "color", "created_at", "updated_at"];

app.get("/api/calendar", async (req, res) => {
  await ensureInit();
  const { start, end } = req.query;
  if (start && end) {
    const result = await sqlite.execute({ sql: "SELECT * FROM calendar_events WHERE start_date >= ? AND start_date <= ?", args: [start as string, end as string] });
    res.json(result.rows.map(toCamel));
  } else {
    const result = await sqlite.execute("SELECT * FROM calendar_events");
    res.json(result.rows.map(toCamel));
  }
});

app.get("/api/calendar/:id", async (req, res) => {
  await ensureInit();
  const result = await sqlite.execute({ sql: "SELECT * FROM calendar_events WHERE id = ?", args: [req.params.id] });
  result.rows.length ? res.json(toCamel(result.rows[0] as any)) : res.status(404).json({ error: "Not found" });
});

app.post("/api/calendar", async (req, res) => {
  await ensureInit();
  const id = uuidv4();
  const ts = now();
  const { title, description, startDate, endDate, allDay, type, entityType, entityId, color } = req.body;
  await sqlite.execute({
    sql: "INSERT INTO calendar_events (id, title, description, start_date, end_date, all_day, type, entity_type, entity_id, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    args: [id, title, description ?? null, startDate, endDate ?? null, allDay ? 1 : 0, type, entityType ?? null, entityId ?? null, color ?? null, ts, ts],
  });
  const result = await sqlite.execute({ sql: "SELECT * FROM calendar_events WHERE id = ?", args: [id] });
  res.status(201).json(toCamel(result.rows[0] as any));
});

app.put("/api/calendar/:id", async (req, res) => {
  await ensureInit();
  const sets: string[] = [];
  const args: any[] = [];
  for (const [k, v] of Object.entries(req.body)) {
    const col = toSnake(k);
    if (CALENDAR_COLS.includes(col) && col !== "id") {
      sets.push(`${col} = ?`);
      args.push(col === "all_day" ? (v ? 1 : 0) : v);
    }
  }
  sets.push("updated_at = ?");
  args.push(now());
  args.push(req.params.id);
  await sqlite.execute({ sql: `UPDATE calendar_events SET ${sets.join(", ")} WHERE id = ?`, args });
  const result = await sqlite.execute({ sql: "SELECT * FROM calendar_events WHERE id = ?", args: [req.params.id] });
  result.rows.length ? res.json(toCamel(result.rows[0] as any)) : res.status(404).json({ error: "Not found" });
});

app.delete("/api/calendar/:id", async (req, res) => {
  await ensureInit();
  await sqlite.execute({ sql: "DELETE FROM calendar_events WHERE id = ?", args: [req.params.id] });
  res.json({ success: true });
});

// ===== REMINDERS =====
const REMINDER_COLS = ["id", "title", "description", "due_date", "priority", "status", "entity_type", "entity_id", "created_at", "updated_at"];

app.get("/api/reminders", async (req, res) => {
  await ensureInit();
  const { status } = req.query;
  if (status) {
    const result = await sqlite.execute({ sql: "SELECT * FROM reminders WHERE status = ?", args: [status as string] });
    res.json(result.rows.map(toCamel));
  } else {
    const result = await sqlite.execute("SELECT * FROM reminders");
    res.json(result.rows.map(toCamel));
  }
});

app.get("/api/reminders/:id", async (req, res) => {
  await ensureInit();
  const result = await sqlite.execute({ sql: "SELECT * FROM reminders WHERE id = ?", args: [req.params.id] });
  result.rows.length ? res.json(toCamel(result.rows[0] as any)) : res.status(404).json({ error: "Not found" });
});

app.post("/api/reminders", async (req, res) => {
  await ensureInit();
  const id = uuidv4();
  const ts = now();
  const { title, description, dueDate, priority, status, entityType, entityId } = req.body;
  await sqlite.execute({
    sql: "INSERT INTO reminders (id, title, description, due_date, priority, status, entity_type, entity_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    args: [id, title, description ?? null, dueDate, priority, status, entityType ?? null, entityId ?? null, ts, ts],
  });
  const result = await sqlite.execute({ sql: "SELECT * FROM reminders WHERE id = ?", args: [id] });
  res.status(201).json(toCamel(result.rows[0] as any));
});

app.put("/api/reminders/:id", async (req, res) => {
  await ensureInit();
  const sets: string[] = [];
  const args: any[] = [];
  for (const [k, v] of Object.entries(req.body)) {
    const col = toSnake(k);
    if (REMINDER_COLS.includes(col) && col !== "id") {
      sets.push(`${col} = ?`);
      args.push(v);
    }
  }
  sets.push("updated_at = ?");
  args.push(now());
  args.push(req.params.id);
  await sqlite.execute({ sql: `UPDATE reminders SET ${sets.join(", ")} WHERE id = ?`, args });
  const result = await sqlite.execute({ sql: "SELECT * FROM reminders WHERE id = ?", args: [req.params.id] });
  result.rows.length ? res.json(toCamel(result.rows[0] as any)) : res.status(404).json({ error: "Not found" });
});

app.delete("/api/reminders/:id", async (req, res) => {
  await ensureInit();
  await sqlite.execute({ sql: "DELETE FROM reminders WHERE id = ?", args: [req.params.id] });
  res.json({ success: true });
});

// ===== NOTIFICATIONS =====
app.get("/api/notifications", async (_req, res) => {
  await ensureInit();
  const result = await sqlite.execute("SELECT * FROM notifications");
  res.json(result.rows.map(toCamel));
});

app.get("/api/notifications/unread", async (_req, res) => {
  await ensureInit();
  const result = await sqlite.execute({ sql: "SELECT * FROM notifications WHERE is_read = ?", args: [0] });
  res.json(result.rows.map(toCamel));
});

app.get("/api/notifications/unread/count", async (_req, res) => {
  await ensureInit();
  const result = await sqlite.execute({ sql: "SELECT COUNT(*) as cnt FROM notifications WHERE is_read = ?", args: [0] });
  const count = (result.rows[0] as any)?.cnt ?? 0;
  res.json({ count: Number(count) });
});

app.put("/api/notifications/:id/read", async (req, res) => {
  await ensureInit();
  await sqlite.execute({ sql: "UPDATE notifications SET is_read = 1 WHERE id = ?", args: [req.params.id] });
  res.json({ success: true });
});

app.put("/api/notifications/all/read", async (_req, res) => {
  await ensureInit();
  await sqlite.execute({ sql: "UPDATE notifications SET is_read = 1 WHERE is_read = ?", args: [0] });
  res.json({ success: true });
});

// ===== EMAIL TEMPLATES =====
const EMAIL_TEMPLATE_COLS = ["id", "name", "subject", "body", "type", "created_at", "updated_at"];

app.get("/api/email-templates", async (_req, res) => {
  await ensureInit();
  const result = await sqlite.execute("SELECT * FROM email_templates");
  res.json(result.rows.map(toCamel));
});

app.get("/api/email-templates/:id", async (req, res) => {
  await ensureInit();
  const result = await sqlite.execute({ sql: "SELECT * FROM email_templates WHERE id = ?", args: [req.params.id] });
  result.rows.length ? res.json(toCamel(result.rows[0] as any)) : res.status(404).json({ error: "Not found" });
});

app.post("/api/email-templates", async (req, res) => {
  await ensureInit();
  const id = uuidv4();
  const ts = now();
  const { name, subject, body, type } = req.body;
  await sqlite.execute({
    sql: "INSERT INTO email_templates (id, name, subject, body, type, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    args: [id, name, subject, body, type, ts, ts],
  });
  const result = await sqlite.execute({ sql: "SELECT * FROM email_templates WHERE id = ?", args: [id] });
  res.status(201).json(toCamel(result.rows[0] as any));
});

app.put("/api/email-templates/:id", async (req, res) => {
  await ensureInit();
  const sets: string[] = [];
  const args: any[] = [];
  for (const [k, v] of Object.entries(req.body)) {
    const col = toSnake(k);
    if (EMAIL_TEMPLATE_COLS.includes(col) && col !== "id") {
      sets.push(`${col} = ?`);
      args.push(v);
    }
  }
  sets.push("updated_at = ?");
  args.push(now());
  args.push(req.params.id);
  await sqlite.execute({ sql: `UPDATE email_templates SET ${sets.join(", ")} WHERE id = ?`, args });
  const result = await sqlite.execute({ sql: "SELECT * FROM email_templates WHERE id = ?", args: [req.params.id] });
  result.rows.length ? res.json(toCamel(result.rows[0] as any)) : res.status(404).json({ error: "Not found" });
});

app.delete("/api/email-templates/:id", async (req, res) => {
  await ensureInit();
  await sqlite.execute({ sql: "DELETE FROM email_templates WHERE id = ?", args: [req.params.id] });
  res.json({ success: true });
});

// ===== SENT EMAILS =====
app.get("/api/sent-emails", async (_req, res) => {
  await ensureInit();
  const result = await sqlite.execute("SELECT * FROM sent_emails ORDER BY created_at DESC");
  res.json(result.rows.map(toCamel));
});

app.post("/api/send-email", async (req, res) => {
  await ensureInit();
  const { to, toName, subject, body, templateId, entityType, entityId } = req.body;
  if (!to || !subject || !body) return res.status(400).json({ error: "to, subject, and body are required" });
  const id = uuidv4();
  const ts = now();
  await sqlite.execute({
    sql: "INSERT INTO sent_emails (id, to_email, to_name, subject, body, status, template_id, entity_type, entity_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    args: [id, to, toName ?? null, subject, body, "queued", templateId ?? null, entityType ?? null, entityId ?? null, ts],
  });
  const result = await sqlite.execute({ sql: "SELECT * FROM sent_emails WHERE id = ?", args: [id] });
  res.status(201).json(toCamel(result.rows[0] as any));
});

app.post("/api/send-notice", async (req, res) => {
  await ensureInit();
  const { toEmails, subject, body, templateId } = req.body;
  if (!toEmails || !Array.isArray(toEmails) || !subject || !body) return res.status(400).json({ error: "toEmails array, subject, and body are required" });
  const ts = now();
  const created: any[] = [];
  for (const email of toEmails) {
    const id = uuidv4();
    await sqlite.execute({
      sql: "INSERT INTO sent_emails (id, to_email, to_name, subject, body, status, template_id, entity_type, entity_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      args: [id, email, null, subject, body, "queued", templateId ?? null, "notice", null, ts],
    });
    created.push({ id, toEmail: email, subject, status: "queued", createdAt: ts });
  }
  res.status(201).json(created);
});

// Health check
app.get("/api/health", (_req, res) => res.json({ status: "ok", db: "turso-cloud" }));

export default app;
