import NotificationBell from "./NotificationBell";

export default function Navbar() {
  return (
    <nav className="bg-white shadow">
      <div className="flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-3">
          <img src="/tps-logo.png" alt="TPS Pro" className="w-8 h-8 object-contain" />
          <h1 className="text-2xl font-bold text-gray-900">
            Total Property Solutions Pro
          </h1>
        </div>
        <div className="flex items-center gap-6">
          <NotificationBell />
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <p className="font-medium text-gray-900">Admin User</p>
              <p className="text-gray-500">Manager</p>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
