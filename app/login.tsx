import { useRouter } from "expo-router";
import moment from "moment-timezone";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

// Clean color palette inspired by Samsung
const COLORS = {
  primary: "#1428A0", // Samsung blue
  primaryDark: "#0D1C6B",
  background: "#FFFFFF",
  card: "#FFFFFF",
  text: "#000000",
  textSecondary: "#666666",
  border: "#E5E5E5",
  inputBackground: "#F8F8F8",
  error: "#E31C1C",
  success: "#2E7D32",
};

export default function LoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState("15:23");
  const router = useRouter();
  const { t, i18n } = useTranslation();

  // Update Hong Kong time with moment-timezone
  useEffect(() => {
    const updateTime = () => {
      const hongKongTime = moment().tz("Asia/Hong_Kong").format("HH:mm");
      setCurrentTime(hongKongTime);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === "en" ? "zh" : "en");
  };

  const handleSendOtp = () => {
    if (phoneNumber.length < 8) {
      Alert.alert(
        i18n.language === "en" ? "Invalid Phone" : "電話號碼無效",
        i18n.language === "en"
          ? "Please enter a valid Hong Kong phone number"
          : "請輸入有效的香港電話號碼"
      );
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsOtpSent(true);
      setIsLoading(false);
    }, 1500);
  };

  const handleVerifyOtp = () => {
    if (otp.length !== 6) {
      Alert.alert(
        i18n.language === "en" ? "Invalid OTP" : "驗證碼無效",
        i18n.language === "en"
          ? "Please enter 6-digit OTP"
          : "請輸入6位數驗證碼"
      );
      return;
    }

    setIsLoading(true);

    // Simulate OTP verification
    setTimeout(() => {
      setIsLoading(false);

      // Show success alert and navigate to Home Dashboard
      Alert.alert(
        i18n.language === "en" ? "Success!" : "成功！",
        i18n.language === "en"
          ? "Login successful! Welcome to Elderly Connect."
          : "登入成功！歡迎來到長者連線。",
        [
          {
            text: "OK",
            onPress: () => {
              // Navigate to Home Dashboard
              router.replace("/home"); // Use 'replace' to prevent going back to login
            },
          },
        ]
      );
    }, 1500);
  };

  const handleEditPhone = () => {
    setIsOtpSent(false);
    setOtp("");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        {/* Header with Language Switcher and Time */}
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
          {/* App Logo and Name */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>💬</Text>
            </View>
            <Text style={styles.appName}>{t("welcome.title")}</Text>
            <Text style={styles.appNameChinese}>
              {t("welcome.chineseTitle")}
            </Text>
          </View>

          {/* Login Card */}
          <View style={styles.loginCard}>
            <Text style={styles.loginTitle}>
              {isOtpSent ? t("login.enterVerification") : t("login.title")}
            </Text>

            {!isOtpSent ? (
              /* Phone Number Input */
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t("login.phoneNumber")}</Text>
                <View style={styles.phoneInputContainer}>
                  <View style={styles.countryCode}>
                    <Text style={styles.countryCodeText}>+852</Text>
                  </View>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder={t("login.enterPhone")}
                    placeholderTextColor="#999999"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    maxLength={8}
                  />
                </View>
                <Text style={styles.helperText}>{t("login.sendCode")}</Text>
              </View>
            ) : (
              /* OTP Input */
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {t("login.verificationCode")}
                </Text>
                <TextInput
                  style={styles.otpInput}
                  placeholder="000000"
                  placeholderTextColor="#999999"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                  textAlign="center"
                />
                <Text style={styles.helperText}>
                  {t("login.codeSent", { phone: phoneNumber })}
                </Text>
                <TouchableOpacity
                  onPress={handleEditPhone}
                  style={styles.editPhone}
                >
                  <Text style={styles.editPhoneText}>
                    {t("login.editPhone")}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Action Button */}
            <TouchableOpacity
              style={[
                styles.actionButton,
                isLoading && styles.actionButtonDisabled,
              ]}
              onPress={isOtpSent ? handleVerifyOtp : handleSendOtp}
              disabled={isLoading}
            >
              <Text style={styles.actionButtonText}>
                {isLoading
                  ? t("login.loading")
                  : isOtpSent
                  ? t("login.verify")
                  : t("login.send")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Alternative Login */}
          <View style={styles.alternativeSection}>
            <Text style={styles.alternativeText}>{t("login.or")}</Text>
            <TouchableOpacity style={styles.alternativeButton}>
              <Text style={styles.alternativeButtonText}>
                {t("login.loginWithEmail")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>{t("login.terms")}</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
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
    marginBottom: 50,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logoText: {
    fontSize: 32,
    fontWeight: "bold",
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
  loginCard: {
    backgroundColor: COLORS.card,
    width: "100%",
    maxWidth: 400,
    padding: 32,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: "300",
    color: COLORS.text,
    marginBottom: 32,
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.text,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  phoneInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  countryCode: {
    backgroundColor: COLORS.inputBackground,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRightWidth: 0,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.text,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 0,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
    height: 50,
  },
  otpInput: {
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 16,
    fontSize: 18,
    color: COLORS.text,
    height: 50,
    marginBottom: 8,
    fontWeight: "500",
    letterSpacing: 4,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 16,
  },
  editPhone: {
    alignSelf: "center",
    marginTop: 12,
    padding: 8,
  },
  editPhoneText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "500",
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
    opacity: 0.7,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  alternativeSection: {
    alignItems: "center",
    marginTop: 32,
  },
  alternativeText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  alternativeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  alternativeButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "500",
  },
  footer: {
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 16,
  },
});
