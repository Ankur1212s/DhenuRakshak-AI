import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import useCattleStore from "../store/cattleStore";

export default function Dashboard() {
  const { cattle } = useCattleStore();
  const [telemetry, setTelemetry] = useState(null);

  useEffect(() => {
    fetch("/api/telemetry")
      .then((res) => res.json())
      .then((data) => {
        if (data.telemetry) setTelemetry(data.telemetry);
      })
      .catch(() => {});
  }, []);

  const totalCows = cattle.length;
  const sickList = cattle.filter((c) => c.riskLevel === "HIGH");
  const suspiciousList = cattle.filter((c) => c.riskLevel === "MEDIUM");
  const healthyCount = totalCows - sickList.length - suspiciousList.length;

  return (
    <div className="space-y-5 text-slate-800">
      {/* ── CowManager Health Status Summary Bar ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Healthy Tier */}
        <div className="bg-white border-l-4 border-emerald-500 border-t border-r border-b border-slate-200 rounded p-3.5 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Healthy Herd</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{healthyCount}</div>
          <div className="text-xs text-emerald-600 font-medium mt-0.5">Normal eating & chewing</div>
        </div>

        {/* Suspicious Tier (Yellow Alert in CowManager) */}
        <div className="bg-white border-l-4 border-amber-400 border-t border-r border-b border-slate-200 rounded p-3.5 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Suspicious (Watch)</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{suspiciousList.length}</div>
          <div className="text-xs text-amber-700 font-medium mt-0.5">Mild drop in rumination</div>
        </div>

        {/* Sick Tier (Red Alert in CowManager) */}
        <div className="bg-white border-l-4 border-red-500 border-t border-r border-b border-slate-200 rounded p-3.5 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sick (Immediate)</div>
          <div className="text-2xl font-black text-red-600 mt-1">{sickList.length}</div>
          <div className="text-xs text-red-700 font-medium mt-0.5">Sharp rumination drop / fever</div>
        </div>

        {/* Total Monitored */}
        <div className="bg-white border-l-4 border-blue-500 border-t border-r border-b border-slate-200 rounded p-3.5 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Ear Tags</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalCows}</div>
          <div className="text-xs text-blue-600 font-medium mt-0.5">100% sensors communicating</div>
        </div>
      </div>

      {/* ── Active Health Alerts (CowManager Alert Cards) ── */}
      {(sickList.length > 0 || suspiciousList.length > 0) && (
        <div className="bg-white border border-slate-200 rounded shadow-sm">
          <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Active Health Alerts (Requires Visual Check)
            </h2>
            <span className="text-xs text-slate-500 font-medium">Sorted by Severity</span>
          </div>

          <div className="divide-y divide-slate-100">
            {sickList.map((cow) => (
              <div key={cow.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60">
                <div className="flex items-start space-x-3">
                  <span className="w-3 h-3 rounded-full bg-red-500 mt-1.5 shrink-0" />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-900">{cow.name}</span>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-medium">
                        Tag #{cow.tag}
                      </span>
                      <span className="text-xs font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded">
                        SICK
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      Severe drop in rumination & elevated temperature. Risk of acute clinical mastitis.
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-auto shrink-0">
                  <span className="text-xs text-slate-500 font-mono">Today</span>
                  <Link
                    to={`/cattle/${cow.id}`}
                    className="text-xs bg-red-50 text-red-700 hover:bg-red-100 font-bold px-3 py-1.5 rounded border border-red-200"
                  >
                    View Cow Details →
                  </Link>
                </div>
              </div>
            ))}

            {suspiciousList.map((cow) => (
              <div key={cow.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60">
                <div className="flex items-start space-x-3">
                  <span className="w-3 h-3 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-900">{cow.name}</span>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-medium">
                        Tag #{cow.tag}
                      </span>
                      <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                        SUSPICIOUS (7-14 DAYS)
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      Rumination chewing decreased by 15-20%. Early subclinical mastitis warning window.
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-auto shrink-0">
                  <span className="text-xs text-slate-500 font-mono">5h ago</span>
                  <Link
                    to={`/cattle/${cow.id}`}
                    className="text-xs bg-amber-50 text-amber-800 hover:bg-amber-100 font-bold px-3 py-1.5 rounded border border-amber-200"
                  >
                    View Cow Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CowManager Cow Behavior & Rumination Graph Section ── */}
      <div className="bg-white border border-slate-200 rounded shadow-sm p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Behavior Graph — 24-Hour Rumination & Eating Distribution</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ear sensor tracks eating, rumination chewing cud, and resting time per hour
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
              <span>Rumination (Cud Chewing)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-blue-500 inline-block" />
              <span>Eating / Grazing</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-300 inline-block" />
              <span>Resting</span>
            </span>
          </div>
        </div>

        {/* 24-Hour Stacked Bar Representation */}
        <div className="pt-4 space-y-3">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span>Kamdhenu (Tag #TAG-003) — Healthy Baseline</span>
              <span className="text-emerald-700">485 mins rumination (Optimal)</span>
            </div>
            <div className="h-5 rounded bg-slate-100 flex overflow-hidden border border-slate-200">
              <div style={{ width: "42%" }} className="bg-emerald-500" title="Rumination: 42%" />
              <div style={{ width: "26%" }} className="bg-blue-500" title="Eating: 26%" />
              <div style={{ width: "32%" }} className="bg-slate-300" title="Resting: 32%" />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span>Lakshmi (Tag #TAG-002) — Flagged Suspicious (Subclinical Mastitis)</span>
              <span className="text-amber-700">310 mins rumination (-25% Deficit ⚠️)</span>
            </div>
            <div className="h-5 rounded bg-slate-100 flex overflow-hidden border border-slate-200">
              <div style={{ width: "24%" }} className="bg-emerald-500" title="Rumination: 24%" />
              <div style={{ width: "22%" }} className="bg-blue-500" title="Eating: 22%" />
              <div style={{ width: "54%" }} className="bg-slate-300" title="Resting: 54%" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Cow List Table (CowManager Style) ── */}
      <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Herd Cattle Overview</h2>
          <Link to="/cattle" className="text-xs text-blue-600 font-bold hover:underline">
            All Cows →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 uppercase border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-2.5 px-4">Tag</th>
                <th className="py-2.5 px-4">Name</th>
                <th className="py-2.5 px-4">Breed</th>
                <th className="py-2.5 px-4">Rumination (Mins)</th>
                <th className="py-2.5 px-4">Ear Temp</th>
                <th className="py-2.5 px-4">CowManager Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cattle.map((cow) => (
                <tr key={cow.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{cow.tag}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{cow.name}</td>
                  <td className="py-3 px-4 text-slate-500">{cow.breed}</td>
                  <td className="py-3 px-4 font-medium">
                    {cow.riskLevel === "HIGH" ? "210 m (-45%)" : cow.riskLevel === "MEDIUM" ? "340 m (-22%)" : "480 m (Normal)"}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-700">
                    {cow.riskLevel === "HIGH" ? "40.1 °C" : cow.riskLevel === "MEDIUM" ? "39.2 °C" : "38.6 °C"}
                  </td>
                  <td className="py-3 px-4">
                    {cow.riskLevel === "HIGH" ? (
                      <span className="bg-red-100 text-red-800 text-[11px] font-bold px-2 py-0.5 rounded">
                        SICK
                      </span>
                    ) : cow.riskLevel === "MEDIUM" ? (
                      <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded">
                        SUSPICIOUS
                      </span>
                    ) : (
                      <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded">
                        HEALTHY
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
