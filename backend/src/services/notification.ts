import { db } from "../db/index.js";
import { notifications } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { sendEmail } from "./email.js";
import { sendSMS } from "./sms.js";

export type NotificationType =
  | "work_order_created"
  | "work_order_in_progress"
  | "work_order_completed"
  | "work_order_updated"
  | "invoice_created"
  | "invoice_paid"
  | "invoice_overdue"
  | "tenant_added"
  | "ticket_critical";

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  message: string;
  email?: string;
  phone?: string;
  shouldSendEmail?: boolean;
  shouldSendSMS?: boolean;
}

export async function createNotification(payload: NotificationPayload) {
  try {
    // Create in-app notification
    const id = uuidv4();
    const notification = {
      id,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    await db.insert(notifications).values(notification);

    // For critical tickets, always try to send both email and SMS
    const isCritical = payload.type === "ticket_critical";

    // Send email notification
    if ((payload.shouldSendEmail || isCritical) && payload.email) {
      try {
        await sendEmail(
          payload.email,
          payload.title,
          payload.message
        );
      } catch (error) {
        console.error("Email notification failed:", error);
      }
    }

    // Send SMS notification
    if ((payload.shouldSendSMS || isCritical) && payload.phone) {
      try {
        await sendSMS(payload.phone, payload.message);
      } catch (error) {
        console.error("SMS notification failed:", error);
      }
    }

    console.log(`Notification created: ${payload.type}`);
    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error);
    throw error;
  }
}

export async function getUnreadNotifications() {
  try {
    const unread = await db
      .select()
      .from(notifications)
      .where(eq(notifications.isRead, false))
      .all();
    return unread;
  } catch (error) {
    console.error("Failed to get unread notifications:", error);
    throw error;
  }
}

export async function getAllNotifications() {
  try {
    const all = await db
      .select()
      .from(notifications)
      .orderBy(desc(notifications.createdAt))
      .all();
    return all;
  } catch (error) {
    console.error("Failed to get notifications:", error);
    throw error;
  }
}

export async function markAsRead(notificationId: string) {
  try {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId))
      .run();
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    throw error;
  }
}

export async function markAllAsRead() {
  try {
    await db
      .update(notifications)
      .set({ isRead: true })
      .run();
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error);
    throw error;
  }
}
