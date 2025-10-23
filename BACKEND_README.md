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
### 4. Start the MongoDB
```bash
docker-compose up -d
```

### 3. Ollama
```bash
ollama serve &
```
### 3. Voice Bot
```bash
python3 app.py
```
### 3. Memory Garden
```bash
python3 start_memory_garden.py
```

## API Keys Required

```bash
# Azure Speech Services Configuration
AZURE_SPEECH_KEY=BVz8yTnhTdbfCcXmGO7TF3DXO1STRI1PUPvxrHHmgAEWzDpvOmgJJQQJ99BJACqBBLyXJ3w3AAAYACOGsKTT
AZURE_SPEECH_REGION=southeastasia
AZURE_SPEECH_ENDPOINT=

# DeepSeek/Ollama Configuration (for local LLM)
DEEPSEEK_API_KEY=ollama
DEEPSEEK_ENDPOINT=http://localhost:11434/v1/chat/completions
DEEPSEEK_MODEL=llama3.1:latest

# Flask Server Port (optional)
PORT=5003
```

## Development

The backend runs on port 5002 by default and supports CORS for React Native development.
