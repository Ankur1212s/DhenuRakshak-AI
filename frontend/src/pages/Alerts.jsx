import React from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle2, Terminal } from 'lucide-react';
import useCattleStore from '../store/cattleStore';

export default function Alerts() {
  const { cattle } = useCattleStore();
  const alertList = [
    { id: 1, tag: 'TAG-002', cow: 'Lakshmi', level: 'HIGH', time: '1h ago', event: 'Acute Somatic Cell Elevation (>720k) & Core Temp 40.1°C', action: 'Immediate veterinary antibiotics required' },
    { id: 2, tag: 'TAG-006', cow: 'Parvati', level: 'HIGH', time: '3h ago', event: 'Right Hind Quarter EC > 6.8 mS/cm', action: 'Quarantine and milk quarter separately' },
    { id: 3, tag: 'TAG-003', cow: 'Kamdhenu', level: 'MEDIUM', time: '5h ago', event: 'Subclinical Rumination Deficit -18% (7-14d Warning)', action: 'Apply ICAR Herbal Phytotherapy paste' },
    { id: 4, tag: 'TAG-008', cow: 'Radha', level: 'MEDIUM', time: '8h ago', event: 'Chew cadence drop (38 CPM) post-evening feed', action: 'Monitor next 5-minute duty cycle burst' },
  ];

  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="border border-[#30363d] bg-[#161b22] p-3 rounded-md flex items-center justify-between">
        <div className="flex items-center space-x-2 font-bold text-[#f0f6fc]">
          <Terminal size={14} className="text-[#f85149]" />
          <span>[ 04_ALERTS ] — CLINICAL & SUBCLINICAL INCIDENT LOG</span>
        </div>
        <span className="text-[#8b949e]">SEVERITY: HIGH / MEDIUM ACTIVE</span>
      </div>

      <div className="space-y-2.5">
        {alertList.map((a) => (
          <div
            key={a.id}
            className={`border p-3 rounded-md ${
              a.level === 'HIGH'
                ? 'bg-[#161b22] border-[#f85149]/40'
                : 'bg-[#161b22] border-[#d29922]/40'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#30363d] pb-2 mb-2">
              <div className="flex items-center space-x-2">
                <span
                  className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                    a.level === 'HIGH'
                      ? 'bg-[#f85149] text-black'
                      : 'bg-[#d29922] text-black'
                  }`}
                >
                  {a.level === 'HIGH' ? 'CRITICAL_INCIDENT' : 'EARLY_WARNING_7-14D'}
                </span>
                <span className="text-[#f0f6fc] font-bold">
                  {a.cow} ({a.tag})
                </span>
              </div>
              <span className="text-[#8b949e]">{a.time}</span>
            </div>

            <div className="text-[#f0f6fc] font-semibold">{a.event}</div>
            <div className="text-[#8b949e] mt-1">
              &gt; ACTION DISPATCH: <span className="text-[#58a6ff]">{a.action}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
