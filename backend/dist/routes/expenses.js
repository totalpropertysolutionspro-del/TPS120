import { Router } from "express";
import { db } from "../db/index.js";
import { expenses } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
const router = Router();
router.get("/", async (req, res) => {
    try {
        const { workOrderId } = req.query;
        let all = await db.select().from(expenses).all();
        if (workOrderId)
            all = all.filter(e => e.workOrderId === workOrderId);
        res.json(all);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch expenses" });
    }
});
router.post("/", async (req, res) => {
    try {
        const { workOrderId, description, amount } = req.body;
        if (!description || amount === undefined)
            return res.status(400).json({ error: "description and amount required" });
        const expense = { id: uuidv4(), workOrderId: workOrderId || null, description, amount: parseFloat(amount), createdAt: new Date().toISOString() };
        await db.insert(expenses).values(expense);
        res.status(201).json(expense);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to create expense" });
    }
});
router.delete("/:id", async (req, res) => {
    try {
        const existing = await db.select().from(expenses).where(eq(expenses.id, req.params.id)).get();
        if (!existing)
            return res.status(404).json({ error: "Expense not found" });
        await db.delete(expenses).where(eq(expenses.id, req.params.id)).run();
        res.json({ message: "Expense deleted" });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete expense" });
    }
});
export default router;
//# sourceMappingURL=expenses.js.map