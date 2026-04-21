import { LayoutDashboard, Building2, Users, Wrench, HardHat, FolderOpen, DollarSign, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";
import type { Page } from "../App";

interface Props {
  currentPage: Page;
  navigate: (page: Page) => void;
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
}

const navItems = [
  { id: "dashboard" as Page,    label: "Dashboard",           icon: LayoutDashboard },
  { id: "properties" as Page,   label: "Properties",          icon: Building2 },
  { id: "clients" as Page,      label: "Clients / Companies", icon: Users },
  { id: "work-orders" as Page,  label: "Work Orders",         icon: Wrench },
  { id: "staff" as Page,        label: "Staff & Scheduling",  icon: HardHat },
  { id: "financials" as Page,   label: "Financials",          icon: DollarSign },
  { id: "files" as Page,        label: "Files",               icon: FolderOpen },
  { id: "messaging" as Page,    label: "Messaging",           icon: MessageSquare },
];

export default function Sidebar({ currentPage, navigate, isOpen, setIsOpen }: Props) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`
          fixed md:relative z-30 h-full bg-slate-900 text-white flex flex-col transition-all duration-200
          ${isOpen ? "w-60" : "w-0 md:w-16 overflow-hidden"}
        `}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-700 min-h-[60px]">
          {isOpen && (
            <span className="font-bold text-sm tracking-wide text-white whitespace-nowrap">
              TPS Pro Manager
            </span>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="hidden md:flex items-center justify-center w-7 h-7 rounded hover:bg-slate-700 text-slate-400 hover:text-white ml-auto"
          >
            {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          {navItems.map(({ id, label, icon: Icon }) => {
            const active = currentPage === id || (id === "properties" && currentPage === "property-hub");
            return (
              <button
                key={id}
                onClick={() => { navigate(id); if (window.innerWidth < 768) setIsOpen(false); }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors text-left
                  ${active ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"}
                `}
              >
                <Icon size={18} className="shrink-0" />
                {isOpen && <span className="truncate">{label}</span>}
              </button>
            );
          })}
        </nav>

        {isOpen && (
          <div className="px-4 py-3 border-t border-slate-700">
            <p className="text-xs text-slate-500">Total Property Solutions</p>
          </div>
        )}
      </aside>
    </>
  );
}
