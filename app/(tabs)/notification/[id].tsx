import { IconSymbol } from "@/components/ui/icon-symbol";
import { getTheme } from "@/constants/theme";
import { markRead } from "@/services/notificationService";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { SFSymbol } from "expo-symbols";
import { useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "../../../hooks/use-color-scheme";

type NotifType = "info" | "emergency" | "community";

// In TYPE_CONFIG — remove messageBg entirely
const TYPE_CONFIG: Record<
  NotifType,
  {
    pillLabel: string;
    pillBg: string;
    pillText: string;
    iconBg: string;
    icon: SFSymbol;
    iconColor: string;
  }
> = {
  emergency: {
    pillLabel: "DARURAT",
    pillBg: "#FEE8E8",
    pillText: "#A32D2D",
    iconBg: "#FEE8E8",
    icon: "exclamationmark.triangle.fill",
    iconColor: "#E05252",
  },
  community: {
    pillLabel: "PENGUMUMAN",
    pillBg: "#E8F8EC",
    pillText: "#1A5C2A",
    iconBg: "#E8F8EC",
    icon: "megaphone.fill",
    iconColor: "#3FCC54",
  },
  info: {
    pillLabel: "PENGUMUMAN",
    pillBg: "#E8F8EC",
    pillText: "#1A5C2A",
    iconBg: "#E8F8EC",
    icon: "megaphone.fill",
    iconColor: "#3FCC54",
  },
};

export default function NotificationDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  const params = useLocalSearchParams<{
    id: string;
    type: string;
    title: string;
    message: string;
    channel: string;
    time: string;
    sent_at_full: string;
    read: string;
  }>();

  const type = (params.type as NotifType) ?? "info";
  const cfg = TYPE_CONFIG[type];
  const isRead = params.read === "true";

  useEffect(() => {
    if (!isRead && params.id) {
      markRead(params.id).catch(() => {});
    }
  }, []);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.background, paddingTop: insets.top },
      ]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <IconSymbol name="chevron.left" size={18} color={theme.primary} />
          <Text style={[styles.backText, { color: theme.primary }]}>
            Notifikasi
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Unread badge — only shown if unread */}
        {!isRead && (
          <View
            style={[styles.unreadBadge, { backgroundColor: theme.communityBg }]}
          >
            <View
              style={[styles.unreadDot, { backgroundColor: theme.primary }]}
            />
            <Text style={[styles.unreadText, { color: "#1A5C2A" }]}>
              Belum dibaca
            </Text>
          </View>
        )}

        {/* Icon + type pill */}
        <View style={styles.typeRow}>
          <View style={[styles.typeIcon, { backgroundColor: cfg.iconBg }]}>
            <IconSymbol name={cfg.icon} size={22} color={cfg.iconColor} />
          </View>
          <View style={styles.typeRight}>
            <View style={[styles.pill, { backgroundColor: cfg.pillBg }]}>
              <Text style={[styles.pillText, { color: cfg.pillText }]}>
                {cfg.pillLabel}
              </Text>
            </View>
            <Text style={[styles.channelText, { color: theme.secondary }]}>
              {params.channel}
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: theme.text }]}>
          {params.title}
        </Text>

        {/* Time */}
        <Text style={[styles.time, { color: theme.secondary }]}>
          {params.sent_at_full || params.time}
        </Text>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* Message section */}
        <Text style={[styles.sectionLabel, { color: theme.secondary }]}>
          MESEJ
        </Text>

        {params.message ? (
          <View
            style={[
              styles.messageBox,
              {
                backgroundColor: theme.accent,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.messageText, { color: theme.text }]}>
              {params.message}
            </Text>
          </View>
        ) : (
          <Text style={[styles.noMessage, { color: theme.secondary }]}>
            Tiada mesej tambahan.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  backText: {
    fontSize: 15,
    fontWeight: "500",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  unreadBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 18,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  unreadText: {
    fontSize: 11,
    fontWeight: "600",
  },
  typeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  typeIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  typeRight: {
    gap: 4,
  },
  pill: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  pillText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  channelText: {
    fontSize: 11,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 24,
    marginBottom: 6,
  },
  time: {
    fontSize: 12,
    marginBottom: 18,
  },
  divider: {
    height: 0.5,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  messageBox: {
    borderRadius: 12,
    borderWidth: 0.5,
    padding: 14,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 22,
  },
  noMessage: {
    fontSize: 13,
    fontStyle: "italic",
  },
});
