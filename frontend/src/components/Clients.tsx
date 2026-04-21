import { useEffect, useState } from "react";
import { Plus, X, ChevronDown, ChevronRight, Building2, Users } from "lucide-react";
import { getClients, getProperties, createClient, updateClient, deleteClient, type Client, type Property } from "../api/client";
import type { Page } from "../App";

interface Props {
  navigate: (page: Page, extra?: { propertyId?: string }) => void;
}

interface ClientWithProperties extends Client {
  properties?: Property[];
}

export default function Clients({ navigate }: Props) {
  const [clients, setClients] = useState<ClientWithProperties[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [form, setForm] = useState({ name: "", type: "management_company" as "management_company" | "direct", contactName: "", contactEmail: "", contactPhone: "", notes: "" });

  const load = () => {
    setLoading(true);
    Promise.all([getClients(), getProperties()]).then(([c, p]) => {
      const propsByClient: Record<string, Property[]> = {};
      p.data.forEach(prop => {
        const key = prop.clientId || "__none__";
        if (!propsByClient[key]) propsByClient[key] = [];
        propsByClient[key].push(prop);
      });
      setClients(c.data.map(cl => ({ ...cl, properties: propsByClient[cl.id] || [] })));
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => setForm({ name: "", type: "management_company", contactName: "", contactEmail: "", contactPhone: "", notes: "" });

  const handleAdd = async () => {
    if (!form.name) return;
    try {
      await createClient(form);
      load(); setShowAdd(false); resetForm();
    } catch (e) { console.error(e); }
  };

  const handleEdit = async () => {
    if (!editClient) return;
    try {
      await updateClient(editClient.id, form);
      load(); setEditClient(null); resetForm();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this client? Properties will be unlinked.")) return;
    try { await deleteClient(id); load(); } catch (e) { console.error(e); }
  };

  const openEdit = (c: Client) => {
    setEditClient(c);
    setForm({ name: c.name, type: c.type, contactName: c.contactName || "", contactEmail: c.contactEmail || "", contactPhone: c.contactPhone || "", notes: c.notes || "" });
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const mgmt = clients.filter(c => c.type === "management_company");
  const direct = clients.filter(c => c.type === "direct");

  const ClientCard = ({ c }: { c: ClientWithProperties }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.type === "management_company" ? "bg-blue-100" : "bg-green-100"}`}>
            <Users size={18} className={c.type === "management_company" ? "text-blue-600" : "text-green-600"} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 text-sm">{c.name}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${c.type === "management_company" ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700"}`}>
              {c.type === "management_company" ? "Management Co" : "Direct Client"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => openEdit(c)} className="text-xs px-2 py-1 border border-gray-200 rounded text-gray-600 hover:bg-gray-50">Edit</button>
          <button onClick={() => handleDelete(c.id)} className="text-xs px-2 py-1 border border-red-200 rounded text-red-600 hover:bg-red-50">Delete</button>
          <button onClick={() => setExpanded(e => ({ ...e, [c.id]: !e[c.id] }))} className="p-1 text-gray-400 hover:text-gray-600">
            {expanded[c.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>
      </div>

      {/* Contact info */}
      {(c.contactName || c.contactEmail || c.contactPhone) && (
        <div className="px-4 pb-3 -mt-1">
          <p className="text-xs text-gray-500">
            {[c.contactName, c.contactEmail, c.contactPhone].filter(Boolean).join(" • ")}
          </p>
        </div>
      )}

      {/* Expanded properties */}
      {expanded[c.id] && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Properties</p>
          {!c.properties || c.properties.length === 0 ? (
            <p className="text-sm text-gray-400">No properties linked</p>
          ) : (
            <div className="space-y-1.5">
              {c.properties.map(p => (
                <button key={p.id} onClick={() => navigate("property-hub", { propertyId: p.id })}
                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-blue-50 text-left transition-colors">
                  <Building2 size={14} className="text-gray-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">{p.name}</p>
                    <p className="text-xs text-gray-500 truncate">{p.address}</p>
                  </div>
                  <ChevronRight size={12} className="text-gray-300 ml-auto shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const ClientModal = () => (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold">{editClient ? "Edit Client" : "Add Client"}</h2>
          <button onClick={() => { setShowAdd(false); setEditClient(null); resetForm(); }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-3">
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Client name *" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="management_company">Management Company</option>
            <option value="direct">Direct Client</option>
          </select>
          <input value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} placeholder="Contact name" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} placeholder="Contact email" type="email" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} placeholder="Contact phone" type="tel" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes" rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={() => { setShowAdd(false); setEditClient(null); resetForm(); }} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm">Cancel</button>
          <button onClick={editClient ? handleEdit : handleAdd} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
            {editClient ? "Save Changes" : "Add Client"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Clients & Companies</h1>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
          <Plus size={15} /> Add Client
        </button>
      </div>

      {mgmt.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Management Companies</h2>
          <div className="space-y-3">
            {mgmt.map(c => <ClientCard key={c.id} c={c} />)}
          </div>
        </div>
      )}

      {direct.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Direct Clients</h2>
          <div className="space-y-3">
            {direct.map(c => <ClientCard key={c.id} c={c} />)}
          </div>
        </div>
      )}

      {clients.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center text-gray-400 shadow-sm border border-gray-100">
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          <p>No clients yet. Add your first client above.</p>
        </div>
      )}

      {(showAdd || editClient) && <ClientModal />}
    </div>
  );
}
