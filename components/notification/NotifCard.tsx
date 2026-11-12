import { IconSymbol } from "@/components/ui/icon-symbol";
import { getTheme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useRouter } from "expo-router";
import type { SFSymbol } from "expo-symbols";
import { useRef } from "react";
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
  location?: string;
  affected_area?: string;
  source?: string;
  safety_instructions?: string[];
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
  onPress: (id: string) => Promise<boolean>;
}

export function NotifCard({ item, onPress }: NotifCardProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);
  const cfg = TYPE_CONFIG[item.type];
  const opening = useRef(false);

  const handlePress = async () => {
    if (opening.current) return;
    opening.current = true;
    try {
      const read = item.read || await onPress(item.id);
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
          read: String(read),
          location: item.location || "",
          affected_area: item.affected_area || "",
          source_info: item.source || "",
          safety_instructions: JSON.stringify(item.safety_instructions || []),
        },
      });
      } finally { opening.current = false; }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={[
        styles.item,
        {
          borderBottomColor: theme.border,
        },
      ]}
    >
      {!item.read && <View testID="notification-unread-indicator" style={[styles.unreadIndicator, { backgroundColor: theme.primary }]}/>}
      <View style={styles.iconWrap}>
        <View style={[styles.iconBubble, { backgroundColor: item.type === "emergency" ? theme.emergencyBg : theme.communityBg }]}>
          <IconSymbol name={cfg.icon} size={18} color={item.type === "emergency" ? theme.error : theme.primary} />
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text numberOfLines={2} ellipsizeMode="tail" style={[styles.title, { color: theme.text, fontWeight: item.read ? "500" : "700" }]}>
          {item.title}
        </Text>
        {item.message ? (
          <Text
            numberOfLines={2}
            ellipsizeMode="tail"
            style={[styles.desc, { color: theme.secondary }]}
          >
            {item.message}
          </Text>
        ) : null}
        <Text style={[styles.time, { color: theme.secondary }]}>{item.time}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 12,
    borderBottomWidth: 0.5,
  },
  iconWrap: {
    position: "relative",
    flexShrink: 0,
  },
  iconBubble: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadIndicator: {
    position: "absolute",
    left: 0,
    top: 12,
    bottom: 12,
    width: 2,
    borderRadius: 1,
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
