import {
  NotifCard,
  NotifFooter,
  NotifHeader,
  type Notification,
} from "@/components/notification";
<<<<<<< Updated upstream
import { INITIAL_NOTIFS } from "@/constants/notificationData";
import { getTheme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React, { useState } from "react";
import { FlatList, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

=======
import { IconSymbol } from "@/components/ui/icon-symbol";
import { getTheme } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  getNotifications,
  markAllRead,
  markRead,
} from "@/services/notificationService";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type HeaderItem = {
  kind: "header";
  date: string;
  hasUnread: boolean;
  key: string;
};
type NotifItem = { kind: "notif"; data: Notification; key: string };
type EmergencyItem = { kind: "emergency"; data: Notification; key: string };
type ListItem = HeaderItem | NotifItem | EmergencyItem;

>>>>>>> Stashed changes
export default function NotificationScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);
  const [notifs, setNotifs] = useState<Notification[]>(INITIAL_NOTIFS);

  const unreadCount = notifs.filter((n) => !n.read).length;

<<<<<<< Updated upstream
  const markRead = (id: string) => {
    setNotifs((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  const markAllRead = () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
=======
  // Separate emergency unread for banner
  const emergencyUnread = notifs.find((n) => n.type === "emergency" && !n.read);

  const STALE_TIME = 5 * 60 * 1000; // 5 minutes
  const lastFetchRef = useRef<number>(0);
  const [refreshing, setRefreshing] = useState(false);

  // Smart refetch on focus — only if stale
  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (now - lastFetchRef.current > STALE_TIME) {
        fetchNotifications();
        lastFetchRef.current = now;
      }
    }, []),
  );

  // Manual pull-to-refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    lastFetchRef.current = Date.now();
    setRefreshing(false);
  };

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
    } catch {
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

  const handleMarkAllRead = async (date?: string) => {
    try {
      await markAllRead();
      setNotifs((prev) =>
        prev.map((n) => {
          if (!date) return { ...n, read: true };
          const d = n.sent_at_full?.split(",")[0] ?? "Hari ini";
          return d === date ? { ...n, read: true } : n;
        }),
      );
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  // Group by date and build flat list
  const flatList = useMemo<ListItem[]>(() => {
    const groups = notifs.reduce<Record<string, Notification[]>>((acc, n) => {
      const date = n.sent_at_full?.split(",")[0] ?? "Hari ini";
      if (!acc[date]) acc[date] = [];
      acc[date].push(n);
      return acc;
    }, {});

    return Object.entries(groups).flatMap(([date, items]) => [
      {
        kind: "header" as const,
        date,
        hasUnread: items.some((n) => !n.read),
        key: `header-${date}`,
      },
      ...items.map((n) => ({
        kind: "notif" as const,
        data: n,
        key: n.id,
      })),
    ]);
  }, [notifs]);

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.kind === "header") {
      return (
        <View style={[styles.sectionRow, { borderBottomColor: theme.border }]}>
          <Text style={[styles.sectionLabel, { color: theme.text }]}>
            {item.date}
          </Text>
          {item.hasUnread && (
            <TouchableOpacity onPress={() => handleMarkAllRead(item.date)}>
              <Text style={[styles.markReadBtn, { color: theme.primary }]}>
                Tandai dibaca
              </Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }
    return <NotifCard item={item.data} onPress={handleMarkRead} />;
>>>>>>> Stashed changes
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.background,
        paddingTop: insets.top,
      }}
    >
      <NotifHeader unreadCount={unreadCount} />

<<<<<<< Updated upstream
      <FlatList
        data={notifs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        renderItem={({ item }) => <NotifCard item={item} onPress={markRead} />}
        ListFooterComponent={<NotifFooter />}
      />

      {unreadCount > 0 && <NotifMarkAllButton onPress={markAllRead} />}
    </View>
  );
}
=======
      {/* Loading */}
      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.centerText, { color: theme.secondary }]}>
            Memuatkan...
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
          <Text style={[styles.centerText, { color: theme.secondary }]}>
            {error}
          </Text>
          <TouchableOpacity
            onPress={fetchNotifications}
            style={[styles.retryBtn, { borderColor: theme.primary }]}
          >
            <Text style={[styles.retryText, { color: theme.primary }]}>
              Cuba lagi
            </Text>
          </TouchableOpacity>
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
          <Text style={[styles.centerText, { color: theme.secondary }]}>
            Anda tidak mempunyai sebarang notifikasi buat masa ini
          </Text>
        </View>
      )}

      {/* List */}
      {!loading && !error && notifs.length > 0 && (
        <FlatList
          data={flatList}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.listContent}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.primary} // iOS spinner color
              colors={[theme.primary]} // Android spinner color
            />
          }
          ListHeaderComponent={
            // Emergency pinned banner
            emergencyUnread ? (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleMarkRead(emergencyUnread.id)}
                style={[
                  styles.emergencyBanner,
                  { backgroundColor: theme.warning },
                ]}
              >
                <View style={styles.emergencyIconWrap}>
                  <IconSymbol
                    name="exclamationmark.triangle.fill"
                    size={18}
                    color={theme.error}
                  />
                </View>
                <View style={styles.emergencyContent}>
                  <Text style={[styles.emergencyTitle, { color: theme.error }]}>
                    Darurat!
                  </Text>
                  <Text
                    numberOfLines={2}
                    style={[styles.emergencyText, { color: theme.error }]}
                  >
                    {emergencyUnread.title}
                  </Text>
                </View>
              </TouchableOpacity>
            ) : null
          }
          ListFooterComponent={<NotifFooter />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 16,
    paddingBottom: 6,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  markReadBtn: {
    fontSize: 11,
    fontWeight: "600",
  },
  emergencyBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 14,
    padding: 12,
    marginBottom: 4,
  },
  emergencyIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#FEE8E8",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  emergencyContent: { flex: 1 },
  emergencyTitle: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 2,
  },
  emergencyText: {
    fontSize: 12,
    lineHeight: 17,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 10,
  },
  centerText: { fontSize: 13, textAlign: "center" },
  emptyTitle: { fontSize: 16, fontWeight: "700", textAlign: "center" },
  retryBtn: {
    marginTop: 6,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  retryText: { fontSize: 13, fontWeight: "600" },
});
>>>>>>> Stashed changes
