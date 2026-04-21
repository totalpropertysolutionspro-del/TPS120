import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.MODE === "development" ? "http://localhost:5001/api" : "/api");

const client = axios.create({ baseURL: API_BASE });

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Client {
  id: string;
  name: string;
  type: "management_company" | "direct";
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
  createdAt?: string;
}

export interface ClientWithProperties extends Client {
  properties: Property[];
}

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
  clientId?: string;
  propertyType?: "commercial" | "residential";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyDetail extends Property {
  client?: Client | null;
  tenants: Tenant[];
  workOrders: WorkOrder[];
  files: FileRecord[];
  staffAssignments: StaffAssignment[];
}

export interface Staff {
  id: string;
  name: string;
  role?: string;
  phone?: string;
  email?: string;
  payRate?: number;
  active: number;
}

export interface StaffAssignment {
  id: string;
  propertyId?: string;
  staffId?: string;
  date: string;
  hoursWorked?: number;
  payRate?: number;
  notes?: string;
  createdAt?: string;
  staffName?: string;
  propertyName?: string;
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

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface SearchResults {
  properties: Property[];
  tenants: Tenant[];
  workOrders: WorkOrder[];
}

// ─── API Functions ────────────────────────────────────────────────────────────

// Clients
export const getClients = () => client.get<Client[]>("/clients");
export const getClient = (id: string) => client.get<ClientWithProperties>(`/clients/${id}`);
export const createClient = (data: Omit<Client, "id" | "createdAt">) => client.post<Client>("/clients", data);
export const updateClient = (id: string, data: Partial<Client>) => client.put<Client>(`/clients/${id}`, data);
export const deleteClient = (id: string) => client.delete(`/clients/${id}`);

// Properties
export const getProperties = () => client.get<Property[]>("/properties");
export const getProperty = (id: string) => client.get<PropertyDetail>(`/properties/${id}`);
export const createProperty = (data: Omit<Property, "id" | "createdAt" | "updatedAt">) => client.post<Property>("/properties", data);
export const updateProperty = (id: string, data: Partial<Property>) => client.put<Property>(`/properties/${id}`, data);
export const deleteProperty = (id: string) => client.delete(`/properties/${id}`);

// Staff
export const getStaff = () => client.get<Staff[]>("/staff");
export const createStaff = (data: Omit<Staff, "id">) => client.post<Staff>("/staff", data);
export const updateStaff = (id: string, data: Partial<Staff>) => client.put<Staff>(`/staff/${id}`, data);
export const deleteStaff = (id: string) => client.delete(`/staff/${id}`);

// Staff Assignments
export const getStaffAssignments = (params?: { propertyId?: string; staffId?: string; date?: string }) =>
  client.get<StaffAssignment[]>("/staff-assignments", { params });
export const createStaffAssignment = (data: Omit<StaffAssignment, "id" | "createdAt" | "staffName" | "propertyName">) =>
  client.post<StaffAssignment>("/staff-assignments", data);
export const deleteStaffAssignment = (id: string) => client.delete(`/staff-assignments/${id}`);

// Tenants
export const getTenants = () => client.get<Tenant[]>("/tenants");
export const getTenant = (id: string) => client.get<Tenant>(`/tenants/${id}`);
export const createTenant = (data: Omit<Tenant, "id" | "createdAt" | "updatedAt">) => client.post<Tenant>("/tenants", data);
export const updateTenant = (id: string, data: Partial<Tenant>) => client.put<Tenant>(`/tenants/${id}`, data);
export const deleteTenant = (id: string) => client.delete(`/tenants/${id}`);

// Work Orders
export const getWorkOrders = () => client.get<WorkOrder[]>("/work-orders");
export const getWorkOrder = (id: string) => client.get<WorkOrder>(`/work-orders/${id}`);
export const createWorkOrder = (data: Omit<WorkOrder, "id" | "createdAt" | "updatedAt">) => client.post<WorkOrder>("/work-orders", data);
export const updateWorkOrder = (id: string, data: Partial<WorkOrder>) => client.put<WorkOrder>(`/work-orders/${id}`, data);
export const deleteWorkOrder = (id: string) => client.delete(`/work-orders/${id}`);

// Invoices
export const getInvoices = () => client.get<Invoice[]>("/invoices");
export const createInvoice = (data: Omit<Invoice, "id" | "createdAt" | "updatedAt">) => client.post<Invoice>("/invoices", data);
export const updateInvoice = (id: string, data: Partial<Invoice>) => client.put<Invoice>(`/invoices/${id}`, data);
export const deleteInvoice = (id: string) => client.delete(`/invoices/${id}`);

// Files
export const getFiles = () => client.get<FileRecord[]>("/files");
export const getFile = (id: string) => client.get<FileRecord & { data: string }>(`/files/${id}`);
export const uploadFile = (formData: FormData) =>
  client.post<FileRecord>("/files", formData, { headers: { "Content-Type": "multipart/form-data" } });
export const deleteFile = (id: string) => client.delete(`/files/${id}`);

// Notifications
export const getUnreadCount = () => client.get<{ count: number }>("/notifications/unread/count");
export const getUnreadNotifications = () => client.get<Notification[]>("/notifications/unread");
export const markAsRead = (id: string) => client.put(`/notifications/${id}/read`);
export const markAllAsRead = () => client.put("/notifications/all/read");

// Search
export const search = (q: string) => client.get<SearchResults>("/search", { params: { q } });

// Expenses
export interface Expense {
  id: string;
  workOrderId?: string;
  description: string;
  amount: number;
  createdAt?: string;
}
export const getExpenses = (workOrderId?: string) => client.get<Expense[]>("/expenses", { params: workOrderId ? { workOrderId } : undefined });
export const createExpense = (data: Omit<Expense, "id" | "createdAt">) => client.post<Expense>("/expenses", data);
export const deleteExpense = (id: string) => client.delete(`/expenses/${id}`);

// Financials
export interface FinancialMonth { month: string; revenue: number; expenses: number; profit: number; }
export interface FinancialWO { id: string; title: string; propertyId: string; propertyName: string; date: string; price: number; expensesTotal: number; profit: number; paid: number; paidAt?: string; status: string; }
export interface FinancialsData {
  monthly: FinancialMonth[];
  totals: { thisMonth: { revenue: number; expenses: number; profit: number }; outstanding: number };
  workOrders: FinancialWO[];
}
export const getFinancials = () => client.get<FinancialsData>("/financials");
export const markWorkOrderPaid = (id: string, paid: boolean) => client.put(`/financials/work-orders/${id}/paid`, { paid });

// ─── Legacy / Unused (kept for backward compat with old components) ──────────

export interface CalendarEvent {
  id: string; title: string; description: string; startDate: string; endDate: string;
  allDay: boolean; type: string; entityType: string; entityId: string; color: string;
  createdAt: string; updatedAt: string;
}
export interface Reminder {
  id: string; title: string; description: string; dueDate: string; priority: string;
  status: string; entityType: string; entityId: string; createdAt: string; updatedAt: string;
}
export interface EmailTemplate {
  id: string; name: string; subject: string; body: string; type: string; createdAt: string; updatedAt: string;
}
export interface SentEmail {
  id: string; toEmail: string; toName?: string; subject: string; body: string;
  status: string; templateId?: string; entityType?: string; entityId?: string; createdAt: string;
}

export const getVendors = () => client.get<Vendor[]>("/vendors");
export const getVendor = (id: string) => client.get<Vendor>(`/vendors/${id}`);
export const createVendor = (data: Omit<Vendor, "id" | "createdAt" | "updatedAt">) => client.post<Vendor>("/vendors", data);
export const updateVendor = (id: string, data: Partial<Vendor>) => client.put<Vendor>(`/vendors/${id}`, data);
export const deleteVendor = (id: string) => client.delete(`/vendors/${id}`);

export const getContacts = () => client.get<Contact[]>("/contacts");
export const getContact = (id: string) => client.get<Contact>(`/contacts/${id}`);
export const createContact = (data: Omit<Contact, "id" | "createdAt" | "updatedAt">) => client.post<Contact>("/contacts", data);
export const updateContact = (id: string, data: Partial<Contact>) => client.put<Contact>(`/contacts/${id}`, data);
export const deleteContact = (id: string) => client.delete(`/contacts/${id}`);

export const getNotes = () => client.get<Note[]>("/notes");
export const getNote = (id: string) => client.get<Note>(`/notes/${id}`);
export const createNote = (data: Omit<Note, "id" | "createdAt" | "updatedAt">) => client.post<Note>("/notes", data);
export const updateNote = (id: string, data: Partial<Note>) => client.put<Note>(`/notes/${id}`, data);
export const deleteNote = (id: string) => client.delete(`/notes/${id}`);

export const getCalendarEvents = () => client.get<CalendarEvent[]>("/calendar");
export const createCalendarEvent = (data: Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">) => client.post<CalendarEvent>("/calendar", data);
export const updateCalendarEvent = (id: string, data: Partial<CalendarEvent>) => client.put<CalendarEvent>(`/calendar/${id}`, data);
export const deleteCalendarEvent = (id: string) => client.delete(`/calendar/${id}`);

export const getReminders = () => client.get<Reminder[]>("/reminders");
export const createReminder = (data: Omit<Reminder, "id" | "createdAt" | "updatedAt">) => client.post<Reminder>("/reminders", data);
export const updateReminder = (id: string, data: Partial<Reminder>) => client.put<Reminder>(`/reminders/${id}`, data);
export const deleteReminder = (id: string) => client.delete(`/reminders/${id}`);

export const getEmailTemplates = () => client.get<EmailTemplate[]>("/email-templates");
export const createEmailTemplate = (data: Omit<EmailTemplate, "id" | "createdAt" | "updatedAt">) => client.post<EmailTemplate>("/email-templates", data);
export const updateEmailTemplate = (id: string, data: Partial<EmailTemplate>) => client.put<EmailTemplate>(`/email-templates/${id}`, data);
export const deleteEmailTemplate = (id: string) => client.delete(`/email-templates/${id}`);
export const getSentEmails = () => client.get<SentEmail[]>("/sent-emails");
export const sendEmail = (data: { to: string; toName?: string; subject: string; body: string; templateId?: string; entityType?: string; entityId?: string }) => client.post<SentEmail>("/send-email", data);
export const sendNotice = (data: { toEmails: string[]; subject: string; body: string; templateId?: string }) => client.post<SentEmail[]>("/send-notice", data);
