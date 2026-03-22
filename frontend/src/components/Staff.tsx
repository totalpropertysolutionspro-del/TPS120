import { useEffect, useState } from "react";
import { Trash2, Edit2, Plus } from "lucide-react";
import * as api from "../api/client";

export default function Staff() {
  const [staff, setStaff] = useState<api.Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    role: "maintenance",
    phone: "",
    email: "",
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await api.getStaff();
      setStaff(res.data);
    } catch (error) {
      console.error("Failed to fetch staff:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateStaffMember(editingId, formData);
      } else {
        await api.createStaffMember(formData as any);
      }
      resetForm();
      fetchStaff();
    } catch (error) {
      console.error("Failed to save staff member:", error);
    }
  };

  const handleEdit = (member: api.Staff) => {
    setFormData({
      name: member.name,
      role: member.role,
      phone: member.phone,
      email: member.email,
    });
    setEditingId(member.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this staff member?")) {
      try {
        await api.deleteStaffMember(id);
        fetchStaff();
      } catch (error) {
        console.error("Failed to delete staff member:", error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      role: "maintenance",
      phone: "",
      email: "",
    });
    setShowForm(false);
    setEditingId(null);
  };

  if (loading) {
    return <div className="text-center py-12">Loading staff...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Staff</h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Staff Member
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? "Edit Staff Member" : "New Staff Member"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="input"
              required
            />
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
              className="input"
            >
              <option value="manager">Manager</option>
              <option value="maintenance">Maintenance</option>
              <option value="accountant">Accountant</option>
            </select>
            <input
              type="tel"
              placeholder="Phone"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="input"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="input"
              required
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
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {staff.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {member.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {member.role}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {member.email}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {member.phone}
                </td>
                <td className="px-6 py-4 text-sm space-x-2">
                  <button
                    onClick={() => handleEdit(member)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(member.id)}
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

      {staff.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-500">No staff members yet. Add one to get started!</p>
        </div>
      )}
    </div>
  );
}
