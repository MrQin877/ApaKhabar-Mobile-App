// ── Reusable button component for authentication screens (login, register) ──
import React from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
} from "react-native";
import { getTheme } from "../../constants/theme";
import { useColorScheme } from "../../hooks/use-color-scheme";

interface AuthButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function AuthButton({
  title,
  onPress,
  loading,
  disabled,
}: AuthButtonProps) {
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: theme.primary },
        (loading || disabled) && styles.disabled,
      ]}
      onPress={onPress}
      disabled={loading || disabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={[styles.text, { color: "#fff" }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
  },
});
