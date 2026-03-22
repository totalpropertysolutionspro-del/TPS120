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
  rentAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkOrder {
  id: string;
  title: string;
  propertyId: string;
  priority: string;
  status: string;
  assignedStaffId?: string;
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

export interface Staff {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
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

// Work Orders
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

// Staff
export const getStaff = () => client.get<Staff[]>("/staff");
export const getStaffMember = (id: string) => client.get<Staff>(`/staff/${id}`);
export const createStaffMember = (data: Omit<Staff, "id" | "createdAt" | "updatedAt">) =>
  client.post<Staff>("/staff", data);
export const updateStaffMember = (id: string, data: Partial<Staff>) =>
  client.put<Staff>(`/staff/${id}`, data);
export const deleteStaffMember = (id: string) => client.delete(`/staff/${id}`);

// Notifications
export const getNotifications = () => client.get<Notification[]>("/notifications");
export const getUnreadCount = () => client.get<{ count: number }>("/notifications/unread/count");
export const getUnreadNotifications = () => client.get<Notification[]>("/notifications/unread");
export const markAsRead = (id: string) => client.put(`/notifications/${id}/read`);
export const markAllAsRead = () => client.put("/notifications/all/read");
