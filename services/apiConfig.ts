import Constants from "expo-constants";
import { Platform } from "react-native";

function developmentOrigin(): string {
  // The local web browser reaches Laravel directly on localhost.
  if (Platform.OS === "web") return "http://localhost:8088";
  const hostUri = Constants.expoConfig?.hostUri;

  if (hostUri) {
    try {
      const host = new URL(hostUri.includes("://") ? hostUri : `http://${hostUri}`).hostname;
      // Expo tunnels forward Metro only, not the Laravel server.
      if (!host.endsWith(".exp.direct") && !host.endsWith(".ngrok.io") && !host.endsWith(".ngrok-free.app")) {
        const reachableHost = Platform.OS === "android" && ["localhost", "127.0.0.1", "[::1]"].includes(host)
          ? "10.0.2.2"
          : host;
        return `http://${reachableHost}:8088`;
      }
    } catch {
      // Missing/malformed development metadata uses the simulator fallback.
    }
  }

  return Platform.OS === "android" ? "http://10.0.2.2:8088" : "http://localhost:8088";
}

// Explicit override wins; the old name remains supported for deployed builds.
// Both variables represent the complete API root, including /api.
const configuredUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim()
  || process.env.EXPO_PUBLIC_API_URL?.trim();

function resolveApiBaseUrl(): string {
  if (configuredUrl) return configuredUrl.replace(/\/+$/, "");
  if (__DEV__) return `${developmentOrigin()}/api`;
  // Preserve the pre-refactor fallback for builds without an explicit URL.
  // Production never uses Expo's development host metadata.
  return Platform.OS === "android"
    ? "http://10.0.2.2:8088/api"
    : "http://localhost:8088/api";
}

export const API_BASE_URL = resolveApiBaseUrl();
export const BACKEND_BASE_URL = API_BASE_URL.replace(/\/api$/, "");
