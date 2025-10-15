import { useRouter } from "expo-router";
import moment from "moment-timezone";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

// Modern color palette
const COLORS = {
  primary: "#4361EE", // More modern blue
  primaryLight: "#4895EF",
  primaryDark: "#3A0CA3",
  background: "#F8F9FA",
  backgroundGradient: ["#FFFFFF", "#F0F4FF"],
  text: "#2D3748",
  textSecondary: "#718096",
  accent: "#4CC9F0",
  white: "#FFFFFF",
  shadow: "rgba(67, 97, 238, 0.15)",
};

export default function Index() {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState("15:23");
  const { t, i18n } = useTranslation();
  
  // Animation values
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    const updateTime = () => {
      const hongKongTime = moment().tz("Asia/Hong_Kong").format("HH:mm");
      setCurrentTime(hongKongTime);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
    ]).start();

    return () => clearInterval(interval);
  }, []);

  const goToLogin = () => {
    // Add navigation animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.push("/login");
    });
  };

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === "en" ? "zh" : "en");
  };

  return (
    <View style={styles.container}>
      {/* Background Elements */}
      <View style={styles.backgroundCircle1} />
      <View style={styles.backgroundCircle2} />
      
      {/* Header */}
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <View style={styles.languageSwitcher}>
          <TouchableOpacity
            onPress={toggleLanguage}
            style={styles.languageButton}
          >
            <Text style={styles.languageText}>
              {i18n.language === "en" ? "中文" : "English"}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.timeContainer}>
          <Text style={styles.time}>
            {t("common.time", { time: currentTime })}
          </Text>
          <View style={styles.locationBadge}>
            <Text style={styles.location}>{t("welcome.location")}</Text>
          </View>
        </View>
      </Animated.View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Logo with Animation */}
        <Animated.View 
          style={[
            styles.logoSection,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          <View style={styles.logoContainer}>
            <View style={styles.logoBackground} />
            <View style={styles.logo}>
              <Text style={styles.logoText}>👋</Text>
            </View>
            <View style={styles.logoPulse} />
          </View>
          <Text style={styles.appName}>{t("welcome.title")}</Text>
          <Text style={styles.appNameChinese}>{t("welcome.chineseTitle")}</Text>
        </Animated.View>

        {/* Welcome Message */}
        <Animated.View 
          style={[
            styles.welcomeSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.welcomeText}>{t("welcome.subtitle")}</Text>
        </Animated.View>

        {/* Get Started Button with Modern Design */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }}
        >
          <TouchableOpacity 
            style={styles.button} 
            onPress={goToLogin}
            activeOpacity={0.8}
          >
            <View style={styles.buttonBackground} />
            <Text style={styles.buttonText}>{t("welcome.getStarted")}</Text>
            <View style={styles.buttonIcon}>
              <Text style={styles.buttonIconText}>→</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Footer */}
      <Animated.View 
        style={[
          styles.footer,
          {
            opacity: fadeAnim,
          }
        ]}
      >
        <Text style={styles.footerText}>
          {t("welcome.alreadyHaveAccount")}{" "}
          <Text style={styles.loginLink} onPress={goToLogin}>
            {t("welcome.signIn")}
          </Text>
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
  },
  backgroundCircle1: {
    position: "absolute",
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: COLORS.primaryLight,
    opacity: 0.1,
  },
  backgroundCircle2: {
    position: "absolute",
    bottom: -150,
    left: -150,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: COLORS.accent,
    opacity: 0.05,
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 80,
  },
  languageSwitcher: {
    flex: 1,
  },
  languageButton: {
    padding: 12,
    alignSelf: "flex-start",
    backgroundColor: COLORS.white,
    borderRadius: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  languageText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  timeContainer: {
    alignItems: "flex-end",
  },
  time: {
    fontSize: 36,
    fontWeight: "300",
    color: COLORS.text,
    marginBottom: 8,
    fontVariant: ["tabular-nums"],
  },
  locationBadge: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  location: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  mainContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 60,
  },
  logoContainer: {
    position: "relative",
    marginBottom: 24,
  },
  logoBackground: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primaryLight,
    opacity: 0.1,
    top: -20,
    left: -20,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  logoPulse: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: COLORS.primaryLight,
    opacity: 0.3,
    top: -10,
    left: -10,
  },
  logoText: {
    fontSize: 40,
    color: COLORS.white,
  },
  appName: {
    fontSize: 42,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  appNameChinese: {
    fontSize: 26,
    color: COLORS.primary,
    fontWeight: "600",
  },
  welcomeSection: {
    marginBottom: 60,
    maxWidth: 300,
  },
  welcomeText: {
    fontSize: 18,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    minWidth: 220,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    position: "relative",
    overflow: "hidden",
  },
  buttonBackground: {
    position: "absolute",
    top: 0,
    left: "-100%",
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.primaryDark,
    transform: [{ skewX: "-15deg" }],
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginRight: 8,
  },
  buttonIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonIconText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "bold",
  },
  footer: {
    paddingBottom: 40,
    alignItems: "center",
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  loginLink: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
});