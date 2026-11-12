import { useAppTheme } from "@/hooks/useAppTheme";
import { Stack } from "expo-router";
export const unstable_settings = { anchor: "index" };
export default function NewsLayout() {
  const theme = useAppTheme();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background } }}>
    <Stack.Screen name="index"/>
    <Stack.Screen name="latest"/>
    <Stack.Screen name="search"/>
    <Stack.Screen name="[id]"/>
  </Stack>;
}
