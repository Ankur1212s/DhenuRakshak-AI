// Netlify Serverless Function: /api/telemetry
// Ingests live telemetry from Raspberry Pi 3B+ Edge Gateway or ESP32 Collar
// and serves the latest live metrics to the frontend dashboard.

let latestTelemetry = {
  node_id: "DHENU-COLLAR-01",
  cattle_id: "COW-102",
  cow_name: "Kamdhenu",
  temperature_c: 38.6,
  raw_accel: { x: 0.0, y: 0.0, z: 1.0 },
  filtered_accel: { x: 0.0, y: 0.0, z: 1.0 },
  jaw_metrics: {
    dynamic_accel_g: 0.22,
    is_chewing: true,
    total_chews: 42,
    chews_per_minute: 54.0,
    rumination_state: "RUMINATING",
    rumination_active_sec: 120
  },
  gps: {
    latitude: 22.564512,
    longitude: 72.928871,
    speed_kmh: 0.0,
    satellites: 6,
    fix: true
  },
  last_updated: new Date().toISOString()
};

exports.handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod === "POST") {
    try {
      const payload = JSON.parse(event.body || "{}");
      latestTelemetry = {
        ...payload,
        last_updated: new Date().toISOString()
      };

      // Mastitis Risk Assessment (Collar & Bucket Meter EC/pH)
      const temp = Number(latestTelemetry.temperature_c) || 38.5;
      const cpm = Number(latestTelemetry.jaw_metrics?.chews_per_minute) || 0;
      let riskLevel = "LOW";
      let riskScore = 12.0;

      if (latestTelemetry.milk_ec_ms_cm !== undefined) {
        const ec = Number(latestTelemetry.milk_ec_ms_cm);
        const ph = Number(latestTelemetry.milk_ph) || 6.6;
        if (ec >= 6.5 || ph >= 6.95) {
          riskLevel = "HIGH";
          riskScore = 92.5;
        } else if (ec >= 5.7 || ph >= 6.80) {
          riskLevel = "MEDIUM";
          riskScore = 58.0;
        } else {
          riskLevel = "LOW";
          riskScore = 8.5;
        }
      } else if (temp >= 39.8) {
        riskLevel = "HIGH";
        riskScore = 88.5;
      } else if (temp >= 39.2 || cpm < 30) {
        riskLevel = "MEDIUM";
        riskScore = 54.0;
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: "Telemetry ingested successfully by DhenuRakshak Netlify Cloud",
          prediction: {
            risk_level: riskLevel,
            risk_score: riskScore,
            forecast_window: "7 to 14 Days Early Warning",
            cow_name: latestTelemetry.cow_name || "Kamdhenu"
          }
        })
      };
    } catch (err) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: err.message })
      };
    }
  }

  // GET: Return latest live telemetry
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      telemetry: latestTelemetry
    })
  };
};
