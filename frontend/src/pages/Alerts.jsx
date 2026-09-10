import React from 'react';

export default function Alerts() {
  const alerts = [
    {
      id: 1,
      type: 'SICK (RED ALERT)',
      tag: 'TAG-002',
      cow: 'Lakshmi',
      time: '1h ago',
      issue: 'Rumination dropped to 210 mins/day (-45%) with ear temp spike (40.1°C).',
      recommendation: 'Check cow immediately for acute mastitis signs (hard/swollen quarter). Isolate and consult veterinarian.',
      badgeClass: 'bg-red-600 text-white',
      borderClass: 'border-red-300 bg-red-50/40',
    },
    {
      id: 2,
      type: 'SUSPICIOUS (YELLOW ALERT)',
      tag: 'TAG-003',
      cow: 'Kamdhenu',
      time: '5h ago',
      issue: 'Rumination dropped to 340 mins/day (-22%). Early subclinical mastitis alert (7-14 days before clinical symptoms).',
      recommendation: 'Apply ICAR herbal paste (Aloe vera, Turmeric, Lime) to all quarters. Milk this cow last in parlor.',
      badgeClass: 'bg-amber-400 text-slate-950 font-bold',
      borderClass: 'border-amber-300 bg-amber-50/40',
    },
    {
      id: 3,
      type: 'SICK (RED ALERT)',
      tag: 'TAG-006',
      cow: 'Parvati',
      time: 'Yesterday',
      issue: 'Severe drop in both eating time (under 2 hours) and rumination (190 mins).',
      recommendation: 'Check feed intake and temperature. Administer California Mastitis Test (CMT) strip.',
      badgeClass: 'bg-red-600 text-white',
      borderClass: 'border-red-300 bg-red-50/40',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-4 text-slate-800">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Health Alerts</h1>
        <p className="text-xs text-slate-500">
          CowManager-style alerts based on real deviations in ear-sensor rumination and temperature
        </p>
      </div>

      <div className="space-y-3">
        {alerts.map((a) => (
          <div key={a.id} className={`border rounded p-4 shadow-sm bg-white ${a.borderClass}`}>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <span className={`text-xs px-2 py-0.5 rounded font-black tracking-wide ${a.badgeClass}`}>
                  {a.type}
                </span>
                <span className="font-bold text-sm text-slate-900">
                  {a.cow} (Tag #{a.tag})
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">{a.time}</span>
            </div>

            <p className="text-xs text-slate-700 font-medium mt-2">{a.issue}</p>
            <div className="text-xs text-slate-800 mt-2 pt-2 border-t border-slate-200/60">
              <strong className="text-slate-900">Management Action:</strong> {a.recommendation}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
