import { Router } from "express";
import { db } from "../db/index.js";
import { properties, tenants, workOrders } from "../db/schema.js";
import { like, or } from "drizzle-orm";
const router = Router();
router.get("/", async (req, res) => {
    try {
        const q = (req.query.q || "").trim();
        if (!q || q.length < 2)
            return res.json({ properties: [], tenants: [], workOrders: [] });
        const pattern = `%${q}%`;
        const [matchedProperties, matchedTenants, matchedWorkOrders] = await Promise.all([
            db.select().from(properties).where(or(like(properties.name, pattern), like(properties.address, pattern))).all(),
            db.select().from(tenants).where(or(like(tenants.name, pattern), like(tenants.unit, pattern))).all(),
            db.select().from(workOrders).where(or(like(workOrders.title, pattern), like(workOrders.notes, pattern))).all(),
        ]);
        res.json({
            properties: matchedProperties.slice(0, 10),
            tenants: matchedTenants.slice(0, 10),
            workOrders: matchedWorkOrders.slice(0, 10),
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Search failed" });
    }
});
export default router;
//# sourceMappingURL=search.js.map