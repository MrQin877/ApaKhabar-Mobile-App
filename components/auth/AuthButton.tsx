// ── Reusable button component for authentication screens (login, register) ──
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import { Design, getTheme } from "../../constants/theme";
import { useColorScheme } from "../../hooks/use-color-scheme";

interface AuthButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "solid";
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
      accessibilityRole="button"
      accessibilityState={{ disabled: !!(loading || disabled), busy: !!loading }}
      onPress={onPress}
      disabled={loading || disabled}
      activeOpacity={0.88}
      style={[styles.button, { backgroundColor: theme.primary }, (loading || disabled) && styles.disabled]}
    >
      {loading ? (
        <ActivityIndicator color={theme.background} />
      ) : (
        <Text style={[styles.text, { color: theme.background }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    ...Design.primaryButton,
    marginTop: 16,
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    ...Design.primaryButtonText,
  },
});
