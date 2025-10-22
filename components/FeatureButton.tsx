import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Feature } from '../app/constants';

interface FeatureButtonProps {
  feature: Feature;
  onPress: (feature: Feature) => void;
}

export const FeatureButton: React.FC<FeatureButtonProps> = ({ feature, onPress }) => {
  const { t } = useTranslation();

  // Fallback to direct string if translation key doesn't exist
  const getTitle = () => {
    const translation = t(feature.title);
    return translation === feature.title ? 
      feature.title.replace('home.', '').replace(/([A-Z])/g, ' $1').trim() : 
      translation;
  };

  const getSubtitle = () => {
    const translation = t(feature.subtitle);
    return translation === feature.subtitle ? 
      feature.subtitle.replace('home.', '').replace('Subtitle', '').replace(/([A-Z])/g, ' $1').trim() : 
      translation;
  };

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: feature.color }]}
      onPress={() => onPress(feature)}
      activeOpacity={0.7}
    >
      {feature.badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{feature.badge}</Text>
        </View>
      )}
      <Text style={styles.icon}>{feature.icon}</Text>
      <Text style={styles.title}>{getTitle()}</Text>
      <Text style={styles.subtitle}>{getSubtitle()}</Text>
    </TouchableOpacity>
  );
};
const styles = StyleSheet.create({
  button: {
    minHeight: 160,
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FF6B6B',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  icon: {
    fontSize: 64,
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#2C2C2C',
    textAlign: 'center',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
});