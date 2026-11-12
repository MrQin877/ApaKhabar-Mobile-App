import { Card } from "heroui-native/card";
import { PressableFeedback } from "heroui-native/pressable-feedback";
import { useAppTheme } from "@/hooks/useAppTheme";
import { Button } from "heroui-native/button";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image, Share, StyleSheet, Text, View } from "react-native";
import { Design } from "@/constants/theme";
import type { NewsItem } from "@/hooks/useNews";
import { BACKEND_BASE_URL } from "@/services/apiConfig";

import { resolveNewsImage as newsImage } from "@/utils/newsImage";
export { resolveNewsImage as newsImage } from "@/utils/newsImage";
export function NewsMeta({ item }: { item: NewsItem }) {
  const theme = useAppTheme();
  const author = typeof item.author === "string" ? item.author : item.author?.name;
  return <Text style={{ color: theme.secondary, fontSize: 11, lineHeight: 17 }}>{[author, item.time || item.date].filter(Boolean).join("  \u00b7  ")}</Text>;
}
export function NewsActions({ item }: { item: NewsItem }) {
  const theme = useAppTheme();
  const open = () => router.push({ pathname: "/(tabs)/news_content/[id]", params: { id: item.id } });
  return <View style={styles.actions}>
    <Button variant="ghost" className="h-auto min-h-0 min-w-0 rounded-none p-0" accessibilityRole="button" accessibilityLabel={`${item.likes} suka, buka berita`} onPress={open} style={styles.action}><Ionicons name="heart-outline" size={17} color={theme.secondary}/><Text style={{ color: theme.secondary, fontSize: 12 }}>{item.likes}</Text></Button>
    <Button variant="ghost" className="h-auto min-h-0 min-w-0 rounded-none p-0" accessibilityRole="button" accessibilityLabel={`${item.comments} komen, buka komen`} onPress={() => router.push({ pathname: "/(tabs)/news_content/[id]", params: { id: item.id, comments: "open" } })} style={styles.action}><Ionicons name="chatbubble-outline" size={16} color={theme.secondary}/><Text style={{ color: theme.secondary, fontSize: 12 }}>{item.comments}</Text></Button>
    <Button variant="ghost" className="h-auto min-h-0 min-w-0 rounded-none p-0" accessibilityRole="button" accessibilityLabel="Kongsi berita" onPress={() => { Share.share({ message: `${item.title}\n${BACKEND_BASE_URL}/news/${item.id}` }).catch(() => {}); }} style={styles.action}><Ionicons name="share-outline" size={17} color={theme.secondary}/><Text style={{ color: theme.secondary, fontSize: 12 }}>Kongsi</Text></Button>
  </View>;
}
export function FeaturedCard(item: NewsItem) {
  const theme = useAppTheme();
  const description = (item.description || item.body || "").replace(/<[^>]*>/g, "");
  return <Card className="rounded-none bg-transparent p-0 shadow-none" style={{ borderBottomWidth: 1, borderColor: theme.border, paddingBottom: 16 }}>
    <PressableFeedback className="items-stretch" accessibilityRole="button" accessibilityLabel={item.title} onPress={() => router.push({ pathname: "/(tabs)/news_content/[id]", params: { id: item.id } })}>
      {!!item.image && <Image source={{ uri: newsImage(item.image) }} style={styles.image}/>}
      <View style={{ marginTop: 8 }}><NewsMeta item={item}/></View>
      <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>
      {!!description && <Text numberOfLines={2} style={{ color: theme.secondary, fontSize: 13, lineHeight: 19, marginTop: 6 }}>{description}</Text>}
    </PressableFeedback>
    <NewsActions item={item}/>
  </Card>;
}
const styles = StyleSheet.create({
  image: { width: "100%", aspectRatio: 2, borderRadius: Design.radius.image },
  title: { fontSize: 23, lineHeight: 29, fontWeight: "500", marginTop: 6 },
  actions: { flexDirection: "row", alignItems: "center", gap: 18, marginTop: 8 },
  action: { flexDirection: "row", alignItems: "center", gap: 5, minHeight: 32 },
});
