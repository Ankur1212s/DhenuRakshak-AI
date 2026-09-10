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

  const totalCattle = cattle.length;
  const needAttention = cattle.filter(
    (c) => c.riskLevel === "HIGH" || c.riskLevel === "MEDIUM"
  ).length;
  const healthyCount = totalCattle - needAttention;

  return (
    <div className="space-y-6">
      {/* 3 Simple Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <div className="text-sm font-medium text-gray-500">Total Registered Cattle</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{totalCattle}</div>
          <div className="text-xs text-gray-500 mt-1">Monitored in farm</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <div className="text-sm font-medium text-gray-500">Healthy Cows</div>
          <div className="text-3xl font-bold text-green-600 mt-2">{healthyCount}</div>
          <div className="text-xs text-green-700 mt-1">Normal chewing & temperature</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <div className="text-sm font-medium text-gray-500">Needs Attention</div>
          <div className={`text-3xl font-bold mt-2 ${needAttention > 0 ? "text-amber-600" : "text-gray-900"}`}>
            {needAttention}
          </div>
          <div className="text-xs text-amber-700 mt-1">Early warning / Watchlist</div>
        </div>
      </div>

      {/* Latest Ear Tag Reading */}
      {telemetry && (
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Latest Ear Tag Sync — {telemetry.cow_name || "Kamdhenu"} ({telemetry.cattle_id || "COW-102"})
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Updated on last 5-minute transmission</p>
            </div>
            <span className="bg-green-100 text-green-800 text-xs px-2.5 py-1 rounded-full font-medium">
              Synced
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4">
            <div>
              <span className="text-xs text-gray-500 block">Body Temperature</span>
              <span className="text-xl font-bold text-gray-900">
                {(telemetry.temperature_c || 38.6).toFixed(1)} °C
              </span>
              <span className="text-xs text-green-600 block mt-0.5">Normal</span>
            </div>

            <div>
              <span className="text-xs text-gray-500 block">Chewing Speed</span>
              <span className="text-xl font-bold text-gray-900">
                {(telemetry.jaw_metrics?.chews_per_minute || 54.0).toFixed(0)} chews/min
              </span>
              <span className="text-xs text-green-600 block mt-0.5">Active Rumination</span>
            </div>

            <div>
              <span className="text-xs text-gray-500 block">Location (Pasture)</span>
              <span className="text-sm font-semibold text-gray-900 block mt-1">
                {telemetry.gps?.latitude?.toFixed(4) || "22.5645"}, {telemetry.gps?.longitude?.toFixed(4) || "72.9289"}
              </span>
              <a
                href={`https://www.google.com/maps?q=${telemetry.gps?.latitude || 22.5645},${telemetry.gps?.longitude || 72.9289}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-600 hover:underline"
              >
                View on Map ↗
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Simple Cattle Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Herd Overview</h2>
          <Link to="/cattle" className="text-sm text-blue-600 font-medium hover:underline">
            View All Cattle →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase border-b border-gray-200">
              <tr>
                <th className="py-3 px-5">Tag ID</th>
                <th className="py-3 px-5">Name</th>
                <th className="py-3 px-5">Breed</th>
                <th className="py-3 px-5">Daily Milk</th>
                <th className="py-3 px-5">Health Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {cattle.slice(0, 5).map((cow) => (
                <tr key={cow.id} className="hover:bg-gray-50">
                  <td className="py-3.5 px-5 font-medium text-gray-900">{cow.tag}</td>
                  <td className="py-3.5 px-5 text-gray-800">{cow.name}</td>
                  <td className="py-3.5 px-5 text-gray-500">{cow.breed}</td>
                  <td className="py-3.5 px-5 text-gray-800">{cow.milkYield} L</td>
                  <td className="py-3.5 px-5">
                    {cow.riskLevel === "HIGH" ? (
                      <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full font-medium">
                        High Risk
                      </span>
                    ) : cow.riskLevel === "MEDIUM" ? (
                      <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full font-medium">
                        Watch (7-14 Days)
                      </span>
                    ) : (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full font-medium">
                        Healthy
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
