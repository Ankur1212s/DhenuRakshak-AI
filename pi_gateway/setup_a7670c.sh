#!/bin/bash
# ==============================================================================
# setup_a7670c.sh — Automated 4G LTE Configuration for SIMCOM A7670C on Raspberry Pi
# LactoGuard AI | Smart India Hackathon Problem Statement #109
# ==============================================================================
# Supports: Jio, Airtel, Vi (Vodafone-Idea), BSNL
# Provides dual-mode setup:
#   Mode 1: High-Speed ECM / RNDIS (Native 'usb0' network interface)
#   Mode 2: Resilient PPP Dial-up (pppd / wvdial fallback on /dev/ttyUSB2)
# ==============================================================================

set -e

echo "=========================================================="
echo "🐄 LactoGuard AI — A7670C 4G LTE Module Setup Script"
echo "=========================================================="

if [ "$EUID" -ne 0 ]; then
  echo "❌ Please run as root: sudo bash setup_a7670c.sh"
  exit 1
fi

echo "📦 1. Installing required cellular packages..."
apt-get update -qq
apt-get install -y -qq ppp wvdial usb-modeswitch minicom udhcpc

echo "🔍 2. Detecting A7670C USB device..."
lsusb | grep -i "1e0e" || lsusb | grep -i "simcom" || echo "Note: Check USB cable connection if device is not listed above."

# Check for USB serial ports
if [ -e "/dev/ttyUSB2" ]; then
  echo "✅ Detected A7670C AT Command Port at /dev/ttyUSB2"
else
  echo "⚠️ /dev/ttyUSB2 not found yet. Reloading option drivers..."
  modprobe option
  echo "1e0e 9001" > /sys/bus/usb-serial/drivers/option1/new_id 2>/dev/null || true
  sleep 2
fi

echo "📶 3. Configuring APN for Indian Telecom Carriers..."
echo "Select your SIM Card Operator:"
echo "  1) Reliance Jio (APN: jionet)"
echo "  2) Airtel (APN: airtelgprs.com)"
echo "  3) Vodafone-Idea Vi (APN: www)"
echo "  4) BSNL (APN: bsnlnet)"
read -p "Enter choice [1-4] (Default: 1): " SIM_CHOICE
SIM_CHOICE=${SIM_CHOICE:-1}

case $SIM_CHOICE in
  1) APN="jionet" ;;
  2) APN="airtelgprs.com" ;;
  3) APN="www" ;;
  4) APN="bsnlnet" ;;
  *) APN="jionet" ;;
esac

echo "Selected APN: $APN"

# 4. Write wvdial configuration for PPP fallback
cat <<EOF > /etc/wvdial.conf
[Dialer Defaults]
Init1 = ATZ
Init2 = ATQ0 V1 E1 S0=0
Init3 = AT+CGDCONT=1,"IP","$APN"
Stupid Mode = 1
Message Endpoint = "NONE"
Modem Type = Analog Modem
ISDN = 0
Phone = *99#
Modem = /dev/ttyUSB2
Baud = 115200
Auto DNS = 1
Check Def Route = 1
EOF

echo "✅ Saved /etc/wvdial.conf"

# 5. Create Systemd Service for Auto-reconnecting 4G LTE
cat <<EOF > /etc/systemd/system/a7670c-cellular.service
[Unit]
Description=LactoGuard A7670C 4G LTE Auto-Dialer
After=network.target

[Service]
Type=simple
ExecStart=/usr/bin/wvdial
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
echo "✅ Created systemd service: a7670c-cellular.service"

# 6. Set Interface Routing Priorities
# Wi-Fi metric = 100 (Primary), 4G LTE metric = 200 (Secondary Failover)
cat <<EOF > /etc/network/interfaces.d/cellular-metric
# Ensure Wi-Fi has lower metric than 4G cellular
iface ppp0 inet manual
    metric 200

iface usb0 inet dhcp
    metric 200
EOF

echo "=========================================================="
echo "🎉 A7670C 4G LTE Setup Complete!"
echo "=========================================================="
echo "To start 4G internet manually: sudo wvdial"
echo "To enable 4G auto-start on boot: sudo systemctl enable --now a7670c-cellular"
echo "When active, Raspberry Pi will automatically fail over to 4G if Wi-Fi drops!"
echo "=========================================================="
