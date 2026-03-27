import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import { properties } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

const router = Router();

// Get all properties
router.get("/", async (req: Request, res: Response) => {
  try {
    const allProperties = await db.select().from(properties).all();
    res.json(allProperties);
  } catch (error) {
    console.error("Error fetching properties:", error);
    res.status(500).json({ error: "Failed to fetch properties" });
  }
});

// Get single property
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const property = await db
      .select()
      .from(properties)
      .where(eq(properties.id, req.params.id))
      .get();

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    res.json(property);
  } catch (error) {
    console.error("Error fetching property:", error);
    res.status(500).json({ error: "Failed to fetch property" });
  }
});

// Create property
router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, address, type, units, status } = req.body;

    if (!name || !address || !type || !units) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    const newProperty = {
      id,
      name,
      address,
      type,
      units: parseInt(units),
      status: status || "active",
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(properties).values(newProperty);
    res.status(201).json(newProperty);
  } catch (error) {
    console.error("Error creating property:", error);
    res.status(500).json({ error: "Failed to create property" });
  }
});

// Update property
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { name, address, type, units, status } = req.body;

    const existingProperty = await db
      .select()
      .from(properties)
      .where(eq(properties.id, req.params.id))
      .get();

    if (!existingProperty) {
      return res.status(404).json({ error: "Property not found" });
    }

    const updatedProperty = {
      ...existingProperty,
      ...(name && { name }),
      ...(address && { address }),
      ...(type && { type }),
      ...(units && { units: parseInt(units) }),
      ...(status && { status }),
      updatedAt: new Date().toISOString(),
    };

    await db
      .update(properties)
      .set(updatedProperty)
      .where(eq(properties.id, req.params.id))
      .run();

    res.json(updatedProperty);
  } catch (error) {
    console.error("Error updating property:", error);
    res.status(500).json({ error: "Failed to update property" });
  }
});

// Delete property
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const existingProperty = await db
      .select()
      .from(properties)
      .where(eq(properties.id, req.params.id))
      .get();

    if (!existingProperty) {
      return res.status(404).json({ error: "Property not found" });
    }

    await db
      .delete(properties)
      .where(eq(properties.id, req.params.id))
      .run();

    res.json({ message: "Property deleted successfully" });
  } catch (error) {
    console.error("Error deleting property:", error);
    res.status(500).json({ error: "Failed to delete property" });
  }
});

export default router;
