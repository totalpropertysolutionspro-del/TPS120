import { Router } from "express";
import { db } from "../db/index.js";
import { clients, properties } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
const router = Router();
router.get("/", async (_req, res) => {
    try {
        const all = await db.select().from(clients).all();
        res.json(all);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch clients" });
    }
});
router.get("/:id", async (req, res) => {
    try {
        const client = await db.select().from(clients).where(eq(clients.id, req.params.id)).get();
        if (!client)
            return res.status(404).json({ error: "Client not found" });
        const clientProperties = await db.select().from(properties).where(eq(properties.clientId, req.params.id)).all();
        res.json({ ...client, properties: clientProperties });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch client" });
    }
});
router.post("/", async (req, res) => {
    try {
        const { name, type, contactName, contactEmail, contactPhone, notes } = req.body;
        if (!name || !type)
            return res.status(400).json({ error: "name and type are required" });
        const client = { id: uuidv4(), name, type, contactName: contactName || null, contactEmail: contactEmail || null, contactPhone: contactPhone || null, notes: notes || null, createdAt: new Date().toISOString() };
        await db.insert(clients).values(client);
        res.status(201).json(client);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to create client" });
    }
});
router.put("/:id", async (req, res) => {
    try {
        const existing = await db.select().from(clients).where(eq(clients.id, req.params.id)).get();
        if (!existing)
            return res.status(404).json({ error: "Client not found" });
        const { name, type, contactName, contactEmail, contactPhone, notes } = req.body;
        const updated = { ...existing, ...(name && { name }), ...(type && { type }), ...(contactName !== undefined && { contactName }), ...(contactEmail !== undefined && { contactEmail }), ...(contactPhone !== undefined && { contactPhone }), ...(notes !== undefined && { notes }) };
        await db.update(clients).set(updated).where(eq(clients.id, req.params.id)).run();
        res.json(updated);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to update client" });
    }
});
router.delete("/:id", async (req, res) => {
    try {
        const existing = await db.select().from(clients).where(eq(clients.id, req.params.id)).get();
        if (!existing)
            return res.status(404).json({ error: "Client not found" });
        await db.delete(clients).where(eq(clients.id, req.params.id)).run();
        res.json({ message: "Client deleted" });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete client" });
    }
});
export default router;
//# sourceMappingURL=clients.js.map