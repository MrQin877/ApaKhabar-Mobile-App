import { useCallback, useEffect, useState } from "react";
import { AppState, Linking, Platform } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { registerPushToken } from "@/services/pushToken";

export function allowsPush(permission: Notifications.NotificationPermissionsStatus) {
  return permission.granted || permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
    || permission.ios?.status === Notifications.IosAuthorizationStatus.EPHEMERAL;
}

export function useNotificationPermission() {
  const supported = Platform.OS !== "web" && Device.isDevice && Constants.executionEnvironment !== "storeClient";
  const [permission, setPermission] = useState<Notifications.NotificationPermissionsStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const check = useCallback(async () => {
    if (!supported) return;
    try { setPermission(await Notifications.getPermissionsAsync()); }
    catch { /* Unsupported permission checks must not affect the in-app feed. */ }
  }, [supported]);
  useEffect(() => {
    void check();
    const subscription = AppState.addEventListener("change", state => { if (state === "active") void check(); });
    return () => subscription.remove();
  }, [check]);
  const open = useCallback(async () => {
    if (!supported || busy) return;
    setBusy(true);
    setActionError(null);
    try {
      const current = await Notifications.getPermissionsAsync();
      if (allowsPush(current)) { setPermission(current); void registerPushToken(); return; }
      if (current.canAskAgain) {
        const requested = await Notifications.requestPermissionsAsync();
        setPermission(requested);
        if (allowsPush(requested)) void registerPushToken();
      } else {
        const packageName = Constants.expoConfig?.android?.package;
        if (Platform.OS === "android" && packageName) {
          await Linking.sendIntent("android.settings.APP_NOTIFICATION_SETTINGS", [{ key: "android.provider.extra.APP_PACKAGE", value: packageName }]).catch(() => Linking.openSettings());
        } else if (Platform.OS === "ios") {
          await Linking.openURL("app-settings:notifications").catch(() => Linking.openSettings());
        } else await Linking.openSettings();
      }
    } catch { setActionError("Tetapan notifikasi tidak dapat dibuka. Cuba sekali lagi."); }
    finally { setBusy(false); }
  }, [supported, busy]);
  return { disabled: supported && permission !== null && !allowsPush(permission), supported, permission, busy, actionError, check, open };
}
