/**
 * Settings Screen - App settings and user preferences
 */

import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ApiService from '../services/api';

const SettingsScreen = () => {
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [notifications, setNotifications] = useState(true);

  const user = {
    name: 'John Doe',
    user_id: '001',
    role: 'elderly',
    location: 'Sham Shui Po',
  };

  const toggleRole = () => {
    if (user.user_id === '001') {
      user.user_id = '002';
      user.role = 'youth';
      user.location = 'Mong Kok';
    } else {
      user.user_id = '001';
      user.role = 'elderly';
      user.location = 'Sham Shui Po';
    }
  };

  const handleHealthCheck = async () => {
    try {
      const health = await ApiService.healthCheck();
      Alert.alert(
        'System Status',
        `Status: ${health.status}\nDatabase: ${health.database}\nAgent: ${health.agent}`
      );
    } catch (error) {
      Alert.alert('Error', 'Cannot connect to server');
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* User Profile Section */}
      <View style={styles.section}>
        <View style={styles.profileContainer}>
          <View style={styles.avatar}>
            <Icon name="account" size={48} color="#FFFFFF" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userDetail}>ID: {user.user_id}</Text>
            <Text style={styles.userDetail}>{user.location}</Text>
          </View>
        </View>
      </View>

      {/* Preferences Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Icon name="microphone" size={24} color="#4A90E2" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Voice Input</Text>
              <Text style={styles.settingDescription}>
                Enable voice commands
              </Text>
            </View>
          </View>
          <Switch
            value={voiceEnabled}
            onValueChange={setVoiceEnabled}
            trackColor={{false: '#BDC3C7', true: '#4A90E2'}}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Icon name="bell" size={24} color="#4A90E2" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Notifications</Text>
              <Text style={styles.settingDescription}>
                Get updates on your posts
              </Text>
            </View>
          </View>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{false: '#BDC3C7', true: '#4A90E2'}}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      {/* System Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System</Text>
        
        <TouchableOpacity style={styles.settingItem} onPress={handleHealthCheck}>
          <View style={styles.settingLeft}>
            <Icon name="heart-pulse" size={24} color="#27AE60" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>System Health</Text>
              <Text style={styles.settingDescription}>
                Check server connection
              </Text>
            </View>
          </View>
          <Icon name="chevron-right" size={24} color="#BDC3C7" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={toggleRole}>
          <View style={styles.settingLeft}>
            <Icon name="account-switch" size={24} color="#E67E22" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Switch to {user.role === 'elderly' ? 'Youth' : 'Elderly'} Mode</Text>
              <Text style={styles.settingDescription}>
                Currently: {user.role} ({user.user_id})
              </Text>
            </View>
          </View>
          <Icon name="chevron-right" size={24} color="#BDC3C7" />
        </TouchableOpacity>
      </View>

      {/* Help Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Help & Support</Text>
        
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Icon name="help-circle" size={24} color="#9B59B6" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>How to Use</Text>
              <Text style={styles.settingDescription}>
                Learn about the app features
              </Text>
            </View>
          </View>
          <Icon name="chevron-right" size={24} color="#BDC3C7" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Icon name="phone" size={24} color="#E67E22" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Contact Support</Text>
              <Text style={styles.settingDescription}>
                Get help from our team
              </Text>
            </View>
          </View>
          <Icon name="chevron-right" size={24} color="#BDC3C7" />
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Elderly Connect v1.0.0</Text>
        <Text style={styles.footerSubtext}>
          Powered by AI • Designed for accessibility
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  userDetail: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F1',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 16,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: '#7F8C8D',
  },
  footer: {
    alignItems: 'center',
    padding: 24,
  },
  footerText: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#BDC3C7',
  },
});

export default SettingsScreen;

