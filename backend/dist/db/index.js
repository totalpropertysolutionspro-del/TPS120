import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema.js";
import { writeFileSync } from "fs";
import { mkdir } from "fs/promises";
const dbUrl = process.env.TURSO_DATABASE_URL || "file:./data/tps.db";
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!process.env.TURSO_DATABASE_URL) {
    await mkdir("./data", { recursive: true });
    console.log("Using LOCAL SQLite database");
}
else {
    console.log("Connected to Turso cloud database");
}
const sqlite = createClient({ url: dbUrl, authToken });
export const db = drizzle(sqlite, { schema });
export async function backupDatabase() {
    try {
        const [properties, tenants, workOrders, invoices, vendors, contacts, entityNotes, calendarEvents, reminders, notifications, clients, staff, staffAssignments, expenses] = await Promise.all([
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
            db.select().from(schema.clients),
            db.select().from(schema.staff),
            db.select().from(schema.staffAssignments),
            db.select().from(schema.expenses),
        ]);
        writeFileSync("backup.json", JSON.stringify({ timestamp: new Date().toISOString(), properties, tenants, workOrders, invoices, vendors, contacts, notes: entityNotes, calendarEvents, reminders, notifications, clients, staff, staffAssignments, expenses }, null, 2));
        console.log("Database backed up to backup.json");
    }
    catch (error) {
        console.error("Backup failed:", error);
    }
}
async function tryAlter(sql) {
    try {
        await sqlite.execute(sql);
    }
    catch (_) { /* column already exists */ }
}
async function seedClients() {
    try {
        const result = await sqlite.execute("SELECT COUNT(*) as cnt FROM clients");
        const count = Number(result.rows[0][0]);
        if (count > 0)
            return;
        console.log("Seeding clients...");
        const now = new Date().toISOString();
        const clientList = [
            { id: "c1-rpm", name: "Real Property Management", type: "management_company" },
            { id: "c2-wjw", name: "WJW Management", type: "management_company" },
            { id: "c3-fl", name: "First Light", type: "management_company" },
            { id: "c4-sonoco", name: "Sonoco Products", type: "direct" },
            { id: "c5-blizzard", name: "Blizzard Albany", type: "direct" },
            { id: "c6-crunch", name: "Crunch Fitness Troy", type: "direct" },
        ];
        for (const c of clientList) {
            await sqlite.execute({
                sql: "INSERT INTO clients (id, name, type, created_at) VALUES (?, ?, ?, ?)",
                args: [c.id, c.name, c.type, now],
            });
        }
        // Link properties to clients by name pattern + set propertyType
        const linkMap = [
            { pattern: "%120 Hoosick%", clientId: "c1-rpm", propertyType: "residential" },
            { pattern: "%Patten%", clientId: "c1-rpm", propertyType: "residential" },
            { pattern: "%Quail%", clientId: "c2-wjw", propertyType: "residential" },
            { pattern: "%Fourth%", clientId: "c2-wjw", propertyType: "residential" },
            { pattern: "%348%", clientId: "c2-wjw", propertyType: "residential" },
            { pattern: "%Blizzard%", clientId: "c5-blizzard", propertyType: "commercial" },
            { pattern: "%Crunch%", clientId: "c6-crunch", propertyType: "commercial" },
            { pattern: "%Sonoco%", clientId: "c4-sonoco", propertyType: "commercial" },
        ];
        for (const { pattern, clientId, propertyType } of linkMap) {
            await sqlite.execute({
                sql: "UPDATE properties SET client_id = ?, property_type = ? WHERE name LIKE ? AND (client_id IS NULL OR client_id = '')",
                args: [clientId, propertyType, pattern],
            });
        }
        console.log("Clients seeded successfully");
    }
    catch (error) {
        console.error("Seed failed:", error);
    }
}
export async function initializeDatabase() {
    try {
        console.log("Ensuring all tables exist...");
        const statements = [
            `CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        contact_name TEXT,
        contact_email TEXT,
        contact_phone TEXT,
        notes TEXT,
        created_at TEXT
      )`,
            `CREATE TABLE IF NOT EXISTS staff (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT,
        phone TEXT,
        email TEXT,
        pay_rate REAL,
        active INTEGER DEFAULT 1
      )`,
            `CREATE TABLE IF NOT EXISTS staff_assignments (
        id TEXT PRIMARY KEY,
        property_id TEXT,
        staff_id TEXT,
        date TEXT NOT NULL,
        hours_worked REAL,
        pay_rate REAL,
        notes TEXT,
        created_at TEXT
      )`,
            `CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        work_order_id TEXT,
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        created_at TEXT
      )`,
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
      )`,
            `CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        recipients TEXT NOT NULL,
        subject TEXT,
        body TEXT NOT NULL,
        sent_at TEXT,
        sent_by TEXT,
        property_id TEXT,
        property_name TEXT,
        status TEXT DEFAULT 'sent'
      )`,
        ];
        for (const sql of statements) {
            await sqlite.execute(sql);
        }
        // Migrate: add new columns to existing properties table (safe — ignore if already exists)
        await tryAlter("ALTER TABLE properties ADD COLUMN contact_name TEXT");
        await tryAlter("ALTER TABLE properties ADD COLUMN email TEXT");
        await tryAlter("ALTER TABLE properties ADD COLUMN phone TEXT");
        await tryAlter("ALTER TABLE properties ADD COLUMN client_id TEXT");
        await tryAlter("ALTER TABLE properties ADD COLUMN property_type TEXT DEFAULT 'residential'");
        await tryAlter("ALTER TABLE properties ADD COLUMN notes TEXT");
        await tryAlter("ALTER TABLE work_orders ADD COLUMN price REAL");
        await tryAlter("ALTER TABLE work_orders ADD COLUMN paid INTEGER DEFAULT 0");
        await tryAlter("ALTER TABLE work_orders ADD COLUMN paid_at TEXT");
        console.log("All tables verified/created successfully");
        await seedClients();
    }
    catch (error) {
        console.error("Database initialization failed:", error);
        throw error;
    }
}
export { schema };
//# sourceMappingURL=index.js.map