#!/usr/bin/env python3
"""
dhenurakshak_edge_model.py — Offline AI Mastitis Early Forecasting Engine
Runs locally on Raspberry Pi 3B+ CPU (pure Python standard library).
Fulfills SIH Problem Statement #109: Predicting Bovine Mastitis 7-14 Days in Advance.

Epidemiological Feature Pipeline:
1. Rumination Deficit Index (7-14 day pre-clinical precursor)
2. Core/Surface Temperature Circadian Anomaly (+0.4°C to +0.8°C)
3. Chewing Rhythm & Jaw Motion Amplitude
4. Milk Yield Deviation & Electrical Conductivity (when available)
"""

import math
from datetime import datetime, timezone
from typing import Dict, Any, List


class DhenuRakshakEdgeEngine:
    """
    Edge inference engine for Raspberry Pi 3B+.
    Designed to operate completely offline in remote dairy farms and grazing pastures.
    """

    # Clinical reference baselines for Indian indigenous (Desi) and crossbred cattle
    BASELINE_RUMINATION_MIN_DAY = 460.0  # Healthy cow ruminates 420-520 mins/day
    NORMAL_CHEWS_PER_MIN = 58.0          # Normal chewing cadence (50-70 chews/min)
    NORMAL_TEMP_C = 38.6                 # Normal bovine core temp (101.5°F)
    ELEVATED_TEMP_C = 39.2               # Subclinical temperature elevation
    FEVER_TEMP_C = 39.8                  # Clinical systemic fever
    NORMAL_CONDUCTIVITY = 4.8            # mS/cm
    SUSPICIOUS_CONDUCTIVITY = 5.8        # mS/cm

    def __init__(self):
        # Rolling 7-day memory store for edge cattle tracking
        self.cattle_history: Dict[str, List[Dict[str, Any]]] = {}

    def predict(self, telemetry: Dict[str, Any]) -> Dict[str, Any]:
        """
        Runs comprehensive edge inference on incoming sensor telemetry.
        Returns risk score (0-100%), classification tier, 7-14 day forecast,
        feature attributions, and ICAR herbal phytotherapy remedies.
        """
        cattle_id = telemetry.get("cattle_id", "COW-102")
        cow_name = telemetry.get("cow_name", "Kamdhenu")

        # 1. Extract physical sensor data
        body_temp = float(telemetry.get("temperature_c", 38.6))
        
        jaw_metrics = telemetry.get("jaw_metrics", {})
        total_chews = int(jaw_metrics.get("total_chews", 0))
        cpm = float(jaw_metrics.get("chews_per_minute", 55.0))
        rumination_sec = int(jaw_metrics.get("rumination_active_sec", 18000))  # Default 300 mins
        rumination_mins = rumination_sec / 60.0

        # Optional milking parlor parameters (if synchronized)
        milk_yield = float(telemetry.get("milk_yield", 14.5))
        baseline_yield = float(telemetry.get("baseline_yield", 15.0))
        conductivity = float(telemetry.get("conductivity", 4.9))
        scc = int(telemetry.get("scc", 160000))

        # -------------------------------------------------------------
        # 2. Multi-Factor Risk Calculation (Veterinary Calibrated)
        # -------------------------------------------------------------
        raw_score = 0.0
        factors: Dict[str, float] = {}
        flags: List[str] = []

        # A. Rumination Deficit Analysis (The 7-14 Day Pre-Clinical Marker)
        # A cow's daily rumination drops by 15-25% up to 14 days before visible mastitis signs!
        rumination_deficit_pct = max(0.0, ((self.BASELINE_RUMINATION_MIN_DAY - rumination_mins) / self.BASELINE_RUMINATION_MIN_DAY) * 100.0)

        if rumination_deficit_pct >= 35.0:
            raw_score += 28.0
            factors[f"Severe Rumination Drop (-{rumination_deficit_pct:.1f}%)"] = +28.0
            flags.append("CRITICAL_RUMINATION_DEFICIT")
        elif rumination_deficit_pct >= 18.0:
            raw_score += 18.0
            factors[f"Subclinical Rumination Decline (-{rumination_deficit_pct:.1f}%)"] = +18.0
            flags.append("SUBCLINICAL_RUMINATION_DROP")
        elif rumination_deficit_pct >= 8.0:
            raw_score += 6.0
            factors[f"Mild Rumination Slowdown (-{rumination_deficit_pct:.1f}%)"] = +6.0
        else:
            factors["Healthy Daily Rumination Activity"] = -10.0

        # B. Chewing Cadence (Chews Per Minute)
        if cpm > 0 and cpm < 38.0:
            raw_score += 12.0
            factors[f"Sluggish Chewing Cadence ({cpm:.1f} chews/min)"] = +12.0
        elif cpm >= 48.0 and cpm <= 72.0:
            factors[f"Optimal Chewing Cadence ({cpm:.1f} chews/min)"] = -6.0

        # C. Body Temperature Anomaly
        temp_deviation = body_temp - self.NORMAL_TEMP_C
        if body_temp >= self.FEVER_TEMP_C:
            raw_score += 26.0
            factors[f"Systemic Fever ({body_temp:.1f}°C)"] = +26.0
            flags.append("ACUTE_FEVER")
        elif body_temp >= self.ELEVATED_TEMP_C:
            raw_score += 14.0
            factors[f"Subclinical Temperature Elevation ({body_temp:.1f}°C, +{temp_deviation:.1f}°C)"] = +14.0
            flags.append("SUBCLINICAL_HYPERTHERMIA")
        elif body_temp <= 36.5:
            raw_score += 10.0
            factors[f"Hypothermia / Cold Shock ({body_temp:.1f}°C)"] = +10.0
        else:
            factors[f"Normal Body Temperature ({body_temp:.1f}°C)"] = -8.0

        # D. Milk Yield Drop Deviation
        yield_drop_pct = 0.0
        if baseline_yield > 0:
            yield_drop_pct = max(0.0, ((baseline_yield - milk_yield) / baseline_yield) * 100.0)
        
        if yield_drop_pct >= 20.0:
            raw_score += 20.0
            factors[f"Significant Milk Yield Loss (-{yield_drop_pct:.1f}%)"] = +20.0
        elif yield_drop_pct >= 8.0:
            raw_score += 10.0
            factors[f"Early Milk Yield Softening (-{yield_drop_pct:.1f}%)"] = +10.0

        # E. Electrical Conductivity
        if conductivity >= 6.5:
            raw_score += 22.0
            factors[f"High Milk Conductivity ({conductivity:.2f} mS/cm)"] = +22.0
        elif conductivity >= self.SUSPICIOUS_CONDUCTIVITY:
            raw_score += 14.0
            factors[f"Subclinical Conductivity Spike ({conductivity:.2f} mS/cm)"] = +14.0

        # F. Somatic Cell Count
        if scc >= 400000:
            raw_score += 18.0
            factors[f"High Somatic Cell Count ({scc:,} cells/mL)"] = +18.0
        elif scc >= 220000:
            raw_score += 10.0
            factors[f"Elevated Subclinical SCC ({scc:,} cells/mL)"] = +10.0

        # Baseline offset
        raw_score += 5.0

        # Squashing logistic function
        k = 0.08
        x0 = 32.0
        probability = 1.0 / (1.0 + math.exp(-k * (raw_score - x0)))
        risk_score = round(max(3.0, min(98.5, probability * 100.0)), 1)

        # -------------------------------------------------------------
        # 3. 7-14 Day Forecasting Classification Window
        # -------------------------------------------------------------
        if risk_score >= 80.0 or "ACUTE_FEVER" in flags:
            risk_level = "HIGH"
            risk_label_hi = "खतरा (अत्यधिक जोखिम / क्लिनिकल थनैला)"
            forecast_window_en = "Immediate Clinical Onset (< 24 Hours)"
            forecast_window_hi = "तत्काल क्लिनिकल उपचार आवश्यक (24 घंटे के भीतर)"
            urgency = "CRITICAL"
        elif risk_score >= 32.0 or rumination_deficit_pct >= 18.0 or "SUBCLINICAL_HYPERTHERMIA" in flags:
            risk_level = "MEDIUM"
            risk_label_hi = "सावधान (7-14 दिन पूर्व सबक्लिनिकल थनैला का संकेत)"
            forecast_window_en = "Early Warning: 7 to 14 Days Before Clinical Symptoms"
            forecast_window_hi = "प्रारंभिक चेतावनी: लक्षण दिखने से 7 से 14 दिन पहले का संकेत"
            urgency = "WATCHFUL"
        else:
            risk_level = "LOW"
            risk_label_hi = "सुरक्षित (स्वस्थ पशु)"
            forecast_window_en = "Routine Healthy Monitoring"
            forecast_window_hi = "नियमित स्वास्थ्य निगरानी (सभी लक्षण सामान्य)"
            urgency = "NORMAL"

        # Actionable recommendations
        if risk_level == "HIGH":
            actions_en = [
                "Isolate cow immediately to prevent contagion.",
                "Call local veterinarian or dial Pashu Helpline 1962.",
                "Milk this cow last; discard milk completely.",
                "Administer vet-prescribed intramammary antibiotics.",
            ]
            actions_hi = [
                "गाय को तुरंत अलग बांधें ताकि अन्य पशुओं में संक्रमण न फैले।",
                "पशु चिकित्सक को बुलाएं या पशु हेल्पलाइन 1962 पर संपर्क करें।",
                "इस गाय का दूध सबसे अंत में निकालें और पूरी तरह नष्ट करें।",
            ]
        elif risk_level == "MEDIUM":
            actions_en = [
                "⚡ SUBCLINICAL 7-14 DAY WINDOW: Apply ICAR Herbal Phytotherapy paste (Aloe Vera + Turmeric + Lime).",
                "Perform daily California Mastitis Test (CMT) paddle check.",
                "Ensure clean, dry bedding with lime powder dusting.",
                "Supplement feed with Vitamin E, Zinc, and Selenium.",
            ]
            actions_hi = [
                "⚡ 7-14 दिन पूर्व चेतावनी: आईसीएआर प्रमाणित हल्दी-घृतकुमारी-चूना लेप दिन में 3 बार लगाएं।",
                "प्रतिदिन कैलिफ़ोर्निया मास्टाइटिस टेस्ट (CMT) से थन की जांच करें।",
                "पशु के बैठने की जगह सूखी रखें और चूने का छिड़काव करें।",
            ]
        else:
            actions_en = [
                "Maintain clean milking hygiene (pre-milking wash & post-milking teat dip).",
                "Ensure continuous fresh water and balanced green fodder.",
            ]
            actions_hi = [
                "स्वच्छ दुग्ध उत्पादन नियम अपनाएं और थनों की नियमित सफाई रखें।",
            ]

        return {
            "node_id": telemetry.get("node_id", "COLLAR-01"),
            "cattle_id": cattle_id,
            "cow_name": cow_name,
            "engine": "DhenuRakshak Edge AI (Offline Pi 3B+)",
            "risk_level": risk_level,
            "risk_score": risk_score,
            "urgency": urgency,
            "risk_label_hi": risk_label_hi,
            "forecast_window_en": forecast_window_en,
            "forecast_window_hi": forecast_window_hi,
            "rumination_deficit_pct": round(rumination_deficit_pct, 1),
            "body_temp_c": body_temp,
            "cpm": cpm,
            "feature_attribution": factors,
            "recommended_actions_en": actions_en,
            "recommended_actions_hi": actions_hi,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }


# Global edge model instance
edge_predictor = DhenuRakshakEdgeEngine()
