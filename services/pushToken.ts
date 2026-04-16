import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import api from "./api";

// ── Configure how notifications appear ──
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerPushToken(): Promise<void> {
  if (!Device.isDevice) return;

  // Check if user has a token first
  const authToken = await SecureStore.getItemAsync("auth_token");
  if (!authToken) {
    console.log("User not logged in — skipping push token registration");
    return; // ← exit early if not logged in
  }

  // Request permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Push notification permission denied");
    return;
  }

  // Android needs notification channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "ApaKhabar",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#16a34a",
    });

    // Emergency channel
    await Notifications.setNotificationChannelAsync("darurat", {
      name: "Alert Darurat",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 250, 500],
      lightColor: "#ef4444",
      sound: "default",
    });
  }

  // Get Expo push token
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: Constants.expoConfig?.extra?.eas?.projectId, // ← from app.json
  });

  const token = tokenData.data;
  console.log("Push token:", token);

  // Save to Laravel backend
  try {
    await api.post("/push-token", { token });
    console.log("Push token saved to server");
  } catch (error) {
    console.error("Failed to save push token:", error);
  }
}
