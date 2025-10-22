// app/settings.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator
} from 'react-native';
import memoryGardenApi from './services/memoryGardenApi';

const SERVER_URL_KEY = '@server_url';
const DEFAULT_SERVER_URL = 'http://localhost:8000';

export default function Settings() {
  const router = useRouter();
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER_URL);
  const [tempUrl, setTempUrl] = useState(DEFAULT_SERVER_URL);
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');

  useEffect(() => {
    loadServerUrl();
  }, []);

  const loadServerUrl = async () => {
    try {
      const savedUrl = await AsyncStorage.getItem(SERVER_URL_KEY);
      if (savedUrl) {
        setServerUrl(savedUrl);
        setTempUrl(savedUrl);
      }
    } catch (error) {
      console.error('Error loading server URL:', error);
    }
  };

  const testConnection = async (url: string) => {
    setTesting(true);
    try {
      // Temporarily update the API service URL for testing
      const originalUrl = memoryGardenApi['baseURL'];
      memoryGardenApi['baseURL'] = url;
      
      const isConnected = await memoryGardenApi.healthCheck();
      
      // Restore original URL
      memoryGardenApi['baseURL'] = originalUrl;
      
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
      return isConnected;
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionStatus('disconnected');
      return false;
    } finally {
      setTesting(false);
    }
  };

  const saveServerUrl = async () => {
    // Validate URL format
    const urlPattern = /^https?:\/\/.+/;
    if (!urlPattern.test(tempUrl.trim())) {
      Alert.alert('Invalid URL', 'Please enter a valid URL starting with http:// or https://');
      return;
    }

    const cleanUrl = tempUrl.trim().replace(/\/$/, ''); // Remove trailing slash

    // Test connection first
    const isConnected = await testConnection(cleanUrl);
    
    if (isConnected) {
      try {
        await AsyncStorage.setItem(SERVER_URL_KEY, cleanUrl);
        setServerUrl(cleanUrl);
        
        // Update the API service
        memoryGardenApi['baseURL'] = cleanUrl;
        
        Alert.alert(
          'Success',
          'Server URL saved and connection successful!',
          [
            {
              text: 'OK',
              onPress: () => router.back()
            }
          ]
        );
      } catch (error) {
        console.error('Error saving server URL:', error);
        Alert.alert('Error', 'Failed to save server URL');
      }
    } else {
      Alert.alert(
        'Connection Failed',
        'Could not connect to the server. Do you still want to save this URL?',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Save Anyway',
            onPress: async () => {
              try {
                await AsyncStorage.setItem(SERVER_URL_KEY, cleanUrl);
                setServerUrl(cleanUrl);
                memoryGardenApi['baseURL'] = cleanUrl;
                Alert.alert('Saved', 'Server URL saved (connection not verified)');
                router.back();
              } catch (error) {
                Alert.alert('Error', 'Failed to save server URL');
              }
            }
          }
        ]
      );
    }
  };

  const resetToDefault = () => {
    Alert.alert(
      'Reset to Default',
      'Reset server URL to default (localhost:8000)?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Reset',
          onPress: async () => {
            setTempUrl(DEFAULT_SERVER_URL);
            setServerUrl(DEFAULT_SERVER_URL);
            await AsyncStorage.setItem(SERVER_URL_KEY, DEFAULT_SERVER_URL);
            memoryGardenApi['baseURL'] = DEFAULT_SERVER_URL;
            setConnectionStatus('unknown');
          }
        }
      ]
    );
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#38A169';
      case 'disconnected': return '#E53E3E';
      default: return '#718096';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'disconnected': return 'Not Connected';
      default: return 'Unknown';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          title: "Settings",
          headerTitleAlign: "center",
        }}
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="server-outline" size={24} color="#DD6B20" />
            <Text style={styles.sectionTitle}>Memory Garden Server</Text>
          </View>
          
          <Text style={styles.description}>
            Configure the server URL for Memory Garden features (AI story generation and Cantonese audio).
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Server URL</Text>
            <TextInput
              style={styles.input}
              value={tempUrl}
              onChangeText={setTempUrl}
              placeholder="http://your-server-ip:8000"
              placeholderTextColor="#A0AEC0"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <Text style={styles.hint}>
              Example: http://192.168.1.100:8000 or http://10.0.0.5:8000
            </Text>
          </View>

          <View style={styles.statusContainer}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Status:</Text>
              <View style={[styles.statusBadge, { backgroundColor: getConnectionStatusColor() + '20' }]}>
                <View style={[styles.statusDot, { backgroundColor: getConnectionStatusColor() }]} />
                <Text style={[styles.statusText, { color: getConnectionStatusColor() }]}>
                  {getConnectionStatusText()}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity
              style={styles.testButton}
              onPress={() => testConnection(tempUrl.trim().replace(/\/$/, ''))}
              disabled={testing}
            >
              {testing ? (
                <ActivityIndicator size="small" color="#DD6B20" />
              ) : (
                <Ionicons name="wifi-outline" size={20} color="#DD6B20" />
              )}
              <Text style={styles.testButtonText}>
                {testing ? 'Testing...' : 'Test Connection'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={saveServerUrl}
              disabled={testing}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="white" />
              <Text style={styles.saveButtonText}>Save Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resetButton}
              onPress={resetToDefault}
              disabled={testing}
            >
              <Ionicons name="refresh-outline" size={20} color="#718096" />
              <Text style={styles.resetButtonText}>Reset to Default</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle-outline" size={20} color="#4299E1" />
            <Text style={styles.infoTitle}>How to find your server IP:</Text>
          </View>
          <Text style={styles.infoText}>
            • On Windows: Open Command Prompt and type "ipconfig"{'\n'}
            • On Mac/Linux: Open Terminal and type "ifconfig"{'\n'}
            • Look for your local IP address (usually starts with 192.168 or 10.0){'\n'}
            • Make sure your device and server are on the same network
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D3748',
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    color: '#718096',
    lineHeight: 20,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#2D3748',
  },
  hint: {
    fontSize: 12,
    color: '#A0AEC0',
    marginTop: 6,
    fontStyle: 'italic',
  },
  statusContainer: {
    marginBottom: 20,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DD6B20',
  },
  testButtonText: {
    color: '#DD6B20',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  buttonContainer: {
    gap: 12,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DD6B20',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  resetButtonText: {
    color: '#718096',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoSection: {
    backgroundColor: '#EBF8FF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4299E1',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C5282',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#2C5282',
    lineHeight: 22,
  },
});
