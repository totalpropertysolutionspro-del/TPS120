import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import { workOrders } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { createNotification, NotificationType } from "../services/notification.js";

const router = Router();

// Get all work orders
router.get("/", async (req: Request, res: Response) => {
  try {
    const allWorkOrders = await db.select().from(workOrders).all();
    res.json(allWorkOrders);
  } catch (error) {
    console.error("Error fetching work orders:", error);
    res.status(500).json({ error: "Failed to fetch work orders" });
  }
});

// Get single work order
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const workOrder = await db
      .select()
      .from(workOrders)
      .where(eq(workOrders.id, req.params.id))
      .get();

    if (!workOrder) {
      return res.status(404).json({ error: "Work order not found" });
    }

    res.json(workOrder);
  } catch (error) {
    console.error("Error fetching work order:", error);
    res.status(500).json({ error: "Failed to fetch work order" });
  }
});

// Create work order
router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      title,
      propertyId,
      priority,
      urgency,
      type,
      status,
      assignedVendorId,
      notes,
      dueDate,
      contactPhone,
      contactEmail,
      price,
    } = req.body;

    if (!title || !propertyId || !priority) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    const newWorkOrder = {
      id,
      title,
      propertyId,
      priority,
      urgency: urgency || null,
      type: type || null,
      status: status || "open",
      assignedVendorId: assignedVendorId || null,
      notes: notes || null,
      dueDate: dueDate || null,
      contactPhone: contactPhone || null,
      contactEmail: contactEmail || null,
      price: price ? parseFloat(price) : null,
      paid: 0,
      paidAt: null,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(workOrders).values(newWorkOrder);

    // Create notification
    await createNotification({
      type: "work_order_created",
      title: "New Work Order Created",
      message: `Work order "${title}" has been created with ${priority} priority`,
      shouldSendEmail: true,
      email: process.env.ADMIN_EMAIL,
    });

    // If urgency is critical, send additional urgent notification
    if (urgency === "critical") {
      await createNotification({
        type: "ticket_critical",
        title: "CRITICAL Ticket Created",
        message: `CRITICAL: Work order "${title}" requires immediate attention`,
        shouldSendEmail: true,
        shouldSendSMS: true,
        email: process.env.ADMIN_EMAIL,
        phone: process.env.ADMIN_PHONE,
      });
    }

    res.status(201).json(newWorkOrder);
  } catch (error) {
    console.error("Error creating work order:", error);
    res.status(500).json({ error: "Failed to create work order" });
  }
});

// Update work order
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const {
      title,
      propertyId,
      priority,
      urgency,
      type,
      status,
      assignedVendorId,
      notes,
      dueDate,
      contactPhone,
      contactEmail,
      price,
    } = req.body;

    const existingWorkOrder = await db
      .select()
      .from(workOrders)
      .where(eq(workOrders.id, req.params.id))
      .get();

    if (!existingWorkOrder) {
      return res.status(404).json({ error: "Work order not found" });
    }

    const updatedWorkOrder = {
      ...existingWorkOrder,
      ...(title && { title }),
      ...(propertyId && { propertyId }),
      ...(priority && { priority }),
      ...(urgency !== undefined && { urgency }),
      ...(type !== undefined && { type }),
      ...(status && { status }),
      ...(assignedVendorId !== undefined && { assignedVendorId }),
      ...(notes !== undefined && { notes }),
      ...(dueDate !== undefined && { dueDate }),
      ...(contactPhone !== undefined && { contactPhone }),
      ...(contactEmail !== undefined && { contactEmail }),
      ...(price !== undefined && { price: price ? parseFloat(price) : null }),
      updatedAt: new Date().toISOString(),
    };

    // Create notification if status changed
    if (status && status !== existingWorkOrder.status) {
      let notificationType: NotificationType = "work_order_updated";
      let notificationMessage = `Work order status changed to ${status}`;

      if (status === "in_progress") {
        notificationType = "work_order_in_progress";
        notificationMessage = `Work order "${updatedWorkOrder.title}" is now in progress`;
      } else if (status === "completed") {
        notificationType = "work_order_completed";
        notificationMessage = `Work order "${updatedWorkOrder.title}" has been completed`;
      }

      await createNotification({
        type: notificationType,
        title: "Work Order Status Updated",
        message: notificationMessage,
        shouldSendEmail: true,
        shouldSendSMS: status === "completed",
        email: process.env.ADMIN_EMAIL,
        phone: process.env.ADMIN_PHONE,
      });
    }

    // If urgency changed to critical, send urgent notification
    if (urgency === "critical" && existingWorkOrder.urgency !== "critical") {
      await createNotification({
        type: "ticket_critical",
        title: "CRITICAL Ticket Escalated",
        message: `CRITICAL: Work order "${updatedWorkOrder.title}" has been escalated to critical urgency`,
        shouldSendEmail: true,
        shouldSendSMS: true,
        email: process.env.ADMIN_EMAIL,
        phone: process.env.ADMIN_PHONE,
      });
    }

    await db
      .update(workOrders)
      .set(updatedWorkOrder)
      .where(eq(workOrders.id, req.params.id))
      .run();

    res.json(updatedWorkOrder);
  } catch (error) {
    console.error("Error updating work order:", error);
    res.status(500).json({ error: "Failed to update work order" });
  }
});

// Delete work order
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const existingWorkOrder = await db
      .select()
      .from(workOrders)
      .where(eq(workOrders.id, req.params.id))
      .get();

    if (!existingWorkOrder) {
      return res.status(404).json({ error: "Work order not found" });
    }

    await db
      .delete(workOrders)
      .where(eq(workOrders.id, req.params.id))
      .run();

    res.json({ message: "Work order deleted successfully" });
  } catch (error) {
    console.error("Error deleting work order:", error);
    res.status(500).json({ error: "Failed to delete work order" });
  }
});

export default router;
