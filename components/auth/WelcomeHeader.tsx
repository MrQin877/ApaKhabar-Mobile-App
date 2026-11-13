import React from "react";
import { Animated, Image, Text, View } from "react-native";
import { getTheme } from "../../constants/theme";
import { useColorScheme } from "../../hooks/use-color-scheme";

interface WelcomeHeaderProps {
  width: number;
  height: number;
  sidePad: number;
  fadeTop: Animated.Value;
  translateY: Animated.Value;
}

export const WelcomeHeader: React.FC<WelcomeHeaderProps> = ({
  width, height, sidePad, fadeTop, translateY,
}) => {
  const theme = getTheme(useColorScheme());
  const compact = height < 700;
  const fontSize = Math.min(36, width * 0.082);
  return (
    <Animated.View style={{ paddingHorizontal: sidePad, paddingTop: compact ? 18 : 28,
      opacity: fadeTop, transform: [{ translateY }] }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Image source={require("../../assets/images/APAKHABAR_LOGO.png")}
          style={{ width: 32, height: 32 }} resizeMode="contain" accessible={false} />
      </View>
      <Text accessibilityRole="header" style={{ color: theme.text, fontSize,
        marginTop: compact ? 24 : 36, fontWeight: "800", lineHeight: fontSize * 1.14 }}>
        Selamat Datang ke ApaKhabar
      </Text>
      <Text style={{ marginTop: 12, lineHeight: 22, color: theme.secondary, fontSize: 15 }}>
        Berita tempatan, lebih dekat dengan anda
      </Text>
    </Animated.View>
  );
};
