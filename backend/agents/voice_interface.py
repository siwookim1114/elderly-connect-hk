"""
Voice Interface Module for Help Post Agent
Provides speech-to-text and text-to-speech functionality for elderly users.
"""

import speech_recognition as sr
from gtts import gTTS
import os
import tempfile
from typing import Optional, Dict, Any
import threading
import subprocess


class VoiceInterface:
    """
    Voice interface for the help post agent.
    Supports both speech-to-text (listening) and text-to-speech (speaking).
    """
    
    def __init__(self, use_gtts: bool = True, language: str = "en", enable_microphone: bool = False):
        """
        Initialize the voice interface.
        
        Args:
            use_gtts: Always True for Docker environment (uses Google TTS)
            language: Language code for speech recognition and TTS (default: "en" for English)
            enable_microphone: If False, skip microphone initialization (for Docker/server environments)
        """
        self.recognizer = sr.Recognizer()
        self.microphone = None
        self.use_gtts = True  # Always use gTTS in Docker
        self.language = language
        self.enable_microphone = enable_microphone
        
        # Only initialize microphone if enabled (requires hardware)
        if enable_microphone:
            try:
                self.microphone = sr.Microphone()
                self._calibrate_microphone()
            except Exception as e:
                print(f"Warning: Could not initialize microphone: {e}")
                self.microphone = None
    
    
    def _calibrate_microphone(self):
        """Calibrate the microphone for ambient noise."""
        print("Calibrating microphone for ambient noise...")
        try:
            with self.microphone as source:
                self.recognizer.adjust_for_ambient_noise(source, duration=1)
            print("Microphone calibrated successfully.")
        except Exception as e:
            print(f"Warning: Could not calibrate microphone: {e}")
    
    def listen(self, timeout: int = 10, phrase_time_limit: int = 15) -> Optional[str]:
        """
        Listen to user's voice input and convert to text.
        
        Args:
            timeout: Maximum time to wait for speech to start (seconds)
            phrase_time_limit: Maximum time for a phrase (seconds)
        
        Returns:
            Transcribed text or None if failed
        """
        print("\n🎤 Listening... Please speak your request.")
        
        try:
            with self.microphone as source:
                # Listen for audio
                audio = self.recognizer.listen(
                    source,
                    timeout=timeout,
                    phrase_time_limit=phrase_time_limit
                )
            
            print("🔄 Processing speech...")
            
            # Convert speech to text using Google Speech Recognition
            try:
                text = self.recognizer.recognize_google(audio, language=self.language)
                print(f"✅ You said: \"{text}\"")
                return text
            except sr.UnknownValueError:
                print("❌ Could not understand audio. Please speak clearly.")
                return None
            except sr.RequestError as e:
                print(f"❌ Could not request results from speech recognition service: {e}")
                return None
                
        except sr.WaitTimeoutError:
            print("⏱️ No speech detected. Timeout reached.")
            return None
        except Exception as e:
            print(f"❌ Error during listening: {e}")
            return None
    
    def speak(self, text: str, blocking: bool = True):
        """
        Convert text to speech and play it.
        
        Args:
            text: Text to speak
            blocking: If True, wait for speech to finish. If False, speak in background.
        """
        if not text:
            return
        
        print(f"\n🔊 Speaking: \"{text}\"")
        
        # Always use gTTS in Docker environment
        self._speak_gtts(text, blocking)
    
    
    def _speak_gtts(self, text: str, blocking: bool = True):
        """Speak using Google TTS (requires internet)."""
        try:
            # Create a temporary file for the audio
            with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as fp:
                temp_file = fp.name
            
            # Generate speech
            tts = gTTS(text=text, lang=self.language, slow=False)
            tts.save(temp_file)
            
            # Play the audio
            if blocking:
                os.system(f"afplay {temp_file}")  # macOS
                # For Linux: os.system(f"mpg123 {temp_file}")
                # For Windows: os.system(f"start {temp_file}")
            else:
                # Play in background
                thread = threading.Thread(target=os.system, args=(f"afplay {temp_file}",))
                thread.daemon = True
                thread.start()
            
            # Clean up
            try:
                os.remove(temp_file)
            except:
                pass
                
        except Exception as e:
            print(f"❌ Error during Google TTS: {e}")
    
    def listen_and_confirm(self, max_retries: int = 3) -> Optional[str]:
        """
        Listen to user input with confirmation.
        Asks user to confirm what they said.
        
        Args:
            max_retries: Maximum number of retry attempts
        
        Returns:
            Confirmed text or None if failed
        """
        for attempt in range(max_retries):
            text = self.listen()
            
            if text:
                # Ask for confirmation
                self.speak(f"I heard: {text}. Is this correct? Say yes or no.")
                confirmation = self.listen(timeout=5, phrase_time_limit=5)
                
                if confirmation and ('yes' in confirmation.lower() or 'correct' in confirmation.lower()):
                    return text
                elif confirmation and ('no' in confirmation.lower() or 'wrong' in confirmation.lower()):
                    self.speak("Let me try again.")
                    continue
                else:
                    # If unclear confirmation, assume it's correct
                    return text
            
            if attempt < max_retries - 1:
                self.speak("I didn't catch that. Please try again.")
        
        self.speak("I'm having trouble understanding. Please try typing your request.")
        return None
    
    def interactive_mode(self, callback_function, exit_phrases: list = None):
        """
        Run an interactive voice mode where the user can continuously speak commands.
        
        Args:
            callback_function: Function to call with the transcribed text
            exit_phrases: List of phrases to exit the interactive mode
        """
        if exit_phrases is None:
            exit_phrases = ['exit', 'quit', 'goodbye', 'stop', 'bye']
        
        self.speak("Voice interface activated. You can speak your requests now.")
        
        while True:
            text = self.listen()
            
            if text:
                # Check for exit phrases
                if any(phrase in text.lower() for phrase in exit_phrases):
                    self.speak("Goodbye! Voice interface deactivated.")
                    break
                
                # Process the command
                try:
                    result = callback_function(text)
                    if result:
                        self.speak(result)
                except Exception as e:
                    self.speak(f"An error occurred: {str(e)}")
                    print(f"Error in callback: {e}")
            else:
                # If no speech detected, ask if user wants to continue
                self.speak("I didn't hear anything. Say continue to keep going, or exit to stop.")
                response = self.listen(timeout=5)
                if response and any(phrase in response.lower() for phrase in exit_phrases):
                    self.speak("Goodbye!")
                    break


def test_voice_interface():
    """Test the voice interface functionality."""
    print("=== Voice Interface Test ===\n")
    
    # Initialize voice interface
    voice = VoiceInterface(use_gtts=False)  # Use offline TTS
    
    # Test speaking
    voice.speak("Hello! I am your help post assistant. I can understand your voice commands.")
    
    # Test listening
    voice.speak("Please tell me how I can help you.")
    user_input = voice.listen()
    
    if user_input:
        voice.speak(f"You said: {user_input}")
        print(f"\n✅ Successfully captured: {user_input}")
    else:
        print("\n❌ Failed to capture speech")


if __name__ == "__main__":
    test_voice_interface()

