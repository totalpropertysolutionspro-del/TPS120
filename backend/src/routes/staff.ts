import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import { staff } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  try {
    const all = await db.select().from(staff).all();
    res.json(all);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch staff" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, role, phone, email, payRate } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });
    const member = { id: uuidv4(), name, role: role || null, phone: phone || null, email: email || null, payRate: payRate ? parseFloat(payRate) : null, active: 1 };
    await db.insert(staff).values(member);
    res.status(201).json(member);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create staff member" });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  try {
    const existing = await db.select().from(staff).where(eq(staff.id, req.params.id)).get();
    if (!existing) return res.status(404).json({ error: "Staff member not found" });
    const { name, role, phone, email, payRate, active } = req.body;
    const updated = { ...existing, ...(name && { name }), ...(role !== undefined && { role }), ...(phone !== undefined && { phone }), ...(email !== undefined && { email }), ...(payRate !== undefined && { payRate: payRate ? parseFloat(payRate) : null }), ...(active !== undefined && { active: active ? 1 : 0 }) };
    await db.update(staff).set(updated).where(eq(staff.id, req.params.id)).run();
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update staff member" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const existing = await db.select().from(staff).where(eq(staff.id, req.params.id)).get();
    if (!existing) return res.status(404).json({ error: "Staff member not found" });
    await db.delete(staff).where(eq(staff.id, req.params.id)).run();
    res.json({ message: "Staff member deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete staff member" });
  }
});

export default router;
