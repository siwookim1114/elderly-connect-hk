#!/bin/bash

# Script to update the API IP address in config.js
# Run this whenever your network IP changes

echo "🔧 Updating API configuration..."

# Get current IP address
CURRENT_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || hostname -I | awk '{print $1}' || echo "192.168.0.193")

echo "📡 Detected IP: $CURRENT_IP"

# Update config.js
sed -i.bak "s/192\.168\.0\.193\|10\.89\.81\.194/$CURRENT_IP/g" app/config.js

echo "✅ Updated app/config.js with IP: $CURRENT_IP"
echo "🔗 Backend URL: http://$CURRENT_IP:5002"
echo ""
echo "📱 Make sure to:"
echo "1. Restart your Expo development server"
echo "2. Scan the QR code with Expo Go"
echo "3. Test the connection button should now work!"
