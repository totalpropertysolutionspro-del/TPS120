import { useEffect, useState } from "react";
import { Send, Users, CheckSquare, Square, Plus, Clock, MessageSquare, Mail, Phone } from "lucide-react";
import emailjs from "@emailjs/browser";
import * as api from "../api/client";

const EMAILJS_SERVICE_ID = "service_aup2x7q";
const EMAILJS_TEMPLATE_ID = "template_7yh68xt";
const EMAILJS_PUBLIC_KEY = "w6gNA5WCMSUL694vt";
const FROM_EMAIL = "totalpropertysolutionspro@totalpropertysolutions.net";
const FROM_NAME = "Total Property Solutions Pro LLC";

type MsgType = "sms" | "email" | "both";
type Tab = "compose" | "history";

export interface Recipient {
  id: string;
  name: string;
  phone: string;
  email: string;
  unit?: string;
}

const TEMPLATES = [
  {
    label: "Entry Notice",
    subject: "Property Entry Notice – TPS Pro",
    body: "Hi {name}, this is TPS Pro. We'll be servicing your unit at {property} on [date]. Please ensure access. Thank you.",
  },
  {
    label: "Work Completed",
    subject: "Work Completed at Your Unit",
    body: "Hi {name}, work has been completed at your unit {unit} at {property}. Thank you for your business.",
  },
  {
    label: "Rent Reminder",
    subject: "Rent Payment Reminder",
    body: "Hi {name}, this is a friendly reminder that your rent payment is due soon. Please contact us if you have any questions. – TPS Pro",
  },
  { label: "Custom", subject: "", body: "" },
];

export default function Messaging() {
  const [tab, setTab] = useState<Tab>("compose");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Messaging</h1>
      </div>
      <div className="flex gap-1 mb-6 bg-gray-200 rounded-lg p-1 w-fit">
        {(["compose", "history"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-800"
            }`}
          >
            {t === "compose" ? "Compose" : "Message History"}
          </button>
        ))}
      </div>
      {tab === "compose" && <ComposeSection />}
      {tab === "history" && <HistorySection />}
    </div>
  );
}

export function ComposeSection({
  initialPropertyId = "",
  initialRecipients,
  onSent,
}: {
  initialPropertyId?: string;
  initialRecipients?: Recipient[];
  onSent?: () => void;
} = {}) {
  const [msgType, setMsgType] = useState<MsgType>("both");
  const [properties, setProperties] = useState<api.Property[]>([]);
  const [selectedPropId, setSelectedPropId] = useState(initialPropertyId);
  const [propertyName, setPropertyName] = useState("");
  const [availableRecipients, setAvailableRecipients] = useState<Recipient[]>(initialRecipients || []);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialRecipients?.map((r) => r.id) || []));
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    api.getProperties().then((r) => setProperties(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedPropId) {
      if (!initialRecipients) { setAvailableRecipients([]); setSelectedIds(new Set()); }
      return;
    }
    api.getProperty(selectedPropId).then((r) => {
      setPropertyName(r.data.name);
      const recs: Recipient[] = r.data.tenants.map((t) => ({
        id: t.id,
        name: t.name,
        phone: t.phone || "",
        email: t.email || "",
        unit: t.unit,
      }));
      setAvailableRecipients(recs);
      setSelectedIds(new Set(recs.map((rec) => rec.id)));
    }).catch(() => {});
  }, [selectedPropId]);

  const toggleRecipient = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const fillVariables = (text: string, r: Recipient) =>
    text.replace(/{name}/g, r.name).replace(/{unit}/g, r.unit || "").replace(/{property}/g, propertyName);

  const addManual = () => {
    if (!manualName) return;
    const rec: Recipient = { id: `manual-${Date.now()}`, name: manualName, phone: manualPhone, email: manualEmail };
    setAvailableRecipients((prev) => [...prev, rec]);
    setSelectedIds((prev) => new Set([...prev, rec.id]));
    setManualName(""); setManualPhone(""); setManualEmail(""); setShowManual(false);
  };

  const selectedRecipients = availableRecipients.filter((r) => selectedIds.has(r.id));
  const firstSelected = selectedRecipients[0];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRecipients.length === 0 || !body) return;
    setSending(true); setError(""); setSuccess("");
    try {
      const prop = properties.find((p) => p.id === selectedPropId);
      const pName = propertyName || prop?.name || "";

      if (msgType === "email" || msgType === "both") {
        for (const r of selectedRecipients) {
          if (!r.email) continue;
          await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
            to_email: r.email,
            to_name: r.name,
            from_name: FROM_NAME,
            reply_to: FROM_EMAIL,
            subject: fillVariables(subject || "Notice from TPS Pro", r),
            name: FROM_NAME,
            time: new Date().toLocaleString(),
            message: fillVariables(body, r),
          }, EMAILJS_PUBLIC_KEY);
        }
      }

      let smsError = "";
      if (msgType === "sms" || msgType === "both") {
        const phones = selectedRecipients.filter((r) => r.phone).map((r) => r.phone);
        if (phones.length > 0) {
          try {
            await api.sendSMS({
              phones,
              body: firstSelected ? fillVariables(body, firstSelected) : body,
              recipients: selectedRecipients,
              propertyId: selectedPropId || undefined,
              propertyName: pName,
            });
          } catch (err: any) {
            smsError = err?.response?.data?.setup || err?.response?.data?.error || "SMS failed — check Twilio config";
          }
        }
      }

      if (msgType === "email" || msgType === "both") {
        await api.logMessage({
          type: msgType,
          recipients: JSON.stringify(selectedRecipients.map((r) => ({ name: r.name, email: r.email, phone: r.phone }))),
          subject: firstSelected ? fillVariables(subject || "", firstSelected) : subject,
          body: firstSelected ? fillVariables(body, firstSelected) : body,
          propertyId: selectedPropId || undefined,
          propertyName: pName,
          status: "sent",
        });
      }

      if (smsError) setError(`SMS: ${smsError}`);
      setSuccess(`Sent to ${selectedRecipients.length} recipient${selectedRecipients.length !== 1 ? "s" : ""}!`);
      setBody(""); setSubject(""); setSelectedIds(new Set());
      onSent?.();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      setError(err?.text || err?.message || "Send failed. Check console.");
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSend} className="space-y-5 max-w-3xl">
      {/* Type toggle */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <label className="block text-sm font-semibold text-gray-700 mb-3">Message Type</label>
        <div className="flex gap-2 flex-wrap">
          {(["sms", "email", "both"] as MsgType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setMsgType(t)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                msgType === t ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
              }`}
            >
              {t === "sms" && <Phone size={14} />}
              {t === "email" && <Mail size={14} />}
              {t === "both" && <MessageSquare size={14} />}
              {t === "sms" ? "SMS Only" : t === "email" ? "Email Only" : "SMS + Email"}
            </button>
          ))}
        </div>
        {(msgType === "sms" || msgType === "both") && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
            SMS requires Twilio credentials — add <strong>TWILIO_ACCOUNT_SID</strong>, <strong>TWILIO_AUTH_TOKEN</strong>, and <strong>TWILIO_PHONE_NUMBER</strong> to your Render environment variables to enable SMS sending.
          </div>
        )}
      </div>

      {/* Recipient picker */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          <Users size={15} className="inline mr-1.5" />
          Recipients
        </label>
        <select
          className="w-full border rounded-lg px-3 py-2 text-sm mb-3"
          value={selectedPropId}
          onChange={(e) => setSelectedPropId(e.target.value)}
        >
          <option value="">-- Select a property to load tenants --</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {availableRecipients.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">{selectedIds.size} of {availableRecipients.length} selected</span>
              <div className="flex gap-3">
                <button type="button" onClick={() => setSelectedIds(new Set(availableRecipients.map((r) => r.id)))} className="text-xs text-blue-600 hover:text-blue-800">Select All</button>
                <button type="button" onClick={() => setSelectedIds(new Set())} className="text-xs text-gray-500 hover:text-gray-700">Deselect All</button>
              </div>
            </div>
            <div className="border rounded-lg divide-y max-h-52 overflow-y-auto">
              {availableRecipients.map((r) => (
                <label key={r.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer" onClick={() => toggleRecipient(r.id)}>
                  {selectedIds.has(r.id)
                    ? <CheckSquare size={16} className="text-blue-600 shrink-0" />
                    : <Square size={16} className="text-gray-400 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-800">{r.name}</span>
                    {r.unit && <span className="text-xs text-gray-400 ml-1.5">Unit {r.unit}</span>}
                  </div>
                  <div className="flex gap-3 text-xs text-gray-400 shrink-0">
                    {r.phone && <span><Phone size={10} className="inline mr-0.5" />{r.phone}</span>}
                    {r.email && <span><Mail size={10} className="inline mr-0.5" />{r.email}</span>}
                  </div>
                </label>
              ))}
            </div>
          </>
        )}

        <div className="mt-3">
          {!showManual ? (
            <button type="button" onClick={() => setShowManual(true)} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
              <Plus size={12} /> Add recipient manually
            </button>
          ) : (
            <div className="border rounded-lg p-3 bg-gray-50 space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <input placeholder="Name *" className="border rounded px-2 py-1.5 text-sm" value={manualName} onChange={(e) => setManualName(e.target.value)} />
                <input placeholder="Phone" className="border rounded px-2 py-1.5 text-sm" value={manualPhone} onChange={(e) => setManualPhone(e.target.value)} />
                <input placeholder="Email" className="border rounded px-2 py-1.5 text-sm" value={manualEmail} onChange={(e) => setManualEmail(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={addManual} className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700">Add</button>
                <button type="button" onClick={() => setShowManual(false)} className="text-gray-500 text-xs px-2 py-1 hover:text-gray-700">Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compose */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Quick Templates</label>
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.label}
                type="button"
                onClick={() => { setSubject(t.subject); setBody(t.body); }}
                className="px-3 py-1.5 text-xs font-medium rounded-full border border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {(msgType === "email" || msgType === "both") && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input
              type="text"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
            />
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">Message *</label>
            {(msgType === "sms" || msgType === "both") && (
              <span className={`text-xs ${body.length > 160 ? "text-red-500 font-semibold" : "text-gray-400"}`}>
                {body.length}/160 SMS chars{body.length > 160 ? " — will split into multiple SMS" : ""}
              </span>
            )}
          </div>
          <textarea
            required
            rows={5}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type your message… Use {name}, {unit}, {property} for personalization."
          />
          <p className="text-xs text-gray-400 mt-1">Variables: <code>{"{name}"}</code>, <code>{"{unit}"}</code>, <code>{"{property}"}</code></p>
        </div>

        {firstSelected && body && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
            <p className="text-xs font-semibold text-blue-700 mb-1">Preview — {firstSelected.name} (Unit {firstSelected.unit})</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{fillVariables(body, firstSelected)}</p>
          </div>
        )}

        {success && <div className="p-3 bg-green-100 text-green-700 rounded-lg text-sm font-medium">{success}</div>}
        {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}

        <button
          type="submit"
          disabled={sending || selectedRecipients.length === 0 || !body}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
        >
          <Send size={16} />
          {sending ? "Sending…" : `Send to ${selectedRecipients.length} Recipient${selectedRecipients.length !== 1 ? "s" : ""}`}
        </button>
      </div>
    </form>
  );
}

function HistorySection() {
  const [history, setHistory] = useState<api.MessageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterProp, setFilterProp] = useState("");
  const [properties, setProperties] = useState<api.Property[]>([]);

  useEffect(() => {
    api.getProperties().then((r) => setProperties(r.data)).catch(() => {});
    api.getMessageHistory().then((r) => setHistory(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = filterProp ? history.filter((m) => m.propertyId === filterProp) : history;

  if (loading) return <div className="text-gray-500 text-sm py-8">Loading history…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <select className="border rounded-lg px-3 py-2 text-sm" value={filterProp} onChange={(e) => setFilterProp(e.target.value)}>
          <option value="">All Properties</option>
          {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <span className="text-sm text-gray-500">{filtered.length} message{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Clock size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400">No messages sent yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {["Date", "Type", "Property", "Recipients", "Message", "Status"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((m) => {
                let recs: any[] = [];
                try { recs = JSON.parse(m.recipients); } catch { /* */ }
                return (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
                      {m.sentAt ? new Date(m.sentAt).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        m.type === "sms" ? "bg-purple-100 text-purple-700"
                          : m.type === "email" ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700"
                      }`}>
                        {m.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-xs">{m.propertyName || "—"}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{recs.length > 0 ? `${recs.length} recipient${recs.length !== 1 ? "s" : ""}` : "—"}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate text-xs">{m.body}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        m.status === "sent" ? "bg-green-100 text-green-700"
                          : m.status === "failed" ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {m.status || "sent"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
