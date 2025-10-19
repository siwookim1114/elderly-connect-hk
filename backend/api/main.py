"""
FastAPI Backend for Elderly Connect Help Post Agent
Provides REST API endpoints for the React Native frontend
"""

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import json
import sys
import os
from pathlib import Path

# Add parent directory to path to import agents
sys.path.append(str(Path(__file__).parent.parent))

from agents.help_post_agent import HelpPostAgent
from agents.voice_interface import VoiceInterface
from agents.utils.mongo import ElderDB
from bson.objectid import ObjectId
import speech_recognition as sr
import io
import base64
from gtts import gTTS
import tempfile
from typing import Optional

# Initialize FastAPI app
app = FastAPI(
    title="Elderly Connect API",
    description="API for managing help posts with voice and text support",
    version="1.0.0"
)

# Add CORS middleware to allow React Native app to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MONGODB_URL = os.getenv('MONGODB_URL', 'mongodb://localhost:27017')
MONGODB_DB = os.getenv('MONGODB_DB', 'community_platform')
OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'llama3.1')

# Initialize services
help_post_agent = HelpPostAgent(model=OLLAMA_MODEL)

# Voice interface without microphone (for Docker environment)
# Microphone will be handled on the client side (React Native app)
voice_interface = VoiceInterface(use_gtts=True, enable_microphone=False)

db = ElderDB()
helpposts_collection = db.connect_collection(MONGODB_DB, 'helpposts')
applications_collection = db.connect_collection(MONGODB_DB, 'applications')
users_collection = db.connect_collection(MONGODB_DB, 'users')


# Pydantic models for request/response
class UserInfo(BaseModel):
    user_id: str
    role: str
    location: str


class TextQueryRequest(BaseModel):
    user_info: UserInfo
    query: str
    use_voice_response: bool = False


class QueryResponse(BaseModel):
    success: bool
    message: str
    output: Optional[str] = None
    audio_response: Optional[str] = None
    error: Optional[str] = None


class Post(BaseModel):
    id: str
    user_id: str
    role: str
    location: str
    text: str
    required_skills: List[str]
    interests: List[str]


class PostsResponse(BaseModel):
    success: bool
    posts: List[Dict[str, Any]]
    count: int


class FastCreateRequest(BaseModel):
    user_id: str
    query: str


class ApplicationRequest(BaseModel):
    post_id: str
    helper_id: str
    helper_name: str
    helper_location: str
    message: Optional[str] = None


class ApplicationResponse(BaseModel):
    success: bool
    message: str
    application_id: Optional[str] = None


class SelectHelperRequest(BaseModel):
    post_id: str
    application_id: str
    helper_id: str


# Health check endpoint
@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "Elderly Connect API",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    """Detailed health check."""
    try:
        # Check MongoDB connection
        db_status = "connected" if helpposts_collection is not None else "disconnected"
        
        return {
            "status": "healthy",
            "database": db_status,
            "agent": "initialized",
            "voice": "initialized"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }


@app.get("/api/redirect/community-platform")
async def redirect_to_community_platform():
    """
    Redirect to the community platform.
    This endpoint can be used by other applications to redirect users to the community platform.
    
    Returns:
        RedirectResponse to localhost:3000 (community platform)
    """
    community_platform_url = os.getenv('COMMUNITY_PLATFORM_URL', 'http://localhost:3000')
    return RedirectResponse(url=community_platform_url, status_code=302)


@app.get("/api/redirect/community-platform/{user_id}")
async def redirect_to_community_platform_with_user(user_id: str):
    """
    Redirect to the community platform with a specific user ID.
    This endpoint can be used by other applications to redirect users to the community platform
    with their user context.
    
    Args:
        user_id: User ID to pass to the community platform
    
    Returns:
        RedirectResponse to localhost:3000 with user parameter
    """
    community_platform_url = os.getenv('COMMUNITY_PLATFORM_URL', 'http://localhost:3000')
    redirect_url = f"{community_platform_url}?user_id={user_id}"
    return RedirectResponse(url=redirect_url, status_code=302)


@app.get("/api/community-platform/url")
async def get_community_platform_url():
    """
    Get the community platform URL as JSON.
    This endpoint returns the URL without redirecting, useful for mobile apps
    or when you need the URL programmatically.
    
    Returns:
        JSON response with the community platform URL
    """
    community_platform_url = os.getenv('COMMUNITY_PLATFORM_URL', 'http://localhost:3000')
    return {
        "success": True,
        "url": community_platform_url,
        "message": "Community platform URL retrieved successfully"
    }


@app.get("/api/community-platform/url/{user_id}")
async def get_community_platform_url_with_user(user_id: str):
    """
    Get the community platform URL with user ID as JSON.
    This endpoint returns the URL with user parameter without redirecting.
    
    Args:
        user_id: User ID to include in the URL
    
    Returns:
        JSON response with the community platform URL including user parameter
    """
    community_platform_url = os.getenv('COMMUNITY_PLATFORM_URL', 'http://localhost:3000')
    url_with_user = f"{community_platform_url}?user_id={user_id}"
    return {
        "success": True,
        "url": url_with_user,
        "user_id": user_id,
        "message": "Community platform URL with user ID retrieved successfully"
    }


# Get all posts for a user
@app.get("/api/posts/{user_id}", response_model=PostsResponse)
async def get_user_posts(user_id: str):
    """
    Get all help posts for a specific user.
    
    Args:
        user_id: User ID to fetch posts for
    
    Returns:
        List of posts for the user
    """
    try:
        posts = list(helpposts_collection.find({"user_id": user_id}))
        
        # Convert ObjectId to string for JSON serialization
        for post in posts:
            post['_id'] = str(post['_id'])
            post['id'] = post['_id']  # Add id field for frontend
        
        return {
            "success": True,
            "posts": posts,
            "count": len(posts)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Get browseable posts for a user (opposite role, open, excluding self)
@app.get("/api/posts/browse/{user_id}")
async def browse_posts(user_id: str):
    try:
        user = users_collection.find_one({"user_id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        target_role = 'elderly' if user.get('role') == 'youth' else 'youth'

        posts = list(helpposts_collection.find({
            "user_id": {"$ne": user_id},
            "role": target_role,
            "$or": [{"status": {"$exists": False}}, {"status": "open"}]
        }))

        for post in posts:
            post['_id'] = str(post['_id'])
            post['id'] = post['_id']

        return {"success": True, "posts": posts, "count": len(posts)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Fast create post without LLM (instant)
@app.post("/api/posts")
async def fast_create_post(body: FastCreateRequest):
    """
    Create a post instantly using only user_id and query.
    Role and location are fetched from users collection.
    Summarization is done minimally; no LLM to keep it fast.
    """
    try:
        user = users_collection.find_one({"user_id": body.user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Minimal summarization: trim leading phrases
        q = body.query.strip()
        for prefix in ["I need", "I need help with", "Need help with", "Please help with", "Help with"]:
            if q.lower().startswith(prefix.lower()):
                q = q[len(prefix):].strip().lstrip(':').strip()
        if not q:
            q = body.query.strip()

        post_doc = {
            "user_id": body.user_id,
            "role": user.get("role", "unknown"),
            "location": user.get("location", "unknown"),
            "interests": user.get("interests", []),
            "text": q,
            "required_skills": [],
            "status": "open",
            "matched_helper_id": None,
            "matched_helper_name": None,
        }

        res = helpposts_collection.insert_one(post_doc)
        post_doc["_id"] = str(res.inserted_id)
        post_doc["id"] = post_doc["_id"]

        return {
            "success": True,
            "message": "Post created",
            "post": post_doc,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Process text query
@app.post("/api/query/text", response_model=QueryResponse)
async def process_text_query(request: TextQueryRequest):
    """
    Process a text query through the help post agent.
    
    Args:
        request: TextQueryRequest with user info and query
    
    Returns:
        Agent response with optional audio
    """
    try:
        # Heuristic fast paths to avoid agent loops
        intent = _classify_intent(request.query or '')
        if intent == 'delete':
            match_text = _extract_match_text(request.query)
            # Try to delete by about keyword for this user
            try:
                candidate = list(helpposts_collection.find({
                    "user_id": request.user_info.user_id,
                    "text": {"$regex": match_text, "$options": "i"}
                }).sort("_id", -1).limit(1))
                if candidate:
                    pid = candidate[0]["_id"]
                    res = helpposts_collection.delete_one({"_id": pid})
                    return {"success": True, "message": "Post deleted", "output": f"Deleted post {str(pid)}"}
            except Exception:
                pass
            # Fall back to agent if not found
        elif intent == 'create':
            # Use fast create for speed
            doc = {
                "user_id": request.user_info.user_id,
                "role": request.user_info.role,
                "location": request.user_info.location,
                "interests": [],
                "text": (request.query or '').replace('I need', '').replace('help with', '').strip(),
                "required_skills": [],
                "status": "open",
                "matched_helper_id": None,
                "matched_helper_name": None,
            }
            res = helpposts_collection.insert_one(doc)
            return {"success": True, "message": "Post created", "output": f"Post {str(res.inserted_id)} created"}

        # Default: run the agent for nuanced update/delete
        state = {"user": request.user_info.dict(), "query": request.query}
        result = help_post_agent.run(state)
        output = result.get('output', 'Request processed successfully')
        audio_response = _text_to_audio(output) if request.use_voice_response else None
        return {"success": True, "message": "Query processed successfully", "output": output, "audio_response": audio_response}
        
    except Exception as e:
        return {
            "success": False,
            "message": "Error processing query",
            "error": str(e)
        }


# Process voice query
@app.post("/api/query/voice", response_model=QueryResponse)
async def process_voice_query(
    audio: UploadFile = File(...),
    user_info: str = Form(...)
):
    """
    Process a voice query through the help post agent.
    
    Args:
        audio: Audio file containing user's voice
        user_info: JSON string with user information
    
    Returns:
        Agent response with audio
    """
    try:
        # Parse user info
        user_info_dict = json.loads(user_info)

        # Persist upload to temp file
        original_bytes = await audio.read()
        suffix = ''.join(Path(audio.filename or 'voice').suffixes) or '.webm'
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_in:
            tmp_in.write(original_bytes)
            in_path = tmp_in.name

        # Determine if we need conversion (SpeechRecognition supports wav/aiff/flac only)
        target_wav = tempfile.NamedTemporaryFile(delete=False, suffix='.wav').name
        ext = suffix.lower()

        try:
            if ext in ['.wav', '.aiff', '.aif', '.aifc', '.flac']:
                # Use as-is
                source_path = in_path
                if ext != '.wav':
                    # Normalize to wav for consistent handling
                    import subprocess
                    subprocess.run(['ffmpeg', '-y', '-i', in_path, '-ac', '1', '-ar', '16000', target_wav], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                    source_path = target_wav
                else:
                    source_path = in_path
            else:
                # Convert webm/m4a/mp3/etc → wav via ffmpeg
                import subprocess
                subprocess.run(['ffmpeg', '-y', '-i', in_path, '-ac', '1', '-ar', '16000', target_wav], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                source_path = target_wav

            # Validate audio duration/size and convert to text using speech recognition
            recognizer = sr.Recognizer()
            import wave, os
            try:
                with wave.open(source_path, 'rb') as wf:
                    frames = wf.getnframes()
                    rate = wf.getframerate()
                    duration = frames / float(rate or 16000)
            except Exception:
                duration = 0.0

            file_size = os.path.getsize(source_path) if os.path.exists(source_path) else 0
            if duration < 0.6 or file_size < 2000:
                return {"success": False, "message": "Audio too short or silent. Please speak for at least 1 second.", "error": f"duration={duration:.2f}s size={file_size}B"}

            with sr.AudioFile(source_path) as source:
                audio_content = recognizer.record(source)
                text = recognizer.recognize_google(audio_content)
        except sr.UnknownValueError:
            text = await _whisper_fallback(source_path)
            if not text:
                return {"success": False, "message": "Could not understand audio", "error": "Speech recognition failed"}
        except sr.RequestError as e:
            # Common 'Bad Request' occurs for silent/too-short/unsupported audio
            err = str(e)
            friendly = "Speech recognition service error"
            if 'Bad Request' in err:
                friendly = "Bad audio: please speak a bit longer and try again"
            # Try Whisper fallback
            text = await _whisper_fallback(source_path)
            if not text:
                return {"success": False, "message": friendly, "error": err}
        except Exception as e:
            return {"success": False, "message": "Audio processing error", "error": str(e)}
        finally:
            # Cleanup temp files
            try:
                if os.path.exists(in_path):
                    os.remove(in_path)
            except:
                pass
            try:
                if os.path.exists(target_wav):
                    os.remove(target_wav)
            except:
                pass
        
        # Prepare state for agent
        state = {
            "user": user_info_dict,
            "query": text
        }
        
        # Run the agent
        result = help_post_agent.run(state)
        
        # Extract output
        output = result.get('output', 'Request processed successfully')
        
        # Generate audio response
        audio_response = _text_to_audio(output)
        
        return {
            "success": True,
            "message": "Voice query processed successfully",
            "output": f"You said: {text}\n\n{output}",
            "audio_response": audio_response
        }
        
    except Exception as e:
        return {
            "success": False,
            "message": "Error processing voice query",
            "error": str(e)
        }


# Delete a specific post
@app.delete("/api/posts/{post_id}")
async def delete_post(post_id: str):
    """
    Delete a specific help post.
    
    Args:
        post_id: ID of the post to delete
    
    Returns:
        Deletion confirmation
    """
    try:
        result = helpposts_collection.delete_one({"_id": ObjectId(post_id)})
        
        if result.deleted_count > 0:
            return {
                "success": True,
                "message": "Post deleted successfully",
                "deleted_count": result.deleted_count
            }
        else:
            raise HTTPException(status_code=404, detail="Post not found")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Apply to help a post
@app.post("/api/posts/{post_id}/apply", response_model=ApplicationResponse)
async def apply_to_post(post_id: str, application: ApplicationRequest):
    """
    Apply to help with a specific post.
    
    Args:
        post_id: ID of the post to apply to
        application: Application details including helper information
    
    Returns:
        Application confirmation
    """
    try:
        # Verify post exists and is open
        post = helpposts_collection.find_one({"_id": ObjectId(post_id)})
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        if post.get('status') != 'open':
            raise HTTPException(status_code=400, detail="Post is no longer accepting applications")
        
        # Get helper's role from users collection
        helper = users_collection.find_one({"user_id": application.helper_id})
        if helper:
            helper_role = helper.get('role', 'unknown')
            post_role = post.get('role', 'unknown')
            
            if helper_role == post_role:
                raise HTTPException(
                    status_code=400, 
                    detail=f"{helper_role.capitalize()} users can only help {('elderly' if helper_role == 'youth' else 'youth')} users"
                )
        
        # Check if user already applied
        existing_application = applications_collection.find_one({
            "post_id": post_id,
            "helper_id": application.helper_id,
            "status": {"$ne": "rejected"}
        })
        
        if existing_application:
            raise HTTPException(status_code=400, detail="You have already applied to this post")
        
        # Create application
        application_doc = {
            "post_id": post_id,
            "post_owner_id": post['user_id'],
            "helper_id": application.helper_id,
            "helper_name": application.helper_name,
            "helper_location": application.helper_location,
            "message": application.message or "",
            "status": "pending",  # pending, accepted, rejected
            "created_at": ObjectId().generation_time,
            "updated_at": ObjectId().generation_time
        }
        
        result = applications_collection.insert_one(application_doc)
        
        return {
            "success": True,
            "message": "Application submitted successfully",
            "application_id": str(result.inserted_id)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Get applications for a post (for post owner)
@app.get("/api/posts/{post_id}/applications")
async def get_post_applications(post_id: str, user_id: str):
    """
    Get all applications for a specific post.
    Only the post owner can view applications.
    
    Args:
        post_id: ID of the post
        user_id: User ID of the requester (must be post owner)
    
    Returns:
        List of applications
    """
    try:
        # Verify post exists and user is the owner
        post = helpposts_collection.find_one({"_id": ObjectId(post_id)})
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        if post['user_id'] != user_id:
            raise HTTPException(status_code=403, detail="You can only view applications for your own posts")
        
        # Get all applications for this post
        applications = list(applications_collection.find({
            "post_id": post_id,
            "status": {"$ne": "rejected"}
        }).sort("created_at", -1))
        
        # Convert ObjectId to string
        for app in applications:
            app['_id'] = str(app['_id'])
            app['id'] = app['_id']
        
        return {
            "success": True,
            "applications": applications,
            "count": len(applications),
            "post_status": post.get('status', 'open')
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Select a helper and match (Thank you button)
@app.post("/api/posts/{post_id}/select-helper")
async def select_helper(post_id: str, selection: SelectHelperRequest):
    """
    Select a helper for the post and create a match.
    This locks the post and notifies the selected helper.
    
    Args:
        post_id: ID of the post
        selection: Selection details including application_id and helper_id
    
    Returns:
        Match confirmation
    """
    try:
        # Verify post exists
        post = helpposts_collection.find_one({"_id": ObjectId(post_id)})
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        if post.get('status') != 'open':
            raise HTTPException(status_code=400, detail="Post is already matched")
        
        # Verify application exists
        application = applications_collection.find_one({"_id": ObjectId(selection.application_id)})
        if not application:
            raise HTTPException(status_code=404, detail="Application not found")
        
        if application['helper_id'] != selection.helper_id:
            raise HTTPException(status_code=400, detail="Helper ID mismatch")
        
        # Update post status to matched
        helpposts_collection.update_one(
            {"_id": ObjectId(post_id)},
            {
                "$set": {
                    "status": "matched",
                    "matched_helper_id": selection.helper_id,
                    "matched_helper_name": application['helper_name'],
                    "matched_at": ObjectId().generation_time
                }
            }
        )
        
        # Update selected application to accepted
        applications_collection.update_one(
            {"_id": ObjectId(selection.application_id)},
            {
                "$set": {
                    "status": "accepted",
                    "updated_at": ObjectId().generation_time
                }
            }
        )
        
        # Reject all other pending applications
        applications_collection.update_many(
            {
                "post_id": post_id,
                "_id": {"$ne": ObjectId(selection.application_id)},
                "status": "pending"
            },
            {
                "$set": {
                    "status": "rejected",
                    "updated_at": ObjectId().generation_time
                }
            }
        )
        
        return {
            "success": True,
            "message": "Helper selected successfully! The post is now matched.",
            "matched_helper_id": selection.helper_id,
            "matched_helper_name": application['helper_name']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Get user's applications (for helpers to see their applications)
@app.get("/api/users/{user_id}/applications")
async def get_user_applications(user_id: str):
    """
    Get all applications submitted by a user.
    
    Args:
        user_id: User ID
    
    Returns:
        List of applications with post details
    """
    try:
        # Get all applications by this user
        applications = list(applications_collection.find({
            "helper_id": user_id
        }).sort("created_at", -1))
        
        # Enrich with post details
        for app in applications:
            app['_id'] = str(app['_id'])
            app['id'] = app['_id']
            
            # Get post details
            post = helpposts_collection.find_one({"_id": ObjectId(app['post_id'])})
            if post:
                app['post_text'] = post.get('text', '')
                app['post_location'] = post.get('location', '')
                app['post_status'] = post.get('status', 'open')
        
        return {
            "success": True,
            "applications": applications,
            "count": len(applications)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Helper function to convert text to audio
def _text_to_audio(text: str) -> str:
    """
    Convert text to audio and return as base64 string.
    
    Args:
        text: Text to convert to speech
    
    Returns:
        Base64 encoded audio data
    """
    try:
        # Generate speech
        tts = gTTS(text=text, lang='en', slow=False)
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as fp:
            temp_file = fp.name
            tts.save(temp_file)
            
            # Read file and encode to base64
            with open(temp_file, 'rb') as f:
                audio_bytes = f.read()
                audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
        
        # Clean up temp file
        try:
            os.remove(temp_file)
        except:
            pass
        
        return audio_base64
        
    except Exception as e:
        print(f"Error generating audio: {e}")
        return None


# Lightweight intent detection for robustness (avoid agent loops)
def _classify_intent(query: str) -> str:
    q = (query or '').lower()
    delete_kw = [
        'delete', 'remove', 'close', 'cancel', 'no longer need', 'found someone', 'please delete'
    ]
    update_kw = ['update', 'modify', 'change', 'correct', 'actually', 'instead', 'should be', 'made a mistake']
    create_kw = ['i need help', 'i need another help', 'help with']
    if any(k in q for k in delete_kw):
        return 'delete'
    if any(k in q for k in update_kw):
        return 'update'
    if any(k in q for k in create_kw):
        return 'create'
    return 'unknown'


def _extract_match_text(query: str) -> str:
    import re
    m = re.search(r'"([^"]+)"', query)
    if m:
        return m.group(1).strip()
    m = re.search(r'(?:about|related to|regarding)\s+([^\.,]+)', query, re.IGNORECASE)
    if m:
        return m.group(1).strip()
    parts = query.strip().split()
    return ' '.join(parts[-3:]) if parts else ''


async def _whisper_fallback(audio_path: str) -> Optional[str]:
    """Fallback STT placeholder; returns None when optional deps are not present."""
    return None

# Run the server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)

