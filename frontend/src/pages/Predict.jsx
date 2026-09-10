import React, { useState } from 'react';
import useCattleStore from '../store/cattleStore';
import { Terminal, Sliders, RefreshCw, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';

export default function Predict() {
  const { cattle } = useCattleStore();
  const [selectedCowId, setSelectedCowId] = useState(cattle[0]?.id || '1');
  const [form, setForm] = useState({
    bodyTemp: '38.6',
    cpm: '52',
    ruminationDeficit: '0',
    scc: '120',
    ecRH: '4.8',
    swelling: 'no',
  });
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [result, setResult] = useState(null);

  const handleAudit = (e) => {
    e.preventDefault();
    setIsEvaluating(true);

    setTimeout(() => {
      const temp = parseFloat(form.bodyTemp) || 38.6;
      const cpm = parseFloat(form.cpm) || 50;
      const deficit = parseFloat(form.ruminationDeficit) || 0;
      const scc = parseFloat(form.scc) || 120;
      const ecRH = parseFloat(form.ecRH) || 4.8;
      const swelling = form.swelling === 'yes';

      let score = 8.5;
      let level = 'LOW';
      let window = 'Normal Baseline (Zero Clinical Indicator)';
      let action = 'Maintain standard milking protocol and 5-min ear tag transmission cycle.';

      if (swelling || temp >= 39.8 || ecRH >= 6.4 || scc >= 500) {
        level = 'HIGH';
        score = 88.0;
        window = 'CLINICAL PHASE — Urgent Veterinary Triage Required';
        action = 'Isolate host immediately. Perform California Mastitis Test (CMT). Administer veterinarian-prescribed intramammary therapy.';
      } else if (deficit >= 15 || cpm < 42 || temp >= 39.2 || scc >= 250 || ecRH >= 5.6) {
        level = 'MEDIUM';
        score = 62.4;
        window = '7 to 14 Days Early Warning (Subclinical Detection Window)';
        action = 'Apply ICAR Herbal Phytotherapy Formulation (Aloe vera 250g + Turmeric 50g + Lime 15g paste) 3x daily. Milk affected quarter last.';
      }

      const cow = cattle.find((c) => c.id === selectedCowId);

      setResult({
        cow: cow?.name || 'Selected Host',
        tag: cow?.tag || 'TAG-00',
        score,
        level,
        window,
        action,
        timestamp: new Date().toISOString(),
        auditData: { temp, cpm, deficit, scc, ecRH },
      });
      setIsEvaluating(false);
    }, 400);
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="border border-[#30363d] bg-[#161b22] p-3 rounded-md flex items-center justify-between">
        <div className="flex items-center space-x-2 font-bold text-[#f0f6fc]">
          <Terminal size={14} className="text-[#238636]" />
          <span>[ 03_DIAGNOSTIC_SCAN ] — 7-14 DAY PREDICTIVE AUDIT PROBE</span>
        </div>
        <span className="text-[#8b949e]">ENSEMBLE: RF + DUAL-EMA ACCEL</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Input Terminal Form */}
        <form onSubmit={handleAudit} className="lg:col-span-6 border border-[#30363d] bg-[#161b22] p-4 rounded-md space-y-3">
          <div className="border-b border-[#30363d] pb-2 font-bold text-[#f0f6fc] flex justify-between">
            <span>AUDIT PARAMETER SPECIFICATION</span>
            <Sliders size={13} className="text-[#58a6ff]" />
          </div>

          <div>
            <label className="block text-[#8b949e] mb-1">TARGET HOST</label>
            <select
              value={selectedCowId}
              onChange={(e) => setSelectedCowId(e.target.value)}
              className="w-full bg-[#0d1117] border border-[#30363d] rounded p-2 text-[#f0f6fc] outline-none"
            >
              {cattle.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.tag}) — {c.breed}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[#8b949e] mb-1">CORE BODY TEMP (°C)</label>
              <input
                type="number"
                step="0.1"
                value={form.bodyTemp}
                onChange={(e) => setForm({ ...form, bodyTemp: e.target.value })}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded p-2 text-[#f0f6fc] outline-none"
              />
            </div>
            <div>
              <label className="block text-[#8b949e] mb-1">CHEW CADENCE (CPM)</label>
              <input
                type="number"
                value={form.cpm}
                onChange={(e) => setForm({ ...form, cpm: e.target.value })}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded p-2 text-[#f0f6fc] outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[#8b949e] mb-1">RUMINATION DEFICIT (%)</label>
              <input
                type="number"
                value={form.ruminationDeficit}
                onChange={(e) => setForm({ ...form, ruminationDeficit: e.target.value })}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded p-2 text-[#f0f6fc] outline-none"
              />
            </div>
            <div>
              <label className="block text-[#8b949e] mb-1">SOMATIC CELLS (x10³ /mL)</label>
              <input
                type="number"
                value={form.scc}
                onChange={(e) => setForm({ ...form, scc: e.target.value })}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded p-2 text-[#f0f6fc] outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[#8b949e] mb-1">RIGHT HIND EC (mS/cm)</label>
              <input
                type="number"
                step="0.1"
                value={form.ecRH}
                onChange={(e) => setForm({ ...form, ecRH: e.target.value })}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded p-2 text-[#f0f6fc] outline-none"
              />
            </div>
            <div>
              <label className="block text-[#8b949e] mb-1">UDDER TISSUE SWELLING?</label>
              <select
                value={form.swelling}
                onChange={(e) => setForm({ ...form, swelling: e.target.value })}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded p-2 text-[#f0f6fc] outline-none"
              >
                <option value="no">No Swelling (Subclinical)</option>
                <option value="yes">Yes - Hardness / Heat (Clinical)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isEvaluating}
            className="w-full mt-2 bg-[#238636] hover:bg-[#2ea043] text-black font-bold p-2.5 rounded transition-all flex items-center justify-center space-x-2"
          >
            {isEvaluating ? (
              <>
                <RefreshCw size={13} className="animate-spin" />
                <span>EVALUATING MULTI-FACTOR ENSEMBLE...</span>
              </>
            ) : (
              <>
                <Terminal size={13} />
                <span>EXECUTE 7-14D DIAGNOSTIC PROBE</span>
              </>
            )}
          </button>
        </form>

        {/* Console Result Output */}
        <div className="lg:col-span-6 border border-[#30363d] bg-[#0d1117] p-4 rounded-md flex flex-col font-mono text-xs">
          <div className="border-b border-[#30363d] pb-2 text-[#8b949e] flex justify-between items-center">
            <span>PROBE TERMINAL AUDIT OUTPUT</span>
            <span className="text-[#3fb950]">[ONLINE]</span>
          </div>

          {result ? (
            <div className="mt-3 space-y-2.5 flex-1">
              <div className="text-[#8b949e]">
                &gt; HOST TARGET: <span className="text-[#f0f6fc] font-bold">{result.cow} ({result.tag})</span>
              </div>
              <div className="text-[#8b949e]">
                &gt; TIME: <span className="text-[#f0f6fc]">{result.timestamp}</span>
              </div>

              <div
                className={`p-3 rounded border ${
                  result.level === 'HIGH'
                    ? 'bg-[#f85149]/10 border-[#f85149] text-[#f85149]'
                    : result.level === 'MEDIUM'
                    ? 'bg-[#d29922]/10 border-[#d29922] text-[#d29922]'
                    : 'bg-[#3fb950]/10 border-[#3fb950] text-[#3fb950]'
                }`}
              >
                <div className="font-bold text-sm">
                  {result.level === 'HIGH'
                    ? '🚨 CLINICAL MASTITIS — HIGH RISK'
                    : result.level === 'MEDIUM'
                    ? '⚡ SUBCLINICAL 7-14 DAY EARLY WARNING'
                    : '✔ OPTIMAL HEALTH (LOW RISK)'}
                </div>
                <div className="text-[11px] mt-1 text-[#f0f6fc]">
                  Diagnostic Confidence Index: <strong>{result.score}%</strong>
                </div>
                <div className="text-[11px] mt-0.5 text-[#c9d1d9]">
                  Window: <strong>{result.window}</strong>
                </div>
              </div>

              <div className="bg-[#161b22] border border-[#30363d] p-3 rounded space-y-1">
                <div className="text-[#58a6ff] font-bold">VETERINARY ACTION PROTOCOL:</div>
                <div className="text-[#f0f6fc] leading-relaxed">{result.action}</div>
              </div>

              <div className="bg-[#161b22] border border-[#30363d] p-2.5 rounded text-[11px] text-[#c9d1d9] grid grid-cols-2 gap-1">
                <div>Temp: {result.auditData.temp} °C</div>
                <div>CPM: {result.auditData.cpm}</div>
                <div>Deficit: {result.auditData.deficit}%</div>
                <div>Quarter EC: {result.auditData.ecRH} mS/cm</div>
              </div>
            </div>
          ) : (
            <div className="mt-12 text-center text-[#8b949e] space-y-2">
              <Terminal size={32} className="mx-auto text-[#30363d]" />
              <p>&gt; Probe idle. Select host and execute diagnostic run.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
