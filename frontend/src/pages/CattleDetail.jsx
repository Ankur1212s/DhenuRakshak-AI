import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useCattleStore from '../store/cattleStore';
import toast from 'react-hot-toast';

export default function CattleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cattle } = useCattleStore();

  const cow = cattle.find((c) => c.id === id);

  // Health records & lab reports state stored in memory / local state
  const [records, setRecords] = useState([
    {
      id: 1,
      date: '08 Sep 2026',
      type: 'Bacteriology & Culture',
      doctor: 'Dr. V. Sharma (B.V.Sc)',
      scc: '140,000 cells/mL',
      findings: 'Negative for Streptococcus agalactiae. Normal milk microbiota.',
      action: 'Routine pre-dip and post-dip milking hygiene.',
      status: 'NORMAL',
    },
    {
      id: 2,
      date: '25 Aug 2026',
      type: 'California Mastitis Test (CMT)',
      doctor: 'Dr. V. Sharma (B.V.Sc)',
      scc: '280,000 cells/mL',
      findings: 'Trace precipitation observed in Right Hind quarter. 7-14 day subclinical alert.',
      action: 'Applied ICAR Aloe vera + Turmeric + Lime herbal paste for 5 days. Full recovery.',
      status: 'RESOLVED',
    },
  ]);

  // Form modal state for adding new health/lab record
  const [showModal, setShowModal] = useState(false);
  const [newRecord, setNewRecord] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'Somatic Cell Count (SCC) Lab Slip',
    doctor: 'Dr. V. Sharma',
    scc: '180,000',
    findings: '',
    action: '',
    status: 'NORMAL',
  });

  if (!cow) {
    return (
      <div className="text-center py-12 space-y-3 font-sans">
        <h2 className="text-lg font-bold text-slate-800">Cattle Record Not Found</h2>
        <button onClick={() => navigate('/cattle')} className="text-xs text-[#1e3a5f] font-bold hover:underline">
          ← Return to Cattle Registry
        </button>
      </div>
    );
  }

  const handleAddRecord = (e) => {
    e.preventDefault();
    if (!newRecord.findings) {
      toast.error('Please enter diagnosis findings');
      return;
    }

    const created = {
      ...newRecord,
      id: Date.now(),
      scc: newRecord.scc + ' cells/mL',
    };

    setRecords([created, ...records]);
    toast.success(`Health record added for ${cow.name}`);
    setShowModal(false);
    setNewRecord({
      date: new Date().toISOString().split('T')[0],
      type: 'Somatic Cell Count (SCC) Lab Slip',
      doctor: 'Dr. V. Sharma',
      scc: '180,000',
      findings: '',
      action: '',
      status: 'NORMAL',
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-slate-800 font-sans">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <button
          onClick={() => navigate('/cattle')}
          className="text-xs text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1"
        >
          ← Back to Cattle Registry
        </button>
        <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded font-mono font-semibold border border-slate-200">
          HOST_ID: {cow.tag}
        </span>
      </div>

      {/* ── Cow Identity Card (IIT Institutional Style) ── */}
      <div className="bg-white border-2 border-slate-200 rounded-lg p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-serif font-bold text-[#1e3a5f]">{cow.name}</h1>
              <span className="text-xs bg-[#1e3a5f] text-white font-mono font-bold px-2 py-0.5 rounded">
                Tag #{cow.tag}
              </span>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded ${
                  cow.riskLevel === 'HIGH'
                    ? 'bg-red-100 text-red-800'
                    : cow.riskLevel === 'MEDIUM'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {cow.riskLevel === 'HIGH' ? 'SICK (CLINICAL)' : cow.riskLevel === 'MEDIUM' ? 'SUSPICIOUS (7-14D)' : 'HEALTHY'}
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
              <span>Breed: <strong className="text-slate-700">{cow.breed}</strong></span>
              <span>•</span>
              <span>Age: <strong className="text-slate-700">{cow.age} years</strong></span>
              <span>•</span>
              <span>Lactation: <strong className="text-slate-700">Cycle {cow.lactation || 2}</strong></span>
              <span>•</span>
              <span>Daily Milk: <strong className="text-slate-700">{cow.milkYield} L/day</strong></span>
            </div>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="bg-[#1e3a5f] hover:bg-[#162a45] text-white font-bold px-4 py-2 rounded text-xs transition-colors self-start sm:self-auto shadow-sm"
          >
            + Add Lab / Medical Record
          </button>
        </div>
      </div>

      {/* ── Cow Vitals & Sensor Indicators ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-white border border-slate-200 rounded p-3 shadow-xs">
          <div className="text-slate-500 text-[11px] font-medium">Core Temperature</div>
          <div className="text-xl font-bold text-[#1e3a5f] font-mono mt-1">
            {cow.riskLevel === 'HIGH' ? '40.1' : cow.riskLevel === 'MEDIUM' ? '39.2' : '38.6'} °C
          </div>
          <div className="text-[10px] text-emerald-600 mt-0.5">Automated ear sensor</div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-3 shadow-xs">
          <div className="text-slate-500 text-[11px] font-medium">24h Rumination</div>
          <div className="text-xl font-bold text-[#1e3a5f] font-mono mt-1">
            {cow.riskLevel === 'HIGH' ? '210' : cow.riskLevel === 'MEDIUM' ? '340' : '480'} mins
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Cud chewing time</div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-3 shadow-xs">
          <div className="text-slate-500 text-[11px] font-medium">Last Known SCC</div>
          <div className="text-xl font-bold text-[#1e3a5f] font-mono mt-1">
            {cow.riskLevel === 'HIGH' ? '720k' : cow.riskLevel === 'MEDIUM' ? '290k' : '140k'}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">cells / mL</div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-3 shadow-xs">
          <div className="text-slate-500 text-[11px] font-medium">Days In Milk (DIM)</div>
          <div className="text-xl font-bold text-[#1e3a5f] font-mono mt-1">
            {cow.daysInMilk || 45} days
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Active lactation</div>
        </div>
      </div>

      {/* ── Health History & Veterinary Lab Records Archive ── */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-sm font-serif font-bold text-[#1e3a5f]">
              Permanent Veterinary Lab & Medical History Archive
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Historical clinical reports, CMT test scores, somatic cell counts, and veterinarian remarks for {cow.name}
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {records.length} Records Stored
          </span>
        </div>

        <div className="space-y-3.5 divide-y divide-slate-100">
          {records.map((r) => (
            <div key={r.id} className="pt-3.5 first:pt-0 space-y-1.5 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                    {r.date}
                  </span>
                  <span className="font-bold text-[#1e3a5f]">{r.type}</span>
                  <span className="text-slate-400">• Attending: {r.doctor}</span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    r.status === 'NORMAL'
                      ? 'bg-emerald-100 text-emerald-800'
                      : r.status === 'RESOLVED'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {r.status}
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1">
                <div>
                  <strong className="text-slate-700">Lab Findings & Pathogen Markers:</strong>{' '}
                  <span className="text-slate-800">{r.findings}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  <span>Somatic Cell Count: <strong>{r.scc}</strong></span>
                </div>
                <div className="pt-1 border-t border-slate-200/60 text-slate-700">
                  <strong className="text-slate-900">Treatment & Clinical Action Taken:</strong> {r.action}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Add Lab Record */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-5 space-y-4 shadow-xl border border-slate-300 text-xs">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <h3 className="font-bold text-sm text-[#1e3a5f]">
                Record Medical / Lab Test for {cow.name} ({cow.tag})
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 font-bold text-base">✕</button>
            </div>

            <form onSubmit={handleAddRecord} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Test Date</label>
                  <input
                    type="date"
                    required
                    value={newRecord.date}
                    onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Attending Veterinarian</label>
                  <input
                    type="text"
                    required
                    value={newRecord.doctor}
                    onChange={(e) => setNewRecord({ ...newRecord, doctor: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 text-xs outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Medical Test Type</label>
                  <select
                    value={newRecord.type}
                    onChange={(e) => setNewRecord({ ...newRecord, type: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 text-xs outline-none bg-white"
                  >
                    <option value="Somatic Cell Count (SCC) Lab Slip">SCC Lab Slip</option>
                    <option value="California Mastitis Test (CMT)">California Mastitis Test (CMT)</option>
                    <option value="Bacteriology & Culture">Milk Bacteriology & Culture</option>
                    <option value="Quarter Electrical Conductivity Scan">Quarter Conductivity Scan</option>
                    <option value="Routine Veterinary Health Inspection">Routine Health Inspection</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">SCC (cells/mL)</label>
                  <input
                    type="text"
                    placeholder="e.g. 180,000"
                    value={newRecord.scc}
                    onChange={(e) => setNewRecord({ ...newRecord, scc: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Diagnosis & Laboratory Findings</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Trace precipitation in Right Hind quarter, mild SCC elevation..."
                  value={newRecord.findings}
                  onChange={(e) => setNewRecord({ ...newRecord, findings: e.target.value })}
                  className="w-full border border-slate-300 rounded p-2 text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Prescribed Action / Treatment</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Applied ICAR phytotherapy paste, isolated milk for 3 days..."
                  value={newRecord.action}
                  onChange={(e) => setNewRecord({ ...newRecord, action: e.target.value })}
                  className="w-full border border-slate-300 rounded p-2 text-xs outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#1e3a5f] hover:bg-[#162a45] text-white font-bold rounded"
                >
                  Save Record to Cow Archive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
