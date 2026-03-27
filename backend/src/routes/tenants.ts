import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import { tenants } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { createNotification } from "../services/notification.js";

const router = Router();

// Get all tenants
router.get("/", async (req: Request, res: Response) => {
  try {
    const allTenants = await db.select().from(tenants).all();
    res.json(allTenants);
  } catch (error) {
    console.error("Error fetching tenants:", error);
    res.status(500).json({ error: "Failed to fetch tenants" });
  }
});

// Get single tenant
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const tenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, req.params.id))
      .get();

    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    res.json(tenant);
  } catch (error) {
    console.error("Error fetching tenant:", error);
    res.status(500).json({ error: "Failed to fetch tenant" });
  }
});

// Create tenant
router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      phone,
      propertyId,
      unit,
      leaseStart,
      leaseEnd,
      rentAmount,
    } = req.body;

    if (
      !name ||
      !email ||
      !phone ||
      !propertyId ||
      !unit ||
      !leaseStart ||
      !leaseEnd ||
      !rentAmount
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    const newTenant = {
      id,
      name,
      email,
      phone,
      propertyId,
      unit,
      leaseStart,
      leaseEnd,
      rentAmount: parseFloat(rentAmount),
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(tenants).values(newTenant);

    // Create notification
    await createNotification({
      type: "tenant_added",
      title: "New Tenant Added",
      message: `${name} has been added as a new tenant in unit ${unit}`,
      shouldSendEmail: true,
      email,
    });

    res.status(201).json(newTenant);
  } catch (error) {
    console.error("Error creating tenant:", error);
    res.status(500).json({ error: "Failed to create tenant" });
  }
});

// Update tenant
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      phone,
      propertyId,
      unit,
      leaseStart,
      leaseEnd,
      rentAmount,
    } = req.body;

    const existingTenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, req.params.id))
      .get();

    if (!existingTenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    const updatedTenant = {
      ...existingTenant,
      ...(name && { name }),
      ...(email && { email }),
      ...(phone && { phone }),
      ...(propertyId && { propertyId }),
      ...(unit && { unit }),
      ...(leaseStart && { leaseStart }),
      ...(leaseEnd && { leaseEnd }),
      ...(rentAmount && { rentAmount: parseFloat(rentAmount) }),
      updatedAt: new Date().toISOString(),
    };

    await db
      .update(tenants)
      .set(updatedTenant)
      .where(eq(tenants.id, req.params.id))
      .run();

    res.json(updatedTenant);
  } catch (error) {
    console.error("Error updating tenant:", error);
    res.status(500).json({ error: "Failed to update tenant" });
  }
});

// Delete tenant
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const existingTenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, req.params.id))
      .get();

    if (!existingTenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    await db
      .delete(tenants)
      .where(eq(tenants.id, req.params.id))
      .run();

    res.json({ message: "Tenant deleted successfully" });
  } catch (error) {
    console.error("Error deleting tenant:", error);
    res.status(500).json({ error: "Failed to delete tenant" });
  }
});

export default router;
