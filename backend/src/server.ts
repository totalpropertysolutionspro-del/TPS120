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
import clientsRouter from "./routes/clients.js";
import staffRouter from "./routes/staff.js";
import staffAssignmentsRouter from "./routes/staff-assignments.js";
import searchRouter from "./routes/search.js";
import expensesRouter from "./routes/expenses.js";
import financialsRouter from "./routes/financials.js";
import messagesRouter from "./routes/messages.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

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
app.use("/api/clients", clientsRouter);
app.use("/api/staff", staffRouter);
app.use("/api/staff-assignments", staffAssignmentsRouter);
app.use("/api/search", searchRouter);
app.use("/api/expenses", expensesRouter);
app.use("/api/financials", financialsRouter);
app.use("/api/messages", messagesRouter);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

(async () => {
  try {
    await initializeDatabase();
    await backupDatabase();
    console.log("Database ready");
    app.listen(PORT, () => console.log(`TPS Pro API running on http://localhost:${PORT}`));
  } catch (error) {
    console.error("Failed to initialize database:", error);
    process.exit(1);
  }
})();
