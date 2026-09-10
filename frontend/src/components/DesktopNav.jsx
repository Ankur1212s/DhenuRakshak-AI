import { NavLink } from "react-router-dom";
import { Terminal, Layers, Stethoscope, Bell, LineChart, BookOpen, Settings, Power } from "lucide-react";
import useCattleStore from "../store/cattleStore";

const navItems = [
  { to: "/dashboard", icon: Terminal, label: "Console" },
  { to: "/cattle", icon: Layers, label: "Host Registry" },
  { to: "/predict", icon: Stethoscope, label: "Audit Scan" },
  { to: "/alerts", icon: Bell, label: "Alerts" },
  { to: "/analytics", icon: LineChart, label: "Analytics" },
  { to: "/knowledge", icon: BookOpen, label: "Docs / ICAR" },
  { to: "/settings", icon: Settings, label: "Config" },
];

export default function DesktopNav() {
  const { cattle } = useCattleStore();
  const atRisk = cattle.filter((c) => c.riskLevel === "HIGH").length;

  return (
    <aside className="hidden lg:flex flex-col w-56 bg-[#161b22] border-r border-[#30363d] h-screen sticky top-0 shrink-0 select-none z-40 font-mono text-xs">
      {/* Brand Header */}
      <div className="p-3.5 border-b border-[#30363d]">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 bg-[#238636] text-black rounded flex items-center justify-center font-bold">
            DR
          </div>
          <div>
            <div className="font-bold text-[#f0f6fc] tracking-wider text-xs">
              DHENURAKSHAK
            </div>
            <div className="text-[10px] text-[#8b949e]">
              EAR-TAG CONSOLE
            </div>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded transition-colors ${
                  isActive
                    ? "bg-[#21262d] text-[#f0f6fc] border border-[#30363d] font-bold"
                    : "text-[#8b949e] hover:bg-[#21262d]/50 hover:text-[#c9d1d9]"
                }`
              }
            >
              <div className="flex items-center space-x-2">
                <Icon size={14} />
                <span>{item.label}</span>
              </div>
              {item.to === "/alerts" && atRisk > 0 && (
                <span className="bg-[#f85149] text-black font-bold px-1.5 py-0.2 rounded text-[10px]">
                  {atRisk}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Node duty state */}
      <div className="p-3 border-t border-[#30363d] text-[10px] text-[#8b949e] space-y-1">
        <div className="flex justify-between items-center text-[#3fb950]">
          <span>● LOW POWER MODE</span>
          <span>12 µA</span>
        </div>
        <div>DUTY CYCLE: 5m BOUTS</div>
        <div>WAKEUP: EXT0 / INT1</div>
      </div>
    </aside>
  );
}
