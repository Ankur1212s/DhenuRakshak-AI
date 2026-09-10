import React, { useState } from 'react';
import toast from 'react-hot-toast';

export default function Settings() {
  const [farmName, setFarmName] = useState('Surabhi Dairy Farm');
  const [vetPhone, setVetPhone] = useState('1962');

  const handleSave = (e) => {
    e.preventDefault();
    toast.success('Settings saved successfully.');
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Farm Settings</h1>
        <p className="text-xs text-gray-500">Configure your farm details and emergency contact</p>
      </div>

      <form onSubmit={handleSave} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm space-y-4 text-sm">
        <div>
          <label className="block text-gray-700 font-medium mb-1">Farm Name</label>
          <input
            type="text"
            value={farmName}
            onChange={(e) => setFarmName(e.target.value)}
            className="w-full border border-gray-300 rounded p-2 outline-none"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">Emergency Veterinary Doctor Phone</label>
          <input
            type="text"
            value={vetPhone}
            onChange={(e) => setVetPhone(e.target.value)}
            className="w-full border border-gray-300 rounded p-2 outline-none"
          />
          <span className="text-xs text-gray-500">National Veterinary Helpline: 1962</span>
        </div>

        <button
          type="submit"
          className="bg-green-700 hover:bg-green-800 text-white font-medium px-4 py-2 rounded-md"
        >
          Save Settings
        </button>
      </form>
    </div>
  );
}
