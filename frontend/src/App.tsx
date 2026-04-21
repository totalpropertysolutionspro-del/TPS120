import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import Properties from "./components/Properties";
import PropertyHub from "./components/PropertyHub";
import Clients from "./components/Clients";
import WorkOrders from "./components/WorkOrders";
import Staff from "./components/Staff";
import Files from "./components/Files";
import Financials from "./components/Financials";

export type Page = "dashboard" | "properties" | "property-hub" | "clients" | "work-orders" | "staff" | "files" | "financials";

export interface NavState {
  page: Page;
  propertyId?: string;
  clientId?: string;
}

function App() {
  const [nav, setNav] = useState<NavState>({ page: "dashboard" });
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navigate = (page: Page, extra?: { propertyId?: string; clientId?: string }) => {
    setNav({ page, ...extra });
  };

  const renderPage = () => {
    switch (nav.page) {
      case "dashboard":
        return <Dashboard navigate={navigate} />;
      case "properties":
        return <Properties navigate={navigate} />;
      case "property-hub":
        return <PropertyHub propertyId={nav.propertyId!} navigate={navigate} />;
      case "clients":
        return <Clients navigate={navigate} />;
      case "work-orders":
        return <WorkOrders navigate={navigate} propertyId={nav.propertyId} />;
      case "staff":
        return <Staff />;
      case "files":
        return <Files />;
      case "financials":
        return <Financials />;
      default:
        return <Dashboard navigate={navigate} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar
        currentPage={nav.page}
        navigate={navigate}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar navigate={navigate} onMenuToggle={() => setSidebarOpen(o => !o)} />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default App;
