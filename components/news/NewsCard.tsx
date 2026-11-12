import { Card } from "heroui-native/card";
import { PressableFeedback } from "heroui-native/pressable-feedback";
import { router } from "expo-router";
import { Image, Text, View } from "react-native";
import type { Theme } from "@/constants/theme";
import type { NewsItem } from "@/hooks/useNews";
import { newsImage, NewsMeta, NewsActions } from "./FeaturedCard";
export function NewsCard({ theme, ...item }: NewsItem & { theme: Theme }) {
  return <Card className="rounded-none bg-transparent p-0 shadow-none" style={{ borderBottomWidth: 1, borderColor: theme.border, paddingBottom: 10 }}>
    <PressableFeedback accessibilityRole="button" accessibilityLabel={item.title} onPress={() => router.push({ pathname: "/(tabs)/news_content/[id]", params: { id: item.id } })} style={{ flexDirection: "row", gap: 16 }}>
      <View style={{ flex: 1 }}><Text numberOfLines={3} style={{ color: theme.text, fontSize: 16, lineHeight: 21, fontWeight: "600", marginBottom: 5 }}>{item.title}</Text><NewsMeta item={item}/></View>
      {!!item.image && <Image source={{ uri: newsImage(item.image) }} style={{ width: 86, height: 76, borderRadius: 8 }}/>}
    </PressableFeedback>
    <NewsActions item={item}/>
  </Card>;
}
