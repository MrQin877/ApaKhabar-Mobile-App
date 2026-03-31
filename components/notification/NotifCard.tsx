import { IconSymbol } from "@/components/ui/icon-symbol";
import { getTheme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { SFSymbol } from "expo-symbols";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export type NotifType = "info" | "emergency" | "community";

export interface Notification {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  channel: string;
  time: string;
  sent_at_full: string;
  read: boolean;
}

const TYPE_CONFIG: Record<
  NotifType,
  {
    accentColor: string;
    accentColorRead: string;
    icon: SFSymbol;
    iconColor: string;
    pillLabel: string;
  }
> = {
  emergency: {
    accentColor: "#E05252",
    accentColorRead: "#AABFBA",
    icon: "exclamationmark.triangle.fill",
    iconColor: "#E05252",
    pillLabel: "Darurat",
  },
  community: {
    accentColor: "#3FCC54",
    accentColorRead: "#AABFBA",
    icon: "megaphone.fill",
    iconColor: "#3FCC54",
    pillLabel: "Pengumuman",
  },
  info: {
    accentColor: "#3FCC54",
    accentColorRead: "#AABFBA",
    icon: "megaphone.fill",
    iconColor: "#3FCC54",
    pillLabel: "Pengumuman",
  },
};

interface NotifCardProps {
  item: Notification;
  onPress: (id: string) => void;
}

export function NotifCard({ item, onPress }: NotifCardProps) {
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);
  const cfg = TYPE_CONFIG[item.type];
  const isEmergency = item.type === "emergency";

  const cardBg = item.read
    ? theme.card
    : isEmergency
      ? theme.emergencyBg
      : theme.communityBg;

  const accentColor = item.read ? cfg.accentColorRead : cfg.accentColor;

  const pillBg = item.read
    ? theme.accent
    : isEmergency
      ? theme.warning
      : theme.communityBg;

  const pillTextColor = item.read
    ? theme.secondary
    : isEmergency
      ? theme.error
      : "#1A5C2A";

  return (
    <TouchableOpacity
      onPress={() => onPress(item.id)}
      activeOpacity={0.8}
      style={[
        styles.card,
        {
          borderColor: isEmergency && !item.read ? "#E0525240" : theme.border,
          backgroundColor: cardBg,
          opacity: item.read ? 0.75 : 1,
        },
      ]}
    >
      {/* Left accent bar */}
      <View style={[styles.accent, { backgroundColor: accentColor }]} />

      {/* Card body */}
      <View style={styles.body}>
        {/* Icon bubble */}
        <View
          style={[
            styles.iconBubble,
            {
              backgroundColor: item.read
                ? theme.accent
                : isEmergency
                  ? theme.warning
                  : theme.communityBg,
            },
          ]}
        >
          <IconSymbol
            name={cfg.icon}
            size={18}
            color={item.read ? theme.secondary : cfg.iconColor}
          />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Type pill */}
          <View style={[styles.pill, { backgroundColor: pillBg }]}>
            <Text style={[styles.pillText, { color: pillTextColor }]}>
              {cfg.pillLabel}
            </Text>
          </View>

          {/* Title */}
          <Text
            style={[
              styles.title,
              {
                color: item.read ? theme.secondary : theme.text,
                fontWeight: item.read ? "400" : "600",
              },
            ]}
          >
            {item.title}
          </Text>

          {/* Meta: channel · time */}
          <View style={styles.metaRow}>
            <Text style={[styles.metaText, { color: theme.secondary }]}>
              {item.channel}
            </Text>
            <View style={[styles.metaDot, { backgroundColor: theme.border }]} />
            <Text style={[styles.metaText, { color: theme.secondary }]}>
              {item.time}
            </Text>
          </View>
        </View>

        {/* Unread green dot */}
        {!item.read && (
          <View
            style={[styles.unreadDot, { backgroundColor: theme.primary }]}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "stretch",
    marginBottom: 8,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 0.5,
  },
  accent: { width: 5 },
  body: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 2,
  },
  content: { flex: 1 },
  pill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginBottom: 4,
  },
  pillText: {
    fontSize: 10,
    fontWeight: "600",
  },
  title: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaText: { fontSize: 11 },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 999,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    flexShrink: 0,
    marginTop: 6,
  },
});
