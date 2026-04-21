import { useEffect, useState } from "react";
import { Plus, X, HardHat, Calendar } from "lucide-react";
import { getStaff, createStaff, updateStaff, deleteStaff, getStaffAssignments, getProperties, deleteStaffAssignment, type Staff, type StaffAssignment, type Property } from "../api/client";
import ContactButtons from "./ContactButtons";

type FormState = { name: string; role: string; phone: string; email: string; payRate: string };

interface StaffModalProps {
  editStaff: Staff | null;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  onClose: () => void;
  handleEdit: () => void;
  handleAdd: () => void;
}

function StaffModal({ editStaff, form, setForm, onClose, handleEdit, handleAdd }: StaffModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold">{editStaff ? "Edit Staff Member" : "Add Staff Member"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-3">
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name *" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="Role (e.g. Cleaner, Supervisor)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <div className="grid grid-cols-2 gap-3">
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone" type="tel" className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Email" type="email" className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <input value={form.payRate} onChange={e => setForm(f => ({ ...f, payRate: e.target.value }))} placeholder="Pay rate ($/hr)" type="number" step="0.01" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm">Cancel</button>
          <button onClick={editStaff ? handleEdit : handleAdd} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
            {editStaff ? "Save Changes" : "Add Staff Member"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StaffPage() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [assignments, setAssignments] = useState<StaffAssignment[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"roster" | "log" | "week">("roster");
  const [showAdd, setShowAdd] = useState(false);
  const [editStaff, setEditStaff] = useState<Staff | null>(null);
  const [form, setForm] = useState<FormState>({ name: "", role: "", phone: "", email: "", payRate: "" });

  const load = () => {
    setLoading(true);
    Promise.all([getStaff(), getStaffAssignments(), getProperties()]).then(([s, a, p]) => {
      setStaffList(s.data);
      setAssignments(a.data.sort((x, y) => (y.date || "").localeCompare(x.date || "")));
      setProperties(p.data);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const propMap = Object.fromEntries(properties.map(p => [p.id, p.name]));
  const staffMap = Object.fromEntries(staffList.map(s => [s.id, s]));

  const resetForm = () => setForm({ name: "", role: "", phone: "", email: "", payRate: "" });

  const handleAdd = async () => {
    if (!form.name) return;
    try {
      await createStaff({ ...form, payRate: form.payRate ? parseFloat(form.payRate) : undefined, active: 1 });
      load(); setShowAdd(false); resetForm();
    } catch (e) { console.error(e); }
  };

  const handleEdit = async () => {
    if (!editStaff) return;
    try {
      await updateStaff(editStaff.id, { ...form, payRate: form.payRate ? parseFloat(form.payRate) : undefined });
      load(); setEditStaff(null); resetForm();
    } catch (e) { console.error(e); }
  };

  const handleToggleActive = async (s: Staff) => {
    try { await updateStaff(s.id, { active: s.active ? 0 : 1 }); load(); } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this staff member?")) return;
    try { await deleteStaff(id); load(); } catch (e) { console.error(e); }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm("Delete this assignment?")) return;
    try { await deleteStaffAssignment(id); load(); } catch (e) { console.error(e); }
  };

  const handleClose = () => { setShowAdd(false); setEditStaff(null); resetForm(); };

  // Weekly view: current week Mon–Sun
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split("T")[0];
  });

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Staff & Scheduling</h1>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
          <Plus size={15} /> Add Staff
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {(["roster", "log", "week"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-3 text-sm font-medium capitalize border-b-2 transition-colors ${tab === t ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            {t === "roster" ? "Staff Roster" : t === "log" ? "Assignment Log" : "Weekly View"}
          </button>
        ))}
      </div>

      {/* STAFF ROSTER */}
      {tab === "roster" && (
        <div>
          {staffList.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center text-gray-400 shadow-sm border border-gray-100">
              <HardHat size={40} className="mx-auto mb-3 opacity-30" />
              <p>No staff members yet</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs text-gray-500 border-b border-gray-100">
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Role</th>
                    <th className="px-4 py-3 font-semibold hidden sm:table-cell">Contact</th>
                    <th className="px-4 py-3 font-semibold hidden md:table-cell">Pay Rate</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {staffList.map(s => (
                    <tr key={s.id} className={`hover:bg-gray-50 ${!s.active ? "opacity-60" : ""}`}>
                      <td className="px-4 py-3 font-medium text-gray-800">{s.name}</td>
                      <td className="px-4 py-3 text-gray-500">{s.role || "—"}</td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <ContactButtons email={s.email} phone={s.phone} />
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{s.payRate ? `$${s.payRate}/hr` : "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {s.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => { setEditStaff(s); setForm({ name: s.name, role: s.role || "", phone: s.phone || "", email: s.email || "", payRate: String(s.payRate || "") }); }}
                            className="text-xs px-2 py-1 border border-gray-200 rounded text-gray-600 hover:bg-gray-100">Edit</button>
                          <button onClick={() => handleToggleActive(s)} className="text-xs px-2 py-1 border border-gray-200 rounded text-gray-600 hover:bg-gray-100">
                            {s.active ? "Deactivate" : "Activate"}
                          </button>
                          <button onClick={() => handleDelete(s.id)} className="text-xs px-2 py-1 border border-red-200 rounded text-red-600 hover:bg-red-50">Del</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ASSIGNMENT LOG */}
      {tab === "log" && (
        <div>
          {assignments.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center text-gray-400 shadow-sm border border-gray-100">
              <Calendar size={40} className="mx-auto mb-3 opacity-30" />
              <p>No assignments logged yet. Log assignments from a Property Hub page.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs text-gray-500 border-b border-gray-100">
                      <th className="px-4 py-3 font-semibold">Date</th>
                      <th className="px-4 py-3 font-semibold">Staff</th>
                      <th className="px-4 py-3 font-semibold">Property</th>
                      <th className="px-4 py-3 font-semibold">Hours</th>
                      <th className="px-4 py-3 font-semibold">Rate</th>
                      <th className="px-4 py-3 font-semibold">Total</th>
                      <th className="px-4 py-3 font-semibold">Notes</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {assignments.slice(0, 50).map(a => {
                      const total = a.hoursWorked && a.payRate ? `$${(a.hoursWorked * a.payRate).toFixed(2)}` : "—";
                      return (
                        <tr key={a.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2.5 text-gray-700 whitespace-nowrap">{a.date}</td>
                          <td className="px-4 py-2.5 font-medium text-gray-800">{a.staffName || staffMap[a.staffId || ""]?.name || "—"}</td>
                          <td className="px-4 py-2.5 text-gray-600 max-w-[160px] truncate">{a.propertyName || propMap[a.propertyId || ""] || "—"}</td>
                          <td className="px-4 py-2.5 text-gray-600">{a.hoursWorked ?? "—"}</td>
                          <td className="px-4 py-2.5 text-gray-600">{a.payRate ? `$${a.payRate}/hr` : "—"}</td>
                          <td className="px-4 py-2.5 font-medium text-gray-800">{total}</td>
                          <td className="px-4 py-2.5 text-gray-500 text-xs max-w-[120px] truncate">{a.notes || "—"}</td>
                          <td className="px-4 py-2.5">
                            <button onClick={() => handleDeleteAssignment(a.id)} className="text-xs px-2 py-1 border border-red-200 rounded text-red-600 hover:bg-red-50">Del</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* WEEKLY VIEW */}
      {tab === "week" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <p className="text-sm text-gray-500">Week of {weekDays[0]} – {weekDays[6]}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-3 py-2 text-left font-semibold text-gray-500 min-w-[100px]">Staff</th>
                  {weekDays.map((d, i) => (
                    <th key={d} className={`px-2 py-2 text-center font-semibold min-w-[80px] ${d === today.toISOString().split("T")[0] ? "text-blue-600" : "text-gray-500"}`}>
                      {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i]}<br />
                      <span className="text-gray-400 font-normal">{d.slice(5)}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {staffList.filter(s => s.active).map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-700">{s.name}</td>
                    {weekDays.map(day => {
                      const dayAssignments = assignments.filter(a => a.staffId === s.id && a.date === day);
                      return (
                        <td key={day} className={`px-2 py-2 text-center ${day === today.toISOString().split("T")[0] ? "bg-blue-50" : ""}`}>
                          {dayAssignments.length > 0 ? (
                            <div className="space-y-0.5">
                              {dayAssignments.map(a => (
                                <div key={a.id} className="bg-blue-100 text-blue-700 rounded px-1 py-0.5 text-xs leading-tight truncate" title={propMap[a.propertyId || ""] || ""}>
                                  {propMap[a.propertyId || ""]?.split(" ").slice(0, 2).join(" ") || "Work"}
                                  {a.hoursWorked ? ` (${a.hoursWorked}h)` : ""}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {staffList.filter(s => s.active).length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-400">No active staff members</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(showAdd || editStaff) && (
        <StaffModal
          editStaff={editStaff}
          form={form}
          setForm={setForm}
          onClose={handleClose}
          handleEdit={handleEdit}
          handleAdd={handleAdd}
        />
      )}
    </div>
  );
}
