import { useEffect, useState } from "react";
import { ArrowLeft, Building2, Plus, X, Wrench, Users, FileText, Calendar, HardHat } from "lucide-react";
import {
  getProperty, createTenant, updateTenant, deleteTenant,
  createWorkOrder, updateWorkOrder, deleteWorkOrder,
  createStaffAssignment, deleteStaffAssignment, getStaff,
  uploadFile, deleteFile,
  getExpenses, createExpense, deleteExpense, getFinancials,
  type PropertyDetail, type Tenant, type WorkOrder, type Staff, type StaffAssignment, type FileRecord,
  type Expense, type FinancialWO,
} from "../api/client";
import type { Page } from "../App";

interface Props {
  propertyId: string;
  navigate: (page: Page, extra?: any) => void;
}

type Tab = "overview" | "tenants" | "workorders" | "files" | "staff" | "financials";

export default function PropertyHub({ propertyId, navigate }: Props) {
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [allStaff, setAllStaff] = useState<Staff[]>([]);

  // Modals
  const [showAddTenant, setShowAddTenant] = useState(false);
  const [showAddWO, setShowAddWO] = useState(false);
  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const [editTenant, setEditTenant] = useState<Tenant | null>(null);
  const [editWO, setEditWO] = useState<WorkOrder | null>(null);
  const [propFinancials, setPropFinancials] = useState<FinancialWO[]>([]);
  const [propertyExpenses, setPropertyExpenses] = useState<Expense[]>([]);
  const [expensesByWO, setExpensesByWO] = useState<Record<string, Expense[]>>({});
  const [showAddExpense, setShowAddExpense] = useState<string | null>(null); // workOrderId
  const [expenseForm, setExpenseForm] = useState({ description: "", amount: "" });

  const [tenantForm, setTenantForm] = useState({ name: "", email: "", phone: "", unit: "", leaseStart: "", leaseEnd: "", rentAmount: "" });
  const [woForm, setWoForm] = useState({ title: "", priority: "medium", status: "open", type: "maintenance", notes: "", dueDate: "", price: "" });
  const [assignForm, setAssignForm] = useState({ staffId: "", date: new Date().toISOString().split("T")[0], hoursWorked: "", payRate: "", notes: "" });

  const load = () => {
    setLoading(true);
    Promise.all([getProperty(propertyId), getStaff(), getFinancials(), getExpenses()]).then(([p, s, fin, exp]) => {
      setProperty(p.data);
      setAllStaff(s.data);
      setPropFinancials(fin.data.workOrders.filter(wo => wo.propertyId === propertyId));
      const byWO: Record<string, Expense[]> = {};
      exp.data.forEach(e => {
        if (e.workOrderId) { if (!byWO[e.workOrderId]) byWO[e.workOrderId] = []; byWO[e.workOrderId].push(e); }
      });
      setExpensesByWO(byWO);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [propertyId]);

  const handleAddTenant = async () => {
    if (!tenantForm.name || !tenantForm.unit) return;
    try {
      await createTenant({ ...tenantForm, propertyId, rentAmount: parseFloat(tenantForm.rentAmount) || 0 });
      load();
      setShowAddTenant(false);
      setTenantForm({ name: "", email: "", phone: "", unit: "", leaseStart: "", leaseEnd: "", rentAmount: "" });
    } catch (e) { console.error(e); }
  };

  const handleSaveTenant = async () => {
    if (!editTenant) return;
    try {
      await updateTenant(editTenant.id, { ...tenantForm, rentAmount: parseFloat(tenantForm.rentAmount) || 0 });
      load(); setEditTenant(null);
    } catch (e) { console.error(e); }
  };

  const handleDeleteTenant = async (id: string) => {
    if (!confirm("Delete this tenant?")) return;
    try { await deleteTenant(id); load(); } catch (e) { console.error(e); }
  };

  const handleAddWO = async () => {
    if (!woForm.title) return;
    try {
      await createWorkOrder({ ...woForm, propertyId, price: woForm.price ? parseFloat(woForm.price) : undefined } as any);
      load(); setShowAddWO(false);
      setWoForm({ title: "", priority: "medium", status: "open", type: "maintenance", notes: "", dueDate: "", price: "" });
    } catch (e) { console.error(e); }
  };

  const handleAddExpense = async (workOrderId: string) => {
    if (!expenseForm.description || !expenseForm.amount) return;
    try {
      await createExpense({ workOrderId, description: expenseForm.description, amount: parseFloat(expenseForm.amount) });
      load(); setShowAddExpense(null); setExpenseForm({ description: "", amount: "" });
    } catch (e) { console.error(e); }
  };

  const handleDeleteExpense = async (id: string) => {
    try { await deleteExpense(id); load(); } catch (e) { console.error(e); }
  };

  const handleUpdateWOStatus = async (wo: WorkOrder, status: string) => {
    try { await updateWorkOrder(wo.id, { status }); load(); } catch (e) { console.error(e); }
  };

  const handleDeleteWO = async (id: string) => {
    if (!confirm("Delete this work order?")) return;
    try { await deleteWorkOrder(id); load(); } catch (e) { console.error(e); }
  };

  const handleAddAssignment = async () => {
    if (!assignForm.date) return;
    try {
      const staffMember = allStaff.find(s => s.id === assignForm.staffId);
      await createStaffAssignment({
        propertyId,
        staffId: assignForm.staffId || undefined,
        date: assignForm.date,
        hoursWorked: assignForm.hoursWorked ? parseFloat(assignForm.hoursWorked) : undefined,
        payRate: assignForm.payRate ? parseFloat(assignForm.payRate) : (staffMember?.payRate || undefined),
        notes: assignForm.notes || undefined,
      });
      load(); setShowAddAssignment(false);
      setAssignForm({ staffId: "", date: new Date().toISOString().split("T")[0], hoursWorked: "", payRate: "", notes: "" });
    } catch (e) { console.error(e); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("entityType", "property");
    fd.append("entityId", propertyId);
    try { await uploadFile(fd); load(); } catch (e) { console.error(e); }
  };

  const handleDeleteFile = async (id: string) => {
    if (!confirm("Delete this file?")) return;
    try { await deleteFile(id); load(); } catch (e) { console.error(e); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!property) return (
    <div className="text-center p-12 text-gray-400">Property not found</div>
  );

  const statusBadge = (status: string) => {
    const map: Record<string, string> = { open: "bg-red-100 text-red-700", in_progress: "bg-yellow-100 text-yellow-700", completed: "bg-green-100 text-green-700", cancelled: "bg-gray-100 text-gray-600" };
    return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${map[status] || "bg-gray-100 text-gray-600"}`}>{status.replace("_", " ")}</span>;
  };

  const tabs: Array<{ id: Tab; label: string; count?: number }> = [
    { id: "overview", label: "Overview" },
    { id: "tenants", label: "Tenants", count: property.tenants.length },
    { id: "workorders", label: "Work Orders", count: property.workOrders.length },
    { id: "financials", label: "Financials" },
    { id: "files", label: "Files", count: property.files.length },
    { id: "staff", label: "Staff Schedule", count: property.staffAssignments.length },
  ];

  return (
    <div className="max-w-5xl space-y-5">
      {/* Header */}
      <div>
        <button onClick={() => navigate("properties")} className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 mb-3 transition-colors">
          <ArrowLeft size={15} /> Back to Properties
        </button>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <Building2 size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{property.name}</h1>
                <p className="text-sm text-gray-500 mt-0.5">{property.address}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {property.propertyType && (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${property.propertyType === "commercial" ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700"}`}>
                  {property.propertyType}
                </span>
              )}
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${property.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                {property.status}
              </span>
              {property.client && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                  {property.client.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-xl overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${tab === t.id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            {t.label}
            {t.count !== undefined && <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.id ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-b-xl shadow-sm border border-gray-100 border-t-0 -mt-5 pt-0">

        {/* OVERVIEW */}
        {tab === "overview" && (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Units", value: property.units, icon: Building2 },
                { label: "Tenants", value: property.tenants.length, icon: Users },
                { label: "Open WOs", value: property.workOrders.filter(w => w.status === "open" || w.status === "in_progress").length, icon: Wrench },
                { label: "Files", value: property.files.length, icon: FileText },
              ].map(s => (
                <div key={s.label} className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-gray-800">{s.value}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
            {property.notes && (
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-1">Notes</h3>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{property.notes}</p>
              </div>
            )}
            {property.client && (
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Client</h3>
                <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                  <p className="font-medium text-gray-800">{property.client.name}</p>
                  {property.client.contactName && <p className="text-gray-500">Contact: {property.client.contactName}</p>}
                  {property.client.contactEmail && <p className="text-gray-500">{property.client.contactEmail}</p>}
                  {property.client.contactPhone && <p className="text-gray-500">{property.client.contactPhone}</p>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TENANTS */}
        {tab === "tenants" && (
          <div className="p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800">Tenants ({property.tenants.length})</h3>
              <button onClick={() => setShowAddTenant(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                <Plus size={14} /> Add Tenant
              </button>
            </div>
            {property.tenants.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">No tenants yet</p>
            ) : (
              <div className="space-y-2">
                {property.tenants.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm text-gray-800">{t.name}</p>
                      <p className="text-xs text-gray-500">Unit {t.unit} • {t.phone} • {t.email}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Lease: {t.leaseStart} – {t.leaseEnd}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setEditTenant(t); setTenantForm({ name: t.name, email: t.email, phone: t.phone, unit: t.unit, leaseStart: t.leaseStart, leaseEnd: t.leaseEnd, rentAmount: String(t.rentAmount || "") }); }}
                        className="text-xs px-2 py-1 border border-gray-200 rounded text-gray-600 hover:bg-gray-100">Edit</button>
                      <button onClick={() => handleDeleteTenant(t.id)} className="text-xs px-2 py-1 border border-red-200 rounded text-red-600 hover:bg-red-50">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* WORK ORDERS */}
        {tab === "workorders" && (
          <div className="p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800">Work Orders ({property.workOrders.length})</h3>
              <button onClick={() => setShowAddWO(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                <Plus size={14} /> Add Work Order
              </button>
            </div>
            {property.workOrders.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">No work orders yet</p>
            ) : (
              <div className="space-y-2">
                {property.workOrders.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(wo => (
                  <div key={wo.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-800">{wo.title}</p>
                        {wo.notes && <p className="text-xs text-gray-500 mt-0.5 truncate">{wo.notes}</p>}
                        <p className="text-xs text-gray-400 mt-1">{new Date(wo.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {statusBadge(wo.status)}
                        {wo.status !== "completed" && (
                          <button onClick={() => handleUpdateWOStatus(wo, wo.status === "open" ? "in_progress" : "completed")}
                            className="text-xs px-2 py-1 border border-gray-200 rounded text-gray-600 hover:bg-gray-100">
                            {wo.status === "open" ? "Start" : "Complete"}
                          </button>
                        )}
                        <button onClick={() => handleDeleteWO(wo.id)} className="text-xs px-2 py-1 border border-red-200 rounded text-red-600 hover:bg-red-50">Del</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* FILES */}
        {tab === "files" && (
          <div className="p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800">Files ({property.files.length})</h3>
              <label className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 cursor-pointer">
                <Plus size={14} /> Upload File
                <input type="file" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
            {property.files.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">No files yet</p>
            ) : (
              <div className="space-y-2">
                {property.files.map(f => (
                  <div key={f.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-800">{f.originalName}</p>
                        <p className="text-xs text-gray-400">{(f.size / 1024).toFixed(1)} KB • {new Date(f.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteFile(f.id)} className="text-xs px-2 py-1 border border-red-200 rounded text-red-600 hover:bg-red-50">Delete</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* FINANCIALS */}
        {tab === "financials" && (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Total Revenue", value: propFinancials.filter(w => w.paid).reduce((s, w) => s + w.price, 0), color: "text-green-600" },
                { label: "Total Expenses", value: propFinancials.reduce((s, w) => s + w.expensesTotal, 0), color: "text-red-500" },
                { label: "Net Profit", value: propFinancials.filter(w => w.paid).reduce((s, w) => s + w.price, 0) - propFinancials.reduce((s, w) => s + w.expensesTotal, 0), color: "text-blue-600" },
              ].map(k => (
                <div key={k.label} className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className={`text-xl font-bold ${k.color}`}>${k.value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{k.label}</div>
                </div>
              ))}
            </div>

            <h3 className="font-semibold text-gray-800 text-sm">Work Order Financials</h3>
            {propFinancials.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-6">No work orders with pricing for this property yet.</p>
            ) : (
              <div className="space-y-3">
                {propFinancials.map(wo => {
                  const woExpenses = expensesByWO[wo.id] || [];
                  return (
                    <div key={wo.id} className="border border-gray-100 rounded-lg overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                        <div>
                          <p className="font-medium text-sm text-gray-800">{wo.title}</p>
                          <p className="text-xs text-gray-500">{wo.date}</p>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-gray-600">Charged: <span className="font-semibold text-gray-800">{wo.price > 0 ? `$${wo.price}` : "—"}</span></span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${wo.paid ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>{wo.paid ? "Paid" : "Unpaid"}</span>
                        </div>
                      </div>
                      <div className="px-4 py-2">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Expenses ({woExpenses.length})</p>
                          <button onClick={() => { setShowAddExpense(wo.id); setExpenseForm({ description: "", amount: "" }); }}
                            className="text-xs text-blue-600 hover:underline">+ Add Expense</button>
                        </div>
                        {woExpenses.map(e => (
                          <div key={e.id} className="flex items-center justify-between py-1">
                            <span className="text-sm text-gray-700">{e.description}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-red-500">${e.amount.toFixed(2)}</span>
                              <button onClick={() => handleDeleteExpense(e.id)} className="text-gray-400 hover:text-red-500 text-xs">×</button>
                            </div>
                          </div>
                        ))}
                        {showAddExpense === wo.id && (
                          <div className="flex gap-2 mt-2">
                            <input value={expenseForm.description} onChange={e => setExpenseForm(f => ({ ...f, description: e.target.value }))} placeholder="Description" className="flex-1 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
                            <input value={expenseForm.amount} onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))} type="number" step="0.01" placeholder="$" className="w-20 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
                            <button onClick={() => handleAddExpense(wo.id)} className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">Add</button>
                            <button onClick={() => setShowAddExpense(null)} className="px-2 py-1 border border-gray-200 text-gray-500 text-xs rounded">×</button>
                          </div>
                        )}
                        {woExpenses.length > 0 && (
                          <div className="flex justify-between items-center pt-2 border-t border-gray-100 mt-1">
                            <span className="text-xs text-gray-500">Net</span>
                            <span className={`text-sm font-bold ${(wo.price - wo.expensesTotal) >= 0 ? "text-green-600" : "text-red-600"}`}>
                              ${(wo.price - wo.expensesTotal).toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* STAFF SCHEDULE */}
        {tab === "staff" && (
          <div className="p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800">Staff Assignments ({property.staffAssignments.length})</h3>
              <button onClick={() => setShowAddAssignment(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                <Plus size={14} /> Log Assignment
              </button>
            </div>
            {property.staffAssignments.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">No assignments logged yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                      <th className="pb-2 font-semibold">Staff</th>
                      <th className="pb-2 font-semibold">Date</th>
                      <th className="pb-2 font-semibold">Hours</th>
                      <th className="pb-2 font-semibold">Pay Rate</th>
                      <th className="pb-2 font-semibold">Total</th>
                      <th className="pb-2 font-semibold">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {property.staffAssignments.sort((a, b) => b.date.localeCompare(a.date)).map(a => {
                      const member = allStaff.find(s => s.id === a.staffId);
                      const total = a.hoursWorked && a.payRate ? (a.hoursWorked * a.payRate).toFixed(2) : "-";
                      return (
                        <tr key={a.id} className="hover:bg-gray-50">
                          <td className="py-2 pr-3 font-medium text-gray-800">{member?.name || "—"}</td>
                          <td className="py-2 pr-3 text-gray-600">{a.date}</td>
                          <td className="py-2 pr-3 text-gray-600">{a.hoursWorked ?? "—"}</td>
                          <td className="py-2 pr-3 text-gray-600">{a.payRate ? `$${a.payRate}/hr` : "—"}</td>
                          <td className="py-2 pr-3 text-gray-600">{total !== "-" ? `$${total}` : "—"}</td>
                          <td className="py-2 text-gray-500 text-xs">{a.notes || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Tenant Modal */}
      {(showAddTenant || editTenant) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="font-semibold">{editTenant ? "Edit Tenant" : "Add Tenant"}</h2>
              <button onClick={() => { setShowAddTenant(false); setEditTenant(null); }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-3">
              {(["name", "email", "phone", "unit"] as const).map(field => (
                <input key={field} value={tenantForm[field]} onChange={e => setTenantForm(f => ({ ...f, [field]: e.target.value }))}
                  placeholder={field.charAt(0).toUpperCase() + field.slice(1) + (field === "name" || field === "unit" ? " *" : "")}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              ))}
              <div className="grid grid-cols-2 gap-3">
                <input value={tenantForm.leaseStart} onChange={e => setTenantForm(f => ({ ...f, leaseStart: e.target.value }))} type="date" placeholder="Lease start" className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input value={tenantForm.leaseEnd} onChange={e => setTenantForm(f => ({ ...f, leaseEnd: e.target.value }))} type="date" placeholder="Lease end" className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <input value={tenantForm.rentAmount} onChange={e => setTenantForm(f => ({ ...f, rentAmount: e.target.value }))} type="number" placeholder="Rent amount" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-3 px-5 pb-5">
              <button onClick={() => { setShowAddTenant(false); setEditTenant(null); }} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm">Cancel</button>
              <button onClick={editTenant ? handleSaveTenant : handleAddTenant} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                {editTenant ? "Save" : "Add Tenant"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Work Order Modal */}
      {showAddWO && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="font-semibold">Add Work Order</h2>
              <button onClick={() => setShowAddWO(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-3">
              <input value={woForm.title} onChange={e => setWoForm(f => ({ ...f, title: e.target.value }))} placeholder="Title *" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="grid grid-cols-2 gap-3">
                <select value={woForm.priority} onChange={e => setWoForm(f => ({ ...f, priority: e.target.value }))} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
                <select value={woForm.type} onChange={e => setWoForm(f => ({ ...f, type: e.target.value }))} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="maintenance">Maintenance</option>
                  <option value="repair">Repair</option>
                  <option value="inspection">Inspection</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="emergency">Emergency</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <input value={woForm.dueDate} onChange={e => setWoForm(f => ({ ...f, dueDate: e.target.value }))} type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <textarea value={woForm.notes} onChange={e => setWoForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes" rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              <input value={woForm.price} onChange={e => setWoForm(f => ({ ...f, price: e.target.value }))} type="number" step="0.01" min="0" placeholder="Price charged to client ($)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-3 px-5 pb-5">
              <button onClick={() => setShowAddWO(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm">Cancel</button>
              <button onClick={handleAddWO} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Add Work Order</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Assignment Modal */}
      {showAddAssignment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="font-semibold">Log Staff Assignment</h2>
              <button onClick={() => setShowAddAssignment(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-3">
              <select value={assignForm.staffId} onChange={e => setAssignForm(f => ({ ...f, staffId: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select staff member</option>
                {allStaff.map(s => <option key={s.id} value={s.id}>{s.name}{s.role ? ` — ${s.role}` : ""}</option>)}
              </select>
              <input value={assignForm.date} onChange={e => setAssignForm(f => ({ ...f, date: e.target.value }))} type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="grid grid-cols-2 gap-3">
                <input value={assignForm.hoursWorked} onChange={e => setAssignForm(f => ({ ...f, hoursWorked: e.target.value }))} type="number" step="0.5" placeholder="Hours worked" className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input value={assignForm.payRate} onChange={e => setAssignForm(f => ({ ...f, payRate: e.target.value }))} type="number" step="0.01" placeholder="Pay rate $/hr" className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <input value={assignForm.notes} onChange={e => setAssignForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-3 px-5 pb-5">
              <button onClick={() => setShowAddAssignment(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm">Cancel</button>
              <button onClick={handleAddAssignment} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Log Assignment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
