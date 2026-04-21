import { db, initializeDatabase } from "./db/index.js";
import { properties, tenants, workOrders, invoices, vendors, contacts, entityNotes, calendarEvents, reminders, } from "./db/schema.js";
import { v4 as uuidv4 } from "uuid";
async function seed() {
    try {
        console.log("Initializing database...");
        await initializeDatabase();
        const now = new Date().toISOString();
        // Create vendors
        const vendorData = [
            {
                id: uuidv4(),
                name: "Mike Rodriguez",
                company: "Rodriguez Plumbing",
                email: "mike@rodriguezplumbing.com",
                phone: "+1-555-0301",
                service: "plumbing",
                rate: 85.0,
                notes: "Licensed master plumber, available 24/7 for emergencies",
                status: "active",
                createdAt: now,
                updatedAt: now,
            },
            {
                id: uuidv4(),
                name: "Sarah Chen",
                company: "Bright Spark Electric",
                email: "sarah@brightspark.com",
                phone: "+1-555-0302",
                service: "electrical",
                rate: 95.0,
                notes: "Specializes in commercial and residential electrical work",
                status: "active",
                createdAt: now,
                updatedAt: now,
            },
            {
                id: uuidv4(),
                name: "Clean Team LLC",
                company: "Clean Team LLC",
                email: "info@cleanteam.com",
                phone: "+1-555-0303",
                service: "cleaning",
                rate: 45.0,
                notes: "Deep cleaning and turnover cleaning services",
                status: "active",
                createdAt: now,
                updatedAt: now,
            },
        ];
        await db.insert(vendors).values(vendorData);
        console.log("Vendors seeded");
        // Create contacts
        const contactData = [
            {
                id: uuidv4(),
                name: "Tom Harris",
                email: "tom@insurancecorp.com",
                phone: "+1-555-0401",
                company: "InsuranceCorp",
                role: "Account Manager",
                type: "client",
                notes: "Handles property insurance policies",
                createdAt: now,
                updatedAt: now,
            },
            {
                id: uuidv4(),
                name: "Lisa Park",
                email: "lisa@cityinspections.gov",
                phone: "+1-555-0402",
                company: "City Inspections",
                role: "Inspector",
                type: "other",
                notes: "Fire and safety inspections contact",
                createdAt: now,
                updatedAt: now,
            },
            {
                id: uuidv4(),
                name: "James Wilson",
                email: "james@realtylaw.com",
                phone: "+1-555-0403",
                company: "Realty Law Group",
                role: "Attorney",
                type: "client",
                notes: "Real estate attorney for lease agreements",
                createdAt: now,
                updatedAt: now,
            },
        ];
        await db.insert(contacts).values(contactData);
        console.log("Contacts seeded");
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
        // Create work orders (tickets)
        const workOrderData = [
            {
                id: uuidv4(),
                title: "Fix broken sink in kitchen",
                propertyId: insertedProperties[0].id,
                priority: "high",
                urgency: "high",
                type: "repair",
                status: "open",
                assignedVendorId: vendorData[0].id,
                notes: "Tenant reported sink leak",
                dueDate: "2026-04-01",
                contactPhone: "+1-555-0201",
                contactEmail: "alice@example.com",
                createdAt: now,
                updatedAt: now,
            },
            {
                id: uuidv4(),
                title: "Paint exterior walls",
                propertyId: insertedProperties[1].id,
                priority: "medium",
                urgency: "low",
                type: "maintenance",
                status: "in_progress",
                assignedVendorId: null,
                notes: "Annual maintenance",
                dueDate: "2026-05-15",
                contactPhone: null,
                contactEmail: null,
                createdAt: now,
                updatedAt: now,
            },
            {
                id: uuidv4(),
                title: "HVAC inspection",
                propertyId: insertedProperties[2].id,
                priority: "low",
                urgency: "medium",
                type: "inspection",
                status: "open",
                assignedVendorId: null,
                notes: "Quarterly check",
                dueDate: "2026-04-15",
                contactPhone: null,
                contactEmail: null,
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
        // Create notes on tenants
        const notesData = [
            {
                id: uuidv4(),
                entityType: "tenant",
                entityId: insertedTenants[0].id,
                title: "Move-in condition",
                content: "Unit was in excellent condition at move-in. All appliances working. Minor scuff on living room wall noted.",
                createdAt: now,
                updatedAt: now,
            },
            {
                id: uuidv4(),
                entityType: "tenant",
                entityId: insertedTenants[1].id,
                title: "Lease renewal discussion",
                content: "Tenant expressed interest in renewing lease. Discussed potential rent increase of 3%. Follow up in May.",
                createdAt: now,
                updatedAt: now,
            },
            {
                id: uuidv4(),
                entityType: "property",
                entityId: insertedProperties[0].id,
                title: "Parking lot repair needed",
                content: "Several potholes forming in the east parking lot. Get quotes from paving companies.",
                createdAt: now,
                updatedAt: now,
            },
        ];
        await db.insert(entityNotes).values(notesData);
        console.log("Notes seeded");
        // Create calendar events
        const calendarData = [
            {
                id: uuidv4(),
                title: "Property Inspection - Downtown Apartments",
                description: "Annual fire safety inspection for all units",
                startDate: "2026-04-10T09:00:00",
                endDate: "2026-04-10T12:00:00",
                allDay: 0,
                type: "appointment",
                entityType: "property",
                entityId: insertedProperties[0].id,
                color: "#4CAF50",
                createdAt: now,
                updatedAt: now,
            },
            {
                id: uuidv4(),
                title: "Lease Renewal - Charlie Brown",
                description: "Discuss lease renewal terms and rent adjustment",
                startDate: "2026-05-01T14:00:00",
                endDate: "2026-05-01T15:00:00",
                allDay: 0,
                type: "meeting",
                entityType: "tenant",
                entityId: insertedTenants[1].id,
                color: "#2196F3",
                createdAt: now,
                updatedAt: now,
            },
            {
                id: uuidv4(),
                title: "Quarterly Tax Filing Deadline",
                description: "Q1 2026 property tax filing deadline",
                startDate: "2026-04-15",
                endDate: null,
                allDay: 1,
                type: "deadline",
                entityType: "general",
                entityId: null,
                color: "#F44336",
                createdAt: now,
                updatedAt: now,
            },
        ];
        await db.insert(calendarEvents).values(calendarData);
        console.log("Calendar events seeded");
        // Create reminders
        const reminderData = [
            {
                id: uuidv4(),
                title: "Collect rent - Downtown Apartments",
                description: "Send rent collection notices for April",
                dueDate: "2026-04-01T09:00:00",
                priority: "high",
                status: "pending",
                entityType: "property",
                entityId: insertedProperties[0].id,
                createdAt: now,
                updatedAt: now,
            },
            {
                id: uuidv4(),
                title: "Schedule HVAC maintenance",
                description: "Contact HVAC vendor for spring maintenance at Tech Plaza",
                dueDate: "2026-04-05T10:00:00",
                priority: "medium",
                status: "pending",
                entityType: "property",
                entityId: insertedProperties[2].id,
                createdAt: now,
                updatedAt: now,
            },
            {
                id: uuidv4(),
                title: "Follow up on overdue invoice",
                description: "Contact Diana Prince about overdue February rent",
                dueDate: "2026-03-28T09:00:00",
                priority: "urgent",
                status: "pending",
                entityType: "tenant",
                entityId: insertedTenants[2].id,
                createdAt: now,
                updatedAt: now,
            },
        ];
        await db.insert(reminders).values(reminderData);
        console.log("Reminders seeded");
        console.log("Database seeded successfully");
    }
    catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
}
seed();
//# sourceMappingURL=seed.js.map