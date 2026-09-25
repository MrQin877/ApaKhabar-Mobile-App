import { useNotificationCount } from "@/context/NotificationContext";
import { Redirect, Tabs, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Platform, View } from "react-native";
import { hasPendingEmailRegistration } from "../../services/authService";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconSymbol } from "../../components/ui/icon-symbol";
import { getTheme } from "../../constants/theme";
import { useColorScheme } from "../../hooks/use-color-scheme";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);
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
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: colorScheme === "dark" ? 0.3 : 0.08,
    shadowRadius: 10,
  };

  return (
    <Tabs
      key={colorScheme}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.secondary,
        tabBarShowLabel: true,
        tabBarStyle,
        tabBarLabelStyle: {
          fontSize: 12,
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
      {/* ── Visible tabs ── */}
      <Tabs.Screen
        name="news_content/index"
        options={{
          title: "Berita",
          tabBarLabel: "Berita",
          tabBarIcon: ({ color, focused }) => (
            <View style={{ width: 28, alignItems: "center" }}>
              <IconSymbol
                name={focused ? "newspaper.fill" : "newspaper"}
                size={24}
                color={color}
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
          tabBarIcon: ({ color, focused }) => (
            <View style={{ width: 28, alignItems: "center" }}>
              <IconSymbol
                name={focused ? "bell.fill" : "bell"}
                size={24}
                color={color}
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
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              name={focused ? "person.fill" : "person"}
              size={24}
              color={color}
            />
          ),
        }}
      />

      {/* ── Hidden tabs ── */}
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="news_content/[id]" options={{ href: null }} />
    </Tabs>
  );
}
