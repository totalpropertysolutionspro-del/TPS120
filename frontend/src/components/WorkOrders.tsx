import { useEffect, useState } from "react";
import { Plus, X, Wrench, ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { getWorkOrders, getProperties, createWorkOrder, updateWorkOrder, deleteWorkOrder, type WorkOrder, type Property } from "../api/client";
import type { Page } from "../App";

interface Props {
  navigate?: (page: Page, extra?: any) => void;
  propertyId?: string;
}

const EMPTY_FORM = (propId = "") => ({ title: "", propertyId: propId, priority: "medium", status: "open", type: "maintenance", notes: "", dueDate: "", price: "" });

export default function WorkOrders({ navigate, propertyId: filterPropertyId }: Props) {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [editWO, setEditWO] = useState<WorkOrder | null>(null);

  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterProp, setFilterProp] = useState<string>(filterPropertyId || "");

  const [form, setForm] = useState(EMPTY_FORM(filterPropertyId));
  const [editForm, setEditForm] = useState(EMPTY_FORM());

  const load = () => {
    setLoading(true);
    Promise.all([getWorkOrders(), getProperties()]).then(([w, p]) => {
      setWorkOrders(w.data);
      setProperties(p.data);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const propMap = Object.fromEntries(properties.map(p => [p.id, p.name]));

  const filtered = workOrders.filter(w => {
    if (filterStatus && w.status !== filterStatus) return false;
    if (filterProp && w.propertyId !== filterProp) return false;
    return true;
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const handleAdd = async () => {
    if (!form.title || !form.propertyId) return;
    try {
      await createWorkOrder({ ...form, price: form.price ? parseFloat(form.price) : undefined } as any);
      load(); setShowAdd(false);
      setForm(EMPTY_FORM(filterPropertyId));
    } catch (e) { console.error(e); }
  };

  const openEdit = (wo: WorkOrder) => {
    setEditWO(wo);
    setEditForm({
      title: wo.title,
      propertyId: wo.propertyId,
      priority: wo.priority,
      status: wo.status,
      type: wo.type || "maintenance",
      notes: wo.notes || "",
      dueDate: wo.dueDate ? wo.dueDate.split("T")[0] : "",
      price: (wo as any).price ? String((wo as any).price) : "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editWO) return;
    try {
      await updateWorkOrder(editWO.id, { ...editForm, price: editForm.price ? parseFloat(editForm.price) : 0 } as any);
      load(); setEditWO(null);
    } catch (e) { console.error(e); }
  };

  const handleStatusChange = async (wo: WorkOrder, newStatus: string) => {
    try { await updateWorkOrder(wo.id, { status: newStatus }); load(); } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this work order?")) return;
    try { await deleteWorkOrder(id); load(); } catch (e) { console.error(e); }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = { open: "bg-red-100 text-red-700", in_progress: "bg-yellow-100 text-yellow-700", completed: "bg-green-100 text-green-700", cancelled: "bg-gray-100 text-gray-600" };
    return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${map[status] || "bg-gray-100 text-gray-600"}`}>{status.replace("_", " ")}</span>;
  };

  const priorityBadge = (p: string) => {
    const map: Record<string, string> = { urgent: "bg-red-500 text-white", high: "bg-orange-400 text-white", medium: "bg-yellow-400 text-gray-800", low: "bg-gray-200 text-gray-600" };
    return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[p] || "bg-gray-200 text-gray-600"}`}>{p}</span>;
  };

  const WOForm = ({ f, setF }: { f: typeof form; setF: typeof setForm }) => (
    <div className="p-5 space-y-3">
      <input value={f.title} onChange={e => setF(x => ({ ...x, title: e.target.value }))} placeholder="Title *" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      <select value={f.propertyId} onChange={e => setF(x => ({ ...x, propertyId: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
        <option value="">Select property *</option>
        {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <div className="grid grid-cols-2 gap-3">
        <select value={f.priority} onChange={e => setF(x => ({ ...x, priority: e.target.value }))} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
        <select value={f.type} onChange={e => setF(x => ({ ...x, type: e.target.value }))} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="maintenance">Maintenance</option>
          <option value="repair">Repair</option>
          <option value="inspection">Inspection</option>
          <option value="cleaning">Cleaning</option>
          <option value="emergency">Emergency</option>
          <option value="other">Other</option>
        </select>
      </div>
      <select value={f.status} onChange={e => setF(x => ({ ...x, status: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
        <option value="open">Open</option>
        <option value="in_progress">In Progress</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>
      <input value={f.dueDate} onChange={e => setF(x => ({ ...x, dueDate: e.target.value }))} type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      <input value={f.price} onChange={e => setF(x => ({ ...x, price: e.target.value }))} type="number" step="0.01" min="0" placeholder="Price charged to client ($)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      <textarea value={f.notes} onChange={e => setF(x => ({ ...x, notes: e.target.value }))} placeholder="Notes" rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const openCount = workOrders.filter(w => w.status === "open").length;
  const inProgressCount = workOrders.filter(w => w.status === "in_progress").length;

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Work Orders</h1>
          <p className="text-sm text-gray-500 mt-0.5">{openCount} open • {inProgressCount} in progress</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
          <Plus size={15} /> Add Work Order
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select value={filterProp} onChange={e => setFilterProp(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="">All Properties</option>
          {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {(filterStatus || filterProp) && (
          <button onClick={() => { setFilterStatus(""); setFilterProp(filterPropertyId || ""); }} className="text-sm text-blue-600 hover:underline px-1">Clear filters</button>
        )}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-400 shadow-sm border border-gray-100">
          <Wrench size={40} className="mx-auto mb-3 opacity-30" />
          <p>No work orders match your filters</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(wo => (
            <div key={wo.id} className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setExpanded(e => ({ ...e, [wo.id]: !e[wo.id] }))}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-gray-800">{wo.title}</span>
                    {priorityBadge(wo.priority)}
                    {wo.type && <span className="text-xs text-gray-500 capitalize">{wo.type}</span>}
                    {(wo as any).price > 0 && (
                      <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        ${Number((wo as any).price).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {propMap[wo.propertyId] || "Unknown"} • {new Date(wo.createdAt).toLocaleDateString()}
                    {wo.dueDate && ` • Due ${new Date(wo.dueDate).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {statusBadge(wo.status)}
                  {expanded[wo.id] ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </div>
              </div>

              {expanded[wo.id] && (
                <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-3">
                  {wo.notes && <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{wo.notes}</p>}
                  <div className="flex flex-wrap gap-2">
                    {wo.status === "open" && (
                      <button onClick={() => handleStatusChange(wo, "in_progress")} className="text-xs px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 font-medium">Mark In Progress</button>
                    )}
                    {wo.status === "in_progress" && (
                      <button onClick={() => handleStatusChange(wo, "completed")} className="text-xs px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium">Mark Completed</button>
                    )}
                    {wo.status !== "cancelled" && wo.status !== "completed" && (
                      <button onClick={() => handleStatusChange(wo, "cancelled")} className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 font-medium">Cancel</button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); openEdit(wo); }} className="text-xs px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 font-medium flex items-center gap-1">
                      <Pencil size={11} /> Edit
                    </button>
                    {navigate && (
                      <button onClick={() => navigate("property-hub", { propertyId: wo.propertyId })} className="text-xs px-3 py-1.5 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 font-medium">View Property</button>
                    )}
                    <button onClick={() => handleDelete(wo.id)} className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium ml-auto">Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-white">
              <h2 className="font-semibold">Add Work Order</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <WOForm f={form} setF={setForm} />
            <div className="flex gap-3 px-5 pb-5">
              <button onClick={() => setShowAdd(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm">Cancel</button>
              <button onClick={handleAdd} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Add Work Order</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editWO && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-white">
              <h2 className="font-semibold">Edit Work Order</h2>
              <button onClick={() => setEditWO(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <WOForm f={editForm} setF={setEditForm} />
            <div className="flex gap-3 px-5 pb-5">
              <button onClick={() => setEditWO(null)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm">Cancel</button>
              <button onClick={handleSaveEdit} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
