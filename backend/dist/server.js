import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initializeDatabase, backupDatabase } from "./db/index.js";
import propertiesRouter from "./routes/properties.js";
import tenantsRouter from "./routes/tenants.js";
import workOrdersRouter from "./routes/workorders.js";
import invoicesRouter from "./routes/invoices.js";
import vendorsRouter from "./routes/vendors.js";
import contactsRouter from "./routes/contacts.js";
import notesRouter from "./routes/notes.js";
import filesRouter from "./routes/files.js";
import calendarRouter from "./routes/calendar.js";
import remindersRouter from "./routes/reminders.js";
import notificationsRouter from "./routes/notifications.js";
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5001;
// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" })); // Increased for base64 file uploads
// Initialize database on startup
(async () => {
    try {
        await initializeDatabase();
        await backupDatabase();
        console.log("Database ready");
    }
    catch (error) {
        console.error("Failed to initialize database:", error);
        process.exit(1);
    }
})();
// Routes
app.use("/api/properties", propertiesRouter);
app.use("/api/tenants", tenantsRouter);
app.use("/api/work-orders", workOrdersRouter);
app.use("/api/invoices", invoicesRouter);
app.use("/api/vendors", vendorsRouter);
app.use("/api/contacts", contactsRouter);
app.use("/api/notes", notesRouter);
app.use("/api/files", filesRouter);
app.use("/api/calendar", calendarRouter);
app.use("/api/reminders", remindersRouter);
app.use("/api/notifications", notificationsRouter);
// Health check
app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});
// Error handler
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
});
// Start server
app.listen(PORT, () => {
    console.log(`Property Manager API running on http://localhost:${PORT}`);
});
//# sourceMappingURL=server.js.map