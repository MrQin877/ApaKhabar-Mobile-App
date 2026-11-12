import { useState } from "react";
import { Text, View, StyleSheet } from "react-native";
import { Button } from "heroui-native/button";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import type { Theme } from "@/constants/theme";
import { customDateRange, localDay, newsDateLabel, type NewsDateFilter } from "@/utils/newsFilters";

export function NewsDateCalendar({ date, theme, onCancel, onConfirm }: {
  date: NewsDateFilter; theme: Theme; onCancel: () => void; onConfirm: (date: NewsDateFilter) => void;
}) {
  const saved = customDateRange(date);
  const today = localDay(new Date());
  const [mode, setMode] = useState<"single" | "range">(saved && saved.start !== saved.end ? "range" : "single");
  const [start, setStart] = useState(saved?.start || "");
  const [end, setEnd] = useState(saved?.end || "");
  const [month, setMonth] = useState(() => (saved?.start || today).slice(0, 7));
  const first = new Date(`${month}-01T00:00:00Z`);
  const count = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  const moveMonth = (offset: number) => {
    const next = new Date(first);
    next.setUTCMonth(next.getUTCMonth() + offset);
    setMonth(next.toISOString().slice(0, 7));
  };
  const select = (day: string) => {
    if (mode === "single") { setStart(day); setEnd(day); }
    else if (!start || end || day < start) { setStart(day); setEnd(""); }
    else setEnd(day);
  };
  const ready = !!start && !!end && start <= end && end <= today;
  const selection: NewsDateFilter = `custom:${start}:${end}`;
  return <View style={styles.container}>
    <BottomSheetScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
    <View style={styles.row}>
      {([['single', 'Satu tarikh'], ['range', 'Julat tarikh']] as const).map(([value, label]) => <Button key={value} variant="ghost"
        className="h-auto min-w-0 rounded-xl px-2 py-3" accessibilityState={{ selected: mode === value }}
        onPress={() => { setMode(value); setStart(""); setEnd(""); }}
        style={[styles.mode, { borderColor: theme.border, backgroundColor: mode === value ? theme.primary : theme.card }]}>
        <Text style={{ color: mode === value ? "#FFFFFF" : theme.text, fontWeight: "600" }}>{label}</Text>
      </Button>)}
    </View>
    <View style={[styles.row, { justifyContent: "space-between", alignItems: "center" }]}>
      <Button variant="ghost" className="min-w-0 p-0" accessibilityLabel="Bulan sebelumnya" onPress={() => moveMonth(-1)} style={styles.arrow}><Ionicons name="chevron-back" size={20} color={theme.text}/></Button>
      <Text accessibilityRole="header" style={{ color: theme.text, fontSize: 17, fontWeight: "700" }}>{new Intl.DateTimeFormat("ms-MY", { month: "long", year: "numeric", timeZone: "UTC" }).format(first)}</Text>
      <Button variant="ghost" className="min-w-0 p-0" accessibilityLabel="Bulan seterusnya" isDisabled={month >= today.slice(0, 7)} onPress={() => moveMonth(1)} style={styles.arrow}><Ionicons name="chevron-forward" size={20} color={month >= today.slice(0, 7) ? theme.border : theme.text}/></Button>
    </View>
    <View style={styles.grid}>
      {['Aha', 'Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab'].map(label => <View key={label} style={styles.cell}><Text style={{ color: theme.secondary, fontSize: 12 }}>{label}</Text></View>)}
      {Array.from({ length: first.getUTCDay() }, (_, index) => <View key={`blank-${index}`} style={styles.cell}/>)}
      {Array.from({ length: count }, (_, index) => {
        const day = `${month}-${String(index + 1).padStart(2, "0")}`;
        const edge = day === start || day === end;
        const between = !!start && !!end && day > start && day < end;
        return <View key={day} style={styles.cell}><Button variant="ghost" className="h-auto min-h-0 min-w-0 rounded-full p-0"
          accessibilityLabel={day} accessibilityState={{ selected: edge || between, disabled: day > today }} isDisabled={day > today} onPress={() => select(day)}
          style={[styles.day, { backgroundColor: edge ? theme.primary : between ? theme.communityBg : "transparent" }]}>
          <Text style={{ color: day > today ? theme.border : edge ? "#FFFFFF" : theme.text, fontWeight: edge ? "700" : "400" }}>{index + 1}</Text>
        </Button></View>;
      })}
    </View>
    <Text accessibilityLiveRegion="polite" style={{ color: theme.secondary, textAlign: "center" }}>{ready ? newsDateLabel(selection) : mode === "range" && start ? "Pilih tarikh akhir" : "Pilih tarikh"}</Text>
    </BottomSheetScrollView>
    <View style={styles.footer}>
      <Button variant="ghost" className="h-auto min-w-0 rounded-xl px-4 py-3" onPress={onCancel} style={[styles.mode, styles.actionButton, { borderColor: theme.border }]}><Text style={{ color: theme.text }}>Batal</Text></Button>
      <Button variant="ghost" className="h-auto min-w-0 rounded-xl px-4 py-3" isDisabled={!ready} onPress={() => { if (ready) onConfirm(selection); }} style={[styles.mode, styles.actionButton, { borderColor: theme.primary, backgroundColor: theme.primary, opacity: ready ? 1 : 0.45 }]}><Text style={{ color: "#FFFFFF", fontWeight: "700" }}>Sahkan</Text></Button>
    </View>
  </View>;
}
const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 0 },
  scroll: { flex: 1, minHeight: 0 },
  content: { gap: 16, paddingTop: 8, paddingBottom: 20 },
  footer: { flexDirection: "row", gap: 12, flexShrink: 0, paddingTop: 16 },
  actionButton: { flexBasis: 0, minHeight: 52, paddingVertical: 14 },
  row: { flexDirection: "row", gap: 8 }, mode: { flex: 1, minHeight: 48, borderRadius: 12, borderWidth: 1, justifyContent: "center", alignItems: "center" },
  arrow: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap" }, cell: { width: "14.285714%", minHeight: 44, alignItems: "center", justifyContent: "center" },
  day: { width: "100%", maxWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: 22 },
});
