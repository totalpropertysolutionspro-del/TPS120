import {
  LayoutDashboard, Building2, ClipboardList, Calendar, MessageSquare,
  Users, HardHat, Briefcase, DollarSign, FolderOpen, Settings, Home,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Page } from "../App";

interface Props {
  currentPage: Page;
  navigate: (page: Page) => void;
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
}

type SubItem = { id: Page; label: string };
type NavItem = { id: Page; label: string; icon: LucideIcon; subItems?: SubItem[] };
type Section = { title: string; items: NavItem[] };

const sections: Section[] = [
  {
    title: "OVERVIEW",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "PROPERTIES",
    items: [
      {
        id: "properties",
        label: "All Properties",
        icon: Building2,
        subItems: [
          { id: "properties", label: "Commercial" },
          { id: "properties", label: "Residential" },
        ],
      },
    ],
  },
  {
    title: "OPERATIONS",
    items: [
      { id: "work-orders", label: "Work Orders", icon: ClipboardList },
      { id: "staff", label: "Scheduling", icon: Calendar },
      { id: "messaging", label: "Messages & Notices", icon: MessageSquare },
    ],
  },
  {
    title: "PEOPLE",
    items: [
      { id: "clients", label: "Tenants", icon: Users },
      { id: "staff", label: "Staff", icon: HardHat },
      { id: "clients", label: "Clients", icon: Briefcase },
    ],
  },
  {
    title: "BUSINESS",
    items: [
      { id: "financials", label: "Financials", icon: DollarSign },
      { id: "files", label: "Documents", icon: FolderOpen },
    ],
  },
];

const mobileTabs: { id: Page; label: string; icon: LucideIcon }[] = [
  { id: "dashboard", label: "Home", icon: Home },
  { id: "properties", label: "Properties", icon: Building2 },
  { id: "work-orders", label: "Work Orders", icon: ClipboardList },
  { id: "messaging", label: "Messages", icon: MessageSquare },
  { id: "financials", label: "Finances", icon: DollarSign },
];

export default function Sidebar({ currentPage, navigate, isOpen, setIsOpen }: Props) {
  const handleNav = (page: Page) => {
    navigate(page);
    if (window.innerWidth < 768) setIsOpen(false);
  };

  const isActive = (id: Page) =>
    currentPage === id || (id === "properties" && currentPage === "property-hub");

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:relative z-30 h-full flex flex-col
          bg-[#1e293b] text-slate-300 w-[220px] shrink-0
          transition-transform duration-200
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Brand header */}
        <div className="flex items-center px-5 min-h-[60px] border-b border-slate-700/60">
          <span className="font-semibold text-sm tracking-wide text-white leading-none">
            TPS Pro Manager
          </span>
        </div>

        {/* Scrollable nav sections */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-5">
          {sections.map((section) => (
            <div key={section.title}>
              <p className="px-5 pb-1.5 text-[10px] font-semibold tracking-[0.12em] text-[#64748b] uppercase select-none">
                {section.title}
              </p>

              {section.items.map(({ id, label, icon: Icon, subItems }) => (
                <div key={`${id}-${label}`}>
                  <button
                    onClick={() => handleNav(id)}
                    className={`
                      w-full flex items-center gap-3 px-5 py-[11px] text-sm font-medium transition-colors text-left
                      ${isActive(id)
                        ? "bg-blue-600 text-white"
                        : "text-slate-300 hover:bg-slate-700/50 hover:text-white"}
                    `}
                  >
                    <Icon size={17} className="shrink-0" />
                    <span className="truncate">{label}</span>
                  </button>

                  {subItems?.map((sub) => (
                    <button
                      key={sub.label}
                      onClick={() => handleNav(sub.id)}
                      className="w-full flex items-center pl-[52px] pr-5 py-[7px] text-[12.5px] text-slate-400 hover:text-white hover:bg-slate-700/30 transition-colors text-left"
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </nav>

        {/* Settings pinned to bottom */}
        <div className="border-t border-slate-700/60">
          <button
            onClick={() => handleNav("settings")}
            className={`
              w-full flex items-center gap-3 px-5 py-[11px] text-sm font-medium transition-colors text-left
              ${currentPage === "settings"
                ? "bg-blue-600 text-white"
                : "text-slate-300 hover:bg-slate-700/50 hover:text-white"}
            `}
          >
            <Settings size={17} className="shrink-0" />
            <span>Settings</span>
          </button>
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#1e293b] border-t border-slate-700/60 flex">
        {mobileTabs.map(({ id, label, icon: Icon }) => (
          <button
            key={`tab-${id}`}
            onClick={() => handleNav(id)}
            className={`
              flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-medium transition-colors
              ${isActive(id) ? "text-blue-400" : "text-slate-400 hover:text-white"}
            `}
          >
            <Icon size={20} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
