import { FloatingTabBar } from "@/components/navigation/FloatingTabBar";
import { useNotificationCount } from "@/context/NotificationContext";
import { Redirect, Tabs, useFocusEffect, useSegments } from "expo-router";
import { createRef, useCallback, useState, type ComponentRef } from "react";
import { Platform, type View } from "react-native";
import { BlurTargetView } from "expo-blur";
import { hasPendingEmailRegistration } from "../../services/authService";

export default function TabLayout() {
  const segments: readonly string[] = useSegments();
  const hideNewsTabs = segments.includes("news_content") && (segments.at(-1) === "[id]" || segments.at(-1) === "search");
  const { unreadCount } = useNotificationCount();
  const [blurTargets] = useState(() => Object.fromEntries(['news_content', 'video', 'notification', 'profile', 'index'].map(name => [name, createRef<ComponentRef<typeof View>>()] )));
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

  return (
    <Tabs
      screenLayout={({ children, route }) => <BlurTargetView ref={blurTargets[route.name]} style={{ flex: 1 }}>{children}</BlurTargetView>}
      tabBar={props => <FloatingTabBar {...props} blurTarget={blurTargets[props.state.routes[props.state.index].name]}/>}
      screenOptions={{ headerShown: false, tabBarStyle: hideNewsTabs ? { display: 'none' } : undefined }}
    >
      <Tabs.Screen name="news_content" options={{ title: 'Berita' }}/>
      <Tabs.Screen name="video" listeners={({ navigation }) => ({ tabPress: () => navigation.navigate('video', { id: undefined, restart: String(Date.now()) }) })} options={{ title: 'Video', tabBarStyle: { position: 'absolute' } }}/>
      <Tabs.Screen name="notification" options={{ title: 'Notifikasi', tabBarBadge: unreadCount > 0 ? unreadCount : undefined }}/>
      <Tabs.Screen name="profile" options={{ title: 'Profil' }}/>
      <Tabs.Screen name="index" options={{ href: null }}/>
    </Tabs>
  );
}
