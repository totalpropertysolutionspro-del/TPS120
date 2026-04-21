import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import { properties, tenants, workOrders, clients, files, staffAssignments } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  try {
    const allProperties = await db.select().from(properties).all();
    res.json(allProperties);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch properties" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const property = await db.select().from(properties).where(eq(properties.id, req.params.id)).get();
    if (!property) return res.status(404).json({ error: "Property not found" });

    const [client, propertyTenants, propertyWorkOrders, propertyFiles, propertyAssignments] = await Promise.all([
      property.clientId ? db.select().from(clients).where(eq(clients.id, property.clientId)).get() : Promise.resolve(null),
      db.select().from(tenants).where(eq(tenants.propertyId, req.params.id)).all(),
      db.select().from(workOrders).where(eq(workOrders.propertyId, req.params.id)).all(),
      db.select({ id: files.id, originalName: files.originalName, mimeType: files.mimeType, size: files.size, createdAt: files.createdAt, entityType: files.entityType, entityId: files.entityId, filename: files.filename }).from(files).where(eq(files.entityId, req.params.id)).all(),
      db.select().from(staffAssignments).where(eq(staffAssignments.propertyId, req.params.id)).all(),
    ]);

    res.json({ ...property, client, tenants: propertyTenants, workOrders: propertyWorkOrders, files: propertyFiles, staffAssignments: propertyAssignments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch property" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, address, type, units, status, contactName, email, phone, clientId, propertyType, notes } = req.body;
    if (!name || !address || !type || !units) return res.status(400).json({ error: "Missing required fields" });
    const now = new Date().toISOString();
    const newProperty = { id: uuidv4(), name, address, type, units: parseInt(units), status: status || "active", contactName: contactName || null, email: email || null, phone: phone || null, clientId: clientId || null, propertyType: propertyType || null, notes: notes || null, createdAt: now, updatedAt: now };
    await db.insert(properties).values(newProperty);
    res.status(201).json(newProperty);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create property" });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  try {
    const existing = await db.select().from(properties).where(eq(properties.id, req.params.id)).get();
    if (!existing) return res.status(404).json({ error: "Property not found" });
    const { name, address, type, units, status, contactName, email, phone, clientId, propertyType, notes } = req.body;
    const updated = {
      ...existing,
      ...(name && { name }),
      ...(address && { address }),
      ...(type && { type }),
      ...(units && { units: parseInt(units) }),
      ...(status && { status }),
      ...(contactName !== undefined && { contactName }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
      ...(clientId !== undefined && { clientId }),
      ...(propertyType !== undefined && { propertyType }),
      ...(notes !== undefined && { notes }),
      updatedAt: new Date().toISOString(),
    };
    await db.update(properties).set(updated).where(eq(properties.id, req.params.id)).run();
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update property" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const existing = await db.select().from(properties).where(eq(properties.id, req.params.id)).get();
    if (!existing) return res.status(404).json({ error: "Property not found" });
    await db.delete(properties).where(eq(properties.id, req.params.id)).run();
    res.json({ message: "Property deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete property" });
  }
});

export default router;
