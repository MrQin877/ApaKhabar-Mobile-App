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
  time: string;
  read: boolean;
}

const TYPE_CONFIG: Record<
  NotifType,
  {
    accentColor: string;
    bgDark: string;
    bgLight: string;
    icon: SFSymbol;
    iconColor: string;
  }
> = {
  community: {
    accentColor: "#3FCC54",
    bgLight: "#ffffff",
    bgDark: "#2A2A2A",
    icon: "megaphone.fill",
    iconColor: "#3FCC54",
  },
  emergency: {
    accentColor: "#E05252",
    bgLight: "#FEE8E8",
    bgDark: "#3D2020",
    icon: "exclamationmark.triangle.fill",
    iconColor: "#E05252",
  },
  info: {
    accentColor: "#3FCC54",
    bgLight: "#ffffff",
    bgDark: "#2A2A2A",
    icon: "megaphone.fill",
    iconColor: "#3FCC54",
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
  const bgColor = colorScheme === "dark" ? cfg.bgDark : cfg.bgLight;

  return (
    <TouchableOpacity
      onPress={() => onPress(item.id)}
      activeOpacity={0.8}
      style={[styles.card, { borderColor: theme.border }]}
    >
      {/* Left accent bar */}
      <View style={[styles.accent, { backgroundColor: cfg.accentColor }]} />

      {/* Card body */}
      <View style={[styles.body, { backgroundColor: bgColor }]}>
        {/* Icon bubble */}
        <View style={[styles.iconBubble, { backgroundColor: theme.accent }]}>
          <IconSymbol name={cfg.icon} size={20} color={cfg.iconColor} />
        </View>

        {/* Title */}
        <View style={styles.textContainer}>
          <Text
            style={[
              styles.title,
              { color: theme.text, fontWeight: item.read ? "400" : "600" },
            ]}
          >
            {item.title}
          </Text>
        </View>

        {/* Time */}
        <Text style={[styles.time, { color: theme.secondary }]}>
          {item.time}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "stretch",
    marginBottom: 12,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
  },
  accent: {
    width: 6,
  },
  body: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    lineHeight: 20,
  },
  time: {
    fontSize: 12,
    alignSelf: "flex-start",
    paddingTop: 2,
    marginLeft: 4,
  },
});
