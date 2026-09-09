// Netlify Serverless Function: /api/telemetry (ESM)
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

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json"
};

export default async function handler(req, context) {
  if (req.method === "OPTIONS") {
    return new Response("", { status: 200, headers });
  }

  if (req.method === "POST") {
    try {
      const payload = await req.json();
      latestTelemetry = {
        ...payload,
        last_updated: new Date().toISOString()
      };

      const temp = Number(latestTelemetry.temperature_c) || 38.5;
      const cpm = Number(latestTelemetry.jaw_metrics?.chews_per_minute) || 0;
      let riskLevel = "LOW";
      let riskScore = 12.0;

      if (temp >= 39.8) {
        riskLevel = "HIGH";
        riskScore = 88.5;
      } else if (temp >= 39.2 || cpm < 30) {
        riskLevel = "MEDIUM";
        riskScore = 54.0;
      }

      return new Response(JSON.stringify({
        success: true,
        message: "Telemetry ingested successfully by DhenuRakshak Netlify Cloud",
        prediction: {
          risk_level: riskLevel,
          risk_score: riskScore,
          forecast_window: "7 to 14 Days Early Warning",
          cow_name: latestTelemetry.cow_name || "Kamdhenu"
        }
      }), { status: 200, headers });
    } catch (err) {
      return new Response(JSON.stringify({ success: false, error: err.message }), { status: 400, headers });
    }
  }

  return new Response(JSON.stringify({
    success: true,
    telemetry: latestTelemetry
  }), { status: 200, headers });
}
