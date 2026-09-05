#!/usr/bin/env python3
"""
edge_gateway.py — DhenuRakshak AI Edge Gateway Daemon for Raspberry Pi 3B+
Smart India Hackathon (SIH) | Problem Statement #109

Operating Modes:
1. Online Mode (Wi-Fi / Phone Hotspot / A7670C 4G LTE):
   - Streams live sensor telemetry to Cloud Website API (/api/telemetry).
   - Drains & synchronizes offline SQLite backlog cache.
2. Offline Mode (Zero Internet in Remote Barn or Pasture):
   - Executes DhenuRakshak Edge AI Model locally on Pi 3B+ CPU.
   - Evaluates 7-14 Day Mastitis Risk & Rumination Deficit Index.
   - Caches records locally in SQLite (pi_edge_cache.db) with auto-sync on reconnect.
"""

import os
import sys
import time
import json
import sqlite3
import socket
import argparse
from datetime import datetime, timezone
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

# Import local offline inference engine
from dhenurakshak_edge_model import edge_predictor

# Default Configurations
DEFAULT_ESP32_URL = os.environ.get("ESP32_URL", "http://192.168.4.1/api/telemetry")
DEFAULT_CLOUD_URL = os.environ.get("CLOUD_URL", "http://localhost:5173")
DB_PATH = os.path.join(os.path.dirname(__file__), "pi_edge_cache.db")
POLL_INTERVAL_SEC = 3.0


class EdgeDatabase:
    """Manages local edge SQLite persistence for offline telemetry and risk logs."""

    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        conn = sqlite3.connect(self.db_path)
        cur = conn.cursor()
        cur.execute("""
        CREATE TABLE IF NOT EXISTS edge_telemetry (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            node_id TEXT,
            cattle_id TEXT,
            temperature_c REAL,
            cpm REAL,
            rumination_sec INTEGER,
            latitude REAL,
            longitude REAL,
            payload_json TEXT,
            local_prediction_json TEXT,
            risk_level TEXT,
            risk_score REAL,
            created_at TEXT,
            synced INTEGER DEFAULT 0
        )
        """)
        conn.commit()
        conn.close()

    def store_offline_telemetry(self, telemetry: dict, prediction: dict):
        conn = sqlite3.connect(self.db_path)
        cur = conn.cursor()
        now_iso = datetime.now(timezone.utc).isoformat()
        jaw = telemetry.get("jaw_metrics", {})
        gps = telemetry.get("gps", {})

        cur.execute("""
        INSERT INTO edge_telemetry (
            node_id, cattle_id, temperature_c, cpm, rumination_sec,
            latitude, longitude, payload_json, local_prediction_json,
            risk_level, risk_score, created_at, synced
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
        """, (
            telemetry.get("node_id", "COLLAR-01"),
            telemetry.get("cattle_id", "COW-102"),
            telemetry.get("temperature_c", 38.6),
            jaw.get("chews_per_minute", 0.0),
            jaw.get("rumination_active_sec", 0),
            gps.get("latitude", 0.0),
            gps.get("longitude", 0.0),
            json.dumps(telemetry),
            json.dumps(prediction),
            prediction.get("risk_level", "LOW"),
            prediction.get("risk_score", 0.0),
            now_iso
        ))
        conn.commit()
        conn.close()

    def get_unsynced_records(self, limit: int = 50):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute("SELECT * FROM edge_telemetry WHERE synced = 0 ORDER BY id ASC LIMIT ?", (limit,))
        rows = [dict(r) for r in cur.fetchall()]
        conn.close()
        return rows

    def mark_synced(self, record_ids: list):
        if not record_ids:
            return
        conn = sqlite3.connect(self.db_path)
        cur = conn.cursor()
        placeholders = ",".join("?" for _ in record_ids)
        cur.execute(f"UPDATE edge_telemetry SET synced = 1 WHERE id IN ({placeholders})", record_ids)
        conn.commit()
        conn.close()


class DhenuRakshakGateway:
    def __init__(self, esp32_url: str = DEFAULT_ESP32_URL, cloud_url: str = DEFAULT_CLOUD_URL):
        self.esp32_url = esp32_url
        self.cloud_url = cloud_url.rstrip("/")
        self.db = EdgeDatabase()
        self.is_online = False
        self.consecutive_offline_cycles = 0

    def check_internet_connection(self) -> bool:
        """
        Fast, non-blocking check for WAN connectivity.
        Attempts DNS socket ping to 8.8.8.8:53 with a 1.2s timeout.
        """
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1.2)
            sock.connect(("8.8.8.8", 53))
            sock.close()
            return True
        except Exception:
            return False

    def fetch_esp32_telemetry(self) -> dict:
        """Fetches real-time sensor JSON from ESP32 collar node."""
        req = Request(self.esp32_url, headers={"User-Agent": "DhenuRakshak-Pi-Gateway/2.0"})
        with urlopen(req, timeout=2.5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data

    def send_to_cloud(self, telemetry: dict) -> bool:
        """Transmits telemetry to central cloud server endpoint."""
        target_url = f"{self.cloud_url}/api/telemetry"
        payload = json.dumps(telemetry).encode("utf-8")
        req = Request(target_url, data=payload, headers={
            "Content-Type": "application/json",
            "User-Agent": "DhenuRakshak-Pi-Gateway/2.0"
        })
        with urlopen(req, timeout=3.5) as resp:
            return resp.status in (200, 201)

    def sync_offline_backlog(self):
        """Drains local SQLite queue by uploading cached records when internet restores."""
        unsynced = self.db.get_unsynced_records(limit=25)
        if not unsynced:
            return

        print(f"🔄 Syncing {len(unsynced)} cached offline records to Cloud Server...")
        synced_ids = []
        for rec in unsynced:
            try:
                payload = json.loads(rec["payload_json"])
                # Add historical tag
                payload["synced_from_edge"] = True
                payload["original_timestamp"] = rec["created_at"]
                if self.send_to_cloud(payload):
                    synced_ids.append(rec["id"])
            except Exception as e:
                print(f"⚠️ Failed to sync backlog record {rec['id']}: {e}", file=sys.stderr)
                break

        if synced_ids:
            self.db.mark_synced(synced_ids)
            print(f"✅ Successfully synchronized {len(synced_ids)} records to Cloud.")

    def run_cycle(self):
        """Executes a single gateway polling & decision cycle."""
        # 1. Fetch sensor data from ESP32
        try:
            telemetry = self.fetch_esp32_telemetry()
        except Exception as e:
            print(f"❌ Could not connect to ESP32 at {self.esp32_url} ({e}). Retrying...", file=sys.stderr)
            return

        # 2. Check WAN / Internet Status
        internet_up = self.check_internet_connection()
        self.is_online = internet_up

        temp = telemetry.get("temperature_c", 0.0)
        jaw = telemetry.get("jaw_metrics", {})
        cpm = jaw.get("chews_per_minute", 0.0)
        gps = telemetry.get("gps", {})
        cow = telemetry.get("cow_name", "Unknown")

        # 3. Decision Branch: ONLINE vs OFFLINE
        if internet_up:
            print(f"🌐 [ONLINE] Temp: {temp:.1f}°C | CPM: {cpm:.1f} | Lat: {gps.get('latitude',0):.4f}, Lon: {gps.get('longitude',0):.4f} -> Pushing to Cloud...")
            try:
                success = self.send_to_cloud(telemetry)
                if success:
                    print("   └── 🚀 Cloud Uplink Confirmed (Website Live Stream Updated)")
                    # Sync any cached offline data
                    self.sync_offline_backlog()
                else:
                    print("   └── ⚠️ Cloud server rejected payload. Falling back to edge cache.")
                    self._handle_offline_inference(telemetry)
            except Exception as e:
                print(f"   └── ⚠️ Cloud transmission error ({e}). Running Edge AI fallback.")
                self._handle_offline_inference(telemetry)
        else:
            print(f"📡 [OFFLINE MODE] (No Internet) Temp: {temp:.1f}°C | CPM: {cpm:.1f} -> Running Edge AI on Pi 3B+ CPU...")
            self._handle_offline_inference(telemetry)

    def _handle_offline_inference(self, telemetry: dict):
        """Executes edge AI inference on Pi 3B+ and caches result in SQLite."""
        pred = edge_predictor.predict(telemetry)
        self.db.store_offline_telemetry(telemetry, pred)

        risk = pred.get("risk_level", "LOW")
        score = pred.get("risk_score", 0.0)
        window = pred.get("forecast_window_en", "")

        # High visibility terminal banner for farmers
        if risk == "HIGH":
            print(f"\n🚨🚨 CRITICAL EDGE ALERT: {pred['cow_name']} ({pred['cattle_id']}) — RISK: {score}% (HIGH)")
            print(f"   └── {window}")
            print(f"   └── Action: {pred['recommended_actions_en'][0]}")
            print(f"   └── Saved to local SQLite cache: {DB_PATH}\n")
        elif risk == "MEDIUM":
            print(f"\n⚡ SUBCLINICAL 7-14 DAY WARNING: {pred['cow_name']} — RISK: {score}% (MEDIUM)")
            print(f"   └── {window}")
            print(f"   └── Rumination Deficit: -{pred.get('rumination_deficit_pct', 0)}%")
            print(f"   └── ICAR Phytotherapy: Apply Aloe Vera + Turmeric + Lime paste")
            print(f"   └── Saved to local SQLite cache: {DB_PATH}\n")
        else:
            print(f"   └── ✅ Edge AI: {pred['cow_name']} is Healthy (Risk: {score}%). Saved to local cache.")


def main():
    parser = argparse.ArgumentParser(description="DhenuRakshak AI Edge Gateway Daemon for Raspberry Pi 3B+")
    parser.add_argument("--esp32", default=DEFAULT_ESP32_URL, help=f"ESP32 Telemetry URL (default: {DEFAULT_ESP32_URL})")
    parser.add_argument("--cloud", default=DEFAULT_CLOUD_URL, help=f"Cloud Server URL (default: {DEFAULT_CLOUD_URL})")
    parser.add_argument("--interval", type=float, default=POLL_INTERVAL_SEC, help=f"Poll interval in seconds (default: {POLL_INTERVAL_SEC})")
    args = parser.parse_args()

    print("\n===========================================================")
    print("🐄 DhenuRakshak AI — Raspberry Pi 3B+ Edge Gateway Starting")
    print("🏆 Smart India Hackathon | Problem Statement #109")
    print("===========================================================")
    print(f"📡 ESP32 Source Node: {args.esp32}")
    print(f"☁️ Cloud Target:      {args.cloud}")
    print(f"💾 Local Edge DB:     {DB_PATH}")
    print(f"⏱️ Polling Interval:  {args.interval}s")
    print("===========================================================\n")

    gateway = DhenuRakshakGateway(esp32_url=args.esp32, cloud_url=args.cloud)

    try:
        while True:
            gateway.run_cycle()
            time.sleep(args.interval)
    except KeyboardInterrupt:
        print("\nStopping DhenuRakshak Edge Gateway...")


if __name__ == "__main__":
    main()
