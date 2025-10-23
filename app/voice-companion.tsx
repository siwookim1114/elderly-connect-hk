import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
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
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const setupAudio = async () => {
      try {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            t("voice.error"),
            t("voice.permissionDenied")
          );
          return;
        }

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });

        console.log("✅ Audio setup complete");
      } catch (error) {
        console.error("Audio setup error:", error);
        Alert.alert(t("voice.error"), t("voice.recordError"));
      }
    };
    setupAudio();

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

  const toggleLanguage = () => {
    setCurrentLanguage(currentLanguage === "english" ? "cantonese" : "english");
  };

  const startRecording = async () => {
    try {
      console.log("🎤 Starting recording...");
      setIsRecording(true);

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      await recording.startAsync();
      recordingRef.current = recording;

      console.log("✅ Recording started");
    } catch (error) {
      console.error("Failed to start recording", error);
      Alert.alert(
        t("voice.error"),
        t("voice.recordError")
      );
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      if (!recordingRef.current) {
        console.log("⚠️  No active recording");
        return;
      }

      console.log("⏹️  Stopping recording...");
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      setIsRecording(false);
      setIsProcessing(true);

      console.log("📁 Recording saved to:", uri);

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
      Alert.alert(t("voice.error"), t("voice.processError"));
      setIsProcessing(false);
    } finally {
      recordingRef.current = null;
    }
  };

  const processAudio = async (audioUri: string, userMessageId: string) => {
    try {
      console.log("🔄 Processing audio...");

      // Read audio file as binary data and convert to base64
      const audioFile = await FileSystem.readAsStringAsync(audioUri, {
        encoding: "base64",
      });

      console.log(`📊 Audio data length: ${audioFile.length} characters`);
      console.log(`🌐 Sending to: ${API_CONFIG.BASE_URL}/process-voice`);

      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        API_CONFIG.TIMEOUT
      );

      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/process-voice`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            audio: audioFile,
            language: currentLanguage,
            mimeType: Platform.OS === "ios" ? "audio/m4a" : "audio/3gp",
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        console.log("📡 Response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ Server error response:", errorText);
          throw new Error(`Server error: ${response.status}`);
        }

        const result = await response.json();
        console.log("✅ Success! Received response");

        setConversation((prev) =>
          prev.map((msg) =>
            msg.id === userMessageId
              ? { ...msg, text: result.transcript || t("voice.processError") }
              : msg
          )
        );

        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: result.reply || t("voice.processError"),
          isUser: false,
          timestamp: new Date(),
          language: result.detectedLanguage || currentLanguage,
        };
        setConversation((prev) => [...prev, aiMessage]);

        if (result.audio) {
          await playAudio(result.audio);
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);

        if (fetchError.name === "AbortError") {
          throw new Error("Request timeout - server took too long to respond");
        }
        throw fetchError;
      }
    } catch (error: any) {
      console.error("❌ Processing error:", error);

      let errorMessage = t("voice.error");
      let instructions = "";

      if (
        error.message?.includes("Network request failed") ||
        error.message?.includes("Failed to fetch")
      ) {
        errorMessage = t("voice.error");
        instructions = `

Troubleshooting:
1. Flask server running? Check terminal
2. Same WiFi network?
3. Correct IP in config.js?
   Current: ${API_CONFIG.BASE_URL}
4. Try: ${API_CONFIG.BASE_URL}/health in browser`;
      } else if (error.message?.includes("timeout")) {
        errorMessage = t("voice.error");
        instructions = "\n\nThe server took too long to respond. Try again.";
      } else {
        errorMessage = error.message || t("voice.processError");
      }

      Alert.alert("Connection Error", errorMessage + instructions);

      setConversation((prev) =>
        prev.map((msg) =>
          msg.id === userMessageId
            ? { ...msg, text: "❌ Failed to process" }
            : msg
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const playAudio = async (audioBase64: string) => {
    try {
      console.log("🔊 Playing audio response...");
      setIsPlaying(true);

      // Clean base64 data (remove data URL prefix if present)
      const cleanBase64 = audioBase64.replace(
        /^data:audio\/[a-z]+;base64,/,
        ""
      );

      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      if (Platform.OS === "web") {
        // For web, use simple HTML5 audio
        const audioData = `data:audio/mp3;base64,${cleanBase64}`;
        const audio = new (window as any).Audio(audioData);

        audio.onended = () => {
          console.log("✅ Audio playback finished");
          setIsPlaying(false);
        };

        audio.onerror = (error: any) => {
          console.error("❌ Web audio playback error:", error);
          setIsPlaying(false);
          Alert.alert(t("voice.error"), t("voice.failedToPlayAudio"));
        };

        await audio.play();
        console.log("▶️  Web audio playing");
      } else {
        // For mobile, write base64 to a temporary mp3 file and play it
        try {
          const fileName = `voice_response_${Date.now()}.mp3`;
          const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
          await FileSystem.writeAsStringAsync(fileUri, cleanBase64, {
            encoding: FileSystem.EncodingType.Base64,
          });

          const { sound } = await Audio.Sound.createAsync(
            { uri: fileUri },
            { shouldPlay: true }
          );

          soundRef.current = sound;
          await sound.playAsync();

          sound.setOnPlaybackStatusUpdate((status: any) => {
            if (status.didJustFinish) {
              console.log("✅ Audio playback finished");
              setIsPlaying(false);
              // Cleanup the temp file
              FileSystem.deleteAsync(fileUri, { idempotent: true }).catch(
                () => {}
              );
            }
            if (status.error) {
              console.error("❌ Playback status error:", status.error);
              setIsPlaying(false);
              FileSystem.deleteAsync(fileUri, { idempotent: true }).catch(
                () => {}
              );
            }
          });

          console.log("▶️  Mobile audio playing");
        } catch (mobileError) {
          console.error("❌ Mobile audio error:", mobileError);
          setIsPlaying(false);
          Alert.alert(
            t("voice.error"),
            t("voice.failedToPlayAudio")
          );
        }
      }
    } catch (error) {
      console.error("❌ Playback error:", error);
      setIsPlaying(false);
      Alert.alert(t("voice.error"), t("voice.failedToPlayAudio"));
    }
  };

  const clearConversation = () => {
    Alert.alert(
      t("voice.clearConversation"),
      t("voice.clearConversationMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("voice.clear"),
          style: "destructive",
          onPress: () => {
            setConversation([]);
            console.log("🗑️  Conversation cleared");
          },
        },
      ]
    );
  };

  const exportConversation = async () => {
    try {
      if (conversation.length === 0) {
        Alert.alert(t("voice.noConversation"), t("voice.noConversationMessage"));
        return;
      }

      const conversationText = conversation
        .map((msg) => {
          const time = msg.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
          return `[${time}] ${msg.isUser ? t("voice.you") : t("voice.companion")}: ${msg.text}`;
        })
        .join("\n\n");

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileUri = `${FileSystem.documentDirectory}conversation_${timestamp}.txt`;
      await FileSystem.writeAsStringAsync(fileUri, conversationText);

      console.log("💾 Conversation exported to:", fileUri);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert(t("voice.exportComplete"), t("voice.exportCompleteMessage"));
      }
    } catch (error) {
      console.error("❌ Export error:", error);
      Alert.alert(t("voice.error"), t("voice.exportError"));
    }
  };

  const testConnection = async () => {
    try {
      console.log(`🔍 Testing connection to: ${API_CONFIG.BASE_URL}/health`);
      const response = await fetch(`${API_CONFIG.BASE_URL}/health`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        Alert.alert(
          "✅ Connection Success",
          `Server is running!\n\nStatus: ${data.status}`
        );
        console.log("✅ Health check passed:", data);
      } else {
        Alert.alert(
          "❌ Connection Failed",
          `Server returned status: ${response.status}`
        );
      }
    } catch (error: any) {
      console.error("❌ Health check failed:", error);
      Alert.alert(
        "❌ Connection Failed",
        `Cannot reach server at:\n${API_CONFIG.BASE_URL}\n\nError: ${error.message}`
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("voice.title")}</Text>
        <Text style={styles.subtitle}>{t("voice.subtitle")}</Text>

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
            disabled={isRecording || isProcessing || isPlaying}
          >
            <Text style={styles.languageText}>🔍 Test</Text>
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
              {currentLanguage === "english"
                ? t("voice.tapToStart")
                : t("voice.tapToStart")}
            </Text>
            <TouchableOpacity
              style={styles.testButtonLarge}
              onPress={testConnection}
            >
              <Text style={styles.testButtonText}>🔍 Test Connection</Text>
            </TouchableOpacity>
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
              <Text
                style={[
                  styles.timestamp,
                  message.isUser && styles.timestampUser,
                ]}
              >
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {message.language && ` • ${message.language}`}
              </Text>
            </View>
          ))
        )}

        {(isProcessing || isPlaying) && (
          <View style={styles.statusBubble}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.statusText}>
              {isProcessing ? t("voice.processing") : t("voice.speaking")}
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[
            styles.recordButton,
            isRecording && styles.recordingButton,
            (isProcessing || isPlaying) && styles.disabledButton,
          ]}
          onPress={isRecording ? stopRecording : startRecording}
          disabled={isProcessing || isPlaying}
          activeOpacity={0.8}
        >
          <Text style={styles.recordButtonText}>
            {isRecording ? "🛑 Stop" : "🎤 Talk"}
          </Text>
          {isRecording && <View style={styles.recordingIndicator} />}
        </TouchableOpacity>

        {conversation.length > 0 && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={clearConversation}
              disabled={isRecording || isProcessing || isPlaying}
            >
              <Text style={styles.actionButtonText}>🗑️ Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={exportConversation}
              disabled={isRecording || isProcessing || isPlaying}
            >
              <Text style={styles.actionButtonText}>📤 Export</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  headerButtons: {
    flexDirection: "row",
    gap: 10,
  },
  languageButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
  },
  testButton: {
    backgroundColor: COLORS.success,
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
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  testButtonLarge: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: COLORS.success,
    borderRadius: 25,
  },
  testButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  messageBubble: {
    maxWidth: "85%",
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: COLORS.primary,
  },
  aiBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#F8F9FA",
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: "#FFFFFF",
  },
  aiText: {
    color: COLORS.text,
  },
  timestamp: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    opacity: 0.7,
  },
  timestampUser: {
    color: "#FFFFFF",
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
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  controls: {
    paddingBottom: 40,
    alignItems: "center",
  },
  recordButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 50,
    minWidth: 200,
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    position: "relative",
  },
  recordingButton: {
    backgroundColor: COLORS.recording,
  },
  disabledButton: {
    opacity: 0.6,
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
  actionButtons: {
    flexDirection: "row",
    marginTop: 16,
    gap: 12,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  actionButtonText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: "500",
  },
});