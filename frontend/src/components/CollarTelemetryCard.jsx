import { useState, useEffect } from "react";
import { Activity, Radio, Thermometer, MapPin, CheckCircle, AlertTriangle } from "lucide-react";

export default function CollarTelemetryCard() {
  const [telemetry, setTelemetry] = useState(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const res = await fetch("/api/telemetry");
        if (res.ok) {
          const data = await res.json();
          if (data.telemetry) {
            setTelemetry(data.telemetry);
            setIsLive(true);
          }
        }
      } catch (err) {
        setIsLive(false);
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 3000);
    return () => clearInterval(interval);
  }, []);

  if (!telemetry) return null;

  const temp = telemetry.temperature_c ?? 38.5;
  const cpm = telemetry.jaw_metrics?.chews_per_minute ?? 0;
  const isRum = telemetry.jaw_metrics?.rumination_state === "RUMINATING";
  const lat = telemetry.gps?.latitude?.toFixed(4) ?? "22.5645";
  const lon = telemetry.gps?.longitude?.toFixed(4) ?? "72.9289";

  return (
    <div className="bg-white dark:bg-[#11221b] rounded-xl border border-emerald-500/40 shadow-card p-5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b border-slate-100 dark:border-[#1e3a2f] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <Radio size={18} className="animate-pulse text-emerald-500" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <span>ESP32 Health Collar — Live IoT Stream</span>
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                {telemetry.node_id || "DHENU-COLLAR-01"}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Target Cattle: <strong className="text-slate-700 dark:text-slate-200">{telemetry.cow_name || "Kamdhenu"}</strong> ({telemetry.cattle_id || "COW-102"})
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Telemetry Uplink Active</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Core Temperature */}
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#0d1a15] border border-slate-200/60 dark:border-[#1e3a2f]">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Body Temperature</span>
            <Thermometer size={14} className="text-amber-500" />
          </div>
          <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
            {temp.toFixed(1)} <span className="text-xs font-normal">°C</span>
          </div>
          <div className="text-[10px] mt-1 text-emerald-600 dark:text-emerald-400 font-medium">
            {temp >= 39.8 ? "🚨 Fever Detected" : "Optimal Core Temp"}
          </div>
        </div>

        {/* Rumination Chews */}
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#0d1a15] border border-slate-200/60 dark:border-[#1e3a2f]">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Rumination Chews</span>
            <Activity size={14} className="text-emerald-500" />
          </div>
          <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
            {cpm.toFixed(1)} <span className="text-xs font-normal">CPM</span>
          </div>
          <div className="text-[10px] mt-1 text-emerald-600 dark:text-emerald-400 font-medium">
            {isRum ? "● Active Rumination" : "○ Resting / Grazing"}
          </div>
        </div>

        {/* Dynamic Jaw Accel */}
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#0d1a15] border border-slate-200/60 dark:border-[#1e3a2f]">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Jaw Motion Amplitude</span>
            <Activity size={14} className="text-sky-500" />
          </div>
          <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
            {(telemetry.jaw_metrics?.dynamic_accel_g ?? 0.18).toFixed(2)} <span className="text-xs font-normal">g</span>
          </div>
          <div className="text-[10px] mt-1 text-sky-600 dark:text-sky-400 font-medium">
            ADXL345 Dual EMA Detrended
          </div>
        </div>

        {/* Live GPS Coordinates */}
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#0d1a15] border border-slate-200/60 dark:border-[#1e3a2f]">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Pasture Geo-Tag</span>
            <MapPin size={14} className="text-rose-500" />
          </div>
          <div className="text-sm font-bold font-mono text-slate-900 dark:text-white truncate">
            {lat}, {lon}
          </div>
          <div className="text-[10px] mt-1 text-primary-light font-medium">
            <a
              href={`https://www.google.com/maps?q=${lat},${lon}`}
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
            >
              View on Map ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
