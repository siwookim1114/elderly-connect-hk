import { useRouter } from "expo-router";
import moment from "moment-timezone";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const COLORS = {
  primary: "#1428A0",
  background: "#FFFFFF",
  text: "#000000",
  textSecondary: "#666666",
};

export default function Index() {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState("15:23");
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const updateTime = () => {
      const hongKongTime = moment().tz("Asia/Hong_Kong").format("HH:mm");
      setCurrentTime(hongKongTime);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const goToLogin = () => {
    router.push("/login");
  };

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === "en" ? "zh" : "en");
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
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
          <Text style={styles.location}>{t("welcome.location")}</Text>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Logo */}
        <View style={styles.logoSection}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>💬</Text>
          </View>
          <Text style={styles.appName}>{t("welcome.title")}</Text>
          <Text style={styles.appNameChinese}>{t("welcome.chineseTitle")}</Text>
        </View>

        {/* Welcome Message */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>{t("welcome.subtitle")}</Text>
        </View>

        {/* Get Started Button */}
        <TouchableOpacity style={styles.button} onPress={goToLogin}>
          <Text style={styles.buttonText}>{t("welcome.getStarted")}</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {t("welcome.alreadyHaveAccount")}{" "}
          <Text style={styles.loginLink} onPress={goToLogin}>
            {t("welcome.signIn")}
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
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
    padding: 8,
    alignSelf: "flex-start",
  },
  languageText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "500",
  },
  timeContainer: {
    alignItems: "flex-end",
  },
  time: {
    fontSize: 32,
    fontWeight: "300",
    color: COLORS.text,
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
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
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  logoText: {
    fontSize: 32,
    color: "#FFFFFF",
  },
  appName: {
    fontSize: 36,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 4,
  },
  appNameChinese: {
    fontSize: 24,
    color: COLORS.primary,
    fontWeight: "600",
  },
  welcomeSection: {
    marginBottom: 60,
  },
  welcomeText: {
    fontSize: 18,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 8,
    minWidth: 200,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
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
