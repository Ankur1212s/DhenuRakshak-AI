import { NavLink } from "react-router-dom";
import useCattleStore from "../store/cattleStore";

export default function TopNav() {
  const { cattle } = useCattleStore();
  const suspiciousCount = cattle.filter((c) => c.riskLevel === "MEDIUM").length;
  const sickCount = cattle.filter((c) => c.riskLevel === "HIGH").length;

  return (
    <header className="bg-[#1e293b] text-white sticky top-0 z-50 shadow-md">
      {/* Top Header Bar */}
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Brand & Farm Name */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm shadow">
            CM
          </div>
          <div>
            <div className="font-bold text-base leading-tight tracking-tight flex items-center gap-1.5">
              <span>DhenuRakshak</span>
              <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-normal">
                Ear Sensor Live
              </span>
            </div>
            <div className="text-[11px] text-slate-400">Surabhi Dairy Farm • Herd Health Monitor</div>
          </div>
        </div>

        {/* CowManager Alert Tally Indicators */}
        <div className="flex items-center space-x-2 text-xs font-semibold">
          {sickCount > 0 && (
            <span className="flex items-center gap-1 bg-red-600/90 text-white px-2.5 py-1 rounded shadow-sm">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span>{sickCount} SICK</span>
            </span>
          )}
          {suspiciousCount > 0 && (
            <span className="flex items-center gap-1 bg-amber-500 text-slate-950 px-2.5 py-1 rounded shadow-sm font-bold">
              <span>{suspiciousCount} SUSPICIOUS</span>
            </span>
          )}
          {sickCount === 0 && suspiciousCount === 0 && (
            <span className="bg-emerald-600/80 text-white px-2.5 py-1 rounded">
              ALL HEALTHY
            </span>
          )}
        </div>
      </div>

      {/* CowManager Module Navigation Bar */}
      <div className="bg-[#0f172a] border-t border-slate-700/60 px-4">
        <div className="max-w-7xl mx-auto flex space-x-1 overflow-x-auto text-xs">
          {[
            { to: "/dashboard", label: "Health Monitor" },
            { to: "/cattle", label: "Cow List" },
            { to: "/predict", label: "Quick Check" },
            { to: "/alerts", label: "Health Alerts" },
            { to: "/analytics", label: "Nutrition & Rumination" },
            { to: "/settings", label: "Farm Settings" },
          ].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `py-2.5 px-4 font-medium transition-colors border-b-2 whitespace-nowrap ${
                  isActive
                    ? "border-amber-400 text-amber-300 bg-slate-800/60 font-bold"
                    : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>
    </header>
  );
}
