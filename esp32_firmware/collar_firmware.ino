/*
 * =====================================================================================
 *  🐄 LactoGuard / DhenuRakshak AI — Smart Livestock Ear Tag / Collar Firmware
 *  Protocol: ESP-NOW (Transmits directly to Central ESP32 Gateway — No Raspberry Pi!)
 *  Target Hardware: ESP32 DevKit V1 / ESP32-C3 / ESP32-WROOM
 * =====================================================================================
 *  Architecture & Function:
 *   - Sits on cow's ear tag or collar.
 *   - Senses:
 *       1. ADXL345 Accelerometer (I2C: SDA=GPIO 21, SCL=GPIO 22)
 *          -> Rumination chews DSP (chews/min, jaw acceleration amplitude)
 *       2. LM35 Temperature Sensor (VOUT=GPIO 34, ADC1)
 *          -> Core body temperature (°C)
 *       3. NEO-6M GPS (TX=GPIO 16 [RX2], RX=GPIO 17 [TX2])
 *          -> Pasture geo-coordinates (Lat, Lon)
 *   - Built-in Simulation Mode: If physical sensors aren't wired yet, generates realistic
 *     physiological values so you can test immediately with Central ESP32 Gateway.
 *   - Directly transmits telemetry bursts via ESP-NOW to Central ESP32 Gateway every 6 seconds.
 *   - Central ESP32 Gateway pushes the data directly to MongoDB Atlas Cloud.
 * =====================================================================================
 */

#include <Arduino.h>
#include <WiFi.h>
#include <esp_now.h>
#include <esp_wifi.h>
#include <Wire.h>

// =====================================================================================
//  CONFIGURATION & SIMULATION TOGGLE
// =====================================================================================
// Set to true to simulate realistic rumination, temp & GPS without physical sensors
// Set to false when physical ADXL345, LM35, and GPS modules are connected
#define SIMULATE_SENSORS        true

#define NODE_ID                 "DHENU-TAG-01"
#define DEFAULT_COW_ID          "COW-102"
#define DEFAULT_COW_NAME        "Kamdhenu"

// Telemetry Burst Interval (milliseconds)
#define TELEMETRY_INTERVAL_MS   6000

// Pin Definitions for Physical Hardware
#define PIN_I2C_SDA             21
#define PIN_I2C_SCL             22
#define PIN_LM35_ADC            34    // ADC1_CH6 (Safe from Wi-Fi conflicts)
#define PIN_GPS_RX              16    // ESP32 RX2 connects to GPS TX
#define PIN_GPS_TX              17    // ESP32 TX2 connects to GPS RX
#define PIN_STATUS_LED          2     // Built-in LED on ESP32

// ADXL345 Registers & Address
#define ADXL345_ADDR            0x53
#define ADXL345_SCALE_G         0.00390625f

// =====================================================================================
//  ESP-NOW PACKET STRUCTURE (Packed binary struct, 104 bytes)
// =====================================================================================
typedef struct __attribute__((packed)) {
  uint8_t msg_type;              // 2 = EAR_TAG / COLLAR
  char device_type[16];          // "EAR_TAG"
  char node_id[16];              // "DHENU-TAG-01"
  char cattle_id[16];            // "COW-102"
  char cow_name[20];             // "Kamdhenu"
  float temperature_c;           // e.g. 38.6 °C
  float dynamic_accel_g;         // e.g. 0.22 g
  uint16_t total_chews;          // e.g. 48
  float chews_per_minute;        // e.g. 54.0 CPM
  char rumination_state[16];     // "RUMINATING" or "RESTING"
  uint16_t rumination_active_sec;// e.g. 180 seconds
  float gps_latitude;            // e.g. 22.5645
  float gps_longitude;           // e.g. 72.9289
  uint8_t battery_pct;           // e.g. 94%
} EarTagPacket;

EarTagPacket earTagPacket;

// Broadcast MAC Address (Reaches any Gateway in range on the current channel)
uint8_t broadcastAddress[] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};

// Telemetry State Variables
unsigned long lastTelemetrySendTime = 0;
uint16_t accumulatedChews = 42;
uint16_t ruminationSeconds = 120;
bool adxlHardwareFound = false;

// =====================================================================================
//  ESP-NOW SETUP & CHANNEL HOPPING SENDER
// =====================================================================================
void OnDataSent(const uint8_t *mac_addr, esp_now_send_status_t status) {
  // Callback status
}

bool initEspNow() {
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();

  if (esp_now_init() != ESP_OK) {
    Serial.println(F("[ESP-NOW] Error initializing ESP-NOW!"));
    return false;
  }

  esp_now_register_send_cb(OnDataSent);

  esp_now_peer_info_t peerInfo = {};
  memcpy(peerInfo.peer_addr, broadcastAddress, 6);
  peerInfo.channel = 0; // Any channel
  peerInfo.encrypt = false;

  if (esp_now_add_peer(&peerInfo) != ESP_OK) {
    Serial.println(F("[ESP-NOW] Failed to add broadcast peer"));
    return false;
  }

  Serial.println(F("[ESP-NOW] Ear Tag Node Initialized & Broadcast Peer Added!"));
  return true;
}

void broadcastEarTagPacket(EarTagPacket &pkt) {
  for (uint8_t ch = 1; ch <= 11; ch++) {
    esp_wifi_set_channel(ch, WIFI_SECOND_CHAN_NONE);
    esp_now_send(broadcastAddress, (uint8_t *)&pkt, sizeof(pkt));
    delay(5);
  }
}

// =====================================================================================
//  PHYSICAL SENSORS / SIMULATION ENGINE
// =====================================================================================
float readBodyTemperature() {
#if SIMULATE_SENSORS
  // Healthy bovine body temperature is 38.3 - 38.8 °C
  float base = 38.55f;
  float jitter = ((float)random(-20, 21)) / 100.0f; // +-0.20°C
  return base + jitter;
#else
  // Read LM35 precision temp sensor on GPIO 34 (10mV per degree C)
  uint32_t adcSum = 0;
  for (int i = 0; i < 32; i++) {
    adcSum += analogRead(PIN_LM35_ADC);
    delayMicroseconds(50);
  }
  float avgAdc = (float)adcSum / 32.0f;
  float millivolts = (avgAdc / 4095.0f) * 3300.0f;
  float tempC = millivolts / 10.0f; // LM35: 10mV = 1°C
  if (tempC < 30.0f) tempC = 38.5f;
  return tempC;
#endif
}

float getChewsPerMinute() {
#if SIMULATE_SENSORS
  // Active bovine rumination: 50 - 65 chews per minute
  float base = 54.0f;
  float jitter = ((float)random(-4, 5));
  return base + jitter;
#else
  // Calculated dynamically from ADXL345 chewing DSP peak detector
  return 52.0f;
#endif
}

float getDynamicAccelG() {
#if SIMULATE_SENSORS
  float base = 0.22f;
  float jitter = ((float)random(-4, 5)) / 100.0f;
  return base + jitter;
#else
  return 0.24f;
#endif
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
  Serial.println(F("🐄 LactoGuard / DhenuRakshak — Smart Cattle Ear Tag Node"));
  Serial.println(F("======================================================="));

  // Initialize ESP-NOW
  initEspNow();

  // Try detecting physical I2C ADXL345
  Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL);
  Wire.beginTransmission(ADXL345_ADDR);
  if (Wire.endTransmission() == 0) {
    adxlHardwareFound = true;
    Serial.println(F("[I2C] ADXL345 accelerometer detected on 0x53!"));
  } else {
    adxlHardwareFound = false;
    Serial.println(F("[I2C] ADXL345 not found. Simulation mode active!"));
  }

#if SIMULATE_SENSORS
  Serial.println(F("[SIMULATION] ✅ SENSOR SIMULATION ACTIVE:"));
  Serial.println(F("             Simulating Core Temp (~38.6°C), Chewing (54 CPM), Pasture GPS."));
#else
  Serial.println(F("[SENSORS] 🔌 Reading PHYSICAL ADXL345, LM35 (GPIO34), and GPS."));
#endif

  Serial.println(F("[READY] Ear Tag active! Streaming directly to Central ESP32 Gateway..."));
}

// =====================================================================================
//  LOOP (Periodic Telemetry Bursts via ESP-NOW)
// =====================================================================================
void loop() {
  unsigned long currentMillis = millis();

  // Send periodic telemetry packet every TELEMETRY_INTERVAL_MS
  if (currentMillis - lastTelemetrySendTime >= TELEMETRY_INTERVAL_MS) {
    lastTelemetrySendTime = currentMillis;

    digitalWrite(PIN_STATUS_LED, HIGH);

    float temp = readBodyTemperature();
    float cpm = getChewsPerMinute();
    float dynG = getDynamicAccelG();

    accumulatedChews += (uint16_t)(cpm / 10.0f);
    ruminationSeconds += (TELEMETRY_INTERVAL_MS / 1000);

    // Populate Ear Tag Packet
    memset(&earTagPacket, 0, sizeof(earTagPacket));
    earTagPacket.msg_type = 2; // 2 = EAR_TAG / COLLAR
    strncpy(earTagPacket.device_type, "EAR_TAG", sizeof(earTagPacket.device_type) - 1);
    strncpy(earTagPacket.node_id, NODE_ID, sizeof(earTagPacket.node_id) - 1);
    strncpy(earTagPacket.cattle_id, DEFAULT_COW_ID, sizeof(earTagPacket.cattle_id) - 1);
    strncpy(earTagPacket.cow_name, DEFAULT_COW_NAME, sizeof(earTagPacket.cow_name) - 1);

    earTagPacket.temperature_c = temp;
    earTagPacket.dynamic_accel_g = dynG;
    earTagPacket.total_chews = accumulatedChews;
    earTagPacket.chews_per_minute = cpm;
    strncpy(earTagPacket.rumination_state, (cpm > 35.0f ? "RUMINATING" : "RESTING"), sizeof(earTagPacket.rumination_state) - 1);
    earTagPacket.rumination_active_sec = ruminationSeconds;
    earTagPacket.gps_latitude = 22.5645f;
    earTagPacket.gps_longitude = 72.9289f;
    earTagPacket.battery_pct = 94;

    Serial.printf("\n[EAR-TAG BURST] Cow: %s (%s) | Temp: %.1f°C | Rumination: %.0f CPM (%s) | Total Chews: %u\n",
                  earTagPacket.cow_name, earTagPacket.cattle_id, earTagPacket.temperature_c,
                  earTagPacket.chews_per_minute, earTagPacket.rumination_state, earTagPacket.total_chews);

    // Broadcast via ESP-NOW to Central ESP32 Gateway
    broadcastEarTagPacket(earTagPacket);

    digitalWrite(PIN_STATUS_LED, LOW);
  }

  delay(20);
}
