// ── Welcome Page ──
import { router } from "expo-router";
import React from "react";
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuthButton } from "../../components/auth/AuthButton";
import { AUTH_STRINGS } from "../../constants/authData";
import { getTheme } from "../../constants/theme";
import { useColorScheme } from "../../hooks/use-color-scheme";

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

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

      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>
          {AUTH_STRINGS.welcomeTitle}
        </Text>
        <Text style={[styles.subtitle, { color: theme.secondary }]}>
          {AUTH_STRINGS.welcomeSubtitle}
        </Text>
      </View>

      <View style={styles.buttons}>
        <AuthButton
          title={AUTH_STRINGS.signIn}
          onPress={() => router.push("/(auth)/login")}
        />
        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: theme.primary }]}
          onPress={() => router.push("/(auth)/register")}
          activeOpacity={0.8}
        >
          <Text style={[styles.secondaryText, { color: theme.primary }]}>
            {AUTH_STRINGS.signUp}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    opacity: 0.8,
  },
  buttons: {
    marginBottom: 40,
  },
  secondaryButton: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },
  secondaryText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
