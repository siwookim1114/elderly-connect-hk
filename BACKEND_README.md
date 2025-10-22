# Voice Bot Backend Setup

This backend provides voice processing capabilities for the elderly companion app using Azure Cognitive Services and DeepSeek AI.

## Features

- **Speech-to-Text**: Azure-powered transcription in English and Cantonese
- **AI Responses**: DeepSeek AI with specialized prompts for elderly care
- **Text-to-Speech**: Azure neural voices in English and Cantonese
- **Language Detection**: Automatic language detection for seamless bilingual support

## Quick Setup

### 1. Install Dependencies
```bash
# The virtual environment and dependencies are already set up
source backend_venv/bin/activate
```

### 2. Configure API Keys
```bash
# Copy the template and edit with your keys
cp .env.example .env
# Edit .env file with your actual API keys
```

### 3. Start the Backend
```bash
# Using the startup script
./start_backend.sh

# Or manually
source backend_venv/bin/activate
python backend/app.py
```

## API Keys Required

### Azure Cognitive Services
1. Go to [Azure Portal](https://portal.azure.com)
2. Create a Speech Services resource
3. Copy the API key and region

### DeepSeek AI
1. Go to [DeepSeek Platform](https://platform.deepseek.com)
2. Sign up and get your API key

## API Endpoints

- **GET /health** - Health check and status
- **POST /process-voice** - Process voice input and return AI response

## Testing

```bash
# Test health endpoint
curl http://localhost:5002/health

# Test voice processing (requires audio data)
curl -X POST http://localhost:5002/process-voice \
  -H "Content-Type: application/json" \
  -d '{"audio": "base64_audio_data", "language": "english"}'
```

## Development

The backend runs on port 5002 by default and supports CORS for React Native development.
