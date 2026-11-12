import React from "react";
import { StyleSheet, View } from "react-native";
import { Theme } from "../../constants/theme";
import { NewsCard } from "./NewsCard";

import type { NewsItem } from "@/hooks/useNews";

interface NewsListProps {
  news: NewsItem[];
  theme: Theme;
}

export function NewsList({ news, theme }: NewsListProps) {
  return (
    <View style={styles.newsList}>
      {news.map((item) => (
        <NewsCard
          key={item.id}
          {...item}
          theme={theme}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  newsList: {
    gap: 12,
  },
});
