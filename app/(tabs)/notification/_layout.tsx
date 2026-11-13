import { PrivateSection } from "@/components/auth/GuestAccess";
import { Stack, useNavigation, usePathname } from "expo-router";
import { useLayoutEffect } from "react";

export default function NotificationLayout() {
  const navigation = useNavigation();
  const pathname = usePathname();
  const isDetail = pathname !== "/notification";

  useLayoutEffect(() => {
    navigation.setOptions({
      tabBarStyle: isDetail ? { display: "none" } : undefined,
    });
  }, [isDetail, navigation]);

  const stack = (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" options={{ animation: "slide_from_right" }} />
    </Stack>
  );
  return <PrivateSection section="notification">{stack}</PrivateSection>;
}