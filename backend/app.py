from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import azure.cognitiveservices.speech as speechsdk
import os
import tempfile
import socket
import requests
import threading
import time
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

print("🔥 BACKEND STARTING - CODE IS LOADING!")
print(f"🔑 Azure key loaded: {bool(os.getenv('AZURE_SPEECH_KEY', ''))}")

app = Flask(__name__)

CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Configuration
AZURE_SPEECH_KEY = os.getenv("AZURE_SPEECH_KEY", "")
AZURE_SPEECH_REGION = os.getenv("AZURE_SPEECH_REGION", "southeastasia")
OLLAMA_ENDPOINT = "http://localhost:11434/api/chat"
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1:latest")

# Timeout configurations
AZURE_TRANSCRIPTION_TIMEOUT = 60  # seconds - increased for longer recordings
OLLAMA_RESPONSE_TIMEOUT = 30      # seconds
AZURE_TTS_TIMEOUT = 15            # seconds

def create_speech_config():
    return speechsdk.SpeechConfig(subscription=AZURE_SPEECH_KEY, region=AZURE_SPEECH_REGION)

# Simplified prompts for faster responses
LANGUAGE_CONFIG = {
    "cantonese": {
        "voice_name": "zh-HK-HiuMaanNeural",
        "system_prompt": "你係一個幫助長者嘅AI助手。回答要簡短友善，用自然廣東話。",
        "lang_code": "zh-HK"
    },
    "english": {
        "voice_name": "en-US-JennyNeural", 
        "system_prompt": "You are a helpful AI assistant for elderly users. Keep responses brief and friendly.",
        "lang_code": "en-US"
    }
}

def ollama_reply_quick(user_text: str, language: str) -> str:
    """Fast Ollama response with timeout"""
    config = LANGUAGE_CONFIG.get(language, LANGUAGE_CONFIG['english'])
    
    ollama_payload = {
        'model': OLLAMA_MODEL,
        'messages': [
            {'role': 'system', 'content': config['system_prompt']},
            {'role': 'user', 'content': user_text}
        ],
        'stream': False,
        'options': {
            'temperature': 0.7,
            'num_predict': 100  # Limit response length
        }
    }

    try:
        print(f"🤖 Calling Ollama (timeout: {OLLAMA_RESPONSE_TIMEOUT}s)")
        start_time = time.time()
        
        resp = requests.post(OLLAMA_ENDPOINT, json=ollama_payload, timeout=OLLAMA_RESPONSE_TIMEOUT)
        
        elapsed = time.time() - start_time
        print(f"📡 Ollama response time: {elapsed:.2f}s")

        if resp.status_code >= 400:
            print(f"❌ Ollama error {resp.status_code}")
            return "I'm having trouble thinking right now. Please try again."

        data = resp.json()
        reply = (data.get('message') or {}).get('content', '').strip()
        
        if not reply:
            reply = "I'm here to help. Could you please repeat that?"
            
        print(f"✅ LLM Response ({len(reply)} chars)")
        return reply

    except requests.exceptions.Timeout:
        print("❌ Ollama timeout")
        return "I'm thinking slowly today. Please try a shorter question."
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to Ollama")
        return "I cannot connect to my AI service. Please make sure Ollama is running."
    except Exception as e:
        print(f"❌ LLM error: {e}")
        return "I'm having trouble thinking right now. Please try again."

def transcribe_audio_fast(audio_base64, language='english'):
    """Fast transcription with better error handling"""
    try:
        print(f"🎤 Fast transcription for: {language}")

        # Fix base64 padding
        missing_padding = len(audio_base64) % 4
        if missing_padding:
            audio_base64 += '=' * (4 - missing_padding)

        # Decode audio
        audio_data = base64.b64decode(audio_base64)
        print(f"📊 Audio size: {len(audio_data)} bytes")

        # Save to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_audio:
            temp_audio.write(audio_data)
            audio_path = temp_audio.name

        speech_config = create_speech_config()
        speech_config.speech_recognition_language = "zh-HK" if language == 'cantonese' else "en-US"

        # Set longer timeouts for continuous recording
        speech_config.set_property(speechsdk.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs, "5000")  # 5 seconds initial silence
        speech_config.set_property(speechsdk.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs, "2000")    # 2 seconds end silence
        speech_config.set_property(speechsdk.PropertyId.SpeechServiceConnection_AutoDetectSourceLanguageResultEndPointId, "")

        audio_config = speechsdk.AudioConfig(filename=audio_path)
        speech_recognizer = speechsdk.SpeechRecognizer(
            speech_config=speech_config,
            audio_config=audio_config
        )

        print("🔄 Recognizing speech...")

        # Use continuous recognition instead of recognize_once for better results
        result = speech_recognizer.recognize_once()

        # Cleanup
        try:
            os.unlink(audio_path)
        except:
            pass

        if result.reason == speechsdk.ResultReason.RecognizedSpeech:
            print(f"✅ Transcription: {result.text}")
            return result.text
        elif result.reason == speechsdk.ResultReason.NoMatch:
            print("⚠️ No speech recognized")
            return "I couldn't hear anything. Please try again."
        else:
            print(f"❌ Transcription failed: {result.reason}")
            return "Could not understand audio"

    except Exception as e:
        print(f"❌ Transcription error: {e}")
        return "Audio processing failed"

def generate_audio_fast(text, language='english'):
    """Fast TTS generation"""
    try:
        print(f"🔊 Fast TTS for: {language}")
        
        # Limit text length for faster TTS
        if len(text) > 200:
            text = text[:200] + "..."
            
        speech_config = create_speech_config()
        
        if language == 'cantonese':
            speech_config.speech_synthesis_voice_name = 'zh-HK-HiuMaanNeural'
        else:
            speech_config.speech_synthesis_voice_name = 'en-US-JennyNeural'
        
        speech_config.set_speech_synthesis_output_format(
            speechsdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3
        )
        
        synthesizer = speechsdk.SpeechSynthesizer(speech_config=speech_config, audio_config=None)
        
        print("🔄 Quick speech synthesis...")
        start_time = time.time()
        
        result = synthesizer.speak_text_async(text).get()
        
        elapsed = time.time() - start_time
        print(f"⏱️  TTS time: {elapsed:.2f}s")
        
        if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
            audio_base64 = base64.b64encode(result.audio_data).decode('utf-8')
            print(f"✅ TTS success: {len(audio_base64)} chars")
            return audio_base64
        else:
            print(f"❌ TTS failed: {result.reason}")
            return None
            
    except Exception as e:
        print(f"❌ TTS error: {e}")
        return None

@app.route('/process-voice', methods=['POST', 'OPTIONS'])
def process_voice():
    try:
        print("🎯 PROCESS_VOICE CALLED - FAST VERSION")

        if request.method == 'OPTIONS':
            return '', 204

        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data received'}), 400
        
        audio_base64 = data.get('audio')
        language = data.get('language', 'english')
        
        if not audio_base64:
            return jsonify({'error': 'No audio data'}), 400
        
        print(f"📨 Audio received: {len(audio_base64)} chars")
        
        # Step 1: Fast Transcription
        transcript = transcribe_audio_fast(audio_base64, language)
        print(f"📝 Transcript: {transcript}")
        
        # Step 2: Quick LLM Response
        if not transcript or "couldn't" in transcript.lower() or "failed" in transcript.lower():
            reply_text = "Sorry, I didn't catch that. Please try speaking again."
        else:
            reply_text = ollama_reply_quick(transcript, language)
        
        print(f"💬 Reply: {reply_text}")
        
        # Step 3: Fast Audio Generation
        audio_response = generate_audio_fast(reply_text, language)
        
        response_data = {
            'transcript': transcript,
            'reply': reply_text,
            'detectedLanguage': language,
            'audio': audio_response
        }
        
        if not audio_response:
            response_data['ttsError'] = 'Audio generation failed'
            
        print("✅ Request completed successfully")
        return jsonify(response_data), 200
            
    except Exception as e:
        print(f"❌ Process voice error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Processing failed'}), 500

@app.route('/health', methods=['GET'])
def health():
    from datetime import datetime
    
    azure_status = "configured"
    ollama_status = "unknown"
    
    try:
        speech_config = create_speech_config()
        azure_status = "connected"
    except:
        azure_status = "error"
    
    try:
        response = requests.get('http://localhost:11434/api/tags', timeout=5)
        ollama_status = "running" if response.status_code == 200 else "error"
    except:
        ollama_status = "not_connected"
    
    return jsonify({
        'status': 'Flask server running (optimized)',
        'timestamp': str(datetime.now()),
        'azure_status': azure_status,
        'ollama_status': ollama_status,
        'timeouts': {
            'transcription': AZURE_TRANSCRIPTION_TIMEOUT,
            'ollama': OLLAMA_RESPONSE_TIMEOUT,
            'tts': AZURE_TTS_TIMEOUT
        }
    }), 200

@app.route('/quick-test', methods=['POST'])
def quick_test():
    """Simple text-to-text test without audio"""
    try:
        data = request.get_json()
        text = data.get('text', 'Hello')
        language = data.get('language', 'english')
        
        reply = ollama_reply_quick(text, language)
        
        return jsonify({
            'input': text,
            'reply': reply,
            'language': language
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/text-chat', methods=['POST'])
def text_chat():
    """Text-only chat for testing"""
    try:
        data = request.get_json()
        user_text = data.get('text', 'Hello')
        language = data.get('language', 'english')
        
        reply = ollama_reply_quick(user_text, language)
        
        return jsonify({
            'transcript': user_text,
            'reply': reply,
            'detectedLanguage': language,
            'audio': None
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except Exception:
        return "127.0.0.1"

if __name__ == '__main__':
    PORT = int(os.getenv('PORT', '5002'))
    local_ip = get_local_ip()
    
    print("=" * 60)
    print("🚀 Starting OPTIMIZED Voice Companion Backend")
    print("=" * 60)
    print(f"📍 Local: http://localhost:{PORT}")
    print(f"🌐 Network: http://{local_ip}:{PORT}")
    print(f"⏱️  Timeouts - Transcription: {AZURE_TRANSCRIPTION_TIMEOUT}s, Ollama: {OLLAMA_RESPONSE_TIMEOUT}s, TTS: {AZURE_TTS_TIMEOUT}s")
    print("=" * 60)
    
    app.run(host='0.0.0.0', port=PORT, debug=False, threaded=True)