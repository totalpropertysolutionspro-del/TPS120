import {
  LayoutDashboard,
  Building2,
  Users,
  Ticket,
  DollarSign,
  Wrench,
  Contact,
  CalendarDays,
  FolderOpen,
  Bell,
  Mail,
} from "lucide-react";

interface SidebarProps {
  currentPage: string;
  setCurrentPage: (page: any) => void;
}

export default function Sidebar({ currentPage, setCurrentPage }: SidebarProps) {
  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      id: "properties",
      label: "Properties",
      icon: Building2,
    },
    {
      id: "tenants",
      label: "Tenants",
      icon: Users,
    },
    {
      id: "tickets",
      label: "Tickets",
      icon: Ticket,
    },
    {
      id: "invoices",
      label: "Invoices",
      icon: DollarSign,
    },
    {
      id: "vendors",
      label: "Vendors",
      icon: Wrench,
    },
    {
      id: "contacts",
      label: "Contacts",
      icon: Contact,
    },
    {
      id: "calendar",
      label: "Calendar",
      icon: CalendarDays,
    },
    {
      id: "files",
      label: "Files",
      icon: FolderOpen,
    },
    {
      id: "reminders",
      label: "Reminders",
      icon: Bell,
    },
    {
      id: "emails",
      label: "Emails",
      icon: Mail,
    },
  ];

  return (
    <aside className="w-64 bg-gray-900 text-white h-full flex flex-col">
      <div className="p-4 border-b border-gray-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <img src="/tps-logo.png" alt="TPS Pro" className="w-10 h-10 object-contain" />
          <span className="text-lg font-bold leading-tight">TPS Pro<br/><span className="text-xs font-normal text-gray-400">Manager</span></span>
        </div>
      </div>

      <nav className="p-4 space-y-2 overflow-y-auto flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
