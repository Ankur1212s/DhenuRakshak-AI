import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useCattleStore from '../store/cattleStore';
import { Layers, Plus, Search, Filter, ShieldAlert, Tag, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Cattle() {
  const navigate = useNavigate();
  const { cattle, addCattle } = useCattleStore();
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    tag: '',
    breed: 'Gir',
    age: '4',
    milkYield: '14.0',
    village: 'Barn A',
  });

  const filtered = cattle.filter((c) => {
    const matchFilter = filter === 'ALL' || c.riskLevel === filter;
    const s = search.toLowerCase();
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(s) ||
      c.tag.toLowerCase().includes(s) ||
      c.breed.toLowerCase().includes(s);
    return matchFilter && matchSearch;
  });

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.name || !form.tag) {
      toast.error('Name & Ear-Tag ID required');
      return;
    }
    addCattle({
      ...form,
      age: Number(form.age) || 4,
      milkYield: Number(form.milkYield) || 12,
      riskLevel: 'LOW',
      lactation: 2,
      daysInMilk: 45,
      lastChecked: 'Today',
    });
    toast.success(`Registered host ${form.tag}`);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Top Controls Console Header */}
      <div className="border border-[#30363d] bg-[#161b22] p-3 rounded-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-[#f0f6fc] tracking-wider">[ 02_HOST_REGISTRY ]</span>
          <span className="text-[#8b949e]">| Total Hosts: {cattle.length}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search bar */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-2.5 text-[#8b949e]" />
            <input
              type="text"
              placeholder="Search tag/host..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#0d1117] border border-[#30363d] rounded pl-8 pr-3 py-1.5 text-xs text-[#f0f6fc] focus:border-[#58a6ff] outline-none"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex border border-[#30363d] rounded bg-[#0d1117] p-0.5">
            {['ALL', 'LOW', 'MEDIUM', 'HIGH'].map((k) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                  filter === k
                    ? 'bg-[#21262d] text-[#f0f6fc] border border-[#30363d]'
                    : 'text-[#8b949e] hover:text-[#c9d1d9]'
                }`}
              >
                {k === 'ALL' ? 'ALL' : k === 'LOW' ? 'NORMAL' : k === 'MEDIUM' ? 'WATCH' : 'CLINICAL'}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#238636] hover:bg-[#2ea043] text-black font-bold px-3 py-1.5 rounded flex items-center space-x-1.5"
          >
            <Plus size={13} className="stroke-[3]" />
            <span>ENROLL_HOST</span>
          </button>
        </div>
      </div>

      {/* High-density Host Table */}
      <div className="border border-[#30363d] bg-[#161b22] rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#30363d] text-[#8b949e] bg-[#21262d] text-[11px]">
                <th className="py-2.5 px-3">EAR_TAG</th>
                <th className="py-2.5 px-3">HOST_NAME</th>
                <th className="py-2.5 px-3">BREED</th>
                <th className="py-2.5 px-3">AGE</th>
                <th className="py-2.5 px-3">HEALTH_STATE</th>
                <th className="py-2.5 px-3">MILK_YIELD</th>
                <th className="py-2.5 px-3">LAST_PROBE</th>
                <th className="py-2.5 px-3">LOCATION</th>
                <th className="py-2.5 px-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30363d]">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-[#21262d]/70 transition-colors">
                  <td className="py-2.5 px-3 text-[#58a6ff] font-bold">{c.tag}</td>
                  <td className="py-2.5 px-3 text-[#f0f6fc] font-semibold">{c.name}</td>
                  <td className="py-2.5 px-3 text-[#8b949e]">{c.breed}</td>
                  <td className="py-2.5 px-3 text-[#8b949e]">{c.age} yrs</td>
                  <td className="py-2.5 px-3 font-bold">
                    {c.riskLevel === 'HIGH' ? (
                      <span className="text-[#f85149] bg-[#f85149]/10 px-2 py-0.5 rounded border border-[#f85149]/30">● CLINICAL_HIGH</span>
                    ) : c.riskLevel === 'MEDIUM' ? (
                      <span className="text-[#d29922] bg-[#d29922]/10 px-2 py-0.5 rounded border border-[#d29922]/30">▲ SUBCLINICAL (7-14d)</span>
                    ) : (
                      <span className="text-[#3fb950] bg-[#3fb950]/10 px-2 py-0.5 rounded border border-[#3fb950]/30">✔ OPTIMAL</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-[#f0f6fc]">{c.milkYield} L/d</td>
                  <td className="py-2.5 px-3 text-[#8b949e]">{c.lastChecked || 'Active'}</td>
                  <td className="py-2.5 px-3 text-[#8b949e]">{c.village || 'Anand Shed'}</td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => navigate(`/cattle/${c.id}`)}
                      className="px-2 py-1 rounded bg-[#0d1117] border border-[#30363d] text-[#58a6ff] hover:border-[#58a6ff]"
                    >
                      AUDIT_LOG &gt;
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal (Console Dialog) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="border border-[#30363d] bg-[#161b22] max-w-md w-full p-4 rounded-md space-y-3">
            <div className="border-b border-[#30363d] pb-2 font-bold text-[#f0f6fc] flex justify-between">
              <span>ENROLL NEW EAR-TAG NODE / HOST</span>
              <button onClick={() => setShowAddModal(false)} className="text-[#8b949e] hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAdd} className="space-y-2.5">
              <div>
                <label className="block text-[#8b949e] mb-1">HOST NAME</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kamdhenu"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded p-2 text-[#f0f6fc] outline-none"
                />
              </div>

              <div>
                <label className="block text-[#8b949e] mb-1">RFID / EAR-TAG ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TAG-009"
                  value={form.tag}
                  onChange={(e) => setForm({ ...form, tag: e.target.value })}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded p-2 text-[#f0f6fc] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#8b949e] mb-1">BREED</label>
                  <select
                    value={form.breed}
                    onChange={(e) => setForm({ ...form, breed: e.target.value })}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded p-2 text-[#f0f6fc] outline-none"
                  >
                    {['Gir', 'Sahiwal', 'Murrah', 'HF Cross', 'Jersey', 'Rathi', 'Tharparkar'].map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[#8b949e] mb-1">BASELINE YIELD (L)</label>
                  <input
                    type="number"
                    value={form.milkYield}
                    onChange={(e) => setForm({ ...form, milkYield: e.target.value })}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded p-2 text-[#f0f6fc] outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#30363d]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 border border-[#30363d] rounded text-[#8b949e]"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#238636] text-black font-bold rounded"
                >
                  SAVE_HOST
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
