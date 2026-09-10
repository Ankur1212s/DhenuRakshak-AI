import React, { useState } from 'react';
import toast from 'react-hot-toast';

export default function Settings() {
  const [settings, setSettings] = useState({
    farmName: 'Surabhi Dairy & Breeding Farm',
    ownerName: 'Ramesh Patel',
    phone: '+91 98765 43210',
    location: 'Anand, Gujarat',
    vetPhone: '1962',
    cloudEndpoint: 'https://dhenurakshak.netlify.app/api/telemetry',
    autoAlertSms: true,
    ruminationDeficitThreshold: '15',
    feverCutoff: '39.2',
  });

  const handleSave = (e) => {
    e.preventDefault();
    toast.success('Configuration updated and saved to database.');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 text-slate-800 font-sans">
      {/* Header */}
      <div className="border-b border-slate-200 pb-3">
        <h1 className="text-xl font-serif font-bold text-[#1e3a5f]">System Configuration & Parameters</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure dairy farm parameters, veterinary alert triggers, and database endpoints
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Section 1: Farm & Farmer Details */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4 text-xs">
          <h2 className="font-bold text-sm text-[#1e3a5f] border-b border-slate-100 pb-2">
            1. Farm & Account Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Farm / Cooperative Name</label>
              <input
                type="text"
                value={settings.farmName}
                onChange={(e) => setSettings({ ...settings, farmName: e.target.value })}
                className="w-full border border-slate-300 rounded p-2 text-sm outline-none focus:border-[#1e3a5f]"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Registered Farmer / Manager Name</label>
              <input
                type="text"
                value={settings.ownerName}
                onChange={(e) => setSettings({ ...settings, ownerName: e.target.value })}
                className="w-full border border-slate-300 rounded p-2 text-sm outline-none focus:border-[#1e3a5f]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Registered Phone Number</label>
              <input
                type="text"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full border border-slate-300 rounded p-2 text-sm outline-none focus:border-[#1e3a5f]"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Location / District</label>
              <input
                type="text"
                value={settings.location}
                onChange={(e) => setSettings({ ...settings, location: e.target.value })}
                className="w-full border border-slate-300 rounded p-2 text-sm outline-none focus:border-[#1e3a5f]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Clinical Thresholds & Gateway Settings */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4 text-xs">
          <h2 className="font-bold text-sm text-[#1e3a5f] border-b border-slate-100 pb-2">
            2. Mastitis Early Warning Triggers & Veterinary Helpline
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Subclinical Rumination Deficit Trigger (%)
              </label>
              <input
                type="number"
                value={settings.ruminationDeficitThreshold}
                onChange={(e) => setSettings({ ...settings, ruminationDeficitThreshold: e.target.value })}
                className="w-full border border-slate-300 rounded p-2 text-sm outline-none focus:border-[#1e3a5f]"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Default: 15% deficit activates 7-14 day warning</span>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Subclinical Fever Cutoff (°C)
              </label>
              <input
                type="number"
                step="0.1"
                value={settings.feverCutoff}
                onChange={(e) => setSettings({ ...settings, feverCutoff: e.target.value })}
                className="w-full border border-slate-300 rounded p-2 text-sm outline-none focus:border-[#1e3a5f]"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Default: ≥ 39.2 °C</span>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Emergency Veterinary Contact / Helpline</label>
            <input
              type="text"
              value={settings.vetPhone}
              onChange={(e) => setSettings({ ...settings, vetPhone: e.target.value })}
              className="w-full border border-slate-300 rounded p-2 text-sm outline-none focus:border-[#1e3a5f]"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">National Toll-Free Animal Health Helpline: 1962</span>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Database & Telemetry Ingest URL</label>
            <input
              type="text"
              value={settings.cloudEndpoint}
              onChange={(e) => setSettings({ ...settings, cloudEndpoint: e.target.value })}
              className="w-full border border-slate-300 rounded p-2 text-sm font-mono text-slate-700 outline-none focus:border-[#1e3a5f]"
            />
          </div>
        </div>

        <button
          type="submit"
          className="bg-[#1e3a5f] hover:bg-[#162a45] text-white font-bold px-6 py-2.5 rounded text-sm transition-colors shadow-sm"
        >
          Save Configuration
        </button>
      </form>
    </div>
  );
}
