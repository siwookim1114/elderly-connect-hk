# 🌺 Memory Garden FastAPI

<div align="center">

![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)
![Ollama](https://img.shields.io/badge/Ollama-000000?style=for-the-badge&logo=ollama&logoColor=white)

**Transform your precious memories into beautiful stories with AI-powered storytelling and multilingual audio support**

_A comprehensive FastAPI service that turns your photos into vivid narratives using advanced vision-language models with Cantonese translation and text-to-speech capabilities_

</div>

---

## ✨ Features

🤖 **AI-Powered Storytelling** - Generate compelling narratives using Ollama's LLaVA vision-language model  
🖼️ **Multi-Photo Processing** - Upload up to 10 photos and create cohesive stories from multiple images  
🎵 **Multilingual Audio Support** - Automatic Cantonese translation and text-to-speech synthesis  
📁 **Comprehensive Storage System** - JSON-based persistence with atomic operations and photo management  
🔄 **Full CRUD Operations** - Complete story lifecycle management with photo updates and deletions  
🌐 **RESTful API Design** - Well-structured endpoints with proper HTTP methods and status codes  
⚡ **High Performance** - Async operations with thread pooling for optimal file I/O  
📖 **Interactive Documentation** - Auto-generated API docs with Swagger UI  
🔒 **Thread-Safe Operations** - Concurrent request handling with proper locking mechanisms  
🎨 **Rich Context Integration** - Include date, location, weather, and personal metadata

## 🚀 Quick Start

### Prerequisites

- **Python 3.8+**
- **[Ollama](https://ollama.ai/)** installed and running locally
- **LLaVA model** downloaded in Ollama
- **Google Translate API** access (optional for translations)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/Memory-Garden.git
cd Memory-Garden

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Mac/Linux
# or
venv\Scripts\activate     # On Windows

# Install dependencies
pip install fastapi uvicorn python-multipart ollama googletrans==3.1.0a0 gtts
```

### Setup Ollama

```bash
# Start Ollama service
ollama serve

# Pull the LLaVA model
ollama pull llava
```

### Run the Application

```bash
# Navigate to Memory-garden directory
cd "Memory-garden"

# Start the development server
uvicorn main:app --reload

# API available at: http://localhost:8000
# Documentation: http://localhost:8000/docs
```

## 📡 API Reference

### Core Endpoints

#### **Welcome Message**

```http
GET /
```

Returns API information and welcome message.

#### **Generate Story from Photos**

```http
POST /upload/stories
```

Upload photos with metadata and generate AI-powered story.

**Form Parameters:**

- `photos` (files, required): Image files (max 10)
- `date` (string, required): Memory date (YYYY-MM-DD)
- `weather` (string, required): Weather description
- `location` (string, required): Location information

**Response Example:**

```json
{
  "message": "Photo uploaded and story generated successfully.",
  "id": "a1b2c3d4e5f6",
  "date": "2024-05-24",
  "weather": "Sunny with light breeze",
  "location": "Central Park, New York",
  "photos": [
    {
      "id": "photo123",
      "filename": "sunset.jpg",
      "content_type": "image/jpeg",
      "size": 234829,
      "path": "uploads/a1b2c3d4e5f6.jpg"
    }
  ],
  "story": "The golden hour cast its warm glow across Central Park as I captured this perfect moment...",
  "created_at": "2024-05-24T18:30:00Z",
  "updated_at": "2024-05-24T18:30:00Z"
}
```

### Story Management

#### **List All Stories**

```http
GET /stories
```

Retrieve all stored stories with metadata.

#### **Get Specific Story**

```http
GET /stories/{story_id}
```

Retrieve a specific story by its ID.

#### **Update Story**

```http
PUT /stories/{story_id}/photos
```

Update story metadata, photos, and regenerate narrative.

**Form Parameters:**

- `date` (string, optional): Updated date
- `weather` (string, optional): Updated weather
- `location` (string, optional): Updated location
- `keep_photo_ids` (string, optional): Comma-separated IDs of photos to keep
- `photos` (files, optional): New photos to add

#### **Delete Photos from Story**

```http
DELETE /stories/{story_id}/photos?photoIds=id1,id2
```

Remove specific photos from a story and clear the generated narrative.

### Audio Features

#### **Download Cantonese Audio**

```http
GET /stories/{story_id}/audio
```

Download the Cantonese audio file for a story.

#### **Stream Cantonese Audio**

```http
GET /stories/{story_id}/audio/stream
```

Stream Cantonese audio directly in the browser.

### Photo Management

#### **List Story Photos**

```http
GET /stories/{story_id}/photos
```

Get all photos associated with a specific story.

#### **Download Photo**

```http
GET /stories/{story_id}/photos/{photo_id}
```

Download a specific photo file.

## 🏗️ Architecture

### Core Components

#### **OllamaStoryTeller**

Handles AI story generation using the Ollama LLaVA model with contextual prompts.

```python
story_generator = OllamaStoryTeller(ollama_client)
story = story_generator.generate_story(
    prompt=contextual_prompt,
    encoded_images=base64_images
)
```

#### **PhotoStorage**

Manages file system operations with UUID-based naming and CRUD operations.

```python
photo_storage = PhotoStorage(UPLOAD_DIR)
stored_photos = await photo_storage.persist(uploaded_files)
```

#### **StoryRepository**

JSON-based persistence layer with atomic operations and thread safety.

```python
story_repository = StoryRepository(STORIES_FILE)
await story_repository.add(story_record)
```

### Data Models

#### **StoredPhoto**

```python
{
  "id": "unique_uuid",
  "filename": "original_name.jpg",
  "content_type": "image/jpeg",
  "size": 1024000,
  "path": "uploads/uuid.jpg"
}
```

#### **StoryRecord**

```python
{
  "id": "story_uuid",
  "date": "2024-05-24",
  "weather": "Sunny",
  "location": "Central Park",
  "photos": [StoredPhoto, ...],
  "story": "Generated narrative...",
  "created_at": "2024-05-24T18:30:00Z",
  "updated_at": "2024-05-24T18:30:00Z"
}
```

## 🌍 Multilingual Features

### Cantonese Translation

Stories are automatically translated to Cantonese using Google Translate API:

```python
translator = Translator()
cantonese_text = translator.translate(story_text, dest='yue')
```

### Text-to-Speech Synthesis

Cantonese audio files are generated using gTTS (Google Text-to-Speech):

```python
tts = gTTS(text=cantonese_text, lang='yue', slow=False)
tts.save(audio_file_path)
```

### Audio Management

- **Automatic Generation**: Audio files created on-demand
- **Caching**: Generated audio cached for future requests
- **Cleanup**: Audio files deleted when stories are updated
- **Streaming Support**: Both download and streaming endpoints

## 📁 Project Structure

```
Memory-garden/
├── main.py              # Main FastAPI application
├── uploads/             # Photo storage directory
├── data/                # JSON persistence layer
│   └── stories.json     # Story database
└── audio/               # Generated Cantonese audio files
    └── {story_id}_cantonese.mp3
```

## ⚙️ Configuration

### Environment Variables

```bash
# Ollama Configuration
OLLAMA_MODEL=llava
OLLAMA_HOST=http://localhost:11434

# File Paths
UPLOAD_DIR=uploads
DATA_DIR=data
AUDIO_DIR=audio

# API Configuration
MAX_PHOTOS_PER_UPLOAD=10
```

### Model Configuration

```python
OLLAMA_STORY_PROMPT = (
    "You are a compassionate storyteller. Receive a sequence of photos and "
    "the contextual details (date, weather, place). Craft a vivid, coherent "
    "narrative that connects all of the photos into a single memory, written "
    "in the first person. Avoid bullet points and reference visual details "
    "from the images when possible."
)
```

## 🧪 Testing

### Using Interactive Documentation

Visit `http://localhost:8000/docs` for Swagger UI interface.

### cURL Examples

**Upload and Generate Story:**

```bash
curl -X POST "http://localhost:8000/upload/stories" \
  -F "photos=@photo1.jpg" \
  -F "photos=@photo2.jpg" \
  -F "date=2024-05-24" \
  -F "weather=Sunny" \
  -F "location=Central Park"
```

**Get Cantonese Audio:**

```bash
curl -O "http://localhost:8000/stories/{story_id}/audio"
```

**Update Story:**

```bash
curl -X PUT "http://localhost:8000/stories/{story_id}/photos" \
  -F "keep_photo_ids=photo1,photo2" \
  -F "weather=Cloudy" \
  -F "photos=@new_photo.jpg"
```

## 🔧 Advanced Features

### Photo ID Parsing

Flexible input handling for photo IDs:

```python
# Supports various formats
"photo1,photo2,photo3"           # Comma-separated
["photo1", "photo2", "photo3"]   # Array format
'["photo1", "photo2"]'          # JSON string
```

### Atomic Operations

All file operations use atomic writes to prevent data corruption:

```python
temp_path = storage_path.with_suffix(".tmp")
temp_path.write_text(json_data)
temp_path.replace(storage_path)  # Atomic replacement
```

### Error Handling

Comprehensive error handling with proper cleanup:

- Failed uploads trigger photo deletion
- Story generation errors clean up stored files
- Audio generation failures provide fallback responses

## 🚀 Production Deployment

### Docker Support

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Performance Optimization

- **Async Operations**: All I/O operations use async/await
- **Thread Pooling**: CPU-intensive tasks run in thread pools
- **File Streaming**: Large files streamed for memory efficiency
- **Connection Pooling**: Ollama client reuse for AI requests

### Monitoring

- Health check endpoint: `GET /health`
- Metrics integration ready for Prometheus
- Structured logging for production debugging

## 🛠️ Troubleshooting

### Common Issues

**"No module named 'fastapi'"**

```bash
# Ensure virtual environment is activated
source venv/bin/activate
pip install -r requirements.txt
```

**Ollama Connection Errors**

```bash
# Verify Ollama is running
ollama serve
ollama list  # Check if LLaVA model is installed
```

**Translation Errors**

```bash
# Check Google Translate API access
pip install googletrans==3.1.0a0
```

**Audio Generation Issues**

```bash
# Verify gTTS installation
pip install gtts
```

### Performance Issues

- Increase `max_workers` for thread pool operations
- Use SSD storage for better I/O performance
- Consider Redis for caching in production
- Implement connection pooling for database operations

## 🔮 Future Enhancements

- **MongoDB Integration**: Replace JSON storage with MongoDB
- **Multi-language Support**: Add more languages beyond Cantonese
- **Real-time Processing**: WebSocket support for live story generation
- **Advanced AI Models**: Support for GPT-4V and other vision models
- **Cloud Storage**: Integration with AWS S3, Google Cloud Storage
- **Authentication**: User management and story privacy controls
- **Batch Processing**: Handle multiple story generation requests
- **Analytics**: Story generation statistics and user insights

---

<div align="center">

**Built with ❤️ using FastAPI, Ollama, and modern Python**

[Documentation](http://localhost:8000/docs) • [GitHub](https://github.com/your-username/Memory-Garden) • [Issues](https://github.com/your-username/Memory-Garden/issues)

</div>
