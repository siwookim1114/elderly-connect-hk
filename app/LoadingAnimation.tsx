import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface LoadingAnimationProps {
  status?: string;
}

export default function LoadingAnimation({ status }: LoadingAnimationProps) {
  const { t } = useTranslation();
  const scale1 = useRef(new Animated.Value(0)).current;
  const scale2 = useRef(new Animated.Value(0)).current;
  const scale3 = useRef(new Animated.Value(0)).current;
  const opacity1 = useRef(new Animated.Value(1)).current;
  const opacity2 = useRef(new Animated.Value(1)).current;
  const opacity3 = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const createAnimation = (
      scale: Animated.Value,
      opacity: Animated.Value,
      delay: number
    ) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(scale, {
              toValue: 2.5,
              duration: 2000,
              easing: Easing.ease,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 2000,
              easing: Easing.ease,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(scale, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 1,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
    };

    const anim1 = createAnimation(scale1, opacity1, 0);
    const anim2 = createAnimation(scale2, opacity2, 666);
    const anim3 = createAnimation(scale3, opacity3, 1333);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, []);

  // Determine the appropriate loading message based on status
  const getLoadingMessage = () => {
    switch (status) {
      case "detectingLocation":
        return t("activities.detectingLocation");
      case "locationDetected":
        return t("activities.locationDetected");
      case "gettingRecommendations":
        return t("activities.gettingRecommendations") || "Getting AI recommendations...";
      case "preparingResults":
        return t("activities.preparingResults") || "Preparing your results...";
      default:
        return t("activities.loading");
    }
  };

  const getSubtextMessage = () => {
    switch (status) {
      case "detectingLocation":
        return t("activities.pleaseWait");
      case "gettingRecommendations":
        return t("activities.pleaseWait");
      default:
        return t("activities.pleaseWait");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.circleContainer}>
          <Animated.View
            style={[
              styles.circle,
              {
                transform: [{ scale: scale1 }],
                opacity: opacity1,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.circle,
              {
                transform: [{ scale: scale2 }],
                opacity: opacity2,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.circle,
              {
                transform: [{ scale: scale3 }],
                opacity: opacity3,
              },
            ]}
          />
        </View>

        <Text style={styles.loadingText}>{getLoadingMessage()}</Text>
        <Text style={styles.loadingSubtext}>{getSubtextMessage()}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
  },
  circleContainer: {
    width: 200,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
  },
  circle: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#007AFF",
  },
  loadingText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  loadingSubtext: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});