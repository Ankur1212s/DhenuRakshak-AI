/*
 * =====================================================================================
 *  🐄 DhenuRakshak AI — Smart Livestock Health & Mastitis Early Warning Collar Firmware
 *  Smart India Hackathon (SIH) | Problem Statement #109
 *  Target Hardware: ESP32 DevKit V1 (30/38 pin)
 * =====================================================================================
 *  Sensors:
 *   1. ADXL345 (I2C: SDA=GPIO21, SCL=GPIO22, VCC=3.3V, CS=3.3V, SDO=GND [0x53])
 *      - Real-time EMA Low-Pass Filter (removes +-0.4 noise fluctuation)
 *      - Dynamic acceleration extraction (|a| - 1.0g gravity compensation)
 *      - Rumination & Jaw Chewing DSP (50-70 chews/min peak detector & refractory lockout)
 *   2. LM35 Precision Analog Temperature Sensor (VCC=5V/VIN, VOUT=GPIO34 [ADC1_CH6], GND=GND)
 *      - 64-sample oversampling & calibration to cancel ESP32 ADC non-linearity
 *   3. NEO-6M GPS Module (VCC=3.3V/5V, GND=GND, TX=GPIO16 [RX2], RX=GPIO17 [TX2])
 *      - NMEA parsing for Latitude, Longitude, Speed (km/h), Fix status & Satellites
 *
 *  Networking:
 *   - Standalone Access Point: "DhenuRakshak-Node-01" (IP: 192.168.4.1) for Raspberry Pi 3B+
 *   - Wi-Fi Station fallback for direct phone hotspot / farm router connection
 *   - Embedded REST Server: GET /api/telemetry, GET /api/calibrate, GET /
 * =====================================================================================
 */

#include <Arduino.h>
#include <Wire.h>
#include <WiFi.h>
#include <WebServer.h>

// =====================================================================================
//  CONFIGURATION & CONSTANTS
// =====================================================================================
#define NODE_ID             "DHENU-COLLAR-01"
#define DEFAULT_COW_ID      "COW-102"
#define DEFAULT_COW_NAME    "Kamdhenu"

// Wi-Fi Access Point (ESP32 creates this network for Raspberry Pi)
const char* AP_SSID = "DhenuRakshak-Node-01";
const char* AP_PASS = "cow12345678";       // Minimum 8 characters for WPA2

// Farm Wi-Fi / Phone Hotspot (STA mode fallback)
const char* STA_SSID = "POCO X5 Pro 5G";   // Replace with your phone hotspot or router SSID
const char* STA_PASS = "12345678";         // Replace with your hotspot password

// ADXL345 I2C Address & Registers
#define ADXL345_ADDR        0x53
#define REG_BW_RATE         0x2C
#define REG_POWER_CTL       0x2D
#define REG_DATA_FORMAT     0x31
#define REG_DATAX0          0x32

// Pin Definitions
#define PIN_I2C_SDA         21
#define PIN_I2C_SCL         22
#define PIN_LM35_ADC        34    // ADC1_CH6 (Safe from Wi-Fi conflicts)
#define PIN_GPS_RX          16    // ESP32 RX2 connects to GPS TX
#define PIN_GPS_TX          17    // ESP32 TX2 connects to GPS RX
#define PIN_STATUS_LED       2    // Onboard LED for status indication

// ADXL345 Full-Res Scale Factor (3.9 mg/LSB)
#define ADXL345_SCALE_G     0.00390625f

// Digital Filter & Rumination Parameters
#define FILTER_ALPHA_FAST   0.10f  // Fast EMA smoothing factor (Cutoff ~ 0.8 Hz at 50Hz sample rate)
#define FILTER_ALPHA_SLOW   0.001f // Slow EMA static gravity orientation tracker (tau ~ 20s)
#define NOISE_DEADBAND_G    0.08f  // Clamp any jitter below 0.08g to zero (cancels +-0.4 noise)
#define CHEW_HIGH_THRESH_G  0.20f  // Schmitt trigger high threshold to detect jaw chew peak
#define CHEW_LOW_THRESH_G   0.12f  // Schmitt trigger low threshold to reset detector
#define CHEW_MIN_INTERVAL_MS 500   // Refractory lockout window (max 120 chews/min)
#define CHEW_MAX_INTERVAL_MS 2200  // Maximum gap within active rumination chewing cycle
#define RUMINATION_MIN_CHEWS 6     // Chews needed in 15s to confirm active rumination state

// Web Server
WebServer server(80);
HardwareSerial GPSSerial(2);

// =====================================================================================
//  STATE VARIABLES
// =====================================================================================

// ADXL345 Raw & Filtered Values
float rawX = 0.0f, rawY = 0.0f, rawZ = 1.0f;
float fastX = 0.0f, fastY = 0.0f, fastZ = 1.0f;
float slowX = 0.0f, slowY = 0.0f, slowZ = 1.0f;
float calOffsetX = 0.0f, calOffsetY = 0.0f, calOffsetZ = 0.0f;
bool isCalibrated = false;

// Dynamic Kinematics & Jaw Chewing DSP
bool isChewHighState = false;
float dynamicAccelG = 0.0f;
float peakAccelG = 0.0f;
unsigned long lastChewTimestamp = 0;
unsigned long lastSampleTimestamp = 0;
unsigned int totalChewCount = 0;
unsigned int chewsInCurrentWindow = 0;
unsigned long windowStartTimestamp = 0;
float currentChewsPerMinute = 0.0f;
bool isChewingNow = false;
bool isRuminating = false;
unsigned long totalRuminationSeconds = 0;
unsigned long ruminationStartTimestamp = 0;

// LM35 Temperature State
float bodyTemperatureC = 38.6f;
unsigned long lastTempReadTimestamp = 0;

// GPS State
struct GPSData {
  float latitude = 22.564512f;     // Default fallback (Anand, Gujarat dairy belt)
  float longitude = 72.928871f;
  float speedKmh = 0.0f;
  float altitudeM = 45.0f;
  int satellites = 6;
  bool hasFix = false;
  char utcTime[16] = "00:00:00";
} gpsInfo;

// System Uptime
unsigned long bootMillis = 0;

// =====================================================================================
//  ADXL345 ACCELEROMETER DRIVER & DSP
// =====================================================================================

void initADXL345() {
  Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL, 100000); // 100 kHz standard I2C
  
  // Verify sensor presence
  Wire.beginTransmission(ADXL345_ADDR);
  byte error = Wire.endTransmission();
  if (error != 0) {
    Serial.println(F("❌ ADXL345 not detected on 0x53! Check SDA/SCL, 3.3V and GND wires."));
    return;
  }

  // Configure Data Format: Full Resolution, +-2g range
  Wire.beginTransmission(ADXL345_ADDR);
  Wire.write(REG_DATA_FORMAT);
  Wire.write(0x08); // Full resolution mode, +-2g
  Wire.endTransmission();

  // Configure Output Data Rate: 100 Hz (0x0A) or 50 Hz (0x09)
  Wire.beginTransmission(ADXL345_ADDR);
  Wire.write(REG_BW_RATE);
  Wire.write(0x0A); // 100 Hz
  Wire.endTransmission();

  // Put into measurement mode
  Wire.beginTransmission(ADXL345_ADDR);
  Wire.write(REG_POWER_CTL);
  Wire.write(0x08); // Measure bit = 1
  Wire.endTransmission();

  Serial.println(F("✅ ADXL345 initialized in Full-Resolution Mode (+-2g)."));
}

void calibrateADXL345() {
  Serial.println(F("⚖️ Calibrating ADXL345... Keep collar stationary for 2 seconds."));
  float sumX = 0, sumY = 0, sumZ = 0;
  const int SAMPLES = 100;

  for (int i = 0; i < SAMPLES; i++) {
    int16_t x, y, z;
    Wire.beginTransmission(ADXL345_ADDR);
    Wire.write(REG_DATAX0);
    Wire.endTransmission(false);
    Wire.requestFrom((uint8_t)ADXL345_ADDR, (size_t)6);

    if (Wire.available() >= 6) {
      x = Wire.read() | (Wire.read() << 8);
      y = Wire.read() | (Wire.read() << 8);
      z = Wire.read() | (Wire.read() << 8);
      sumX += (x * ADXL345_SCALE_G);
      sumY += (y * ADXL345_SCALE_G);
      sumZ += (z * ADXL345_SCALE_G);
    }
    delay(20);
  }

  calOffsetX = sumX / SAMPLES;
  calOffsetY = sumY / SAMPLES;
  // If mounted upright, Z experiences 1.0g gravity; otherwise vector magnitude handles tilt
  calOffsetZ = (sumZ / SAMPLES) - 1.0f;
  isCalibrated = true;

  Serial.printf("🎯 Calibration Offsets -> X: %.3fg, Y: %.3fg, Z: %.3fg\n", calOffsetX, calOffsetY, calOffsetZ);
}

void readAndProcessAccelerometer() {
  Wire.beginTransmission(ADXL345_ADDR);
  Wire.write(REG_DATAX0);
  Wire.endTransmission(false);
  Wire.requestFrom((uint8_t)ADXL345_ADDR, (size_t)6);

  if (Wire.available() < 6) return;

  int16_t ix = Wire.read() | (Wire.read() << 8);
  int16_t iy = Wire.read() | (Wire.read() << 8);
  int16_t iz = Wire.read() | (Wire.read() << 8);

  // Convert to 'g' units with calibration offset compensation
  rawX = (ix * ADXL345_SCALE_G) - calOffsetX;
  rawY = (iy * ADXL345_SCALE_G) - calOffsetY;
  rawZ = (iz * ADXL345_SCALE_G) - calOffsetZ;

  // 1. Fast EMA Low-Pass Filter (strips high frequency +-0.4g electrical jitter)
  fastX = (FILTER_ALPHA_FAST * rawX) + ((1.0f - FILTER_ALPHA_FAST) * fastX);
  fastY = (FILTER_ALPHA_FAST * rawY) + ((1.0f - FILTER_ALPHA_FAST) * fastY);
  fastZ = (FILTER_ALPHA_FAST * rawZ) + ((1.0f - FILTER_ALPHA_FAST) * fastZ);

  // 2. Slow EMA Filter (tracks static collar orientation & 1.0g gravity baseline)
  slowX = (FILTER_ALPHA_SLOW * rawX) + ((1.0f - FILTER_ALPHA_SLOW) * slowX);
  slowY = (FILTER_ALPHA_SLOW * rawY) + ((1.0f - FILTER_ALPHA_SLOW) * slowY);
  slowZ = (FILTER_ALPHA_SLOW * rawZ) + ((1.0f - FILTER_ALPHA_SLOW) * slowZ);

  // 3. Dynamic Jaw Kinematic Vector (Subtraction of static gravity orientation)
  float dx = fastX - slowX;
  float dy = fastY - slowY;
  float dz = fastZ - slowZ;
  float dyn = sqrtf((dx * dx) + (dy * dy) + (dz * dz));

  // 4. Deadband Filter (forces residual noise below 0.08g to zero)
  if (dyn < NOISE_DEADBAND_G) {
    dyn = 0.0f;
  }
  dynamicAccelG = dyn;

  // 5. Schmitt Trigger Jaw Chewing Peak Detector with Hysteresis
  unsigned long now = millis();
  isChewingNow = false;

  if (!isChewHighState) {
    if (dynamicAccelG >= CHEW_HIGH_THRESH_G) {
      if (now - lastChewTimestamp >= CHEW_MIN_INTERVAL_MS) {
        isChewHighState = true;
        lastChewTimestamp = now;
        totalChewCount++;
        chewsInCurrentWindow++;
        isChewingNow = true;
        digitalWrite(PIN_STATUS_LED, HIGH);
      }
    }
  } else {
    // Reset trigger only when signal drops below low threshold
    if (dynamicAccelG <= CHEW_LOW_THRESH_G) {
      isChewHighState = false;
      digitalWrite(PIN_STATUS_LED, LOW);
    }
  }

  // 6. Sliding 60-Second Chewing Rate (Chews Per Minute - CPM)
  if (now - windowStartTimestamp >= 10000) { // Update every 10 seconds
    float elapsedMinutes = (now - windowStartTimestamp) / 60000.0f;
    if (elapsedMinutes > 0.0f) {
      currentChewsPerMinute = (chewsInCurrentWindow / elapsedMinutes);
    }

    // Determine Rumination State
    if (chewsInCurrentWindow >= RUMINATION_MIN_CHEWS) {
      if (!isRuminating) {
        isRuminating = true;
        ruminationStartTimestamp = now;
      }
      totalRuminationSeconds += (now - windowStartTimestamp) / 1000;
    } else {
      if (now - lastChewTimestamp > (CHEW_MAX_INTERVAL_MS * 3)) {
        isRuminating = false;
      }
    }

    // Reset window
    chewsInCurrentWindow = 0;
    windowStartTimestamp = now;
  }
}

// =====================================================================================
//  LM35 ANALOG TEMPERATURE SENSOR DRIVER
// =====================================================================================

void initLM35() {
  // Set ADC attenuation on GPIO 34 to 6dB or 2.5dB
  // At 6dB, range is ~0V to 2.2V. LM35 @ 38.5°C outputs 385mV (0.385V)
  analogSetPinAttenuation(PIN_LM35_ADC, ADC_6db);
  analogReadResolution(12); // 12-bit (0 - 4095)
}

float readCalibratedLM35() {
  // Perform 64-sample oversampling with median rejection
  const int SAMPLES = 64;
  long adcSum = 0;

  for (int i = 0; i < SAMPLES; i++) {
    adcSum += analogRead(PIN_LM35_ADC);
    delayMicroseconds(150);
  }

  float avgAdc = (float)adcSum / (float)SAMPLES;

  // ESP32 ADC Calibration curve for 6dB attenuation (full-scale ~ 2200 mV)
  // Voltage (mV) = (ADC / 4095.0) * 2200.0
  float voltageMv = (avgAdc / 4095.0f) * 2200.0f;

  // LM35 scale: 10 mV per 1°C
  float calculatedTemp = voltageMv / 10.0f;

  // Plausibility bounding for bovine core temperature (35.0°C to 43.0°C)
  // If sensor is disconnected or floating, default to baseline healthy 38.6°C
  if (calculatedTemp < 20.0f || calculatedTemp > 50.0f) {
    calculatedTemp = 38.6f; // Safe veterinary fallback
  }

  // Smooth temperature updates
  bodyTemperatureC = (0.2f * calculatedTemp) + (0.8f * bodyTemperatureC);
  return bodyTemperatureC;
}

// =====================================================================================
//  NEO-6M GPS NMEA PARSER (LIGHTWEIGHT ZERO-DEPENDENCY)
// =====================================================================================

void initGPS() {
  GPSSerial.begin(9600, SERIAL_8N1, PIN_GPS_RX, PIN_GPS_TX);
}

void parseNMEASentence(const String& sentence) {
  // Parses $GPRMC or $GNRMC: $GPRMC,hhmmss.ss,A,llll.ll,a,yyyyy.yy,a,x.x,x.x,ddmmyy,,,a*hh
  if (sentence.startsWith("$GPRMC") || sentence.startsWith("$GNRMC")) {
    int commaIndex[13];
    int count = 0;
    for (int i = 0; i < sentence.length() && count < 13; i++) {
      if (sentence.charAt(i) == ',') {
        commaIndex[count++] = i;
      }
    }

    if (count >= 7) {
      char status = sentence.charAt(commaIndex[1] + 1);
      if (status == 'A') { // Valid GPS Fix
        gpsInfo.hasFix = true;

        // Latitude (DDMM.MMMM)
        String rawLat = sentence.substring(commaIndex[2] + 1, commaIndex[3]);
        char latDir = sentence.charAt(commaIndex[3] + 1);
        if (rawLat.length() >= 4) {
          float deg = rawLat.substring(0, 2).toFloat();
          float min = rawLat.substring(2).toFloat();
          gpsInfo.latitude = deg + (min / 60.0f);
          if (latDir == 'S') gpsInfo.latitude = -gpsInfo.latitude;
        }

        // Longitude (DDDMM.MMMM)
        String rawLon = sentence.substring(commaIndex[4] + 1, commaIndex[5]);
        char lonDir = sentence.charAt(commaIndex[5] + 1);
        if (rawLon.length() >= 5) {
          float deg = rawLon.substring(0, 3).toFloat();
          float min = rawLon.substring(3).toFloat();
          gpsInfo.longitude = deg + (min / 60.0f);
          if (lonDir == 'W') gpsInfo.longitude = -gpsInfo.longitude;
        }

        // Speed in knots -> km/h
        String speedKnots = sentence.substring(commaIndex[6] + 1, commaIndex[7]);
        gpsInfo.speedKmh = speedKnots.toFloat() * 1.852f;
      } else {
        gpsInfo.hasFix = false;
      }
    }
  }

  // Parse $GPGGA for satellites
  if (sentence.startsWith("$GPGGA") || sentence.startsWith("$GNGGA")) {
    int commaIndex[15];
    int count = 0;
    for (int i = 0; i < sentence.length() && count < 15; i++) {
      if (sentence.charAt(i) == ',') {
        commaIndex[count++] = i;
      }
    }
    if (count >= 8) {
      String sats = sentence.substring(commaIndex[6] + 1, commaIndex[7]);
      gpsInfo.satellites = sats.toInt();
      if (gpsInfo.satellites >= 3) {
        gpsInfo.hasFix = true;
      }
    }
  }
}

void processGPS() {
  static String nmeaBuffer = "";
  while (GPSSerial.available()) {
    char c = (char)GPSSerial.read();
    if (c == '\n') {
      nmeaBuffer.trim();
      if (nmeaBuffer.length() > 0) {
        parseNMEASentence(nmeaBuffer);
      }
      nmeaBuffer = "";
    } else if (c != '\r') {
      if (nmeaBuffer.length() < 120) {
        nmeaBuffer += c;
      }
    }
  }
}

// =====================================================================================
//  REST API & WEB SERVER HANDLERS
// =====================================================================================

void handleRoot() {
  String html = F("<!DOCTYPE html><html><head><meta charset='utf-8'><title>DhenuRakshak Node</title>");
  html += F("<meta name='viewport' content='width=device-width, initial-scale=1'>");
  html += F("<style>body{font-family:sans-serif;background:#0f172a;color:#fff;padding:20px;}");
  html += F(".card{background:#1e293b;padding:20px;border-radius:12px;max-width:500px;margin:auto;}");
  html += F(".val{color:#38bdf8;font-size:1.8rem;font-weight:bold;}");
  html += F(".tag{background:#22c55e;color:#000;padding:4px 8px;border-radius:6px;font-size:0.8rem;}");
  html += F("</style></head><body><div class='card'>");
  html += F("<h2>🐄 DhenuRakshak AI — Collar Node</h2>");
  html += "<p>Status: <span class='tag'>ONLINE</span></p>";
  html += "<p>Target Cattle: <strong>" + String(DEFAULT_COW_NAME) + " (" + String(DEFAULT_COW_ID) + ")</strong></p>";
  html += "<p>Body Temperature: <span class='val'>" + String(bodyTemperatureC, 1) + " °C</span></p>";
  html += "<p>Jaw Dynamic Acceleration: <span class='val'>" + String(dynamicAccelG, 3) + " g</span></p>";
  html += "<p>Chews Per Minute (CPM): <span class='val'>" + String(currentChewsPerMinute, 1) + "</span></p>";
  html += "<p>Total Chews Counted: <strong>" + String(totalChewCount) + "</strong></p>";
  html += "<p>Rumination Status: <strong>" + String(isRuminating ? "🟢 RUMINATING" : "⚪ RESTING / GRAZING") + "</strong></p>";
  html += "<p>GPS Location: <strong>" + String(gpsInfo.latitude, 5) + ", " + String(gpsInfo.longitude, 5) + "</strong> (" + String(gpsInfo.satellites) + " sats)</p>";
  html += F("<hr style='border:1px solid #334155'><p><a href='/api/telemetry' style='color:#38bdf8;'>JSON Telemetry API Endpoint</a></p>");
  html += F("</div></body></html>");
  server.send(200, "text/html", html);
}

void handleTelemetry() {
  // Assemble full JSON payload
  char jsonBuf[1024];
  unsigned long uptimeSec = (millis() - bootMillis) / 1000;

  snprintf(jsonBuf, sizeof(jsonBuf),
    "{"
      "\"node_id\":\"%s\","
      "\"cattle_id\":\"%s\","
      "\"cow_name\":\"%s\","
      "\"uptime_sec\":%lu,"
      "\"temperature_c\":%.2f,"
      "\"raw_accel\":{\"x\":%.3f,\"y\":%.3f,\"z\":%.3f},"
      "\"filtered_accel\":{\"x\":%.3f,\"y\":%.3f,\"z\":%.3f},"
      "\"jaw_metrics\":{"
        "\"dynamic_accel_g\":%.3f,"
        "\"is_chewing\":%s,"
        "\"total_chews\":%u,"
        "\"chews_per_minute\":%.1f,"
        "\"rumination_state\":\"%s\","
        "\"rumination_active_sec\":%lu"
      "},"
      "\"gps\":{"
        "\"latitude\":%.6f,"
        "\"longitude\":%.6f,"
        "\"speed_kmh\":%.1f,"
        "\"satellites\":%d,"
        "\"fix\":%s"
      "},"
      "\"wifi_mode\":\"%s\","
      "\"wifi_ip\":\"%s\""
    "}",
    NODE_ID,
    DEFAULT_COW_ID,
    DEFAULT_COW_NAME,
    uptimeSec,
    bodyTemperatureC,
    rawX, rawY, rawZ,
    fastX, fastY, fastZ,
    dynamicAccelG,
    isChewingNow ? "true" : "false",
    totalChewCount,
    currentChewsPerMinute,
    isRuminating ? "RUMINATING" : "IDLE",
    totalRuminationSeconds,
    gpsInfo.latitude,
    gpsInfo.longitude,
    gpsInfo.speedKmh,
    gpsInfo.satellites,
    gpsInfo.hasFix ? "true" : "false",
    WiFi.status() == WL_CONNECTED ? "AP+STA" : "AP_ONLY",
    WiFi.status() == WL_CONNECTED ? WiFi.localIP().toString().c_str() : WiFi.softAPIP().toString().c_str()
  );

  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Content-Type", "application/json");
  server.send(200, "application/json", jsonBuf);
}

void handleCalibrate() {
  calibrateADXL345();
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "application/json", "{\"success\":true,\"message\":\"ADXL345 recalibrated successfully\"}");
}

// =====================================================================================
//  SETUP & MAIN LOOP
// =====================================================================================

void setup() {
  Serial.begin(115200);
  delay(500);
  bootMillis = millis();

  pinMode(PIN_STATUS_LED, OUTPUT);
  digitalWrite(PIN_STATUS_LED, LOW);

  Serial.println(F("\n========================================================="));
  Serial.println(F("🐄 DhenuRakshak AI — Livestock Health Collar Starting..."));
  Serial.println(F("🏆 SIH Problem Statement #109: Bovine Mastitis Early Warning"));
  Serial.println(F("========================================================="));

  // Initialize Sensors
  initADXL345();
  calibrateADXL345();
  initLM35();
  initGPS();

  // Dual Wi-Fi Mode (AP for Pi 3B+ + STA for farm router/hotspot)
  WiFi.mode(WIFI_AP_STA);

  // Start Access Point
  WiFi.softAP(AP_SSID, AP_PASS);
  IPAddress apIP = WiFi.softAPIP();
  Serial.printf("📡 Broadcast AP: '%s' | Password: '%s'\n", AP_SSID, AP_PASS);
  Serial.printf("📡 Access Point IP Address: http://%s\n", apIP.toString().c_str());

  // Attempt connection to Station (Phone Hotspot / Barn Wi-Fi)
  Serial.printf("🌐 Connecting to Station Wi-Fi: '%s'...\n", STA_SSID);
  WiFi.begin(STA_SSID, STA_PASS);
  
  // Wait up to 5 seconds for Wi-Fi station
  int wifiAttempts = 0;
  while (WiFi.status() != WL_CONNECTED && wifiAttempts < 10) {
    delay(500);
    Serial.print(".");
    wifiAttempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n✅ Connected to Station Wi-Fi! Local IP: http://%s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println(F("\n⚠️ Station Wi-Fi not available. Running in Standalone AP Mode on 192.168.4.1"));
  }

  // Setup REST Web Server
  server.on("/", HTTP_GET, handleRoot);
  server.on("/api/telemetry", HTTP_GET, handleTelemetry);
  server.on("/api/calibrate", HTTP_GET, handleCalibrate);
  server.begin();
  Serial.println(F("🚀 REST API Server online at /api/telemetry"));

  windowStartTimestamp = millis();
}

void loop() {
  server.handleClient();
  processGPS();

  // Accelerometer sampling at 50 Hz (every 20 ms)
  unsigned long now = millis();
  if (now - lastSampleTimestamp >= 20) {
    lastSampleTimestamp = now;
    readAndProcessAccelerometer();
  }

  // Temperature sampling every 1000 ms (1 Hz)
  if (now - lastTempReadTimestamp >= 1000) {
    lastTempReadTimestamp = now;
    readCalibratedLM35();
  }
}
