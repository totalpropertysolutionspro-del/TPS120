import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import { vendors } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

const router = Router();

// Get all vendors
router.get("/", async (req: Request, res: Response) => {
  try {
    const allVendors = await db.select().from(vendors).all();
    res.json(allVendors);
  } catch (error) {
    console.error("Error fetching vendors:", error);
    res.status(500).json({ error: "Failed to fetch vendors" });
  }
});

// Get single vendor
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const vendor = await db
      .select()
      .from(vendors)
      .where(eq(vendors.id, req.params.id))
      .get();

    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    res.json(vendor);
  } catch (error) {
    console.error("Error fetching vendor:", error);
    res.status(500).json({ error: "Failed to fetch vendor" });
  }
});

// Create vendor
router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, company, email, phone, service, rate, notes, status } =
      req.body;

    if (!name || !service) {
      return res.status(400).json({ error: "Missing required fields (name, service)" });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    const newVendor = {
      id,
      name,
      company: company || null,
      email: email || null,
      phone: phone || null,
      service,
      rate: rate ? parseFloat(rate) : null,
      notes: notes || null,
      status: status || "active",
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(vendors).values(newVendor);
    res.status(201).json(newVendor);
  } catch (error) {
    console.error("Error creating vendor:", error);
    res.status(500).json({ error: "Failed to create vendor" });
  }
});

// Update vendor
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { name, company, email, phone, service, rate, notes, status } =
      req.body;

    const existingVendor = await db
      .select()
      .from(vendors)
      .where(eq(vendors.id, req.params.id))
      .get();

    if (!existingVendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    const updatedVendor = {
      ...existingVendor,
      ...(name && { name }),
      ...(company !== undefined && { company }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
      ...(service && { service }),
      ...(rate !== undefined && { rate: rate ? parseFloat(rate) : null }),
      ...(notes !== undefined && { notes }),
      ...(status && { status }),
      updatedAt: new Date().toISOString(),
    };

    await db
      .update(vendors)
      .set(updatedVendor)
      .where(eq(vendors.id, req.params.id))
      .run();

    res.json(updatedVendor);
  } catch (error) {
    console.error("Error updating vendor:", error);
    res.status(500).json({ error: "Failed to update vendor" });
  }
});

// Delete vendor
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const existingVendor = await db
      .select()
      .from(vendors)
      .where(eq(vendors.id, req.params.id))
      .get();

    if (!existingVendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    await db
      .delete(vendors)
      .where(eq(vendors.id, req.params.id))
      .run();

    res.json({ message: "Vendor deleted successfully" });
  } catch (error) {
    console.error("Error deleting vendor:", error);
    res.status(500).json({ error: "Failed to delete vendor" });
  }
});

export default router;
