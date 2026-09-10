import { NavLink, useNavigate } from "react-router-dom";
import useCattleStore from "../store/cattleStore";
import useAuthStore from "../store/authStore";
import toast from "react-hot-toast";

export default function TopNav() {
  const navigate = useNavigate();
  const { cattle } = useCattleStore();
  const { user, logout } = useAuthStore();
  const alertCount = cattle.filter((c) => c.riskLevel === "HIGH" || c.riskLevel === "MEDIUM").length;

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login", { replace: true });
  };

  return (
    <header className="bg-white border-b-2 border-[#800000] sticky top-0 z-50 shadow-sm font-sans">
      {/* ── Top University / Institutional Utility Strip ── */}
      <div className="bg-[#1e3a5f] text-white text-[11px] py-1 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <span>INDIAN DAIRY HEALTH INITIATIVE</span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-200">ICAR-NDRI VALIDATED PROTOCOLS</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-slate-300">Helpline: 1962 (Toll Free)</span>
            <span className="text-slate-400">|</span>
            <span className="text-emerald-300 font-medium">Node Uplink: Active</span>
          </div>
        </div>
      </div>

      {/* ── IIT-Style Main Brand Banner ── */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 bg-white">
        <div className="flex items-center space-x-3">
          {/* Circular Insignia Emblem */}
          <div className="w-11 h-11 rounded-full bg-[#1e3a5f] border-2 border-[#800000] text-amber-300 flex items-center justify-center font-serif font-black text-xl shadow-sm">
            LG
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-serif font-bold text-xl text-[#1e3a5f] tracking-tight leading-none">
                LactoGuard
              </h1>
            </div>
            <p className="text-[11px] text-slate-600 font-medium tracking-wide mt-0.5">
              Precision Bovine Health Intelligence & Mastitis Early Forecasting
            </p>
          </div>
        </div>

        {/* Right Header Controls: Alerts + User Profile + Logout */}
        <div className="flex items-center space-x-3 text-xs">
          {alertCount > 0 ? (
            <span className="bg-[#800000] text-white font-bold px-2.5 py-1 rounded text-xs shadow-sm">
              {alertCount} Alerts
            </span>
          ) : (
            <span className="bg-emerald-700 text-white font-semibold px-2.5 py-1 rounded text-xs">
              Herd Nominal
            </span>
          )}

          {/* User & Logout Button */}
          <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
            <div className="text-right hidden sm:block">
              <span className="font-bold text-slate-800 text-xs block leading-tight">
                {user?.name || "Ramesh Patel"}
              </span>
              <span className="text-[10px] text-slate-500 block">
                {user?.farmName || "Surabhi Farm"}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="bg-slate-100 hover:bg-red-50 hover:text-red-700 hover:border-red-300 text-slate-700 font-bold px-3 py-1.5 rounded border border-slate-300 transition-colors text-xs"
              title="Logout from portal"
            >
              Logout ⎋
            </button>
          </div>
        </div>
      </div>

      {/* ── IIT-Style Navigation Bar (Navy Blue Bar with Gold/White Links) ── */}
      <nav className="bg-[#1e3a5f] text-white">
        <div className="max-w-7xl mx-auto px-4 flex space-x-1 overflow-x-auto text-xs font-semibold uppercase tracking-wider">
          {[
            { to: "/dashboard", label: "Dashboard" },
            { to: "/cattle", label: "Cattle Registry" },
            { to: "/predict", label: "Quick Check" },
            { to: "/alerts", label: "Alerts" },
            { to: "/analytics", label: "Epidemiology" },
            { to: "/settings", label: "Configuration" },
          ].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `py-2.5 px-3.5 whitespace-nowrap transition-colors border-b-2 ${
                  isActive
                    ? "border-amber-400 text-amber-300 bg-[#162a45] font-bold"
                    : "border-transparent text-slate-200 hover:text-white hover:bg-[#162a45]/60"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </header>
  );
}
