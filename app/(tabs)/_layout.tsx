import { Tabs } from "expo-router";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconSymbol } from "../../components/ui/icon-symbol";
import { getTheme } from "../../constants/theme";
import { useColorScheme } from "../../hooks/use-color-scheme";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.secondary,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopWidth: 1,
          borderTopColor: theme.border,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 6,
          elevation: 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: colorScheme === "dark" ? 0.3 : 0.08,
          shadowRadius: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginTop: 2,
        },
      }}
    >
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
          tabBarBadge: 3,
          tabBarBadgeStyle: {
            backgroundColor: "#FF3B30",
            color: "#fff",
            fontSize: 10,
            fontWeight: "600",
          },
        }}
      />
      <Tabs.Screen
        name="profile/index"
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
<<<<<<< Updated upstream
      <Tabs.Screen name="index" options={{ href: null }} />
=======

      {/* ── Hidden screens ── */}
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen
        name="news_content/[id]"
        options={{
          href: null,
          tabBarStyle: { display: "none" },
        }}
      />
>>>>>>> Stashed changes
    </Tabs>
  );
}
