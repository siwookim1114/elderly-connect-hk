import { Stack } from "expo-router";
import "./i18n"; // Now it's in the same folder

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="home" options={{ headerShown: false }} />
      <Stack.Screen
        name="ActivityDiscovery"
        options={{
          headerShown: true,
          title: "Find Activities",
          headerBackTitle: "Back",
        }}
      />
      <Stack.Screen
        name="voice-companion"
        options={{
          headerShown: true,
          title: "Voice Companion",
          headerBackTitle: "Back",
        }}
      />
      <Stack.Screen
        name="memory-garden"
        options={{
          headerShown: true,
          title: "Memory Garden",
          headerBackTitle: "Back",
        }}
      />
    </Stack>
  );
}

