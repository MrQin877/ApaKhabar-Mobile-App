import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Button } from "heroui-native/button";
import { ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Design } from "@/constants/theme";
import { useAppearance } from "@/context/AppearanceContext";
import { useAppTheme } from "@/hooks/useAppTheme";

const options = [
  { value: "system", title: "Sistem", description: "Ikut tetapan peranti", icon: "phone-portrait-outline" },
  { value: "light", title: "Cerah", description: "Latar putih dan kontras lembut", icon: "sunny-outline" },
  { value: "dark", title: "Gelap", description: "Latar neutral untuk cahaya rendah", icon: "moon-outline" },
] as const;

export default function AppearanceScreen() {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { appearance, colorScheme, setAppearance } = useAppearance();
  return <View style={[styles.page, { paddingTop: insets.top, backgroundColor: colorScheme === "dark" ? theme.background : theme.accent }]}>
    <StatusBar barStyle={colorScheme === "dark" ? "light-content" : "dark-content"} />
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: Math.max(24, insets.bottom), paddingLeft: Math.max(16, insets.left), paddingRight: Math.max(16, insets.right) }]}>
      <View style={styles.heading}>
        <Button variant="ghost" className="min-h-0 min-w-0 rounded-full p-0" accessibilityLabel="Kembali ke Profil"
          onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/profile")} style={styles.back}>
          <Ionicons name="chevron-back" size={22} color={theme.text} />
        </Button>
        <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>Penampilan</Text>
      </View>
      <Text style={[styles.subtitle, { color: theme.secondary }]}>Pilih tema yang selesa untuk membaca.</Text>
      <View accessibilityRole="radiogroup" accessibilityLabel="Tema penampilan" style={styles.options}>
        {options.map(option => {
          const selected = appearance === option.value;
          return <Button key={option.value} variant="ghost" className="h-auto min-h-0 min-w-0 justify-start rounded-2xl px-4 py-4"
            accessibilityRole="radio" accessibilityState={{ checked: selected }} accessibilityLabel={`${option.title}, ${option.description}`}
            onPress={() => setAppearance(option.value)} style={[styles.card, { backgroundColor: theme.card }]}>
            <Ionicons name={option.icon} size={22} color={selected ? theme.primary : theme.secondary} />
            <View style={styles.copy}>
              <Text style={[styles.optionTitle, { color: theme.text }]}>{option.title}</Text>
              <Text style={[styles.description, { color: theme.secondary }]}>{option.description}</Text>
            </View>
            <View style={[styles.radio, { borderColor: selected ? theme.primary : theme.secondary }]}>
              {selected && <View style={[styles.dot, { backgroundColor: theme.primary }]} />}
            </View>
          </Button>;
        })}
      </View>
      <View style={[styles.notice, { backgroundColor: theme.communityBg }]}>
        <Ionicons name="shield-checkmark-outline" size={18} color={theme.primary} />
        <Text style={[styles.noticeText, { color: theme.primary }]}>Pilihan digunakan serta-merta dan disimpan secara automatik.</Text>
      </View>
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { width: "100%", maxWidth: Design.contentWidth, alignSelf: "center", paddingTop: 24 },
  heading: { flexDirection: "row", alignItems: "center", gap: 4 },
  back: { width: 32, height: 44, marginLeft: -8 },
  title: { fontSize: 28, lineHeight: 36, fontWeight: "800", letterSpacing: -0.6, flexShrink: 1 },
  subtitle: { fontSize: 13, lineHeight: 20, marginTop: 4, marginBottom: 16 },
  options: { gap: 14 },
  card: { minHeight: 80, flexDirection: "row", alignItems: "center", gap: 14, borderRadius: Design.radius.card, padding: 16 },
  copy: { flex: 1, minWidth: 0 },
  optionTitle: { fontSize: 16, lineHeight: 22, fontWeight: "700" },
  description: { fontSize: 13, lineHeight: 19, marginTop: 2 },
  radio: { width: 20, height: 20, borderWidth: 1.5, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  dot: { width: 6, height: 6, borderRadius: 3 },
  notice: { marginTop: 14, padding: 14, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 10 },
  noticeText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: "500" },
});
