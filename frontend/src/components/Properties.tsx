import { useEffect, useState } from "react";
import { Plus, Building2, Users, Wrench, ChevronRight, X } from "lucide-react";
import { getProperties, getClients, getWorkOrders, getTenants, createProperty, type Property, type Client } from "../api/client";
import type { Page } from "../App";

interface Props {
  navigate: (page: Page, extra?: { propertyId?: string }) => void;
}

export default function Properties({ navigate }: Props) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [woCounts, setWoCounts] = useState<Record<string, number>>({});
  const [tenantCounts, setTenantCounts] = useState<Record<string, number>>({});
  const [tab, setTab] = useState<"commercial" | "residential">("residential");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", units: "1", status: "active", type: "apartment", propertyType: "residential" as "commercial" | "residential", clientId: "" });

  useEffect(() => {
    Promise.all([getProperties(), getClients(), getWorkOrders(), getTenants()]).then(([p, c, w, t]) => {
      setProperties(p.data);
      setClients(c.data);
      const woMap: Record<string, number> = {};
      const tMap: Record<string, number> = {};
      w.data.filter(wo => wo.status === "open" || wo.status === "in_progress").forEach(wo => { woMap[wo.propertyId] = (woMap[wo.propertyId] || 0) + 1; });
      t.data.forEach(te => { tMap[te.propertyId] = (tMap[te.propertyId] || 0) + 1; });
      setWoCounts(woMap);
      setTenantCounts(tMap);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const clientMap = Object.fromEntries(clients.map(c => [c.id, c]));

  const filtered = properties.filter(p => {
    const pt = p.propertyType || (["commercial"].includes(p.type) ? "commercial" : "residential");
    return pt === tab;
  });

  // Group by client
  const groups: Record<string, Property[]> = {};
  filtered.forEach(p => {
    const key = p.clientId || "__none__";
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  });

  const handleAdd = async () => {
    if (!form.name || !form.address) return;
    try {
      const r = await createProperty({ ...form, units: parseInt(form.units), clientId: form.clientId || undefined });
      setProperties(prev => [...prev, r.data]);
      setShowAdd(false);
      setForm({ name: "", address: "", units: "1", status: "active", type: "apartment", propertyType: "residential", clientId: "" });
    } catch (e) { console.error(e); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={15} /> Add Property
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {(["residential", "commercial"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-3 text-sm font-medium capitalize border-b-2 transition-colors ${tab === t ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            {t} ({properties.filter(p => (p.propertyType || (["commercial"].includes(p.type) ? "commercial" : "residential")) === t).length})
          </button>
        ))}
      </div>

      {/* Grouped properties */}
      {Object.keys(groups).length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-400 shadow-sm border border-gray-100">
          <Building2 size={40} className="mx-auto mb-3 opacity-30" />
          <p>No {tab} properties yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groups).map(([clientId, props]) => {
            const client = clientId !== "__none__" ? clientMap[clientId] : null;
            return (
              <div key={clientId}>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
                    {client ? client.name : "No Client / Direct"}
                  </h2>
                  {client && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${client.type === "management_company" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                      {client.type === "management_company" ? "Mgmt Co" : "Direct"}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">{props.length} {props.length === 1 ? "property" : "properties"}</span>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {props.map(p => (
                    <button key={p.id} onClick={() => navigate("property-hub", { propertyId: p.id })}
                      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all text-left group">
                      <div className="flex items-start justify-between mb-2">
                        <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                          <Building2 size={18} className="text-blue-600" />
                        </div>
                        <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-500 transition-colors mt-1" />
                      </div>
                      <h3 className="font-semibold text-gray-800 text-sm leading-tight mb-1">{p.name}</h3>
                      <p className="text-xs text-gray-500 mb-3 truncate">{p.address}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users size={12} /> {tenantCounts[p.id] || 0} tenants
                        </span>
                        <span className={`flex items-center gap-1 ${(woCounts[p.id] || 0) > 0 ? "text-orange-600 font-medium" : ""}`}>
                          <Wrench size={12} /> {woCounts[p.id] || 0} open
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Property Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="font-semibold text-gray-800">Add Property</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-3">
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Property name *" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Address *" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="grid grid-cols-2 gap-3">
                <input value={form.units} onChange={e => setForm(f => ({ ...f, units: e.target.value }))} placeholder="Units" type="number" className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <select value={form.propertyType} onChange={e => setForm(f => ({ ...f, propertyType: e.target.value as any }))} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                </select>
              </div>
              <select value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">No client / Direct</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <div className="flex gap-3 px-5 pb-5">
              <button onClick={() => setShowAdd(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleAdd} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Add Property</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
