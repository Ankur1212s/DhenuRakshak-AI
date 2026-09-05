#!/usr/bin/env python3
"""
test_cloud_api.py
Tests the cloud server API endpoints and the DhenuRakshak predictive engine.
"""

import os
import sys
import unittest
import json

# Add cloud_server to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "cloud_server")))
from dhenurakshak_engine import predictor
import server


class TestCloudEngine(unittest.TestCase):
    def test_rumination_mastitis_forecasting(self):
        """Tests that a cow with 25% rumination drop is flagged as 7-14 day subclinical mastitis."""
        payload = {
            "cattle_id": "COW-102",
            "cow_name": "Kamdhenu",
            "temperature_c": 39.1,
            "jaw_metrics": {
                "chews_per_minute": 44.0,
                "rumination_active_sec": 20400,  # 340 mins (26% drop)
                "dynamic_accel_g": 0.22
            },
            "milk_yield": 13.8,
            "baseline_yield": 16.0,
            "conductivity": 5.8,
            "scc": 290000
        }
        res = predictor.predict(payload)
        self.assertEqual(res["risk_level"], "MEDIUM")
        self.assertIn("7 to 14 Days Early Warning", res["forecast_window_en"])
        print(f"[PASS] Cloud Engine Test: Detected {res['risk_level']} Risk ({res['risk_score']}%)")
        print(f"       Window: {res['forecast_window_en']}")
        print(f"       Economic Saved: INR {res['economic_impact']['saved_by_early_forecast_inr']:,}")


if __name__ == "__main__":
    unittest.main()
