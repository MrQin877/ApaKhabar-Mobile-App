import React from "react";
import { ScrollView, StatusBar, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AlertCard } from "../../../components/news/AlertCard";
import { CategoryPills } from "../../../components/news/CategoryPills";
import { FeaturedCard } from "../../../components/news/FeaturedCard";
import { NewsList } from "../../../components/news/NewsList";
import { SearchBar } from "../../../components/news/SearchBar";
import { ALERT, FEATURED } from "../../../constants/newsData";
import { getTheme } from "../../../constants/theme";
import { useColorScheme } from "../../../hooks/use-color-scheme";
import { useNews } from "../../../hooks/useNews";

export default function BeritaIndex() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);
  const {
    activeCategory,
    setActiveCategory,
    search,
    setSearch,
    filteredNews,
    categories,
  } = useNews();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, backgroundColor: theme.accent },
      ]}
    >
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        backgroundColor={theme.card}
      />

      <SearchBar search={search} onSearchChange={setSearch} theme={theme} />

      <CategoryPills
        categories={categories}
        activeCategory={activeCategory}
        onCategoryPress={setActiveCategory}
        theme={theme}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <AlertCard message={ALERT.message} theme={theme} />

        <FeaturedCard
          id={FEATURED.id}
          title={FEATURED.title}
          category={FEATURED.category}
          likes={FEATURED.likes}
          comments={FEATURED.comments}
          image={FEATURED.image}
        />

        <NewsList news={filteredNews} theme={theme} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 20,
  },
});
