import { Stack } from "expo-router";
import { useEffect } from 'react';
import { Platform, StatusBar } from "react-native";
import "./i18n";

export default function RootLayout() {
  // Set status bar style
  useEffect(() => {
    StatusBar.setBarStyle('dark-content');
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('#FFFFFF');
      StatusBar.setTranslucent(true);
    }
  }, []);

  // Mingle brand color palette - Fixed with all required shades
  const mingleColors = {
    primary: {
      50: '#FFF5F5',
      100: '#FED7D7',
      200: '#FEB2B2',
      300: '#FC8181',
      500: '#E53E3E',
      600: '#C53030',
      700: '#9B2C2C',
      800: '#822727',
      900: '#742A2A',
    },
    secondary: {
      50: '#F7FAFC',
      100: '#EDF2F7',
      200: '#E2E8F0',
      300: '#CBD5E0',
      500: '#718096',
      600: '#4A5568',
      700: '#2D3748',
      800: '#1A202C',
      900: '#171923',
    },
    accent: {
      gold: '#D69E2E',
      warm: '#DD6B20',
    }
  };

  const featureGradients = {
    voice: ['#FED7D7', '#E53E3E'], // Red theme
    memory: ['#FEEBC8', '#DD6B20'], // Orange theme
    activity: ['#C6F6D5', '#38A169'], // Green theme
    help: ['#E9D8FD', '#6B46C1'], // Purple theme for Help Desk
  };

  // Get appropriate font family
  const getFontFamily = (weight: 'bold' | 'semibold' | 'medium' | 'regular' = 'regular') => {
    if (Platform.OS === 'ios') {
      switch (weight) {
        case 'bold': return 'System';
        case 'semibold': return 'System';
        case 'medium': return 'System';
        default: return 'System';
      }
    } else {
      switch (weight) {
        case 'bold': return 'sans-serif-condensed';
        case 'semibold': return 'sans-serif';
        case 'medium': return 'sans-serif';
        default: return 'sans-serif';
      }
    }
  };

  // Create header title style
  const headerTitleStyle = {
    fontFamily: getFontFamily('semibold'),
    fontSize: 18,
    color: mingleColors.secondary[900],
  };

  // Create header back title style
  const headerBackTitleStyle = {
    fontFamily: getFontFamily('medium'),
    fontSize: 16,
  };

  return (
    <>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="transparent" 
        translucent 
      />
      <Stack
        screenOptions={{
          // Mingle brand header styling
          headerBackTitle: "Back",
          headerTintColor: mingleColors.primary[600],
          headerTitleStyle: headerTitleStyle,
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
          headerBackTitleStyle: headerBackTitleStyle,
          
          // Mingle brand content styling
          contentStyle: {
            backgroundColor: mingleColors.secondary[50],
          },
          
          // Enhanced animations
          animation: 'slide_from_right',
          animationDuration: 350,
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
          gestureDirection: 'horizontal',
          
          // Modern card-style for screens
          presentation: Platform.OS === 'ios' ? 'card' : 'transparentModal',
          
          // Header customization
          headerTransparent: false,
          headerBackButtonMenuEnabled: true,
          // Removed headerBackTitleVisible as it's not a valid option
          
          // Use built-in shadow instead of custom shadow properties
          headerShadowVisible: true,
        }}
      >
        {/* Splash/Index - Elegant fade */}
        <Stack.Screen 
          name="index" 
          options={{ 
            headerShown: false,
            animation: 'fade',
            animationDuration: 600,
            gestureEnabled: false,
          }} 
        />
        
        {/* Login - Smooth bottom slide */}
        <Stack.Screen 
          name="login" 
          options={{ 
            headerShown: false,
            animation: 'slide_from_bottom',
            animationDuration: 450,
            gestureEnabled: false,
            presentation: 'modal',
          }} 
        />
        
        {/* Home - Elegant slide */}
        <Stack.Screen 
          name="home" 
          options={{ 
            headerShown: false,
            animation: 'slide_from_right',
            animationDuration: 400,
            gestureEnabled: true,
          }} 
        />
        
        {/* Feature Screens with Mingle-themed Headers */}
        <Stack.Screen
          name="ActivityDiscovery"
          options={{
            headerShown: true,
            title: "Activity Discovery",
            headerTitleAlign: "center",
            headerShadowVisible: true,
            headerBackButtonDisplayMode: "minimal",
            headerStyle: {
              backgroundColor: featureGradients.activity[0],
            },
            headerTintColor: mingleColors.secondary[800],
            animation: 'slide_from_right',
            animationDuration: 400,
          }}
        />
        
        <Stack.Screen
          name="voice-companion"
          options={{
            headerShown: true,
            title: "Voice Companion",
            headerTitleAlign: "center",
            headerShadowVisible: true,
            headerBackButtonDisplayMode: "minimal",
            headerStyle: {
              backgroundColor: featureGradients.voice[0],
            },
            headerTintColor: mingleColors.secondary[800],
            animation: 'slide_from_right',
            animationDuration: 400,
          }}
        />
        
        <Stack.Screen
          name="memory-garden"
          options={{
            headerShown: true,
            title: "Memory Garden",
            headerTitleAlign: "center",
            headerShadowVisible: true,
            headerBackButtonDisplayMode: "minimal",
            headerStyle: {
              backgroundColor: featureGradients.memory[0],
            },
            headerTintColor: mingleColors.secondary[800],
            animation: 'slide_from_right',
            animationDuration: 400,
          }}
        />
        
        {/* NEW: Help Desk Screen */}
        <Stack.Screen
          name="help-desk"
          options={{
            headerShown: true,
            title: "Help Desk",
            headerTitleAlign: "center",
            headerShadowVisible: true,
            headerBackButtonDisplayMode: "minimal",
            headerStyle: {
              backgroundColor: featureGradients.help[0],
            },
            headerTintColor: mingleColors.secondary[800],
            animation: 'slide_from_right',
            animationDuration: 400,
          }}
        />
      </Stack>
    </>
  );
}