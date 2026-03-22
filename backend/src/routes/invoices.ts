import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import { invoices, tenants } from "../db/schema.js";
import { v4 as uuidv4 } from "uuid";
import { createNotification } from "../services/notification.js";

const router = Router();

// Get all invoices
router.get("/", async (req: Request, res: Response) => {
  try {
    const allInvoices = await db.select().from(invoices).all();
    res.json(allInvoices);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
});

// Get single invoice
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const invoice = await db
      .select()
      .from(invoices)
      .where((i) => i.id === req.params.id)
      .get();

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    res.json(invoice);
  } catch (error) {
    console.error("Error fetching invoice:", error);
    res.status(500).json({ error: "Failed to fetch invoice" });
  }
});

// Create invoice
router.post("/", async (req: Request, res: Response) => {
  try {
    const { tenantId, amount, dueDate, status } = req.body;

    if (!tenantId || !amount || !dueDate) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const tenant = await db
      .select()
      .from(tenants)
      .where((t) => t.id === tenantId)
      .get();

    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    const newInvoice = {
      id,
      tenantId,
      amount: parseFloat(amount),
      dueDate,
      status: status || "unpaid",
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(invoices).values(newInvoice);

    // Create notification
    await createNotification({
      type: "invoice_created",
      title: "Invoice Created",
      message: `Invoice for ${amount} created for ${tenant.name}`,
      shouldSendEmail: true,
      email: tenant.email,
    });

    res.status(201).json(newInvoice);
  } catch (error) {
    console.error("Error creating invoice:", error);
    res.status(500).json({ error: "Failed to create invoice" });
  }
});

// Update invoice
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { tenantId, amount, dueDate, status } = req.body;

    const existingInvoice = await db
      .select()
      .from(invoices)
      .where((i) => i.id === req.params.id)
      .get();

    if (!existingInvoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const tenant = await db
      .select()
      .from(tenants)
      .where((t) => t.id === existingInvoice.tenantId)
      .get();

    const updatedInvoice = {
      ...existingInvoice,
      ...(tenantId && { tenantId }),
      ...(amount && { amount: parseFloat(amount) }),
      ...(dueDate && { dueDate }),
      ...(status && { status }),
      updatedAt: new Date().toISOString(),
    };

    // Create notification if status changed
    if (status && status !== existingInvoice.status) {
      let notificationType = "invoice_paid" as const;
      let notificationMessage = `Invoice has been marked as ${status}`;

      if (status === "paid") {
        notificationType = "invoice_paid";
        notificationMessage = "Invoice payment received";
      } else if (status === "overdue") {
        notificationType = "invoice_overdue";
        notificationMessage = "Invoice is overdue";
      }

      await createNotification({
        type: notificationType,
        title: `Invoice ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: notificationMessage,
        shouldSendEmail: true,
        shouldSendSMS: status === "overdue",
        email: tenant?.email,
        phone: tenant?.phone,
      });
    }

    await db
      .update(invoices)
      .set(updatedInvoice)
      .where((i) => i.id === req.params.id)
      .run();

    res.json(updatedInvoice);
  } catch (error) {
    console.error("Error updating invoice:", error);
    res.status(500).json({ error: "Failed to update invoice" });
  }
});

// Delete invoice
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const existingInvoice = await db
      .select()
      .from(invoices)
      .where((i) => i.id === req.params.id)
      .get();

    if (!existingInvoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    await db
      .delete(invoices)
      .where((i) => i.id === req.params.id)
      .run();

    res.json({ message: "Invoice deleted successfully" });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    res.status(500).json({ error: "Failed to delete invoice" });
  }
});

export default router;
