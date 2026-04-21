import { useState, useEffect, useRef } from "react";
import { Menu, Search, Building2, Users, Wrench } from "lucide-react";
import { search, type SearchResults } from "../api/client";
import type { Page } from "../App";

interface Props {
  navigate: (page: Page, extra?: { propertyId?: string }) => void;
  onMenuToggle: () => void;
}

export default function Navbar({ navigate, onMenuToggle }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (query.length < 2) { setResults(null); setShowDropdown(false); return; }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await search(query);
        setResults(r.data);
        setShowDropdown(true);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }, 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) && !inputRef.current?.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const hasResults = results && (results.properties.length + results.tenants.length + results.workOrders.length) > 0;

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 min-h-[60px] shrink-0">
      <button onClick={onMenuToggle} className="p-1.5 rounded hover:bg-gray-100 text-gray-500">
        <Menu size={20} />
      </button>

      <div className="relative flex-1 max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results && setShowDropdown(true)}
          placeholder="Search properties, tenants, work orders..."
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
        />
        {loading && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />}

        {showDropdown && (
          <div ref={dropdownRef} className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
            {!hasResults ? (
              <p className="p-3 text-sm text-gray-500">No results for "{query}"</p>
            ) : (
              <div className="py-1">
                {results!.properties.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                      <Building2 size={11} /> Properties
                    </div>
                    {results!.properties.map(p => (
                      <button key={p.id} onClick={() => { navigate("property-hub", { propertyId: p.id }); setShowDropdown(false); setQuery(""); }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 flex flex-col">
                        <span className="font-medium text-gray-800">{p.name}</span>
                        <span className="text-xs text-gray-500">{p.address}</span>
                      </button>
                    ))}
                  </div>
                )}
                {results!.tenants.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                      <Users size={11} /> Tenants
                    </div>
                    {results!.tenants.map(t => (
                      <button key={t.id} onClick={() => { navigate("property-hub", { propertyId: t.propertyId }); setShowDropdown(false); setQuery(""); }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 flex flex-col">
                        <span className="font-medium text-gray-800">{t.name}</span>
                        <span className="text-xs text-gray-500">Unit {t.unit}</span>
                      </button>
                    ))}
                  </div>
                )}
                {results!.workOrders.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                      <Wrench size={11} /> Work Orders
                    </div>
                    {results!.workOrders.map(w => (
                      <button key={w.id} onClick={() => { navigate("work-orders"); setShowDropdown(false); setQuery(""); }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 flex flex-col">
                        <span className="font-medium text-gray-800">{w.title}</span>
                        <span className={`text-xs font-medium ${w.status === "open" ? "text-red-500" : w.status === "in_progress" ? "text-yellow-600" : "text-green-600"}`}>{w.status}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">M</div>
      </div>
    </header>
  );
}
