import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import useCattleStore from '../store/cattleStore';

export default function Cattle() {
  const { cattle, addCattle } = useCattleStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    tag: '',
    breed: 'Gir',
    age: '4',
    milkYield: '14.0',
  });

  const filtered = cattle.filter((c) => {
    const matchesFilter = filter === 'ALL' || c.riskLevel === filter;
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.tag.toLowerCase().includes(search.toLowerCase()) ||
      c.breed.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.tag) return;
    addCattle({
      ...form,
      age: Number(form.age) || 4,
      milkYield: Number(form.milkYield) || 12,
      riskLevel: 'LOW',
    });
    setShowModal(false);
    setForm({ name: '', tag: '', breed: 'Gir', age: '4', milkYield: '14.0' });
  };

  return (
    <div className="space-y-4 text-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Cow List & Ear Sensors</h1>
          <p className="text-xs text-slate-500">Monitor individual cow health, behavior, and ear-tag status</p>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Search cow or tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-slate-300 rounded px-3 py-1.5 text-xs bg-white outline-none"
          />
          <div className="flex border border-slate-300 rounded bg-white p-0.5 text-xs">
            {['ALL', 'LOW', 'MEDIUM', 'HIGH'].map((k) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`px-2.5 py-1 rounded font-bold ${
                  filter === k
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {k === 'ALL' ? 'All' : k === 'LOW' ? 'Healthy' : k === 'MEDIUM' ? 'Suspicious' : 'Sick'}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-slate-900 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-slate-800"
          >
            + Add Cow
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 uppercase border-b border-slate-200 font-semibold">
            <tr>
              <th className="py-3 px-4">Tag</th>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Breed</th>
              <th className="py-3 px-4">Age</th>
              <th className="py-3 px-4">Milk Yield</th>
              <th className="py-3 px-4">24h Rumination</th>
              <th className="py-3 px-4">Health Alert</th>
              <th className="py-3 px-4 text-right">Medical History</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((cow) => (
              <tr key={cow.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-3 px-4 font-mono font-bold text-slate-900">{cow.tag}</td>
                <td className="py-3 px-4 font-semibold text-slate-800">{cow.name}</td>
                <td className="py-3 px-4 text-slate-500">{cow.breed}</td>
                <td className="py-3 px-4 text-slate-500">{cow.age} yrs</td>
                <td className="py-3 px-4 font-medium text-slate-700">{cow.milkYield} L</td>
                <td className="py-3 px-4 font-medium">
                  {cow.riskLevel === 'HIGH' ? (
                    <span className="text-red-600 font-bold">210 mins (-45%)</span>
                  ) : cow.riskLevel === 'MEDIUM' ? (
                    <span className="text-amber-600 font-bold">340 mins (-22%)</span>
                  ) : (
                    <span className="text-emerald-700">480 mins (Normal)</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  {cow.riskLevel === 'HIGH' ? (
                    <span className="bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded text-[11px]">
                      SICK
                    </span>
                  ) : cow.riskLevel === 'MEDIUM' ? (
                    <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[11px]">
                      SUSPICIOUS
                    </span>
                  ) : (
                    <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[11px]">
                      HEALTHY
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-right">
                  <Link
                    to={`/cattle/${cow.id}`}
                    className="text-[#1e3a5f] hover:underline font-bold text-[11px] inline-flex items-center gap-1"
                  >
                    <span>Lab Records</span>
                    <span>→</span>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded max-w-md w-full p-5 space-y-4 shadow-lg border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <h3 className="font-bold text-sm text-slate-900">Add Cow & Ear Tag</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Cow Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kamdhenu"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-slate-300 rounded p-2 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Ear Tag #</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TAG-102"
                  value={form.tag}
                  onChange={(e) => setForm({ ...form, tag: e.target.value })}
                  className="w-full border border-slate-300 rounded p-2 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Breed</label>
                  <select
                    value={form.breed}
                    onChange={(e) => setForm({ ...form, breed: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 outline-none bg-white"
                  >
                    {['Gir', 'Sahiwal', 'Murrah', 'HF Cross', 'Jersey'].map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Daily Yield (L)</label>
                  <input
                    type="number"
                    value={form.milkYield}
                    onChange={(e) => setForm({ ...form, milkYield: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 outline-none"
                  />
                </div>
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
                  className="px-4 py-1.5 bg-slate-900 text-white rounded font-bold"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
