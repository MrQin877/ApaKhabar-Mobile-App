import { Card } from "heroui-native/card";
import { PressableFeedback } from "heroui-native/pressable-feedback";
import { Button } from "heroui-native/button";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { memo } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import type { Theme } from "@/constants/theme";
import type { NewsItem } from "@/hooks/useNews";
import { newsPostingTime } from "@/utils/newsFilters";
import { newsImage } from "./FeaturedCard";
export const CompactNewsCard = memo(function CompactNewsCard({ item, theme, now, showCounts = true }: { item: NewsItem; theme: Theme; now: number; showCounts?: boolean }) {
  const author = (typeof item.author === "string" ? item.author : item.author?.name) || item.author_name;
  return <PressableFeedback accessibilityRole="button" accessibilityLabel={item.title}
    onPress={() => router.push({ pathname: "/(tabs)/news_content/[id]", params: { id: item.id } })}
    >
    <Card className="rounded-none bg-transparent p-0 shadow-none" style={[styles.card, { borderBottomColor: theme.border }]}>
    <View style={styles.copy}>
      <Text numberOfLines={3} style={[styles.title, { color: theme.text }]}>{item.title}</Text>
      <Text numberOfLines={1} style={[styles.meta, { color: theme.secondary }]}>{[author, newsPostingTime(item, new Date(now))].filter(Boolean).join(" \u00b7 ")}</Text>
      {showCounts && <View style={styles.counts}>
        <View style={styles.count}><Ionicons name="heart-outline" size={14} color={theme.secondary}/><Text style={[styles.countText, { color: theme.secondary }]}>{item.likes ?? 0}</Text></View>
        <Button variant="ghost" className="h-auto min-h-0 min-w-0 rounded-none p-0" accessibilityRole="button" accessibilityLabel={`Buka ${item.comments ?? 0} komen`} hitSlop={8} onPress={event => { event.stopPropagation(); router.push({ pathname: "/(tabs)/news_content/[id]", params: { id: item.id, comments: "open" } }); }} style={styles.count}><Ionicons name="chatbubble-outline" size={13} color={theme.secondary}/><Text style={[styles.countText, { color: theme.secondary }]}>{item.comments ?? 0}</Text></Button>
      </View>}
    </View>
    {!!item.image && <Image source={{ uri: newsImage(item.image) }} style={styles.image} resizeMode="cover"/>}
  </Card>
  </PressableFeedback>;
});
const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "flex-start", gap: 18, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 13 },
  copy: { flex: 1, minWidth: 0 }, title: { fontSize: 15, fontWeight: "600", lineHeight: 20 },
  meta: { fontSize: 11, lineHeight: 17, marginTop: 4 }, counts: { flexDirection: "row", gap: 18, marginTop: 4 },
  count: { flexDirection: "row", alignItems: "center", gap: 6 }, countText: { fontSize: 11 },
  image: { width: 86, height: 78, borderRadius: 9 },
});
