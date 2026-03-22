import { useEffect, useState } from "react";
import {
  Building2,
  Hammer,
  DollarSign,
  Users,
  TrendingUp,
} from "lucide-react";
import * as api from "../api/client";

export default function Dashboard() {
  const [stats, setStats] = useState({
    properties: 0,
    openWorkOrders: 0,
    revenue: 0,
    occupancy: 0,
    tenants: 0,
    invoicesOverdue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [propertiesRes, tenantsRes, workOrdersRes, invoicesRes] =
        await Promise.all([
          api.getProperties(),
          api.getTenants(),
          api.getWorkOrders(),
          api.getInvoices(),
        ]);

      const totalUnits = propertiesRes.data.reduce(
        (sum, p) => sum + p.units,
        0
      );
      const occupiedUnits = tenantsRes.data.length;
      const occupancy =
        totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

      const totalRent = tenantsRes.data.reduce((sum, t) => sum + t.rentAmount, 0);

      const openWO = workOrdersRes.data.filter(
        (w) => w.status === "open" || w.status === "in_progress"
      ).length;

      const overdueInvoices = invoicesRes.data.filter(
        (i) => i.status === "overdue"
      ).length;

      setStats({
        properties: propertiesRes.data.length,
        openWorkOrders: openWO,
        revenue: totalRent,
        occupancy,
        tenants: tenantsRes.data.length,
        invoicesOverdue: overdueInvoices,
      });
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({
    icon: Icon,
    label,
    value,
    trend,
  }: {
    icon: any;
    label: string;
    value: string | number;
    trend?: string;
  }) => (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {trend && (
            <p className="text-green-600 text-sm mt-2 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              {trend}
            </p>
          )}
        </div>
        <Icon className="w-8 h-8 text-blue-600" />
      </div>
    </div>
  );

  if (loading) {
    return <div className="text-center py-12">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600 mt-2">
          Welcome to Total Property Solutions Pro
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          icon={Building2}
          label="Total Properties"
          value={stats.properties}
          trend="+2 this month"
        />
        <StatCard
          icon={Users}
          label="Active Tenants"
          value={stats.tenants}
          trend="+1 this month"
        />
        <StatCard
          icon={DollarSign}
          label="Monthly Revenue"
          value={`$${stats.revenue.toLocaleString()}`}
          trend="+5% from last month"
        />
        <StatCard
          icon={Hammer}
          label="Open Work Orders"
          value={stats.openWorkOrders}
          trend="1 in progress"
        />
        <StatCard
          icon={TrendingUp}
          label="Occupancy Rate"
          value={`${stats.occupancy}%`}
          trend="All good"
        />
        <StatCard
          icon={DollarSign}
          label="Overdue Invoices"
          value={stats.invoicesOverdue}
          trend={stats.invoicesOverdue > 0 ? "Action needed" : "All paid"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="space-y-2">
            <button className="w-full btn btn-primary text-left">
              Create New Work Order
            </button>
            <button className="w-full btn btn-secondary text-left">
              Add New Tenant
            </button>
            <button className="w-full btn btn-secondary text-left">
              Create Invoice
            </button>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            System Status
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Database</span>
              <span className="badge badge-success">Connected</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">API Server</span>
              <span className="badge badge-success">Running</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Email Service</span>
              <span className="badge badge-info">Configured</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">SMS Service</span>
              <span className="badge badge-info">Configured</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
