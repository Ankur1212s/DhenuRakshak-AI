import React, { useState, useEffect } from "react";
import { 
  Terminal, 
  Activity, 
  Cpu, 
  Database, 
  Search, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  RefreshCw, 
  Radio, 
  Sliders, 
  FileText,
  Tag,
  Zap,
  Power
} from "lucide-react";
import useCattleStore from "../store/cattleStore";

export default function Dashboard() {
  const { cattle, updateCattle } = useCattleStore();
  const [activeTab, setActiveTab] = useState("telemetry"); // "telemetry" | "diagnostic" | "inventory" | "syslog"
  const [telemetry, setTelemetry] = useState(null);
  const [lastBoutTime, setLastBoutTime] = useState("Just now");
  const [probeLog, setProbeLog] = useState([
    { time: "17:20:00", node: "TAG-01", cow: "Kamdhenu (COW-102)", event: "ADXL345 INT1 WAKEUP", dur: "5.2m", cpm: 54.2, temp: 38.6, status: "STORED", level: "INFO" },
    { time: "17:14:48", node: "TAG-01", cow: "Kamdhenu (COW-102)", event: "SLEEP_DEEP_ENTER", dur: "--", cpm: "--", temp: "--", status: "12uA DORMANT", level: "SLEEP" },
    { time: "16:45:10", node: "TAG-02", cow: "Lakshmi (COW-101)", event: "RUMINATION DEFICIT", dur: "1.8m", cpm: 32.0, temp: 39.4, status: "SUBCLINICAL FLAG", level: "WARN" },
    { time: "16:10:05", node: "TAG-03", cow: "Ganga (COW-103)", event: "ROUTINE_BOUT_SYNC", dur: "6.1m", cpm: 58.4, temp: 38.5, status: "HEALTHY", level: "INFO" },
    { time: "15:30:20", node: "TAG-04", cow: "Meera (COW-104)", event: "HIGH TEMPERATURE ALARM", dur: "0.5m", cpm: 18.0, temp: 40.1, status: "CRITICAL ALERT", level: "CRIT" },
  ]);

  // Diagnostic Form State
  const [selectedCowId, setSelectedCowId] = useState(cattle[0]?.id || "2");
  const [diagForm, setDiagForm] = useState({
    bodyTemp: "38.6",
    cpm: "54",
    ruminationDeficit: "0",
    scc: "140",
    ecRF: "4.9",
    ecRH: "4.8",
    swelling: "no"
  });
  const [diagOutput, setDiagOutput] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  // Poll live telemetry from Netlify serverless endpoint
  useEffect(() => {
    const fetchTelem = async () => {
      try {
        const res = await fetch("/api/telemetry");
        if (res.ok) {
          const data = await res.json();
          if (data.telemetry) {
            setTelemetry(data.telemetry);
            setLastBoutTime(new Date().toLocaleTimeString("en-GB"));
          }
        }
      } catch (e) {}
    };
    fetchTelem();
    const interval = setInterval(fetchTelem, 5000);
    return () => clearInterval(interval);
  }, []);

  const runDiagnosticScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      const temp = parseFloat(diagForm.bodyTemp) || 38.6;
      const cpm = parseFloat(diagForm.cpm) || 50;
      const deficit = parseFloat(diagForm.ruminationDeficit) || 0;
      const scc = parseFloat(diagForm.scc) || 150;
      const ecRH = parseFloat(diagForm.ecRH) || 4.8;
      const swelling = diagForm.swelling === "yes";

      let score = 10;
      let level = "LOW";
      let window = "Normal Baseline (No Clinical Risk)";
      let action = "Continue standard milking hygiene and scheduled 5-minute ear tag duty cycle.";

      if (swelling || temp >= 39.8 || ecRH >= 6.4 || scc >= 500) {
        level = "HIGH";
        score = 89.4;
        window = "ACUTE CLINICAL PHASE — Immediate Vet Attention Required";
        action = "Quarantine animal immediately. Perform CMT test & administer veterinarian prescribed intramammary therapy.";
      } else if (deficit >= 15 || cpm < 42 || temp >= 39.2 || scc >= 250 || ecRH >= 5.6) {
        level = "MEDIUM";
        score = 64.8;
        window = "7 to 14 Days Early Warning (Subclinical Onset)";
        action = "ICAR Phytotherapy: Aloe vera (250g) + Turmeric (50g) + Lime (15g). Apply topically 3x daily. Milk infected quarter last.";
      }

      const cowObj = cattle.find(c => c.id === selectedCowId);
      const resObj = {
        target: cowObj?.name || "Target Host",
        tag: cowObj?.tag || "TAG-01",
        riskLevel: level,
        riskScore: score,
        window: window,
        action: action,
        timestamp: new Date().toISOString(),
        metricsAudit: {
          temp: `${temp.toFixed(1)} °C`,
          cpm: `${cpm.toFixed(1)} CPM`,
          ruminationDeficit: `${deficit}%`,
          scc: `${scc}k cells/mL`,
          maxEC: `${ecRH} mS/cm`
        }
      };

      setDiagOutput(resObj);
      setIsScanning(false);

      // Append to syslog
      setProbeLog(prev => [
        {
          time: new Date().toLocaleTimeString("en-GB"),
          node: cowObj?.tag || "DIAG-MANUAL",
          cow: cowObj?.name || "Host",
          event: `MANUAL_AUDIT_${level}`,
          dur: "1-shot",
          cpm: cpm,
          temp: temp,
          status: level === "LOW" ? "HEALTHY" : level === "MEDIUM" ? "SUBCLINICAL FLAG" : "CRITICAL ALERT",
          level: level === "LOW" ? "INFO" : level === "MEDIUM" ? "WARN" : "CRIT"
        },
        ...prev.slice(0, 19)
      ]);
    }, 450);
  };

  return (
    <div className="bg-[#0b0f17] text-[#c9d1d9] font-mono min-h-screen p-3 sm:p-5 flex flex-col space-y-4">
      {/* ── Console Header (Nmap / System Utility Style) ── */}
      <header className="border border-[#30363d] bg-[#161b22] p-3 rounded-md flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="px-2 py-1 bg-[#238636] text-black font-bold text-xs rounded tracking-widest flex items-center gap-1.5">
            <Terminal size={14} className="stroke-[3]" />
            <span>DHENURAKSHAK-OS v3.2</span>
          </div>
          <div className="hidden sm:block text-xs text-[#8b949e]">
            Target: <span className="text-[#f0f6fc] font-bold">LIVESTOCK-SUBNET (192.168.4.0/24)</span>
          </div>
          <div className="hidden md:block text-xs text-[#8b949e]">
            Protocol: <span className="text-[#58a6ff]">BLE/Wi-Fi • Deep Sleep Duty-Cycle (5m)</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded border border-[#30363d] bg-[#0d1117] text-[#3fb950]">
            <span className="w-2 h-2 rounded-full bg-[#3fb950] animate-pulse" />
            <span>GATEWAY ONLINE</span>
          </span>
          <span className="text-[#8b949e] border border-[#30363d] bg-[#0d1117] px-2 py-0.5 rounded">
            EAR-TAG INT1 WAKEUP
          </span>
        </div>
      </header>

      {/* ── System Status & Duty Cycle Bar ── */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
        <div className="border border-[#30363d] bg-[#161b22] p-2.5 rounded">
          <div className="text-[#8b949e] flex justify-between">
            <span>ACTIVE EAR-TAG NODES</span>
            <Tag size={13} className="text-[#58a6ff]" />
          </div>
          <div className="text-lg font-bold text-[#f0f6fc] mt-1 font-mono">
            {cattle.length} <span className="text-xs text-[#8b949e] font-normal">NODES REGISTERED</span>
          </div>
          <div className="text-[10px] text-[#3fb950] mt-0.5">● 100% RETENTION RATE</div>
        </div>

        <div className="border border-[#30363d] bg-[#161b22] p-2.5 rounded">
          <div className="text-[#8b949e] flex justify-between">
            <span>TRANSMISSION DUTY PROFILE</span>
            <Power size={13} className="text-[#238636]" />
          </div>
          <div className="text-lg font-bold text-[#f0f6fc] mt-1 font-mono">
            5 MIN <span className="text-xs text-[#8b949e] font-normal">BURST WINDOW</span>
          </div>
          <div className="text-[10px] text-[#8b949e] mt-0.5">SLEEP CONSUMPTION: ~12 µA</div>
        </div>

        <div className="border border-[#30363d] bg-[#161b22] p-2.5 rounded">
          <div className="text-[#8b949e] flex justify-between">
            <span>EAR-TAG SENSOR FORM FACTOR</span>
            <ShieldAlert size={13} className="text-[#d29922]" />
          </div>
          <div className="text-lg font-bold text-[#f0f6fc] mt-1 font-mono truncate">
            VENTILATED PIN
          </div>
          <div className="text-[10px] text-[#3fb950] mt-0.5">ZERO ABRASION / ZERO FUNGUS</div>
        </div>

        <div className="border border-[#30363d] bg-[#161b22] p-2.5 rounded">
          <div className="text-[#8b949e] flex justify-between">
            <span>7-14D MAST-AI ENSEMBLE</span>
            <Cpu size={13} className="text-[#a371f7]" />
          </div>
          <div className="text-lg font-bold text-[#3fb950] mt-1 font-mono">
            ACTIVE <span className="text-xs text-[#8b949e] font-normal">(SUBCLINICAL)</span>
          </div>
          <div className="text-[10px] text-[#8b949e] mt-0.5">ICAR PROTOCOL ARMED</div>
        </div>
      </section>

      {/* ── Console Tabs (Zenmap / Utility Style) ── */}
      <div className="border-b border-[#30363d] flex space-x-1 text-xs">
        {[
          { id: "telemetry", label: "[ 1. Telemetry Log Sessions ]", icon: Radio },
          { id: "diagnostic", label: "[ 2. 7-14 Day Diagnostic Probe ]", icon: Activity },
          { id: "inventory", label: "[ 3. Host / Cattle Registry ]", icon: Database },
          { id: "syslog", label: "[ 4. System Syslog & Alerts ]", icon: FileText },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 border-t border-l border-r rounded-t font-semibold flex items-center space-x-1.5 transition-colors ${
                isActive
                  ? "bg-[#161b22] border-[#30363d] text-[#f0f6fc]"
                  : "bg-transparent border-transparent text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#161b22]/50"
              }`}
            >
              <Icon size={13} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Tab 1: Telemetry Log Sessions (Real-time Event Burst Monitor) ── */}
      {activeTab === "telemetry" && (
        <div className="space-y-4">
          {/* Latest Live Packet Header */}
          <div className="border border-[#30363d] bg-[#161b22] p-4 rounded-md">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#30363d] pb-2.5 mb-3 text-xs">
              <div className="flex items-center space-x-2">
                <span className="text-[#3fb950] font-bold">LATEST INCOMING TELEMETRY BOUT:</span>
                <span className="text-[#f0f6fc] font-mono font-bold bg-[#21262d] px-2 py-0.5 rounded border border-[#30363d]">
                  {telemetry?.cattle_id || "COW-102"} ({telemetry?.cow_name || "Kamdhenu"})
                </span>
                <span className="text-[#8b949e]">Node: {telemetry?.node_id || "DHENU-TAG-01"}</span>
              </div>
              <div className="text-[#8b949e]">
                Last Burst Synced: <span className="text-[#f0f6fc]">{lastBoutTime}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-[#0d1117] border border-[#30363d] p-2.5 rounded">
                <div className="text-[#8b949e]">CORE TEMPERATURE (LM35)</div>
                <div className="text-xl font-bold text-[#58a6ff] mt-1 font-mono">
                  {(telemetry?.temperature_c || 38.6).toFixed(1)} °C
                </div>
                <div className="text-[10px] text-[#3fb950] mt-0.5">NOMINAL (38.5 - 39.2)</div>
              </div>

              <div className="bg-[#0d1117] border border-[#30363d] p-2.5 rounded">
                <div className="text-[#8b949e]">RUMINATION RATE (ADXL345)</div>
                <div className="text-xl font-bold text-[#3fb950] mt-1 font-mono">
                  {(telemetry?.jaw_metrics?.chews_per_minute || 54.0).toFixed(1)} CPM
                </div>
                <div className="text-[10px] text-[#3fb950] mt-0.5">
                  STATUS: {telemetry?.jaw_metrics?.rumination_state || "ACTIVE BOUT"}
                </div>
              </div>

              <div className="bg-[#0d1117] border border-[#30363d] p-2.5 rounded">
                <div className="text-[#8b949e]">DYNAMIC ACCELERATION</div>
                <div className="text-xl font-bold text-[#d29922] mt-1 font-mono">
                  {(telemetry?.jaw_metrics?.dynamic_accel_g || 0.22).toFixed(2)} g
                </div>
                <div className="text-[10px] text-[#8b949e] mt-0.5">DUAL-EMA DETRENDED</div>
              </div>

              <div className="bg-[#0d1117] border border-[#30363d] p-2.5 rounded">
                <div className="text-[#8b949e]">GEOLOCATION TAG</div>
                <div className="text-sm font-bold text-[#f0f6fc] mt-1 font-mono truncate">
                  {telemetry?.gps?.latitude?.toFixed(4) || "22.5645"}, {telemetry?.gps?.longitude?.toFixed(4) || "72.9289"}
                </div>
                <div className="text-[10px] text-[#58a6ff] mt-0.5">
                  <a href={`https://www.google.com/maps?q=${telemetry?.gps?.latitude || 22.5645},${telemetry?.gps?.longitude || 72.9289}`} target="_blank" rel="noreferrer" className="underline">
                    PASTURE MAP ↗
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Wireshark / Nmap Style Session Probe Table */}
          <div className="border border-[#30363d] bg-[#161b22] rounded-md overflow-hidden">
            <div className="bg-[#21262d] px-3 py-2 border-b border-[#30363d] text-xs font-bold text-[#f0f6fc] flex justify-between items-center">
              <span>BURST TRANSMISSION LOG (5-MINUTE INTERVAL SESSIONS)</span>
              <span className="text-[#8b949e] font-normal">FILTER: ALL TRANSMISSIONS</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="border-b border-[#30363d] text-[#8b949e] bg-[#161b22]">
                    <th className="py-2 px-3">TIMESTAMP</th>
                    <th className="py-2 px-3">SOURCE NODE</th>
                    <th className="py-2 px-3">ANIMAL / ID</th>
                    <th className="py-2 px-3">EVENT TRIGGER</th>
                    <th className="py-2 px-3">BOUT DURATION</th>
                    <th className="py-2 px-3">CPM</th>
                    <th className="py-2 px-3">TEMP</th>
                    <th className="py-2 px-3">AUDIT STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#30363d]">
                  {probeLog.map((log, idx) => (
                    <tr key={idx} className="hover:bg-[#21262d]/60">
                      <td className="py-2 px-3 text-[#8b949e]">{log.time}</td>
                      <td className="py-2 px-3 text-[#58a6ff] font-bold">{log.node}</td>
                      <td className="py-2 px-3 text-[#f0f6fc]">{log.cow}</td>
                      <td className="py-2 px-3">
                        <span className="bg-[#0d1117] px-1.5 py-0.5 rounded border border-[#30363d] text-[#c9d1d9]">
                          {log.event}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-[#8b949e]">{log.dur}</td>
                      <td className="py-2 px-3 text-[#3fb950] font-bold">{log.cpm}</td>
                      <td className="py-2 px-3 text-[#f0f6fc]">{log.temp} {typeof log.temp === 'number' ? '°C' : ''}</td>
                      <td className="py-2 px-3 font-bold">
                        {log.level === "CRIT" ? (
                          <span className="text-[#f85149] bg-[#f85149]/10 px-2 py-0.5 rounded border border-[#f85149]/30">CRITICAL</span>
                        ) : log.level === "WARN" ? (
                          <span className="text-[#d29922] bg-[#d29922]/10 px-2 py-0.5 rounded border border-[#d29922]/30">SUBCLINICAL</span>
                        ) : log.level === "SLEEP" ? (
                          <span className="text-[#8b949e] bg-[#8b949e]/10 px-2 py-0.5 rounded border border-[#30363d]">DORMANT</span>
                        ) : (
                          <span className="text-[#3fb950] bg-[#3fb950]/10 px-2 py-0.5 rounded border border-[#3fb950]/30">SYNCED</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 2: 7-14 Day Diagnostic Probe (Console AI Evaluator) ── */}
      {activeTab === "diagnostic" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Diagnostic Parameter Input Console */}
          <div className="lg:col-span-6 border border-[#30363d] bg-[#161b22] p-4 rounded-md space-y-3 text-xs">
            <div className="border-b border-[#30363d] pb-2 font-bold text-[#f0f6fc] flex items-center justify-between">
              <span>EXECUTE DIAGNOSTIC PROBE (SIH PROBLEM STATEMENT #109)</span>
              <Sliders size={14} className="text-[#58a6ff]" />
            </div>

            <div>
              <label className="block text-[#8b949e] mb-1">TARGET CATTLE HOST</label>
              <select
                value={selectedCowId}
                onChange={e => setSelectedCowId(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded p-2 text-[#f0f6fc] focus:border-[#58a6ff] outline-none font-mono"
              >
                {cattle.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.tag}) — Breed: {c.breed} | Baseline Yield: {c.milkYield}L
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[#8b949e] mb-1">BODY TEMPERATURE (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={diagForm.bodyTemp}
                  onChange={e => setDiagForm({ ...diagForm, bodyTemp: e.target.value })}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded p-2 text-[#f0f6fc] focus:border-[#58a6ff] outline-none"
                />
              </div>
              <div>
                <label className="block text-[#8b949e] mb-1">RUMINATION CHEWS (CPM)</label>
                <input
                  type="number"
                  value={diagForm.cpm}
                  onChange={e => setDiagForm({ ...diagForm, cpm: e.target.value })}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded p-2 text-[#f0f6fc] focus:border-[#58a6ff] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[#8b949e] mb-1">RUMINATION DEFICIT (%)</label>
                <input
                  type="number"
                  value={diagForm.ruminationDeficit}
                  onChange={e => setDiagForm({ ...diagForm, ruminationDeficit: e.target.value })}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded p-2 text-[#f0f6fc] focus:border-[#58a6ff] outline-none"
                />
              </div>
              <div>
                <label className="block text-[#8b949e] mb-1">SOMATIC CELLS (x1000 cells/mL)</label>
                <input
                  type="number"
                  value={diagForm.scc}
                  onChange={e => setDiagForm({ ...diagForm, scc: e.target.value })}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded p-2 text-[#f0f6fc] focus:border-[#58a6ff] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[#8b949e] mb-1">RIGHT HIND EC (mS/cm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={diagForm.ecRH}
                  onChange={e => setDiagForm({ ...diagForm, ecRH: e.target.value })}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded p-2 text-[#f0f6fc] focus:border-[#58a6ff] outline-none"
                />
              </div>
              <div>
                <label className="block text-[#8b949e] mb-1">UDDER SWELLING / HARDNESS?</label>
                <select
                  value={diagForm.swelling}
                  onChange={e => setDiagForm({ ...diagForm, swelling: e.target.value })}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded p-2 text-[#f0f6fc] focus:border-[#58a6ff] outline-none"
                >
                  <option value="no">No Physical Swelling (Subclinical Target)</option>
                  <option value="yes">Yes - Visible Swelling / Hardness (Clinical)</option>
                </select>
              </div>
            </div>

            <button
              onClick={runDiagnosticScan}
              disabled={isScanning}
              className="w-full mt-2 bg-[#238636] hover:bg-[#2ea043] text-black font-bold p-2.5 rounded transition-all flex items-center justify-center space-x-2"
            >
              {isScanning ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>COMPUTING MULTI-FACTOR ENSEMBLE...</span>
                </>
              ) : (
                <>
                  <Terminal size={14} />
                  <span>RUN PREDICTIVE DIAGNOSTIC SCAN</span>
                </>
              )}
            </button>
          </div>

          {/* Terminal Output Console */}
          <div className="lg:col-span-6 border border-[#30363d] bg-[#0d1117] p-4 rounded-md flex flex-col font-mono text-xs">
            <div className="border-b border-[#30363d] pb-2 text-[#8b949e] flex justify-between items-center">
              <span>SCAN TERMINAL OUTPUT STREAM</span>
              <span className="text-[#3fb950]">[READY]</span>
            </div>

            {diagOutput ? (
              <div className="mt-3 space-y-2.5 flex-1">
                <div className="text-[#8b949e]">
                  &gt; PROBE TARGET: <span className="text-[#f0f6fc] font-bold">{diagOutput.target} ({diagOutput.tag})</span>
                </div>
                <div className="text-[#8b949e]">
                  &gt; TIMESTAMP: <span className="text-[#f0f6fc]">{diagOutput.timestamp}</span>
                </div>

                <div className={`p-3 rounded border ${
                  diagOutput.riskLevel === "HIGH" 
                    ? "bg-[#f85149]/10 border-[#f85149] text-[#f85149]" 
                    : diagOutput.riskLevel === "MEDIUM" 
                    ? "bg-[#d29922]/10 border-[#d29922] text-[#d29922]" 
                    : "bg-[#3fb950]/10 border-[#3fb950] text-[#3fb950]"
                }`}>
                  <div className="font-bold text-sm">
                    {diagOutput.riskLevel === "HIGH" ? "🚨 CLINICAL RISK LEVEL: HIGH" : diagOutput.riskLevel === "MEDIUM" ? "⚡ 7-14 DAY EARLY WARNING: MEDIUM (SUBCLINICAL)" : "✅ HEALTH STATUS: NORMAL (LOW RISK)"}
                  </div>
                  <div className="text-[11px] mt-1 text-[#f0f6fc]">
                    Diagnostic Confidence Score: <strong>{diagOutput.riskScore}%</strong>
                  </div>
                  <div className="text-[11px] mt-0.5 text-[#c9d1d9]">
                    Evaluation Window: <strong>{diagOutput.window}</strong>
                  </div>
                </div>

                <div className="bg-[#161b22] border border-[#30363d] p-3 rounded space-y-1.5">
                  <div className="text-[#58a6ff] font-bold">RECOMMENDED CLINICAL / PHYTOTHERAPY ACTION:</div>
                  <div className="text-[#f0f6fc] leading-relaxed">{diagOutput.action}</div>
                </div>

                <div className="bg-[#161b22] border border-[#30363d] p-2.5 rounded text-[11px]">
                  <div className="text-[#8b949e] mb-1">AUDIT PARAMETER SUMMARY:</div>
                  <div className="grid grid-cols-2 gap-1 text-[#c9d1d9]">
                    <div>Body Temp: <span className="text-[#f0f6fc]">{diagOutput.metricsAudit.temp}</span></div>
                    <div>Rumination CPM: <span className="text-[#f0f6fc]">{diagOutput.metricsAudit.cpm}</span></div>
                    <div>Rumination Deficit: <span className="text-[#f0f6fc]">{diagOutput.metricsAudit.ruminationDeficit}</span></div>
                    <div>Max Quarter EC: <span className="text-[#f0f6fc]">{diagOutput.metricsAudit.maxEC}</span></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-8 text-center text-[#8b949e] space-y-2">
                <Terminal size={32} className="mx-auto text-[#30363d]" />
                <p>&gt; System idle. Configure cattle host parameters and execute scan.</p>
                <p className="text-[10px] text-[#484f58]">7-14 Day ensemble will correlate temperature rise with rumination deficit.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab 3: Host / Cattle Registry (Nmap Host List Style) ── */}
      {activeTab === "inventory" && (
        <div className="border border-[#30363d] bg-[#161b22] rounded-md overflow-hidden text-xs font-mono">
          <div className="bg-[#21262d] px-3 py-2 border-b border-[#30363d] font-bold text-[#f0f6fc] flex justify-between">
            <span>REGISTERED LIVESTOCK HOST INVENTORY</span>
            <span className="text-[#8b949e]">TOTAL REGISTERED: {cattle.length} HEAD</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#30363d] text-[#8b949e] bg-[#161b22]">
                  <th className="py-2 px-3">TAG ID</th>
                  <th className="py-2 px-3">NAME</th>
                  <th className="py-2 px-3">BREED</th>
                  <th className="py-2 px-3">AGE</th>
                  <th className="py-2 px-3">STATUS</th>
                  <th className="py-2 px-3">MILK YIELD</th>
                  <th className="py-2 px-3">LAST AUDIT</th>
                  <th className="py-2 px-3">LOCATION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#30363d]">
                {cattle.map(cow => (
                  <tr key={cow.id} className="hover:bg-[#21262d]/60">
                    <td className="py-2 px-3 text-[#58a6ff] font-bold">{cow.tag}</td>
                    <td className="py-2 px-3 text-[#f0f6fc]">{cow.name}</td>
                    <td className="py-2 px-3 text-[#8b949e]">{cow.breed}</td>
                    <td className="py-2 px-3 text-[#8b949e]">{cow.age} yrs</td>
                    <td className="py-2 px-3">
                      {cow.riskLevel === "HIGH" ? (
                        <span className="text-[#f85149] font-bold">● CLINICAL</span>
                      ) : cow.riskLevel === "MEDIUM" ? (
                        <span className="text-[#d29922] font-bold">▲ WATCH (7-14d)</span>
                      ) : (
                        <span className="text-[#3fb950] font-bold">✔ NORMAL</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-[#f0f6fc]">{cow.milkYield} L/day</td>
                    <td className="py-2 px-3 text-[#8b949e]">{cow.lastChecked || "Today"}</td>
                    <td className="py-2 px-3 text-[#8b949e]">{cow.village || "Anand Barn"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab 4: System Syslog & Alerts (Audit Trail) ── */}
      {activeTab === "syslog" && (
        <div className="border border-[#30363d] bg-[#0d1117] rounded-md p-4 font-mono text-xs space-y-2">
          <div className="border-b border-[#30363d] pb-2 text-[#8b949e] flex justify-between items-center">
            <span>/var/log/dhenurakshak/syslog.log — EVENT AUDIT TRAIL</span>
            <span className="text-[#3fb950]">DAEMON RUNNING</span>
          </div>

          <div className="space-y-1 text-[11px] leading-relaxed">
            <div className="text-[#8b949e]">
              [2026-09-10 17:28:00] <span className="text-[#58a6ff]">[SYS_INIT]</span> DhenuRakshak IoT Gateway initialized on Raspberry Pi 3B+ (armv7l).
            </div>
            <div className="text-[#8b949e]">
              [2026-09-10 17:28:01] <span className="text-[#3fb950]">[NET_UP]</span> Cloud uplink confirmed: https://dhenurakshak.netlify.app/api/telemetry.
            </div>
            <div className="text-[#8b949e]">
              [2026-09-10 17:28:02] <span className="text-[#d29922]">[POWER_CONF]</span> Ear-tag profile activated: 5-minute periodic burst transmission with deep sleep gating.
            </div>
            <div className="text-[#8b949e]">
              [2026-09-10 17:20:00] <span className="text-[#3fb950]">[BOUT_RECV]</span> Ingested packet from TAG-01 (COW-102): Temp=38.6C, CPM=54.2, Lat=22.5645, Lon=72.9289.
            </div>
            <div className="text-[#8b949e]">
              [2026-09-10 17:14:48] <span className="text-[#8b949e]">[PWR_SLEEP]</span> TAG-01 entering ESP32 Deep Sleep (EXT0 armed on ADXL345 INT1 pin).
            </div>
            <div className="text-[#8b949e]">
              [2026-09-10 16:45:10] <span className="text-[#d29922]">[ALERT_WARN]</span> TAG-02 (Lakshmi): Rumination deficit -28% observed. 7-14 day subclinical flag asserted.
            </div>
            <div className="text-[#8b949e]">
              [2026-09-10 15:30:20] <span className="text-[#f85149]">[ALERT_CRIT]</span> TAG-04 (Meera): Core temperature 40.1C, yield loss detected. Clinical intervention protocol dispatched.
            </div>
          </div>
        </div>
      )}

      {/* ── Console Footer ── */}
      <footer className="border-t border-[#30363d] pt-2 text-[11px] text-[#8b949e] flex flex-wrap items-center justify-between gap-2">
        <div>
          DhenuRakshak Console • Low-Power Veterinary Ear-Tag Architecture • SIH PS #109
        </div>
        <div className="flex space-x-3">
          <span>DUTY: 5m</span>
          <span>SLEEP: EXT0</span>
          <span>ACCEL: ADXL345 INT1</span>
          <span>TEMP: LM35</span>
        </div>
      </footer>
    </div>
  );
}
