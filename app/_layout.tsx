import { NotifToast } from "@/components/ui/NotifToast";
import {
  NotificationProvider,
  useNotificationCount,
} from "@/context/NotificationContext";
import { registerPushToken } from "@/services/pushToken";
import { PortalHost } from "@rn-primitives/portal";
import * as Notifications from "expo-notifications"; // ← add
import { Slot } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";

function RootContent() {
  const { toastMessage, dismissToast, showToast } = useNotificationCount(); // ← add showToast

  useEffect(() => {
    registerPushToken();
  }, []);

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        const { title, body, data } = notification.request.content;
        if (data?.type === "darurat") {
          showToast(title ?? body ?? "Notifikasi darurat"); // ← now works
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
    <NotificationProvider>
      <RootContent />
    </NotificationProvider>
  );
}
