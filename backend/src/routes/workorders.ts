import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import { workOrders } from "../db/schema.js";
import { v4 as uuidv4 } from "uuid";
import { createNotification } from "../services/notification.js";

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
      .where((w) => w.id === req.params.id)
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
    const { title, propertyId, priority, status, assignedStaffId, notes } =
      req.body;

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
      status: status || "open",
      assignedStaffId: assignedStaffId || null,
      notes: notes || null,
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

    res.status(201).json(newWorkOrder);
  } catch (error) {
    console.error("Error creating work order:", error);
    res.status(500).json({ error: "Failed to create work order" });
  }
});

// Update work order
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { title, propertyId, priority, status, assignedStaffId, notes } =
      req.body;

    const existingWorkOrder = await db
      .select()
      .from(workOrders)
      .where((w) => w.id === req.params.id)
      .get();

    if (!existingWorkOrder) {
      return res.status(404).json({ error: "Work order not found" });
    }

    const updatedWorkOrder = {
      ...existingWorkOrder,
      ...(title && { title }),
      ...(propertyId && { propertyId }),
      ...(priority && { priority }),
      ...(status && { status }),
      ...(assignedStaffId && { assignedStaffId }),
      ...(notes !== undefined && { notes }),
      updatedAt: new Date().toISOString(),
    };

    // Create notification if status changed
    if (status && status !== existingWorkOrder.status) {
      let notificationType = "work_order_updated" as const;
      let notificationMessage = `Work order status changed to ${status}`;

      if (status === "in_progress") {
        notificationType = "work_order_in_progress";
        notificationMessage = `Work order "${title}" is now in progress`;
      } else if (status === "completed") {
        notificationType = "work_order_completed";
        notificationMessage = `Work order "${title}" has been completed`;
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

    await db
      .update(workOrders)
      .set(updatedWorkOrder)
      .where((w) => w.id === req.params.id)
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
      .where((w) => w.id === req.params.id)
      .get();

    if (!existingWorkOrder) {
      return res.status(404).json({ error: "Work order not found" });
    }

    await db
      .delete(workOrders)
      .where((w) => w.id === req.params.id)
      .run();

    res.json({ message: "Work order deleted successfully" });
  } catch (error) {
    console.error("Error deleting work order:", error);
    res.status(500).json({ error: "Failed to delete work order" });
  }
});

export default router;
