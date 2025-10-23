import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FEATURES } from "../app/constants/features";
import { FeatureButton } from "../components/FeatureButton";

import type { Language } from "./constants";

// Orange color palette for Mingle app (consistent with login)
const COLORS = {
  primary: "#E67E22", // Warm orange
  primaryLight: "#F39C12", // Lighter orange
  primaryDark: "#D35400", // Darker orange
  background: "#FFF9F2", // Warm white background
  card: "#FFFFFF",
  text: "#2C3E50", // Dark blue-gray for text
  textSecondary: "#7F8C8D", // Gray for secondary text
  border: "#FAD7A0", // Light orange border
  inputBackground: "#FEF5E7", // Very light orange
  error: "#E74C3C",
  success: "#27AE60",
  accent: "#F1C40F", // Golden yellow accent
};

export default function HomeDashboard() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language as Language;

  const toggleLanguage = () => {
    const newLanguage: Language = currentLanguage === "en" ? "zh" : "en";
    i18n.changeLanguage(newLanguage);
  };

  const handleFeaturePress = (feature: any) => {
    router.push(feature.route);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Background Elements */}
      <View style={styles.background}>
        <View style={styles.orangeCircle} />
        <View style={styles.lightOrangeCircle} />
      </View>

      {/* Replace View with ScrollView */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Language Toggle */}
        <TouchableOpacity
          style={styles.languageToggle}
          onPress={toggleLanguage}
          activeOpacity={0.7}
        >
          <Text style={styles.languageText}>
            {currentLanguage === "en" ? "中文" : "English"}
          </Text>
          <Text style={styles.toggleIcon}>🌐</Text>
        </TouchableOpacity>

        {/* Mingle Logo and Welcome Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../assets/images/logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.brandName}>Mingle</Text>
          <Text style={styles.location}>Hong Kong · 香港</Text>
          <Text style={styles.welcomeText}>{t("home.welcome")}</Text>
          <Text style={styles.subtitle}>{t("home.tagline")}</Text>
        </View>

        {/* Feature Buttons - Now includes Help Desk */}
        <View style={styles.featuresContainer}>
          {FEATURES.map((feature) => (
            <FeatureButton
              key={feature.id}
              feature={feature}
              onPress={handleFeaturePress}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  orangeCircle: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(230, 126, 34, 0.08)',
  },
  lightOrangeCircle: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(243, 156, 18, 0.05)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  languageToggle: {
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    gap: 6,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginTop: 10,
    marginBottom: 20,
  },
  languageText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
  },
  toggleIcon: {
    fontSize: 16,
  },
  header: {
    paddingVertical: 20,
    alignItems: "center",
    marginBottom: 30,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.card,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 2,
    borderColor: COLORS.primaryLight,
  },
  logo: {
    width: 60,
    height: 60,
  },
  brandName: {
    fontSize: 42,
    fontWeight: "bold",
    color: COLORS.primary,
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  location: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    fontWeight: "500",
    marginBottom: 24,
    letterSpacing: 0.3,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "600",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.textSecondary,
    textAlign: "center",
    fontWeight: "400",
    lineHeight: 24,
    letterSpacing: 0.2,
  },
  featuresContainer: {
    gap: 20,
    paddingBottom: 40,
  },
});