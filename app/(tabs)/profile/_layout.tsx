import { useNavigation } from "@react-navigation/native";
import { Stack, usePathname } from "expo-router";
import { useLayoutEffect } from "react";

export default function ProfileLayout() {
  const navigation = useNavigation();
  const pathname = usePathname();
  const isDetail = pathname !== "/profile";

  useLayoutEffect(() => {
    navigation.setOptions({
      tabBarStyle: isDetail ? { display: "none" } : undefined,
    });
  }, [isDetail]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="change-email" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="change-phone" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="change-password" options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="data-privacy" options={{ animation: "slide_from_right" }} />
    </Stack>
  );
}