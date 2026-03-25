import { getTheme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

interface NotifMarkAllButtonProps {
  onPress: () => void;
}

export function NotifMarkAllButton({ onPress }: NotifMarkAllButtonProps) {
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.button, { borderColor: theme.border }]}
    >
      <Text style={[styles.label, { color: theme.primary }]}>
        Tandai semua dibaca
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
  },
});
