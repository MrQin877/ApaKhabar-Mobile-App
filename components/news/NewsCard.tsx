import { router } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Theme } from "../../constants/theme";
import { useColorScheme } from "../../hooks/use-color-scheme";
import { getCatColors } from "../../utils/newsUtils";

interface NewsCardProps {
  id: string;
  title: string;
  category: string;
  image: string;
  date: string;
  theme: Theme;
}

export function NewsCard({
  id,
  title,
  category,
  image,
  date,
  theme,
}: NewsCardProps) {
  const colorScheme = useColorScheme();
  const catColors = getCatColors(category, colorScheme);

  return (
    <TouchableOpacity
      style={[styles.newsCard, { backgroundColor: theme.card }]}
      activeOpacity={0.88}
      onPress={() => router.push(`/(tabs)/news_content/${id}` as any)}
    >
      <Image source={{ uri: image }} style={styles.newsImage} />
      <View style={styles.newsInfo}>
        <Text
          style={[styles.newsTitle, { color: theme.text }]}
          numberOfLines={2}
        >
          {title}
        </Text>
        <View style={styles.newsFooter}>
          <View
            style={[
              styles.newsCatTag,
              { backgroundColor: catColors.background },
            ]}
          >
            <Text style={[styles.newsCatText, { color: catColors.text }]}>
              {category}
            </Text>
          </View>
          <Text style={[styles.newsDate, { color: theme.secondary }]}>
            {date}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  newsCard: {
    flexDirection: "row",
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#0A3D2A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  newsImage: {
    width: 100,
    height: 100,
  },
  newsInfo: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  newsTitle: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 18,
    marginBottom: 8,
  },
  newsFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  newsCatTag: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  newsCatText: {
    fontSize: 11,
    fontWeight: "500",
  },
  newsDate: {
    fontSize: 11,
    fontWeight: "500",
  },
});
