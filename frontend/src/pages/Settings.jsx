import React, { useState } from 'react';
import { Terminal, Save, Sliders, Radio } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Settings() {
  const [config, setConfig] = useState({
    gatewayUrl: 'https://dhenurakshak.netlify.app',
    dutyIntervalSec: '300',
    sleepWakeupPin: 'GPIO_33 (EXT0)',
    subclinicalDeficitThreshold: '15',
    feverThresholdC: '39.2',
  });

  const handleSave = (e) => {
    e.preventDefault();
    toast.success('System configuration saved.');
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="border border-[#30363d] bg-[#161b22] p-3 rounded-md flex items-center justify-between">
        <div className="flex items-center space-x-2 font-bold text-[#f0f6fc]">
          <Terminal size={14} className="text-[#8b949e]" />
          <span>[ 07_SYSTEM_CONFIG ] — EAR-TAG & GATEWAY DAEMON PARAMETERS</span>
        </div>
        <span className="text-[#3fb950]">CONFIG VALID</span>
      </div>

      <form onSubmit={handleSave} className="border border-[#30363d] bg-[#161b22] p-4 rounded-md space-y-3 max-w-xl">
        <div>
          <label className="block text-[#8b949e] mb-1">CLOUD TELEMETRY INGEST ENDPOINT</label>
          <input
            type="text"
            value={config.gatewayUrl}
            onChange={(e) => setConfig({ ...config, gatewayUrl: e.target.value })}
            className="w-full bg-[#0d1117] border border-[#30363d] rounded p-2 text-[#f0f6fc] outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[#8b949e] mb-1">DUTY CYCLE INTERVAL (SECONDS)</label>
            <input
              type="number"
              value={config.dutyIntervalSec}
              onChange={(e) => setConfig({ ...config, dutyIntervalSec: e.target.value })}
              className="w-full bg-[#0d1117] border border-[#30363d] rounded p-2 text-[#f0f6fc] outline-none"
            />
          </div>
          <div>
            <label className="block text-[#8b949e] mb-1">DEEP SLEEP WAKEUP PIN</label>
            <input
              type="text"
              disabled
              value={config.sleepWakeupPin}
              className="w-full bg-[#0d1117] border border-[#30363d] rounded p-2 text-[#8b949e] outline-none cursor-not-allowed"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[#8b949e] mb-1">SUBCLINICAL DEFICIT THRESHOLD (%)</label>
            <input
              type="number"
              value={config.subclinicalDeficitThreshold}
              onChange={(e) => setConfig({ ...config, subclinicalDeficitThreshold: e.target.value })}
              className="w-full bg-[#0d1117] border border-[#30363d] rounded p-2 text-[#f0f6fc] outline-none"
            />
          </div>
          <div>
            <label className="block text-[#8b949e] mb-1">SUBCLINICAL FEVER CUTOFF (°C)</label>
            <input
              type="number"
              step="0.1"
              value={config.feverThresholdC}
              onChange={(e) => setConfig({ ...config, feverThresholdC: e.target.value })}
              className="w-full bg-[#0d1117] border border-[#30363d] rounded p-2 text-[#f0f6fc] outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          className="bg-[#238636] hover:bg-[#2ea043] text-black font-bold px-4 py-2 rounded flex items-center space-x-1.5"
        >
          <Save size={13} className="stroke-[3]" />
          <span>COMMIT_CONFIG</span>
        </button>
      </form>
    </div>
  );
}
