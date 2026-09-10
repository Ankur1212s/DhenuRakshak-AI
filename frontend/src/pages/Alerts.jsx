import React from 'react';

export default function Alerts() {
  const alerts = [
    { id: 1, cow: 'Lakshmi', tag: 'TAG-002', status: 'High Risk', time: '1 hour ago', reason: 'High Body Temperature (40.1°C)', action: 'Contact veterinary doctor immediately' },
    { id: 2, cow: 'Kamdhenu', tag: 'TAG-003', status: 'Early Warning', time: '5 hours ago', reason: 'Low rumination chewing rate (-18%)', action: 'Apply Aloe vera + Turmeric herbal paste' },
    { id: 3, cow: 'Parvati', tag: 'TAG-006', status: 'High Risk', time: 'Yesterday', reason: 'Abnormal milk conductivity detected', action: 'Milk this cow last and test sample' },
  ];

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Health Alerts</h1>
        <p className="text-xs text-gray-500">Active early warnings and notifications requiring attention</p>
      </div>

      <div className="space-y-3">
        {alerts.map((a) => (
          <div
            key={a.id}
            className={`bg-white border rounded-lg p-4 shadow-sm ${
              a.status === 'High Risk' ? 'border-red-200' : 'border-amber-200'
            }`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-900 text-sm">
                  {a.cow} ({a.tag})
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    a.status === 'High Risk'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {a.status}
                </span>
              </div>
              <span className="text-xs text-gray-400">{a.time}</span>
            </div>

            <p className="text-sm text-gray-700 mt-2">{a.reason}</p>
            <p className="text-xs text-gray-500 mt-1">
              <strong>Action:</strong> {a.action}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
