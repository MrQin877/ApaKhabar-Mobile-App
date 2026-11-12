import { Button } from "heroui-native/button";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Design } from "@/constants/theme";
import type { Theme } from "@/constants/theme";
import type { BroadcastAnnouncement } from "@/utils/broadcasts";
export type { BroadcastAnnouncement } from "@/utils/broadcasts";
export function AlertCard({ broadcast, theme }: { broadcast: BroadcastAnnouncement; theme: Theme }) {
  const open = () => router.push({ pathname: "/(tabs)/notification/[id]", params: { id: String(broadcast.notification_id || broadcast.id || "broadcast"), type: "emergency", title: broadcast.title || "Amaran", message: broadcast.message, channel: broadcast.channel || "", time: broadcast.sent_at || "", sent_at_full: broadcast.sent_at_full || "", read: "true", source: "broadcast" } });
  return <View style={[styles.card, { backgroundColor: theme.emergencyBg }]}>
    <View style={[styles.icon, { borderColor: theme.error }]}>
      <Ionicons name="megaphone-outline" size={21} color={theme.error}/>
    </View>
    <View style={styles.copy}>
      <Text numberOfLines={2} ellipsizeMode="tail" style={[styles.title, { color: theme.error }]}>{broadcast.title || "AMARAN"}</Text>
      <Text numberOfLines={2} ellipsizeMode="tail" style={[styles.message, { color: theme.text }]}>{broadcast.message}</Text>
    </View>
    <Button variant="ghost" className="h-auto min-h-0 min-w-0 rounded-lg px-1 py-2" accessibilityRole="button" accessibilityLabel="Lihat pengumuman darurat" onPress={open} style={styles.action}>
      <Text style={{ color: theme.primary, fontSize: 12, fontWeight: "600" }}>Lihat</Text>
      <Ionicons name="chevron-forward" size={15} color={theme.primary}/>
    </Button>
  </View>;
}
const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: Design.radius.card },
  icon: { width: 36, height: 36, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  copy: { flex: 1, minWidth: 0, gap: 3 },
  title: { fontWeight: "700", fontSize: 11, lineHeight: 16 },
  message: { fontSize: 11, lineHeight: 16 },
  action: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 2, minHeight: 44, flexShrink: 0 },
});
