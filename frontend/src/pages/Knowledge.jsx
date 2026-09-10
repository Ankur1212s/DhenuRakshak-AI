import React from 'react';
import { Terminal, BookOpen, ShieldCheck } from 'lucide-react';

export default function Knowledge() {
  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="border border-[#30363d] bg-[#161b22] p-3 rounded-md flex items-center justify-between">
        <div className="flex items-center space-x-2 font-bold text-[#f0f6fc]">
          <Terminal size={14} className="text-[#a371f7]" />
          <span>[ 06_DOCS_ICAR ] — CLINICAL PROTOCOLS & PHYTOTHERAPY FORMULARY</span>
        </div>
        <span className="text-[#8b949e]">VALIDATED: ICAR / NDDB STANDARDS</span>
      </div>

      <div className="border border-[#30363d] bg-[#161b22] p-4 rounded-md space-y-3">
        <div className="border-b border-[#30363d] pb-2 font-bold text-[#3fb950]">
          ICAR HERBAL PHYTOTHERAPY FORMULATION (FOR SUBCLINICAL 7-14D CASES)
        </div>
        <div className="text-[#c9d1d9] space-y-2 leading-relaxed">
          <p>
            <strong>Ingredients:</strong> Aloe vera (250g whole leaf) + Curcuma longa / Turmeric powder (50g) + Calcium hydroxide / Slaked lime (15g).
          </p>
          <p>
            <strong>Preparation:</strong> Blend into a smooth homogeneous yellow-orange paste. Add 50ml coconut/mustard oil to improve udder tissue permeability.
          </p>
          <p>
            <strong>Dosage & Frequency:</strong> Wash udder with clean lukewarm water, strip quarter completely dry, and apply a liberal coating over the entire affected teat and base quarter 3 to 4 times daily for 5 continuous days.
          </p>
        </div>
      </div>

      <div className="border border-[#30363d] bg-[#161b22] p-4 rounded-md space-y-3">
        <div className="border-b border-[#30363d] pb-2 font-bold text-[#58a6ff]">
          HARDWARE DEEP-SLEEP SPECIFICATION (LOW-POWER EAR-TAG)
        </div>
        <div className="text-[#c9d1d9] space-y-1">
          <div>• Sensor: ADXL345 configured in Full-Resolution Mode (±2g, 3.9 mg/LSB).</div>
          <div>• Interrupt: INT1 mapped to Activity threshold (0.20g, AC-coupled).</div>
          <div>• Microcontroller: ESP32 deep sleep state (~10–15 µA) with EXT0 pin wakeup.</div>
          <div>• Duty Cycle: Active during rumination bouts; transmits 5-min batch summary then re-enters sleep.</div>
        </div>
      </div>
    </div>
  );
}
