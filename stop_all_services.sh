#!/bin/bash

# Script to stop all backend services for Elderly Connect HK
# Services: Voice Companion, Memory Garden, Ollama, MongoDB

echo "🛑 Stopping all Elderly Connect HK Backend Services..."
echo "====================================================="

# Function to kill processes by name
kill_process() {
    local process_name=$1
    echo "Killing $process_name processes..."
    pkill -f "$process_name" 2>/dev/null || echo "No $process_name processes found"
}

# Kill all backend services
echo "🧹 Stopping backend services..."

# Stop Voice Companion (Flask)
kill_process "python.*backend/app.py"

# Stop Memory Garden (Uvicorn)
kill_process "uvicorn.*memory-garden-backend"

# Stop Ollama
kill_process "ollama"

# Stop MongoDB containers
echo "🐳 Stopping MongoDB..."
cd /Users/pranavikuntrapakam/elderly-connect-hk
if [ -f "docker-compose.yml" ]; then
    docker-compose down
    if [ $? -eq 0 ]; then
        echo "✅ MongoDB stopped successfully"
    else
        echo "❌ Failed to stop MongoDB"
    fi
else
    echo "❌ docker-compose.yml not found"
fi

# Wait for processes to terminate
sleep 3

# Kill any remaining processes on our ports
echo "🧹 Cleaning up ports..."
lsof -ti :5002 | xargs kill -9 2>/dev/null || echo "Port 5002 is clean"
lsof -ti :8002 | xargs kill -9 2>/dev/null || echo "Port 8002 is clean"
lsof -ti :27017 | xargs kill -9 2>/dev/null || echo "Port 27017 is clean"
lsof -ti :11434 | xargs kill -9 2>/dev/null || echo "Port 11434 is clean"

echo ""
echo "📊 Final Port Status:"
echo "===================="

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        echo "❌ Port $port is still in use"
        return 0
    else
        echo "✅ Port $port is free"
        return 1
    fi
}

check_port 5002
check_port 8002
check_port 27017
check_port 11434

echo ""
echo "✅ All services have been stopped!"