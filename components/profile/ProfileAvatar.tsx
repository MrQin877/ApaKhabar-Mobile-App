import { useState } from "react";
import { Image, Text, View } from "react-native";
import { useAppTheme } from "@/hooks/useAppTheme";
import { resolveNewsImage } from "@/utils/newsImage";
import { commentInitials } from "@/utils/newsComments";

export function ProfileAvatar({ uri, name, size = 56 }: { uri?: string | null; name?: string | null; size?: number }) {
  const theme = useAppTheme();
  const [failed, setFailed] = useState<string | null>(null);
  const style = { width: size, height: size, borderRadius: size / 2 };
  return uri && uri !== failed
    ? <Image accessibilityLabel="Foto profil" source={{ uri: resolveNewsImage(uri) }} resizeMode="cover" style={style} onError={() => setFailed(uri)}/>
    : <View accessibilityLabel={`Avatar ${name?.trim() || "profil"}`} style={[style, { backgroundColor: theme.communityBg, alignItems: "center", justifyContent: "center" }]}>
      <Text style={{ color: theme.primary, fontSize: size * 0.42, fontWeight: "700" }}>{commentInitials(name || "")}</Text>
    </View>;
}
