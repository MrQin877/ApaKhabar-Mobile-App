import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { getTheme } from "../../constants/theme";
import { useColorScheme } from "../../hooks/use-color-scheme";

export function FormError({ message, inline = false }: { message?: string | null; inline?: boolean }) {
  const theme = getTheme(useColorScheme());
  if (!message) return null;
  if (inline) return <Text accessibilityRole="alert" accessibilityLiveRegion="polite"
    style={[styles.text, { color: theme.error }]}>{message}</Text>;
  return <View accessibilityRole="alert" accessibilityLiveRegion="polite"
    style={[styles.box, { backgroundColor: theme.warning }]}>
    <Ionicons name="alert-circle-outline" size={18} color={theme.error} accessible={false}/>
    <Text style={[styles.text, { flex: 1, color: theme.error }]}>{message}</Text>
  </View>;
}

const styles = StyleSheet.create({
  text: { fontSize: 12, lineHeight: 18, flexShrink: 1 },
  box: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, padding: 12, marginVertical: 4 },
});
