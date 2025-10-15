import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Feature, Language } from "../types";
import { FEATURES } from "./constants/features";

export default function HomeDashboard() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language as Language;

  const toggleLanguage = () => {
    const newLanguage: Language = currentLanguage === "en" ? "zh" : "en";
    i18n.changeLanguage(newLanguage);
  };

  const handleFeaturePress = (feature: Feature) => {
    router.push(feature.route);
  };

  const renderFeatureButton = (feature: Feature) => (
    <TouchableOpacity
      key={feature.id}
      style={[styles.featureButton, { backgroundColor: feature.color }]}
      onPress={() => handleFeaturePress(feature)}
      activeOpacity={0.7}
    >
      {feature.badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{feature.badge}</Text>
        </View>
      )}
      <Text style={styles.featureIcon}>{feature.icon}</Text>
      <Text style={styles.featureTitle}>{t(feature.title)}</Text>
      <Text style={styles.featureSubtitle}>{t(feature.subtitle)}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Language Toggle */}
        <TouchableOpacity
          style={styles.languageToggle}
          onPress={toggleLanguage}
          activeOpacity={0.7}
        >
          <Text style={styles.languageText}>
            {currentLanguage === "en" ? "English" : "粵語"}
          </Text>
          <Text style={styles.toggleIcon}>🌐</Text>
        </TouchableOpacity>

        {/* Welcome Header */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>{t("home.welcome")}</Text>
          <Text style={styles.subtitle}>{t("home.tagline")}</Text>
        </View>

        {/* Feature Buttons */}
        <View style={styles.featuresContainer}>
          {FEATURES.map(renderFeatureButton)}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "space-evenly",
  },
  languageToggle: {
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 8,
  },
  languageText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  toggleIcon: {
    fontSize: 24,
  },
  header: {
    paddingVertical: 12,
    alignItems: "center",
  },
  welcomeText: {
    fontSize: 36,
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 22,
    color: "#555",
    textAlign: "center",
    fontWeight: "500",
  },
  featuresContainer: {
    gap: 20,
    paddingBottom: 20,
  },
  featureButton: {
    minHeight: 160,
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 32,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#FF6B6B",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  badgeText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  featureIcon: {
    fontSize: 64,
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#2C2C2C",
    textAlign: "center",
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  featureSubtitle: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    fontWeight: "500",
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  featureButtonPressed: {
  transform: [{ scale: 0.98 }],
  opacity: 0.9,
},
});