// ──  Login ──
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { StatusBar, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LoginForm } from "../../components/auth/LoginForm";
import { getTheme } from "../../constants/theme";
import { useColorScheme } from "../../hooks/use-color-scheme";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);
  const { successMessage, returnTo, method } = useLocalSearchParams<{ successMessage?: string; returnTo?: string; method?: string }>();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.background, paddingTop: insets.top },
      ]}
    >
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
      />
      <LoginForm initialStatus={successMessage ?? null} returnTo={returnTo} identifierType={method === "email" ? "email" : undefined} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
