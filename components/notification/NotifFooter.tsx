import { getTheme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { StyleSheet, Text, View } from "react-native";

export function NotifFooter() {
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  return (
    <View style={styles.container}>
      <View style={[styles.separator, { backgroundColor: theme.border }]} />
      <Text style={[styles.label, { color: theme.secondary }]}>Tamat Sini</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginTop: 8,
    gap: 12,
  },
  separator: {
    height: 1,
    width: "33%",
  },
  label: {
    fontSize: 12,
  },
});
