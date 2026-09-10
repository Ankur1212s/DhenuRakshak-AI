import React from 'react';

export default function Analytics() {
  return (
    <div className="max-w-4xl mx-auto space-y-5 text-slate-800">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Nutrition & Rumination Monitor</h1>
        <p className="text-xs text-slate-500">
          Analyze herd-level eating and cud-chewing trends to detect feed issues and subclinical mastitis early
        </p>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200 rounded p-4 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase">Average Herd Rumination</div>
          <div className="text-2xl font-black text-slate-900 mt-1">472 mins/day</div>
          <div className="text-xs text-emerald-600 font-medium mt-0.5">Optimal herd rumen function</div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-4 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase">Average Eating Time</div>
          <div className="text-2xl font-black text-slate-900 mt-1">5.1 hours/day</div>
          <div className="text-xs text-blue-600 font-medium mt-0.5">TMR intake stable across pens</div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-4 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase">Early Interventions</div>
          <div className="text-2xl font-black text-amber-600 mt-1">8 Cows Treated Early</div>
          <div className="text-xs text-slate-500 mt-0.5">Avoided ₹32,000 in antibiotic treatment</div>
        </div>
      </div>

      {/* How CowManager Science Works */}
      <div className="bg-white border border-slate-200 rounded p-5 shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-slate-900">Why Rumination is the First Indicator of Mastitis</h2>
        <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
          <p>
            <strong>1. Cud Chewing Requires Normal Rumen & Systemic Balance:</strong> Cows ruminate between 450 and 550 minutes every day. As soon as bacterial toxins begin irritating udder quarter tissue, cytokines trigger mild discomfort. The cow slows down rumination <strong>7 to 14 days before</strong> visible flakes appear in the milk.
          </p>
          <p>
            <strong>2. Ear Temperature Inversion:</strong> During physiological stress or infection, blood flow shifts away from peripheral extremities (ears) to the core organs and affected udder tissue. The CowManager ear sensor detects this subtle temperature change.
          </p>
          <p>
            <strong>3. Proactive Management vs. Reactive Treatment:</strong> Catching the drop during the <strong>Yellow Alert (Suspicious)</strong> stage allows farmers to apply topical herbal therapy (Aloe vera + Turmeric + Lime) or adjust nutrition, completely curing the infection without antibiotic milk withhold periods.
          </p>
        </div>
      </div>
    </div>
  );
}
