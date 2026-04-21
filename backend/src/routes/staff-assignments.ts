import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import { staffAssignments, staff, properties } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const { propertyId, staffId, date } = req.query as Record<string, string>;

    let allAssignments = await db.select().from(staffAssignments).all();

    if (propertyId) allAssignments = allAssignments.filter(a => a.propertyId === propertyId);
    if (staffId) allAssignments = allAssignments.filter(a => a.staffId === staffId);
    if (date) allAssignments = allAssignments.filter(a => a.date === date);

    // Enrich with staff name and property name
    const [allStaff, allProperties] = await Promise.all([
      db.select().from(staff).all(),
      db.select().from(properties).all(),
    ]);

    const staffMap = Object.fromEntries(allStaff.map(s => [s.id, s]));
    const propMap = Object.fromEntries(allProperties.map(p => [p.id, p]));

    const enriched = allAssignments.map(a => ({
      ...a,
      staffName: a.staffId ? staffMap[a.staffId]?.name || null : null,
      propertyName: a.propertyId ? propMap[a.propertyId]?.name || null : null,
    }));

    res.json(enriched);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch staff assignments" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const { propertyId, staffId, date, hoursWorked, payRate, notes } = req.body;
    if (!date) return res.status(400).json({ error: "date is required" });
    const assignment = {
      id: uuidv4(),
      propertyId: propertyId || null,
      staffId: staffId || null,
      date,
      hoursWorked: hoursWorked ? parseFloat(hoursWorked) : null,
      payRate: payRate ? parseFloat(payRate) : null,
      notes: notes || null,
      createdAt: new Date().toISOString(),
    };
    await db.insert(staffAssignments).values(assignment);
    res.status(201).json(assignment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create assignment" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const existing = await db.select().from(staffAssignments).where(eq(staffAssignments.id, req.params.id)).get();
    if (!existing) return res.status(404).json({ error: "Assignment not found" });
    await db.delete(staffAssignments).where(eq(staffAssignments.id, req.params.id)).run();
    res.json({ message: "Assignment deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete assignment" });
  }
});

export default router;
