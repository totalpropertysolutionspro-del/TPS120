import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import { staff } from "../db/schema.js";
import { v4 as uuidv4 } from "uuid";

const router = Router();

// Get all staff
router.get("/", async (req: Request, res: Response) => {
  try {
    const allStaff = await db.select().from(staff).all();
    res.json(allStaff);
  } catch (error) {
    console.error("Error fetching staff:", error);
    res.status(500).json({ error: "Failed to fetch staff" });
  }
});

// Get single staff member
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const member = await db
      .select()
      .from(staff)
      .where((s) => s.id === req.params.id)
      .get();

    if (!member) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    res.json(member);
  } catch (error) {
    console.error("Error fetching staff member:", error);
    res.status(500).json({ error: "Failed to fetch staff member" });
  }
});

// Create staff member
router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, role, phone, email } = req.body;

    if (!name || !role || !phone || !email) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    const newStaff = {
      id,
      name,
      role,
      phone,
      email,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(staff).values(newStaff);
    res.status(201).json(newStaff);
  } catch (error) {
    console.error("Error creating staff member:", error);
    res.status(500).json({ error: "Failed to create staff member" });
  }
});

// Update staff member
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { name, role, phone, email } = req.body;

    const existingMember = await db
      .select()
      .from(staff)
      .where((s) => s.id === req.params.id)
      .get();

    if (!existingMember) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    const updatedMember = {
      ...existingMember,
      ...(name && { name }),
      ...(role && { role }),
      ...(phone && { phone }),
      ...(email && { email }),
      updatedAt: new Date().toISOString(),
    };

    await db
      .update(staff)
      .set(updatedMember)
      .where((s) => s.id === req.params.id)
      .run();

    res.json(updatedMember);
  } catch (error) {
    console.error("Error updating staff member:", error);
    res.status(500).json({ error: "Failed to update staff member" });
  }
});

// Delete staff member
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const existingMember = await db
      .select()
      .from(staff)
      .where((s) => s.id === req.params.id)
      .get();

    if (!existingMember) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    await db
      .delete(staff)
      .where((s) => s.id === req.params.id)
      .run();

    res.json({ message: "Staff member deleted successfully" });
  } catch (error) {
    console.error("Error deleting staff member:", error);
    res.status(500).json({ error: "Failed to delete staff member" });
  }
});

export default router;
