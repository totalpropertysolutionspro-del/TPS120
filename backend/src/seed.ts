import { db, initializeDatabase } from "./db/index.js";
import {
  properties,
  tenants,
  workOrders,
  invoices,
  staff,
} from "./db/schema.js";
import { v4 as uuidv4 } from "uuid";

async function seed() {
  try {
    console.log("Initializing database...");
    await initializeDatabase();

    const now = new Date().toISOString();

    // Create staff
    const staffData = [
      {
        id: uuidv4(),
        name: "John Smith",
        role: "manager",
        phone: "+1-555-0101",
        email: "john@example.com",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        name: "Jane Doe",
        role: "maintenance",
        phone: "+1-555-0102",
        email: "jane@example.com",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        name: "Bob Johnson",
        role: "accountant",
        phone: "+1-555-0103",
        email: "bob@example.com",
        createdAt: now,
        updatedAt: now,
      },
    ];

    await db.insert(staff).values(staffData);
    console.log("Staff seeded");

    // Create properties
    const propertyData = [
      {
        id: uuidv4(),
        name: "Downtown Apartments",
        address: "123 Main St, New York, NY",
        type: "apartment",
        units: 20,
        status: "active",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        name: "Riverside Homes",
        address: "456 Oak Ave, Los Angeles, CA",
        type: "house",
        units: 5,
        status: "active",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        name: "Tech Plaza",
        address: "789 Tech St, San Francisco, CA",
        type: "commercial",
        units: 12,
        status: "active",
        createdAt: now,
        updatedAt: now,
      },
    ];

    const insertedProperties = await db
      .insert(properties)
      .values(propertyData)
      .returning();
    console.log("Properties seeded");

    // Create tenants
    const tenantData = [
      {
        id: uuidv4(),
        name: "Alice Williams",
        email: "alice@example.com",
        phone: "+1-555-0201",
        propertyId: insertedProperties[0].id,
        unit: "101",
        leaseStart: "2024-01-01",
        leaseEnd: "2026-01-01",
        rentAmount: 1500,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        name: "Charlie Brown",
        email: "charlie@example.com",
        phone: "+1-555-0202",
        propertyId: insertedProperties[0].id,
        unit: "102",
        leaseStart: "2023-06-01",
        leaseEnd: "2025-06-01",
        rentAmount: 1500,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        name: "Diana Prince",
        email: "diana@example.com",
        phone: "+1-555-0203",
        propertyId: insertedProperties[1].id,
        unit: "1",
        leaseStart: "2024-03-01",
        leaseEnd: "2026-03-01",
        rentAmount: 2500,
        createdAt: now,
        updatedAt: now,
      },
    ];

    const insertedTenants = await db
      .insert(tenants)
      .values(tenantData)
      .returning();
    console.log("Tenants seeded");

    // Create work orders
    const workOrderData = [
      {
        id: uuidv4(),
        title: "Fix broken sink in kitchen",
        propertyId: insertedProperties[0].id,
        priority: "high",
        status: "open",
        assignedStaffId: staffData[1].id,
        notes: "Tenant reported sink leak",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        title: "Paint exterior walls",
        propertyId: insertedProperties[1].id,
        priority: "medium",
        status: "in_progress",
        assignedStaffId: staffData[1].id,
        notes: "Annual maintenance",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        title: "HVAC inspection",
        propertyId: insertedProperties[2].id,
        priority: "low",
        status: "open",
        assignedStaffId: null,
        notes: "Quarterly check",
        createdAt: now,
        updatedAt: now,
      },
    ];

    await db.insert(workOrders).values(workOrderData);
    console.log("Work orders seeded");

    // Create invoices
    const invoiceData = [
      {
        id: uuidv4(),
        tenantId: insertedTenants[0].id,
        amount: 1500,
        dueDate: "2026-03-31",
        status: "paid",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        tenantId: insertedTenants[1].id,
        amount: 1500,
        dueDate: "2026-03-15",
        status: "unpaid",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        tenantId: insertedTenants[2].id,
        amount: 2500,
        dueDate: "2026-02-28",
        status: "overdue",
        createdAt: now,
        updatedAt: now,
      },
    ];

    await db.insert(invoices).values(invoiceData);
    console.log("Invoices seeded");

    console.log("✓ Database seeded successfully");
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seed();
