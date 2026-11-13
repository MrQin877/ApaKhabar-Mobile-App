import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button } from "heroui-native/button";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Design, type Theme } from "@/constants/theme";
import { birthDateBounds, validBirthDate } from "@/hooks/useRegistration";

export function BirthDatePicker({ value, theme, onClose, onConfirm }: { value: string; theme: Theme; onClose: () => void; onConfirm: (day: string) => void }) {
  const insets = useSafeAreaInsets();
  const bounds = birthDateBounds();
  const [selected, setSelected] = useState(value);
  const [month, setMonth] = useState((value || bounds.today).slice(0, 7));
  const [view, setView] = useState<"days" | "years" | "months">("days");
  const first = new Date(`${month}-01T00:00:00Z`);
  const count = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  const move = (offset: number) => { const date = new Date(first); date.setUTCMonth(date.getUTCMonth() + offset); setMonth(date.toISOString().slice(0, 7)); };
  const chooseYear = (year: number) => {
    const proposed = `${year}-${month.slice(5, 7)}`;
    setMonth(proposed < bounds.earliest.slice(0, 7) ? bounds.earliest.slice(0, 7) : proposed > bounds.today.slice(0, 7) ? bounds.today.slice(0, 7) : proposed);
    setView("months");
  };
  const action = (label: string, onPress: () => void, disabled = false) => <Button key={label} variant="ghost" className="h-auto min-w-0 rounded-xl px-3 py-3" isDisabled={disabled} onPress={onPress} style={{ minHeight: 44 }}><Text style={{ color: disabled ? theme.secondary : theme.primary }}>{label}</Text></Button>;
  return <Modal visible transparent animationType="slide" onRequestClose={onClose}>
    <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Tutup pemilih tarikh"/>
      <View accessibilityViewIsModal style={[styles.sheet, { backgroundColor: theme.card, paddingBottom: insets.bottom + 24, marginTop: insets.top + 12 }]}>
        <Text accessibilityRole="header" style={{ color: theme.text, fontSize: 20, fontWeight: "700", marginBottom: 12 }}>Tarikh lahir</Text>
        <View style={styles.row}>
          {action("‹", () => move(-1), month <= bounds.earliest.slice(0, 7))}
          {action(new Intl.DateTimeFormat("ms-MY", { month: "long", timeZone: "UTC" }).format(first), () => setView(view === "months" ? "days" : "months"))}
          {action(month.slice(0, 4), () => setView(view === "years" ? "days" : "years"))}
          {action("›", () => move(1), month >= bounds.today.slice(0, 7))}
        </View>
        <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ paddingVertical: 12 }} keyboardShouldPersistTaps="handled">
          {view === "years" ? Array.from({ length: +bounds.today.slice(0, 4) - +bounds.earliest.slice(0, 4) + 1 }, (_, index) => +bounds.today.slice(0, 4) - index).map(year => action(String(year), () => chooseYear(year)))
            : view === "months" ? Array.from({ length: 12 }, (_, index) => {
              const next = `${month.slice(0, 4)}-${String(index + 1).padStart(2, "0")}`;
              return action(new Intl.DateTimeFormat("ms-MY", { month: "long", timeZone: "UTC" }).format(new Date(`${next}-01T00:00:00Z`)), () => { setMonth(next); setView("days"); }, next < bounds.earliest.slice(0, 7) || next > bounds.today.slice(0, 7));
            }) : <View style={styles.grid}>
              {['Aha', 'Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab'].map(day => <View key={day} style={styles.cell}><Text style={{ color: theme.secondary, fontSize: 11 }}>{day}</Text></View>)}
              {Array.from({ length: first.getUTCDay() }, (_, index) => <View key={`empty-${index}`} style={styles.cell}/>)}
              {Array.from({ length: count }, (_, index) => {
                const day = `${month}-${String(index + 1).padStart(2, "0")}`;
                const disabled = day < bounds.earliest || day > bounds.today;
                return <View key={day} style={styles.cell}><Button variant="ghost" className="h-auto min-h-0 min-w-0 rounded-full p-0" accessibilityLabel={day} accessibilityState={{ selected: selected === day }} isDisabled={disabled} onPress={() => setSelected(day)} style={{ minHeight: 44, width: "100%", borderRadius: 22, backgroundColor: day === selected ? theme.primary : "transparent" }}><Text style={{ color: disabled ? theme.secondary : selected === day ? theme.background : theme.text, opacity: disabled ? 0.35 : 1 }}>{index + 1}</Text></Button></View>;
              })}
            </View>}
        </ScrollView>
        <View style={[styles.row, { paddingTop: 16 }]}>
          <Button variant="ghost" className="h-auto min-w-0 rounded-xl px-4 py-3" onPress={onClose} style={[styles.footer, { borderColor: theme.border }]}><Text style={{ color: theme.text }}>Batal</Text></Button>
          <Button variant="ghost" className="h-auto min-w-0 rounded-xl px-4 py-3" isDisabled={!validBirthDate(selected)} onPress={() => onConfirm(selected)} style={[styles.footer, Design.primaryButton, { backgroundColor: theme.primary, borderColor: theme.primary }]}><Text style={{ ...Design.primaryButtonText, color: theme.background }}>Sahkan</Text></Button>
        </View>
      </View>
    </View>
  </Modal>;
}
const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" }, sheet: { maxHeight: "85%", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }, grid: { flexDirection: "row", flexWrap: "wrap" }, cell: { width: "14.285714%", minHeight: 44, alignItems: "center", justifyContent: "center" }, footer: { flex: 1, minHeight: 48, borderWidth: 1, borderRadius: 12 },
});
