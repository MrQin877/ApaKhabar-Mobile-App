import { IconSymbol } from "@/components/ui/icon-symbol";
import { getTheme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useRouter } from "expo-router";
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
    icon: SFSymbol;
    iconColor: string;
    iconBg: string;
  }
> = {
  emergency: {
    icon: "exclamationmark.triangle.fill",
    iconColor: "#E05252",
    iconBg: "#FEE8E8",
  },
  community: {
    icon: "megaphone.fill",
    iconColor: "#3FCC54",
    iconBg: "#E8F8EC",
  },
  info: {
    icon: "megaphone.fill",
    iconColor: "#3FCC54",
    iconBg: "#E8F8EC",
  },
};

interface NotifCardProps {
  item: Notification;
  onPress: (id: string) => void;
}

export function NotifCard({ item, onPress }: NotifCardProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);
  const cfg = TYPE_CONFIG[item.type];

  const handlePress = () => {
    if (!item.read) onPress(item.id);
    router.push({
      pathname: "/(tabs)/notification/[id]",
      params: {
        id: item.id,
        type: item.type,
        title: item.title,
        message: item.message,
        channel: item.channel,
        time: item.time,
        sent_at_full: item.sent_at_full,
        read: String(item.read),
      },
    });
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={[
        styles.item,
        {
          borderBottomColor: theme.border,
          opacity: item.read ? 0.45 : 1,
        },
      ]}
    >
      {/* Icon with unread dot */}
      <View style={styles.iconWrap}>
        <View style={[styles.iconBubble, { backgroundColor: cfg.iconBg }]}>
          <IconSymbol name={cfg.icon} size={20} color={cfg.iconColor} />
        </View>
        {!item.read && (
          <View
            style={[styles.unreadDot, { backgroundColor: theme.primary }]}
          />
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text numberOfLines={2} style={[styles.title, { color: theme.text }]}>
          {item.title}
        </Text>
        {item.message ? (
          <Text
            numberOfLines={1}
            style={[styles.desc, { color: theme.secondary }]}
          >
            {item.message}
          </Text>
        ) : null}
        <Text style={[styles.time, { color: theme.primary }]}>{item.time}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 0.5,
  },
  iconWrap: {
    position: "relative",
    flexShrink: 0,
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 9,
    height: 9,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  content: { flex: 1 },
  title: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 19,
    marginBottom: 2,
  },
  desc: {
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 3,
  },
  time: {
    fontSize: 10,
    fontWeight: "500",
  },
});
