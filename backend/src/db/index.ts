import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.js";
import { writeFileSync } from "fs";

const dbPath = "property_manager.db";
const sqlite = new Database(dbPath);

export const db = drizzle(sqlite, { schema });

// Auto-backup database to JSON on startup
export function backupDatabase() {
  const backupPath = "backup.json";

  try {
    const backup = {
      timestamp: new Date().toISOString(),
      properties: db.select().from(schema.properties).all(),
      tenants: db.select().from(schema.tenants).all(),
      workOrders: db.select().from(schema.workOrders).all(),
      invoices: db.select().from(schema.invoices).all(),
      staff: db.select().from(schema.staff).all(),
      notifications: db.select().from(schema.notifications).all(),
    };

    writeFileSync(backupPath, JSON.stringify(backup, null, 2));
    console.log("Database backed up to backup.json");
  } catch (error) {
    console.error("Backup failed:", error);
  }
}

// Initialize database tables
export async function initializeDatabase() {
  try {
    // Create tables by running migrations (Drizzle will create them if they don't exist)
    db.select().from(schema.properties).all();
    console.log("Database initialized successfully");
  } catch (error) {
    console.log("Creating tables...");

    // Create tables
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS properties (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        type TEXT NOT NULL,
        units INTEGER NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS tenants (
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
      );

      CREATE TABLE IF NOT EXISTS work_orders (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        property_id TEXT NOT NULL,
        priority TEXT NOT NULL,
        status TEXT NOT NULL,
        assigned_staff_id TEXT,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        amount REAL NOT NULL,
        due_date TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS staff (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );
    `);

    console.log("Tables created successfully");
  }
}

export { schema };
