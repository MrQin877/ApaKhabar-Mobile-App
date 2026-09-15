// ── Reusable input component for auth screens (login, register) ──
import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { getTheme } from "../../constants/theme";
import { useColorScheme } from "../../hooks/use-color-scheme";
import { PasswordInput } from "./PasswordInput";

interface AuthInputProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  error?: string;
}

export function AuthInput({
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  error,
}: AuthInputProps) {
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);
  const Input = secureTextEntry ? PasswordInput : TextInput;

  return (
    <View style={styles.container}>
      <Input
        style={[
          styles.input,
          {
            borderColor: error ? theme.error : theme.border,
            color: theme.text,
          },
        ]}
        placeholder={placeholder}
        placeholderTextColor={theme.secondary}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {error && (
        <Text style={[styles.error, { color: theme.error }]}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});
