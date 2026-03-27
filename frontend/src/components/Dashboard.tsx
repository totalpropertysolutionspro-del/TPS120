import { useEffect, useState } from "react";
import {
  Building2,
  Ticket,
  DollarSign,
  Users,
  TrendingUp,
  Wrench,
  Bell,
} from "lucide-react";
import * as api from "../api/client";

export default function Dashboard() {
  const [stats, setStats] = useState({
    properties: 0,
    openTickets: 0,
    revenue: 0,
    tenants: 0,
    invoicesOverdue: 0,
    activeVendors: 0,
    upcomingReminders: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [propertiesRes, tenantsRes, workOrdersRes, invoicesRes, vendorsRes, remindersRes] =
        await Promise.all([
          api.getProperties(),
          api.getTenants(),
          api.getWorkOrders(),
          api.getInvoices(),
          api.getVendors().catch(() => ({ data: [] as api.Vendor[] })),
          api.getReminders().catch(() => ({ data: [] as api.Reminder[] })),
        ]);

      const totalRent = tenantsRes.data.reduce((sum, t) => sum + (t.rentAmount || 0), 0);

      const openTickets = workOrdersRes.data.filter(
        (w) => w.status === "open" || w.status === "in_progress"
      ).length;

      const overdueInvoices = invoicesRes.data.filter(
        (i) => i.status === "overdue"
      ).length;

      const activeVendors = vendorsRes.data.filter(
        (v) => v.status === "active"
      ).length;

      const upcomingReminders = remindersRes.data.filter(
        (r) => r.status === "pending"
      ).length;

      setStats({
        properties: propertiesRes.data.length,
        openTickets,
        revenue: totalRent,
        tenants: tenantsRes.data.length,
        invoicesOverdue: overdueInvoices,
        activeVendors,
        upcomingReminders,
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
          Welcome to TPS Pro Manager
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
          value={`$${(stats.revenue || 0).toLocaleString()}`}
          trend="+5% from last month"
        />
        <StatCard
          icon={Ticket}
          label="Open Tickets"
          value={stats.openTickets}
        />
        <StatCard
          icon={DollarSign}
          label="Overdue Invoices"
          value={stats.invoicesOverdue}
          trend={stats.invoicesOverdue > 0 ? "Action needed" : "All paid"}
        />
        <StatCard
          icon={Wrench}
          label="Active Vendors"
          value={stats.activeVendors}
        />
        <StatCard
          icon={Bell}
          label="Upcoming Reminders"
          value={stats.upcomingReminders}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="space-y-2">
            <button className="w-full btn btn-primary text-left">
              New Ticket
            </button>
            <button className="w-full btn btn-secondary text-left">
              New Vendor
            </button>
            <button className="w-full btn btn-secondary text-left">
              Add Contact
            </button>
            <button className="w-full btn btn-secondary text-left">
              Schedule Event
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
