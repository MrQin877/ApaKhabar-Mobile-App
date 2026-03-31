import { getTheme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { StyleSheet, Text, View } from "react-native";

export function NotifFooter() {
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  return (
    <View style={styles.container}>
      <View style={[styles.line, { backgroundColor: theme.border }]} />
      <Text style={[styles.label, { color: theme.secondary }]}>Tamat Sini</Text>
      <View style={[styles.line, { backgroundColor: theme.border }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 8,
    gap: 8,
  },
  line: { flex: 1, height: 0.5 },
  label: { fontSize: 11 },
});
