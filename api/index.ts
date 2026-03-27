import express from "express";
import cors from "cors";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq, and, gte, lte, like, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import {
  properties,
  tenants,
  workOrders,
  invoices,
  vendors,
  contacts,
  entityNotes,
  files,
  calendarEvents,
  reminders,
  notifications,
} from "../backend/src/db/schema";

// Initialize Turso cloud database
const sqlite = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:./data/tps.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const db = drizzle(sqlite, {
  schema: {
    properties,
    tenants,
    workOrders,
    invoices,
    vendors,
    contacts,
    entityNotes,
    files,
    calendarEvents,
    reminders,
    notifications,
  },
});

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Ensure tables exist
const initPromise = (async () => {
  const statements = [
    `CREATE TABLE IF NOT EXISTS properties (id TEXT PRIMARY KEY, name TEXT NOT NULL, address TEXT NOT NULL, type TEXT NOT NULL, units INTEGER NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
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
})();

// Helper
const now = () => new Date().toISOString();

// ===== PROPERTIES =====
app.get("/api/properties", async (req, res) => {
  await initPromise;
  const rows = await db.select().from(properties);
  res.json(rows);
});
app.get("/api/properties/:id", async (req, res) => {
  await initPromise;
  const rows = await db.select().from(properties).where(eq(properties.id, req.params.id));
  rows.length ? res.json(rows[0]) : res.status(404).json({ error: "Not found" });
});
app.post("/api/properties", async (req, res) => {
  await initPromise;
  const id = uuidv4();
  const ts = now();
  await db.insert(properties).values({ id, ...req.body, createdAt: ts, updatedAt: ts });
  const rows = await db.select().from(properties).where(eq(properties.id, id));
  res.status(201).json(rows[0]);
});
app.put("/api/properties/:id", async (req, res) => {
  await initPromise;
  await db.update(properties).set({ ...req.body, updatedAt: now() }).where(eq(properties.id, req.params.id));
  const rows = await db.select().from(properties).where(eq(properties.id, req.params.id));
  rows.length ? res.json(rows[0]) : res.status(404).json({ error: "Not found" });
});
app.delete("/api/properties/:id", async (req, res) => {
  await initPromise;
  await db.delete(properties).where(eq(properties.id, req.params.id));
  res.json({ success: true });
});

// ===== TENANTS =====
app.get("/api/tenants", async (req, res) => {
  await initPromise;
  res.json(await db.select().from(tenants));
});
app.get("/api/tenants/:id", async (req, res) => {
  await initPromise;
  const rows = await db.select().from(tenants).where(eq(tenants.id, req.params.id));
  rows.length ? res.json(rows[0]) : res.status(404).json({ error: "Not found" });
});
app.post("/api/tenants", async (req, res) => {
  await initPromise;
  const id = uuidv4(); const ts = now();
  await db.insert(tenants).values({ id, ...req.body, createdAt: ts, updatedAt: ts });
  const rows = await db.select().from(tenants).where(eq(tenants.id, id));
  res.status(201).json(rows[0]);
});
app.put("/api/tenants/:id", async (req, res) => {
  await initPromise;
  await db.update(tenants).set({ ...req.body, updatedAt: now() }).where(eq(tenants.id, req.params.id));
  const rows = await db.select().from(tenants).where(eq(tenants.id, req.params.id));
  rows.length ? res.json(rows[0]) : res.status(404).json({ error: "Not found" });
});
app.delete("/api/tenants/:id", async (req, res) => {
  await initPromise;
  await db.delete(tenants).where(eq(tenants.id, req.params.id));
  res.json({ success: true });
});

// ===== WORK ORDERS / TICKETS =====
app.get("/api/work-orders", async (req, res) => {
  await initPromise;
  res.json(await db.select().from(workOrders));
});
app.get("/api/work-orders/:id", async (req, res) => {
  await initPromise;
  const rows = await db.select().from(workOrders).where(eq(workOrders.id, req.params.id));
  rows.length ? res.json(rows[0]) : res.status(404).json({ error: "Not found" });
});
app.post("/api/work-orders", async (req, res) => {
  await initPromise;
  const id = uuidv4(); const ts = now();
  await db.insert(workOrders).values({ id, ...req.body, createdAt: ts, updatedAt: ts });
  // Notification
  await db.insert(notifications).values({ id: uuidv4(), type: "work_order_created", title: "New Ticket", message: `Ticket created: ${req.body.title}`, isRead: false, createdAt: ts });
  const rows = await db.select().from(workOrders).where(eq(workOrders.id, id));
  res.status(201).json(rows[0]);
});
app.put("/api/work-orders/:id", async (req, res) => {
  await initPromise;
  await db.update(workOrders).set({ ...req.body, updatedAt: now() }).where(eq(workOrders.id, req.params.id));
  const rows = await db.select().from(workOrders).where(eq(workOrders.id, req.params.id));
  rows.length ? res.json(rows[0]) : res.status(404).json({ error: "Not found" });
});
app.delete("/api/work-orders/:id", async (req, res) => {
  await initPromise;
  await db.delete(workOrders).where(eq(workOrders.id, req.params.id));
  res.json({ success: true });
});

// ===== INVOICES =====
app.get("/api/invoices", async (req, res) => {
  await initPromise;
  res.json(await db.select().from(invoices));
});
app.get("/api/invoices/:id", async (req, res) => {
  await initPromise;
  const rows = await db.select().from(invoices).where(eq(invoices.id, req.params.id));
  rows.length ? res.json(rows[0]) : res.status(404).json({ error: "Not found" });
});
app.post("/api/invoices", async (req, res) => {
  await initPromise;
  const id = uuidv4(); const ts = now();
  await db.insert(invoices).values({ id, ...req.body, createdAt: ts, updatedAt: ts });
  const rows = await db.select().from(invoices).where(eq(invoices.id, id));
  res.status(201).json(rows[0]);
});
app.put("/api/invoices/:id", async (req, res) => {
  await initPromise;
  await db.update(invoices).set({ ...req.body, updatedAt: now() }).where(eq(invoices.id, req.params.id));
  const rows = await db.select().from(invoices).where(eq(invoices.id, req.params.id));
  rows.length ? res.json(rows[0]) : res.status(404).json({ error: "Not found" });
});
app.delete("/api/invoices/:id", async (req, res) => {
  await initPromise;
  await db.delete(invoices).where(eq(invoices.id, req.params.id));
  res.json({ success: true });
});

// ===== VENDORS =====
app.get("/api/vendors", async (req, res) => {
  await initPromise;
  res.json(await db.select().from(vendors));
});
app.get("/api/vendors/:id", async (req, res) => {
  await initPromise;
  const rows = await db.select().from(vendors).where(eq(vendors.id, req.params.id));
  rows.length ? res.json(rows[0]) : res.status(404).json({ error: "Not found" });
});
app.post("/api/vendors", async (req, res) => {
  await initPromise;
  const id = uuidv4(); const ts = now();
  await db.insert(vendors).values({ id, ...req.body, createdAt: ts, updatedAt: ts });
  const rows = await db.select().from(vendors).where(eq(vendors.id, id));
  res.status(201).json(rows[0]);
});
app.put("/api/vendors/:id", async (req, res) => {
  await initPromise;
  await db.update(vendors).set({ ...req.body, updatedAt: now() }).where(eq(vendors.id, req.params.id));
  const rows = await db.select().from(vendors).where(eq(vendors.id, req.params.id));
  rows.length ? res.json(rows[0]) : res.status(404).json({ error: "Not found" });
});
app.delete("/api/vendors/:id", async (req, res) => {
  await initPromise;
  await db.delete(vendors).where(eq(vendors.id, req.params.id));
  res.json({ success: true });
});

// ===== CONTACTS =====
app.get("/api/contacts", async (req, res) => {
  await initPromise;
  res.json(await db.select().from(contacts));
});
app.get("/api/contacts/:id", async (req, res) => {
  await initPromise;
  const rows = await db.select().from(contacts).where(eq(contacts.id, req.params.id));
  rows.length ? res.json(rows[0]) : res.status(404).json({ error: "Not found" });
});
app.post("/api/contacts", async (req, res) => {
  await initPromise;
  const id = uuidv4(); const ts = now();
  await db.insert(contacts).values({ id, ...req.body, createdAt: ts, updatedAt: ts });
  const rows = await db.select().from(contacts).where(eq(contacts.id, id));
  res.status(201).json(rows[0]);
});
app.put("/api/contacts/:id", async (req, res) => {
  await initPromise;
  await db.update(contacts).set({ ...req.body, updatedAt: now() }).where(eq(contacts.id, req.params.id));
  const rows = await db.select().from(contacts).where(eq(contacts.id, req.params.id));
  rows.length ? res.json(rows[0]) : res.status(404).json({ error: "Not found" });
});
app.delete("/api/contacts/:id", async (req, res) => {
  await initPromise;
  await db.delete(contacts).where(eq(contacts.id, req.params.id));
  res.json({ success: true });
});

// ===== NOTES =====
app.get("/api/notes", async (req, res) => {
  await initPromise;
  const { entityType, entityId } = req.query;
  if (entityType && entityId) {
    res.json(await db.select().from(entityNotes).where(and(eq(entityNotes.entityType, entityType as string), eq(entityNotes.entityId, entityId as string))));
  } else {
    res.json(await db.select().from(entityNotes));
  }
});
app.post("/api/notes", async (req, res) => {
  await initPromise;
  const id = uuidv4(); const ts = now();
  await db.insert(entityNotes).values({ id, ...req.body, createdAt: ts, updatedAt: ts });
  const rows = await db.select().from(entityNotes).where(eq(entityNotes.id, id));
  res.status(201).json(rows[0]);
});
app.put("/api/notes/:id", async (req, res) => {
  await initPromise;
  await db.update(entityNotes).set({ ...req.body, updatedAt: now() }).where(eq(entityNotes.id, req.params.id));
  const rows = await db.select().from(entityNotes).where(eq(entityNotes.id, req.params.id));
  rows.length ? res.json(rows[0]) : res.status(404).json({ error: "Not found" });
});
app.delete("/api/notes/:id", async (req, res) => {
  await initPromise;
  await db.delete(entityNotes).where(eq(entityNotes.id, req.params.id));
  res.json({ success: true });
});

// ===== FILES =====
app.get("/api/files", async (req, res) => {
  await initPromise;
  const { entityType, entityId } = req.query;
  // Return files WITHOUT the data field for listing
  const allFiles = entityType && entityId
    ? await db.select().from(files).where(and(eq(files.entityType, entityType as string), eq(files.entityId, entityId as string)))
    : await db.select().from(files);
  res.json(allFiles.map(({ data, ...rest }) => rest));
});
app.get("/api/files/:id", async (req, res) => {
  await initPromise;
  const rows = await db.select().from(files).where(eq(files.id, req.params.id));
  rows.length ? res.json(rows[0]) : res.status(404).json({ error: "Not found" });
});
app.post("/api/files", async (req, res) => {
  await initPromise;
  const { data, originalName, mimeType, size, entityType: et, entityId: ei } = req.body;
  if (!data || size > 5 * 1024 * 1024) return res.status(400).json({ error: "File too large or missing data (5MB max)" });
  const id = uuidv4(); const ts = now();
  await db.insert(files).values({ id, entityType: et || "general", entityId: ei || null, filename: id + "-" + (originalName || "file"), originalName: originalName || "file", mimeType: mimeType || "application/octet-stream", size, data, createdAt: ts });
  res.status(201).json({ id, originalName, mimeType, size, entityType: et, entityId: ei, createdAt: ts });
});
app.delete("/api/files/:id", async (req, res) => {
  await initPromise;
  await db.delete(files).where(eq(files.id, req.params.id));
  res.json({ success: true });
});

// ===== CALENDAR =====
app.get("/api/calendar", async (req, res) => {
  await initPromise;
  const { start, end } = req.query;
  if (start && end) {
    res.json(await db.select().from(calendarEvents).where(and(gte(calendarEvents.startDate, start as string), lte(calendarEvents.startDate, end as string))));
  } else {
    res.json(await db.select().from(calendarEvents));
  }
});
app.get("/api/calendar/:id", async (req, res) => {
  await initPromise;
  const rows = await db.select().from(calendarEvents).where(eq(calendarEvents.id, req.params.id));
  rows.length ? res.json(rows[0]) : res.status(404).json({ error: "Not found" });
});
app.post("/api/calendar", async (req, res) => {
  await initPromise;
  const id = uuidv4(); const ts = now();
  await db.insert(calendarEvents).values({ id, ...req.body, allDay: req.body.allDay ? 1 : 0, createdAt: ts, updatedAt: ts });
  const rows = await db.select().from(calendarEvents).where(eq(calendarEvents.id, id));
  res.status(201).json(rows[0]);
});
app.put("/api/calendar/:id", async (req, res) => {
  await initPromise;
  const updateData = { ...req.body, updatedAt: now() };
  if ("allDay" in updateData) updateData.allDay = updateData.allDay ? 1 : 0;
  await db.update(calendarEvents).set(updateData).where(eq(calendarEvents.id, req.params.id));
  const rows = await db.select().from(calendarEvents).where(eq(calendarEvents.id, req.params.id));
  rows.length ? res.json(rows[0]) : res.status(404).json({ error: "Not found" });
});
app.delete("/api/calendar/:id", async (req, res) => {
  await initPromise;
  await db.delete(calendarEvents).where(eq(calendarEvents.id, req.params.id));
  res.json({ success: true });
});

// ===== REMINDERS =====
app.get("/api/reminders", async (req, res) => {
  await initPromise;
  const { status } = req.query;
  if (status) {
    res.json(await db.select().from(reminders).where(eq(reminders.status, status as string)));
  } else {
    res.json(await db.select().from(reminders));
  }
});
app.get("/api/reminders/:id", async (req, res) => {
  await initPromise;
  const rows = await db.select().from(reminders).where(eq(reminders.id, req.params.id));
  rows.length ? res.json(rows[0]) : res.status(404).json({ error: "Not found" });
});
app.post("/api/reminders", async (req, res) => {
  await initPromise;
  const id = uuidv4(); const ts = now();
  await db.insert(reminders).values({ id, ...req.body, createdAt: ts, updatedAt: ts });
  const rows = await db.select().from(reminders).where(eq(reminders.id, id));
  res.status(201).json(rows[0]);
});
app.put("/api/reminders/:id", async (req, res) => {
  await initPromise;
  await db.update(reminders).set({ ...req.body, updatedAt: now() }).where(eq(reminders.id, req.params.id));
  const rows = await db.select().from(reminders).where(eq(reminders.id, req.params.id));
  rows.length ? res.json(rows[0]) : res.status(404).json({ error: "Not found" });
});
app.delete("/api/reminders/:id", async (req, res) => {
  await initPromise;
  await db.delete(reminders).where(eq(reminders.id, req.params.id));
  res.json({ success: true });
});

// ===== NOTIFICATIONS =====
app.get("/api/notifications", async (req, res) => {
  await initPromise;
  res.json(await db.select().from(notifications));
});
app.get("/api/notifications/unread", async (req, res) => {
  await initPromise;
  res.json(await db.select().from(notifications).where(eq(notifications.isRead, false)));
});
app.get("/api/notifications/unread/count", async (req, res) => {
  await initPromise;
  const unread = await db.select().from(notifications).where(eq(notifications.isRead, false));
  res.json({ count: unread.length });
});
app.put("/api/notifications/:id/read", async (req, res) => {
  await initPromise;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, req.params.id));
  res.json({ success: true });
});
app.put("/api/notifications/all/read", async (req, res) => {
  await initPromise;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.isRead, false));
  res.json({ success: true });
});

// Health check
app.get("/api/health", (req, res) => res.json({ status: "ok", db: "turso-cloud" }));

export default app;
