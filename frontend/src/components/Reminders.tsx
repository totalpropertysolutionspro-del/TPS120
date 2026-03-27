import { useEffect, useState } from "react";
import {
  Trash2,
  Edit2,
  Plus,
  X,
  Bell,
  Check,
  Clock,
  AlertTriangle,
  FastForward,
  XCircle,
} from "lucide-react";
import * as api from "../api/client";

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "dismissed", label: "Dismissed" },
];

function getPriorityBadge(priority: string) {
  switch (priority) {
    case "low":
      return "bg-gray-100 text-gray-700";
    case "medium":
      return "bg-blue-100 text-blue-700";
    case "high":
      return "bg-orange-100 text-orange-700";
    case "urgent":
      return "bg-red-100 text-red-700 animate-pulse";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function isOverdue(dueDate: string, status: string) {
  if (status === "completed" || status === "dismissed") return false;
  return new Date(dueDate) < new Date();
}

function isToday(dueDate: string) {
  const due = new Date(dueDate);
  const now = new Date();
  return (
    due.getFullYear() === now.getFullYear() &&
    due.getMonth() === now.getMonth() &&
    due.getDate() === now.getDate()
  );
}

function formatDueDate(dueDate: string) {
  const d = new Date(dueDate);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Reminders() {
  const [reminders, setReminders] = useState<api.Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "medium",
    status: "pending",
    entityType: "",
    entityId: "",
  });

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const res = await api.getReminders();
      setReminders(res.data);
    } catch (error) {
      console.error("Failed to fetch reminders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateReminder(editingId, formData);
      } else {
        await api.createReminder(formData as any);
      }
      resetForm();
      fetchReminders();
    } catch (error) {
      console.error("Failed to save reminder:", error);
    }
  };

  const handleEdit = (reminder: api.Reminder) => {
    setFormData({
      title: reminder.title,
      description: reminder.description || "",
      dueDate: reminder.dueDate ? reminder.dueDate.slice(0, 16) : "",
      priority: reminder.priority,
      status: reminder.status,
      entityType: reminder.entityType || "",
      entityId: reminder.entityId || "",
    });
    setEditingId(reminder.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this reminder?")) {
      try {
        await api.deleteReminder(id);
        fetchReminders();
      } catch (error) {
        console.error("Failed to delete reminder:", error);
      }
    }
  };

  const handleMarkComplete = async (id: string) => {
    try {
      await api.updateReminder(id, { status: "completed" });
      fetchReminders();
    } catch (error) {
      console.error("Failed to update reminder:", error);
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      await api.updateReminder(id, { status: "dismissed" });
      fetchReminders();
    } catch (error) {
      console.error("Failed to dismiss reminder:", error);
    }
  };

  const handleSnooze = async (id: string, days: number) => {
    const reminder = reminders.find((r) => r.id === id);
    if (!reminder) return;
    const newDue = new Date(reminder.dueDate);
    newDue.setDate(newDue.getDate() + days);
    try {
      await api.updateReminder(id, { dueDate: newDue.toISOString() });
      fetchReminders();
    } catch (error) {
      console.error("Failed to snooze reminder:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      dueDate: "",
      priority: "medium",
      status: "pending",
      entityType: "",
      entityId: "",
    });
    setShowForm(false);
    setEditingId(null);
  };

  const sortedReminders = [...reminders].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  const filteredReminders = sortedReminders.filter((r) => {
    if (activeTab === "all") return true;
    return r.status === activeTab;
  });

  const todaysReminders = sortedReminders.filter(
    (r) => isToday(r.dueDate) && r.status === "pending"
  );

  const overdueReminders = sortedReminders.filter((r) =>
    isOverdue(r.dueDate, r.status)
  );

  if (loading) {
    return <div className="text-center py-12">Loading reminders...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Reminders</h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Reminder
        </button>
      </div>

      {showForm && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              {editingId ? "Edit Reminder" : "New Reminder"}
            </h3>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Reminder Title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="input"
              required
            />
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="input"
              rows={3}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, dueDate: e.target.value })
                  }
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
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
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={formData.entityType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    entityType: e.target.value,
                    entityId: "",
                  })
                }
                className="input"
              >
                <option value="">Link to Entity (Optional)</option>
                <option value="tenant">Tenant</option>
                <option value="property">Property</option>
                <option value="vendor">Vendor</option>
                <option value="ticket">Ticket</option>
              </select>
              {formData.entityType && (
                <input
                  type="text"
                  placeholder="Entity ID"
                  value={formData.entityId}
                  onChange={(e) =>
                    setFormData({ ...formData, entityId: e.target.value })
                  }
                  className="input"
                />
              )}
            </div>
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

      {/* Today's Reminders */}
      {todaysReminders.length > 0 && (
        <div className="card border-l-4 border-l-emerald-500">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-gray-900">
              Today's Reminders ({todaysReminders.length})
            </h3>
          </div>
          <div className="space-y-2">
            {todaysReminders.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between bg-emerald-50 rounded-lg p-3"
              >
                <div>
                  <p className="font-medium text-sm text-gray-900">
                    {r.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDueDate(r.dueDate)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${getPriorityBadge(
                      r.priority
                    )}`}
                  >
                    {r.priority}
                  </span>
                  <button
                    onClick={() => handleMarkComplete(r.id)}
                    className="text-emerald-600 hover:text-emerald-800"
                    title="Mark Complete"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDismiss(r.id)}
                    className="text-gray-400 hover:text-gray-600"
                    title="Dismiss"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overdue Warning */}
      {overdueReminders.length > 0 && (
        <div className="card border-l-4 border-l-red-500 bg-red-50">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-red-800">
              Overdue ({overdueReminders.length})
            </h3>
          </div>
          <div className="space-y-2">
            {overdueReminders.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between bg-red-100 rounded-lg p-3"
              >
                <div>
                  <p className="font-medium text-sm text-red-900">{r.title}</p>
                  <p className="text-xs text-red-600">
                    Due: {formatDueDate(r.dueDate)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleMarkComplete(r.id)}
                    className="text-emerald-600 hover:text-emerald-800 p-1"
                    title="Mark Complete"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleSnooze(r.id, 1)}
                    className="text-blue-600 hover:text-blue-800 p-1"
                    title="Snooze 1 day"
                  >
                    <FastForward className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDismiss(r.id)}
                    className="text-gray-500 hover:text-gray-700 p-1"
                    title="Dismiss"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Tabs */}
      <div className="flex gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              activeTab === tab.value
                ? "bg-emerald-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reminders List */}
      {filteredReminders.length === 0 ? (
        <div className="card text-center py-12">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {activeTab !== "all"
              ? `No ${activeTab} reminders.`
              : "No reminders yet. Create one to get started!"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReminders.map((reminder) => {
            const overdue = isOverdue(reminder.dueDate, reminder.status);
            return (
              <div
                key={reminder.id}
                className={`card flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  overdue ? "border border-red-200 bg-red-50" : ""
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-gray-900">
                      {reminder.title}
                    </h4>
                    <span
                      className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${getPriorityBadge(
                        reminder.priority
                      )}`}
                    >
                      {reminder.priority}
                    </span>
                    <span
                      className={`badge text-xs ${
                        reminder.status === "completed"
                          ? "badge-success"
                          : reminder.status === "dismissed"
                          ? "bg-gray-100 text-gray-600"
                          : "badge-info"
                      }`}
                    >
                      {reminder.status}
                    </span>
                  </div>
                  {reminder.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {reminder.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDueDate(reminder.dueDate)}
                    </span>
                    {reminder.entityType && (
                      <span className="capitalize">
                        {reminder.entityType}
                      </span>
                    )}
                    {overdue && (
                      <span className="text-red-600 font-medium">
                        OVERDUE
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {reminder.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleMarkComplete(reminder.id)}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded"
                        title="Mark Complete"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleSnooze(reminder.id, 1)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded text-xs font-medium"
                        title="Snooze 1 day"
                      >
                        +1d
                      </button>
                      <button
                        onClick={() => handleSnooze(reminder.id, 7)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded text-xs font-medium"
                        title="Snooze 1 week"
                      >
                        +1w
                      </button>
                      <button
                        onClick={() => handleDismiss(reminder.id)}
                        className="p-2 text-gray-400 hover:bg-gray-50 rounded"
                        title="Dismiss"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleEdit(reminder)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(reminder.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
