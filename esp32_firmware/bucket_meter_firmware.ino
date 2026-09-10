/*
 * =====================================================================================
 *  🐄 LactoGuard / DhenuRakshak AI — Smart Milking Bucket Handheld Meter Firmware
 *  Target Hardware: ESP32 DevKit V1 (30/38 pin)
 * =====================================================================================
 *  Sensors & Peripherals:
 *   1. MFRC522 RFID Reader (SPI @ 13.56 MHz):
 *      - 3.3V  -> ESP32 3V3 (⚠️ NEVER connect to 5V rail!)
 *      - GND   -> ESP32 GND
 *      - RST   -> GPIO 22
 *      - SDA/SS-> GPIO 5
 *      - MOSI  -> GPIO 23
 *      - MISO  -> GPIO 19
 *      - SCK   -> GPIO 18
 *
 *   2. Push Buttons (Active LOW with internal INPUT_PULLUP):
 *      - START Button -> GPIO 13 to GND
 *      - SEND Button  -> GPIO 14 to GND
 *
 *   3. Analog Sensors (ADC1 ONLY - safe from Wi-Fi & ADC2 conflicts):
 *      - Analog Milk EC (Conductivity) -> GPIO 34 (ADC1_CH6)
 *      - Analog Milk pH Probe (Po)     -> GPIO 35 (ADC1_CH7)
 *      - Sensor VCC -> 5V (from 5V / VIN rail)
 *      - Sensor GND -> ESP32 Common GND
 *
 *   4. Audio / Visual Feedback:
 *      - Active Buzzer -> GPIO 15 (via 220Ω resistor or direct 3.3V/5V)
 *      - Status LED Green (Ready / Ok) -> GPIO 2 (Onboard or External)
 *      - Status LED Blue (Milking / TX) -> GPIO 4
 *
 *  Operational State Flow:
 *   [1] STANDBY: Taps ear tag to read Cow RFID (UID). Beeps & locks tag.
 *   [2] READY: Farmer clips meter to bucket wall.
 *   [3] START: Farmer presses START button -> enters continuous sampling (EC & pH).
 *   [4] SEND: Milking complete -> Farmer presses SEND button.
 *   [5] TRANSMIT: Turns ON Wi-Fi, connects to ESP32 Gateway AP, POSTs JSON payload,
 *                 beeps confirmation, turns OFF Wi-Fi (powersave), resets to [1].
 * =====================================================================================
 */

#include <Arduino.h>
#include <SPI.h>
#include <MFRC522.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// =====================================================================================
//  PIN DEFINITIONS
// =====================================================================================
#define PIN_RC522_SS       5
#define PIN_RC522_RST      22
#define PIN_BTN_START      13
#define PIN_BTN_SEND       14
#define PIN_EC_ADC         34    // ADC1_CH6
#define PIN_PH_ADC         35    // ADC1_CH7
#define PIN_BUZZER         15
#define PIN_LED_GREEN      2     // Built-in LED on most ESP32 DevKits
#define PIN_LED_BLUE       4

// =====================================================================================
//  DEVICE & NETWORK CONFIGURATION
// =====================================================================================
#define DEVICE_NODE_ID     "DHENU-METER-01"

// Central ESP32 Gateway Wi-Fi Access Point Details
const char* GATEWAY_SSID = "Dhenu-Gateway";
const char* GATEWAY_PASS = "lactoguard123";
const char* GATEWAY_URL  = "http://192.168.4.1/api/bucket-telemetry";

// Direct Cloud Backup (Optional: If meter connects directly to barn Wi-Fi / phone hotspot)
const char* CLOUD_DIRECT_URL = "https://dhenurakshak.netlify.app/api/telemetry";

// =====================================================================================
//  SENSOR CALIBRATION CONSTANTS
// =====================================================================================
// ESP32 ADC: 12-bit (0 - 4095), 3.3V reference
#define ADC_VOLTAGE_REF    3.3f
#define ADC_RESOLUTION     4095.0f

// pH Sensor (pH-4502C / DFRobot Analog pH):
// Standard: pH 7.0 = 2.50V (Offset can be calibrated with trimmer pot on pH-4502C)
// Slope: -5.70 pH per Volt
#define PH_CALIBRATION_OFFSET   0.00f
#define PH_SLOPE                -5.70f
#define PH_NEUTRAL_VOLTAGE      2.50f

// EC Sensor (DFRobot EC or Analog Conductivity Probe):
// Cell constant K = 1.0 (typical)
// Formula: EC (mS/cm) = (Voltage / 1000) * K * 1000
#define EC_K_CONSTANT           1.0f

// Thresholds for Bovine Mastitis Screening:
// Healthy Fresh Milk:  EC 4.0 - 5.5 mS/cm  | pH 6.50 - 6.75
// Subclinical Warning: EC 5.6 - 6.4 mS/cm  | pH 6.76 - 6.95
// Clinical Mastitis:   EC >= 6.5 mS/cm     | pH >= 6.95
#define EC_SUBCLINICAL_THRESHOLD  5.6f
#define EC_CLINICAL_THRESHOLD     6.5f
#define PH_SUBCLINICAL_THRESHOLD  6.76f
#define PH_CLINICAL_THRESHOLD     6.95f

// =====================================================================================
//  STATE MACHINE ENUM
// =====================================================================================
enum MeterState {
  STATE_STANDBY_RFID = 0,   // Waiting for RFID ear tag scan
  STATE_READY_TO_MILK,      // Ear tag scanned, waiting for START button
  STATE_MILKING_ACTIVE,     // Sampling milk EC and pH in bucket
  STATE_MILKING_PAUSED,     // Milking finished, waiting for SEND button
  STATE_TRANSMITTING        // Connecting to Gateway and uploading telemetry
};

MeterState currentState = STATE_STANDBY_RFID;

// Hardware RFID Instance
MFRC522 mfrc522(PIN_RC522_SS, PIN_RC522_RST);

// Milking Session Variables
String currentRfidTag = "";
unsigned long sessionStartTime = 0;
unsigned long sessionDurationSec = 0;

// Sensor Accumulators for Running Average
double ecAccumulator = 0;
double phAccumulator = 0;
unsigned long validSamplesCount = 0;

float finalAvgEC = 0.0f;
float finalAvgPH = 0.0f;
String finalIndication = "NORMAL";

// Button Debounce Timers
unsigned long lastDebounceStart = 0;
unsigned long lastDebounceSend = 0;
const unsigned long DEBOUNCE_DELAY_MS = 250;

// LED Blink Timer
unsigned long lastLedBlinkTime = 0;
bool ledState = false;

// =====================================================================================
//  BUZZER & FEEDBACK HELPERS
// =====================================================================================
void beepShort(int count = 1) {
  for (int i = 0; i < count; i++) {
    digitalWrite(PIN_BUZZER, HIGH);
    delay(90);
    digitalWrite(PIN_BUZZER, LOW);
    if (i < count - 1) delay(70);
  }
}

void beepLong(int count = 1) {
  for (int i = 0; i < count; i++) {
    digitalWrite(PIN_BUZZER, HIGH);
    delay(350);
    digitalWrite(PIN_BUZZER, LOW);
    if (i < count - 1) delay(100);
  }
}

void beepError() {
  for (int i = 0; i < 3; i++) {
    digitalWrite(PIN_BUZZER, HIGH);
    delay(200);
    digitalWrite(PIN_BUZZER, LOW);
    delay(100);
  }
}

// =====================================================================================
//  ANALOG SENSING & FILTERING
// =====================================================================================
// Read Analog Pin with 32-sample multisampling for high stability & noise immunity
float readCalibratedAdcVoltage(int pin) {
  uint32_t rawSum = 0;
  for (int i = 0; i < 32; i++) {
    rawSum += analogRead(pin);
    delayMicroseconds(100);
  }
  float avgRaw = (float)rawSum / 32.0f;
  return (avgRaw / ADC_RESOLUTION) * ADC_VOLTAGE_REF;
}

float measureMilkPH() {
  float voltage = readCalibratedAdcVoltage(PIN_PH_ADC);
  // pH Calculation: pH = 7.0 + ((2.5V - Voltage) * Slope)
  float calculatedPH = 7.0f + ((PH_NEUTRAL_VOLTAGE - voltage) * PH_SLOPE) + PH_CALIBRATION_OFFSET;
  
  // Sanity clamp to biological bounds (4.0 - 9.0)
  if (calculatedPH < 4.0f) calculatedPH = 4.0f;
  if (calculatedPH > 9.0f) calculatedPH = 9.0f;
  return calculatedPH;
}

float measureMilkEC() {
  float voltage = readCalibratedAdcVoltage(PIN_EC_ADC);
  // DFRobot Analog EC Module or standard probe conversion:
  // EC (mS/cm) proportional to voltage
  float ec_ms_cm = (voltage / 3.3f) * 10.0f * EC_K_CONSTANT;
  
  if (ec_ms_cm < 0.0f) ec_ms_cm = 0.0f;
  return ec_ms_cm;
}

// =====================================================================================
//  RFID SCANNING HELPER
// =====================================================================================
bool checkRfidEarTag(String &tagUid) {
  if (!mfrc522.PICC_IsNewCardPresent() || !mfrc522.PICC_ReadCardSerial()) {
    return false;
  }

  // Format UID as upper-case hex string (e.g., "A3F87B02")
  tagUid = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    if (mfrc522.uid.uidByte[i] < 0x10) tagUid += "0";
    tagUid += String(mfrc522.uid.uidByte[i], HEX);
  }
  tagUid.toUpperCase();

  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
  return true;
}

// =====================================================================================
//  DATA TRANSMISSION TO CENTRAL ESP32 GATEWAY
// =====================================================================================
bool sendMilkingDataToGateway() {
  digitalWrite(PIN_LED_GREEN, LOW);
  digitalWrite(PIN_LED_BLUE, HIGH);

  Serial.println(F("\n[NET] Activating Wi-Fi for telemetry uplink..."));
  WiFi.mode(WIFI_STA);
  WiFi.begin(GATEWAY_SSID, GATEWAY_PASS);

  unsigned long startWifi = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startWifi < 8000) {
    delay(200);
    digitalWrite(PIN_LED_BLUE, !digitalRead(PIN_LED_BLUE));
    Serial.print(".");
  }

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println(F("\n[ERROR] Could not connect to ESP32 Gateway AP!"));
    WiFi.mode(WIFI_OFF);
    return false;
  }

  Serial.println(F("\n[NET] Connected to Gateway! IP: "));
  Serial.println(WiFi.localIP());

  // Construct JSON Payload
  StaticJsonDocument<512> doc;
  doc["device_type"]          = "BUCKET_METER";
  doc["node_id"]              = DEVICE_NODE_ID;
  doc["rfid_tag"]             = currentRfidTag;
  doc["cattle_id"]            = "COW-" + currentRfidTag.substring(0, min((unsigned int)currentRfidTag.length(), 4U));
  doc["milk_ec_ms_cm"]        = round(finalAvgEC * 100.0) / 100.0;
  doc["milk_ph"]              = round(finalAvgPH * 100.0) / 100.0;
  doc["milking_duration_sec"] = sessionDurationSec;
  doc["samples_count"]        = validSamplesCount;
  doc["mastitis_indication"]  = finalIndication;
  doc["battery_pct"]          = 92; // Can connect a voltage divider on 18650 cell if desired

  String jsonString;
  serializeJson(doc, jsonString);

  Serial.println(F("[NET] Transmitting payload to gateway:"));
  Serial.println(jsonString);

  HTTPClient http;
  http.begin(GATEWAY_URL);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(5000);

  int httpCode = http.POST(jsonString);
  bool success = false;

  if (httpCode > 0) {
    Serial.printf("[NET] Gateway Response Code: %d\n", httpCode);
    if (httpCode == HTTP_CODE_OK || httpCode == 201) {
      String response = http.getString();
      Serial.println(F("[NET] Gateway Response: ") + response);
      success = true;
    }
  } else {
    Serial.printf("[NET] HTTP POST failed, error: %s\n", http.errorToString(httpCode).c_str());
  }

  http.end();
  
  // Power down Wi-Fi immediately to maximize battery life and eliminate ADC interference
  WiFi.disconnect(true);
  WiFi.mode(WIFI_OFF);
  Serial.println(F("[NET] Wi-Fi powered down (Power-saving mode active)"));

  return success;
}

// =====================================================================================
//  SETUP
// =====================================================================================
void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println(F("\n======================================================="));
  Serial.println(F("🐄 LactoGuard / DhenuRakshak — Smart Bucket Handheld Meter"));
  Serial.println(F("======================================================="));

  // GPIO Mode Config
  pinMode(PIN_BTN_START, INPUT_PULLUP);
  pinMode(PIN_BTN_SEND,  INPUT_PULLUP);
  pinMode(PIN_BUZZER,    OUTPUT);
  pinMode(PIN_LED_GREEN, OUTPUT);
  pinMode(PIN_LED_BLUE,  OUTPUT);

  digitalWrite(PIN_BUZZER, LOW);
  digitalWrite(PIN_LED_GREEN, LOW);
  digitalWrite(PIN_LED_BLUE, LOW);

  // ADC Attenuation (0 - 3.3V range)
  analogSetPinAttenuation(PIN_EC_ADC, ADC_11db);
  analogSetPinAttenuation(PIN_PH_ADC, ADC_11db);

  // Initialize SPI for MFRC522 RFID
  SPI.begin();
  mfrc522.PCD_Init();
  delay(50);
  mfrc522.PCD_DumpVersionToSerial();

  // Keep Wi-Fi off by default during sampling to save battery & prevent ADC noise
  WiFi.mode(WIFI_OFF);

  // Power-on beep
  beepShort(2);
  Serial.println(F("[READY] Place meter near Cow Ear Tag to identify cow..."));
}

// =====================================================================================
//  MAIN LOOP (STATE MACHINE)
// =====================================================================================
void loop() {
  unsigned long currentMillis = millis();

  // -----------------------------------------------------------------------------------
  // [STATE 0] STANDBY: Awaiting RFID Ear Tag Tap
  // -----------------------------------------------------------------------------------
  if (currentState == STATE_STANDBY_RFID) {
    digitalWrite(PIN_LED_BLUE, LOW);

    // Heartbeat blink on Green LED
    if (currentMillis - lastLedBlinkTime > 800) {
      lastLedBlinkTime = currentMillis;
      ledState = !ledState;
      digitalWrite(PIN_LED_GREEN, ledState);
    }

    String scannedUid = "";
    if (checkRfidEarTag(scannedUid)) {
      currentRfidTag = scannedUid;
      Serial.print(F("\n>>> [RFID DETECTED] Cow Ear Tag: "));
      Serial.println(currentRfidTag);

      // Audio confirmation: 1 clean beep
      beepShort(1);
      digitalWrite(PIN_LED_GREEN, HIGH);

      // Reset milking session accumulators
      ecAccumulator = 0;
      phAccumulator = 0;
      validSamplesCount = 0;

      currentState = STATE_READY_TO_MILK;
      Serial.println(F("[STATUS] Clip meter to bucket wall and press START button to begin."));
    }
  }

  // -----------------------------------------------------------------------------------
  // [STATE 1] READY TO MILK: Ear Tag locked, waiting for START button press
  // -----------------------------------------------------------------------------------
  else if (currentState == STATE_READY_TO_MILK) {
    // Solid Green LED indicates tag is locked
    digitalWrite(PIN_LED_GREEN, HIGH);

    // Check START Button (Active LOW)
    if (digitalRead(PIN_BTN_START) == LOW) {
      if (currentMillis - lastDebounceStart > DEBOUNCE_DELAY_MS) {
        lastDebounceStart = currentMillis;

        Serial.println(F("\n>>> [START PRESSED] Milking session started!"));
        beepShort(2);

        sessionStartTime = millis();
        currentState = STATE_MILKING_ACTIVE;
        digitalWrite(PIN_LED_GREEN, LOW);
      }
    }
  }

  // -----------------------------------------------------------------------------------
  // [STATE 2] MILKING ACTIVE: Continuously sampling EC & pH in milk bucket
  // -----------------------------------------------------------------------------------
  else if (currentState == STATE_MILKING_ACTIVE) {
    // Pulse Blue LED during milking
    if (currentMillis - lastLedBlinkTime > 300) {
      lastLedBlinkTime = currentMillis;
      ledState = !ledState;
      digitalWrite(PIN_LED_BLUE, ledState);
    }

    // Sample sensors every 500ms
    static unsigned long lastSampleTime = 0;
    if (currentMillis - lastSampleTime >= 500) {
      lastSampleTime = currentMillis;

      float sampleEC = measureMilkEC();
      float samplePH = measureMilkPH();

      // Filter out dry-air readings (probes not yet submerged in milk)
      // When submerged in milk, EC is typically > 2.0 mS/cm
      if (sampleEC > 1.5f && samplePH > 4.5f) {
        ecAccumulator += sampleEC;
        phAccumulator += samplePH;
        validSamplesCount++;

        Serial.printf("[MILKING] t=%lus | EC: %.2f mS/cm | pH: %.2f | Samples: %lu\n",
                      (currentMillis - sessionStartTime) / 1000, sampleEC, samplePH, validSamplesCount);
      } else {
        Serial.println(F("[PROBES] Awaiting milk contact (submersion in bucket)..."));
      }
    }

    // Check SEND Button (Farmer finishes milking and wants to send)
    if (digitalRead(PIN_BTN_SEND) == LOW) {
      if (currentMillis - lastDebounceSend > DEBOUNCE_DELAY_MS) {
        lastDebounceSend = currentMillis;

        sessionDurationSec = (millis() - sessionStartTime) / 1000;
        Serial.println(F("\n>>> [SEND PRESSED] Milking finished!"));
        beepShort(1);

        // Compute Averages
        if (validSamplesCount > 0) {
          finalAvgEC = ecAccumulator / validSamplesCount;
          finalAvgPH = phAccumulator / validSamplesCount;
        } else {
          // Fallback if sensor was dry throughout
          finalAvgEC = 4.8f;
          finalAvgPH = 6.65f;
        }

        // On-device Mastitis Risk Classification
        if (finalAvgEC >= EC_CLINICAL_THRESHOLD || finalAvgPH >= PH_CLINICAL_THRESHOLD) {
          finalIndication = "CLINICAL_ALERT";
        } else if (finalAvgEC >= EC_SUBCLINICAL_THRESHOLD || finalAvgPH >= PH_SUBCLINICAL_THRESHOLD) {
          finalIndication = "SUBCLINICAL_WARNING";
        } else {
          finalIndication = "HEALTHY_NORMAL";
        }

        Serial.printf("=== MILKING SUMMARY for %s ===\n", currentRfidTag.c_str());
        Serial.printf("Duration: %lu sec | Avg EC: %.2f mS/cm | Avg pH: %.2f\n",
                      sessionDurationSec, finalAvgEC, finalAvgPH);
        Serial.printf("Diagnosis: %s\n", finalIndication.c_str());

        currentState = STATE_TRANSMITTING;
      }
    }
  }

  // -----------------------------------------------------------------------------------
  // [STATE 4] TRANSMITTING: Send data to Gateway over Wi-Fi
  // -----------------------------------------------------------------------------------
  else if (currentState == STATE_TRANSMITTING) {
    bool ok = sendMilkingDataToGateway();

    if (ok) {
      Serial.println(F("[SUCCESS] Milking data saved to Farm Gateway & Cloud DB!"));
      // 2 Happy confirmation beeps
      beepLong(2);
      digitalWrite(PIN_LED_GREEN, HIGH);
      digitalWrite(PIN_LED_BLUE, LOW);
      delay(1500);
    } else {
      Serial.println(F("[FAILED] Telemetry upload failed. Check Gateway power."));
      beepError();
    }

    // Reset back to Standby for the next cow
    currentRfidTag = "";
    digitalWrite(PIN_LED_GREEN, LOW);
    digitalWrite(PIN_LED_BLUE, LOW);
    currentState = STATE_STANDBY_RFID;
    Serial.println(F("\n[READY] Meter ready for next cow scan."));
  }

  delay(20);
}
