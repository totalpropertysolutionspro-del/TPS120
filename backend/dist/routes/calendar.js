import { Router } from "express";
import { db } from "../db/index.js";
import { calendarEvents } from "../db/schema.js";
import { eq, and, gte, lte } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
const router = Router();
// Get calendar events with optional date range filtering
// GET /api/calendar?start=2026-01-01&end=2026-12-31
router.get("/", async (req, res) => {
    try {
        const { start, end } = req.query;
        let events;
        if (start && end) {
            events = await db
                .select()
                .from(calendarEvents)
                .where(and(gte(calendarEvents.startDate, String(start)), lte(calendarEvents.startDate, String(end))))
                .all();
        }
        else if (start) {
            events = await db
                .select()
                .from(calendarEvents)
                .where(gte(calendarEvents.startDate, String(start)))
                .all();
        }
        else if (end) {
            events = await db
                .select()
                .from(calendarEvents)
                .where(lte(calendarEvents.startDate, String(end)))
                .all();
        }
        else {
            events = await db.select().from(calendarEvents).all();
        }
        res.json(events);
    }
    catch (error) {
        console.error("Error fetching calendar events:", error);
        res.status(500).json({ error: "Failed to fetch calendar events" });
    }
});
// Get single calendar event
router.get("/:id", async (req, res) => {
    try {
        const event = await db
            .select()
            .from(calendarEvents)
            .where(eq(calendarEvents.id, req.params.id))
            .get();
        if (!event) {
            return res.status(404).json({ error: "Calendar event not found" });
        }
        res.json(event);
    }
    catch (error) {
        console.error("Error fetching calendar event:", error);
        res.status(500).json({ error: "Failed to fetch calendar event" });
    }
});
// Create calendar event
router.post("/", async (req, res) => {
    try {
        const { title, description, startDate, endDate, allDay, type, entityType, entityId, color, } = req.body;
        if (!title || !startDate || !type) {
            return res
                .status(400)
                .json({ error: "Missing required fields (title, startDate, type)" });
        }
        const id = uuidv4();
        const now = new Date().toISOString();
        const newEvent = {
            id,
            title,
            description: description || null,
            startDate,
            endDate: endDate || null,
            allDay: allDay ? 1 : 0,
            type,
            entityType: entityType || null,
            entityId: entityId || null,
            color: color || null,
            createdAt: now,
            updatedAt: now,
        };
        await db.insert(calendarEvents).values(newEvent);
        res.status(201).json(newEvent);
    }
    catch (error) {
        console.error("Error creating calendar event:", error);
        res.status(500).json({ error: "Failed to create calendar event" });
    }
});
// Update calendar event
router.put("/:id", async (req, res) => {
    try {
        const { title, description, startDate, endDate, allDay, type, entityType, entityId, color, } = req.body;
        const existingEvent = await db
            .select()
            .from(calendarEvents)
            .where(eq(calendarEvents.id, req.params.id))
            .get();
        if (!existingEvent) {
            return res.status(404).json({ error: "Calendar event not found" });
        }
        const updatedEvent = {
            ...existingEvent,
            ...(title && { title }),
            ...(description !== undefined && { description }),
            ...(startDate && { startDate }),
            ...(endDate !== undefined && { endDate }),
            ...(allDay !== undefined && { allDay: allDay ? 1 : 0 }),
            ...(type && { type }),
            ...(entityType !== undefined && { entityType }),
            ...(entityId !== undefined && { entityId }),
            ...(color !== undefined && { color }),
            updatedAt: new Date().toISOString(),
        };
        await db
            .update(calendarEvents)
            .set(updatedEvent)
            .where(eq(calendarEvents.id, req.params.id))
            .run();
        res.json(updatedEvent);
    }
    catch (error) {
        console.error("Error updating calendar event:", error);
        res.status(500).json({ error: "Failed to update calendar event" });
    }
});
// Delete calendar event
router.delete("/:id", async (req, res) => {
    try {
        const existingEvent = await db
            .select()
            .from(calendarEvents)
            .where(eq(calendarEvents.id, req.params.id))
            .get();
        if (!existingEvent) {
            return res.status(404).json({ error: "Calendar event not found" });
        }
        await db
            .delete(calendarEvents)
            .where(eq(calendarEvents.id, req.params.id))
            .run();
        res.json({ message: "Calendar event deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting calendar event:", error);
        res.status(500).json({ error: "Failed to delete calendar event" });
    }
});
export default router;
//# sourceMappingURL=calendar.js.map