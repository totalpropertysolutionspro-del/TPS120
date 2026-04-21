import { Router } from "express";
import { db } from "../db/index.js";
import { entityNotes } from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
const router = Router();
// Get notes with optional entity filtering
// GET /api/notes?entityType=tenant&entityId=123
router.get("/", async (req, res) => {
    try {
        const { entityType, entityId } = req.query;
        let allNotes;
        if (entityType && entityId) {
            allNotes = await db
                .select()
                .from(entityNotes)
                .where(and(eq(entityNotes.entityType, String(entityType)), eq(entityNotes.entityId, String(entityId))))
                .all();
        }
        else if (entityType) {
            allNotes = await db
                .select()
                .from(entityNotes)
                .where(eq(entityNotes.entityType, String(entityType)))
                .all();
        }
        else {
            allNotes = await db.select().from(entityNotes).all();
        }
        res.json(allNotes);
    }
    catch (error) {
        console.error("Error fetching notes:", error);
        res.status(500).json({ error: "Failed to fetch notes" });
    }
});
// Get single note
router.get("/:id", async (req, res) => {
    try {
        const note = await db
            .select()
            .from(entityNotes)
            .where(eq(entityNotes.id, req.params.id))
            .get();
        if (!note) {
            return res.status(404).json({ error: "Note not found" });
        }
        res.json(note);
    }
    catch (error) {
        console.error("Error fetching note:", error);
        res.status(500).json({ error: "Failed to fetch note" });
    }
});
// Create note
router.post("/", async (req, res) => {
    try {
        const { entityType, entityId, title, content } = req.body;
        if (!entityType || !entityId || !content) {
            return res
                .status(400)
                .json({ error: "Missing required fields (entityType, entityId, content)" });
        }
        const id = uuidv4();
        const now = new Date().toISOString();
        const newNote = {
            id,
            entityType,
            entityId,
            title: title || null,
            content,
            createdAt: now,
            updatedAt: now,
        };
        await db.insert(entityNotes).values(newNote);
        res.status(201).json(newNote);
    }
    catch (error) {
        console.error("Error creating note:", error);
        res.status(500).json({ error: "Failed to create note" });
    }
});
// Update note
router.put("/:id", async (req, res) => {
    try {
        const { title, content } = req.body;
        const existingNote = await db
            .select()
            .from(entityNotes)
            .where(eq(entityNotes.id, req.params.id))
            .get();
        if (!existingNote) {
            return res.status(404).json({ error: "Note not found" });
        }
        const updatedNote = {
            ...existingNote,
            ...(title !== undefined && { title }),
            ...(content && { content }),
            updatedAt: new Date().toISOString(),
        };
        await db
            .update(entityNotes)
            .set(updatedNote)
            .where(eq(entityNotes.id, req.params.id))
            .run();
        res.json(updatedNote);
    }
    catch (error) {
        console.error("Error updating note:", error);
        res.status(500).json({ error: "Failed to update note" });
    }
});
// Delete note
router.delete("/:id", async (req, res) => {
    try {
        const existingNote = await db
            .select()
            .from(entityNotes)
            .where(eq(entityNotes.id, req.params.id))
            .get();
        if (!existingNote) {
            return res.status(404).json({ error: "Note not found" });
        }
        await db
            .delete(entityNotes)
            .where(eq(entityNotes.id, req.params.id))
            .run();
        res.json({ message: "Note deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting note:", error);
        res.status(500).json({ error: "Failed to delete note" });
    }
});
export default router;
//# sourceMappingURL=notes.js.map