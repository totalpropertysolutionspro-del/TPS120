export type NotificationType = "work_order_created" | "work_order_in_progress" | "work_order_completed" | "work_order_updated" | "invoice_created" | "invoice_paid" | "invoice_overdue" | "tenant_added" | "ticket_critical";
export interface NotificationPayload {
    type: NotificationType;
    title: string;
    message: string;
    email?: string;
    phone?: string;
    shouldSendEmail?: boolean;
    shouldSendSMS?: boolean;
}
export declare function createNotification(payload: NotificationPayload): Promise<{
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
}>;
export declare function getUnreadNotifications(): Promise<{
    id: string;
    type: string;
    createdAt: string;
    title: string;
    message: string;
    isRead: boolean;
}[]>;
export declare function getAllNotifications(): Promise<{
    id: string;
    type: string;
    createdAt: string;
    title: string;
    message: string;
    isRead: boolean;
}[]>;
export declare function markAsRead(notificationId: string): Promise<void>;
export declare function markAllAsRead(): Promise<void>;
//# sourceMappingURL=notification.d.ts.map