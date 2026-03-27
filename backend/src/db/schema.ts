import { integer, real, text, sqliteTable } from "drizzle-orm/sqlite-core";

export const properties = sqliteTable("properties", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  type: text("type").notNull(), // "apartment", "house", "commercial"
  units: integer("units").notNull(),
  status: text("status").notNull(), // "active", "inactive", "maintenance"
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const tenants = sqliteTable("tenants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  propertyId: text("property_id").notNull(),
  unit: text("unit").notNull(),
  leaseStart: text("lease_start").notNull(),
  leaseEnd: text("lease_end").notNull(),
  rentAmount: real("rent_amount").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const workOrders = sqliteTable("work_orders", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  propertyId: text("property_id").notNull(),
  priority: text("priority").notNull(), // "low", "medium", "high", "urgent"
  urgency: text("urgency"), // "low", "medium", "high", "critical"
  type: text("type"), // "maintenance", "repair", "inspection", "complaint", "emergency", "other"
  status: text("status").notNull(), // "open", "in_progress", "completed", "cancelled"
  assignedVendorId: text("assigned_vendor_id"),
  notes: text("notes"),
  dueDate: text("due_date"),
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const invoices = sqliteTable("invoices", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  amount: real("amount").notNull(),
  dueDate: text("due_date").notNull(),
  status: text("status").notNull(), // "paid", "unpaid", "overdue"
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const vendors = sqliteTable("vendors", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  company: text("company"),
  email: text("email"),
  phone: text("phone"),
  service: text("service").notNull(), // "plumbing", "electrical", "hvac", "cleaning", "general", "landscaping", "painting", "other"
  rate: real("rate"),
  notes: text("notes"),
  status: text("status").notNull(), // "active", "inactive"
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const contacts = sqliteTable("contacts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  company: text("company"),
  role: text("role"),
  type: text("type").notNull(), // "vendor", "tenant", "client", "other"
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const entityNotes = sqliteTable("notes", {
  id: text("id").primaryKey(),
  entityType: text("entity_type").notNull(), // "tenant", "property", "vendor", "ticket"
  entityId: text("entity_id").notNull(),
  title: text("title"),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const files = sqliteTable("files", {
  id: text("id").primaryKey(),
  entityType: text("entity_type").notNull(), // "tenant", "property", "vendor", "ticket", "general"
  entityId: text("entity_id"),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  data: text("data").notNull(), // base64 encoded
  createdAt: text("created_at").notNull(),
});

export const calendarEvents = sqliteTable("calendar_events", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  allDay: integer("all_day").notNull().default(0), // 0 or 1
  type: text("type").notNull(), // "appointment", "reminder", "deadline", "meeting", "other"
  entityType: text("entity_type"), // "tenant", "property", "vendor", "ticket", "general"
  entityId: text("entity_id"),
  color: text("color"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const reminders = sqliteTable("reminders", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: text("due_date").notNull(),
  priority: text("priority").notNull(), // "low", "medium", "high", "urgent"
  status: text("status").notNull(), // "pending", "completed", "dismissed"
  entityType: text("entity_type"), // "tenant", "property", "vendor", "ticket"
  entityId: text("entity_id"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  type: text("type").notNull(), // "work_order_created", "work_order_updated", "invoice_created", "invoice_paid", "invoice_overdue", "tenant_added", "ticket_critical"
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
});

export type Property = typeof properties.$inferSelect;
export type NewProperty = typeof properties.$inferInsert;

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;

export type WorkOrder = typeof workOrders.$inferSelect;
export type NewWorkOrder = typeof workOrders.$inferInsert;

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;

export type Vendor = typeof vendors.$inferSelect;
export type NewVendor = typeof vendors.$inferInsert;

export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;

export type EntityNote = typeof entityNotes.$inferSelect;
export type NewEntityNote = typeof entityNotes.$inferInsert;

export type FileRecord = typeof files.$inferSelect;
export type NewFileRecord = typeof files.$inferInsert;

export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type NewCalendarEvent = typeof calendarEvents.$inferInsert;

export type Reminder = typeof reminders.$inferSelect;
export type NewReminder = typeof reminders.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
