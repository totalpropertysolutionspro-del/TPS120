import axios from "axios";

const API_BASE = import.meta.env.MODE === "development" ? "http://localhost:5001/api" : "/api";

const client = axios.create({
  baseURL: API_BASE,
});

export interface Property {
  id: string;
  name: string;
  address: string;
  type: string;
  units: number;
  status: string;
  contactName?: string;
  email?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  propertyId: string;
  unit: string;
  leaseStart: string;
  leaseEnd: string;
  rentAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkOrder {
  id: string;
  title: string;
  propertyId: string;
  priority: string;
  status: string;
  urgency?: string;
  type?: string;
  dueDate?: string;
  contactPhone?: string;
  contactEmail?: string;
  assignedVendorId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  tenantId: string;
  amount: number;
  dueDate: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Vendor {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  service: string;
  rate: string;
  notes: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  type: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  entityType: string;
  entityId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface FileRecord {
  id: string;
  entityType: string;
  entityId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  type: string;
  entityType: string;
  entityId: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface Reminder {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: string;
  status: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// Properties
export const getProperties = () => client.get<Property[]>("/properties");
export const getProperty = (id: string) => client.get<Property>(`/properties/${id}`);
export const createProperty = (data: Omit<Property, "id" | "createdAt" | "updatedAt">) =>
  client.post<Property>("/properties", data);
export const updateProperty = (id: string, data: Partial<Property>) =>
  client.put<Property>(`/properties/${id}`, data);
export const deleteProperty = (id: string) => client.delete(`/properties/${id}`);

// Tenants
export const getTenants = () => client.get<Tenant[]>("/tenants");
export const getTenant = (id: string) => client.get<Tenant>(`/tenants/${id}`);
export const createTenant = (data: Omit<Tenant, "id" | "createdAt" | "updatedAt">) =>
  client.post<Tenant>("/tenants", data);
export const updateTenant = (id: string, data: Partial<Tenant>) =>
  client.put<Tenant>(`/tenants/${id}`, data);
export const deleteTenant = (id: string) => client.delete(`/tenants/${id}`);

// Work Orders (Tickets)
export const getWorkOrders = () => client.get<WorkOrder[]>("/work-orders");
export const getWorkOrder = (id: string) => client.get<WorkOrder>(`/work-orders/${id}`);
export const createWorkOrder = (data: Omit<WorkOrder, "id" | "createdAt" | "updatedAt">) =>
  client.post<WorkOrder>("/work-orders", data);
export const updateWorkOrder = (id: string, data: Partial<WorkOrder>) =>
  client.put<WorkOrder>(`/work-orders/${id}`, data);
export const deleteWorkOrder = (id: string) => client.delete(`/work-orders/${id}`);

// Invoices
export const getInvoices = () => client.get<Invoice[]>("/invoices");
export const getInvoice = (id: string) => client.get<Invoice>(`/invoices/${id}`);
export const createInvoice = (data: Omit<Invoice, "id" | "createdAt" | "updatedAt">) =>
  client.post<Invoice>("/invoices", data);
export const updateInvoice = (id: string, data: Partial<Invoice>) =>
  client.put<Invoice>(`/invoices/${id}`, data);
export const deleteInvoice = (id: string) => client.delete(`/invoices/${id}`);

// Vendors
export const getVendors = () => client.get<Vendor[]>("/vendors");
export const getVendor = (id: string) => client.get<Vendor>(`/vendors/${id}`);
export const createVendor = (data: Omit<Vendor, "id" | "createdAt" | "updatedAt">) =>
  client.post<Vendor>("/vendors", data);
export const updateVendor = (id: string, data: Partial<Vendor>) =>
  client.put<Vendor>(`/vendors/${id}`, data);
export const deleteVendor = (id: string) => client.delete(`/vendors/${id}`);

// Contacts
export const getContacts = () => client.get<Contact[]>("/contacts");
export const getContact = (id: string) => client.get<Contact>(`/contacts/${id}`);
export const createContact = (data: Omit<Contact, "id" | "createdAt" | "updatedAt">) =>
  client.post<Contact>("/contacts", data);
export const updateContact = (id: string, data: Partial<Contact>) =>
  client.put<Contact>(`/contacts/${id}`, data);
export const deleteContact = (id: string) => client.delete(`/contacts/${id}`);

// Notes
export const getNotes = () => client.get<Note[]>("/notes");
export const getNote = (id: string) => client.get<Note>(`/notes/${id}`);
export const createNote = (data: Omit<Note, "id" | "createdAt" | "updatedAt">) =>
  client.post<Note>("/notes", data);
export const updateNote = (id: string, data: Partial<Note>) =>
  client.put<Note>(`/notes/${id}`, data);
export const deleteNote = (id: string) => client.delete(`/notes/${id}`);

// Files
export const getFiles = () => client.get<FileRecord[]>("/files");
export const getFile = (id: string) => client.get<FileRecord>(`/files/${id}`);
export const uploadFile = (formData: FormData) =>
  client.post<FileRecord>("/files", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const deleteFile = (id: string) => client.delete(`/files/${id}`);

// Calendar Events
export const getCalendarEvents = () => client.get<CalendarEvent[]>("/calendar");
export const getCalendarEvent = (id: string) => client.get<CalendarEvent>(`/calendar/${id}`);
export const createCalendarEvent = (data: Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">) =>
  client.post<CalendarEvent>("/calendar", data);
export const updateCalendarEvent = (id: string, data: Partial<CalendarEvent>) =>
  client.put<CalendarEvent>(`/calendar/${id}`, data);
export const deleteCalendarEvent = (id: string) => client.delete(`/calendar/${id}`);

// Reminders
export const getReminders = () => client.get<Reminder[]>("/reminders");
export const getReminder = (id: string) => client.get<Reminder>(`/reminders/${id}`);
export const createReminder = (data: Omit<Reminder, "id" | "createdAt" | "updatedAt">) =>
  client.post<Reminder>("/reminders", data);
export const updateReminder = (id: string, data: Partial<Reminder>) =>
  client.put<Reminder>(`/reminders/${id}`, data);
export const deleteReminder = (id: string) => client.delete(`/reminders/${id}`);

// Notifications
export const getNotifications = () => client.get<Notification[]>("/notifications");
export const getUnreadCount = () => client.get<{ count: number }>("/notifications/unread/count");
export const getUnreadNotifications = () => client.get<Notification[]>("/notifications/unread");
export const markAsRead = (id: string) => client.put(`/notifications/${id}/read`);
export const markAllAsRead = () => client.put("/notifications/all/read");
