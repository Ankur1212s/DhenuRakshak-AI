import React from 'react';
import { Terminal, TrendingUp, DollarSign, Activity } from 'lucide-react';

export default function Analytics() {
  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="border border-[#30363d] bg-[#161b22] p-3 rounded-md flex items-center justify-between">
        <div className="flex items-center space-x-2 font-bold text-[#f0f6fc]">
          <Terminal size={14} className="text-[#58a6ff]" />
          <span>[ 05_EPIDEMIOLOGY ] — HERD HEALTH & ECONOMIC CONSERVATION</span>
        </div>
        <span className="text-[#8b949e]">AUDIT PERIOD: 30 DAYS</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="border border-[#30363d] bg-[#161b22] p-3 rounded-md">
          <div className="text-[#8b949e]">AVOIDED VET ANTIBIOTIC COSTS</div>
          <div className="text-xl font-bold text-[#3fb950] mt-1">₹ 18,500</div>
          <div className="text-[10px] text-[#8b949e] mt-0.5">Via 7-14d early phytotherapy</div>
        </div>
        <div className="border border-[#30363d] bg-[#161b22] p-3 rounded-md">
          <div className="text-[#8b949e]">PRESERVED MILK PRODUCTION</div>
          <div className="text-xl font-bold text-[#58a6ff] mt-1">420 Liters</div>
          <div className="text-[10px] text-[#8b949e] mt-0.5">Zero antibiotic withdrawal discards</div>
        </div>
        <div className="border border-[#30363d] bg-[#161b22] p-3 rounded-md">
          <div className="text-[#8b949e]">HERD SOMATIC RETENTION SCORE</div>
          <div className="text-xl font-bold text-[#f0f6fc] mt-1">92.4%</div>
          <div className="text-[10px] text-[#3fb950] mt-0.5">Optimal udder quarter health</div>
        </div>
      </div>

      <div className="border border-[#30363d] bg-[#161b22] rounded-md p-4 space-y-3">
        <div className="border-b border-[#30363d] pb-2 font-bold text-[#f0f6fc]">
          7-14 DAY EARLY WARNING EFFICACY MATRIX (SIH PROBLEM STATEMENT #109)
        </div>
        <div className="text-[#c9d1d9] leading-relaxed space-y-2">
          <p>
            &gt; By correlating ear-tag rumination bouts (drops &gt; 15%) with slight temperature rises (+0.4°C), subclinical mastitis is intercepted prior to visible milk clots or udder damage.
          </p>
          <p>
            &gt; Economic savings: Eliminates ₹3,000–₹5,000 per episode in clinical antibiotic infusions, milk dumping, and irreversible quarter loss.
          </p>
        </div>
      </div>
    </div>
  );
}
