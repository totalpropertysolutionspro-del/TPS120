import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  DollarSign,
  Hammer,
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
      id: "workorders",
      label: "Work Orders",
      icon: Hammer,
    },
    {
      id: "invoices",
      label: "Invoices",
      icon: DollarSign,
    },
    {
      id: "staff",
      label: "Staff",
      icon: FileText,
    },
  ];

  return (
    <aside className="w-64 bg-gray-900 text-white">
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Building2 className="w-8 h-8" />
          <span className="text-xl font-bold">TPSP</span>
        </div>
      </div>

      <nav className="p-4 space-y-2">
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
