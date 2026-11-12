import React from "react";
import { ScrollView, StatusBar, useWindowDimensions, View } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WelcomeActions } from "../../components/auth/WelcomeActions";
import { WelcomeHeader } from "../../components/auth/WelcomeHeader";
import { getTheme } from "../../constants/theme";
import { useColorScheme } from "../../hooks/use-color-scheme";
import { useWelcomeAnimations } from "../../hooks/useWelcomeAnimations";
import { welcomeStyles } from "../../styles/welcome";

// Bundled WebP retains Khabby's transparency and floor shadow offline.
const mascotAsset = require("../../assets/images/khabby.webp");

export default function WelcomeScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  const sidePad = Math.max(20, Math.min(40, width * 0.07));
  const mascotSize = Math.min(width - sidePad * 2, Math.max(240, height * 0.38), 320);

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
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, minHeight: height - insets.top }} showsVerticalScrollIndicator={false}>
      <WelcomeHeader
        width={width}
        height={height}
        sidePad={sidePad}
        fadeTop={fadeTop}
        translateY={translateY}
      />

      {/* ── Spacer ── */}
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: sidePad, paddingVertical: 16, minHeight: mascotSize + 32 }}>
        <Image
          source={mascotAsset}
          style={{ width: mascotSize, height: mascotSize }}
          contentFit="contain"
          accessibilityLabel="Khabby, maskot ApaKhabar sedang membaca surat khabar"
        />
      </View>

      {/* ── Buttons ── */}
      <WelcomeActions
        width={width}
        height={height}
        sidePad={sidePad}
        fadeButtons={fadeButtons}
        translateB={translateB}
      />
      </ScrollView>
    </View>
  );
}
