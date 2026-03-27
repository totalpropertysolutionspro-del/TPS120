import { useEffect, useState } from "react";
import { Trash2, Edit2, Plus, Search } from "lucide-react";
import * as api from "../api/client";

export default function WorkOrders() {
  const [workOrders, setWorkOrders] = useState<api.WorkOrder[]>([]);
  const [properties, setProperties] = useState<api.Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterUrgency, setFilterUrgency] = useState("all");
  const [formData, setFormData] = useState({
    title: "",
    propertyId: "",
    priority: "medium",
    status: "open",
    urgency: "medium",
    type: "maintenance",
    dueDate: "",
    contactPhone: "",
    contactEmail: "",
    assignedVendorId: "",
    notes: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [woRes, propertiesRes] = await Promise.all([
        api.getWorkOrders(),
        api.getProperties(),
      ]);
      setWorkOrders(woRes.data);
      setProperties(propertiesRes.data);
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
      console.error("Failed to save ticket:", error);
    }
  };

  const handleEdit = (wo: api.WorkOrder) => {
    setFormData({
      title: wo.title,
      propertyId: wo.propertyId,
      priority: wo.priority,
      status: wo.status,
      urgency: wo.urgency || "medium",
      type: wo.type || "maintenance",
      dueDate: wo.dueDate || "",
      contactPhone: wo.contactPhone || "",
      contactEmail: wo.contactEmail || "",
      assignedVendorId: wo.assignedVendorId || "",
      notes: wo.notes || "",
    });
    setEditingId(wo.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this ticket?")) {
      try {
        await api.deleteWorkOrder(id);
        fetchData();
      } catch (error) {
        console.error("Failed to delete ticket:", error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      propertyId: "",
      priority: "medium",
      status: "open",
      urgency: "medium",
      type: "maintenance",
      dueDate: "",
      contactPhone: "",
      contactEmail: "",
      assignedVendorId: "",
      notes: "",
    });
    setShowForm(false);
    setEditingId(null);
  };

  const getPropertyName = (id: string) => {
    return properties.find((p) => p.id === id)?.name || "Unknown";
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getUrgencyRowClass = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return "bg-red-50 hover:bg-red-100";
      case "high":
        return "bg-orange-50 hover:bg-orange-100";
      default:
        return "hover:bg-gray-50";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "badge-success";
      case "in_progress":
        return "badge-warning";
      case "cancelled":
        return "badge-danger";
      default:
        return "badge-info";
    }
  };

  const urgencyOrder: Record<string, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  const filteredOrders = workOrders
    .filter((wo) => {
      const matchesSearch =
        wo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getPropertyName(wo.propertyId).toLowerCase().includes(searchTerm.toLowerCase());
      const matchesUrgency = filterUrgency === "all" || wo.urgency === filterUrgency;
      return matchesSearch && matchesUrgency;
    })
    .sort((a, b) => {
      const aOrder = urgencyOrder[a.urgency] ?? 4;
      const bOrder = urgencyOrder[b.urgency] ?? 4;
      return aOrder - bOrder;
    });

  if (loading) {
    return <div className="text-center py-12">Loading tickets...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Tickets</h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Ticket
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search tickets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select
          value={filterUrgency}
          onChange={(e) => setFilterUrgency(e.target.value)}
          className="input w-auto"
        >
          <option value="all">All Urgency</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {showForm && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? "Edit Ticket" : "New Ticket"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Ticket Title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="input"
              required
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                className="input"
              >
                <option value="maintenance">Maintenance</option>
                <option value="repair">Repair</option>
                <option value="inspection">Inspection</option>
                <option value="complaint">Complaint</option>
                <option value="emergency">Emergency</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                value={formData.urgency}
                onChange={(e) =>
                  setFormData({ ...formData, urgency: e.target.value })
                }
                className="input"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value })
                }
                className="input"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent Priority</option>
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
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
                className="input"
                placeholder="Due Date"
              />
              <input
                type="tel"
                placeholder="Contact Phone"
                value={formData.contactPhone}
                onChange={(e) =>
                  setFormData({ ...formData, contactPhone: e.target.value })
                }
                className="input"
              />
              <input
                type="email"
                placeholder="Contact Email"
                value={formData.contactEmail}
                onChange={(e) =>
                  setFormData({ ...formData, contactEmail: e.target.value })
                }
                className="input"
              />
            </div>
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
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Urgency
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Due Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredOrders.map((wo) => (
              <tr key={wo.id} className={getUrgencyRowClass(wo.urgency)}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {wo.title}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {getPropertyName(wo.propertyId)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                  {wo.type || "N/A"}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getUrgencyColor(
                      wo.urgency
                    )}`}
                  >
                    {wo.urgency || "medium"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className={`badge ${getStatusColor(wo.status)}`}>
                    {wo.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {wo.dueDate
                    ? new Date(wo.dueDate).toLocaleDateString()
                    : "N/A"}
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

      {filteredOrders.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-500">No tickets found. Create one to get started!</p>
        </div>
      )}
    </div>
  );
}
