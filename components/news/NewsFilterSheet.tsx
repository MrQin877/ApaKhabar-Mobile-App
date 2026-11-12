import { useEffect, useState } from "react";
import { NewsDateCalendar } from "./NewsDateCalendar";
import { newsDateLabel } from "@/utils/newsFilters";
import { BottomSheet } from "heroui-native/bottom-sheet";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Button } from "heroui-native/button";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Theme } from "@/constants/theme";
import type { NewsDateFilter } from "@/utils/newsFilters";
type Props = { visible: boolean; onClose: () => void; theme: Theme; categories: string[]; category: string; date: NewsDateFilter; onDate: (date: NewsDateFilter) => void; onCategory: (category: string) => void; dateOnly?: boolean; onApply?: () => void };
export function NewsFilterSheet({ visible, onClose, theme, categories, category, date, onDate, onCategory, dateOnly = false, onApply }: Props) {
  const insets = useSafeAreaInsets();
  const [showCalendar, setShowCalendar] = useState(false);
  useEffect(() => { if (!visible) setShowCalendar(false); }, [visible]);
  const option = (label: string, selected: boolean, onPress: () => void) => <Button variant="ghost" className="h-auto min-h-0 min-w-0 rounded-xl px-4 py-3" key={label} accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[styles.option, { borderColor: selected ? theme.primary : theme.border, backgroundColor: selected ? theme.communityBg : theme.card }]}><Text style={{ flex: 1, flexShrink: 1, textAlign: "left", color: selected ? theme.primary : theme.text, fontSize: 14, fontWeight: selected ? "600" : "400" }}>{label}</Text>{selected && <Ionicons name="checkmark" size={17} color={theme.primary}/>}</Button>;
  return <BottomSheet isOpen={visible} onOpenChange={open => { if (!open) onClose(); }}>
    <BottomSheet.Portal unstable_accessibilityContainerViewIsModal>
      <BottomSheet.Overlay accessibilityLabel="Tutup penapis" style={{ backgroundColor: theme.overlay }}/>
      <BottomSheet.Content snapPoints={[showCalendar ? '90%' : dateOnly ? '70%' : '85%']} topInset={insets.top + 12}
        enableDynamicSizing={false} enableOverDrag={false} contentContainerClassName="h-full p-0"
        backgroundClassName="rounded-t-3xl bg-overlay shadow-none" handleIndicatorClassName="bg-separator"
        contentContainerProps={{ accessibilityViewIsModal: true, onAccessibilityEscape: onClose }}>
        <View style={{ flex: 1, minHeight: 0, paddingHorizontal: showCalendar ? 24 : 20, paddingTop: 12, paddingBottom: showCalendar ? insets.bottom + 28 : Math.max(20, insets.bottom) }}>
        <View style={styles.heading}><BottomSheet.Title style={{ color: theme.text, fontSize: 20, fontWeight: "700" }}>{showCalendar ? "Pilih tarikh" : "Tapis berita"}</BottomSheet.Title><Button variant="ghost" className="h-auto min-h-0 min-w-0 rounded-none p-0" accessibilityRole="button" accessibilityLabel="Tutup penapis" onPress={onClose} style={styles.close}><Ionicons name="close" size={23} color={theme.text}/></Button></View>
        {showCalendar ? <NewsDateCalendar date={date} theme={theme} onCancel={() => setShowCalendar(false)} onConfirm={value => { onDate(value); setShowCalendar(false); }}/> : <BottomSheetScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 12, paddingHorizontal: 4, paddingBottom: 4 }}>
          <Text style={[styles.label, { color: theme.secondary }]}>Tarikh</Text>
          {([['today', 'Hari Ini'], ['week', 'Minggu Ini'], ['month', 'Bulan Ini']] as const).map(([value, label]) => option(label, date === value, () => onDate(date === value ? "all" : value)))}
          {dateOnly && option("Tarikh Tersuai", date.startsWith("custom:"), () => setShowCalendar(true))}
          {dateOnly && date.startsWith("custom:") && <View style={[styles.option, { backgroundColor: theme.communityBg, borderColor: theme.border }]}>
            <Button variant="ghost" className="h-auto min-w-0 flex-1 p-0" onPress={() => setShowCalendar(true)} style={{ flex: 1 }}><Text style={{ color: theme.primary, flexShrink: 1 }}>{newsDateLabel(date)}</Text></Button>
            <Button variant="ghost" className="min-w-0 p-0" accessibilityLabel="Buang tarikh tersuai" onPress={() => onDate("all")} style={styles.close}><Ionicons name="close" size={20} color={theme.primary}/></Button>
          </View>}
          {!dateOnly && <>
          <Text style={[styles.label, { color: theme.secondary, marginTop: 16 }]}>Kategori</Text>
          {option("Semua kategori", !category || category === "Semua", () => onCategory("Semua"))}
          {categories.filter(name => name !== "Semua").map(name => option(name, category === name, () => onCategory(name)))}
          </>}
        </BottomSheetScrollView>}
        {!showCalendar && <Button variant="ghost" className="h-auto min-h-12 min-w-0 rounded-xl px-4 py-3" accessibilityRole="button" onPress={onApply ?? onClose} style={[styles.apply, { backgroundColor: theme.primary }]}><Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "700" }}>Lihat hasil</Text></Button>}
        </View>
      </BottomSheet.Content>
    </BottomSheet.Portal>
  </BottomSheet>;
}
const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: { maxHeight: "85%", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  heading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexShrink: 0 },
  close: { height: 44, width: 44, alignItems: "center", justifyContent: "center" },
  option: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, minHeight: 48, gap: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  label: { fontSize: 12, fontWeight: "600", marginBottom: 4 }, apply: { alignSelf: "stretch", flexShrink: 0, minHeight: 48, alignItems: "center", justifyContent: "center", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, marginHorizontal: 4, marginTop: 16 },
});
