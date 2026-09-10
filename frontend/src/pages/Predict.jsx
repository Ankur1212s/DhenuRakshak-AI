import React, { useState } from 'react';
import useCattleStore from '../store/cattleStore';

export default function Predict() {
  const { cattle } = useCattleStore();
  const [selectedCowId, setSelectedCowId] = useState(cattle[0]?.id || '1');
  const [temp, setTemp] = useState('38.6');
  const [chewingSpeed, setChewingSpeed] = useState('52');
  const [swelling, setSwelling] = useState('no');
  const [result, setResult] = useState(null);

  const handleCheck = (e) => {
    e.preventDefault();
    const t = parseFloat(temp) || 38.6;
    const cpm = parseFloat(chewingSpeed) || 50;
    const hasSwelling = swelling === 'yes';

    let level = 'LOW';
    let message = 'Cow is healthy. Normal body temperature and chewing rate.';
    let recommendation = 'No action required. Continue standard feeding and milking.';

    if (hasSwelling || t >= 39.8) {
      level = 'HIGH';
      message = 'High Clinical Risk detected. High temperature or udder swelling.';
      recommendation = 'Isolate the cow and contact veterinary doctor immediately.';
    } else if (t >= 39.2 || cpm < 42) {
      level = 'MEDIUM';
      message = 'Early Warning (7-14 Days Before Symptoms). Rumination drop or slight temperature rise.';
      recommendation = 'Apply ICAR herbal paste (Aloe vera + Turmeric + Lime) on udder 3x daily. Milk this cow last.';
    }

    const cow = cattle.find((c) => c.id === selectedCowId);
    setResult({
      name: cow?.name || 'Cattle',
      tag: cow?.tag || 'TAG',
      level,
      message,
      recommendation,
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Health Check & Early Warning</h1>
        <p className="text-xs text-gray-500">Check mastitis risk 7 to 14 days before visible symptoms</p>
      </div>

      {/* Simple Form */}
      <form onSubmit={handleCheck} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm space-y-4 text-sm">
        <div>
          <label className="block text-gray-700 font-medium mb-1">Select Cattle</label>
          <select
            value={selectedCowId}
            onChange={(e) => setSelectedCowId(e.target.value)}
            className="w-full border border-gray-300 rounded p-2 outline-none bg-white"
          >
            {cattle.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.tag}) — {c.breed}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Body Temperature (°C)</label>
            <input
              type="number"
              step="0.1"
              value={temp}
              onChange={(e) => setTemp(e.target.value)}
              className="w-full border border-gray-300 rounded p-2 outline-none"
            />
            <span className="text-xs text-gray-500">Normal: 38.5 - 39.0 °C</span>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">Chewing Speed (chews/min)</label>
            <input
              type="number"
              value={chewingSpeed}
              onChange={(e) => setChewingSpeed(e.target.value)}
              className="w-full border border-gray-300 rounded p-2 outline-none"
            />
            <span className="text-xs text-gray-500">Normal: 45 - 65 chews/min</span>
          </div>
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">Any Udder Swelling or Hardness?</label>
          <select
            value={swelling}
            onChange={(e) => setSwelling(e.target.value)}
            className="w-full border border-gray-300 rounded p-2 outline-none bg-white"
          >
            <option value="no">No Swelling (Normal)</option>
            <option value="yes">Yes (Swollen / Hard)</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-green-700 hover:bg-green-800 text-white font-medium py-2.5 rounded-md"
        >
          Check Health Status
        </button>
      </form>

      {/* Result Card */}
      {result && (
        <div
          className={`border rounded-lg p-5 shadow-sm space-y-3 ${
            result.level === 'HIGH'
              ? 'bg-red-50 border-red-200 text-red-900'
              : result.level === 'MEDIUM'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-green-50 border-green-200 text-green-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-base">
              {result.name} ({result.tag})
            </span>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                result.level === 'HIGH'
                  ? 'bg-red-200 text-red-800'
                  : result.level === 'MEDIUM'
                  ? 'bg-amber-200 text-amber-800'
                  : 'bg-green-200 text-green-800'
              }`}
            >
              {result.level === 'HIGH' ? 'High Risk' : result.level === 'MEDIUM' ? 'Early Warning (7-14 Days)' : 'Healthy'}
            </span>
          </div>

          <p className="text-sm">{result.message}</p>

          <div className="pt-2 border-t border-gray-200/50">
            <strong className="text-xs uppercase tracking-wide block mb-1">Recommended Action:</strong>
            <p className="text-sm font-medium">{result.recommendation}</p>
          </div>
        </div>
      )}
    </div>
  );
}
