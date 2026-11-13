import React from "react";
import { Image, ScrollView, StatusBar, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WelcomeActions } from "../../components/auth/WelcomeActions";
import { WelcomeHeader } from "../../components/auth/WelcomeHeader";
import { getTheme } from "../../constants/theme";
import { useColorScheme } from "../../hooks/use-color-scheme";
import { useWelcomeAnimations } from "../../hooks/useWelcomeAnimations";
import { welcomeStyles } from "../../styles/welcome";

// Original artwork flattened with its mask; no native SVG filters or URI fetch.
const mascotAsset = require("../../assets/images/apakhabar-mascot.png");

export default function WelcomeScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);
  const contentWidth = Math.min(width, 540);
  const sidePad = Math.max(24, Math.min(36, contentWidth * 0.08));
  const mascotSize = Math.min(contentWidth - sidePad * 2, Math.max(200, height * 0.36), 380);
  const { fadeTop, translateY, fadeButtons, translateB } = useWelcomeAnimations();

  return (
    <View style={[welcomeStyles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={colorScheme === "dark" ? "light-content" : "dark-content"} />
      <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden" }}>
        {[0, 1].map(index => (
          <View key={index} style={[welcomeStyles.stripe, {
            width: contentWidth * (index === 0 ? 0.14 : 0.09),
            height: contentWidth * 2.1,
            top: -contentWidth * 0.48,
            left: contentWidth * (index === 0 ? 0.3 : 0.52),
          }]} />
        ))}
      </View>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, minHeight: height, paddingTop: insets.top,
          alignItems: "center", paddingBottom: insets.bottom }}>
        <View style={{ flex: 1, width: "100%", maxWidth: 540 }}>
          <WelcomeHeader width={contentWidth} height={height} sidePad={sidePad}
            fadeTop={fadeTop} translateY={translateY} />
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center",
            paddingHorizontal: sidePad, paddingVertical: 16, minHeight: mascotSize + 32 }}>
            <Image source={mascotAsset} style={{ width: mascotSize, height: mascotSize }}
              resizeMode="contain" accessibilityLabel="Maskot ApaKhabar membaca surat khabar" />
          </View>
          <WelcomeActions width={contentWidth} height={height} sidePad={sidePad}
            fadeButtons={fadeButtons} translateB={translateB} />
        </View>
      </ScrollView>
    </View>
  );
}
