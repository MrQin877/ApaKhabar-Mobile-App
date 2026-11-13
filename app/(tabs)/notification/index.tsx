import { NotificationSkeleton, NotificationState } from "@/components/notification/NotificationState";
import { useNotificationPermission } from "@/hooks/useNotificationPermission";
import { Button } from "heroui-native/button";
import { notificationDateLabel, notificationInstructions } from "@/utils/notifications";
import {
  NotifCard,
  NotifHeader,
  type Notification,
} from "@/components/notification";
import { getTheme } from "@/constants/theme";
import { useNotificationCount } from "@/context/NotificationContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  getNotifications,
  markAllRead,
  markRead,
} from "@/services/notificationService";
import { useFocusEffect } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AppState,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
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
type ListItem = HeaderItem | NotifItem;

export default function NotificationScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);
  const { setUnreadCount, showToast } = useNotificationCount();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);
  const loaded = useRef(false);
  const confirmedReads = useRef(new Set<string>());
  const markingAll = useRef(false);
  const [readError, setReadError] = useState<string | null>(null);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const permission = useNotificationPermission();
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const unreadCount = notifs.filter((n) => !n.read).length;


  const fetchNotifications = useCallback(async (refresh = false) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(!refresh && !loaded.current);
    setRefreshing(refresh || loaded.current);
    try {
      setError(null);
      const data = await getNotifications();
      if (!mounted.current) return;
      const items = Array.isArray(data) ? data : [];
      const mapped: Notification[] = items.map((n: any) => ({
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
        read: n.is_read === true || n.is_read === 1 || confirmedReads.current.has(n.id),
        location: n.location,
        affected_area: n.affected_area,
        source: n.source,
        safety_instructions: notificationInstructions(n.safety_instructions),
      }));
      setNotifs(mapped);
      loaded.current = true;

      // Show toast if there's an unread emergency  ← add this
      const unreadDarurat = mapped.find(
        (n) => n.type === "emergency" && !n.read,
      );
      if (unreadDarurat) {
        showToast(unreadDarurat.title);
      }
    } catch {
      setError("Gagal memuatkan notifikasi");
    } finally {
      setLoading(false);
      setRefreshing(false);
      inFlight.current = false;
    }
  }, [showToast]);

  useFocusEffect(
    useCallback(() => {
      void fetchNotifications(loaded.current);
      void permission.check();
    }, [fetchNotifications, permission.check]),
  );
  useEffect(() => {
    const subscription = AppState.addEventListener("change", state => {
      if (state === "active") void fetchNotifications(loaded.current);
    });
    return () => subscription.remove();
  }, [fetchNotifications]);
  useEffect(() => {
    const count = notifs.filter((n) => !n.read).length;
    setUnreadCount(count);
  }, [notifs]);

  const handleRefresh = () => fetchNotifications(true);

  const handleMarkRead = async (id: string) => {
    try {
      await markRead(id);
      confirmedReads.current.add(id);
      setReadError(null);
      setNotifs((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      return true;
    } catch (err) {
      console.error("Failed to mark as read", err);
      setReadError("Notifikasi tidak dapat ditandakan dibaca. Cuba sekali lagi.");
      return false;
    }
  };

  const handleMarkAllRead = async () => {
    if (markingAll.current) return;
    markingAll.current = true;
    setMarkingAllRead(true);
    const ids = new Set(notifs.map(n => n.id));
    try {
      await markAllRead();
      ids.forEach(id => confirmedReads.current.add(id));
      setReadError(null);
      setNotifs((prev) => prev.map((n) => ids.has(n.id) ? { ...n, read: true } : n));
    } catch (err) {
      console.error("Failed to mark all as read", err);
      setReadError("Notifikasi tidak dapat ditandakan dibaca. Cuba sekali lagi.");
    } finally {
      markingAll.current = false;
      setMarkingAllRead(false);
    }
  };

  const flatList = useMemo<ListItem[]>(() => {
    const groups = notifs.reduce<Record<string, Notification[]>>((acc, n) => {
      const date = notificationDateLabel(n.sent_at_full || "");
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

        </View>
      );
    }
    return <NotifCard item={item.data} onPress={handleMarkRead} />;
  };

  const refreshControl = <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.primary} colors={[theme.primary]}/>;
  const permissionPrompt = <NotificationState kind="permission" theme={theme} onAction={permission.open} busy={permission.busy} actionError={permission.actionError}/>;
  return <View style={{ flex: 1, backgroundColor: theme.background, paddingTop: insets.top }}>
    <NotifHeader unreadCount={unreadCount}/>
    {loading && notifs.length === 0 ? <NotificationSkeleton theme={theme}/> : notifs.length > 0 ? <>
      <View style={[styles.toolbar, { borderBottomColor: theme.border }]}>
        <Text accessibilityLiveRegion="polite" style={{ color: theme.primary, fontSize: 12, fontWeight: "600" }}>{unreadCount ? `${unreadCount} belum dibaca` : "Semua sudah dibaca"}</Text>
        {unreadCount > 0 ? <Button variant="ghost" className="h-auto min-w-0 p-0" isDisabled={markingAllRead} onPress={handleMarkAllRead} style={{ minHeight: 44 }}><Text style={{ color: theme.primary, fontSize: 11 }}>Tandakan semua dibaca</Text></Button>
          : <Text style={{ color: theme.text, fontSize: 11, paddingVertical: 14 }}>Selesai</Text>}
      </View>
      <FlatList data={flatList} keyExtractor={item => item.key} renderItem={renderItem}
        contentContainerStyle={styles.listContent} refreshControl={refreshControl} showsVerticalScrollIndicator={false}
        ListHeaderComponent={<>
          {readError && <Text accessibilityRole="alert" style={{ color: theme.error, fontSize: 12, paddingVertical: 8 }}>{readError}</Text>}
          {error && <View style={[styles.inlineError, { borderColor: theme.border }]}><Text accessibilityRole="alert" style={{ color: theme.error, flex: 1, fontSize: 12 }}>Notifikasi tidak dapat dikemas kini.</Text><Button variant="ghost" className="h-auto min-w-0 px-2 py-3" isDisabled={refreshing} onPress={handleRefresh}><Text style={{ color: theme.primary, fontSize: 12 }}>Cuba lagi</Text></Button></View>}
          {permission.disabled && <NotificationState kind="permission" compact theme={theme} onAction={permission.open} busy={permission.busy} actionError={permission.actionError}/>}
        </>}/>
    </> : <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.stateContent} refreshControl={refreshControl}>
      {error ? <NotificationState kind="error" theme={theme} onAction={() => void fetchNotifications()} busy={refreshing}/>
        : permission.disabled ? permissionPrompt : loaded.current ? <NotificationState kind="empty" theme={theme}/> : null}
    </ScrollView>}
  </View>;
}

const styles = StyleSheet.create({
  toolbar: { marginHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, borderBottomWidth: 0.5 },
  listContent: { paddingHorizontal: 16, paddingBottom: 32, flexGrow: 1 },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 16, paddingBottom: 6 },
  sectionLabel: { fontSize: 13, fontWeight: "700" },
  stateContent: { flexGrow: 1, justifyContent: "center", paddingBottom: 24 },
  inlineError: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderBottomWidth: 0.5 },
});
