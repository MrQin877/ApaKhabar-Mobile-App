import {
  NotifCard,
  NotifFooter,
  NotifHeader,
  NotifMarkAllButton,
  type Notification,
} from "@/components/notification";
import { INITIAL_NOTIFS } from "@/constants/notificationData";
import React, { useState } from "react";
import { FlatList, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function NotificationScreen() {
  const insets = useSafeAreaInsets();
  const [notifs, setNotifs] = useState<Notification[]>(INITIAL_NOTIFS);

  const unreadCount = notifs.filter((n) => !n.read).length;

  const markRead = (id: string) => {
    setNotifs((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  const markAllRead = () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <NotifHeader unreadCount={unreadCount} />

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
