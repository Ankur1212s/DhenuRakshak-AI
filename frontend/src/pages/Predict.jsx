import React, { useState } from 'react';
import useCattleStore from '../store/cattleStore';

export default function Predict() {
  const { cattle } = useCattleStore();
  const [selectedCowId, setSelectedCowId] = useState(cattle[0]?.id || '1');
  const [ruminationMins, setRuminationMins] = useState('340');
  const [earTemp, setEarTemp] = useState('39.2');
  const [eatingDrop, setEatingDrop] = useState('yes');
  const [result, setResult] = useState(null);

  const handleCheck = (e) => {
    e.preventDefault();
    const mins = parseFloat(ruminationMins) || 450;
    const temp = parseFloat(earTemp) || 38.6;

    let alertType = 'HEALTHY';
    let meaning = 'Normal Cow';
    let explanation = 'Rumination and ear temperature are within normal physiological range.';
    let action = 'No treatment needed. Continue standard daily monitoring.';

    if (mins < 280 || temp >= 39.8) {
      alertType = 'SICK';
      meaning = 'Orange / Red Alert';
      explanation = 'Severe rumination drop (>35%) with significant temperature change. Acute clinical risk.';
      action = 'Physically examine cow immediately. Check for swollen quarters. Isolate from milking line and notify vet.';
    } else if (mins < 400 || temp >= 39.2 || eatingDrop === 'yes') {
      alertType = 'SUSPICIOUS';
      meaning = 'Yellow Alert (7-14 Days Before Clinical Symptoms)';
      explanation = 'Moderate reduction in cud chewing and ear temperature drift. Early subclinical mastitis flag.';
      action = 'Apply ICAR herbal paste (Aloe vera + Turmeric + Lime) 3x daily. Milk this cow last to prevent herd spread.';
    }

    const cow = cattle.find((c) => c.id === selectedCowId);
    setResult({
      name: cow?.name || 'Cow',
      tag: cow?.tag || 'TAG',
      alertType,
      meaning,
      explanation,
      action,
      ruminationMins: mins,
      earTemp: temp,
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 text-slate-800">
      <div>
        <h1 className="text-xl font-bold text-slate-900">CowManager Health Check</h1>
        <p className="text-xs text-slate-500">
          Evaluates ear sensor rumination minutes and temperature against individual cow baseline
        </p>
      </div>

      <form onSubmit={handleCheck} className="bg-white border border-slate-200 rounded shadow-sm p-5 space-y-4 text-xs">
        <div>
          <label className="block text-slate-700 font-bold mb-1">Select Cow</label>
          <select
            value={selectedCowId}
            onChange={(e) => setSelectedCowId(e.target.value)}
            className="w-full border border-slate-300 rounded p-2 text-sm bg-white outline-none"
          >
            {cattle.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} (Tag #{c.tag}) — {c.breed}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-700 font-bold mb-1">24h Rumination (Minutes)</label>
            <input
              type="number"
              value={ruminationMins}
              onChange={(e) => setRuminationMins(e.target.value)}
              className="w-full border border-slate-300 rounded p-2 text-sm outline-none"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">Normal: 450 - 550 minutes/day</span>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Ear Sensor Temp (°C)</label>
            <input
              type="number"
              step="0.1"
              value={earTemp}
              onChange={(e) => setEarTemp(e.target.value)}
              className="w-full border border-slate-300 rounded p-2 text-sm outline-none"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">Normal: 38.5 - 39.0 °C</span>
          </div>
        </div>

        <div>
          <label className="block text-slate-700 font-bold mb-1">Eating & Grazing Behavior</label>
          <select
            value={eatingDrop}
            onChange={(e) => setEatingDrop(e.target.value)}
            className="w-full border border-slate-300 rounded p-2 text-sm bg-white outline-none"
          >
            <option value="no">Normal Eating Time (4-6 hours/day)</option>
            <option value="yes">Noticeable Drop in Feeding Time</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded text-sm transition-colors"
        >
          Evaluate CowManager Alert Status
        </button>
      </form>

      {result && (
        <div
          className={`border rounded p-4 shadow-sm space-y-3 ${
            result.alertType === 'SICK'
              ? 'bg-red-50 border-red-300'
              : result.alertType === 'SUSPICIOUS'
              ? 'bg-amber-50 border-amber-300'
              : 'bg-emerald-50 border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-black/10">
            <div>
              <span className="font-bold text-sm text-slate-900">
                {result.name} (Tag #{result.tag})
              </span>
              <span className="text-xs text-slate-600 block">{result.meaning}</span>
            </div>
            <span
              className={`text-xs font-black px-3 py-1 rounded tracking-wider ${
                result.alertType === 'SICK'
                  ? 'bg-red-600 text-white'
                  : result.alertType === 'SUSPICIOUS'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              {result.alertType}
            </span>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed font-medium">{result.explanation}</p>

          <div className="pt-2 border-t border-black/10">
            <strong className="text-[11px] uppercase tracking-wide text-slate-900 block mb-1">
              Farm Management Protocol:
            </strong>
            <p className="text-xs text-slate-800 font-semibold">{result.action}</p>
          </div>
        </div>
      )}
    </div>
  );
}
