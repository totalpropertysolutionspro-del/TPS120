import { useEffect, useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  X,
  List,
  LayoutGrid,
  Clock,
} from "lucide-react";
import * as api from "../api/client";

const EVENT_TYPES = [
  { value: "appointment", label: "Appointment", color: "bg-blue-500" },
  { value: "reminder", label: "Reminder", color: "bg-yellow-500" },
  { value: "deadline", label: "Deadline", color: "bg-red-500" },
  { value: "meeting", label: "Meeting", color: "bg-emerald-500" },
  { value: "other", label: "Other", color: "bg-gray-500" },
];

const COLOR_OPTIONS = [
  "#10b981",
  "#3b82f6",
  "#ef4444",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#6b7280",
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function formatDate(d: Date) {
  return d.toISOString().split("T")[0];
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function Calendar() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [events, setEvents] = useState<api.CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    allDay: false,
    type: "appointment",
    entityType: "",
    entityId: "",
    color: "#10b981",
  });

  useEffect(() => {
    fetchEvents();
  }, [currentMonth, currentYear]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.getCalendarEvents();
      setEvents(res.data);
    } catch (error) {
      console.error("Failed to fetch calendar events:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateCalendarEvent(editingId, formData);
      } else {
        await api.createCalendarEvent(formData as any);
      }
      resetForm();
      fetchEvents();
    } catch (error) {
      console.error("Failed to save event:", error);
    }
  };

  const handleEdit = (event: api.CalendarEvent) => {
    setFormData({
      title: event.title,
      description: event.description || "",
      startDate: event.startDate,
      endDate: event.endDate,
      allDay: event.allDay,
      type: event.type,
      entityType: event.entityType || "",
      entityId: event.entityId || "",
      color: event.color || "#10b981",
    });
    setEditingId(event.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this event?")) {
      try {
        await api.deleteCalendarEvent(id);
        fetchEvents();
      } catch (error) {
        console.error("Failed to delete event:", error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      allDay: false,
      type: "appointment",
      entityType: "",
      entityId: "",
      color: "#10b981",
    });
    setShowForm(false);
    setEditingId(null);
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDate(formatDate(today));
  };

  const getEventsForDate = (dateStr: string) => {
    return events.filter((ev) => {
      const evStart = ev.startDate.split("T")[0];
      const evEnd = ev.endDate ? ev.endDate.split("T")[0] : evStart;
      return dateStr >= evStart && dateStr <= evEnd;
    });
  };

  const getEventTypeColor = (type: string) => {
    return EVENT_TYPES.find((t) => t.value === type)?.color || "bg-gray-500";
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const monthName = new Date(currentYear, currentMonth).toLocaleString("default", {
    month: "long",
  });

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  const upcomingEvents = [...events]
    .filter((ev) => new Date(ev.startDate) >= new Date(formatDate(today)))
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

  if (loading) {
    return <div className="text-center py-12">Loading calendar...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Calendar</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            className="btn btn-secondary flex items-center gap-2"
          >
            {viewMode === "grid" ? (
              <List className="w-4 h-4" />
            ) : (
              <LayoutGrid className="w-4 h-4" />
            )}
            {viewMode === "grid" ? "List" : "Grid"}
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Event
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              {editingId ? "Edit Event" : "New Event"}
            </h3>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Event Title"
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
                  Start
                </label>
                <input
                  type={formData.allDay ? "date" : "datetime-local"}
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End
                </label>
                <input
                  type={formData.allDay ? "date" : "datetime-local"}
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  className="input"
                  required
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="allDay"
                checked={formData.allDay}
                onChange={(e) =>
                  setFormData({ ...formData, allDay: e.target.checked })
                }
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="allDay" className="text-sm text-gray-700">
                All Day
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                className="input"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
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
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <div className="flex gap-2">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: c })}
                    className={`w-8 h-8 rounded-full border-2 ${
                      formData.color === c
                        ? "border-gray-900 scale-110"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary">
                {editingId ? "Update" : "Create"}
              </button>
              <button type="button" onClick={resetForm} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {viewMode === "grid" ? (
        <div className="flex gap-6">
          {/* Calendar Grid */}
          <div className="card flex-1">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={prevMonth}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h3 className="text-xl font-semibold text-gray-900">
                  {monthName} {currentYear}
                </h3>
                <button
                  onClick={nextMonth}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              <button onClick={goToToday} className="btn btn-secondary text-sm">
                Today
              </button>
            </div>

            <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="bg-gray-50 py-2 text-center text-xs font-medium text-gray-500 uppercase"
                >
                  {day}
                </div>
              ))}
              {calendarDays.map((day, idx) => {
                if (day === null) {
                  return (
                    <div key={`empty-${idx}`} className="bg-white min-h-[80px]" />
                  );
                }
                const dateStr = `${currentYear}-${String(
                  currentMonth + 1
                ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const dayEvents = getEventsForDate(dateStr);
                const isToday = dateStr === formatDate(today);
                const isSelected = dateStr === selectedDate;

                return (
                  <div
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`bg-white min-h-[80px] p-1 cursor-pointer hover:bg-emerald-50 transition-colors ${
                      isSelected ? "ring-2 ring-emerald-500 ring-inset" : ""
                    }`}
                  >
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 text-sm rounded-full ${
                        isToday
                          ? "bg-emerald-600 text-white font-bold"
                          : "text-gray-700"
                      }`}
                    >
                      {day}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {dayEvents.slice(0, 3).map((ev) => (
                        <div
                          key={ev.id}
                          className="text-xs truncate rounded px-1 py-0.5 text-white"
                          style={{ backgroundColor: ev.color || "#10b981" }}
                        >
                          {ev.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-gray-500 pl-1">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Side Panel */}
          {selectedDate && (
            <div className="card w-80">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  {new Date(selectedDate + "T00:00:00").toLocaleDateString(
                    "default",
                    {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    }
                  )}
                </h3>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {selectedDateEvents.length === 0 ? (
                <p className="text-gray-500 text-sm">No events on this day.</p>
              ) : (
                <div className="space-y-3">
                  {selectedDateEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="border-l-4 rounded p-3 bg-gray-50"
                      style={{ borderColor: ev.color || "#10b981" }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm text-gray-900">
                            {ev.title}
                          </p>
                          {!ev.allDay && (
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(ev.startDate)} -{" "}
                              {formatTime(ev.endDate)}
                            </p>
                          )}
                          {ev.allDay && (
                            <p className="text-xs text-gray-500 mt-1">
                              All Day
                            </p>
                          )}
                          <span
                            className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full text-white ${getEventTypeColor(
                              ev.type
                            )}`}
                          >
                            {ev.type}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEdit(ev)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(ev.id)}
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
          )}
        </div>
      ) : (
        /* List View */
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Upcoming Events</h3>
          {upcomingEvents.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No upcoming events.
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-center justify-between border rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: ev.color || "#10b981" }}
                    />
                    <div>
                      <p className="font-medium text-gray-900">{ev.title}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(ev.startDate).toLocaleDateString()} &middot;{" "}
                        {ev.allDay ? "All Day" : formatTime(ev.startDate)}
                      </p>
                      <span
                        className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full text-white ${getEventTypeColor(
                          ev.type
                        )}`}
                      >
                        {ev.type}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(ev)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(ev.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {events.length === 0 && !showForm && (
        <div className="card text-center py-12">
          <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            No events yet. Create one to get started!
          </p>
        </div>
      )}
    </div>
  );
}
