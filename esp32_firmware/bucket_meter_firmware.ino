/*
 * =====================================================================================
 *  🐄 LactoGuard AI — Smart Milking Bucket Handheld Meter Firmware
 *  Protocol: ESP-NOW (Ultra low-latency, connectionless, direct to Central Gateway)
 *  Target Hardware: ESP32 DevKit V1 (30/38 pin)
 * =====================================================================================
 *  Features:
 *   - ESP-NOW direct wireless transmission (< 5ms transmit time, NO router needed!)
 *   - Sensor Simulation Mode (Realistic biological random EC & pH values when probes are not connected)
 *   - MFRC522 RFID reader (with simulated fallback if RFID reader is not yet wired)
 *   - START & SEND Push Button control
 *   - Audio-visual feedback via Buzzer & LEDs
 * =====================================================================================
 *  Pin Connections:
 *   1. START Button: GPIO 13 (to GND, internal pull-up)
 *   2. SEND Button:  GPIO 14 (to GND, internal pull-up)
 *   3. Buzzer:       GPIO 15 (Active Buzzer to GND)
 *   4. Green LED:    GPIO 2  (Built-in / External with 330Ω resistor)
 *   5. Blue/Red LED: GPIO 4  (External with 330Ω resistor)
 *   6. MFRC522 RFID (Optional if physical sensor wired):
 *      - 3.3V -> ESP32 3V3 (⚠️ NEVER 5V!) | GND -> GND | RST -> GPIO 22
 *      - SDA(SS) -> GPIO 5 | MOSI -> GPIO 23 | MISO -> GPIO 19 | SCK -> GPIO 18
 *   7. Physical EC & pH Probes (When connected later):
 *      - EC Analog -> GPIO 34 (ADC1_CH6)
 *      - pH Analog -> GPIO 35 (ADC1_CH7)
 * =====================================================================================
 */

#include <Arduino.h>
#include <WiFi.h>
#include <esp_now.h>
#include <esp_wifi.h>
#include <SPI.h>
#include <MFRC522.h>
#include <esp_idf_version.h>

// =====================================================================================
//  CONFIGURATION & SENSOR SIMULATION TOGGLE
// =====================================================================================
// Set to true to simulate realistic milk EC & pH without physical sensors
// Set to false when your physical analog EC and pH probes are plugged into GPIO 34 & 35
#define SIMULATE_SENSORS        true

#define DEVICE_NODE_ID          "DHENU-METER-01"
#define DEFAULT_SIMULATED_RFID  "A3F87B02"

// Pin Definitions
#define PIN_RC522_SS            5
#define PIN_RC522_RST           22
#define PIN_BTN_START           13
#define PIN_BTN_SEND            14
#define PIN_EC_ADC              34
#define PIN_PH_ADC              35
#define PIN_BUZZER              15
#define PIN_LED_GREEN           2     // Built-in LED on ESP32
#define PIN_LED_BLUE            4

// =====================================================================================
//  ESP-NOW PACKET STRUCTURE (Packed binary struct, 101 bytes)
// =====================================================================================
typedef struct __attribute__((packed)) {
  uint8_t msg_type;              // 1 = BUCKET_METER, 2 = EAR_TAG
  char device_type[16];          // "BUCKET_METER"
  char node_id[16];              // "DHENU-METER-01"
  char rfid_tag[16];             // e.g. "A3F87B02"
  char cattle_id[16];            // "COW-A3F8"
  float milk_ec_ms_cm;           // e.g. 4.85 mS/cm
  float milk_ph;                 // e.g. 6.64
  uint32_t milking_duration_sec; // e.g. 315 seconds
  uint32_t samples_count;        // e.g. 450
  char mastitis_indication[24];  // "HEALTHY_NORMAL", "SUBCLINICAL_WARNING", "CLINICAL_ALERT"
  uint8_t battery_pct;           // e.g. 95%
} MilkingPacket;

MilkingPacket outgoingPacket;

// Broadcast MAC Address (FF:FF:FF:FF:FF:FF reaches ANY Gateway in range)
uint8_t broadcastAddress[] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};

// Hardware RFID Instance
MFRC522 mfrc522(PIN_RC522_SS, PIN_RC522_RST);
bool rfidHardwareAvailable = false;

// =====================================================================================
//  STATE MACHINE ENUM
// =====================================================================================
enum MeterState {
  STATE_STANDBY_RFID = 0,   // Waiting for RFID ear tag scan (or button tap)
  STATE_READY_TO_MILK,      // Ear tag locked, ready for START button
  STATE_MILKING_ACTIVE,     // Sampling milk EC and pH in bucket
  STATE_TRANSMITTING        // Sending via ESP-NOW to Central Gateway
};

MeterState currentState = STATE_STANDBY_RFID;

// Session Tracking
String currentRfidTag = "";
unsigned long sessionStartTime = 0;
unsigned long sessionDurationSec = 0;

// Sensor Accumulators
double ecAccumulator = 0;
double phAccumulator = 0;
unsigned long validSamplesCount = 0;

float finalAvgEC = 0.0f;
float finalAvgPH = 0.0f;
String finalIndication = "HEALTHY_NORMAL";

// Button Debounce
unsigned long lastDebounceStart = 0;
unsigned long lastDebounceSend = 0;
const unsigned long DEBOUNCE_DELAY_MS = 250;

// LED Blink Timer
unsigned long lastLedBlinkTime = 0;
bool ledState = false;
volatile bool espNowSendSuccess = false;

// =====================================================================================
//  BUZZER & FEEDBACK HELPERS
// =====================================================================================
void beep(int count, int onDuration = 80, int offDuration = 60) {
  for (int i = 0; i < count; i++) {
    digitalWrite(PIN_BUZZER, HIGH);
    delay(onDuration);
    digitalWrite(PIN_BUZZER, LOW);
    if (i < count - 1) delay(offDuration);
  }
}

// =====================================================================================
//  ESP-NOW TRANSMISSION CALLBACK
// =====================================================================================
#if ESP_IDF_VERSION >= ESP_IDF_VERSION_VAL(5, 0, 0)
// ESP32 Arduino Core 3.0+ (IDF 5.x)
void OnDataSent(const wifi_tx_info_t *tx_info, esp_now_send_status_t status) {
  espNowSendSuccess = (status == ESP_NOW_SEND_SUCCESS);
  Serial.printf("[ESP-NOW] Send Status: %s\n", espNowSendSuccess ? "DELIVERY_SUCCESS" : "NO_ACK_OR_BROADCAST");
}
#else
// ESP32 Arduino Core 2.x (IDF 4.x)
void OnDataSent(const uint8_t *mac_addr, esp_now_send_status_t status) {
  espNowSendSuccess = (status == ESP_NOW_SEND_SUCCESS);
  Serial.printf("[ESP-NOW] Send Status: %s\n", espNowSendSuccess ? "DELIVERY_SUCCESS" : "NO_ACK_OR_BROADCAST");
}
#endif

// Initialize ESP-NOW
bool initEspNow() {
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();

  if (esp_now_init() != ESP_OK) {
    Serial.println(F("[ESP-NOW] Error initializing ESP-NOW!"));
    return false;
  }

  esp_now_register_send_cb(OnDataSent);

  // Register broadcast peer
  esp_now_peer_info_t peerInfo = {};
  memcpy(peerInfo.peer_addr, broadcastAddress, 6);
  peerInfo.channel = 0; // channel 0 = any channel
  peerInfo.encrypt = false;

  if (esp_now_add_peer(&peerInfo) != ESP_OK) {
    Serial.println(F("[ESP-NOW] Failed to add broadcast peer"));
    return false;
  }

  Serial.println(F("[ESP-NOW] Initialized & Broadcast Peer Added!"));
  return true;
}

// Channel-hopping broadcast sender (ensures gateway receives regardless of Wi-Fi channel)
void broadcastMilkingPacket(MilkingPacket &pkt) {
  Serial.println(F("\n[ESP-NOW] Broadcasting milking packet to Central Gateway..."));
  for (uint8_t ch = 1; ch <= 11; ch++) {
    esp_wifi_set_channel(ch, WIFI_SECOND_CHAN_NONE);
    esp_now_send(broadcastAddress, (uint8_t *)&pkt, sizeof(pkt));
    delay(8);
  }
}

// =====================================================================================
//  SENSOR SIMULATION & MEASUREMENT
// =====================================================================================
float getSimulatedOrRealEC() {
#if SIMULATE_SENSORS
  // Realistic bovine milk EC: Normal fresh milk is 4.40 - 5.20 mS/cm
  // Adds slight realistic dynamic fluctuation
  float base = 4.75f;
  float noise = ((float)random(-25, 26)) / 100.0f; // +-0.25 fluctuation
  return base + noise;
#else
  // Read physical probe on GPIO 34
  uint32_t sum = 0;
  for (int i = 0; i < 16; i++) { sum += analogRead(PIN_EC_ADC); delayMicroseconds(50); }
  float v = ((float)sum / 16.0f / 4095.0f) * 3.3f;
  return (v / 3.3f) * 10.0f;
#endif
}

float getSimulatedOrRealPH() {
#if SIMULATE_SENSORS
  // Realistic bovine milk pH: Normal fresh milk is 6.55 - 6.68
  float base = 6.62f;
  float noise = ((float)random(-6, 7)) / 100.0f; // +-0.06 fluctuation
  return base + noise;
#else
  // Read physical probe on GPIO 35
  uint32_t sum = 0;
  for (int i = 0; i < 16; i++) { sum += analogRead(PIN_PH_ADC); delayMicroseconds(50); }
  float v = ((float)sum / 16.0f / 4095.0f) * 3.3f;
  return 7.0f + ((2.50f - v) * -5.70f);
#endif
}

// =====================================================================================
//  RFID DETECTION HELPER
// =====================================================================================
bool checkRfidEarTag(String &tagUid) {
  if (!rfidHardwareAvailable) return false;
  if (!mfrc522.PICC_IsNewCardPresent() || !mfrc522.PICC_ReadCardSerial()) return false;

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
//  SETUP
// =====================================================================================
void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println(F("\n======================================================="));
  Serial.println(F("🐄 LactoGuard — Handheld Bucket Meter (ESP-NOW Mode)"));
  Serial.println(F("======================================================="));

  pinMode(PIN_BTN_START, INPUT_PULLUP);
  pinMode(PIN_BTN_SEND,  INPUT_PULLUP);
  pinMode(PIN_BUZZER,    OUTPUT);
  pinMode(PIN_LED_GREEN, OUTPUT);
  pinMode(PIN_LED_BLUE,  OUTPUT);

  digitalWrite(PIN_BUZZER, LOW);
  digitalWrite(PIN_LED_GREEN, LOW);
  digitalWrite(PIN_LED_BLUE, LOW);

  // Initialize ESP-NOW
  initEspNow();

  // Try initializing physical RFID if wired
  SPI.begin();
  mfrc522.PCD_Init();
  byte v = mfrc522.PCD_ReadRegister(mfrc522.VersionReg);
  if (v == 0x91 || v == 0x92) {
    rfidHardwareAvailable = true;
    Serial.printf("[RFID] MFRC522 detected (v=0x%02X)!\n", v);
  } else {
    rfidHardwareAvailable = false;
    Serial.println(F("[RFID] MFRC522 not detected. Auto-simulation fallback enabled!"));
  }

#if SIMULATE_SENSORS
  Serial.println(F("[SIMULATION] ✅ SENSOR SIMULATION ACTIVE:"));
  Serial.println(F("             Generating realistic milk EC (4.5–5.1 mS/cm) & pH (6.55–6.68)."));
#else
  Serial.println(F("[SENSORS] 🔌 Reading PHYSICAL analog probes on GPIO 34 (EC) and 35 (pH)."));
#endif

  beep(2, 60, 50);
  Serial.println(F("\n[READY] Standby: Tap Ear Tag OR press START to begin milking session."));
}

// =====================================================================================
//  MAIN STATE MACHINE
// =====================================================================================
void loop() {
  unsigned long currentMillis = millis();

  // -----------------------------------------------------------------------------------
  // [STATE 0] STANDBY: Awaiting Cow Ear Tag Scan
  // -----------------------------------------------------------------------------------
  if (currentState == STATE_STANDBY_RFID) {
    digitalWrite(PIN_LED_BLUE, LOW);

    // Heartbeat blink on Green LED
    if (currentMillis - lastLedBlinkTime > 700) {
      lastLedBlinkTime = currentMillis;
      ledState = !ledState;
      digitalWrite(PIN_LED_GREEN, ledState);
    }

    String scannedTag = "";
    bool tagFound = checkRfidEarTag(scannedTag);

    // If tag physically scanned:
    if (tagFound) {
      currentRfidTag = scannedTag;
      Serial.printf("\n>>> [RFID SCANNED] Cow Tag: %s\n", currentRfidTag.c_str());
      beep(1, 120, 0);
      digitalWrite(PIN_LED_GREEN, HIGH);
      currentState = STATE_READY_TO_MILK;
    }

    // FALLBACK / SHORTCUT: If RFID not yet scanned, pressing START auto-assigns simulated RFID!
    if (digitalRead(PIN_BTN_START) == LOW) {
      if (currentMillis - lastDebounceStart > DEBOUNCE_DELAY_MS) {
        lastDebounceStart = currentMillis;
        currentRfidTag = DEFAULT_SIMULATED_RFID;
        Serial.printf("\n>>> [START PRESSED] Auto-assigned RFID: %s\n", currentRfidTag.c_str());
        beep(2, 80, 50);

        sessionStartTime = millis();
        ecAccumulator = 0;
        phAccumulator = 0;
        validSamplesCount = 0;

        currentState = STATE_MILKING_ACTIVE;
        digitalWrite(PIN_LED_GREEN, LOW);
      }
    }
  }

  // -----------------------------------------------------------------------------------
  // [STATE 1] READY TO MILK: Tag locked, waiting for START button press
  // -----------------------------------------------------------------------------------
  else if (currentState == STATE_READY_TO_MILK) {
    digitalWrite(PIN_LED_GREEN, HIGH);

    if (digitalRead(PIN_BTN_START) == LOW) {
      if (currentMillis - lastDebounceStart > DEBOUNCE_DELAY_MS) {
        lastDebounceStart = currentMillis;
        Serial.println(F("\n>>> [START PRESSED] Milking session started in bucket!"));
        beep(2, 80, 50);

        sessionStartTime = millis();
        ecAccumulator = 0;
        phAccumulator = 0;
        validSamplesCount = 0;

        currentState = STATE_MILKING_ACTIVE;
        digitalWrite(PIN_LED_GREEN, LOW);
      }
    }
  }

  // -----------------------------------------------------------------------------------
  // [STATE 2] MILKING ACTIVE: Sampling Milk EC & pH
  // -----------------------------------------------------------------------------------
  else if (currentState == STATE_MILKING_ACTIVE) {
    // Pulse Blue LED during milking
    if (currentMillis - lastLedBlinkTime > 300) {
      lastLedBlinkTime = currentMillis;
      ledState = !ledState;
      digitalWrite(PIN_LED_BLUE, ledState);
    }

    // Sample every 500ms
    static unsigned long lastSampleTime = 0;
    if (currentMillis - lastSampleTime >= 500) {
      lastSampleTime = currentMillis;

      float sampleEC = getSimulatedOrRealEC();
      float samplePH = getSimulatedOrRealPH();

      ecAccumulator += sampleEC;
      phAccumulator += samplePH;
      validSamplesCount++;

      Serial.printf("[MILKING] t=%02lus | Milk EC: %.2f mS/cm | pH: %.2f | Samples: %lu\n",
                    (currentMillis - sessionStartTime) / 1000, sampleEC, samplePH, validSamplesCount);
    }

    // Check SEND Button (Farmer finishes milking)
    if (digitalRead(PIN_BTN_SEND) == LOW) {
      if (currentMillis - lastDebounceSend > DEBOUNCE_DELAY_MS) {
        lastDebounceSend = currentMillis;

        sessionDurationSec = (millis() - sessionStartTime) / 1000;
        if (sessionDurationSec < 1) sessionDurationSec = 1;

        Serial.println(F("\n>>> [SEND PRESSED] Milking finished! Packing data..."));
        beep(1, 100, 0);

        if (validSamplesCount > 0) {
          finalAvgEC = ecAccumulator / validSamplesCount;
          finalAvgPH = phAccumulator / validSamplesCount;
        } else {
          finalAvgEC = 4.82f;
          finalAvgPH = 6.64f;
        }

        // Mastitis screening
        if (finalAvgEC >= 6.5f || finalAvgPH >= 6.95f) {
          finalIndication = "CLINICAL_ALERT";
        } else if (finalAvgEC >= 5.7f || finalAvgPH >= 6.80f) {
          finalIndication = "SUBCLINICAL_WARNING";
        } else {
          finalIndication = "HEALTHY_NORMAL";
        }

        Serial.println(F("-------------------------------------------------------"));
        Serial.printf("Cow RFID: %s | Duration: %lu sec\n", currentRfidTag.c_str(), sessionDurationSec);
        Serial.printf("Average EC: %.2f mS/cm | Average pH: %.2f | Result: %s\n",
                      finalAvgEC, finalAvgPH, finalIndication.c_str());
        Serial.println(F("-------------------------------------------------------"));

        currentState = STATE_TRANSMITTING;
      }
    }
  }

  // -----------------------------------------------------------------------------------
  // [STATE 3] TRANSMITTING: Send via ESP-NOW to Central Gateway
  // -----------------------------------------------------------------------------------
  else if (currentState == STATE_TRANSMITTING) {
    digitalWrite(PIN_LED_BLUE, HIGH);

    // Fill Outgoing ESP-NOW Packet
    memset(&outgoingPacket, 0, sizeof(outgoingPacket));
    outgoingPacket.msg_type = 1; // 1 = BUCKET_METER
    strncpy(outgoingPacket.device_type, "BUCKET_METER", sizeof(outgoingPacket.device_type) - 1);
    strncpy(outgoingPacket.node_id, DEVICE_NODE_ID, sizeof(outgoingPacket.node_id) - 1);
    strncpy(outgoingPacket.rfid_tag, currentRfidTag.c_str(), sizeof(outgoingPacket.rfid_tag) - 1);
    
    String cowId = "COW-" + currentRfidTag.substring(0, min((unsigned int)currentRfidTag.length(), 4U));
    strncpy(outgoingPacket.cattle_id, cowId.c_str(), sizeof(outgoingPacket.cattle_id) - 1);

    outgoingPacket.milk_ec_ms_cm = finalAvgEC;
    outgoingPacket.milk_ph = finalAvgPH;
    outgoingPacket.milking_duration_sec = sessionDurationSec;
    outgoingPacket.samples_count = validSamplesCount;
    strncpy(outgoingPacket.mastitis_indication, finalIndication.c_str(), sizeof(outgoingPacket.mastitis_indication) - 1);
    outgoingPacket.battery_pct = 95;

    // Send packet via ESP-NOW channel hopping
    broadcastMilkingPacket(outgoingPacket);

    // Audio confirmation: 2 victory beeps
    beep(2, 200, 100);
    digitalWrite(PIN_LED_GREEN, HIGH);
    digitalWrite(PIN_LED_BLUE, LOW);
    delay(1000);

    // Reset back to Standby
    currentRfidTag = "";
    digitalWrite(PIN_LED_GREEN, LOW);
    currentState = STATE_STANDBY_RFID;
    Serial.println(F("\n[READY] Meter returned to standby. Ready for next cow!"));
  }

  delay(20);
}
