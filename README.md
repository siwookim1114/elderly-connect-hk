# elderly-connect-hk

An All-In-One app to help senior citizens in Hong Kong with both **Community Platform** and **Voice Companion** features.

## 🌟 Features

### 🏘️ Community Platform

- **Social Connection**: Connect with other seniors in your community
- **Activity Discovery**: Find leisure programs and events
- **AI-Powered Matching**: Smart recommendations using embeddings and FAISS
- **Help Desk**: Community-driven support system

### 🎤 Voice Companion

- **Continuous Speech Recognition**: Talk naturally without timeouts
- **Bilingual Support**: English and Cantonese voice interaction
- **AI Companion**: Intelligent responses powered by Ollama
- **Voice Output**: Natural speech synthesis with Azure TTS

## 🚀 Quick Start

### Prerequisites

- Node.js (for React Native frontend)
- Python 3.8+ (for Flask backend)
- Azure Speech Services account
- Ollama installed locally

### Installation

1. **Clone and install dependencies:**

```bash
git clone https://github.com/siwookim1114/elderly-connect-hk.git
cd elderly-connect-hk
npm install
pip install -r requirements.txt
```

2. **Set up environment variables:**

```bash
cp .env.example .env
# Edit .env with your Azure Speech Services credentials
```

3. **Start the backend:**

```bash
# Option 1: Using script
./start_backend.sh

# Option 2: Manual
source backend_venv/bin/activate
python backend/app.py
```

4. **Start the frontend:**

```bash
npx expo start
```

## 📱 Usage

### Voice Companion

1. Open the app and tap **"🔍 Test"** to verify server connection
2. Tap **"🎤 Talk"** to start recording
3. Speak naturally in English or Cantonese
4. Tap **"🛑 Stop"** when finished
5. Receive AI response with voice output

### Community Platform

1. Browse available activities and programs
2. Connect with other community members
3. Get AI-powered recommendations
4. Access the help desk for support

## 🏗️ Architecture

- **Frontend**: React Native with Expo
- **Backend**: Flask with Azure Speech Services + Ollama
- **Database**: MongoDB for community features
- **AI**: Azure Speech Services (STT/TTS) + Ollama (LLM)
- **Audio**: 16kHz WAV format optimized for speech recognition

## 🔧 Development

### Running Tests

```bash
# Frontend
npm test

# Backend
python -m pytest backend/
```

### Building for Production

```bash
# iOS/Android builds
npx expo build:ios
npx expo build:android

# Web build
npx expo export
```

## 📋 Project Structure

```
├── app/                    # React Native frontend
│   ├── voice-companion.tsx # Voice interface
│   └── ...                 # Community platform screens
├── backend/                # Flask API
│   ├── app.py             # Main API server
│   └── voice_bot.py       # Standalone voice bot
├── start_backend.sh       # Backend startup script
└── update-ip.sh          # Network configuration
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙋‍♂️ Support

For support and questions:

- Create an issue on GitHub
- Check the community platform help desk
- Use the voice companion for assistance

---

**Built with ❤️ for Hong Kong's elderly community**
