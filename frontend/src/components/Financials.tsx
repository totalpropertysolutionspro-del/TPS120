import { useEffect, useState } from "react";
import { DollarSign, TrendingUp, TrendingDown, Clock, CheckCircle } from "lucide-react";
import { getFinancials, markWorkOrderPaid, type FinancialsData, type FinancialWO } from "../api/client";

export default function Financials() {
  const [data, setData] = useState<FinancialsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    getFinancials().then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleTogglePaid = async (wo: FinancialWO) => {
    setTogglingId(wo.id);
    try {
      await markWorkOrderPaid(wo.id, !wo.paid);
      load();
    } catch (e) { console.error(e); }
    finally { setTogglingId(null); }
  };

  if (loading || !data) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const { monthly, totals, workOrders } = data;

  const maxRevenue = Math.max(...monthly.map(m => m.revenue), 1);
  const maxExpenses = Math.max(...monthly.map(m => m.expenses), 1);
  const chartMax = Math.max(maxRevenue, maxExpenses, 1);

  const fmt = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const kpis = [
    { label: "This Month Revenue", value: fmt(totals.thisMonth.revenue), icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
    { label: "This Month Expenses", value: fmt(totals.thisMonth.expenses), icon: TrendingDown, color: "text-red-500", bg: "bg-red-50" },
    { label: "This Month Net", value: fmt(totals.thisMonth.profit), icon: DollarSign, color: totals.thisMonth.profit >= 0 ? "text-blue-600" : "text-red-600", bg: "bg-blue-50" },
    { label: "Outstanding", value: fmt(totals.outstanding), icon: Clock, color: "text-orange-600", bg: "bg-orange-50" },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900">Financials</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100`}>
            <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center mb-3`}>
              <Icon size={18} className={color} />
            </div>
            <div className={`text-xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Bar Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-4 text-sm">Monthly Revenue (last 12 months)</h2>
          <div className="flex items-end gap-1 h-32">
            {monthly.map(m => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="w-full relative" style={{ height: "100px" }}>
                  <div
                    className="absolute bottom-0 w-full bg-green-400 rounded-t transition-all group-hover:bg-green-500"
                    style={{ height: `${Math.round((m.revenue / chartMax) * 100)}%`, minHeight: m.revenue > 0 ? "2px" : "0" }}
                    title={`${m.month}: ${fmt(m.revenue)}`}
                  />
                </div>
                <span className="text-gray-400 text-[9px] rotate-45 origin-left translate-y-1">{m.month.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Expenses Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-4 text-sm">Monthly Expenses (last 12 months)</h2>
          <div className="flex items-end gap-1 h-32">
            {monthly.map(m => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="w-full relative" style={{ height: "100px" }}>
                  <div
                    className="absolute bottom-0 w-full bg-red-400 rounded-t transition-all group-hover:bg-red-500"
                    style={{ height: `${Math.round((m.expenses / chartMax) * 100)}%`, minHeight: m.expenses > 0 ? "2px" : "0" }}
                    title={`${m.month}: ${fmt(m.expenses)}`}
                  />
                </div>
                <span className="text-gray-400 text-[9px] rotate-45 origin-left translate-y-1">{m.month.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Work Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">All Work Orders — Financials</h2>
        </div>
        {workOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No work orders with pricing yet. Add a price when creating or editing work orders.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-500 border-b border-gray-100">
                  <th className="px-4 py-3 font-semibold">Work Order</th>
                  <th className="px-4 py-3 font-semibold hidden sm:table-cell">Property</th>
                  <th className="px-4 py-3 font-semibold hidden md:table-cell">Date</th>
                  <th className="px-4 py-3 font-semibold text-right">Charged</th>
                  <th className="px-4 py-3 font-semibold text-right hidden sm:table-cell">Expenses</th>
                  <th className="px-4 py-3 font-semibold text-right hidden md:table-cell">Profit</th>
                  <th className="px-4 py-3 font-semibold text-center">Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {workOrders.map(wo => (
                  <tr key={wo.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-gray-800 truncate max-w-[160px]">{wo.title}</p>
                      <span className={`text-xs ${wo.status === "completed" ? "text-green-600" : wo.status === "in_progress" ? "text-yellow-600" : "text-red-500"}`}>{wo.status.replace("_", " ")}</span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-600 hidden sm:table-cell max-w-[140px] truncate">{wo.propertyName}</td>
                    <td className="px-4 py-2.5 text-gray-500 hidden md:table-cell whitespace-nowrap">{wo.date}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-gray-800">
                      {wo.price > 0 ? fmt(wo.price) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right text-red-500 hidden sm:table-cell">
                      {wo.expensesTotal > 0 ? fmt(wo.expensesTotal) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className={`px-4 py-2.5 text-right font-semibold hidden md:table-cell ${wo.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {wo.price > 0 ? fmt(wo.profit) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {wo.price > 0 ? (
                        <button
                          onClick={() => handleTogglePaid(wo)}
                          disabled={togglingId === wo.id}
                          className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${wo.paid ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                        >
                          {wo.paid ? <><CheckCircle size={11} /> Paid</> : "Unpaid"}
                        </button>
                      ) : <span className="text-gray-300 text-xs">N/A</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
