/*
 * =====================================================================================
 *  🐄 LactoGuard / DhenuRakshak AI — Central ESP32 Edge Gateway (ESP-NOW + Wi-Fi)
 *  Protocol: ESP-NOW (Receives from Bucket Meters) + Wi-Fi (Uplinks to Cloud MongoDB)
 *  Target Hardware: Central ESP32 DevKit V1 (30/38 pin)
 * =====================================================================================
 *  How it Works:
 *   1. Gateway connects to your local Wi-Fi router / phone hotspot for internet.
 *   2. Simultaneously listens for ESP-NOW transmissions from any bucket meters in range.
 *   3. When a bucket meter sends a milking packet via ESP-NOW:
 *      - Gateway receives it in milliseconds (< 5ms).
 *      - Blinks activity LED and logs details to Serial Monitor.
 *      - Sends HTTP POST directly to: https://dhenurakshak.netlify.app/api/telemetry
 *      - Netlify serverless function saves it permanently in your MongoDB Atlas cluster!
 * =====================================================================================
 */

#include <Arduino.h>
#include <WiFi.h>
#include <esp_now.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// =====================================================================================
//  WI-FI CONFIGURATION
//  (Enter your home/barn Wi-Fi or phone hotspot credentials below)
// =====================================================================================
const char* WIFI_SSID = "POCO X5 Pro 5G";       // <-- Replace with your Wi-Fi SSID
const char* WIFI_PASS = "12345678";             // <-- Replace with your Wi-Fi Password

// Cloud Backend Ingest URL (Stores into MongoDB Atlas)
const char* CLOUD_INGEST_URL = "https://dhenurakshak.netlify.app/api/telemetry";

#define PIN_STATUS_LED    2    // Onboard status LED

// =====================================================================================
//  ESP-NOW PACKET STRUCTURE (Matches Bucket Meter 1:1)
// =====================================================================================
typedef struct __attribute__((packed)) {
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
} MilkingPacket;

MilkingPacket receivedPacket;
volatile bool newPacketReceived = false;

// =====================================================================================
//  ESP-NOW RECEIVE CALLBACK
// =====================================================================================
void OnDataRecv(const uint8_t *mac, const uint8_t *incomingData, int len) {
  if (len == sizeof(MilkingPacket)) {
    memcpy(&receivedPacket, incomingData, sizeof(MilkingPacket));
    newPacketReceived = true;

    char macStr[18];
    snprintf(macStr, sizeof(macStr), "%02X:%02X:%02X:%02X:%02X:%02X",
             mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);

    Serial.println(F("\n======================================================="));
    Serial.printf("📥 [ESP-NOW RECV] Packet from Meter MAC: %s\n", macStr);
    Serial.printf("   Cow RFID Tag : %s | Cattle ID: %s\n", receivedPacket.rfid_tag, receivedPacket.cattle_id);
    Serial.printf("   Milk EC      : %.2f mS/cm\n", receivedPacket.milk_ec_ms_cm);
    Serial.printf("   Milk pH      : %.2f\n", receivedPacket.milk_ph);
    Serial.printf("   Duration     : %u seconds | Samples: %u\n", receivedPacket.milking_duration_sec, receivedPacket.samples_count);
    Serial.printf("   Indication   : %s\n", receivedPacket.mastitis_indication);
    Serial.println(F("======================================================="));
  } else {
    Serial.printf("[ESP-NOW] Received unexpected packet length: %d bytes (expected %d)\n", len, sizeof(MilkingPacket));
  }
}

// =====================================================================================
//  FORWARD TELEMETRY TO CLOUD MONGODB
// =====================================================================================
bool forwardToMongoDBCloud(const MilkingPacket &pkt) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println(F("[CLOUD] ⚠️ Cannot forward: Wi-Fi is disconnected!"));
    return false;
  }

  digitalWrite(PIN_STATUS_LED, HIGH);

  // Build JSON Document
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

  String jsonPayload;
  serializeJson(doc, jsonPayload);

  Serial.println(F("[CLOUD] Uploading JSON to MongoDB Atlas via Netlify:"));
  Serial.println(jsonPayload);

  HTTPClient http;
  http.begin(CLOUD_INGEST_URL);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(6000);

  int httpCode = http.POST(jsonPayload);
  bool success = false;

  if (httpCode > 0) {
    Serial.printf("[CLOUD] HTTP Response Code: %d\n", httpCode);
    if (httpCode == HTTP_CODE_OK || httpCode == 201) {
      String response = http.getString();
      Serial.println(F("[CLOUD] ✅ Successfully persisted in MongoDB Atlas!"));
      Serial.println(F("[CLOUD] Response: ") + response);
      success = true;
    }
  } else {
    Serial.printf("[CLOUD] ❌ HTTP POST failed: %s\n", http.errorToString(httpCode).c_str());
  }

  http.end();
  digitalWrite(PIN_STATUS_LED, LOW);
  return success;
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
  Serial.println(F("🐄 LactoGuard / DhenuRakshak AI — Central ESP32 Gateway"));
  Serial.println(F("======================================================="));

  // Set Wi-Fi to Station Mode
  WiFi.mode(WIFI_STA);

  // Connect to Wi-Fi router / phone hotspot
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
    Serial.printf("[WIFI] Operating on Wi-Fi Channel: %d\n", WiFi.channel());
    digitalWrite(PIN_STATUS_LED, HIGH);
  } else {
    Serial.println(F("\n[WIFI] ⚠️ Could not connect to Wi-Fi. (Will retry in background)"));
    digitalWrite(PIN_STATUS_LED, LOW);
  }

  // Initialize ESP-NOW
  if (esp_now_init() != ESP_OK) {
    Serial.println(F("[ESP-NOW] Error initializing ESP-NOW receiver!"));
    return;
  }

  // Register Receive Callback
  esp_now_register_recv_cb(OnDataRecv);
  Serial.println(F("[ESP-NOW] Receiver Online! Listening for Bucket Meters..."));
  Serial.println(F("[READY] Gateway is active and waiting for milking data."));
}

// =====================================================================================
//  MAIN LOOP
// =====================================================================================
void loop() {
  // Check if a new ESP-NOW packet was received
  if (newPacketReceived) {
    newPacketReceived = false;

    // Flash LED
    for (int i = 0; i < 3; i++) {
      digitalWrite(PIN_STATUS_LED, HIGH); delay(80);
      digitalWrite(PIN_STATUS_LED, LOW);  delay(80);
    }

    // Forward to MongoDB Atlas Cloud
    forwardToMongoDBCloud(receivedPacket);
  }

  // Auto-reconnect Wi-Fi if dropped
  static unsigned long lastCheck = 0;
  if (millis() - lastCheck > 15000) {
    lastCheck = millis();
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println(F("[WIFI] Connection lost. Reconnecting..."));
      WiFi.reconnect();
    }
  }

  delay(20);
}
