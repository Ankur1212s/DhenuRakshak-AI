import React, { useState } from 'react';
import useCattleStore from '../store/cattleStore';

export default function Cattle() {
  const { cattle, addCattle } = useCattleStore();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    tag: '',
    breed: 'Gir',
    age: '4',
    milkYield: '14.0',
    village: 'Shed 1',
  });

  const filtered = cattle.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.tag.toLowerCase().includes(search.toLowerCase()) ||
      c.breed.toLowerCase().includes(search.toLowerCase())
  );

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
    setForm({ name: '', tag: '', breed: 'Gir', age: '4', milkYield: '14.0', village: 'Shed 1' });
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Cattle Directory</h1>
          <p className="text-xs text-gray-500">Manage and monitor registered cattle</p>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Search by tag or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm outline-none focus:border-gray-500 bg-white"
          />
          <button
            onClick={() => setShowModal(true)}
            className="bg-green-700 hover:bg-green-800 text-white text-sm font-medium px-4 py-1.5 rounded-md"
          >
            + Add Cattle
          </button>
        </div>
      </div>

      {/* Clean White Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase border-b border-gray-200">
            <tr>
              <th className="py-3 px-5">Tag ID</th>
              <th className="py-3 px-5">Name</th>
              <th className="py-3 px-5">Breed</th>
              <th className="py-3 px-5">Age</th>
              <th className="py-3 px-5">Daily Yield</th>
              <th className="py-3 px-5">Health Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.map((cow) => (
              <tr key={cow.id} className="hover:bg-gray-50">
                <td className="py-3.5 px-5 font-medium text-gray-900">{cow.tag}</td>
                <td className="py-3.5 px-5 text-gray-800">{cow.name}</td>
                <td className="py-3.5 px-5 text-gray-500">{cow.breed}</td>
                <td className="py-3.5 px-5 text-gray-500">{cow.age} yrs</td>
                <td className="py-3.5 px-5 text-gray-800">{cow.milkYield} L</td>
                <td className="py-3.5 px-5">
                  {cow.riskLevel === 'HIGH' ? (
                    <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full font-medium">
                      High Risk
                    </span>
                  ) : cow.riskLevel === 'MEDIUM' ? (
                    <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full font-medium">
                      Watch (7-14 Days)
                    </span>
                  ) : (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full font-medium">
                      Healthy
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Simple Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-5 space-y-4 shadow-lg">
            <div className="flex justify-between items-center border-b border-gray-200 pb-2">
              <h3 className="font-semibold text-gray-900">Add New Cattle</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-sm">
              <div>
                <label className="block text-gray-700 mb-1">Cow Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kamdhenu"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 rounded p-2 outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-1">Ear Tag ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TAG-102"
                  value={form.tag}
                  onChange={(e) => setForm({ ...form, tag: e.target.value })}
                  className="w-full border border-gray-300 rounded p-2 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-700 mb-1">Breed</label>
                  <select
                    value={form.breed}
                    onChange={(e) => setForm({ ...form, breed: e.target.value })}
                    className="w-full border border-gray-300 rounded p-2 outline-none"
                  >
                    {['Gir', 'Sahiwal', 'Murrah', 'HF Cross', 'Jersey'].map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">Daily Yield (L)</label>
                  <input
                    type="number"
                    value={form.milkYield}
                    onChange={(e) => setForm({ ...form, milkYield: e.target.value })}
                    className="w-full border border-gray-300 rounded p-2 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-1.5 border border-gray-300 rounded text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-green-700 text-white rounded font-medium"
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
