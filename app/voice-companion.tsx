import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import API_CONFIG from "./config";

const COLORS = {
  primary: "#1428A0",
  background: "#FFFFFF",
  text: "#000000",
  textSecondary: "#666666",
  success: "#4CAF50",
  error: "#F44336",
  recording: "#FF5252",
  warning: "#FF9800",
};

type Message = {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  language?: string;
};

export default function VoiceCompanion() {
  const { t } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [currentLanguage, setCurrentLanguage] = useState<
    "english" | "cantonese"
  >("english");
  const [permissionsGranted, setPermissionsGranted] = useState<boolean | null>(
    null
  );
  const [serverStatus, setServerStatus] = useState<string>("unknown");
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    setupAudio();
    checkServerStatus(); // Check server on app start

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(console.error);
      }
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(console.error);
      }
    };
  }, []);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [conversation]);

  const setupAudio = async () => {
    try {
      console.log("🎤 Requesting microphone permissions...");
      const { status } = await Audio.requestPermissionsAsync();

      if (status === "granted") {
        console.log("✅ Microphone permissions granted");
        setPermissionsGranted(true);

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } else {
        console.log("❌ Microphone permissions denied");
        setPermissionsGranted(false);
      }
    } catch (error) {
      console.error("Audio setup error:", error);
      setPermissionsGranted(false);
    }
  };

  const checkServerStatus = async () => {
    try {
      console.log("🔍 Checking server status...");

      // Add timeout for health check
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.QUICK_TIMEOUT);

      const response = await fetch(`${API_CONFIG.BASE_URL}/health`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        setServerStatus("connected");
        console.log("✅ Server status:", data);
      } else {
        setServerStatus("error");
        console.log("❌ Server health check failed");
      }
    } catch (error) {
      setServerStatus("disconnected");
      console.error("❌ Cannot reach server:", error);
    }
  };

  const toggleLanguage = () => {
    setCurrentLanguage(currentLanguage === "english" ? "cantonese" : "english");
  };

  const requestPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status === "granted") {
        setPermissionsGranted(true);
        await setupAudio();
        Alert.alert("✅ Success", "Microphone permissions granted!");
      } else {
        setPermissionsGranted(false);
        Alert.alert("❌ Permission Denied", "Microphone access is required.");
      }
    } catch (error) {
      console.error("Permission request error:", error);
      setPermissionsGranted(false);
    }
  };

  const startRecording = async () => {
    try {
      if (serverStatus !== "connected") {
        Alert.alert("Server Issue", "Please check server connection first.");
        return;
      }

      if (permissionsGranted !== true) {
        await requestPermissions();
        return;
      }

      console.log("🎤 Starting recording...");
      setIsRecording(true);

      // Shorter recording with lower quality for faster processing
      const recordingOptions = {
        android: {
          extension: ".wav",
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_DEFAULT,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_DEFAULT,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000, // Higher bitrate for better quality
        },
        ios: {
          extension: ".wav",
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_LINEARPCM,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      };

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(recordingOptions);
      await recording.startAsync();
      recordingRef.current = recording;

      console.log("✅ Recording started");
    } catch (error) {
      console.error("Failed to start recording", error);
      setIsRecording(false);
      Alert.alert(
        "Recording Error",
        "Failed to start recording. Please try again."
      );
    }
  };

  const stopRecording = async () => {
    try {
      if (!recordingRef.current) return;

      console.log("⏹️ Stopping recording...");
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      setIsRecording(false);
      setIsProcessing(true);

      console.log("📁 Recording saved:", uri);

      const userMessageId = Date.now().toString();
      const userMessage: Message = {
        id: userMessageId,
        text: "🎤 Processing...",
        isUser: true,
        timestamp: new Date(),
        language: currentLanguage,
      };
      setConversation((prev) => [...prev, userMessage]);

      if (uri) {
        await processAudio(uri, userMessageId);
      }
    } catch (error) {
      console.error("Failed to stop recording", error);
      Alert.alert("Error", "Failed to process recording");
      setIsProcessing(false);
    } finally {
      recordingRef.current = null;
    }
  };

  const processAudio = async (audioUri: string, userMessageId: string) => {
    try {
      console.log("🔄 Processing audio...");

      // Read and limit audio size
      const audioFile = await FileSystem.readAsStringAsync(audioUri, {
        encoding: "base64",
      });

      console.log(`📊 Audio data: ${audioFile.length} chars`);

      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        API_CONFIG.TIMEOUT
      );

      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/process-voice`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            audio: audioFile,
            language: currentLanguage,
            mimeType: "audio/wav",
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        console.log("📡 Response status:", response.status);

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        const result = await response.json();
        console.log("✅ Success! Received response");

        // Update user message with transcript
        setConversation((prev) =>
          prev.map((msg) =>
            msg.id === userMessageId
              ? { ...msg, text: result.transcript || "Could not transcribe" }
              : msg
          )
        );

        // Add AI response
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: result.reply || "No response received",
          isUser: false,
          timestamp: new Date(),
          language: result.detectedLanguage || currentLanguage,
        };
        setConversation((prev) => [...prev, aiMessage]);

        // Play audio if available
        if (result.audio) {
          await playAudio(result.audio);
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);

        if (fetchError.name === "AbortError") {
          throw new Error(
            "Request took too long. The server might be busy. Please try a shorter message."
          );
        }
        throw fetchError;
      }
    } catch (error: any) {
      console.error("❌ Processing error:", error);

      let errorMessage = error.message || "Processing failed";
      let suggestions = "";

      if (
        errorMessage.includes("timeout") ||
        errorMessage.includes("too long")
      ) {
        suggestions =
          "\n\n💡 Try: Shorter messages • Better internet • Check server";
      } else if (errorMessage.includes("Network request failed")) {
        suggestions = `\n\n🔧 Check: Server running? • Correct IP? • Same WiFi?\nCurrent IP: ${API_CONFIG.BASE_URL}`;
      }

      Alert.alert("Processing Error", errorMessage + suggestions);

      setConversation((prev) =>
        prev.map((msg) =>
          msg.id === userMessageId
            ? { ...msg, text: "❌ " + errorMessage }
            : msg
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const playAudio = async (audioBase64: string) => {
    try {
      console.log("🔊 Playing audio...");
      setIsPlaying(true);

      const cleanBase64 = audioBase64.replace(
        /^data:audio\/[a-z]+;base64,/,
        ""
      );

      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      if (Platform.OS === "web") {
        const audio = new Audio(`data:audio/mp3;base64,${cleanBase64}`);
        audio.onended = () => setIsPlaying(false);
        audio.onerror = () => {
          setIsPlaying(false);
          Alert.alert("Playback Error", "Failed to play audio");
        };
        await audio.play();
      } else {
        const fileName = `response_${Date.now()}.mp3`;
        const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(fileUri, cleanBase64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const { sound } = await Audio.Sound.createAsync({ uri: fileUri });
        soundRef.current = sound;

        sound.setOnPlaybackStatusUpdate((status: any) => {
          if (status.didJustFinish) {
            setIsPlaying(false);
            FileSystem.deleteAsync(fileUri, { idempotent: true });
          }
        });

        await sound.playAsync();
      }
    } catch (error) {
      console.error("❌ Playback error:", error);
      setIsPlaying(false);
    }
  };

  const clearConversation = () => {
    setConversation([]);
  };

  const testConnection = async () => {
    try {
      console.log("🔍 Testing connection...");

      // Add timeout for connection test
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.QUICK_TIMEOUT);

      const response = await fetch(`${API_CONFIG.BASE_URL}/health`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        setServerStatus("connected");
        Alert.alert(
          "✅ Server Connected",
          `Status: ${data.status}\nAzure: ${data.azure_status}\nOllama: ${data.ollama_status}`
        );
      } else {
        setServerStatus("error");
        Alert.alert("❌ Server Error", `Status: ${response.status}`);
      }
    } catch (error: any) {
      setServerStatus("disconnected");
      Alert.alert(
        "❌ Cannot Connect",
        `Server: ${API_CONFIG.BASE_URL}\nError: ${error.message}`
      );
    }
  };

  const quickTextTest = async () => {
    try {
      setIsProcessing(true);
      const response = await fetch(`${API_CONFIG.BASE_URL}/quick-test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "Hello, how are you?",
          language: currentLanguage,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        Alert.alert("✅ Text Test", `Reply: ${result.reply}`);
      } else {
        Alert.alert("❌ Text Test Failed", "Server error");
      }
    } catch (error: any) {
      Alert.alert("❌ Text Test Failed", error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = () => {
    switch (serverStatus) {
      case "connected":
        return COLORS.success;
      case "error":
        return COLORS.error;
      case "disconnected":
        return COLORS.warning;
      default:
        return COLORS.textSecondary;
    }
  };

  const getStatusText = () => {
    switch (serverStatus) {
      case "connected":
        return "✅ Server Connected";
      case "error":
        return "❌ Server Error";
      case "disconnected":
        return "⚠️ Server Disconnected";
      default:
        return "🔍 Checking Server...";
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Voice Companion</Text>
        <Text style={styles.subtitle}>Fast & Optimized Version</Text>

        {/* Server Status */}
        <View
          style={[
            styles.statusBar,
            { backgroundColor: getStatusColor() + "20" },
          ]}
        >
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>

        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.languageButton}
            onPress={toggleLanguage}
            disabled={isRecording || isProcessing || isPlaying}
          >
            <Text style={styles.languageText}>
              {currentLanguage === "english" ? "中文" : "EN"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.languageButton, styles.testButton]}
            onPress={testConnection}
            disabled={isProcessing}
          >
            <Text style={styles.languageText}>🔍 Test</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.languageButton, styles.quickTestButton]}
            onPress={quickTextTest}
            disabled={isProcessing || isRecording}
          >
            <Text style={styles.languageText}>📝 Text</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.conversationContainer}
        contentContainerStyle={styles.conversationContent}
      >
        {conversation.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {serverStatus !== "connected"
                ? "🔌 Connect to server first using the Test button above"
                : currentLanguage === "english"
                ? "Tap the microphone to start talking"
                : "點擊麥克風開始對話"}
            </Text>
          </View>
        ) : (
          conversation.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageBubble,
                message.isUser ? styles.userBubble : styles.aiBubble,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  message.isUser ? styles.userText : styles.aiText,
                ]}
              >
                {message.text}
              </Text>
            </View>
          ))
        )}

        {(isProcessing || isPlaying) && (
          <View style={styles.statusBubble}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.statusText}>
              {isProcessing ? "Processing..." : "Playing..."}
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[
            styles.recordButton,
            isRecording && styles.recordingButton,
            (isProcessing ||
              isPlaying ||
              permissionsGranted !== true ||
              serverStatus !== "connected") &&
              styles.disabledButton,
          ]}
          onPress={isRecording ? stopRecording : startRecording}
          disabled={
            isProcessing ||
            isPlaying ||
            permissionsGranted !== true ||
            serverStatus !== "connected"
          }
        >
          <Text style={styles.recordButtonText}>
            {isRecording
              ? "🛑 Stop"
              : permissionsGranted === false
              ? "🎤 Enable Mic"
              : serverStatus !== "connected"
              ? "🔌 No Server"
              : "🎤 Talk"}
          </Text>
          {isRecording && <View style={styles.recordingIndicator} />}
        </TouchableOpacity>

        {conversation.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearConversation}
            disabled={isRecording || isProcessing || isPlaying}
          >
            <Text style={styles.clearButtonText}>🗑️ Clear</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 12,
  },
  statusBar: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  headerButtons: {
    flexDirection: "row",
    gap: 10,
  },
  languageButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#1428A0",
    borderRadius: 20,
  },
  testButton: {
    backgroundColor: "#4CAF50",
  },
  quickTestButton: {
    backgroundColor: "#FF9800",
  },
  languageText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  conversationContainer: {
    flex: 1,
    marginBottom: 20,
  },
  conversationContent: {
    paddingBottom: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  messageBubble: {
    maxWidth: "85%",
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#1428A0",
  },
  aiBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#F0F0F0",
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: "#FFFFFF",
  },
  aiText: {
    color: "#000000",
  },
  statusBubble: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    padding: 12,
    backgroundColor: "#F8F9FA",
    borderRadius: 20,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 14,
    color: "#666666",
    marginLeft: 8,
  },
  controls: {
    paddingBottom: 40,
    alignItems: "center",
  },
  recordButton: {
    backgroundColor: "#1428A0",
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 50,
    minWidth: 200,
    alignItems: "center",
    position: "relative",
  },
  recordingButton: {
    backgroundColor: "#FF5252",
  },
  disabledButton: {
    opacity: 0.5,
  },
  recordButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  recordingIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
  },
  clearButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
  },
  clearButtonText: {
    color: "#666666",
    fontSize: 14,
    fontWeight: "500",
  },
});
