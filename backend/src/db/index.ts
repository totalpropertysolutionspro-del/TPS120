import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema.js";
import { writeFileSync } from "fs";
import { mkdir } from "fs/promises";

// Use Turso cloud database for PERMANENT data storage
// Falls back to local SQLite for development if no cloud URL set
const dbUrl = process.env.TURSO_DATABASE_URL || "file:./data/tps.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!process.env.TURSO_DATABASE_URL) {
  // Local dev fallback - ensure data directory exists
  await mkdir("./data", { recursive: true });
  console.log("Using LOCAL SQLite database (data will not persist on Vercel)");
} else {
  console.log("Connected to Turso cloud database (data is PERMANENT)");
}

const sqlite = createClient({
  url: dbUrl,
  authToken: authToken,
});

export const db = drizzle(sqlite, { schema });

// Auto-backup database to JSON on startup
export async function backupDatabase() {
  const backupPath = "backup.json";

  try {
    const [properties, tenants, workOrders, invoices, vendors, contacts, entityNotes, calendarEvents, reminders, notifications] = await Promise.all([
      db.select().from(schema.properties),
      db.select().from(schema.tenants),
      db.select().from(schema.workOrders),
      db.select().from(schema.invoices),
      db.select().from(schema.vendors),
      db.select().from(schema.contacts),
      db.select().from(schema.entityNotes),
      db.select().from(schema.calendarEvents),
      db.select().from(schema.reminders),
      db.select().from(schema.notifications),
    ]);

    const backup = {
      timestamp: new Date().toISOString(),
      properties,
      tenants,
      workOrders,
      invoices,
      vendors,
      contacts,
      notes: entityNotes,
      calendarEvents,
      reminders,
      notifications,
    };

    writeFileSync(backupPath, JSON.stringify(backup, null, 2));
    console.log("Database backed up to backup.json");
  } catch (error) {
    console.error("Backup failed:", error);
  }
}

// Initialize database tables - ALWAYS runs CREATE TABLE IF NOT EXISTS
// This ensures tables exist in Turso cloud on first deploy
export async function initializeDatabase() {
  try {
    console.log("Ensuring all tables exist...");

    // Create tables using batch operations
    const statements = [
      `CREATE TABLE IF NOT EXISTS properties (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        type TEXT NOT NULL,
        units INTEGER NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS tenants (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        property_id TEXT NOT NULL,
        unit TEXT NOT NULL,
        lease_start TEXT NOT NULL,
        lease_end TEXT NOT NULL,
        rent_amount REAL NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS work_orders (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        property_id TEXT NOT NULL,
        priority TEXT NOT NULL,
        urgency TEXT,
        type TEXT,
        status TEXT NOT NULL,
        assigned_vendor_id TEXT,
        notes TEXT,
        due_date TEXT,
        contact_phone TEXT,
        contact_email TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        amount REAL NOT NULL,
        due_date TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS vendors (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        company TEXT,
        email TEXT,
        phone TEXT,
        service TEXT NOT NULL,
        rate REAL,
        notes TEXT,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS contacts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        company TEXT,
        role TEXT,
        type TEXT NOT NULL,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        title TEXT,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS files (
        id TEXT PRIMARY KEY,
        entity_type TEXT NOT NULL,
        entity_id TEXT,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size INTEGER NOT NULL,
        data TEXT NOT NULL,
        created_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS calendar_events (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        start_date TEXT NOT NULL,
        end_date TEXT,
        all_day INTEGER NOT NULL DEFAULT 0,
        type TEXT NOT NULL,
        entity_type TEXT,
        entity_id TEXT,
        color TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS reminders (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        due_date TEXT NOT NULL,
        priority TEXT NOT NULL,
        status TEXT NOT NULL,
        entity_type TEXT,
        entity_id TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      )`
    ];

    for (const statement of statements) {
      await sqlite.execute(statement);
    }

    console.log("All tables verified/created successfully");
  } catch (error) {
    console.error("Database initialization failed:", error);
    throw error;
  }
}

export { schema };
