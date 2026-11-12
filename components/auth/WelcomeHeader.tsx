import React from "react";
import { Animated, Image, Text } from "react-native";
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
  width,
  height,
  sidePad,
  fadeTop,
  translateY,
}) => {
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);
  const isSmall = height < 680;

  return (
    <Animated.View
      style={[
        {
          paddingHorizontal: sidePad,
          paddingTop: isSmall ? 24 : 40,
          opacity: fadeTop,
          transform: [{ translateY }],
        },
      ]}
    >
      {/* Logo */}
      <Image
        source={require("../../assets/images/APAKHABAR_LOGO.png")}
        style={[{ width: width * 0.1, height: width * 0.1 }]}
        resizeMode="contain"
      />

      {/* Title */}
      <Text
        style={[
          {
            color: theme.text,
            fontSize: Math.min(isSmall ? 30 : 38, width * 0.095),
            marginTop: isSmall ? 20 : 28,
            fontWeight: "800",
            lineHeight: isSmall ? 36 : 44,
          },
        ]}
      >
        Selamat Datang ke ApaKhabar
      </Text>

      {/* Subtitle */}
      <Text
        style={[
          {
            marginTop: 10,
            lineHeight: 22,
            color: theme.secondary,
            fontSize: isSmall ? 13 : 15,
          },
        ]}
      >
        Berita tempatan, lebih dekat dengan anda
      </Text>
    </Animated.View>
  );
};
