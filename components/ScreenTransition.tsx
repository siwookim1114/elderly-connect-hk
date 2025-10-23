import React, { useEffect } from 'react';
import { Animated, StyleSheet } from 'react-native';

interface ScreenTransitionProps {
  children: React.ReactNode;
  duration?: number;
}

export const ScreenTransition: React.FC<ScreenTransitionProps> = ({ 
  children, 
  duration = 400 
}) => {
  const fadeAnim = new Animated.Value(0);
  const translateY = new Animated.Value(20);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, translateY, duration]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});