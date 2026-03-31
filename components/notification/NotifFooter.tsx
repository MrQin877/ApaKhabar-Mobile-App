import { getTheme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { StyleSheet, Text, View } from "react-native";

export function NotifFooter() {
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  return (
    <View style={styles.container}>
<<<<<<< Updated upstream
      <View style={[styles.separator, { backgroundColor: theme.border }]} />
      <Text style={[styles.label, { color: theme.secondary }]}>Tamat Sini</Text>
=======
      <Text style={[styles.label, { color: theme.secondary }]}>
        — Tiada notifikasi lagi —
      </Text>
>>>>>>> Stashed changes
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
<<<<<<< Updated upstream
    marginTop: 8,
    gap: 12,
  },
  separator: {
    height: 1,
    width: "33%",
=======
    paddingVertical: 24,
>>>>>>> Stashed changes
  },
  label: {
    fontSize: 12,
  },
});
