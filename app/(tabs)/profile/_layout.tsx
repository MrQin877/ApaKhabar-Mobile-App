import { Stack } from "expo-router";

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="change-email" />
      <Stack.Screen name="change-phone" />
      <Stack.Screen name="change-password" />
      <Stack.Screen name="data-privacy" />
    </Stack>
  );
}