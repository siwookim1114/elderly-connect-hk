#!/bin/bash

echo "🚀 Starting Voice Bot Backend Server..."
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  Please create .env file first!"
    echo "   Copy .env.example to .env and add your API keys"
    echo ""
    echo "📝 Required API Keys:"
    echo "   1. Azure Speech Services: https://portal.azure.com"
    echo "   2. DeepSeek AI: https://platform.deepseek.com"
    exit 1
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source backend_venv/bin/activate

# Start the Flask server
echo "🌐 Starting Flask server on port 5002..."
echo "📱 Server URLs:"
echo "   • Local:    http://localhost:5002"
echo "   • Network:  http://$(hostname -I | awk '{print $1}'):5002"
echo ""
echo "🔗 API Endpoints:"
echo "   • Health Check: http://localhost:5002/health"
echo "   • Voice Processing: http://localhost:5002/process-voice"
echo ""
echo "📞 Your React Native app should connect to: http://$(hostname -I | awk '{print $1}'):5002"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

python backend/app.py
