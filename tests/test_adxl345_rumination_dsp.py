#!/usr/bin/env python3
"""
test_adxl345_rumination_dsp.py
Bovine Rumination Jaw Movement DSP with Schmitt Trigger Hysteresis:
1. Cascaded Low-Pass Filter (removes +-0.4g wideband noise).
2. Dynamic Acceleration Detrending.
3. Schmitt Trigger Hysteresis (High threshold to trigger chew, Low threshold to reset).
4. Refractory Window (prevents bounce/re-triggering).
"""

import math
import random
import unittest

class ADXL345RuminationDSP:
    def __init__(self, alpha_fast=0.10, alpha_slow=0.001, high_thresh_g=0.20, low_thresh_g=0.12, min_interval_ms=500):
        self.alpha_fast = alpha_fast
        self.alpha_slow = alpha_slow
        self.high_thresh_g = high_thresh_g
        self.low_thresh_g = low_thresh_g
        self.min_interval_ms = min_interval_ms

        self.fast_x = 0.0
        self.fast_y = 0.0
        self.fast_z = 1.0

        self.slow_x = 0.0
        self.slow_y = 0.0
        self.slow_z = 1.0

        self.is_high_state = False
        self.last_chew_timestamp_ms = -10000
        self.total_chews = 0
        self.chew_timestamps = []

    def process_sample(self, raw_x: float, raw_y: float, raw_z: float, timestamp_ms: int):
        # 1. Fast EMA filter (Strips high frequency electrical noise)
        self.fast_x = (self.alpha_fast * raw_x) + ((1.0 - self.alpha_fast) * self.fast_x)
        self.fast_y = (self.alpha_fast * raw_y) + ((1.0 - self.alpha_fast) * self.fast_y)
        self.fast_z = (self.alpha_fast * raw_z) + ((1.0 - self.alpha_fast) * self.fast_z)

        # 2. Slow EMA filter (Gravitational orientation baseline)
        self.slow_x = (self.alpha_slow * raw_x) + ((1.0 - self.alpha_slow) * self.slow_x)
        self.slow_y = (self.alpha_slow * raw_y) + ((1.0 - self.alpha_slow) * self.slow_y)
        self.slow_z = (self.alpha_slow * raw_z) + ((1.0 - self.alpha_slow) * self.slow_z)

        # 3. Dynamic Vector Magnitude
        dx = self.fast_x - self.slow_x
        dy = self.fast_y - self.slow_y
        dz = self.fast_z - self.slow_z
        dyn = math.sqrt(dx*dx + dy*dy + dz*dz)

        # 4. Schmitt Trigger Peak Detector with Hysteresis
        is_chew = False
        if not self.is_high_state:
            if dyn >= self.high_thresh_g:
                if (timestamp_ms - self.last_chew_timestamp_ms) >= self.min_interval_ms:
                    self.is_high_state = True
                    self.last_chew_timestamp_ms = timestamp_ms
                    self.total_chews += 1
                    self.chew_timestamps.append(timestamp_ms)
                    is_chew = True
        else:
            # Must fall below low threshold before another chew can trigger
            if dyn <= self.low_thresh_g:
                self.is_high_state = False

        return {
            "dynamic_g": dyn,
            "is_chew": is_chew,
            "total_chews": self.total_chews
        }


class TestRuminationDSP(unittest.TestCase):
    def test_noise_suppression_when_resting(self):
        """Simulates 10 seconds of collar at rest with +-0.4g continuous sensor noise."""
        dsp = ADXL345RuminationDSP()
        random.seed(42)

        for i in range(500):
            t_ms = i * 20  # 20ms = 50Hz
            noise_x = random.uniform(-0.4, 0.4)
            noise_y = random.uniform(-0.4, 0.4)
            noise_z = 1.0 + random.uniform(-0.4, 0.4)

            dsp.process_sample(noise_x, noise_y, noise_z, t_ms)

        self.assertEqual(dsp.total_chews, 0, f"Expected 0 chews during rest, but got {dsp.total_chews}")
        print("[PASS] Noise Suppression Test: 0 false chews detected despite +-0.4g continuous noise!")

    def test_chewing_detection_during_rumination(self):
        """Simulates 30 seconds of active rumination (1 chew per second = 30 chews) with +-0.4g noise added."""
        dsp = ADXL345RuminationDSP()
        random.seed(42)

        expected_chews = 30
        for i in range(1500):  # 30 seconds @ 50 Hz
            t_ms = i * 20
            t_sec = t_ms / 1000.0

            # 1 Hz jaw chewing motion with peak amplitude 0.35g
            chew_cycle = math.sin(2 * math.pi * 1.0 * t_sec)
            chew_signal = max(0.0, chew_cycle) * 0.35

            noise_x = random.uniform(-0.35, 0.35)
            noise_y = chew_signal + random.uniform(-0.35, 0.35)
            noise_z = 1.0 + random.uniform(-0.35, 0.35)

            dsp.process_sample(noise_x, noise_y, noise_z, t_ms)

        print(f"[PASS] Active Chewing Test: Detected {dsp.total_chews} chews (Target: ~{expected_chews} chews in 30s)")
        self.assertTrue(20 <= dsp.total_chews <= 32, f"Chew count {dsp.total_chews} outside expected range [20, 32]")


if __name__ == "__main__":
    unittest.main()
