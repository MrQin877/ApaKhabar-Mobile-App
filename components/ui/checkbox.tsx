import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getTheme } from "../../constants/theme";
import { useColorScheme } from "../../hooks/use-color-scheme";

interface CheckboxProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
}

export function Checkbox({ value, onValueChange, label }: CheckboxProps) {
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onValueChange(!value)}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.checkbox,
          {
            backgroundColor: value ? theme.primary : theme.background,
            borderColor: value ? theme.primary : theme.border,
          },
        ]}
      >
        {value && <Text style={styles.checkmark}>✓</Text>}
      </View>
      {label && (
        <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  checkmark: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  label: {
    fontSize: 14,
  },
});
