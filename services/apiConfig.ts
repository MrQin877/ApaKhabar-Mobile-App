import Constants from "expo-constants";
import { NativeModules, Platform } from "react-native";
import * as Linking from 'expo-linking';

function isLocalHost(host: string): boolean {
  return ["localhost", "127.0.0.1", "[::1]", "10.0.2.2"].includes(host)
    || host.endsWith(".localhost") || host.endsWith(".local")
    || /^10\./.test(host) || /^192\.168\./.test(host)
    || /^172\.(1[6-9]|2\d|3[01])\./.test(host)
    || /^169\.254\./.test(host)
    || host.includes("YOUR_");
}

function developmentOrigin(): string {
  // The actual bundle/link origin takes priority over cached manifest metadata.
  let linkingUri: string | undefined;
  try { linkingUri = Linking.createURL('/'); } catch { /* No linking context during startup/SSR. */ }
  const candidates = [NativeModules?.SourceCode?.scriptURL, linkingUri, Constants.expoConfig?.hostUri, Constants.expoGoConfig?.debuggerHost];
  for (const hostUri of candidates) {
    if (!hostUri) continue;
    try {
      const parsed = new URL(hostUri.includes("://") ? hostUri : `http://${hostUri}`);
      if (!["http:", "https:", "exp:", "exps:"].includes(parsed.protocol)) continue;
      const host = parsed.hostname;
      // Tunnels forward Metro only, not Laravel. Use only local Expo hosts.
      if (isLocalHost(host)) {
        const reachableHost = Platform.OS === "android" && ["localhost", "127.0.0.1", "[::1]"].includes(host)
          ? "10.0.2.2" : host;
        return `http://${reachableHost}:8088`;
      }
    } catch {
      // Missing/malformed development metadata uses the simulator fallback.
    }
  }
  // A browser opened over LAN should use that same host when Metro metadata is absent.
  if (Platform.OS === "web" && typeof window !== "undefined"
    && isLocalHost(window.location.hostname)) {
    return `http://${window.location.hostname}:8088`;
  }
  return Platform.OS === "android" ? "http://10.0.2.2:8088" : "http://localhost:8088";
}

// Both names represent the complete API root, including /api.
const configuredUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim()
  || process.env.EXPO_PUBLIC_API_URL?.trim();

function resolveApiBaseUrl(): string {
  if (configuredUrl) {
    try {
      const parsed = new URL(configuredUrl);
      if (["http:", "https:"].includes(parsed.protocol)) {
        // Local overrides go stale when Wi-Fi changes. Deployed URLs remain explicit.
        if (!__DEV__ || !isLocalHost(parsed.hostname)) return configuredUrl.replace(/\/+$/, "");
      }
    } catch {
      // Invalid local configuration must not disable automatic development detection.
    }
  }
  if (__DEV__) return `${developmentOrigin()}/api`;
  return Platform.OS === "android" ? "http://10.0.2.2:8088/api" : "http://localhost:8088/api";
}

export const API_BASE_URL = resolveApiBaseUrl();
export const BACKEND_BASE_URL = API_BASE_URL.replace(/\/api$/, "");

if (__DEV__) console.info("[ApaKhabar] API base URL:", API_BASE_URL);
