# Elderly Connect HK - Backend Startup Guide

This guide provides all the necessary commands to start the backend services for all features of the Elderly Connect HK application.

## Prerequisites

Before starting the backend services, ensure you have:
1. Python 3.8 or higher installed
2. Node.js and npm installed
3. Docker installed (for MongoDB)
4. Azure Speech Services credentials
5. Ollama installed

## Environment Setup

Ensure your `.env` file is properly configured with all required credentials:

```env
# Azure Speech Services Configuration
AZURE_SPEECH_KEY=your_azure_speech_key_here
AZURE_SPEECH_REGION=your_azure_region_here
AZURE_SPEECH_ENDPOINT=your_azure_endpoint_here

# Ollama Configuration
DEEPSEEK_API_KEY=ollama
DEEPSEEK_ENDPOINT=http://localhost:11434/v1/chat/completions
DEEPSEEK_MODEL=llama3.1:latest

# Flask Server Port
PORT=5003

# MongoDB Configuration (for Memory Garden)
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=community_platform
MONGODB_COLLECTION_NAME=stories
```

## Starting All Backend Services

### 1. Start MongoDB using Docker

```bash
# Start MongoDB container
docker-compose up -d

# Verify MongoDB is running
docker-compose ps
```

### 2. Start Ollama Service

```bash
# Start Ollama in the background
ollama serve &

# Pull required models
ollama pull llama3.1:latest
ollama pull llava
```

### 3. Start Voice Companion Backend

```bash
# Navigate to backend directory
cd backend

# Start the Flask server
python3 app.py
```

The Voice Companion backend will be available at:
- Local: http://localhost:5003
- Network: http://YOUR_IP:5003

Endpoints:
- Health check: `/health`
- Process voice: `/process-voice`

### 4. Start Memory Garden Backend

```bash
# Navigate to memory garden backend directory
cd memory-garden-backend

# Start the FastAPI server
uvicorn main:app --host 0.0.0.0 --port 8002 --reload
```

The Memory Garden backend will be available at:
- Local: http://localhost:8002
- Docs: http://localhost:8002/docs

## Individual Service Management

### Checking Service Status

```bash
# Check if services are running on their respective ports
lsof -i :5003  # Voice Companion
lsof -i :8002  # Memory Garden
lsof -i :27017 # MongoDB
lsof -i :11434 # Ollama
```

### Stopping Services

```bash
# Stop Flask server (Voice Companion)
pkill -f "python.*app.py"

# Stop FastAPI server (Memory Garden)
pkill -f "uvicorn main:app"

# Stop Ollama
pkill -f "ollama"

# Stop MongoDB container
docker-compose down
```

## Health Checks

### Voice Companion Health Check

```bash
curl -X GET http://localhost:5003/health
```

Expected response:
```json
{
  "azure_status": "connected",
  "status": "Flask server is running with Azure Speech Services",
  "timestamp": "2025-10-23 08:04:34.875967"
}
```

### Memory Garden Health Check

```bash
curl -X GET http://localhost:8002/
```

Expected response:
```json
{
  "message": "Memory Garden Backend is running"
}
```

## Troubleshooting

### Common Issues and Solutions

1. **Port already in use**:
   ```bash
   # Kill processes using specific ports
   pkill -f "port 5003"
   pkill -f "port 8002"
   ```

2. **Ollama not responding**:
   ```bash
   # Restart Ollama service
   pkill -f "ollama"
   ollama serve &
   ```

3. **MongoDB connection issues**:
   ```bash
   # Restart MongoDB container
   docker-compose down
   docker-compose up -d
   ```

4. **Azure Speech Services not connecting**:
   - Verify your Azure credentials in the `.env` file
   - Check your internet connection
   - Ensure the Azure region is correct

### Required Python Packages

If you encounter import errors, install the required packages:

```bash
# For Voice Companion
pip install flask flask-cors azure-cognitiveservices-speech python-dotenv requests

# For Memory Garden
pip install uvicorn fastapi pydantic starlette python-multipart ollama pymongo motor python-dotenv
```

## Service Endpoints Summary

| Service | Port | URL | Health Check |
|---------|------|-----|--------------|
| Voice Companion | 5003 | http://localhost:5003 | `/health` |
| Memory Garden | 8002 | http://localhost:8002 | `/` |
| MongoDB | 27017 | mongodb://localhost:27017 | N/A |
| Ollama | 11434 | http://localhost:11434 | `/api/tags` |

## Frontend Connection

The frontend connects to the backend services using:
- Voice Companion: `http://YOUR_IP:5003`
- Memory Garden: `http://YOUR_IP:8002`

Ensure both the frontend and backend are on the same network for proper connectivity.

## Useful Commands

### View Logs

```bash
# View MongoDB logs
docker-compose logs mongodb

# View Ollama logs
ollama logs
```

### Model Management

```bash
# List Ollama models
ollama list

# Pull additional models
ollama pull llava-phi3  # Smaller LLaVA model
ollama pull gemma2:9b  # Alternative language model
```

### Testing Voice Companion

```bash
# Simple health check
curl -X GET http://localhost:5003/health

# Test voice processing (with sample data)
curl -X POST http://localhost:5003/process-voice \
  -H "Content-Type: application/json" \
  -d '{"audio": "test", "language": "english"}'
```

### Testing Memory Garden

```bash
# Health check
curl -X GET http://localhost:8002/

# Get all stories
curl -X GET http://localhost:8002/stories/

# Get stories by district
curl -X GET http://localhost:8002/stories/district/sham_shui_po
```

This guide should help you start and manage all backend services for the Elderly Connect HK application. For any issues not covered here, please refer to the specific service documentation or contact the development team.