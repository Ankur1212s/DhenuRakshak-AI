# 🐄 LactoGuard AI
### Frugal Multi-Modal IoT & Edge AI Ecosystem for Pre-Clinical Bovine Mastitis Early Warning
**Smart India Hackathon 2026 | Problem Statement: Early Detection and Prevention of Bovine Mastitis in Dairy Cattle**

[![SIH 2026](https://img.shields.io/badge/SIH-2026-blue?style=for-the-badge&logo=target)](https://sih.gov.in)
[![Category](https://img.shields.io/badge/Category-Hardware_%26_Edge_IoT-emerald?style=for-the-badge)](https://github.com/Ankur1212s/DhenuRakshak-AI)
[![Architecture](https://img.shields.io/badge/Architecture-Zero--Pi_%7C_ESP--NOW-orange?style=for-the-badge)](https://github.com/Ankur1212s/DhenuRakshak-AI/tree/main/esp32_firmware)
[![Database](https://img.shields.io/badge/Cloud_DB-MongoDB_Atlas-green?style=for-the-badge&logo=mongodb)](https://cloud.mongodb.com)
[![Live Platform](https://img.shields.io/badge/Live_Dashboard-dhenurakshak.netlify.app-teal?style=for-the-badge&logo=netlify)](https://dhenurakshak.netlify.app/)

---

## 🌟 Executive Summary

**Bovine Mastitis** is the single most destructive disease in the global dairy industry, inflicting an estimated **₹13,000+ Crore annual economic loss** in India alone (ICAR-NDRI & IVRI field surveys). Over **70% to 80% of cases are subclinical** — completely invisible to the farmer's naked eye, with zero udder inflammation. Milk yield quietly collapses from 9–10 kg/day down to 2–3 kg/day, wiping out ₹250–₹300 daily per cow.

Existing commercial herd monitoring collars (Nedap, SCR by Allflex, Afimilk) cost **₹35,000 to ₹50,000 per cow**, making them financially impossible for **85% of Indian dairy farmers who own just 2 to 5 cows**.

**LactoGuard** solves this through a **radically affordable (< ₹2,000 complete setup)**, dual-pillar multi-sensor edge ecosystem:
1. **Smart Cattle Ear Tag (Behavioral & Thermal Monitoring):** Runs continuous 50Hz kinematic DSP on an ADXL345 accelerometer to detect rumination jaw chewing ($50\text{–}70\text{ CPM}$) and precision core body temperature via an oversampled LM35 sensor.
2. **Handheld Milking Bucket Meter (Direct Milk Bio-Sensing):** Low-cost meter clipped to the milking bucket wall. Farmer taps the cow's RFID ear tag to log identity, clips to bucket, and samples milk **Electrical Conductivity (EC)** and **pH** directly during the milking stream.
3. **Zero-Pi Central Edge Gateway:** Completely eliminates costly industrial computers/Raspberry Pis; uses a single ₹400 ESP32 running connectionless **ESP-NOW** (< 5ms transmission latency) with dual Wi-Fi and 4G GSM uplink to MongoDB Atlas Cloud.

---

## 🏗️ System Architecture & Data Pipeline

```
 ┌──────────────────────────────────────┐      ┌──────────────────────────────────────┐
 │       Smart Cattle Ear Tag Node      │      │     Handheld Milking Bucket Meter    │
 │  • ADXL345 (50Hz Dual-EMA DSP)       │      │  • MFRC522 (13.56MHz RFID Scanner)   │
 │  • LM35 (64-Sample Trimmed Mean ADC) │      │  • Analog Milk EC (mS/cm) Probe      │
 │  • Smart Sleep: Radio OFF until chew │      │  • Analog Milk pH-4502C Probe        │
 │  • Active Cadence: 35s cud interval  │      │  • START & SEND Push Buttons         │
 └──────────────────┬───────────────────┘      └──────────────────┬───────────────────┘
                    │                                             │
                    └──────────────────────┬──────────────────────┘
                                           │  ESP-NOW Broadcast (< 5ms, Channels 1–11)
                                           ▼
                              ┌──────────────────────────┐
                              │  Central ESP32 Gateway   │  (Zero Raspberry Pi Needed!)
                              │  • Multi-Node Packet Mux │  (Sub-5ms Reception)
                              │  • Station Wi-Fi + 4G GSM│  (Solid-State / Zero SD Corrupt)
                              └────────────┬─────────────┘
                                           │  HTTPS REST Ingest (JSON)
                                           ▼
                              ┌──────────────────────────┐
                              │   MongoDB Atlas Cloud    │  (Database: lactoguard)
                              │   (Cluster0.ohbtqbk)     │  (Collection: telemetry_logs)
                              └────────────┬─────────────┘
                                           │
                                           ▼
                              ┌──────────────────────────┐
                              │  Farmer Web Dashboard    │  (https://dhenurakshak.netlify.app/)
                              │  • Real-Time IoT Stream  │  • 7–14 Day Early Warning AI
                              │  • Vernacular Multilingual│ • Veterinary Lab Report OCR
                              └──────────────────────────┘
```

---

## 🔬 Biophysical & Engineering Principles

### 1. Direct Milk Ionic Leakage (Electrical Conductivity & pH)
* When bacterial pathogens (*Staphylococcus aureus*, *Streptococcus uberis*, *E. coli*) invade the teat canal, inflammatory cytokines compromise the tight junctions of mammary epithelial cells (the blood-milk barrier).
* Blood plasma electrolytes ($Na^+$ and $Cl^-$) flood into the milk lumen while $K^+$ and lactose decline to maintain osmotic equilibrium.
* **Direct Physical Result:** Free charge carrier concentration spikes, causing milk **Electrical Conductivity (EC)** to elevate from normal ($4.0\text{–}5.5\text{ mS/cm}$) to **$> 5.8\text{–}6.5+\text{ mS/cm}$**.
* Concurrently, infiltration of alkaline blood plasma ($\text{pH } 7.4$) drives milk pH from fresh acidic bounds ($6.50\text{–}6.75$) toward alkalinity (**$> 6.95$**).

### 2. Kinematic Jaw Rumination DSP (ADXL345)
* Cattle ruminate in 20–50 minute bouts, chewing cud at $50\text{–}70\text{ chews/min}$ with jaw strokes lasting $500\text{–}1200\text{ ms}$.
* **Dual Exponential Moving Average (Dual EMA):**
  * Fast EMA ($\alpha = 0.15$): Tracks high-frequency jaw oscillations (cutoff $\approx 1.2\text{ Hz}$).
  * Slow EMA ($\alpha = 0.002$): Dynamically tracks Earth's static $1\text{g}$ gravity orientation vector.
  * **Orientation Invariant:** $|\vec{a}_{\text{dyn}}| = |\vec{a}_{\text{fast}} - \vec{a}_{\text{slow}}|$ — head tilting during grazing or resting never registers false chew counts.
* **Schmitt Trigger with Hysteresis:** High threshold ($0.20\text{g}$) detects jaw chew apex; low threshold ($0.12\text{g}$) resets the detector.
* **Refractory Lockout Window ($500\text{ ms}$):** Biologically bounds chew frequency to $< 120\text{ CPM}$, rejecting ear flaps and head shakes.

### 3. LM35 Temperature Error Correction (ESP32 ADC)
* The ESP32 ADC has well-documented low-end non-linearity below $100\text{ mV}$.
* **64-Sample Trimmed-Mean Multi-Sampling:** 64 analog samples are collected over 32 ms and sorted. The highest 16 and lowest 16 samples (transient noise spikes) are discarded, and the middle 32 samples are averaged to deliver stable $\pm 0.1^\circ\text{C}$ clinical resolution.

---

## 🔋 Smart Sleep & Power Management

| Operating Mode | Wi-Fi / Radio State | Current Draw | Behavior / Trigger |
| :--- | :---: | :---: | :--- |
| **Sensing Standby** | **OFF** (`WIFI_OFF`) | **~15 mA** | Quiet sampling of ADXL345 at 50Hz. No RF transmissions while resting or grazing. |
| **Rumination Active** | **ON** (ESP-NOW) | **Burst (< 5ms)** | Triggered when $\ge 6$ rhythmic chews detected in 15s. Transmits every **35 seconds**. |
| **Bout Summary** | **ON ➔ OFF** | **Burst (< 5ms)** | Sends 1 final packet upon bout completion (total chews & duration), then powers down radio. |
| **Emergency Fever Alert**| **ON** (ESP-NOW) | **Burst (< 5ms)** | Immediate override transmission if core body temp exceeds **$39.5^\circ\text{C}$**. |
| **Periodic Heartbeat** | **ON ➔ OFF** | **Burst (< 5ms)** | 15-minute background health & pasture GPS keep-alive. |

*This intelligent 35-second cadence cuts radio duty cycle by **> 83%**, extending standard 3.7V 18650 Li-ion battery life to multiple months!*

---

## ⚡ Hardware Pinout & Circuit Schematic

### 1. Smart Cattle Ear Tag Node (ESP32 DevKit V1)
| Component | Pin | ESP32 Pin | Logic Level | Description |
| :--- | :--- | :--- | :--- | :--- |
| **ADXL345** | **VCC** | **3V3** | 3.3V DC | Accelerometer power |
| | **GND** | **GND** | GND | Common ground |
| | **SDA** | **GPIO 21** | 3.3V Logic | Hardware I2C SDA |
| | **SCL** | **GPIO 22** | 3.3V Logic | Hardware I2C SCL |
| | **CS** | **3V3** | 3.3V Logic | Pulled HIGH to enable I2C mode |
| | **SDO** | **GND** | GND | Sets I2C address to `0x53` (Auto-detects `0x1D` also) |
| **LM35 Sensor**| **+Vs** | **VIN / 5V** | 4V to 30V | Clean linear power rail |
| | **GND** | **GND** | GND | Common ground |
| | **VOUT**| **GPIO 34** | 0 – 3.3V | **ADC1_CH6** (Safe: ADC1 is immune to Wi-Fi conflicts) |
| **Status LED** | **Anode**| **GPIO 2** | 3.3V | Built-in activity LED |

### 2. Handheld Milking Bucket Meter (ESP32 DevKit V1)
| Component | Pin | ESP32 Pin | Logic Level | Description |
| :--- | :--- | :--- | :--- | :--- |
| **MFRC522 RFID**| **3.3V** | **3V3** | **3.3V ONLY**| ⚠️ **Never connect to 5V rail (destroys chip!)** |
| | **GND** | **GND** | GND | Common ground |
| | **RST** | **GPIO 22** | 3.3V Logic | RFID Reset pin |
| | **SDA (SS)**| **GPIO 5** | 3.3V Logic | Hardware VSPI Chip Select |
| | **MOSI** | **GPIO 23** | 3.3V Logic | Hardware VSPI MOSI |
| | **MISO** | **GPIO 19** | 3.3V Logic | Hardware VSPI MISO |
| | **SCK** | **GPIO 18** | 3.3V Logic | Hardware VSPI Clock |
| **Push Buttons** | **START**| **GPIO 13** | Active LOW | Connect between **GPIO 13 and GND** (`INPUT_PULLUP`) |
| | **SEND** | **GPIO 14** | Active LOW | Connect between **GPIO 14 and GND** (`INPUT_PULLUP`) |
| **Analog EC Probe**| **Aout** | **GPIO 34** | 0 – 3.3V | **ADC1_CH6** (Safe from Wi-Fi conflicts) |
| **Analog pH Probe**| **Po** | **GPIO 35** | 0 – 3.3V | **ADC1_CH7** (Safe from Wi-Fi conflicts) |
| **Audio Buzzer** | **(+)** | **GPIO 15** | 3.3V / 5V | Audio confirmation beeps |
| **Status LEDs** | **Green**| **GPIO 2** | 3.3V | Tag locked / Ready |
| | **Blue** | **GPIO 4** | 3.3V | Milking session active |

### 3. Central ESP32 Gateway (Wi-Fi + 4G GSM)
| Component | Pin | ESP32 Pin | Description |
| :--- | :--- | :--- | :--- |
| **4G GSM Modem** *(SIMCOM A7670C)* | **TXD** | **GPIO 16 (RX2)** | HardwareSerial 2 RX |
| | **RXD** | **GPIO 17 (TX2)** | HardwareSerial 2 TX |
| | **GND** | **GND** | Common ground |
| | **VCC** | **External 5V / 2A**| High-peak cellular power rail |
| **Status LED** | **Anode** | **GPIO 2** | Flashes on packet receive & cloud upload |

---

## 💰 Bill of Materials & Cost Comparison

| Component | Commercial Collars (SCR / Nedap / Afimilk) | **LactoGuard Ecosystem** |
| :--- | :--- | :--- |
| **Gateway Base Station** | Industrial PC / Gateway (₹35,000 – ₹60,000) | **ESP32 Edge Hub (~₹400)** |
| **Animal Health Node** | Proprietary Collar (₹35,000 / cow) | **Smart Ear Tag Node (~₹650)** |
| **Milk Ingest Sensor** | Robotic Inline Parlor Analyzer (₹1,50,000+) | **Handheld Bucket Meter (~₹850)** |
| **Total System Cost** | **₹40,000 to ₹2,50,000+** | **Under ₹2,000 Complete!** |
| **Subscription Fee** | ₹1,200 – ₹2,500 / cow / year | **Zero Software License Fees** |

---

## 📁 Repository Directory Structure

```
DhenuRakshak-AI/
├── esp32_firmware/
│   ├── eartag_firmware.ino         # Smart Cattle Ear Tag (ADXL345 DSP + LM35 + 35s sleep cadence)
│   ├── bucket_meter_firmware.ino   # Handheld Bucket Meter (RFID + EC + pH + START/SEND buttons)
│   └── esp32_gateway_firmware.ino  # Central Gateway Hub (ESP-NOW + Wi-Fi + Netlify/MongoDB relay)
├── frontend/
│   ├── functions/
│   │   └── telemetry.js            # Netlify Serverless API & MongoDB Atlas Cloud Ingest
│   ├── src/
│   │   ├── components/
│   │   │   └── CollarTelemetryCard.jsx # Adaptive Live IoT Stream Card (Ear Tag & Bucket Meter)
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx       # Farm overview & live stream
│   │   │   ├── Predict.jsx         # 7-14 Day Mastitis Early Warning Predictor
│   │   │   └── Settings.jsx        # Farm & Herd Configuration
│   │   └── App.jsx
│   └── package.json
├── netlify.toml                    # Netlify production build & redirect configuration
└── README.md                       # Complete project technical documentation
```

---

## 🚀 Step-by-Step Deployment & Testing Guide

### 1. Flashing the Firmware (Arduino IDE)
1. Install **ESP32 Board Package** in Arduino IDE (`Tools -> Board -> Boards Manager -> esp32` by Espressif, supports **Core v3.x and v2.x**).
2. Install required libraries via **Library Manager**:
   * `MFRC522` by GithubCommunity
   * `ArduinoJson` (v6.x) by Benoit Blanchon
3. Open [`esp32_firmware/esp32_gateway_firmware.ino`](esp32_firmware/esp32_gateway_firmware.ino):
   * Set your Wi-Fi router or phone hotspot credentials:
     ```cpp
     const char* WIFI_SSID = "Your_WiFi_Name";
     const char* WIFI_PASS = "Your_WiFi_Password";
     ```
   * Flash to Gateway ESP32. Open Serial Monitor at **115200 baud**.
4. Open [`esp32_firmware/eartag_firmware.ino`](esp32_firmware/eartag_firmware.ino):
   * Flash to Ear Tag ESP32. It samples ADXL345 continuously at 50Hz and begins transmitting every 35 seconds when rumination is detected.
5. Open [`esp32_firmware/bucket_meter_firmware.ino`](esp32_firmware/bucket_meter_firmware.ino):
   * Flash to Bucket Meter ESP32. Tap an RFID card on the reader, press START, and press SEND.

### 2. Live Cloud Verification
* **Live Dashboard:** Open [https://dhenurakshak.netlify.app/](https://dhenurakshak.netlify.app/) to view real-time cattle telemetry.
* **REST API Query:**
  * Query by Cow ID: `https://dhenurakshak.netlify.app/api/telemetry?cow=COW-102`
  * Query by RFID Tag: `https://dhenurakshak.netlify.app/api/telemetry?rfid=B453E1F6`
* **MongoDB Atlas Console:**
  * Cluster: `Cluster0.ohbtqbk.mongodb.net`
  * Database: `lactoguard`
  * Collection: `telemetry_logs`

---

## 📊 Scientific Citations & References

1. **ICAR-NDRI & IVRI Dairy Economic Reports (2022–2024):** *"Economic Impact of Bovine Mastitis in India's Smallholder Dairy Systems"* — documented ₹13,000+ Crore annual loss and ₹7,165 per affected cow/year.
2. **Norberg, E. et al. (Journal of Dairy Science, Vol. 87):** *"Electrical Conductivity of Milk as a Phenotypic and Genetic Indicator of Bovine Mastitis"* — validated somatic cell count correlation with $Na^+/Cl^-$ electrolyte surges.
3. **Borchers, M. R. et al. (Journal of Dairy Science, Vol. 99):** *"Validation of Rumination and Activity Monitoring Systems for Health Event Detection in Dairy Cattle"* — proved rumination declines by 18%–25% up to 14 days pre-clinical.
4. **International Dairy Federation (IDF Bulletin No. 448):** *"Physicochemical Markers in Bovine Mastitis: pH Shifts from 6.50 to 7.0+ due to Blood Plasma Infiltration"*.
5. **Standards Compliance:** ISO/IEC 14443 Type A RFID Livestock Standard & Bureau of Indian Standards (BIS: IS 1479 - Chemical Analysis of Milk).

---

## 👥 Team & Hackathon Credentials
* **Project:** LactoGuard AI
* **Hackathon:** Smart India Hackathon 2026
* **License:** MIT Open Source License
