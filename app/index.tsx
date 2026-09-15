import { Redirect, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { getProfile, getToken } from "../services/authService";

export default function Index() {
  const [destination, setDestination] = useState<Href | null>(null);

  useEffect(() => {
    let active = true;

    const initAuth = async () => {
      try {
        const token = await getToken();

        if (!token) {
          if (active) setDestination("/(auth)/welcome");
          return;
        }

        try {
          await getProfile();
          if (active) setDestination("/(tabs)/news_content");
        } catch {
          if (active) setDestination("/(auth)/login");
        }
      } catch {
        if (active) setDestination("/(auth)/login");
      }
    };

    initAuth();

    return () => {
      active = false;
    };
  }, []);

  if (!destination) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Redirect href={destination} />;
}
