import { useEffect, useState } from "react";
import { Trash2, Edit2, Plus } from "lucide-react";
import * as api from "../api/client";

export default function Invoices() {
  const [invoices, setInvoices] = useState<api.Invoice[]>([]);
  const [tenants, setTenants] = useState<api.Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    tenantId: "",
    amount: 0,
    dueDate: "",
    status: "unpaid",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invoicesRes, tenantsRes] = await Promise.all([
        api.getInvoices(),
        api.getTenants(),
      ]);
      setInvoices(invoicesRes.data);
      setTenants(tenantsRes.data);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateInvoice(editingId, formData);
      } else {
        await api.createInvoice(formData as any);
      }
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Failed to save invoice:", error);
    }
  };

  const handleEdit = (invoice: api.Invoice) => {
    setFormData({
      tenantId: invoice.tenantId,
      amount: invoice.amount,
      dueDate: invoice.dueDate,
      status: invoice.status,
    });
    setEditingId(invoice.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this invoice?")) {
      try {
        await api.deleteInvoice(id);
        fetchData();
      } catch (error) {
        console.error("Failed to delete invoice:", error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      tenantId: "",
      amount: 0,
      dueDate: "",
      status: "unpaid",
    });
    setShowForm(false);
    setEditingId(null);
  };

  const getTenantName = (id: string) => {
    return tenants.find((t) => t.id === id)?.name || "Unknown";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "badge-success";
      case "overdue":
        return "badge-danger";
      default:
        return "badge-warning";
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading invoices...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Invoices</h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Invoice
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? "Edit Invoice" : "New Invoice"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <select
              value={formData.tenantId}
              onChange={(e) =>
                setFormData({ ...formData, tenantId: e.target.value })
              }
              className="input"
              required
            >
              <option value="">Select Tenant</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Amount"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: parseFloat(e.target.value) })
              }
              className="input"
              required
            />
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) =>
                setFormData({ ...formData, dueDate: e.target.value })
              }
              className="input"
              required
            />
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
              className="input"
            >
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="overdue">Overdue</option>
            </select>
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary">
                {editingId ? "Update" : "Create"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Tenant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Due Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {getTenantName(invoice.tenantId)}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  ${invoice.amount.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(invoice.dueDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className={`badge ${getStatusColor(invoice.status)}`}>
                    {invoice.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm space-x-2">
                  <button
                    onClick={() => handleEdit(invoice)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(invoice.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {invoices.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-500">No invoices yet. Create one to get started!</p>
        </div>
      )}
    </div>
  );
}
