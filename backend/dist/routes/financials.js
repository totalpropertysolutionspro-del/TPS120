import { Router } from "express";
import { db } from "../db/index.js";
import { workOrders, expenses, properties } from "../db/schema.js";
import { eq } from "drizzle-orm";
const router = Router();
router.get("/", async (_req, res) => {
    try {
        const [allWorkOrders, allExpenses, allProperties] = await Promise.all([
            db.select().from(workOrders).all(),
            db.select().from(expenses).all(),
            db.select().from(properties).all(),
        ]);
        const propMap = Object.fromEntries(allProperties.map(p => [p.id, p.name]));
        // Group expenses by work order
        const expensesByWO = {};
        allExpenses.forEach(e => {
            if (e.workOrderId)
                expensesByWO[e.workOrderId] = (expensesByWO[e.workOrderId] || 0) + e.amount;
        });
        // Build monthly aggregation (last 12 months)
        const now = new Date();
        const months = [];
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
        }
        const monthly = {};
        months.forEach(m => { monthly[m] = { revenue: 0, expenses: 0 }; });
        allWorkOrders.forEach(wo => {
            const month = wo.createdAt.slice(0, 7);
            if (!monthly[month])
                return;
            if (wo.price && wo.paid)
                monthly[month].revenue += wo.price;
            monthly[month].expenses += expensesByWO[wo.id] || 0;
        });
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        const thisMonth = monthly[currentMonth] || { revenue: 0, expenses: 0 };
        const outstanding = allWorkOrders.filter(wo => wo.price && !wo.paid).reduce((sum, wo) => sum + (wo.price || 0), 0);
        // Work order table with financials
        const woTable = allWorkOrders.map(wo => ({
            id: wo.id,
            title: wo.title,
            propertyId: wo.propertyId,
            propertyName: propMap[wo.propertyId] || "Unknown",
            date: wo.createdAt.slice(0, 10),
            price: wo.price || 0,
            expensesTotal: expensesByWO[wo.id] || 0,
            profit: (wo.price || 0) - (expensesByWO[wo.id] || 0),
            paid: wo.paid || 0,
            paidAt: wo.paidAt,
            status: wo.status,
        })).sort((a, b) => b.date.localeCompare(a.date));
        res.json({
            monthly: months.map(m => ({ month: m, ...monthly[m], profit: monthly[m].revenue - monthly[m].expenses })),
            totals: {
                thisMonth: { ...thisMonth, profit: thisMonth.revenue - thisMonth.expenses },
                outstanding,
            },
            workOrders: woTable,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch financials" });
    }
});
// Toggle paid status on a work order
router.put("/work-orders/:id/paid", async (req, res) => {
    try {
        const { paid } = req.body;
        const now = new Date().toISOString();
        await db.update(workOrders)
            .set({ paid: paid ? 1 : 0, paidAt: paid ? now : null, updatedAt: now })
            .where(eq(workOrders.id, req.params.id))
            .run();
        res.json({ message: "Updated" });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to update" });
    }
});
export default router;
//# sourceMappingURL=financials.js.map