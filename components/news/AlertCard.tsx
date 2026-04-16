import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Theme } from "../../constants/theme";
import { IconSymbol } from "../ui/icon-symbol";

interface AlertCardProps {
  message: string;
  theme: Theme;
}

export function AlertCard({ message, theme }: AlertCardProps) {
  return (
    <View style={[styles.alertCard, { backgroundColor: theme.warning }]}>
      <View style={[styles.alertIcon, { backgroundColor: theme.error }]}>
        <IconSymbol
          name="exclamationmark.triangle.fill"
          size={16}
          color="#fff"
        />
      </View>
      <Text style={[styles.alertText, { color: theme.error }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  alertIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  alertText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
});
