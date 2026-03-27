import { useEffect, useState } from "react";
import {
  StickyNote,
  Plus,
  Edit2,
  Trash2,
  X,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import * as api from "../api/client";

const ENTITY_TYPES = [
  { value: "", label: "All" },
  { value: "tenant", label: "Tenant" },
  { value: "property", label: "Property" },
  { value: "vendor", label: "Vendor" },
  { value: "ticket", label: "Ticket" },
];

/* ============================================================
   NotesPanel - Reusable sub-component for entity-specific notes
   ============================================================ */

interface NotesPanelProps {
  entityType: string;
  entityId: string;
}

export function NotesPanel({ entityType, entityId }: NotesPanelProps) {
  const [notes, setNotes] = useState<api.Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: "", content: "" });

  useEffect(() => {
    fetchNotes();
  }, [entityType, entityId]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const res = await api.getNotes();
      const filtered = res.data.filter(
        (n) => n.entityType === entityType && n.entityId === entityId
      );
      setNotes(filtered);
    } catch (error) {
      console.error("Failed to fetch notes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateNote(editingId, formData);
      } else {
        await api.createNote({
          ...formData,
          entityType,
          entityId,
        } as any);
      }
      resetForm();
      fetchNotes();
    } catch (error) {
      console.error("Failed to save note:", error);
    }
  };

  const handleEdit = (note: api.Note) => {
    setFormData({ title: note.title, content: note.content });
    setEditingId(note.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this note?")) {
      try {
        await api.deleteNote(id);
        fetchNotes();
      } catch (error) {
        console.error("Failed to delete note:", error);
      }
    }
  };

  const resetForm = () => {
    setFormData({ title: "", content: "" });
    setShowForm(false);
    setEditingId(null);
  };

  if (loading) {
    return <div className="text-center py-4 text-sm text-gray-500">Loading notes...</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-semibold text-gray-700">Notes</h4>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="text-emerald-600 hover:text-emerald-800 text-sm flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          Add Note
        </button>
      </div>

      {showForm && (
        <div className="border rounded-lg p-3 bg-gray-50 space-y-3">
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              placeholder="Note Title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="input text-sm"
              required
            />
            <textarea
              placeholder="Note content..."
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              className="input text-sm"
              rows={3}
              required
            />
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary text-sm">
                {editingId ? "Update" : "Add"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn btn-secondary text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {notes.length === 0 && !showForm ? (
        <p className="text-gray-400 text-sm py-2">No notes yet.</p>
      ) : (
        <div className="space-y-2">
          {notes.map((note) => (
            <div
              key={note.id}
              className="border rounded-lg p-3 bg-white hover:bg-gray-50"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900">
                    {note.title}
                  </p>
                  <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                    {note.content}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(note.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0 ml-2">
                  <button
                    onClick={() => handleEdit(note)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Notes - Full page component showing all notes
   ============================================================ */

export default function Notes() {
  const [notes, setNotes] = useState<api.Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    entityType: "",
    entityId: "",
  });

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const res = await api.getNotes();
      setNotes(res.data);
    } catch (error) {
      console.error("Failed to fetch notes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateNote(editingId, formData);
      } else {
        await api.createNote(formData as any);
      }
      resetForm();
      fetchNotes();
    } catch (error) {
      console.error("Failed to save note:", error);
    }
  };

  const handleEdit = (note: api.Note) => {
    setFormData({
      title: note.title,
      content: note.content,
      entityType: note.entityType || "",
      entityId: note.entityId || "",
    });
    setEditingId(note.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this note?")) {
      try {
        await api.deleteNote(id);
        fetchNotes();
      } catch (error) {
        console.error("Failed to delete note:", error);
      }
    }
  };

  const resetForm = () => {
    setFormData({ title: "", content: "", entityType: "", entityId: "" });
    setShowForm(false);
    setEditingId(null);
  };

  const filteredNotes = notes.filter((note) => {
    const matchesType = !filterType || note.entityType === filterType;
    const matchesSearch =
      !searchQuery ||
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getEntityBadge = (entityType: string) => {
    switch (entityType) {
      case "tenant":
        return "badge-info";
      case "property":
        return "badge-success";
      case "vendor":
        return "badge-warning";
      case "ticket":
        return "badge-danger";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading notes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Notes</h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Note
        </button>
      </div>

      {showForm && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              {editingId ? "Edit Note" : "New Note"}
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
              placeholder="Note Title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="input"
              required
            />
            <textarea
              placeholder="Note content..."
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              className="input"
              rows={4}
              required
            />
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
                <option value="">No entity link</option>
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="flex gap-2">
          {ENTITY_TYPES.map((et) => (
            <button
              key={et.value}
              onClick={() => setFilterType(et.value)}
              className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                filterType === et.value
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {et.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notes List */}
      {filteredNotes.length === 0 ? (
        <div className="card text-center py-12">
          <StickyNote className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchQuery || filterType
              ? "No notes match your filters."
              : "No notes yet. Create one to get started!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <div key={note.id} className="card hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-gray-900 flex-1 min-w-0 truncate">
                  {note.title}
                </h4>
                <div className="flex gap-1 flex-shrink-0 ml-2">
                  <button
                    onClick={() => handleEdit(note)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-4">
                {note.content}
              </p>
              <div className="flex items-center justify-between mt-4 pt-3 border-t">
                {note.entityType && (
                  <span className={`badge text-xs ${getEntityBadge(note.entityType)}`}>
                    {note.entityType}
                  </span>
                )}
                <span className="text-xs text-gray-400">
                  {new Date(note.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
