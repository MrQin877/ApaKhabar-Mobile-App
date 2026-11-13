import { Ionicons } from "@expo/vector-icons";
import { Button } from "heroui-native/button";
import { Skeleton } from "heroui-native/skeleton";
import { StyleSheet, Text, View } from "react-native";
import { Design, type Theme } from "@/constants/theme";

export function NotificationSkeleton({ theme }: { theme: Theme }) {
  return <View accessibilityLabel="Memuatkan notifikasi" accessibilityState={{ busy: true }} style={styles.skeleton}>
    {[0, 1, 2, 3].map(index => <View key={index} style={styles.skeletonRow}>
      <Skeleton variant="pulse" style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: theme.accent }}/>
      <View style={{ flex: 1, gap: 7 }}>
        <Skeleton variant="pulse" style={{ width: "85%", height: 12, borderRadius: 4, backgroundColor: theme.accent }}/>
        <Skeleton variant="pulse" style={{ width: "60%", height: 9, borderRadius: 4, backgroundColor: theme.accent }}/>
      </View>
    </View>)}
  </View>;
}

type Props = { kind: "error" | "permission" | "empty"; theme: Theme; compact?: boolean; onAction?: () => void; busy?: boolean; actionError?: string | null };
export function NotificationState({ kind, theme, compact = false, onAction, busy, actionError }: Props) {
  const copy = {
    error: { title: "Notifikasi tidak dapat dimuatkan", description: "Semak sambungan internet dan cuba sekali lagi.", action: "Cuba lagi" },
    permission: { title: "Jangan terlepas amaran penting", description: "Benarkan notifikasi untuk menerima amaran komuniti. Anda boleh mengubahnya pada bila-bila masa.", action: "Buka tetapan" },
    empty: { title: "Tiada notifikasi lagi", description: "Pemberitahuan berita, acara dan amaran komuniti akan muncul di sini.", action: "" },
  }[kind];
  return <View style={[styles.state, compact && { paddingVertical: 20, paddingHorizontal: 16 }]}>
    <View style={{ alignSelf: "center", marginBottom: 10 }}>
      <Ionicons name={kind === "error" ? "wifi-outline" : kind === "permission" ? "notifications-outline" : "notifications-off-outline"} size={40} color={kind === "error" ? theme.error : theme.primary}/>
      {kind === "error" && <View style={{ position: "absolute", width: 42, height: 3, top: 19, left: -1, transform: [{ rotate: "45deg" }], backgroundColor: theme.error }}/>}
    </View>
    <Text accessibilityRole={kind === "error" ? "alert" : "header"} style={[styles.title, { color: theme.text }]}>{copy.title}</Text>
    <Text style={[styles.description, { color: theme.secondary }]}>{copy.description}</Text>
    {!!copy.action && <Button variant="ghost" className="h-auto min-w-0 rounded-xl px-5 py-3" isDisabled={busy} onPress={onAction} style={[styles.action, Design.primaryButton, { backgroundColor: theme.primary, opacity: busy ? 0.6 : 1 }]}><Text style={{ ...Design.primaryButtonText, color: theme.background }}>{copy.action}</Text></Button>}
    {!!actionError && <Text accessibilityRole="alert" style={[styles.description, { color: theme.error }]}>{actionError}</Text>}
  </View>;
}
const styles = StyleSheet.create({
  state: { width: "100%", maxWidth: 360, alignSelf: "center", paddingHorizontal: 24, paddingVertical: 32, gap: 10 },
  title: { fontSize: 16, lineHeight: 22, fontWeight: "700" }, description: { fontSize: 12, lineHeight: 18 },
  action: { alignSelf: "center", minHeight: 44, borderRadius: 12, marginTop: 4 },
  skeleton: { flex: 1, justifyContent: "center", paddingHorizontal: 24, paddingBottom: 24, gap: 24 },
  skeletonRow: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 56 },
});
