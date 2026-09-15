import { Redirect, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { getProfile, getToken } from "../services/authService";

export default function Index() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    const initAuth = async () => {
      try {
        const token = await getToken();

        if (!token) {
          if (active) router.replace("/(auth)/welcome");
          return;
        }

        try {
          await getProfile();
          if (active) router.replace("/(tabs)");
        } catch {
          if (active) router.replace("/(auth)/login");
        }
      } finally {
        if (active) setReady(true);
      }
    };

    initAuth();

    return () => {
      active = false;
    };
  }, [router]);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Redirect href="/(auth)/welcome" />;
}