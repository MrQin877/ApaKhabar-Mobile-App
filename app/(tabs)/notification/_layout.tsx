import { useNavigation } from "@react-navigation/native";
import { Stack, usePathname } from "expo-router";
import { useLayoutEffect } from "react";

export default function NotificationLayout() {
  const navigation = useNavigation();
  const pathname = usePathname();
  const isDetail = pathname !== "/notification";

  useLayoutEffect(() => {
    navigation.setOptions({
      tabBarStyle: isDetail ? { display: "none" } : undefined,
    });
  }, [isDetail]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" options={{ animation: "slide_from_right" }} />
    </Stack>
  );
}