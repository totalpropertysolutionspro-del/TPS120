import { useState } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Properties from "./components/Properties";
import Tenants from "./components/Tenants";
import WorkOrders from "./components/WorkOrders";
import Invoices from "./components/Invoices";
import Vendors from "./components/Vendors";
import Contacts from "./components/Contacts";
import Calendar from "./components/Calendar";
import Files from "./components/Files";
import Reminders from "./components/Reminders";

type Page =
  | "dashboard"
  | "properties"
  | "tenants"
  | "tickets"
  | "invoices"
  | "vendors"
  | "contacts"
  | "calendar"
  | "files"
  | "reminders";

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />;
      case "properties":
        return <Properties />;
      case "tenants":
        return <Tenants />;
      case "tickets":
        return <WorkOrders />;
      case "invoices":
        return <Invoices />;
      case "vendors":
        return <Vendors />;
      case "contacts":
        return <Contacts />;
      case "calendar":
        return <Calendar />;
      case "files":
        return <Files />;
      case "reminders":
        return <Reminders />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 overflow-auto p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default App;
