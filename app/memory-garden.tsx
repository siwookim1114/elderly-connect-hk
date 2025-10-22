// app/memory-garden.tsx
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React from 'react';
import { Linking, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Your deployed Memory Garden API URL
const MEMORY_GARDEN_URL = 'http://localhost:8000/docs'; // ← REPLACE

export default function MemoryGarden() {
  const redirectToMemoryGarden = () => {
    // Simply open the deployed API in browser
    Linking.openURL(MEMORY_GARDEN_URL);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          title: "Memory Garden",
          headerTitleAlign: "center",
        }}
      />
      
      {/* Simple redirect screen */}
      <View style={styles.content}>
        <Ionicons name="flower-outline" size={80} color="#DD6B20" />
        <Text style={styles.title}>Memory Garden</Text>
        <Text style={styles.subtitle}>
          AI-powered storytelling with your photos
        </Text>
        
        <TouchableOpacity 
          style={styles.redirectButton}
          onPress={redirectToMemoryGarden}
        >
          <Ionicons name="open-outline" size={24} color="white" />
          <Text style={styles.buttonText}>Open Memory Garden</Text>
        </TouchableOpacity>

        <Text style={styles.note}>
          This will open the Memory Garden web application in your browser
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2D3748',
    marginTop: 20,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  redirectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DD6B20',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  note: {
    marginTop: 20,
    fontSize: 14,
    color: '#A0AEC0',
    textAlign: 'center',
    lineHeight: 18,
  },
});