import React from "react";
import { StyleSheet, View } from "react-native";
import { Theme } from "../../constants/theme";
import { NewsCard } from "./NewsCard";

interface NewsItem {
  id: string;
  title: string;
  category: string;
  image: string;
  date: string;
}

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
          id={item.id}
          title={item.title}
          category={item.category}
          image={item.image}
          date={item.date}
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
