// API Configuration for Voice Companion
// Prefer Expo public env vars if provided
const ENV_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const ENV_HOST = process.env.EXPO_PUBLIC_API_HOST;
const ENV_PORT = process.env.EXPO_PUBLIC_API_PORT;
const ENV_TIMEOUT = process.env.EXPO_PUBLIC_API_TIMEOUT;

const LOCAL_IP = ENV_HOST || "192.168.0.193";
const PORT = ENV_PORT || "5002";

export const API_CONFIG = {
  BASE_URL: __DEV__
    ? ENV_BASE_URL || `http://${LOCAL_IP}:${PORT}`
    : ENV_BASE_URL || "https://your-production-url.com",

  TIMEOUT: ENV_TIMEOUT ? Number(ENV_TIMEOUT) : 30000,
};

export default API_CONFIG;

console.log("🔧 API Config:", {
  baseUrl: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  isDev: __DEV__,
});
