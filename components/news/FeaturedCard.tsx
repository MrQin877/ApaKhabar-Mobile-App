import { router } from "expo-router";
import React from "react";
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";
import { IconSymbol } from "../ui/icon-symbol";

interface FeaturedCardProps {
  id: string;
  title: string;
  category: string;
  likes: number;
  comments: number;
  image: string;
}

export function FeaturedCard({
  id,
  title,
  category,
  likes,
  comments,
  image,
}: FeaturedCardProps) {
  const { width } = useWindowDimensions();

  return (
    <TouchableOpacity
      style={[styles.featuredCard, { width: width - 32 }]}
      activeOpacity={0.92}
      onPress={() => router.push(`/(tabs)/news_content/${id}` as any)}
    >
      <Image source={{ uri: image }} style={styles.featuredImage} />
      <View style={styles.featuredOverlay} />
      <View style={styles.featuredBottom}>
        <Text style={styles.featuredTitle}>{title}</Text>
        <View style={styles.featuredMeta}>
          <View style={styles.featuredTag}>
            <Text style={styles.featuredTagText}>{category}</Text>
          </View>
          <View style={styles.featuredStats}>
            <View style={styles.statItem}>
              <IconSymbol name="heart" size={15} color="#fff" />
              <Text style={styles.statText}>{likes}</Text>
            </View>
            <View style={[styles.statItem, { marginLeft: 10 }]}>
              <IconSymbol name="bubble.left" size={15} color="#fff" />
              <Text style={styles.statText}>{comments}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  featuredCard: {
    borderRadius: 16,
    overflow: "hidden",
    height: 200,
    marginBottom: 14,
    alignSelf: "center",
  },
  featuredImage: { width: "100%", height: "100%" },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  featuredBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
  },
  featuredTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
  },
  featuredMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  featuredTag: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },
  featuredTagText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  featuredStats: { flexDirection: "row" },
  statItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  statText: { color: "#fff", fontSize: 12, fontWeight: "500" },
});
