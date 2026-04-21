import { Router } from "express";
import { db } from "../db/index.js";
import { messages } from "../db/schema.js";
import { desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
const router = Router();
router.get("/history", async (_req, res) => {
    try {
        const history = await db.select().from(messages).orderBy(desc(messages.sentAt)).all();
        res.json(history);
    }
    catch (error) {
        console.error("Error fetching message history:", error);
        res.status(500).json({ error: "Failed to fetch message history" });
    }
});
router.post("/log", async (req, res) => {
    try {
        const { type, recipients, subject, body, sentBy, propertyId, propertyName, status } = req.body;
        if (!type || !recipients || !body) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        const id = uuidv4();
        const now = new Date().toISOString();
        const record = {
            id,
            type,
            recipients: typeof recipients === "string" ? recipients : JSON.stringify(recipients),
            subject: subject || null,
            body,
            sentAt: now,
            sentBy: sentBy || null,
            propertyId: propertyId || null,
            propertyName: propertyName || null,
            status: status || "sent",
        };
        await db.insert(messages).values(record);
        res.status(201).json(record);
    }
    catch (error) {
        console.error("Error logging message:", error);
        res.status(500).json({ error: "Failed to log message" });
    }
});
router.post("/sms", async (req, res) => {
    try {
        const { phones, body, recipients, propertyId, propertyName } = req.body;
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const fromPhone = process.env.TWILIO_PHONE_NUMBER;
        if (!accountSid || !authToken || !fromPhone) {
            return res.status(503).json({
                error: "Twilio not configured",
                setup: "Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER to your Render environment variables to enable SMS.",
            });
        }
        const { default: twilio } = await import("twilio");
        const client = twilio(accountSid, authToken);
        const phoneList = Array.isArray(phones) ? phones : [phones];
        const results = [];
        for (const phone of phoneList) {
            try {
                const msg = await client.messages.create({ body, from: fromPhone, to: phone });
                results.push({ phone, status: "sent", sid: msg.sid });
            }
            catch (err) {
                results.push({ phone, status: "failed", error: err.message });
            }
        }
        const allSent = results.every((r) => r.status === "sent");
        const someSent = results.some((r) => r.status === "sent");
        const id = uuidv4();
        const now = new Date().toISOString();
        await db.insert(messages).values({
            id,
            type: "sms",
            recipients: JSON.stringify(recipients || phoneList.map((p) => ({ phone: p }))),
            body,
            sentAt: now,
            propertyId: propertyId || null,
            propertyName: propertyName || null,
            status: allSent ? "sent" : someSent ? "partial" : "failed",
        });
        res.json({ results, messageId: id });
    }
    catch (error) {
        console.error("Error sending SMS:", error);
        res.status(500).json({ error: "Failed to send SMS" });
    }
});
export default router;
//# sourceMappingURL=messages.js.map