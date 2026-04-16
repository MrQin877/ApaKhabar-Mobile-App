import { NotifToast } from "@/components/ui/NotifToast";
import {
  NotificationProvider,
  useNotificationCount,
} from "@/context/NotificationContext";
import { AppearanceProvider } from "@/context/AppearanceContext";
import { registerPushToken } from "@/services/pushToken";
import { PortalHost } from "@rn-primitives/portal";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import { router, Slot } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";

function RootContent() {
  const { toastMessage, dismissToast, showToast } = useNotificationCount();

  // Register push token
  useEffect(() => {
    registerPushToken();
  }, []);

  // Handle deep links
  useEffect(() => {
    const handleDeepLink = (url: string) => {
      const parsed = Linking.parse(url);
      if (parsed.path === "reset-password") {
        const token = parsed.queryParams?.token as string;
        const email = parsed.queryParams?.email as string;
        if (token && email) {
          router.push({
            pathname: "/(auth)/reset-password",
            params: { token, email },
          });
        }
      }
    };

    // App already open — listen for incoming links
    const subscription = Linking.addEventListener("url", ({ url }) => {
      handleDeepLink(url);
    });

    // App opened from closed state via link
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    return () => subscription.remove();
  }, []);

  // Listen for push notifications while app is open
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        const { title, body, data } = notification.request.content;
        if (data?.type === "darurat") {
          showToast(title ?? body ?? "Notifikasi darurat");
        }
      },
    );
    return () => subscription.remove();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <Slot />
      <PortalHost />
      <NotifToast message={toastMessage} onDismiss={dismissToast} />
    </View>
  );
}

export default function RootLayout() {
  return (
    <AppearanceProvider>
      <NotificationProvider>
        <RootContent />
      </NotificationProvider>
    </AppearanceProvider>
  );
}