import { useEffect, useState } from "react";
import { Trash2, Edit2, Plus } from "lucide-react";
import * as api from "../api/client";

export default function WorkOrders() {
  const [workOrders, setWorkOrders] = useState<api.WorkOrder[]>([]);
  const [properties, setProperties] = useState<api.Property[]>([]);
  const [staff, setStaff] = useState<api.Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    propertyId: "",
    priority: "medium",
    status: "open",
    assignedStaffId: "",
    notes: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [woRes, propertiesRes, staffRes] = await Promise.all([
        api.getWorkOrders(),
        api.getProperties(),
        api.getStaff(),
      ]);
      setWorkOrders(woRes.data);
      setProperties(propertiesRes.data);
      setStaff(staffRes.data);
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
        await api.updateWorkOrder(editingId, formData);
      } else {
        await api.createWorkOrder(formData as any);
      }
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Failed to save work order:", error);
    }
  };

  const handleEdit = (wo: api.WorkOrder) => {
    setFormData({
      title: wo.title,
      propertyId: wo.propertyId,
      priority: wo.priority,
      status: wo.status,
      assignedStaffId: wo.assignedStaffId || "",
      notes: wo.notes || "",
    });
    setEditingId(wo.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this work order?")) {
      try {
        await api.deleteWorkOrder(id);
        fetchData();
      } catch (error) {
        console.error("Failed to delete work order:", error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      propertyId: "",
      priority: "medium",
      status: "open",
      assignedStaffId: "",
      notes: "",
    });
    setShowForm(false);
    setEditingId(null);
  };

  const getPropertyName = (id: string) => {
    return properties.find((p) => p.id === id)?.name || "Unknown";
  };

  const getStaffName = (id: string) => {
    return staff.find((s) => s.id === id)?.name || "Unassigned";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "badge-danger";
      case "high":
        return "badge-warning";
      default:
        return "badge-info";
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading work orders...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Work Orders</h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Work Order
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? "Edit Work Order" : "New Work Order"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Work Order Title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="input"
              required
            />
            <select
              value={formData.propertyId}
              onChange={(e) =>
                setFormData({ ...formData, propertyId: e.target.value })
              }
              className="input"
              required
            >
              <option value="">Select Property</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select
              value={formData.priority}
              onChange={(e) =>
                setFormData({ ...formData, priority: e.target.value })
              }
              className="input"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
              className="input"
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={formData.assignedStaffId}
              onChange={(e) =>
                setFormData({ ...formData, assignedStaffId: e.target.value })
              }
              className="input"
            >
              <option value="">Unassigned</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <textarea
              placeholder="Notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="input"
              rows={3}
            />
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
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Property
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Assigned To
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {workOrders.map((wo) => (
              <tr key={wo.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {wo.title}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {getPropertyName(wo.propertyId)}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className={`badge ${getPriorityColor(wo.priority)}`}>
                    {wo.priority}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`badge ${
                      wo.status === "completed"
                        ? "badge-success"
                        : "badge-info"
                    }`}
                  >
                    {wo.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {getStaffName(wo.assignedStaffId || "")}
                </td>
                <td className="px-6 py-4 text-sm space-x-2">
                  <button
                    onClick={() => handleEdit(wo)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(wo.id)}
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

      {workOrders.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-500">No work orders yet. Create one to get started!</p>
        </div>
      )}
    </div>
  );
}
