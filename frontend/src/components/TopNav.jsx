import { NavLink } from "react-router-dom";
import { Terminal, Layers, Stethoscope, Bell, LineChart, BookOpen, Settings, Power, ShieldCheck } from "lucide-react";
import useCattleStore from "../store/cattleStore";

const navItems = [
  { to: "/dashboard", label: "01_CONSOLE" },
  { to: "/cattle", label: "02_HOST_REGISTRY" },
  { to: "/predict", label: "03_DIAGNOSTIC_SCAN" },
  { to: "/alerts", label: "04_ALERTS" },
  { to: "/analytics", label: "05_EPIDEMIOLOGY" },
  { to: "/knowledge", label: "06_DOCS_ICAR" },
  { to: "/settings", label: "07_SYSTEM_CONFIG" },
];

export default function TopNav() {
  const { cattle } = useCattleStore();
  const atRisk = cattle.filter((c) => c.riskLevel === "HIGH").length;

  return (
    <header className="bg-[#161b22] border-b border-[#30363d] sticky top-0 z-50 font-mono text-xs select-none">
      {/* Top utility bar (Nmap/Wireshark menu style) */}
      <div className="max-w-7xl mx-auto px-3 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 font-bold text-[#f0f6fc]">
            <span className="w-2.5 h-2.5 bg-[#238636] rounded-sm" />
            <span className="tracking-widest">DHENURAKSHAK-OS</span>
            <span className="text-[10px] text-[#8b949e] border border-[#30363d] px-1.5 py-0.2 rounded">v3.2</span>
          </div>

          <div className="hidden md:flex items-center space-x-2 text-[11px] text-[#8b949e] pl-2 border-l border-[#30363d]">
            <span>NODE_PROFILE:</span>
            <span className="text-[#58a6ff]">EAR-TAG INT1 (EXT0 SLEEP)</span>
          </div>
        </div>

        {/* Global telemetry state indicator */}
        <div className="flex items-center space-x-2 text-[11px]">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-[#30363d] bg-[#0d1117] text-[#3fb950]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950] animate-pulse" />
            <span>CLOUD_LINK: ONLINE</span>
          </span>
          <span className="text-[#8b949e] border border-[#30363d] bg-[#0d1117] px-2 py-0.5 rounded">
            BURST: 5m
          </span>
          {atRisk > 0 && (
            <span className="bg-[#f85149] text-black font-bold px-2 py-0.5 rounded">
              CRIT_ALERTS: {atRisk}
            </span>
          )}
        </div>
      </div>

      {/* Primary Top Tab Menu */}
      <div className="border-t border-[#30363d] bg-[#0d1117] overflow-x-auto">
        <div className="max-w-7xl mx-auto px-3 flex space-x-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `px-3.5 py-2 border-b-2 text-xs font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? "border-[#238636] text-[#f0f6fc] bg-[#161b22]"
                    : "border-transparent text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#161b22]/40"
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
