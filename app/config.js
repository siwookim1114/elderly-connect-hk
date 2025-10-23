// API Configuration for Voice Companion
// Prefer Expo public env vars if provided
const ENV_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const ENV_HOST = process.env.EXPO_PUBLIC_API_HOST;
const ENV_PORT = process.env.EXPO_PUBLIC_API_PORT;
const ENV_TIMEOUT = process.env.EXPO_PUBLIC_API_TIMEOUT;

// Use your computer's IP address for phone connectivity during development
// Your computer's IP: 192.168.0.193
const LOCAL_IP = ENV_HOST || "192.168.0.193";
const PORT = ENV_PORT || "5002";  // Voice Companion backend runs on port 5002

export const API_CONFIG = {
  BASE_URL: __DEV__
    ? ENV_BASE_URL || `http://${LOCAL_IP}:${PORT}`
    : ENV_BASE_URL || "https://your-production-url.com",

  TIMEOUT: ENV_TIMEOUT ? Number(ENV_TIMEOUT) : 60000, // 60 seconds for long recordings
  QUICK_TIMEOUT: 15000, // For health checks
};

export default API_CONFIG;

console.log("🔧 API Config:", {
  baseUrl: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  quickTimeout: API_CONFIG.QUICK_TIMEOUT,
  isDev: __DEV__,
});