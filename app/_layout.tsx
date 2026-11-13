import "../global.css";
import { NotifToast } from "@/components/ui/NotifToast";
import AppSafeArea from "@/components/AppSafeArea";
import {
  NotificationProvider,
  useNotificationCount,
} from "@/context/NotificationContext";
import { AppearanceProvider } from "@/context/AppearanceContext";
import { registerPushToken } from "@/services/pushToken";
import { getToken } from "@/services/authService";
import { PortalHost } from "heroui-native/portal";
import { HeroUINativeProviderRaw } from "heroui-native/provider-raw";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as Notifications from "expo-notifications";
import { Slot } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";

function RootContent() {
  const { toastMessage, dismissToast, showToast } = useNotificationCount();

  // Register push token
  useEffect(() => {
    registerPushToken();
  }, []);

  // Listen for push notifications while app is open
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        const { title, body, data } = notification.request.content;
        if (data?.type === "darurat") {
          void getToken().then(token => {
            if (token) showToast(title ?? body ?? "Notifikasi darurat");
          }).catch(() => {});
        }
      },
    );
    return () => subscription.remove();
  }, []);

  return (
    <AppSafeArea>
      <View style={{ flex: 1 }}>
        <Slot />
        <PortalHost />
        <NotifToast message={toastMessage} onDismiss={dismissToast} />
      </View>
    </AppSafeArea>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppearanceProvider>
        <HeroUINativeProviderRaw>
          <NotificationProvider>
            <RootContent />
          </NotificationProvider>
        </HeroUINativeProviderRaw>
      </AppearanceProvider>
    </GestureHandlerRootView>
  );
}
