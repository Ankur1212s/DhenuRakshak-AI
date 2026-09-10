import { NavLink } from "react-router-dom";
import useCattleStore from "../store/cattleStore";

export default function TopNav() {
  const { cattle } = useCattleStore();
  const alertCount = cattle.filter((c) => c.riskLevel === "HIGH" || c.riskLevel === "MEDIUM").length;

  const links = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/cattle", label: "Cattle List" },
    { to: "/predict", label: "Health Check" },
    { to: "/alerts", label: "Alerts", count: alertCount },
    { to: "/analytics", label: "Reports" },
    { to: "/settings", label: "Settings" },
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Simple Brand */}
        <div className="flex items-center space-x-2">
          <span className="text-xl">🐄</span>
          <span className="font-bold text-gray-900 text-base">DhenuRakshak</span>
          <span className="text-xs bg-green-100 text-green-800 font-medium px-2 py-0.5 rounded ml-2">
            Online
          </span>
        </div>

        {/* Clean Menu Bar */}
        <nav className="flex space-x-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-gray-100 text-gray-900 font-semibold"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`
              }
            >
              {link.label}
              {link.count > 0 && (
                <span className="ml-1.5 bg-amber-100 text-amber-800 text-xs px-1.5 py-0.2 rounded-full font-bold">
                  {link.count}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
