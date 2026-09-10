/*
 * =====================================================================================
 *  🐄 LactoGuard / DhenuRakshak AI — Central ESP32 Edge Gateway (Wi-Fi + 4G GSM)
 *  Target Hardware: Central ESP32 DevKit V1 (30/38 pin)
 * =====================================================================================
 *  Architecture & Function:
 *   1. Local Wi-Fi Access Point ("Dhenu-Gateway"):
 *      - IP: 192.168.4.1
 *      - Listens for HTTP POST from Handheld Bucket Meters & Cattle Collars.
 *
 *   2. Cloud Uplink (Hybrid Redundancy):
 *      - Primary: Farm Wi-Fi Router / Hotspot (if within range)
 *      - Backup: 4G LTE GSM Module (SIMCOM A7670C / SIM7600 / SIM800L)
 *        connected via Hardware UART2:
 *          ESP32 RX2 (GPIO 16) <--> GSM TXD
 *          ESP32 TX2 (GPIO 17) <--> GSM RXD
 *          GND                 <--> GSM GND
 *
 *   3. MongoDB Atlas Ingest:
 *      - Posts all milking metrics directly to Netlify/MongoDB Cloud endpoint:
 *        https://dhenurakshak.netlify.app/api/telemetry
 * =====================================================================================
 */

#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// =====================================================================================
//  CONFIGURATION
// =====================================================================================
// Local AP for Bucket Meters and Collars to connect to:
const char* AP_SSID = "Dhenu-Gateway";
const char* AP_PASS = "lactoguard123";

// Farm Wi-Fi Router / Mobile Hotspot for primary internet:
const char* STA_ROUTER_SSID = "Farm_WiFi";         // Set your farm Wi-Fi name
const char* STA_ROUTER_PASS = "FarmPassword123";   // Set your farm Wi-Fi password

// Cloud Telemetry Ingest URL (Connected to user's MongoDB Atlas cluster)
const char* CLOUD_INGEST_URL = "https://dhenurakshak.netlify.app/api/telemetry";

// 4G GSM UART Pins (HardwareSerial 2)
#define GSM_RX_PIN        16   // ESP32 RX2 connected to GSM Module TX
#define GSM_TX_PIN        17   // ESP32 TX2 connected to GSM Module RX
#define GSM_BAUD_RATE     115200

#define PIN_STATUS_LED    2    // Gateway Activity Indicator

// Hardware Serial instance for 4G GSM Module
HardwareSerial gsmSerial(2);

// Web Server running on Port 80
WebServer server(80);

// Global status flags
bool wifiInternetAvailable = false;
bool gsmAvailable = false;

// =====================================================================================
//  4G GSM AT COMMAND HELPERS (SIMCOM A7670C / SIM7600)
// =====================================================================================
String sendGsmCommand(const String& cmd, unsigned long timeoutMs = 3000) {
  while (gsmSerial.available()) gsmSerial.read(); // flush buffer
  gsmSerial.println(cmd);

  String response = "";
  unsigned long start = millis();
  while (millis() - start < timeoutMs) {
    while (gsmSerial.available()) {
      char c = gsmSerial.read();
      response += c;
    }
    if (response.indexOf("OK") != -1 || response.indexOf("ERROR") != -1) break;
  }
  return response;
}

bool initGsmModule() {
  Serial.println(F("[GSM] Initializing 4G LTE Modem (SIMCOM A7670C / SIM7600)..."));
  gsmSerial.begin(GSM_BAUD_RATE, SERIAL_8N1, GSM_RX_PIN, GSM_TX_PIN);
  delay(1000);

  // Test AT
  String resp = sendGsmCommand("AT", 1500);
  if (resp.indexOf("OK") == -1) {
    Serial.println(F("[GSM] ⚠️ Modem not responding on UART2."));
    return false;
  }

  sendGsmCommand("ATE0", 1000);           // Echo off
  sendGsmCommand("AT+CPIN?", 2000);        // Check SIM status
  sendGsmCommand("AT+CREG?", 2000);        // Check Network Registration
  sendGsmCommand("AT+NETOPEN", 3000);      // Open Network (for SIMCOM LTE)

  Serial.println(F("[GSM] 4G LTE GSM Modem online and ready for cloud backup!"));
  return true;
}

// Forward JSON via 4G GSM HTTP POST
bool postViaGsm(const String& jsonPayload) {
  Serial.println(F("[GSM] Sending payload via 4G LTE GSM uplink..."));
  sendGsmCommand("AT+HTTPINIT", 2000);
  sendGsmCommand("AT+HTTPPARA=\"URL\",\"" + String(CLOUD_INGEST_URL) + "\"", 2000);
  sendGsmCommand("AT+HTTPPARA=\"CONTENT\",\"application/json\"", 1500);

  // Send data length
  String postDataCmd = "AT+HTTPDATA=" + String(jsonPayload.length()) + ",5000";
  gsmSerial.println(postDataCmd);
  delay(200);
  gsmSerial.print(jsonPayload);
  delay(500);

  // Execute POST (action=1)
  String actionResp = sendGsmCommand("AT+HTTPACTION=1", 8000);
  sendGsmCommand("AT+HTTPTERM", 1500);

  if (actionResp.indexOf(",200,") != -1 || actionResp.indexOf(",201,") != -1) {
    Serial.println(F("[GSM] 4G POST Successful (HTTP 200/201)!"));
    return true;
  }

  Serial.println(F("[GSM] ⚠️ 4G POST returned non-200 status"));
  return false;
}

// Forward JSON via Wi-Fi HTTP POST
bool postViaWiFi(const String& jsonPayload) {
  HTTPClient http;
  http.begin(CLOUD_INGEST_URL);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(6000);

  int httpCode = http.POST(jsonPayload);
  bool ok = false;
  if (httpCode == HTTP_CODE_OK || httpCode == 201) {
    Serial.printf("[UPLINK-WIFI] Successfully forwarded to Cloud DB! Code: %d\n", httpCode);
    ok = true;
  } else {
    Serial.printf("[UPLINK-WIFI] Cloud HTTP POST failed (%d): %s\n", httpCode, http.errorToString(httpCode).c_str());
  }
  http.end();
  return ok;
}

// Forward payload to Cloud using Wi-Fi if available, otherwise fallback to 4G GSM
bool forwardToCloud(const String& jsonPayload) {
  // 1. Try Wi-Fi internet uplink first
  if (WiFi.status() == WL_CONNECTED) {
    if (postViaWiFi(jsonPayload)) return true;
  }

  // 2. Fallback to 4G LTE GSM
  if (gsmAvailable) {
    return postViaGsm(jsonPayload);
  }

  return false;
}

// =====================================================================================
//  HTTP REST HANDLERS
// =====================================================================================
void handleBucketTelemetry() {
  if (server.method() != HTTP_POST) {
    server.send(405, "application/json", "{\"error\":\"Method Not Allowed\"}");
    return;
  }

  digitalWrite(PIN_STATUS_LED, HIGH);
  String payload = server.arg("plain");

  Serial.println(F("\n======================================================="));
  Serial.println(F("📥 [GATEWAY INGEST] Received Telemetry from Bucket Meter:"));
  Serial.println(payload);
  Serial.println(F("======================================================="));

  // Parse incoming JSON
  StaticJsonDocument<768> doc;
  DeserializationError err = deserializeJson(doc, payload);

  if (err) {
    Serial.printf("[ERROR] JSON parse failed: %s\n", err.c_str());
    server.send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
    digitalWrite(PIN_STATUS_LED, LOW);
    return;
  }

  // Enrich payload with Gateway metadata
  doc["gateway_node"] = "DHENU-GATEWAY-ESP32";
  doc["gateway_rssi"] = WiFi.RSSI();
  doc["gateway_time"] = millis();

  String enrichedPayload;
  serializeJson(doc, enrichedPayload);

  // Forward to MongoDB Atlas Cloud Backend
  bool forwardSuccess = forwardToCloud(enrichedPayload);

  StaticJsonDocument<256> respDoc;
  respDoc["success"] = true;
  respDoc["message"] = "Telemetry ingested by ESP32 Gateway";
  respDoc["cloud_forwarded"] = forwardSuccess;
  respDoc["cow_rfid"] = doc["rfid_tag"] | "UNKNOWN";

  String respJson;
  serializeJson(respDoc, respJson);

  server.send(200, "application/json", respJson);
  digitalWrite(PIN_STATUS_LED, LOW);
}

void handleRoot() {
  String html = "<html><head><title>DhenuRakshak ESP32 Gateway</title></head>";
  html += "<body style='font-family:sans-serif;padding:20px;'>";
  html += "<h2>🐄 LactoGuard / DhenuRakshak AI — Farm Gateway</h2>";
  html += "<p>Status: <strong>Active & Listening</strong></p>";
  html += "<p>Wi-Fi Internet: <strong>" + String(WiFi.status() == WL_CONNECTED ? "CONNECTED" : "OFFLINE") + "</strong></p>";
  html += "<p>4G GSM Backup: <strong>" + String(gsmAvailable ? "ONLINE" : "STANDBY / NO MODEM") + "</strong></p>";
  html += "<p>Connected Bucket Meter Endpoint: <code>POST /api/bucket-telemetry</code></p>";
  html += "</body></html>";
  server.send(200, "text/html", html);
}

// =====================================================================================
//  SETUP
// =====================================================================================
void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println(F("\n======================================================="));
  Serial.println(F("🐄 LactoGuard / DhenuRakshak AI — ESP32 Edge Gateway"));
  Serial.println(F("======================================================="));

  pinMode(PIN_STATUS_LED, OUTPUT);
  digitalWrite(PIN_STATUS_LED, LOW);

  // Configure Wi-Fi in AP+STA dual mode:
  // AP: Bucket meters connect directly to ESP32
  // STA: ESP32 connects to Farm Router for primary internet
  WiFi.mode(WIFI_AP_STA);

  // 1. Setup Local Access Point
  WiFi.softAP(AP_SSID, AP_PASS);
  IPAddress apIP = WiFi.softAPIP();
  Serial.print(F("[WIFI-AP] Local Gateway AP created: "));
  Serial.println(AP_SSID);
  Serial.print(F("[WIFI-AP] Gateway IP: "));
  Serial.println(apIP);

  // 2. Connect to Farm Router (if available)
  Serial.print(F("[WIFI-STA] Connecting to Farm Router: "));
  Serial.println(STA_ROUTER_SSID);
  WiFi.begin(STA_ROUTER_SSID, STA_ROUTER_PASS);

  unsigned long startWait = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startWait < 5000) {
    delay(250);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(F("\n[WIFI-STA] Internet connected! Farm IP: "));
    Serial.println(WiFi.localIP());
    wifiInternetAvailable = true;
  } else {
    Serial.println(F("\n[WIFI-STA] Router not found. 4G GSM will handle cloud uplink."));
    wifiInternetAvailable = false;
  }

  // 3. Initialize 4G GSM Backup
  gsmAvailable = initGsmModule();

  // 4. Start HTTP Server
  server.on("/", HTTP_GET, handleRoot);
  server.on("/api/bucket-telemetry", HTTP_POST, handleBucketTelemetry);
  server.begin();
  Serial.println(F("[HTTP] Gateway WebServer running on port 80"));
  Serial.println(F("[READY] Awaiting bucket meter transmissions..."));
}

// =====================================================================================
//  LOOP
// =====================================================================================
void loop() {
  server.handleClient();
  delay(5);
}
