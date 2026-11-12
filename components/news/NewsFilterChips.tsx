import { Chip } from "heroui-native/chip";
import { Button } from "heroui-native/button";
import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { Theme } from "@/constants/theme";
import type { NewsDateFilter } from "@/utils/newsFilters";
type Props = { theme: Theme; date: NewsDateFilter; category: string; onDateChange: (date: NewsDateFilter) => void; onCategoryPress: () => void; onRemoveCategory: () => void; showCategory?: boolean };
export function NewsFilterChips({ theme, date, category, onDateChange, onCategoryPress, onRemoveCategory, showCategory = false }: Props) {
  const pill = (label: string, selected: boolean, onPress: () => void, icon?: "calendar-outline") => <Chip size="sm" variant={selected ? "primary" : "soft"} key={label} accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[styles.pill, { backgroundColor: selected ? theme.primary : theme.communityBg }]}>
    {!!icon && <Ionicons name={icon} size={13} color={selected ? theme.background : theme.primary}/>}
    <Chip.Label style={[styles.label, { color: selected ? theme.background : theme.primary }]}>{label}</Chip.Label>
  </Chip>;
  const hasCategory = !!category && category !== "Semua";
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={{ flexGrow: 0, flexShrink: 0 }} contentContainerStyle={styles.chips}>
    {pill("Semua Berita", date === "all", () => onDateChange("all"))}
    {pill("Hari Ini", date === "today", () => onDateChange(date === "today" ? "all" : "today"), "calendar-outline")}
    {(date === "week" || date === "month") && pill(date === "week" ? "Minggu Ini" : "Bulan Ini", true, () => onDateChange("all"))}
    {(hasCategory || showCategory) && <View style={[styles.category, { backgroundColor: theme.communityBg }]}>
      <Button variant="ghost" className="h-auto min-h-0 min-w-0 rounded-none p-0" accessibilityRole="button" accessibilityLabel="Pilih kategori" onPress={onCategoryPress} style={styles.categoryLabel}><Text style={[styles.label, { color: theme.primary }]}>{hasCategory ? category : "Kategori"}</Text>{!hasCategory && <Ionicons name="chevron-down" size={12} color={theme.primary}/>}</Button>
      {hasCategory && <Button variant="ghost" className="h-auto min-h-0 min-w-0 rounded-none p-0" accessibilityRole="button" accessibilityLabel={`Buang kategori ${category}`} onPress={onRemoveCategory} style={styles.remove}><Ionicons name="close" size={13} color={theme.primary}/></Button>}
    </View>}
  </ScrollView>;
}
const styles = StyleSheet.create({
  chips: { gap: 8, paddingVertical: 8, paddingHorizontal: 20, alignItems: "center" },
  pill: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingHorizontal: 13, minHeight: 32, borderRadius: 24 },
  label: { fontSize: 11, fontWeight: "600" }, category: { flexDirection: "row", alignItems: "center", borderRadius: 24 },
  categoryLabel: { flexDirection: "row", alignItems: "center", gap: 5, paddingLeft: 13, paddingRight: 8, minHeight: 32 }, remove: { minHeight: 32, minWidth: 28, justifyContent: "center", alignItems: "center" },
});
