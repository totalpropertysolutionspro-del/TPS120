import { useEffect, useState } from "react";
import { Trash2, Edit2, Plus, Send, Mail, FileText, Clock, Users, CheckSquare, Square } from "lucide-react";
import * as api from "../api/client";

type Tab = "compose" | "notice" | "templates" | "sent";

const TEMPLATE_TYPES = ["notice", "invoice", "reminder", "welcome", "custom"];

export default function Emails() {
  const [activeTab, setActiveTab] = useState<Tab>("compose");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Emails &amp; Notices</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-200 rounded-lg p-1 w-fit">
        {([
          { id: "compose" as Tab, label: "Compose", icon: Mail },
          { id: "notice" as Tab, label: "Send Notice", icon: Users },
          { id: "templates" as Tab, label: "Templates", icon: FileText },
          { id: "sent" as Tab, label: "Sent", icon: Clock },
        ]).map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "compose" && <ComposeTab />}
      {activeTab === "notice" && <NoticeTab />}
      {activeTab === "templates" && <TemplatesTab />}
      {activeTab === "sent" && <SentTab />}
    </div>
  );
}

/* ========================= COMPOSE TAB ========================= */
function ComposeTab() {
  const [templates, setTemplates] = useState<api.EmailTemplate[]>([]);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    to: "",
    toName: "",
    subject: "",
    body: "",
    templateId: "",
  });

  useEffect(() => {
    api.getEmailTemplates().then((r) => setTemplates(r.data)).catch(() => {});
  }, []);

  const applyTemplate = (templateId: string) => {
    const t = templates.find((x) => x.id === templateId);
    if (t) {
      setFormData((prev) => ({ ...prev, subject: t.subject, body: t.body, templateId: t.id }));
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.to || !formData.subject || !formData.body) return;
    try {
      setSending(true);
      setError("");
      await api.sendEmail({
        to: formData.to,
        toName: formData.toName || undefined,
        subject: formData.subject,
        body: formData.body,
        templateId: formData.templateId || undefined,
      });
      setSuccess("Email queued successfully!");
      setFormData({ to: "", toName: "", subject: "", body: "", templateId: "" });
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error("Failed to send email:", err);
      setError(err?.response?.data?.error || "Failed to send email. Please try again.");
      setTimeout(() => setError(""), 5000);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
      <h2 className="text-lg font-semibold mb-4">Compose Email</h2>
      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">{success}</div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>
      )}
      <form onSubmit={handleSend} className="space-y-4">
        {templates.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Use Template</label>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={formData.templateId}
              onChange={(e) => { setFormData((p) => ({ ...p, templateId: e.target.value })); applyTemplate(e.target.value); }}
            >
              <option value="">-- None --</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.type})</option>
              ))}
            </select>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To (Email) *</label>
            <input
              type="email"
              required
              className="w-full border rounded-lg px-3 py-2"
              value={formData.to}
              onChange={(e) => setFormData((p) => ({ ...p, to: e.target.value }))}
              placeholder="recipient@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Name</label>
            <input
              type="text"
              className="w-full border rounded-lg px-3 py-2"
              value={formData.toName}
              onChange={(e) => setFormData((p) => ({ ...p, toName: e.target.value }))}
              placeholder="John Doe"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
          <input
            type="text"
            required
            className="w-full border rounded-lg px-3 py-2"
            value={formData.subject}
            onChange={(e) => setFormData((p) => ({ ...p, subject: e.target.value }))}
            placeholder="Email subject"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Body *</label>
          <textarea
            required
            rows={8}
            className="w-full border rounded-lg px-3 py-2"
            value={formData.body}
            onChange={(e) => setFormData((p) => ({ ...p, body: e.target.value }))}
            placeholder="Write your email here..."
          />
        </div>
        <button
          type="submit"
          disabled={sending}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          {sending ? "Sending..." : "Send Email"}
        </button>
      </form>
    </div>
  );
}

/* ========================= NOTICE TAB ========================= */
function NoticeTab() {
  const [tenants, setTenants] = useState<api.Tenant[]>([]);
  const [contacts, setContacts] = useState<api.Contact[]>([]);
  const [templates, setTemplates] = useState<api.EmailTemplate[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({ subject: "", body: "", templateId: "" });

  useEffect(() => {
    api.getTenants().then((r) => setTenants(r.data)).catch(() => {});
    api.getContacts().then((r) => setContacts(r.data)).catch(() => {});
    api.getEmailTemplates().then((r) => setTemplates(r.data)).catch(() => {});
  }, []);

  const toggleEmail = (email: string) => {
    setSelectedEmails((prev) => {
      const next = new Set(prev);
      next.has(email) ? next.delete(email) : next.add(email);
      return next;
    });
  };

  const selectAllTenants = () => {
    const tenantEmails = tenants.filter((t) => t.email).map((t) => t.email);
    setSelectedEmails(new Set(tenantEmails));
  };

  const applyTemplate = (templateId: string) => {
    const t = templates.find((x) => x.id === templateId);
    if (t) setFormData((p) => ({ ...p, subject: t.subject, body: t.body, templateId: t.id }));
  };

  const handleSendNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEmails.size === 0 || !formData.subject || !formData.body) return;
    try {
      setSending(true);
      setError("");
      await api.sendNotice({
        toEmails: Array.from(selectedEmails),
        subject: formData.subject,
        body: formData.body,
        templateId: formData.templateId || undefined,
      });
      setSuccess(`Notice queued for ${selectedEmails.size} recipient(s)!`);
      setSelectedEmails(new Set());
      setFormData({ subject: "", body: "", templateId: "" });
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error("Failed to send notice:", err);
      setError(err?.response?.data?.error || "Failed to send notice. Please try again.");
      setTimeout(() => setError(""), 5000);
    } finally {
      setSending(false);
    }
  };

  const allRecipients = [
    ...tenants.filter((t) => t.email).map((t) => ({ name: t.name, email: t.email, type: "Tenant" })),
    ...contacts.filter((c) => c.email).map((c) => ({ name: c.name, email: c.email, type: "Contact" })),
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Send Notice</h2>
      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">{success}</div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>
      )}
      <form onSubmit={handleSendNotice} className="space-y-4">
        {/* Recipients */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Select Recipients ({selectedEmails.size} selected)
            </label>
            <button type="button" onClick={selectAllTenants} className="text-sm text-blue-600 hover:text-blue-800">
              Select All Tenants
            </button>
          </div>
          <div className="border rounded-lg max-h-48 overflow-y-auto p-2 space-y-1">
            {allRecipients.length === 0 && (
              <p className="text-sm text-gray-400 p-2">No tenants or contacts with emails found.</p>
            )}
            {allRecipients.map((r) => (
              <label
                key={r.email}
                className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 cursor-pointer"
              >
                {selectedEmails.has(r.email) ? (
                  <CheckSquare className="w-4 h-4 text-blue-600" onClick={() => toggleEmail(r.email)} />
                ) : (
                  <Square className="w-4 h-4 text-gray-400" onClick={() => toggleEmail(r.email)} />
                )}
                <span className="text-sm">{r.name}</span>
                <span className="text-xs text-gray-400">{r.email}</span>
                <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{r.type}</span>
              </label>
            ))}
          </div>
        </div>

        {templates.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Use Template</label>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={formData.templateId}
              onChange={(e) => { setFormData((p) => ({ ...p, templateId: e.target.value })); applyTemplate(e.target.value); }}
            >
              <option value="">-- None --</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.type})</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
          <input
            type="text"
            required
            className="w-full border rounded-lg px-3 py-2"
            value={formData.subject}
            onChange={(e) => setFormData((p) => ({ ...p, subject: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Body *</label>
          <textarea
            required
            rows={6}
            className="w-full border rounded-lg px-3 py-2"
            value={formData.body}
            onChange={(e) => setFormData((p) => ({ ...p, body: e.target.value }))}
          />
        </div>
        <button
          type="submit"
          disabled={sending || selectedEmails.size === 0}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          {sending ? "Sending..." : `Send to ${selectedEmails.size} Recipient(s)`}
        </button>
      </form>
    </div>
  );
}

/* ========================= TEMPLATES TAB ========================= */
function TemplatesTab() {
  const [templates, setTemplates] = useState<api.EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", subject: "", body: "", type: "custom" });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await api.getEmailTemplates();
      setTemplates(res.data);
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: "", subject: "", body: "", type: "custom" });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateEmailTemplate(editingId, formData);
      } else {
        await api.createEmailTemplate(formData);
      }
      resetForm();
      fetchTemplates();
    } catch (error) {
      console.error("Failed to save template:", error);
    }
  };

  const handleEdit = (t: api.EmailTemplate) => {
    setFormData({ name: t.name, subject: t.subject, body: t.body, type: t.type });
    setEditingId(t.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    try {
      await api.deleteEmailTemplate(id);
      fetchTemplates();
    } catch (error) {
      console.error("Failed to delete template:", error);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Email Templates</h2>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          New Template
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-md font-semibold mb-4">{editingId ? "Edit Template" : "New Template"}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  className="w-full border rounded-lg px-3 py-2"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Template name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  className="w-full border rounded-lg px-3 py-2"
                  value={formData.type}
                  onChange={(e) => setFormData((p) => ({ ...p, type: e.target.value }))}
                >
                  {TEMPLATE_TYPES.map((t) => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
              <input
                type="text"
                required
                className="w-full border rounded-lg px-3 py-2"
                value={formData.subject}
                onChange={(e) => setFormData((p) => ({ ...p, subject: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Body *</label>
              <textarea
                required
                rows={6}
                className="w-full border rounded-lg px-3 py-2"
                value={formData.body}
                onChange={(e) => setFormData((p) => ({ ...p, body: e.target.value }))}
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                {editingId ? "Update" : "Create"}
              </button>
              <button type="button" onClick={resetForm} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : templates.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No templates yet. Create one to get started.
        </div>
      ) : (
        <div className="grid gap-4">
          {templates.map((t) => (
            <div key={t.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-800">{t.name}</h3>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                      {t.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1"><strong>Subject:</strong> {t.subject}</p>
                  <p className="text-sm text-gray-500 line-clamp-2">{t.body}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(t)} className="p-2 text-gray-400 hover:text-blue-600">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(t.id)} className="p-2 text-gray-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
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

/* ========================= SENT TAB ========================= */
function SentTab() {
  const [emails, setEmails] = useState<api.SentEmail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSent();
  }, []);

  const fetchSent = async () => {
    try {
      setLoading(true);
      const res = await api.getSentEmails();
      setEmails(res.data);
    } catch (error) {
      console.error("Failed to fetch sent emails:", error);
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "sent": return "bg-green-100 text-green-700";
      case "failed": return "bg-red-100 text-red-700";
      default: return "bg-yellow-100 text-yellow-700";
    }
  };

  if (loading) return <div className="text-gray-500">Loading...</div>;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Sent Emails</h2>
      </div>
      {emails.length === 0 ? (
        <div className="p-8 text-center text-gray-500">No emails sent yet.</div>
      ) : (
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recipient</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {emails.map((e) => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                  {new Date(e.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm text-gray-800">
                  {e.toName ? `${e.toName} <${e.toEmail}>` : e.toEmail}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{e.subject}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${statusColor(e.status)}`}>
                    {e.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
