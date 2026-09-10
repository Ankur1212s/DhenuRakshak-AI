import React from 'react';

export default function Analytics() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Farm Health & Cost Savings</h1>
        <p className="text-xs text-gray-500">Economic and health benefits of 7-14 day early mastitis detection</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <div className="text-sm font-medium text-gray-500">Antibiotic Cost Saved</div>
          <div className="text-2xl font-bold text-green-700 mt-2">₹ 18,500</div>
          <div className="text-xs text-gray-500 mt-1">By preventing clinical cases</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <div className="text-sm font-medium text-gray-500">Milk Loss Prevented</div>
          <div className="text-2xl font-bold text-blue-700 mt-2">420 Liters</div>
          <div className="text-xs text-gray-500 mt-1">No milk dumped due to antibiotics</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <div className="text-sm font-medium text-gray-500">Herd Health Score</div>
          <div className="text-2xl font-bold text-gray-900 mt-2">92%</div>
          <div className="text-xs text-green-600 mt-1">Excellent overall health</div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm space-y-3">
        <h2 className="font-semibold text-gray-900 text-sm">How Early Detection Works</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          Cows chew cud (rumination) for 450 to 550 minutes every day. When a subclinical infection starts in the udder, the cow experiences mild discomfort and rumination drops by 15% to 25%, while body temperature rises slightly (+0.4°C).
        </p>
        <p className="text-sm text-gray-600 leading-relaxed">
          By detecting this change with lightweight ear tags 7 to 14 days before milk clots or udder swelling appear, farmers can apply affordable herbal treatments (Aloe vera + Turmeric) and cure the infection without expensive veterinary antibiotics or losing milk production.
        </p>
      </div>
    </div>
  );
}
