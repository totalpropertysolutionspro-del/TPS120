import { useEffect, useState } from "react";
import { Building2, Wrench, Users, HardHat, Plus, ChevronRight } from "lucide-react";
import { getProperties, getWorkOrders, getTenants, getStaff } from "../api/client";
import type { Page } from "../App";

interface Props {
  navigate: (page: Page, extra?: { propertyId?: string }) => void;
}

export default function Dashboard({ navigate }: Props) {
  const [stats, setStats] = useState({ properties: 0, openWOs: 0, tenants: 0, staff: 0 });
  const [recentWOs, setRecentWOs] = useState<any[]>([]);
  const [propMap, setPropMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getProperties(), getWorkOrders(), getTenants(), getStaff()]).then(([p, w, t, s]) => {
      const props = p.data;
      const wos = w.data;
      const open = wos.filter(o => o.status === "open" || o.status === "in_progress");
      setStats({ properties: props.length, openWOs: open.length, tenants: t.data.length, staff: s.data.filter((m: any) => m.active).length });
      setRecentWOs(wos.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5));
      setPropMap(Object.fromEntries(props.map(pr => [pr.id, pr.name])));
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const kpis = [
    { label: "Total Properties", value: stats.properties, icon: Building2, color: "bg-blue-500", onClick: () => navigate("properties") },
    { label: "Open Work Orders", value: stats.openWOs, icon: Wrench, color: "bg-orange-500", onClick: () => navigate("work-orders") },
    { label: "Total Tenants", value: stats.tenants, icon: Users, color: "bg-green-500", onClick: () => navigate("properties") },
    { label: "Active Staff", value: stats.staff, icon: HardHat, color: "bg-purple-500", onClick: () => navigate("staff") },
  ];

  const statusBadge = (status: string) => {
    const map: Record<string, string> = { open: "bg-red-100 text-red-700", in_progress: "bg-yellow-100 text-yellow-700", completed: "bg-green-100 text-green-700", cancelled: "bg-gray-100 text-gray-600" };
    return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${map[status] || "bg-gray-100 text-gray-600"}`}>{status.replace("_", " ")}</span>;
  };

  const priorityBadge = (priority: string) => {
    const map: Record<string, string> = { urgent: "bg-red-500 text-white", high: "bg-orange-500 text-white", medium: "bg-yellow-400 text-gray-800", low: "bg-gray-200 text-gray-700" };
    return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${map[priority] || "bg-gray-200 text-gray-700"}`}>{priority}</span>;
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex gap-2">
          <button onClick={() => navigate("properties")} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
            <Plus size={15} /> Add Property
          </button>
          <button onClick={() => navigate("work-orders")} className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors">
            <Plus size={15} /> Work Order
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, color, onClick }) => (
          <button key={label} onClick={onClick} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-left hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center mb-3`}>
              <Icon size={20} className="text-white" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-sm text-gray-500 mt-0.5">{label}</div>
          </button>
        ))}
      </div>

      {/* Recent Work Orders */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Recent Work Orders</h2>
          <button onClick={() => navigate("work-orders")} className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
            View all <ChevronRight size={14} />
          </button>
        </div>
        {recentWOs.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-400 text-sm">No work orders yet</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentWOs.map(wo => (
              <div key={wo.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{wo.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{propMap[wo.propertyId] || "Unknown property"}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {priorityBadge(wo.priority)}
                  {statusBadge(wo.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
