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
  status: text("status").notNull(), // "open", "in_progress", "completed", "cancelled"
  assignedStaffId: text("assigned_staff_id"),
  notes: text("notes"),
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

export const staff = sqliteTable("staff", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(), // "manager", "maintenance", "accountant"
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  type: text("type").notNull(), // "work_order_created", "work_order_updated", "invoice_created", "invoice_paid", "invoice_overdue", "tenant_added"
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

export type Staff = typeof staff.$inferSelect;
export type NewStaff = typeof staff.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
