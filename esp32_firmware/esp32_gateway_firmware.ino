/*
 * =====================================================================================
 *  🐄 LactoGuard AI — Central ESP32 Edge Gateway (ESP-NOW + Wi-Fi)
 *  Zero Raspberry Pi Architecture!
 *  Target Hardware: Central ESP32 DevKit V1 (30/38 pin)
 * =====================================================================================
 *  What this Central Gateway does:
 *   1. Connects to your local Wi-Fi router / phone hotspot for internet access.
 *   2. Simultaneously listens for ESP-NOW radio packets from:
 *      - Handheld Milking Bucket Meters (Milk EC, pH, RFID, Milking Duration)
 *      - Cattle Ear Tags / Collars (Core Temp, Rumination Chews/Min, GPS Coordinates)
 *   3. When any packet is received (< 5ms transmission):
 *      - Unpacks the binary telemetry structure.
 *      - Converts to JSON payload with gateway diagnostics.
 *      - HTTP POSTs directly to: https://dhenurakshak.netlify.app/api/telemetry
 *      - Data is permanently stored in your MongoDB Atlas cluster!
 * =====================================================================================
 */

#include <Arduino.h>
#include <WiFi.h>
#include <esp_now.h>
#include <esp_idf_version.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// =====================================================================================
//  WI-FI CONFIGURATION
//  (Enter your farm Wi-Fi, home router, or mobile phone hotspot below)
// =====================================================================================
const char* WIFI_SSID = "POCO X5 Pro 5G";       // <-- Replace with your Wi-Fi SSID
const char* WIFI_PASS = "12345678";             // <-- Replace with your Wi-Fi Password

// Cloud Backend Ingest URL (Connected to MongoDB Atlas)
const char* CLOUD_INGEST_URL = "https://dhenurakshak.netlify.app/api/telemetry";

#define PIN_STATUS_LED    2    // Built-in status LED on ESP32

// =====================================================================================
//  ESP-NOW PACKET STRUCTURES
// =====================================================================================

// Message Types
#define MSG_TYPE_BUCKET_METER   1
#define MSG_TYPE_EAR_TAG        2

// 1. Handheld Bucket Meter Packet (Milk EC, pH, RFID, Duration)
typedef struct __attribute__((packed)) {
  uint8_t msg_type;              // 1 = BUCKET_METER
  char device_type[16];          // "BUCKET_METER"
  char node_id[16];              // "DHENU-METER-01"
  char rfid_tag[16];             // e.g. "A3F87B02"
  char cattle_id[16];            // "COW-A3F8"
  float milk_ec_ms_cm;           // e.g. 4.85 mS/cm
  float milk_ph;                 // e.g. 6.64
  uint32_t milking_duration_sec; // e.g. 315
  uint32_t samples_count;        // e.g. 450
  char mastitis_indication[24];  // "HEALTHY_NORMAL", etc.
  uint8_t battery_pct;           // e.g. 95%
} BucketMeterPacket;

// 2. Ear Tag / Collar Packet (Temp, Rumination, GPS)
typedef struct __attribute__((packed)) {
  uint8_t msg_type;              // 2 = EAR_TAG
  char device_type[16];          // "EAR_TAG"
  char node_id[16];              // "DHENU-TAG-01"
  char cattle_id[16];            // "COW-102"
  char cow_name[20];             // "Kamdhenu"
  float temperature_c;           // e.g. 38.6 °C
  float dynamic_accel_g;         // e.g. 0.22 g
  uint16_t total_chews;          // e.g. 48
  float chews_per_minute;        // e.g. 54.0 CPM
  char rumination_state[16];     // "RUMINATING" or "RESTING"
  uint16_t rumination_active_sec;// e.g. 180
  float gps_latitude;            // e.g. 22.5645
  float gps_longitude;           // e.g. 72.9289
  uint8_t battery_pct;           // e.g. 94%
} EarTagPacket;

// Global buffer for incoming payloads
BucketMeterPacket incomingBucketPkt;
EarTagPacket      incomingEarTagPkt;
volatile uint8_t  lastReceivedType = 0;
volatile bool     packetPendingUpload = false;

// =====================================================================================
//  ESP-NOW RECEIVE LOGIC & COMPATIBILITY LAYER (ESP32 Core 2.x & 3.x)
// =====================================================================================
void processIncomingData(const uint8_t *mac, const uint8_t *incomingData, int len) {
  if (len <= 0) return;

  uint8_t msgType = incomingData[0]; // First byte indicates message type

  char macStr[18];
  snprintf(macStr, sizeof(macStr), "%02X:%02X:%02X:%02X:%02X:%02X",
           mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);

  // TYPE 1: Handheld Bucket Meter
  if (msgType == MSG_TYPE_BUCKET_METER && len == sizeof(BucketMeterPacket)) {
    memcpy(&incomingBucketPkt, incomingData, sizeof(BucketMeterPacket));
    lastReceivedType = MSG_TYPE_BUCKET_METER;
    packetPendingUpload = true;

    Serial.println(F("\n======================================================="));
    Serial.printf("📥 [ESP-NOW] Received BUCKET METER from %s\n", macStr);
    Serial.printf("   Cow RFID Tag : %s | ID: %s\n", incomingBucketPkt.rfid_tag, incomingBucketPkt.cattle_id);
    Serial.printf("   Milk EC      : %.2f mS/cm | pH: %.2f\n", incomingBucketPkt.milk_ec_ms_cm, incomingBucketPkt.milk_ph);
    Serial.printf("   Duration     : %u sec | Diagnosis: %s\n", incomingBucketPkt.milking_duration_sec, incomingBucketPkt.mastitis_indication);
    Serial.println(F("======================================================="));
  }
  // TYPE 2: Ear Tag / Collar Node
  else if (msgType == MSG_TYPE_EAR_TAG && len == sizeof(EarTagPacket)) {
    memcpy(&incomingEarTagPkt, incomingData, sizeof(EarTagPacket));
    lastReceivedType = MSG_TYPE_EAR_TAG;
    packetPendingUpload = true;

    Serial.println(F("\n======================================================="));
    Serial.printf("📥 [ESP-NOW] Received EAR TAG telemetry from %s\n", macStr);
    Serial.printf("   Target Cow   : %s (%s)\n", incomingEarTagPkt.cow_name, incomingEarTagPkt.cattle_id);
    Serial.printf("   Body Temp    : %.1f °C\n", incomingEarTagPkt.temperature_c);
    Serial.printf("   Rumination   : %.0f CPM (%s) | Total Chews: %u\n", incomingEarTagPkt.chews_per_minute, incomingEarTagPkt.rumination_state, incomingEarTagPkt.total_chews);
    Serial.printf("   Pasture GPS  : %.4f, %.4f\n", incomingEarTagPkt.gps_latitude, incomingEarTagPkt.gps_longitude);
    Serial.println(F("======================================================="));
  }
  else {
    Serial.printf("[ESP-NOW] Unknown packet (type=%u, len=%d bytes)\n", msgType, len);
  }
}

// Universal Callback Wrapper (Automatically adapts to ESP32 Core 3.x and 2.x)
#if ESP_IDF_VERSION >= ESP_IDF_VERSION_VAL(5, 0, 0)
// ESP32 Arduino Core 3.0+ (IDF 5.x)
void OnDataRecv(const esp_now_recv_info_t *recv_info, const uint8_t *incomingData, int len) {
  processIncomingData(recv_info->src_addr, incomingData, len);
}
#else
// ESP32 Arduino Core 2.x (IDF 4.x)
void OnDataRecv(const uint8_t *mac, const uint8_t *incomingData, int len) {
  processIncomingData(mac, incomingData, len);
}
#endif

// =====================================================================================
//  HTTP CLOUD UPLOADER (Pushes directly to MongoDB Atlas via Netlify)
// =====================================================================================
bool uploadJsonToCloud(const String& jsonPayload) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println(F("[CLOUD] ⚠️ Cannot upload: Wi-Fi is offline!"));
    return false;
  }

  digitalWrite(PIN_STATUS_LED, HIGH);

  HTTPClient http;
  http.begin(CLOUD_INGEST_URL);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(6000);

  int httpCode = http.POST(jsonPayload);
  bool success = false;

  if (httpCode > 0) {
    if (httpCode == HTTP_CODE_OK || httpCode == 201) {
      String response = http.getString();
      Serial.println(F("[CLOUD] ✅ Successfully persisted in MongoDB Atlas!"));
      Serial.print(F("[CLOUD] Server response: "));
      Serial.println(response);
      success = true;
    } else {
      Serial.printf("[CLOUD] Server returned code: %d\n", httpCode);
    }
  } else {
    Serial.printf("[CLOUD] ❌ HTTP POST failed: %s\n", http.errorToString(httpCode).c_str());
  }

  http.end();
  digitalWrite(PIN_STATUS_LED, LOW);
  return success;
}

// Format Bucket Meter Packet to JSON
void processBucketUpload(const BucketMeterPacket &pkt) {
  StaticJsonDocument<512> doc;
  doc["device_type"]          = pkt.device_type;
  doc["node_id"]              = pkt.node_id;
  doc["rfid_tag"]             = pkt.rfid_tag;
  doc["rfid"]                 = pkt.rfid_tag;
  doc["cattle_id"]            = pkt.cattle_id;
  doc["cow_name"]             = "Cow #" + String(pkt.rfid_tag).substring(0, min((unsigned int)strlen(pkt.rfid_tag), 4U));
  doc["milk_ec_ms_cm"]        = round(pkt.milk_ec_ms_cm * 100.0) / 100.0;
  doc["milk_ph"]              = round(pkt.milk_ph * 100.0) / 100.0;
  doc["milking_duration_sec"] = pkt.milking_duration_sec;
  doc["samples_count"]        = pkt.samples_count;
  doc["mastitis_indication"]  = pkt.mastitis_indication;
  doc["battery_pct"]          = pkt.battery_pct;
  doc["gateway_node"]         = "ESP32-GATEWAY-01";
  doc["gateway_rssi"]         = WiFi.RSSI();

  String payload;
  serializeJson(doc, payload);
  uploadJsonToCloud(payload);
}

// Format Ear Tag Packet to JSON
void processEarTagUpload(const EarTagPacket &pkt) {
  StaticJsonDocument<768> doc;
  doc["device_type"]          = pkt.device_type;
  doc["node_id"]              = pkt.node_id;
  doc["cattle_id"]            = pkt.cattle_id;
  doc["cow_name"]             = pkt.cow_name;
  doc["temperature_c"]        = round(pkt.temperature_c * 10.0) / 10.0;
  doc["battery_pct"]          = pkt.battery_pct;
  doc["gateway_node"]         = "ESP32-GATEWAY-01";
  doc["gateway_rssi"]         = WiFi.RSSI();

  // Jaw / Rumination metrics
  JsonObject jaw = doc.createNestedObject("jaw_metrics");
  jaw["dynamic_accel_g"]      = round(pkt.dynamic_accel_g * 100.0) / 100.0;
  jaw["total_chews"]          = pkt.total_chews;
  jaw["chews_per_minute"]     = round(pkt.chews_per_minute * 10.0) / 100.0;
  jaw["rumination_state"]     = pkt.rumination_state;
  jaw["rumination_active_sec"]= pkt.rumination_active_sec;
  jaw["is_chewing"]           = (pkt.chews_per_minute > 30.0f);

  // GPS Coordinates
  JsonObject gps = doc.createNestedObject("gps");
  gps["latitude"]             = pkt.gps_latitude;
  gps["longitude"]            = pkt.gps_longitude;
  gps["fix"]                  = true;
  gps["speed_kmh"]            = 0.0;

  String payload;
  serializeJson(doc, payload);
  uploadJsonToCloud(payload);
}

// =====================================================================================
//  SETUP
// =====================================================================================
void setup() {
  Serial.begin(115200);
  delay(500);

  pinMode(PIN_STATUS_LED, OUTPUT);
  digitalWrite(PIN_STATUS_LED, LOW);

  Serial.println(F("\n======================================================="));
  Serial.println(F("🐄 LactoGuard AI — Central ESP32 Gateway"));
  Serial.println(F("   [ESP-NOW Multi-Node Receiver -> MongoDB Atlas Cloud]"));
  Serial.println(F("   Zero Raspberry Pi Needed!"));
  Serial.println(F("======================================================="));

  // Station Mode
  WiFi.mode(WIFI_STA);

  // Connect to Wi-Fi
  Serial.print(F("[WIFI] Connecting to "));
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  unsigned long startWifi = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startWifi < 10000) {
    delay(300);
    Serial.print(".");
    digitalWrite(PIN_STATUS_LED, !digitalRead(PIN_STATUS_LED));
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(F("\n[WIFI] Connected! Gateway IP: "));
    Serial.println(WiFi.localIP());
    Serial.printf("[WIFI] Operating Channel: %d\n", WiFi.channel());
    digitalWrite(PIN_STATUS_LED, HIGH);
  } else {
    Serial.println(F("\n[WIFI] ⚠️ Router not found. Will auto-reconnect in background."));
    digitalWrite(PIN_STATUS_LED, LOW);
  }

  // Initialize ESP-NOW
  if (esp_now_init() != ESP_OK) {
    Serial.println(F("[ESP-NOW] Error initializing ESP-NOW!"));
    return;
  }

  esp_now_register_recv_cb(OnDataRecv);
  Serial.println(F("[ESP-NOW] Multi-Node Receiver Online!"));
  Serial.println(F("[READY] Listening for Handheld Bucket Meters & Cattle Ear Tags..."));
}

// =====================================================================================
//  MAIN LOOP
// =====================================================================================
void loop() {
  // Check if a packet is pending cloud upload
  if (packetPendingUpload) {
    packetPendingUpload = false;

    // Blink LED 2x
    for (int i = 0; i < 2; i++) {
      digitalWrite(PIN_STATUS_LED, HIGH); delay(60);
      digitalWrite(PIN_STATUS_LED, LOW);  delay(60);
    }

    if (lastReceivedType == MSG_TYPE_BUCKET_METER) {
      processBucketUpload(incomingBucketPkt);
    } else if (lastReceivedType == MSG_TYPE_EAR_TAG) {
      processEarTagUpload(incomingEarTagPkt);
    }
  }

  // Auto-reconnect Wi-Fi if router connection dropped
  static unsigned long lastWifiCheck = 0;
  if (millis() - lastWifiCheck > 12000) {
    lastWifiCheck = millis();
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println(F("[WIFI] Connection lost. Reconnecting..."));
      WiFi.reconnect();
    }
  }

  delay(20);
}
