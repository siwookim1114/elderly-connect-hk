/**
 * Create Post Screen - Create new help requests with text or voice
 */

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import ApiService, {UserInfo} from '../services/api';

const audioRecorderPlayer = new AudioRecorderPlayer();

const CreatePostScreen = ({navigation}: any) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingPath, setRecordingPath] = useState('');
  const [playingAudio, setPlayingAudio] = useState(false);

  // User info (in production, this would come from auth/context)
  const userInfo: UserInfo = {
    user_id: '001',
    role: 'elderly',
    location: 'Sham Shui Po',
  };

  useEffect(() => {
    checkPermissions();
    
    return () => {
      // Cleanup
      audioRecorderPlayer.removeRecordBackListener();
    };
  }, []);

  const checkPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const grants = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        ]);

        if (
          grants['android.permission.RECORD_AUDIO'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          grants['android.permission.WRITE_EXTERNAL_STORAGE'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          grants['android.permission.READ_EXTERNAL_STORAGE'] ===
            PermissionsAndroid.RESULTS.GRANTED
        ) {
          console.log('Permissions granted');
        } else {
          console.log('All required permissions not granted');
          Alert.alert(
            'Permissions Required',
            'Please grant microphone and storage permissions to use voice features.'
          );
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const handleSubmitText = async () => {
    if (!query.trim()) {
      Alert.alert('Error', 'Please enter your request');
      return;
    }

    try {
      setLoading(true);
      const response = await ApiService.fastCreatePost(userInfo.user_id, query);

      if (response.success) {
        Alert.alert('Success', 'Post created successfully!', [
          {
            text: 'OK',
            onPress: () => {
              setQuery('');
              navigation.navigate('Posts');
            },
          },
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to create post');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit request. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const path = Platform.select({
        ios: 'voice_query.m4a',
        android: `${audioRecorderPlayer.mmssss}_voice_query.m4a`,
      });

      const result = await audioRecorderPlayer.startRecorder(path);
      audioRecorderPlayer.addRecordBackListener((e) => {
        console.log('Recording:', e.currentPosition);
      });
      
      setRecordingPath(result);
      setIsRecording(true);
      console.log('Recording started:', result);
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    try {
      const result = await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      setIsRecording(false);
      console.log('Recording stopped:', result);
      
      // Show confirmation dialog
      Alert.alert(
        'Voice Recording Complete',
        'Send this voice request?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              setRecordingPath('');
            },
          },
          {
            text: 'Send',
            onPress: () => handleSubmitVoice(result),
          },
        ]
      );
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  const handleSubmitVoice = async (audioPath: string) => {
    try {
      setLoading(true);
      const response = await ApiService.processVoiceQuery(audioPath, userInfo);

      if (response.success) {
        Alert.alert('Success', response.output || 'Voice request processed successfully', [
          {
            text: 'OK',
            onPress: () => {
              setRecordingPath('');
              // Play audio response if available
              if (response.audio_response) {
                playAudioResponse(response.audio_response);
              }
              navigation.navigate('Posts');
            },
          },
        ]);
      } else {
        Alert.alert('Error', response.error || 'Failed to process voice request');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit voice request. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const playAudioResponse = async (audioBase64: string) => {
    try {
      // Convert base64 to file and play
      // This is a simplified version - you'd need proper base64 to file conversion
      setPlayingAudio(true);
      // Implement audio playback here
      console.log('Playing audio response');
      setTimeout(() => setPlayingAudio(false), 3000);
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const handleVoiceButton = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Icon name="chat-question" size={48} color="#4A90E2" />
          <Text style={styles.title}>What help do you need?</Text>
          <Text style={styles.subtitle}>
            Type your request or use voice input
          </Text>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.label}>Type Your Request</Text>
          <TextInput
            style={styles.textInput}
            value={query}
            onChangeText={setQuery}
            placeholder="e.g., I need help with grocery shopping"
            placeholderTextColor="#BDC3C7"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={handleSubmitText}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Icon name="send" size={20} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Submit Request</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.voiceSection}>
          <Text style={styles.label}>Use Voice Input</Text>
          <Text style={styles.voiceHint}>
            Press and hold the microphone button, speak your request, then release
          </Text>

          <TouchableOpacity
            style={[
              styles.voiceButton,
              isRecording && styles.voiceButtonRecording,
            ]}
            onPress={handleVoiceButton}
            disabled={loading}>
            <Icon
              name={isRecording ? 'stop-circle' : 'microphone'}
              size={64}
              color="#FFFFFF"
            />
            <Text style={styles.voiceButtonText}>
              {isRecording ? 'Tap to Stop' : 'Tap to Speak'}
            </Text>
          </TouchableOpacity>

          {isRecording && (
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>Recording...</Text>
            </View>
          )}
        </View>

        <View style={styles.examplesSection}>
          <Text style={styles.examplesTitle}>Example Requests:</Text>
          <TouchableOpacity onPress={() => setQuery('I need help with grocery shopping this weekend')}>
            <Text style={styles.exampleText}>• I need help with grocery shopping</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setQuery('I need someone to help me with computer setup')}>
            <Text style={styles.exampleText}>• I need help with computer setup</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setQuery('I need help moving furniture next week')}>
            <Text style={styles.exampleText}>• I need help moving furniture</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    marginTop: 8,
    textAlign: 'center',
  },
  inputSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#2C3E50',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 120,
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#BDC3C7',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#7F8C8D',
    fontWeight: '600',
  },
  voiceSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  voiceHint: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  voiceButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  voiceButtonRecording: {
    backgroundColor: '#E74C3C',
  },
  voiceButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E74C3C',
    marginRight: 8,
  },
  recordingText: {
    fontSize: 16,
    color: '#E74C3C',
    fontWeight: '600',
  },
  examplesSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  examplesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 12,
  },
  exampleText: {
    fontSize: 14,
    color: '#4A90E2',
    marginBottom: 8,
    paddingVertical: 4,
  },
});

export default CreatePostScreen;

