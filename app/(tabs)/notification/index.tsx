import {
  NotifCard,
  NotifFooter,
  NotifHeader,
  NotifMarkAllButton,
  type Notification,
} from "@/components/notification";
import { getTheme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  getNotifications,
  markAllRead,
  markRead,
} from "@/services/notificationService";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// List item types for FlatList
type HeaderItem = { kind: "header"; date: string; key: string };
type NotifItem = { kind: "notif"; data: Notification; key: string };
type ListItem = HeaderItem | NotifItem;

export default function NotificationScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const unreadCount = notifs.filter((n) => !n.read).length;

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getNotifications();
      const mapped: Notification[] = data.map((n: any) => ({
        id: n.id,
        type:
          n.type === "darurat"
            ? "emergency"
            : n.type === "pengumuman"
              ? "community"
              : "info",
        title: n.title,
        message: n.message ?? "",
        channel: n.channel ?? "Aplikasi",
        time: n.sent_at,
        sent_at_full: n.sent_at_full ?? "",
        read: n.is_read,
      }));
      setNotifs(mapped);
    } catch (err) {
      setError("Gagal memuatkan notifikasi");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markRead(id);
      setNotifs((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
      setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  // Group by date then flatten into FlatList items
  const flatList: ListItem[] = React.useMemo(() => {
    const groups = notifs.reduce<Record<string, Notification[]>>((acc, n) => {
      const date = n.sent_at_full ? n.sent_at_full.split(",")[0] : "Hari ini";
      if (!acc[date]) acc[date] = [];
      acc[date].push(n);
      return acc;
    }, {});

    return Object.entries(groups).flatMap(([date, items]) => [
      { kind: "header", date, key: `header-${date}` },
      ...items.map((n) => ({ kind: "notif" as const, data: n, key: n.id })),
    ]);
  }, [notifs]);

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.kind === "header") {
      return (
        <Text style={[styles.dateLabel, { color: theme.secondary }]}>
          {item.date}
        </Text>
      );
    }
    return <NotifCard item={item.data} onPress={handleMarkRead} />;
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.background, paddingTop: insets.top },
      ]}
    >
      <NotifHeader unreadCount={unreadCount} />

      {/* Loading */}
      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.secondary }]}>
            Memuatkan notifikasi...
          </Text>
        </View>
      )}

      {/* Error */}
      {error && !loading && (
        <View style={styles.center}>
          <Ionicons
            name="cloud-offline-outline"
            size={48}
            color={theme.secondary}
          />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Ralat</Text>
          <Text style={[styles.emptyText, { color: theme.secondary }]}>
            {error}
          </Text>
        </View>
      )}

      {/* Empty */}
      {!loading && !error && notifs.length === 0 && (
        <View style={styles.center}>
          <Ionicons
            name="notifications-off-outline"
            size={64}
            color={theme.secondary}
          />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            Tiada Notifikasi
          </Text>
          <Text style={[styles.emptyText, { color: theme.secondary }]}>
            Anda tidak mempunyai sebarang notifikasi buat masa ini
          </Text>
        </View>
      )}

      {/* List grouped by date */}
      {!loading && !error && notifs.length > 0 && (
        <FlatList
          data={flatList}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.listContent}
          renderItem={renderItem}
          ListFooterComponent={<NotifFooter />}
        />
      )}

      {unreadCount > 0 && <NotifMarkAllButton onPress={handleMarkAllRead} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  dateLabel: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 12,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
});
