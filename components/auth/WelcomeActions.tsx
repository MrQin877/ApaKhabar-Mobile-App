import { router } from "expo-router";
import React from "react";
import { Animated, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AUTH_STRINGS } from "../../constants/authData";
import { AuthButton } from "./AuthButton";

interface WelcomeActionsProps {
  width: number;
  height: number;
  sidePad: number;
  fadeButtons: Animated.Value;
  translateB: Animated.Value;
}

export const WelcomeActions: React.FC<WelcomeActionsProps> = ({
  width,
  height,
  sidePad,
  fadeButtons,
  translateB,
}) => {
  const insets = useSafeAreaInsets();
  const isSmall = height < 680;

  return (
    <Animated.View
      style={[
        {
          paddingHorizontal: sidePad,
          paddingBottom: insets.bottom + (isSmall ? 24 : 36),
          opacity: fadeButtons,
          transform: [{ translateY: translateB }],
        },
      ]}
    >
      {/* Primary — filled gradient */}
      <AuthButton
        title={AUTH_STRINGS.signIn}
        onPress={() => router.push("/(auth)/login")}
      />

      {/* Secondary — outline */}
      <TouchableOpacity
        style={[
          {
            borderColor: "#3FCC54",
            marginTop: 12,
            height: 54,
            borderRadius: 12,
            borderWidth: 1.5,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
        onPress={() => router.push("/(auth)/register")}
        activeOpacity={0.85}
      >
        <Text
          style={{
            color: "#3FCC54",
            fontSize: 13,
            fontWeight: "700",
            letterSpacing: 1.5,
          }}
        >
          {AUTH_STRINGS.signUp}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
