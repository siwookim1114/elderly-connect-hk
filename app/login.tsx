import { useRouter } from "expo-router";
import moment from "moment-timezone";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  BounceIn,
  FadeIn,
  FadeInDown,
  FadeInLeft,
  FadeInRight,
  FadeInUp,
  SlideInLeft,
  SlideInRight,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  ZoomIn
} from "react-native-reanimated";

const { width, height } = Dimensions.get("window");

// Orange color palette for Mingle app
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

// Animated components
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedText = Animated.createAnimatedComponent(Text);
const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedImage = Animated.createAnimatedComponent(Image);

export default function LoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState("15:23");
  const router = useRouter();
  const { t, i18n } = useTranslation();

  // Animation values
  const buttonScale = useSharedValue(1);
  const cardOpacity = useSharedValue(1);
  const skipButtonScale = useSharedValue(1);

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
    cardOpacity.value = withSequence(
      withTiming(0, { duration: 200 }),
      withTiming(1, { duration: 300 })
    );
    i18n.changeLanguage(i18n.language === "en" ? "zh" : "en");
  };

  const handleSendOtp = () => {
    if (phoneNumber.length < 8) {
      buttonScale.value = withSequence(
        withTiming(0.95, { duration: 100 }),
        withSpring(1, { damping: 3 })
      );
      Alert.alert(
        i18n.language === "en" ? "Invalid Phone" : "電話號碼無效",
        i18n.language === "en"
          ? "Please enter a valid Hong Kong phone number"
          : "請輸入有效的香港電話號碼"
      );
      return;
    }

    setIsLoading(true);
    buttonScale.value = withTiming(0.95);
    
    setTimeout(() => {
      setIsOtpSent(true);
      setIsLoading(false);
      buttonScale.value = withSpring(1);
    }, 1500);
  };

  const handleVerifyOtp = () => {
    if (otp.length !== 6) {
      buttonScale.value = withSequence(
        withTiming(0.95, { duration: 100 }),
        withSpring(1, { damping: 3 })
      );
      Alert.alert(
        i18n.language === "en" ? "Invalid OTP" : "驗證碼無效",
        i18n.language === "en"
          ? "Please enter 6-digit OTP"
          : "請輸入6位數驗證碼"
      );
      return;
    }

    setIsLoading(true);
    buttonScale.value = withTiming(0.95);

    setTimeout(() => {
      setIsLoading(false);
      buttonScale.value = withSpring(1);

      Alert.alert(
        i18n.language === "en" ? "Success!" : "成功！",
        i18n.language === "en"
          ? "Login successful! Welcome to Mingle."
          : "登入成功！歡迎來到 Mingle。",
        [
          {
            text: "OK",
            onPress: () => {
              router.replace("/home");
            },
          },
        ]
      );
    }, 1500);
  };

  const handleEditPhone = () => {
    cardOpacity.value = withSequence(
      withTiming(0, { duration: 200 }),
      withTiming(1, { duration: 300 })
    );
    setIsOtpSent(false);
    setOtp("");
  };

  const handleSkipLogin = () => {
    console.log("Skip login pressed");
    router.replace("/home");
  };

  // Animated styles
  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const animatedSkipButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: skipButtonScale.value }],
  }));

  const animatedCardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
  }));

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Background Gradient */}
      <View style={styles.background}>
        <View style={styles.orangeCircle} />
        <View style={styles.lightOrangeCircle} />
      </View>

      <View style={styles.content}>
        {/* Header with Language Switcher and Time */}
        <AnimatedView 
          style={styles.header}
          entering={FadeInDown.duration(800)}
        >
          <View style={styles.languageSwitcher}>
            <AnimatedTouchableOpacity
              onPress={toggleLanguage}
              style={styles.languageButton}
              entering={FadeInLeft.duration(600).delay(200)}
            >
              <Text style={styles.languageText}>
                {i18n.language === "en" ? "中文" : "English"}
              </Text>
            </AnimatedTouchableOpacity>
          </View>
          <AnimatedView 
            style={styles.timeContainer}
            entering={FadeInRight.duration(600).delay(200)}
          >
            <Text style={styles.time}>
              {t("common.time", { time: currentTime })}
            </Text>
            <Text style={styles.location}>{t("welcome.location")}</Text>
          </AnimatedView>
        </AnimatedView>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* App Logo and Name */}
          <AnimatedView 
            style={styles.logoSection}
            entering={BounceIn.duration(1000).delay(300)}
          >
            <AnimatedView 
              style={styles.logoContainer}
              entering={ZoomIn.duration(800).delay(400)}
            >
              <AnimatedImage
                source={require('@/assets/images/logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
                entering={FadeIn.duration(800).delay(500)}
              />
            </AnimatedView>
            <AnimatedText 
              style={styles.appName}
              entering={FadeInUp.duration(700).delay(600)}
            >
              Mingle
            </AnimatedText>
            <AnimatedText 
              style={styles.appSubtitle}
              entering={FadeInUp.duration(700).delay(700)}
            >
              {i18n.language === "en" ? "Connect • Share • Enjoy" : "連接 • 分享 • 享受"}
            </AnimatedText>
          </AnimatedView>

          {/* Login Card */}
          <AnimatedView 
            style={[styles.loginCard, animatedCardStyle]}
            entering={FadeInUp.duration(800).delay(800)}
          >
            <AnimatedText 
              style={styles.loginTitle}
              entering={FadeIn.duration(600).delay(900)}
            >
              {isOtpSent ? t("login.enterVerification") : "Welcome Back"}
            </AnimatedText>

            {!isOtpSent ? (
              /* Phone Number Input */
              <AnimatedView 
                style={styles.inputGroup}
                entering={SlideInLeft.duration(500).delay(1000)}
              >
                <Text style={styles.inputLabel}>Phone Number</Text>
                <View style={styles.phoneInputContainer}>
                  <View style={styles.countryCode}>
                    <Text style={styles.countryCodeText}>+852</Text>
                  </View>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="Enter your phone number"
                    placeholderTextColor="#999999"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    maxLength={8}
                  />
                </View>
                <Text style={styles.helperText}>
                  We'll send a verification code to your phone
                </Text>
              </AnimatedView>
            ) : (
              /* OTP Input */
              <AnimatedView 
                style={styles.inputGroup}
                entering={SlideInRight.duration(500).delay(1000)}
              >
                <Text style={styles.inputLabel}>
                  Verification Code
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
                  Code sent to {phoneNumber}
                </Text>
                <TouchableOpacity
                  onPress={handleEditPhone}
                  style={styles.editPhone}
                >
                  <Text style={styles.editPhoneText}>
                    Edit phone number
                  </Text>
                </TouchableOpacity>
              </AnimatedView>
            )}

            {/* Action Button */}
            <AnimatedTouchableOpacity
              style={[
                styles.actionButton,
                isLoading && styles.actionButtonDisabled,
                animatedButtonStyle,
              ]}
              onPress={isOtpSent ? handleVerifyOtp : handleSendOtp}
              disabled={isLoading}
              entering={FadeInUp.duration(600).delay(1100)}
            >
              <Text style={styles.actionButtonText}>
                {isLoading
                  ? "Sending..."
                  : isOtpSent
                  ? "Verify Code"
                  : "Send Code"}
              </Text>
            </AnimatedTouchableOpacity>

            {/* Skip Login Button */}
            <AnimatedTouchableOpacity
              style={[styles.skipButton, animatedSkipButtonStyle]}
              onPress={handleSkipLogin}
              entering={FadeInUp.duration(600).delay(1200)}
            >
              <Text style={styles.skipButtonText}>
                {i18n.language === "en" ? "Skip for now" : "稍後登入"}
              </Text>
            </AnimatedTouchableOpacity>
          </AnimatedView>
        </View>

        {/* Footer */}
        <AnimatedView 
          style={styles.footer}
          entering={FadeInUp.duration(600).delay(1300)}
        >
          <Text style={styles.footerText}>
            {i18n.language === "en" 
              ? "By continuing, you agree to our Terms and Privacy Policy"
              : "繼續即表示您同意我們的條款和隱私政策"}
          </Text>
        </AnimatedView>
      </View>
    </KeyboardAvoidingView>
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
    bottom: -60,
    left: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(243, 156, 18, 0.05)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 60 : 50,
    paddingBottom: 30,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10, // Reduced margin
  },
  languageSwitcher: {
    flex: 1,
  },
  languageButton: {
    padding: 10,
    alignSelf: "flex-start",
    backgroundColor: COLORS.card,
    borderRadius: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    fontSize: 28, // Slightly smaller
    fontWeight: "300",
    color: COLORS.text,
    marginBottom: 2, // Reduced margin
  },
  location: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  mainContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -20, // Pull content up slightly
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 30, // Reduced margin
  },
  logoContainer: {
    width: 90, // Slightly smaller
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.card,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16, // Reduced margin
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 2,
    borderColor: COLORS.primaryLight,
  },
  logoImage: {
    width: 50, // Slightly smaller
    height: 50,
  },
  appName: {
    fontSize: 36, // Slightly smaller
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 6, // Reduced margin
    letterSpacing: 0.5,
  },
  appSubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  loginCard: {
    backgroundColor: COLORS.card,
    width: "100%",
    maxWidth: 400,
    padding: 28, // Slightly reduced padding
    borderRadius: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 10, // Added margin top
  },
  loginTitle: {
    fontSize: 22, // Slightly smaller
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 24, // Reduced margin
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: 24, // Reduced margin
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 10, // Reduced margin
    letterSpacing: 0.3,
  },
  phoneInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6, // Reduced margin
  },
  countryCode: {
    backgroundColor: COLORS.inputBackground,
    paddingHorizontal: 16,
    paddingVertical: 14, // Slightly reduced
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRightWidth: 0,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  countryCodeText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.primary,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: COLORS.inputBackground,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderLeftWidth: 0,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    padding: 14, // Slightly reduced
    fontSize: 15,
    color: COLORS.text,
    height: 48, // Slightly reduced
    fontWeight: "500",
  },
  otpInput: {
    backgroundColor: COLORS.inputBackground,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 14, // Slightly reduced
    fontSize: 16,
    color: COLORS.text,
    height: 48, // Slightly reduced
    marginBottom: 6, // Reduced margin
    fontWeight: "600",
    letterSpacing: 3,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 16,
  },
  editPhone: {
    alignSelf: "center",
    marginTop: 10, // Reduced margin
    padding: 6, // Reduced padding
  },
  editPhoneText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "600",
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    padding: 16, // Slightly reduced
    borderRadius: 12,
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
    marginBottom: 12, // Reduced margin
  },
  actionButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
    opacity: 0.7,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  skipButton: {
    padding: 10, // Reduced padding
    alignItems: "center",
  },
  skipButtonText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  footer: {
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 10, // Reduced margin
  },
  footerText: {
    fontSize: 11, // Slightly smaller
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 15,
    fontWeight: "500",
  },
});