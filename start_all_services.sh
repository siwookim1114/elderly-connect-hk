#!/bin/bash

# Script to start all backend services for Elderly Connect HK
# Services: Voice Companion, Memory Garden, Ollama, MongoDB

echo "🚀 Starting all Elderly Connect HK Backend Services..."
echo "====================================================="

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        echo "Port $port is already in use"
        return 0
    else
        echo "Port $port is free"
        return 1
    fi
}

# Function to kill processes on a specific port
kill_port() {
    local port=$1
    echo "Killing processes on port $port..."
    lsof -ti :$port | xargs kill -9 2>/dev/null || echo "No processes found on port $port"
}

# Function to check if a process is running
is_running() {
    local process_name=$1
    if pgrep -f "$process_name" > /dev/null; then
        echo "$process_name is already running"
        return 0
    else
        echo "$process_name is not running"
        return 1
    fi
}

# Kill any existing processes on our ports
echo "🧹 Cleaning up existing processes..."
kill_port 5002  # Voice Companion
kill_port 8002  # Memory Garden
kill_port 27017 # MongoDB
kill_port 11434 # Ollama

# Wait a moment for processes to terminate
sleep 2

# Start MongoDB using docker-compose
echo "🐳 Starting MongoDB..."
cd /Users/pranavikuntrapakam/elderly-connect-hk
if [ -f "docker-compose.yml" ]; then
    docker-compose up -d mongodb
    if [ $? -eq 0 ]; then
        echo "✅ MongoDB started successfully"
    else
        echo "❌ Failed to start MongoDB"
    fi
else
    echo "❌ docker-compose.yml not found"
fi

# Wait for MongoDB to start
sleep 5

# Start Ollama service with network accessibility
echo "🦙 Starting Ollama service..."
if command -v ollama &> /dev/null; then
    # Check if Ollama is already running
    if ! is_running "ollama"; then
        OLLAMA_HOST=0.0.0.0:11434 ollama serve > /tmp/ollama.log 2>&1 &
        OLLAMA_PID=$!
        echo "📝 Ollama PID: $OLLAMA_PID"
        echo "✅ Ollama service started (accessible from network)"
    else
        echo "✅ Ollama service already running"
    fi
else
    echo "❌ Ollama not found. Please install Ollama first: https://ollama.com/download"
fi

# Wait for Ollama to start
sleep 5

# Pull required Ollama models if not already present
echo "📦 Checking Ollama models..."
if command -v ollama &> /dev/null; then
    echo "📥 Pulling llama3.1 model for Voice Companion..."
    ollama pull llama3.1:latest
    
    echo "📥 Pulling llava model for Memory Garden..."
    ollama pull llava:latest
else
    echo "❌ Ollama not available, skipping model pulls"
fi

# Start Voice Companion Backend
echo "🤖 Starting Voice Companion Backend..."
cd /Users/pranavikuntrapakam/elderly-connect-hk/backend
if [ -f "app.py" ]; then
    # Check if already running
    if ! is_running "python.*app.py"; then
        PORT=5002 python3 app.py > /tmp/voice_companion.log 2>&1 &
        VOICE_PID=$!
        echo "📝 Voice Companion PID: $VOICE_PID"
        echo "✅ Voice Companion Backend started on port 5002"
    else
        echo "✅ Voice Companion Backend already running"
    fi
else
    echo "❌ Voice Companion app.py not found"
fi

# Start Memory Garden Backend
echo "🧠 Starting Memory Garden Backend..."
cd /Users/pranavikuntrapakam/elderly-connect-hk/memory-garden-backend
if [ -f "main.py" ]; then
    # Check if already running
    if ! is_running "uvicorn.*main"; then
        uvicorn main:app --host 0.0.0.0 --port 8002 > /tmp/memory_garden.log 2>&1 &
        MEMORY_PID=$!
        echo "📝 Memory Garden PID: $MEMORY_PID"
        echo "✅ Memory Garden Backend started on port 8002"
    else
        echo "✅ Memory Garden Backend already running"
    fi
else
    echo "❌ Memory Garden main.py not found"
fi

# Wait for services to initialize
sleep 5

# Display status
echo ""
echo "📊 Service Status:"
echo "=================="

if check_port 5002; then
    echo "✅ Voice Companion: Running on port 5002"
else
    echo "❌ Voice Companion: Not running"
fi

if check_port 8002; then
    echo "✅ Memory Garden: Running on port 8002"
else
    echo "❌ Memory Garden: Not running"
fi

if check_port 27017; then
    echo "✅ MongoDB: Running on port 27017"
else
    echo "❌ MongoDB: Not running"
fi

if check_port 11434; then
    echo "✅ Ollama: Running on port 11434"
else
    echo "❌ Ollama: Not running"
fi

echo ""
echo "📝 Log files location: /tmp/"
echo "   - Voice Companion: /tmp/voice_companion.log"
echo "   - Memory Garden: /tmp/memory_garden.log"
echo "   - Ollama: /tmp/ollama.log"
echo ""
echo "✅ All services startup process completed!"
echo "💡 To stop all services, run: ./stop_all_services.sh"