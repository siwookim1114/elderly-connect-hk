import { BlurView } from 'expo-blur';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ModernHeaderProps {
  title: string;
  backgroundColor?: string;
  tint?: 'light' | 'dark';
}

export const ModernHeader: React.FC<ModernHeaderProps> = ({ 
  title, 
  backgroundColor = 'transparent',
  tint = 'light'
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <BlurView 
        intensity={80} 
        tint={tint}
        style={[StyleSheet.absoluteFill, { backgroundColor }]}
      />
      <View style={styles.headerContent}>
        <Text style={styles.title}>{title}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: Platform.OS === 'ios' ? 100 : 80,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
});