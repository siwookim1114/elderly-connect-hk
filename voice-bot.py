from dotenv import load_dotenv
load_dotenv()

import os
import requests
import sounddevice as sd
import numpy as np
import scipy.io.wavfile
import azure.cognitiveservices.speech as speechsdk
import time

# --- CONFIGURATION ---
DEEPSEEK_API_KEY   = os.getenv("DEEPSEEK_API_KEY")
DEEPSEEK_ENDPOINT  = "https://api.lkeap.tencentcloud.com/v1/chat/completions"
DEEPSEEK_MODEL     = "deepseek-r1"
AZURE_SPEECH_KEY   = os.getenv("AZURE_SPEECH_KEY")
AZURE_REGION       = os.getenv("AZURE_REGION", "eastus")
AZURE_TTS_ENDPOINT = f"https://{AZURE_REGION}.tts.speech.microsoft.com/cognitiveservices/v1"
AZURE_VOICE_NAME   = "zh-HK-HiuMaanNeural"
SYSTEM_PROMPT = (
    "你係一個專為香港長者設計嘅智能醫護助理兼伴侶，名叫小雯。你擁有豐富嘅醫學、健康、生活常識。\n"
    "回應要求：用香港粤語（繁體中文），詳細、實用（3–5句）"
)

def record_until_silence(filename="input.wav", samplerate=16000, silence_thresh=400, silence_max_sec=1.5, min_record_sec=5):
    print("請開始講話（錄音最少5秒，然後停低約1.5秒會自動結束）…")
    block_duration = 0.2  # seconds
    frames = []
    silence_blocks = int(silence_max_sec / block_duration)
    silence_count = 0
    start_time = time.time()
    got_loud = False

    with sd.InputStream(samplerate=samplerate, channels=1, dtype='int16') as stream:
        while True:
            data, _ = stream.read(int(samplerate * block_duration))
            frames.append(data)
            vol = np.abs(np.frombuffer(data, dtype='int16')).mean()
            print(f"Volume: {vol:.1f}")
            now = time.time()
            if vol >= silence_thresh:
                got_loud = True
                silence_count = 0
            else:
                silence_count += 1
            keep_recording = now - start_time < min_record_sec
            if got_loud and not keep_recording and silence_count >= silence_blocks:
                break
            if not got_loud and now - start_time >= min_record_sec:
                break
    audio = np.concatenate(frames, axis=0)
    scipy.io.wavfile.write(filename, samplerate, audio)
    print("錄音完成！")
    if not got_loud:
        print("未偵測到語音，請再試一次。")
        return None
    return filename

def azure_stt(wav_path):
    if wav_path is None:
        return ""
    speech_config = speechsdk.SpeechConfig(subscription=AZURE_SPEECH_KEY, region=AZURE_REGION)
    audio_config = speechsdk.AudioConfig(filename=wav_path)
    speech_config.speech_recognition_language = "zh-HK"  # <-- This is the key change
    recognizer = speechsdk.SpeechRecognizer(speech_config, audio_config)
    print("語音轉文字中…")
    result = recognizer.recognize_once()
    if result.reason == speechsdk.ResultReason.RecognizedSpeech and result.text:
        print("> 識別文字：", result.text)
        return result.text
    else:
        print("語音識別失敗。")
        if result.reason == speechsdk.ResultReason.NoMatch:
            print("NoMatch details:", result.no_match_details)
        elif result.reason == speechsdk.ResultReason.Canceled:
            cancellation = result.cancellation_details
            print("Canceled:", cancellation.reason)
            print("Error details:", cancellation.error_details)
        return ""

def deepseek_reply(text):
    payload = {
        "model": DEEPSEEK_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": text}
        ],
        "max_tokens": 300,
        "temperature": 0.7,
        "stream": False
    }
    headers = {
        "Content-Type":  "application/json",
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}"
    }
    resp = requests.post(DEEPSEEK_ENDPOINT, json=payload, headers=headers, timeout=30)
    resp.raise_for_status()
    reply = resp.json()["choices"][0]["message"]["content"].strip()
    print("> DeepSeek 回答：", reply)
    return reply

def azure_tts(text, out_path="output.mp3"):
    ssml = f"""
    <speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='zh-HK'>
      <voice name='{AZURE_VOICE_NAME}'>
        <prosody rate="0.8" pitch="medium">{text}</prosody>
      </voice>
    </speak>
    """
    headers = {
        "Ocp-Apim-Subscription-Key": AZURE_SPEECH_KEY,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3"
    }
    resp = requests.post(AZURE_TTS_ENDPOINT, headers=headers, data=ssml.encode("utf-8"))
    resp.raise_for_status()
    with open(out_path, "wb") as f:
        f.write(resp.content)
    return out_path

def play_mac_mp3(path):
    os.system(f"afplay {path}")

def main():
    wav_path = "input.wav"
    mp3_path = "output.mp3"
    recorded = record_until_silence(wav_path)
    if recorded is None:
        return
    transcript = azure_stt(wav_path)
    if not transcript:
        print("無法識別語音。")
        return
    reply = deepseek_reply(transcript)
    mp3_file = azure_tts(reply, mp3_path)
    print("正在播放 DeepSeek 回答…")
    play_mac_mp3(mp3_file)

if __name__ == "__main__":
    main()
