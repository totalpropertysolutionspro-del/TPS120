import { useEffect, useState } from "react";
import { Trash2, Edit2, Plus } from "lucide-react";
import * as api from "../api/client";

export default function Properties() {
  const [properties, setProperties] = useState<api.Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    type: "apartment",
    units: 1,
    status: "active",
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const res = await api.getProperties();
      setProperties(res.data);
    } catch (error) {
      console.error("Failed to fetch properties:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateProperty(editingId, formData);
      } else {
        await api.createProperty(formData as any);
      }
      setFormData({
        name: "",
        address: "",
        type: "apartment",
        units: 1,
        status: "active",
      });
      setShowForm(false);
      setEditingId(null);
      fetchProperties();
    } catch (error) {
      console.error("Failed to save property:", error);
    }
  };

  const handleEdit = (property: api.Property) => {
    setFormData({
      name: property.name,
      address: property.address,
      type: property.type,
      units: property.units,
      status: property.status,
    });
    setEditingId(property.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this property?")) {
      try {
        await api.deleteProperty(id);
        fetchProperties();
      } catch (error) {
        console.error("Failed to delete property:", error);
      }
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading properties...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Properties</h2>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({
              name: "",
              address: "",
              type: "apartment",
              units: 1,
              status: "active",
            });
          }}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Property
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? "Edit Property" : "New Property"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Property Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="input"
              required
            />
            <input
              type="text"
              placeholder="Address"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className="input"
              required
            />
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
              className="input"
            >
              <option value="apartment">Apartment</option>
              <option value="house">House</option>
              <option value="commercial">Commercial</option>
            </select>
            <input
              type="number"
              placeholder="Units"
              value={formData.units}
              onChange={(e) =>
                setFormData({ ...formData, units: parseInt(e.target.value) })
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
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
            </select>
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary">
                {editingId ? "Update" : "Create"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
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
                Address
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Units
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
            {properties.map((property) => (
              <tr key={property.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {property.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {property.address}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {property.type}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {property.units}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`badge ${
                      property.status === "active"
                        ? "badge-success"
                        : "badge-warning"
                    }`}
                  >
                    {property.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm space-x-2">
                  <button
                    onClick={() => handleEdit(property)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(property.id)}
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

      {properties.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-500">No properties yet. Create one to get started!</p>
        </div>
      )}
    </div>
  );
}
