import { PrivateSection } from "@/components/auth/GuestAccess";
import { Stack, useNavigation, usePathname } from "expo-router";
import { useLayoutEffect } from "react";
import { useAppTheme } from "@/hooks/useAppTheme";

export default function ProfileLayout() {
  const navigation = useNavigation();
  const pathname = usePathname();
  const theme = useAppTheme();
  const isDetail = pathname !== "/profile";

  useLayoutEffect(() => {
    navigation.setOptions({
      tabBarStyle: isDetail ? { display: "none" } : undefined,
    });
  }, [isDetail, navigation]);

  const stack = (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="edit-photo" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="appearance" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="change-email" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="change-phone" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="change-password" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="data-privacy" options={{ animation: "slide_from_right" }} />
    </Stack>
  );
  return pathname === "/profile/data-privacy" ? stack : <PrivateSection section="profile">{stack}</PrivateSection>;
}
