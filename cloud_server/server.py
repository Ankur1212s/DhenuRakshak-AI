#!/usr/bin/env python3
"""
server.py — DhenuRakshak AI Full-Stack Cloud Server
Smart India Hackathon (SIH) | Problem Statement #109
Predictive Forecasting of Bovine Mastitis (7-14 Days in Advance)

Features:
- Pure Python 3 Standard Library (Zero npm / pip dependency requirement)
- Multi-threaded REST API Server + Static Web Dashboard File Server
- Real-Time IoT Ingestion for Collar Telemetry (ADXL345 Rumination, LM35 Temp, NEO-6M GPS)
- Automated 7-14 Day Subclinical Mastitis Forecasting Engine
- SQLite Database Persistence (cattle, telemetry_history, alerts, predictions)
"""

import os
import sys
import json
import sqlite3
import random
import time
import math
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse
from typing import Any, Dict

# Import DhenuRakshak AI prediction engine
from dhenurakshak_engine import predictor

PORT = int(os.environ.get("PORT", 5173))
DB_PATH = os.path.join(os.path.dirname(__file__), "dhenurakshak.db")
PUBLIC_DIR = os.path.join(os.path.dirname(__file__), "public")

# In-memory latest collar telemetry cache for high-frequency live visualization
_latest_live_telemetry: Dict[str, Any] = {
    "node_id": "DHENU-COLLAR-01",
    "cattle_id": "COW-102",
    "cow_name": "Kamdhenu (कामधेनु)",
    "temperature_c": 38.8,
    "raw_accel": {"x": 0.02, "y": -0.15, "z": 0.98},
    "filtered_accel": {"x": 0.01, "y": -0.12, "z": 0.99},
    "jaw_metrics": {
        "dynamic_accel_g": 0.24,
        "is_chewing": True,
        "total_chews": 1420,
        "chews_per_minute": 54.2,
        "rumination_state": "RUMINATING",
        "rumination_active_sec": 19800
    },
    "gps": {
        "latitude": 22.5645,
        "longitude": 72.9289,
        "speed_kmh": 0.4,
        "satellites": 7,
        "fix": True
    },
    "timestamp": datetime.now(timezone.utc).isoformat()
}


def init_db():
    """Initializes SQLite database with cattle, telemetry, alerts, and predictions."""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS cattle (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        tag_number TEXT NOT NULL,
        breed TEXT NOT NULL,
        age_years REAL NOT NULL,
        parity INTEGER NOT NULL,
        days_in_milk INTEGER NOT NULL,
        milk_yield REAL NOT NULL,
        baseline_yield REAL NOT NULL,
        risk_level TEXT NOT NULL,
        risk_score REAL NOT NULL,
        last_checked TEXT NOT NULL,
        ec_lf REAL DEFAULT 4.8,
        ec_rf REAL DEFAULT 4.8,
        ec_lh REAL DEFAULT 4.8,
        ec_rh REAL DEFAULT 4.8,
        scc INTEGER DEFAULT 180000,
        body_temp REAL DEFAULT 38.6,
        milk_ph REAL DEFAULT 6.6,
        rumination_mins REAL DEFAULT 450.0,
        cpm REAL DEFAULT 56.0,
        gps_lat REAL DEFAULT 22.5645,
        gps_lon REAL DEFAULT 72.9289
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS telemetry_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cattle_id TEXT NOT NULL,
        node_id TEXT,
        temperature_c REAL,
        cpm REAL,
        rumination_sec INTEGER,
        dynamic_accel_g REAL,
        latitude REAL,
        longitude REAL,
        raw_json TEXT,
        created_at TEXT NOT NULL
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cattle_id TEXT NOT NULL,
        cattle_name TEXT NOT NULL,
        alert_type TEXT NOT NULL,
        risk_level TEXT NOT NULL,
        title TEXT NOT NULL,
        title_hi TEXT NOT NULL,
        message TEXT NOT NULL,
        message_hi TEXT NOT NULL,
        created_at TEXT NOT NULL,
        resolved INTEGER DEFAULT 0
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS predictions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cattle_id TEXT NOT NULL,
        payload TEXT NOT NULL,
        result TEXT NOT NULL,
        created_at TEXT NOT NULL
    )
    """)

    # Seed sample cattle if empty
    cur.execute("SELECT COUNT(*) FROM cattle")
    if cur.fetchone()[0] == 0:
        now_iso = datetime.now(timezone.utc).isoformat()
        sample_cattle = [
            ("COW-101", "Lakshmi (लक्ष्मी)", "TAG-IND-801", "Gir (गीर)", 4.5, 2, 110, 18.2, 18.5, "LOW", 10.2, now_iso, 4.8, 4.9, 4.7, 4.8, 120000, 38.5, 6.6, 470.0, 58.0, 22.5641, 72.9285),
            ("COW-102", "Kamdhenu (कामधेनु)", "TAG-IND-802", "Sahiwal (साहीवाल)", 5.0, 3, 45, 13.8, 16.0, "MEDIUM", 68.4, now_iso, 4.9, 5.0, 4.9, 6.4, 290000, 39.1, 6.8, 340.0, 41.0, 22.5648, 72.9292),
            ("COW-103", "Ganga (गंगा)", "TAG-IND-803", "Murrah Buffalo (मुर्रा भैंस)", 6.0, 3, 140, 14.5, 14.8, "LOW", 12.5, now_iso, 4.7, 4.8, 4.8, 4.7, 140000, 38.4, 6.62, 490.0, 60.0, 22.5639, 72.9279),
            ("COW-104", "Meera (मीरा)", "TAG-IND-804", "HF Cross (होल्सटीन संकर)", 3.5, 2, 35, 9.0, 19.5, "HIGH", 98.5, now_iso, 7.8, 5.2, 5.1, 5.3, 780000, 40.1, 7.25, 180.0, 22.0, 22.5655, 72.9301),
            ("COW-105", "Radha (राधा)", "TAG-IND-805", "Tharparkar (थारपारकर)", 4.0, 2, 95, 12.5, 12.8, "LOW", 14.0, now_iso, 4.8, 4.7, 4.9, 4.8, 160000, 38.6, 6.6, 460.0, 56.0, 22.5644, 72.9288),
            ("COW-106", "Nandini (नंदिनी)", "TAG-IND-806", "Rathi (राठी)", 3.0, 1, 160, 11.2, 11.5, "LOW", 9.8, now_iso, 4.6, 4.7, 4.7, 4.8, 110000, 38.5, 6.58, 480.0, 57.0, 22.5647, 72.9281),
        ]
        cur.executemany("""
        INSERT INTO cattle (id, name, tag_number, breed, age_years, parity, days_in_milk, milk_yield, baseline_yield, risk_level, risk_score, last_checked, ec_lf, ec_rf, ec_lh, ec_rh, scc, body_temp, milk_ph, rumination_mins, cpm, gps_lat, gps_lon)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, sample_cattle)

        sample_alerts = [
            ("COW-104", "Meera (मीरा)", "CLINICAL_MASTITIS", "HIGH",
             "Emergency: Acute Clinical Mastitis in Left Front Quarter!",
             "आपातकालीन: बाएँ अगले थन में गंभीर क्लिनिकल थनैला!",
             "Core temperature 40.1°C with severe milk yield drop (-53%). Veterinary antibiotics required immediately.",
             "तापमान 40.1°C और दूध में 53% गिरावट। तुरंत पशु चिकित्सक से संपर्क करें।",
             now_iso, 0),
            ("COW-102", "Kamdhenu (कामधेनु)", "7_14_DAY_PREDICTION", "MEDIUM",
             "7-14 Day Early Warning: Subclinical Mastitis Risk Detected!",
             "7-14 दिन पूर्व चेतावनी: सबक्लिनिकल थनैला का प्रारंभिक संकेत!",
             "Rumination dropped by 26% with body temperature up at 39.1°C. Apply ICAR Herbal Phytotherapy paste 3x daily.",
             "जुगाली में 26% की कमी और हल्का बुखार (39.1°C)। आईसीएआर प्रमाणित हल्दी-एलोवेरा-चूना लेप लगाएं।",
             now_iso, 0)
        ]
        cur.executemany("""
        INSERT INTO alerts (cattle_id, cattle_name, alert_type, risk_level, title, title_hi, message, message_hi, created_at, resolved)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, sample_alerts)

    conn.commit()
    conn.close()


class DhenuRakshakHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PUBLIC_DIR, **kwargs)

    def _send_json(self, data: Any, status: int = HTTPStatus.OK):
        payload = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()
        self.wfile.write(payload)

    def _parse_body(self) -> Dict[str, Any]:
        try:
            content_len = int(self.headers.get("Content-Length", 0))
            if content_len > 0:
                raw_data = self.rfile.read(content_len).decode("utf-8")
                return json.loads(raw_data)
        except Exception:
            pass
        return {}

    def do_OPTIONS(self):
        self.send_response(HTTPStatus.OK)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/api/health":
            self._send_json({
                "status": "healthy",
                "service": "DhenuRakshak AI Cloud Backend",
                "version": "3.0.0",
                "platform": "Smart India Hackathon 2026 (Problem Statement 109)",
                "engine": "7-14 Day Bovine Mastitis Early Forecasting Ensemble",
                "time": datetime.now(timezone.utc).isoformat()
            })
            return

        if path == "/api/telemetry/live":
            # Returns the real-time live telemetry stream
            global _latest_live_telemetry
            self._send_json({"success": True, "telemetry": _latest_live_telemetry})
            return

        if path == "/api/herd/locations":
            # Returns GPS coordinates and risk levels of all herd cattle
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            cur = conn.cursor()
            cur.execute("SELECT id, name, tag_number, breed, risk_level, risk_score, body_temp, rumination_mins, gps_lat, gps_lon, last_checked FROM cattle")
            rows = [dict(r) for r in cur.fetchall()]
            conn.close()
            self._send_json({"success": True, "count": len(rows), "cattle": rows})
            return

        if path == "/api/cattle":
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            cur = conn.cursor()
            cur.execute("SELECT * FROM cattle ORDER BY risk_score DESC")
            rows = [dict(r) for r in cur.fetchall()]
            conn.close()
            self._send_json({"success": True, "count": len(rows), "data": rows})
            return

        if path.startswith("/api/cattle/"):
            cattle_id = path.replace("/api/cattle/", "").strip()
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            cur = conn.cursor()
            cur.execute("SELECT * FROM cattle WHERE id = ?", (cattle_id,))
            row = cur.fetchone()
            conn.close()
            if row:
                self._send_json({"success": True, "data": dict(row)})
            else:
                self._send_json({"success": False, "error": "Cattle not found"}, status=404)
            return

        if path == "/api/alerts":
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            cur = conn.cursor()
            cur.execute("SELECT * FROM alerts ORDER BY resolved ASC, id DESC")
            rows = [dict(r) for r in cur.fetchall()]
            conn.close()
            self._send_json({"success": True, "data": rows})
            return

        if path == "/api/iot-stream":
            # Real-time milking parlor stream simulator
            t = time.time()
            sec = int(t % 480)
            flow = round(2.0 + 0.5 * math.sin(sec / 8.0), 2)
            ec_rf = round(4.9 + 0.1 * math.cos(t / 6.0), 2)
            ec_rh = round(6.3 + 0.25 * math.sin(t / 4.0), 2)
            self._send_json({
                "stall_id": "STALL-02",
                "cow_id": "COW-102",
                "cow_name": "Kamdhenu",
                "flow_rate_lpm": flow,
                "milk_temp_c": round(38.8 + 0.1 * math.sin(t / 10.0), 2),
                "quarters_ec": {"LF": 4.8, "RF": ec_rf, "LH": 4.75, "RH": ec_rh},
                "live_warning": (ec_rh >= 6.0),
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
            return

        # SPA Static File Handling
        if path == "/" or not os.path.exists(os.path.join(PUBLIC_DIR, path.lstrip("/"))):
            self.path = "/index.html"
        return super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        body = self._parse_body()

        # Ingest Telemetry from ESP32 or Raspberry Pi Gateway
        if path == "/api/telemetry":
            global _latest_live_telemetry
            _latest_live_telemetry = body

            cattle_id = body.get("cattle_id", "COW-102")
            temp_c = float(body.get("temperature_c", 38.6))
            jaw = body.get("jaw_metrics", {})
            cpm = float(jaw.get("chews_per_minute", 0.0))
            rumination_sec = int(jaw.get("rumination_active_sec", 0))
            rumination_mins = rumination_sec / 60.0
            gps = body.get("gps", {})
            lat = float(gps.get("latitude", 22.5645))
            lon = float(gps.get("longitude", 72.9289))
            now_iso = datetime.now(timezone.utc).isoformat()

            # Automatically run 7-14 Day AI Forecasting
            pred = predictor.predict(body)

            # Persist to database
            try:
                conn = sqlite3.connect(DB_PATH)
                cur = conn.cursor()

                cur.execute("""
                INSERT INTO telemetry_history (cattle_id, node_id, temperature_c, cpm, rumination_sec, dynamic_accel_g, latitude, longitude, raw_json, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (cattle_id, body.get("node_id", "COLLAR-01"), temp_c, cpm, rumination_sec, jaw.get("dynamic_accel_g", 0.0), lat, lon, json.dumps(body), now_iso))

                cur.execute("""
                UPDATE cattle
                SET body_temp = ?, rumination_mins = ?, cpm = ?, gps_lat = ?, gps_lon = ?,
                    risk_level = ?, risk_score = ?, last_checked = ?
                WHERE id = ?
                """, (temp_c, rumination_mins, cpm, lat, lon, pred["risk_level"], pred["risk_score"], now_iso, cattle_id))

                # Trigger real-time alert for Subclinical (Medium) or Clinical (High)
                if pred["risk_level"] in ("HIGH", "MEDIUM"):
                    cur.execute("""
                    INSERT INTO alerts (cattle_id, cattle_name, alert_type, risk_level, title, title_hi, message, message_hi, created_at, resolved)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
                    """, (
                        cattle_id,
                        pred["cow_name"],
                        "7_14_DAY_PREDICTION" if pred["risk_level"] == "MEDIUM" else "CLINICAL_ALERT",
                        pred["risk_level"],
                        f"DhenuRakshak Alert: {pred['risk_level']} Mastitis Risk for {pred['cow_name']}",
                        f"धेनुरक्षक चेतावनी: {pred['cow_name']} में थनैला का {pred['risk_label_hi']}!",
                        pred["summary_en"] + pred["forecast_window_en"],
                        pred["summary_en"] + pred["forecast_window_hi"],
                        now_iso
                    ))

                conn.commit()
                conn.close()
            except Exception as e:
                print(f"DB Telemetry insert error: {e}", file=sys.stderr)

            self._send_json({"success": True, "message": "Telemetry received", "prediction": pred})
            return

        # Explicit AI Prediction
        if path == "/api/predict":
            pred = predictor.predict(body)
            self._send_json({"success": True, "prediction": pred})
            return

        # Alerts Resolve
        if path == "/api/alerts/resolve":
            alert_id = body.get("alert_id")
            conn = sqlite3.connect(DB_PATH)
            cur = conn.cursor()
            cur.execute("UPDATE alerts SET resolved = 1 WHERE id = ?", (alert_id,))
            conn.commit()
            conn.close()
            self._send_json({"success": True, "message": "Alert resolved"})
            return

        # Demo Auth
        if path in ("/api/auth/send-otp", "/api/auth/verify-otp", "/api/auth/demo-login"):
            self._send_json({
                "success": True,
                "user": {
                    "id": "farmer-01",
                    "name": "Kisan Ramesh Patel (रमेश पटेल)",
                    "phone": "9876543210",
                    "farm_name": "Surabhi Dairy Farm (सुरभि गोशाला)",
                    "cattle_count": 6
                }
            })
            return

        self._send_json({"error": "Endpoint not found"}, status=404)


def run_server():
    init_db()
    os.makedirs(PUBLIC_DIR, exist_ok=True)
    server_address = ("", PORT)
    httpd = ThreadingHTTPServer(server_address, DhenuRakshakHandler)
    print("\n===========================================================")
    print("🐄 DhenuRakshak AI — Cloud Predictive Server Running!")
    print("🏆 Smart India Hackathon | Problem Statement #109")
    print("===========================================================")
    print(f"🌾 Web Dashboard:    http://localhost:{PORT}")
    print(f"📡 Telemetry Ingest: POST http://localhost:{PORT}/api/telemetry")
    print(f"📍 GPS Herd Map:     GET http://localhost:{PORT}/api/herd/locations")
    print(f"💾 SQLite Database:  {DB_PATH}")
    print("===========================================================\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping DhenuRakshak Server...")
        httpd.server_close()


if __name__ == "__main__":
    run_server()
