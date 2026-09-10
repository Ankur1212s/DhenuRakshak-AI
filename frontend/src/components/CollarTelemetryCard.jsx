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

  const isBucketMeter = telemetry.device_type === "BUCKET_METER" || telemetry.milk_ec_ms_cm !== undefined;
  const milkEC = telemetry.milk_ec_ms_cm ?? 4.85;
  const milkPH = telemetry.milk_ph ?? 6.64;
  const durationSec = telemetry.milking_duration_sec ?? 320;
  const rfidTag = telemetry.rfid_tag || "A3F87B02";

  return (
    <div className="bg-white dark:bg-[#11221b] rounded-xl border border-emerald-500/40 shadow-card p-5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b border-slate-100 dark:border-[#1e3a2f] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <Radio size={18} className="animate-pulse text-emerald-500" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
              <span>{isBucketMeter ? "ESP32 Handheld Bucket Meter — Live Milking Stream" : "ESP32 Health Collar — Live IoT Stream"}</span>
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                {telemetry.node_id || (isBucketMeter ? "DHENU-METER-01" : "DHENU-COLLAR-01")}
              </span>
              {isBucketMeter && (
                <span className="text-[10px] bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-mono px-2 py-0.5 rounded-full border border-sky-300 dark:border-sky-800">
                  RFID: {rfidTag}
                </span>
              )}
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

      {isBucketMeter ? (
        /* Handheld Milking Bucket Meter Grid (EC, pH, Milking Duration, Risk) */
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Milk Electrical Conductivity (EC) */}
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#0d1a15] border border-slate-200/60 dark:border-[#1e3a2f]">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
              <span>Milk Conductivity (EC)</span>
              <Activity size={14} className="text-amber-500" />
            </div>
            <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
              {Number(milkEC).toFixed(2)} <span className="text-xs font-normal">mS/cm</span>
            </div>
            <div className="text-[10px] mt-1 text-emerald-600 dark:text-emerald-400 font-medium">
              {milkEC >= 6.5 ? "🚨 High Ionic Leakage" : milkEC >= 5.7 ? "⚠️ Elevated (Subclinical)" : "Normal (4.0–5.5 mS/cm)"}
            </div>
          </div>

          {/* Milk pH */}
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#0d1a15] border border-slate-200/60 dark:border-[#1e3a2f]">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
              <span>Milk pH Level</span>
              <Activity size={14} className="text-emerald-500" />
            </div>
            <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
              {Number(milkPH).toFixed(2)} <span className="text-xs font-normal">pH</span>
            </div>
            <div className="text-[10px] mt-1 text-emerald-600 dark:text-emerald-400 font-medium">
              {milkPH >= 6.95 ? "🚨 Alkaline (Mastitis)" : milkPH >= 6.80 ? "⚠️ Slight Alkalinity" : "Normal Fresh (6.5–6.7)"}
            </div>
          </div>

          {/* Milking Session Duration */}
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#0d1a15] border border-slate-200/60 dark:border-[#1e3a2f]">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
              <span>Milking Duration</span>
              <Thermometer size={14} className="text-sky-500" />
            </div>
            <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
              {Math.floor(durationSec / 60)}m {durationSec % 60}s
            </div>
            <div className="text-[10px] mt-1 text-sky-600 dark:text-sky-400 font-medium">
              Bucket Session Complete
            </div>
          </div>

          {/* RFID Tag & Mastitis Indication */}
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#0d1a15] border border-slate-200/60 dark:border-[#1e3a2f]">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
              <span>Mastitis Assessment</span>
              <CheckCircle size={14} className="text-emerald-500" />
            </div>
            <div className="text-sm font-bold font-mono text-slate-900 dark:text-white truncate">
              {milkEC >= 6.5 || milkPH >= 6.95 ? "HIGH RISK" : milkEC >= 5.7 ? "WATCHLIST" : "HEALTHY (NORMAL)"}
            </div>
            <div className="text-[10px] mt-1 text-primary-light font-medium">
              {telemetry.samples_count ? `${telemetry.samples_count} Samples Averaged` : "Real-time Multi-Sample"}
            </div>
          </div>
        </div>
      ) : (
        /* Collar Telemetry Grid */
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
      )}
    </div>
  );
}
