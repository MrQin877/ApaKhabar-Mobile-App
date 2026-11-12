import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { getToken } from "../services/authService";
import { getTheme } from "../constants/theme";
import { useColorScheme } from "../hooks/use-color-scheme";
export default function Index() {
  const theme = getTheme(useColorScheme());
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  useEffect(() => {
    let active = true;
    getToken().then(token => { if (active) setHasSession(!!token); })
      .catch(() => { if (active) setHasSession(false); });
    return () => { active = false; };
  }, []);
  if (hasSession === null) return <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.background }}><ActivityIndicator color={theme.primary}/></View>;
  // Email-registration gating remains in the tabs layout; API middleware validates tokens.
  return <Redirect href={hasSession ? "/(tabs)/news_content" : "/(auth)/welcome"}/>;
}
