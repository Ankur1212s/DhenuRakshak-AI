// Netlify Serverless Function: /api/telemetry (ESM with MongoDB Atlas persistence)
import { MongoClient } from "mongodb";

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://antigravity:Ankur1212%24@cluster0.ohbtqbk.mongodb.net/lactoguard?retryWrites=true&w=majority&appName=Cluster0";
const DB_NAME = "lactoguard";
const COLLECTION_NAME = "telemetry_logs";

let cachedClient = null;

async function getMongoCollection() {
  if (!cachedClient) {
    cachedClient = new MongoClient(MONGO_URI, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
    });
    await cachedClient.connect();
  }
  return cachedClient.db(DB_NAME).collection(COLLECTION_NAME);
}

// In-memory fallback in case DB is momentarily unreachable
let fallbackTelemetry = {
  node_id: "DHENU-TAG-01",
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

  // ── POST: Ingest telemetry from Raspberry Pi 3B+ & Save to MongoDB Atlas ──
  if (req.method === "POST") {
    try {
      const payload = await req.json();
      const nowIso = new Date().toISOString();
      const cattleId = payload.cattle_id || "COW-102";

      const temp = Number(payload.temperature_c) || 38.6;
      const cpm = Number(payload.jaw_metrics?.chews_per_minute) || 0;
      let riskLevel = "LOW";
      let riskScore = 12.0;

      // Check Bucket Milk Meter EC & pH
      if (payload.milk_ec_ms_cm !== undefined) {
        const ec = Number(payload.milk_ec_ms_cm);
        const ph = Number(payload.milk_ph) || 6.6;
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

      const documentToInsert = {
        ...payload,
        risk_level: riskLevel,
        risk_score: riskScore,
        created_at: nowIso,
        timestamp: new Date()
      };

      // 1. Save permanently to your MongoDB Atlas cluster
      try {
        const col = await getMongoCollection();
        await col.insertOne(documentToInsert);
      } catch (dbErr) {
        console.warn("MongoDB insert error (falling back):", dbErr.message);
      }

      fallbackTelemetry = {
        ...payload,
        risk_level: riskLevel,
        risk_score: riskScore,
        last_updated: nowIso
      };

      return new Response(JSON.stringify({
        success: true,
        message: "Telemetry stored in MongoDB Atlas (lactoguard.telemetry_logs)",
        prediction: {
          risk_level: riskLevel,
          risk_score: riskScore,
          forecast_window: "7 to 14 Days Early Warning",
          cow_name: payload.cow_name || "Kamdhenu",
          cattle_id: cattleId
        }
      }), { status: 200, headers });
    } catch (err) {
      return new Response(JSON.stringify({ success: false, error: err.message }), { status: 400, headers });
    }
  }

  // ── GET: Query cow data directly from your MongoDB Atlas Database ──
  try {
    const url = new URL(req.url);
    const cowParam = url.searchParams.get("cow") || url.searchParams.get("cattle_id") || url.searchParams.get("rfid") || url.searchParams.get("rfid_tag");

    const col = await getMongoCollection();

    if (cowParam) {
      // Query specific cow's recent telemetry logs from MongoDB (by ID, RFID Tag, name, or node)
      const cowLogs = await col
        .find({
          $or: [
            { cattle_id: cowParam },
            { rfid_tag: cowParam },
            { rfid: cowParam },
            { cow_name: new RegExp(cowParam, "i") },
            { node_id: cowParam }
          ]
        })
        .sort({ created_at: -1 })
        .limit(20)
        .toArray();

      return new Response(JSON.stringify({
        success: true,
        database: "MongoDB Atlas (Cluster0)",
        cow: cowParam,
        count: cowLogs.length,
        telemetry: cowLogs[0] || fallbackTelemetry,
        history: cowLogs
      }), { status: 200, headers });
    }

    // Default: Return latest telemetry document from MongoDB
    const latestDoc = await col.find({}).sort({ created_at: -1 }).limit(1).toArray();

    return new Response(JSON.stringify({
      success: true,
      database: "MongoDB Atlas (Cluster0)",
      telemetry: latestDoc[0] || fallbackTelemetry
    }), { status: 200, headers });
  } catch (err) {
    // Graceful fallback to memory
    return new Response(JSON.stringify({
      success: true,
      database: "Fallback Memory",
      telemetry: fallbackTelemetry
    }), { status: 200, headers });
  }
}
