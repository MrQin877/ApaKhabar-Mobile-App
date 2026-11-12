import { useAppTheme } from "@/hooks/useAppTheme";
import { PressableFeedback } from "heroui-native/pressable-feedback";
import { useNotificationCount } from "@/context/NotificationContext";
import { Redirect, Tabs, useFocusEffect, useSegments } from "expo-router";
import { useCallback, useState } from "react";
import { Platform, View } from "react-native";
import { hasPendingEmailRegistration } from "../../services/authService";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconSymbol } from "../../components/ui/icon-symbol";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const segments: readonly string[] = useSegments();
  const hideNewsTabs = segments.includes("news_content") && (segments.at(-1) === "[id]" || segments.at(-1) === "search");
  const theme = useAppTheme();
  const { unreadCount } = useNotificationCount();
  const [registrationPending, setRegistrationPending] = useState<boolean | null>(Platform.OS === "web" ? false : null);

  useFocusEffect(useCallback(() => {
    let active = true;
    if (Platform.OS !== "web") {
      setRegistrationPending(null);
      hasPendingEmailRegistration()
        .then(pending => { if (active) setRegistrationPending(pending); })
        .catch(() => { if (active) setRegistrationPending(true); });
    }
    return () => { active = false; };
  }, []));

  if (registrationPending === null) return null;
  if (registrationPending) return <Redirect href="/verify-email" />;

  const tabBarStyle = {
    height: 60 + insets.bottom,
    paddingBottom: insets.bottom,
    paddingTop: 6,
    backgroundColor: theme.card,
    borderTopColor: theme.border,
    elevation: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0,
    shadowRadius: 10,
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.secondary,
        tabBarShowLabel: true,
        tabBarButton: ({ children, ref, ...props }) => (
          <PressableFeedback {...props} ref={node => {
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
          }}>{children}</PressableFeedback>
        ),
        tabBarStyle: hideNewsTabs ? { display: "none" } : tabBarStyle,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          marginTop: 2,
        },
        tabBarBackground: () => (
          <View
            style={{
              flex: 1,
              backgroundColor: theme.card,
              borderTopWidth: 1,
              borderTopColor: theme.border,
            }}
          />
        ),
      }}
    >
      {/* â”€â”€ Visible tabs â”€â”€ */}
      <Tabs.Screen
        name="news_content"
        options={{
          title: "Berita",
          tabBarLabel: "Berita",
          tabBarIcon: ({ focused }) => (
            <View style={{ width: 28, alignItems: "center" }}>
              <IconSymbol
                name={focused ? "newspaper.fill" : "newspaper"}
                size={24}
                color={focused ? theme.primary : theme.secondary}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="notification"
        options={{
          title: "Notifikasi",
          tabBarLabel: "Notifikasi",
          tabBarIcon: ({ focused }) => (
            <View style={{ width: 28, alignItems: "center" }}>
              <IconSymbol
                name={focused ? "bell.fill" : "bell"}
                size={24}
                color={focused ? theme.primary : theme.secondary}
              />
            </View>
          ),
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: "#FF3B30",
            color: "#fff",
            fontSize: 10,
            fontWeight: "600",
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarLabel: "Profil",
          tabBarIcon: ({ focused }) => (
            <IconSymbol
              name={focused ? "person.fill" : "person"}
              size={24}
              color={focused ? theme.primary : theme.secondary}
            />
          ),
        }}
      />

      {/* â”€â”€ Hidden tabs â”€â”€ */}
      <Tabs.Screen name="index" options={{ href: null }} />
    </Tabs>
  );
}
