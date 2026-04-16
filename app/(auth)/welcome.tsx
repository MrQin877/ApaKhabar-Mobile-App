import React from "react";
import { StatusBar, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WelcomeActions } from "../../components/auth/WelcomeActions";
import { WelcomeHeader } from "../../components/auth/WelcomeHeader";
import { getTheme } from "../../constants/theme";
import { useColorScheme } from "../../hooks/use-color-scheme";
import { useWelcomeAnimations } from "../../hooks/useWelcomeAnimations";
import { welcomeStyles } from "../../styles/welcome";

export default function WelcomeScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  const isSmall = height < 680;
  const sidePad = width * 0.07;

  // Animations
  const { fadeTop, translateY, fadeButtons, translateB } =
    useWelcomeAnimations();

  return (
    <View
      style={[
        welcomeStyles.container,
        { backgroundColor: theme.background, paddingTop: insets.top },
      ]}
    >
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
      />

      {/* ── Diagonal stripe decorations ── */}
      <View
        style={[
          welcomeStyles.stripe,
          {
            width: width * 0.22,
            height: height * 0.75,
            top: -height * 0.12,
            left: width * 0.18,
          },
        ]}
      />
      <View
        style={[
          welcomeStyles.stripe,
          {
            width: width * 0.12,
            height: height * 0.65,
            top: -height * 0.08,
            left: width * 0.36,
          },
        ]}
      />

      {/* ── Top content ── */}
      <WelcomeHeader
        width={width}
        height={height}
        sidePad={sidePad}
        fadeTop={fadeTop}
        translateY={translateY}
      />

      {/* ── Spacer ── */}
      <View style={{ flex: 1 }} />

      {/* ── Buttons ── */}
      <WelcomeActions
        width={width}
        height={height}
        sidePad={sidePad}
        fadeButtons={fadeButtons}
        translateB={translateB}
      />
    </View>
  );
}
