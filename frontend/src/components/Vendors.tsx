import { useEffect, useState } from "react";
import { Trash2, Edit2, Plus, Search } from "lucide-react";
import * as api from "../api/client";

export default function Vendors() {
  const [vendors, setVendors] = useState<api.Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterService, setFilterService] = useState("all");
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    service: "general",
    rate: "",
    notes: "",
    status: "active",
  });

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const res = await api.getVendors();
      setVendors(res.data);
    } catch (error) {
      console.error("Failed to fetch vendors:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateVendor(editingId, formData);
      } else {
        await api.createVendor(formData as any);
      }
      resetForm();
      fetchVendors();
    } catch (error) {
      console.error("Failed to save vendor:", error);
    }
  };

  const handleEdit = (vendor: api.Vendor) => {
    setFormData({
      name: vendor.name,
      company: vendor.company,
      email: vendor.email,
      phone: vendor.phone,
      service: vendor.service,
      rate: vendor.rate,
      notes: vendor.notes || "",
      status: vendor.status,
    });
    setEditingId(vendor.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this vendor?")) {
      try {
        await api.deleteVendor(id);
        fetchVendors();
      } catch (error) {
        console.error("Failed to delete vendor:", error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      company: "",
      email: "",
      phone: "",
      service: "general",
      rate: "",
      notes: "",
      status: "active",
    });
    setShowForm(false);
    setEditingId(null);
  };

  const filteredVendors = vendors.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesService = filterService === "all" || v.service === filterService;
    return matchesSearch && matchesService;
  });

  if (loading) {
    return <div className="text-center py-12">Loading vendors...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Vendors</h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Vendor
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search vendors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select
          value={filterService}
          onChange={(e) => setFilterService(e.target.value)}
          className="input w-auto"
        >
          <option value="all">All Services</option>
          <option value="plumbing">Plumbing</option>
          <option value="electrical">Electrical</option>
          <option value="hvac">HVAC</option>
          <option value="cleaning">Cleaning</option>
          <option value="general">General</option>
          <option value="landscaping">Landscaping</option>
          <option value="painting">Painting</option>
          <option value="other">Other</option>
        </select>
      </div>

      {showForm && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? "Edit Vendor" : "New Vendor"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Vendor Name"
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
                required
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                value={formData.service}
                onChange={(e) =>
                  setFormData({ ...formData, service: e.target.value })
                }
                className="input"
              >
                <option value="plumbing">Plumbing</option>
                <option value="electrical">Electrical</option>
                <option value="hvac">HVAC</option>
                <option value="cleaning">Cleaning</option>
                <option value="general">General</option>
                <option value="landscaping">Landscaping</option>
                <option value="painting">Painting</option>
                <option value="other">Other</option>
              </select>
              <input
                type="text"
                placeholder="Rate (e.g. $50/hr)"
                value={formData.rate}
                onChange={(e) =>
                  setFormData({ ...formData, rate: e.target.value })
                }
                className="input"
              />
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="input"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
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
                Service
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Rate
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
            {filteredVendors.map((vendor) => (
              <tr key={vendor.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {vendor.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {vendor.company}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                  {vendor.service}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {vendor.phone}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {vendor.email}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {vendor.rate}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`badge ${
                      vendor.status === "active"
                        ? "badge-success"
                        : "badge-danger"
                    }`}
                  >
                    {vendor.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm space-x-2">
                  <button
                    onClick={() => handleEdit(vendor)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(vendor.id)}
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

      {filteredVendors.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-500">No vendors found. Add one to get started!</p>
        </div>
      )}
    </div>
  );
}
