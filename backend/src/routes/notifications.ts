import { Router, Request, Response } from "express";
import {
  getUnreadNotifications,
  getAllNotifications,
  markAsRead,
  markAllAsRead,
} from "../services/notification.js";

const router = Router();

// Get unread notifications count
router.get("/unread/count", async (req: Request, res: Response) => {
  try {
    const unread = await getUnreadNotifications();
    res.json({ count: unread.length });
  } catch (error) {
    console.error("Error getting unread count:", error);
    res.status(500).json({ error: "Failed to get unread count" });
  }
});

// Get all unread notifications
router.get("/unread", async (req: Request, res: Response) => {
  try {
    const unread = await getUnreadNotifications();
    res.json(unread);
  } catch (error) {
    console.error("Error getting unread notifications:", error);
    res.status(500).json({ error: "Failed to get unread notifications" });
  }
});

// Get all notifications
router.get("/", async (req: Request, res: Response) => {
  try {
    const all = await getAllNotifications();
    res.json(all);
  } catch (error) {
    console.error("Error getting notifications:", error);
    res.status(500).json({ error: "Failed to get notifications" });
  }
});

// Mark specific notification as read
router.put("/:id/read", async (req: Request, res: Response) => {
  try {
    await markAsRead(req.params.id);
    res.json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

// Mark all notifications as read
router.put("/all/read", async (req: Request, res: Response) => {
  try {
    await markAllAsRead();
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res
      .status(500)
      .json({ error: "Failed to mark all notifications as read" });
  }
});

export default router;
