import { useEffect, useState } from "react";
import { Trash2, Edit2, Plus, Search } from "lucide-react";
import * as api from "../api/client";

export default function Contacts() {
  const [contacts, setContacts] = useState<api.Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    role: "",
    type: "other",
    notes: "",
  });

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const res = await api.getContacts();
      setContacts(res.data);
    } catch (error) {
      console.error("Failed to fetch contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateContact(editingId, formData);
      } else {
        await api.createContact(formData as any);
      }
      resetForm();
      fetchContacts();
    } catch (error) {
      console.error("Failed to save contact:", error);
    }
  };

  const handleEdit = (contact: api.Contact) => {
    setFormData({
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      company: contact.company,
      role: contact.role,
      type: contact.type,
      notes: contact.notes || "",
    });
    setEditingId(contact.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this contact?")) {
      try {
        await api.deleteContact(id);
        fetchContacts();
      } catch (error) {
        console.error("Failed to delete contact:", error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      company: "",
      role: "",
      type: "other",
      notes: "",
    });
    setShowForm(false);
    setEditingId(null);
  };

  const filteredContacts = contacts.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || c.type === filterType;
    return matchesSearch && matchesType;
  });

  const typeLabels: Record<string, string> = {
    all: "All",
    vendor: "Vendor",
    tenant: "Tenant",
    client: "Client",
    other: "Other",
  };

  if (loading) {
    return <div className="text-center py-12">Loading contacts...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Contacts</h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Contact
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, company, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      <div className="flex gap-2">
        {Object.entries(typeLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilterType(key)}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              filterType === key
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? "Edit Contact" : "New Contact"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <input
                type="text"
                placeholder="Company"
                value={formData.company}
                onChange={(e) =>
                  setFormData({ ...formData, company: e.target.value })
                }
                className="input"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Role / Title"
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                className="input"
              />
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                className="input"
              >
                <option value="vendor">Vendor</option>
                <option value="tenant">Tenant</option>
                <option value="client">Client</option>
                <option value="other">Other</option>
              </select>
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
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Company
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredContacts.map((contact) => (
              <tr key={contact.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {contact.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {contact.company}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {contact.role}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className="badge badge-info capitalize">
                    {contact.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {contact.phone}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {contact.email}
                </td>
                <td className="px-6 py-4 text-sm space-x-2">
                  <button
                    onClick={() => handleEdit(contact)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(contact.id)}
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

      {filteredContacts.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-500">No contacts found. Add one to get started!</p>
        </div>
      )}
    </div>
  );
}
