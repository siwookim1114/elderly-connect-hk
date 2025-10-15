# Elderly Connect - AI-Powered Community Help Platform

A complete full-stack application for elderly community help post management with voice and text support, powered by LLM agents.

---

## 🚀 Quick Start (One Command!)

```bash
docker-compose up --build -d
```

**That's it!** All services start automatically:
- ✅ MongoDB database
- ✅ Ollama LLM server (llama3.1)
- ✅ FastAPI backend with AI agent
- ✅ React web frontend

**Access the application:**
- **Web App**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## 📋 What's Included

### Backend Services
- **FastAPI REST API** - Modern async Python web framework
- **LLM Agent** - Intelligent help post management with LangChain & Ollama
- **Voice Interface** - Speech-to-text and text-to-speech capabilities
- **MongoDB** - NoSQL database for posts and users
- **Ollama** - Local LLM server running llama3.1

### Frontend
- **React Web App** - Modern responsive web interface
- **Voice Recording** - Browser-based speech input
- **Text Input** - Traditional typing interface
- **Real-time Updates** - Automatic post refresh

---

## 🎯 Key Features

### ✨ Core Functionality
- 📝 **Create Help Posts** - Text or voice input
- 👀 **View All Posts** - Beautiful card-based UI
- ✏️ **Edit Posts** - Smart AI-powered updates with text summarization
- 🗑️ **Delete Posts** - Remove completed requests
- 🎤 **Voice Commands** - Hands-free operation
- 🔊 **Voice Responses** - Hear agent feedback (optional)
- 🤖 **AI Classification** - Auto-categorize CRUD operations
- 🏷️ **Skill Extraction** - Automatic skill tagging
- 📊 **Multi-post Support** - Multiple help requests per user

### 🎨 User Experience
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- 🔄 **Pull-to-Refresh** - Easy data updates
- ⚡ **Real-time Feedback** - Loading states & animations
- 🎨 **Accessible Design** - Large text, high contrast
- 🌐 **Multi-language Ready** - Extensible for Cantonese/Mandarin

---

## 📦 Prerequisites

### Required
- **Docker Desktop** (or Docker Engine + Docker Compose)
- **8GB RAM minimum** (16GB recommended for larger Ollama models)
- **20GB free disk space** (for Docker images and models)

### Installation

#### macOS
```bash
# Install Docker Desktop
brew install --cask docker
# Start Docker Desktop from Applications
```

#### Linux
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt-get install docker-compose-plugin
```

#### Windows
Download and install [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)

---

## 🔧 Configuration

### Environment Variables

Copy the example environment file:

```bash
cp env.example .env
```

Default configuration (works out of the box):

```env
MONGODB_URL=mongodb://mongodb:27017
MONGODB_DB=community_platform
OLLAMA_URL=http://ollama:11434
OLLAMA_MODEL=llama3.1
BACKEND_PORT=8000
```

### Adjusting Docker Memory

If you want to use larger Ollama models:

1. Open Docker Desktop
2. Go to Settings → Resources
3. Increase Memory to 16GB or more
4. Click "Apply & Restart"

---

## 📊 Architecture

```
┌─────────────────────────────────────────┐
│         Docker Compose                   │
│                                          │
│  ┌──────────┐  ┌──────────┐            │
│  │ MongoDB  │  │  Ollama  │            │
│  │  :27017  │  │  :11434  │            │
│  └────┬─────┘  └────┬─────┘            │
│       │             │                   │
│       └──────┬──────┘                   │
│              │                           │
│         ┌────▼─────┐                    │
│         │ FastAPI  │                    │
│         │ Backend  │                    │
│         │  :8000   │                    │
│         └────┬─────┘                    │
│              │                           │
│         ┌────▼─────┐                    │
│         │  React   │                    │
│         │   Web    │                    │
│         │  :3000   │                    │
│         └──────────┘                    │
└──────────────────────────────────────────┘
```

---

## 🔌 API Endpoints

### Health & Status
- `GET /health` - System health check
- `GET /` - API information

### Posts Management
- `GET /api/posts/{user_id}` - Get all user posts
- `DELETE /api/posts/{post_id}` - Delete a specific post

### Query Processing
- `POST /api/query/text` - Process text query with AI agent
- `POST /api/query/voice` - Process voice query (audio upload)

### Documentation
- `GET /docs` - Interactive Swagger UI
- `GET /redoc` - Alternative ReDoc documentation

---

## 🧪 Testing

### Test Backend API

```bash
# Health check
curl http://localhost:8000/health

# Get posts for user
curl http://localhost:8000/api/posts/001

# Create a new post
curl -X POST http://localhost:8000/api/query/text \
  -H "Content-Type: application/json" \
  -d '{
    "user_info": {"user_id": "001", "role": "elderly", "location": "Sham Shui Po"},
    "query": "I need help with grocery shopping"
  }'

# Update a post
curl -X POST http://localhost:8000/api/query/text \
  -H "Content-Type: application/json" \
  -d '{
    "user_info": {"user_id": "001", "role": "elderly", "location": "Sham Shui Po"},
    "query": "Change my grocery shopping post to computer setup help"
  }'
```

### Test Ollama

```bash
# Check available models
curl http://localhost:11434/api/tags

# Test model generation
curl -X POST http://localhost:11434/api/generate \
  -d '{"model": "llama3.1", "prompt": "Say hello", "stream": false}'
```

### Test MongoDB

```bash
# Connect to MongoDB
mongosh mongodb://localhost:27017/community_platform

# In mongosh:
show collections
db.helpposts.find()
db.users.find()
```

---

## 🛠️ Development

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f ollama
docker-compose logs -f mongodb
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v

# Or use the convenience script
./docker-stop.sh
```

### Rebuild After Code Changes

```bash
# Rebuild and restart
docker-compose up --build -d

# Rebuild specific service
docker-compose up --build -d backend
```

---

## 🐛 Troubleshooting

### Services Not Starting

```bash
# Check Docker is running
docker info

# Check service status
docker-compose ps

# View logs for errors
docker-compose logs

# Restart everything
docker-compose down
docker-compose up --build -d
```

### Port Already in Use

```bash
# Find process using port
lsof -i :8000
lsof -i :3000
lsof -i :27017
lsof -i :11434

# Kill process
kill -9 <PID>

# Or change ports in docker-compose.yml
```

### Ollama Model Issues

```bash
# Check Ollama logs
docker-compose logs ollama

# Manually pull model
docker-compose exec ollama ollama pull llama3.1

# Check available models
docker-compose exec ollama ollama list

# Restart backend after model change
docker-compose restart backend
```

### MongoDB Connection Issues

```bash
# Check MongoDB logs
docker-compose logs mongodb

# Access MongoDB shell
docker-compose exec mongodb mongosh

# Restart MongoDB
docker-compose restart mongodb
```

### Backend Errors

```bash
# View detailed logs
docker-compose logs -f backend

# Restart backend
docker-compose restart backend

# Rebuild backend
docker-compose up --build -d backend
```

### Frontend Not Loading

```bash
# Check frontend logs
docker-compose logs frontend

# Restart frontend
docker-compose restart frontend

# Clear browser cache and reload
```

### Out of Memory Error

**Solution:**
1. Open Docker Desktop
2. Go to Settings → Resources
3. Increase Memory allocation (16GB recommended)
4. Click "Apply & Restart"
5. Restart services: `docker-compose down && docker-compose up -d`

---

## 📱 Using the Web App

### Creating Posts

1. Open http://localhost:3000
2. Navigate to "Create" tab
3. **Option A - Text Input:**
   - Type your request in the text box
   - Click "Submit Request"
4. **Option B - Voice Input:**
   - Click the 🎤 microphone button
   - Grant microphone permission if asked
   - Speak your request
   - Click stop when done
   - Your voice will be transcribed and processed

### Viewing Posts

1. Click "Posts" tab
2. See all your help requests
3. Click 🔄 Refresh to update
4. Each post shows:
   - Help request text
   - Required skills
   - Location
   - Creation date

### Deleting Posts

1. Go to "Posts" tab
2. Find the post you want to remove
3. Click 🗑️ Delete button
4. Confirm deletion
5. Post is removed from database

### Example Queries

**Creating Posts:**
- "I need help with grocery shopping"
- "I need help with computer setup"
- "I need help moving furniture"

**Updating Posts:**
- "Change my grocery shopping post to cooking help"
- "Update my computer post to say I need help with software installation"

**Deleting Posts:**
- "I found someone to help with grocery shopping. Delete that post."
- "Remove my computer setup post"

---

## 🚀 Production Deployment

### Cloud Platforms

#### AWS ECS
```bash
# Install ECS CLI
ecs-cli compose up

# Or use docker-compose with ECS context
docker context create ecs myecs
docker context use myecs
docker compose up
```

#### Google Cloud Run
```bash
gcloud run deploy elderly-connect-backend \
  --source ./backend \
  --platform managed \
  --region us-central1
```

#### Azure Container Instances
```bash
az container create \
  --resource-group elderly-connect \
  --file docker-compose.yml
```

#### DigitalOcean App Platform
```bash
# Use the App Platform UI or doctl CLI
doctl apps create --spec .do/app.yaml
```

---

## 🔐 Security Best Practices

### For Production

1. **Use Environment Variables** for sensitive data
2. **Enable Authentication** (JWT, OAuth)
3. **Add API Rate Limiting**
4. **Use HTTPS/SSL** for all connections
5. **Restrict CORS** to specific origins
6. **Regular Security Updates**:
   ```bash
   docker-compose pull
   docker-compose up --build -d
   ```
7. **Use Secrets Management** (Docker secrets, AWS Secrets Manager, etc.)
8. **Implement Input Validation** and sanitization
9. **Enable MongoDB Authentication**
10. **Use Non-root Users** in containers

---

## 📈 Performance Optimization

### Ollama Performance

```yaml
# In docker-compose.yml
ollama:
  environment:
    - OLLAMA_MAX_LOADED_MODELS=1
    - OLLAMA_NUM_PARALLEL=1
```

### MongoDB Performance

```yaml
# In docker-compose.yml
mongodb:
  command: mongod --wiredTigerCacheSizeGB 2
```

### Enable GPU for Ollama (if available)

```yaml
# In docker-compose.yml
ollama:
  deploy:
    resources:
      reservations:
        devices:
          - driver: nvidia
            count: all
            capabilities: [gpu]
```

---

## 📚 Project Structure

```
elderly-connect-hk/
├── README.md                        # This file
├── docker-compose.yml               # Service orchestration
├── docker-start.sh                  # Start script
├── docker-stop.sh                   # Stop script
├── env.example                      # Environment template
│
├── backend/
│   ├── Dockerfile                   # Backend container
│   ├── requirements.txt             # Python dependencies
│   ├── api/
│   │   └── main.py                  # FastAPI application
│   └── agents/
│       ├── help_post_agent.py       # Main LLM agent
│       ├── voice_interface.py       # Voice functionality
│       ├── voice_help_post_agent.py # Voice-enabled agent
│       └── utils/
│           ├── callback_handler.py  # LangChain callbacks
│           ├── conversation_buffer_safe.py  # Memory management
│           └── mongo.py             # MongoDB connection
│
├── frontend/
│   ├── Dockerfile                   # Frontend container
│   ├── nginx.conf                   # Nginx configuration
│   ├── package.json                 # Dependencies
│   ├── public/
│   │   └── index.html               # HTML template
│   └── src/
│       ├── App.js                   # Main React component
│       ├── App.css                  # Styling
│       ├── index.js                 # Entry point
│       └── config.js                # API configuration
│
├── mongodb/
│   └── init-mongo.js                # Database initialization
│
└── nginx/
    └── nginx.conf                   # Reverse proxy config (optional)
```

---

## 🎯 Roadmap

- [ ] User authentication & authorization
- [ ] Push notifications for post updates
- [ ] Post matching (connect helpers with elderly)
- [ ] Multi-language support (Cantonese, Mandarin)
- [ ] Offline mode with local storage
- [ ] Analytics dashboard for community insights
- [ ] Video call integration
- [ ] Community forums and messaging
- [ ] Mobile app (React Native)
- [ ] Advanced voice commands and wake words

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

---

## 📄 License

MIT License - Free to use and modify

---

## ⭐ Key Technologies

- **Backend**: FastAPI, LangChain, Python 3.13
- **Frontend**: React, JavaScript
- **Database**: MongoDB 7.0
- **LLM**: Ollama (llama3.1)
- **Voice**: SpeechRecognition, gTTS
- **Containerization**: Docker, Docker Compose
- **Web Server**: Nginx

---

## 📞 Support & Help

### Quick Commands

```bash
# Start everything
./docker-start.sh

# Stop everything
./docker-stop.sh

# View all logs
docker-compose logs -f

# Check service status
docker-compose ps

# Restart a service
docker-compose restart backend

# Access MongoDB shell
docker-compose exec mongodb mongosh

# Access backend shell
docker-compose exec backend bash
```

### Getting Help

1. Check the [Troubleshooting](#-troubleshooting) section
2. View logs: `docker-compose logs -f`
3. Check API docs: http://localhost:8000/docs
4. Verify all services are healthy: `docker-compose ps`

---

## 🎉 Success Checklist

- [ ] Docker Desktop installed and running
- [ ] `docker-compose up --build -d` completes successfully
- [ ] All containers show "healthy" or "running" status
- [ ] Backend API responds at http://localhost:8000/health
- [ ] Frontend loads at http://localhost:3000
- [ ] Ollama responds at http://localhost:11434/api/tags
- [ ] MongoDB accessible at mongodb://localhost:27017
- [ ] Can create, view, update, and delete posts
- [ ] Voice input works (if microphone available)

---

**Built with ❤️ for accessibility and elderly care**

🚀 **Get started now:** `docker-compose up --build -d`

**Then open:** http://localhost:3000
