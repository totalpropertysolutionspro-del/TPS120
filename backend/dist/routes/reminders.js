import { Router } from "express";
import { db } from "../db/index.js";
import { reminders } from "../db/schema.js";
import { eq, and, gte } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
const router = Router();
// Get reminders with optional status filtering
// GET /api/reminders?status=pending  (get upcoming/pending)
// GET /api/reminders?upcoming=true   (get pending reminders due in the future)
router.get("/", async (req, res) => {
    try {
        const { status, upcoming } = req.query;
        let allReminders;
        if (upcoming === "true") {
            const now = new Date().toISOString();
            allReminders = await db
                .select()
                .from(reminders)
                .where(and(eq(reminders.status, "pending"), gte(reminders.dueDate, now)))
                .all();
        }
        else if (status) {
            allReminders = await db
                .select()
                .from(reminders)
                .where(eq(reminders.status, String(status)))
                .all();
        }
        else {
            allReminders = await db.select().from(reminders).all();
        }
        res.json(allReminders);
    }
    catch (error) {
        console.error("Error fetching reminders:", error);
        res.status(500).json({ error: "Failed to fetch reminders" });
    }
});
// Get single reminder
router.get("/:id", async (req, res) => {
    try {
        const reminder = await db
            .select()
            .from(reminders)
            .where(eq(reminders.id, req.params.id))
            .get();
        if (!reminder) {
            return res.status(404).json({ error: "Reminder not found" });
        }
        res.json(reminder);
    }
    catch (error) {
        console.error("Error fetching reminder:", error);
        res.status(500).json({ error: "Failed to fetch reminder" });
    }
});
// Create reminder
router.post("/", async (req, res) => {
    try {
        const { title, description, dueDate, priority, status, entityType, entityId, } = req.body;
        if (!title || !dueDate || !priority) {
            return res
                .status(400)
                .json({ error: "Missing required fields (title, dueDate, priority)" });
        }
        const id = uuidv4();
        const now = new Date().toISOString();
        const newReminder = {
            id,
            title,
            description: description || null,
            dueDate,
            priority,
            status: status || "pending",
            entityType: entityType || null,
            entityId: entityId || null,
            createdAt: now,
            updatedAt: now,
        };
        await db.insert(reminders).values(newReminder);
        res.status(201).json(newReminder);
    }
    catch (error) {
        console.error("Error creating reminder:", error);
        res.status(500).json({ error: "Failed to create reminder" });
    }
});
// Update reminder
router.put("/:id", async (req, res) => {
    try {
        const { title, description, dueDate, priority, status, entityType, entityId, } = req.body;
        const existingReminder = await db
            .select()
            .from(reminders)
            .where(eq(reminders.id, req.params.id))
            .get();
        if (!existingReminder) {
            return res.status(404).json({ error: "Reminder not found" });
        }
        const updatedReminder = {
            ...existingReminder,
            ...(title && { title }),
            ...(description !== undefined && { description }),
            ...(dueDate && { dueDate }),
            ...(priority && { priority }),
            ...(status && { status }),
            ...(entityType !== undefined && { entityType }),
            ...(entityId !== undefined && { entityId }),
            updatedAt: new Date().toISOString(),
        };
        await db
            .update(reminders)
            .set(updatedReminder)
            .where(eq(reminders.id, req.params.id))
            .run();
        res.json(updatedReminder);
    }
    catch (error) {
        console.error("Error updating reminder:", error);
        res.status(500).json({ error: "Failed to update reminder" });
    }
});
// Delete reminder
router.delete("/:id", async (req, res) => {
    try {
        const existingReminder = await db
            .select()
            .from(reminders)
            .where(eq(reminders.id, req.params.id))
            .get();
        if (!existingReminder) {
            return res.status(404).json({ error: "Reminder not found" });
        }
        await db
            .delete(reminders)
            .where(eq(reminders.id, req.params.id))
            .run();
        res.json({ message: "Reminder deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting reminder:", error);
        res.status(500).json({ error: "Failed to delete reminder" });
    }
});
export default router;
//# sourceMappingURL=reminders.js.map