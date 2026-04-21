import { Router } from "express";
import { db } from "../db/index.js";
import { files } from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
const router = Router();
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
// List files by entity
// GET /api/files?entityType=tenant&entityId=123
router.get("/", async (req, res) => {
    try {
        const { entityType, entityId } = req.query;
        let allFiles;
        if (entityType && entityId) {
            allFiles = await db
                .select({
                id: files.id,
                entityType: files.entityType,
                entityId: files.entityId,
                filename: files.filename,
                originalName: files.originalName,
                mimeType: files.mimeType,
                size: files.size,
                createdAt: files.createdAt,
            })
                .from(files)
                .where(and(eq(files.entityType, String(entityType)), eq(files.entityId, String(entityId))))
                .all();
        }
        else if (entityType) {
            allFiles = await db
                .select({
                id: files.id,
                entityType: files.entityType,
                entityId: files.entityId,
                filename: files.filename,
                originalName: files.originalName,
                mimeType: files.mimeType,
                size: files.size,
                createdAt: files.createdAt,
            })
                .from(files)
                .where(eq(files.entityType, String(entityType)))
                .all();
        }
        else {
            allFiles = await db
                .select({
                id: files.id,
                entityType: files.entityType,
                entityId: files.entityId,
                filename: files.filename,
                originalName: files.originalName,
                mimeType: files.mimeType,
                size: files.size,
                createdAt: files.createdAt,
            })
                .from(files)
                .all();
        }
        res.json(allFiles);
    }
    catch (error) {
        console.error("Error fetching files:", error);
        res.status(500).json({ error: "Failed to fetch files" });
    }
});
// Download / get file with data
router.get("/:id", async (req, res) => {
    try {
        const file = await db
            .select()
            .from(files)
            .where(eq(files.id, req.params.id))
            .get();
        if (!file) {
            return res.status(404).json({ error: "File not found" });
        }
        res.json(file);
    }
    catch (error) {
        console.error("Error fetching file:", error);
        res.status(500).json({ error: "Failed to fetch file" });
    }
});
// Upload file (JSON body with base64 data)
router.post("/", async (req, res) => {
    try {
        const { entityType, entityId, originalName, mimeType, data } = req.body;
        if (!entityType || !originalName || !mimeType || !data) {
            return res.status(400).json({
                error: "Missing required fields (entityType, originalName, mimeType, data)",
            });
        }
        // Calculate size from base64
        const sizeInBytes = Math.ceil((data.length * 3) / 4);
        if (sizeInBytes > MAX_FILE_SIZE) {
            return res.status(400).json({
                error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
            });
        }
        const id = uuidv4();
        const now = new Date().toISOString();
        const filename = `${id}-${originalName}`;
        const newFile = {
            id,
            entityType,
            entityId: entityId || null,
            filename,
            originalName,
            mimeType,
            size: sizeInBytes,
            data,
            createdAt: now,
        };
        await db.insert(files).values(newFile);
        // Return without the data field for the response
        const { data: _, ...fileWithoutData } = newFile;
        res.status(201).json(fileWithoutData);
    }
    catch (error) {
        console.error("Error uploading file:", error);
        res.status(500).json({ error: "Failed to upload file" });
    }
});
// Delete file
router.delete("/:id", async (req, res) => {
    try {
        const existingFile = await db
            .select({
            id: files.id,
        })
            .from(files)
            .where(eq(files.id, req.params.id))
            .get();
        if (!existingFile) {
            return res.status(404).json({ error: "File not found" });
        }
        await db
            .delete(files)
            .where(eq(files.id, req.params.id))
            .run();
        res.json({ message: "File deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting file:", error);
        res.status(500).json({ error: "Failed to delete file" });
    }
});
export default router;
//# sourceMappingURL=files.js.map