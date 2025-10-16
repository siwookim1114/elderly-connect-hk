import { useNavigation } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CustomHeaderProps {
  title: string;
  backgroundColor?: string;
  showBack?: boolean;
}

export const CustomHeader: React.FC<CustomHeaderProps> = ({ 
  title, 
  backgroundColor = "#FFFFFF",
  showBack = true 
}) => {
  const navigation = useNavigation();

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View style={[styles.header, { backgroundColor }]}>
      <View style={styles.headerContent}>
        {showBack && (
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Text style={styles.backText}>‹</Text>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        )}
        
        <Text style={styles.title}>{title}</Text>
        
        {/* Spacer for balance */}
        <View style={styles.spacer} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 10,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 44,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginLeft: -8,
  },
  backText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2D3748',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A202C',
    textAlign: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
  },
  spacer: {
    width: 80,
  },
});