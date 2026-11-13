import { router } from "expo-router";
import React from "react";
import { Animated, Text, TouchableOpacity } from "react-native";
import { Design, getTheme } from "../../constants/theme";
import { useColorScheme } from "../../hooks/use-color-scheme";

interface WelcomeActionsProps {
  width: number;
  height: number;
  sidePad: number;
  fadeButtons: Animated.Value;
  translateB: Animated.Value;
}

export const WelcomeActions: React.FC<WelcomeActionsProps> = ({
  height, sidePad, fadeButtons, translateB,
}) => {
  const theme = getTheme(useColorScheme());
  const actionTextStyle = { ...Design.primaryButtonText, fontSize: 16, lineHeight: 24,
    textAlign: "center" as const };
  return (
    <Animated.View style={{ paddingHorizontal: sidePad, paddingBottom: height < 700 ? 16 : 28,
      opacity: fadeButtons, transform: [{ translateY: translateB }], gap: 12 }}>
      <TouchableOpacity accessibilityRole="button" activeOpacity={0.85}
        style={[Design.primaryButton, { backgroundColor: theme.primary }]}
        onPress={() => router.navigate("/(auth)/login")}>
        <Text style={[actionTextStyle, { color: theme.background }]}>Log masuk</Text>
      </TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" activeOpacity={0.85}
        style={[Design.primaryButton, { backgroundColor: theme.background, borderColor: theme.primary, borderWidth: 1.5 }]}
        onPress={() => router.navigate("/(auth)/register")}>
        <Text style={[actionTextStyle, { color: theme.primary }]}>Daftar akun</Text>
      </TouchableOpacity>
      <TouchableOpacity accessibilityRole="link" activeOpacity={0.7}
        style={{ minHeight: 48, paddingHorizontal: 16, paddingVertical: 12,
          alignItems: "center", justifyContent: "center", marginTop: 4 }}
        onPress={() => router.replace("/(tabs)/news_content")}>
        <Text style={[actionTextStyle, { color: theme.primary }]}>
          Teruskan sebagai tetamu
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
