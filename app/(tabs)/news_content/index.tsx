import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AlertCard } from "../../../components/news/AlertCard";
import { CategoryPills } from "../../../components/news/CategoryPills";
import { FeaturedCard } from "../../../components/news/FeaturedCard";
import { NewsList } from "../../../components/news/NewsList";
import { SearchBar } from "../../../components/news/SearchBar";
import { getTheme } from "../../../constants/theme";
import { useColorScheme } from "../../../hooks/use-color-scheme";
import { useNews } from "../../../hooks/useNews";

// ── ALERT message — change or fetch from API if needed ──────────────────────
const ALERT_MESSAGE = "Anda mempunyai 3 pemberitahuan baru";

export default function BeritaIndex() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  const {
    featuredNews,       // ← now dynamic from API (latest post)
    filteredNews,
    categories,
    activeCategory,
    setActiveCategory,
    search,
    setSearch,
    loading,
    error,
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

      <SearchBar
        search={search}
        onSearchChange={setSearch}
        onFilterChange={(filter) => console.log("filter by:", filter)}
        theme={theme}
      />

      <CategoryPills
        categories={categories}
        activeCategory={activeCategory}
        onCategoryPress={setActiveCategory}
        theme={theme}
      />

      {/* Loading */}
      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      )}

      {/* Error */}
      {error && !loading && (
        <View style={styles.center}>
          <Text style={{ color: "red" }}>{error}</Text>
        </View>
      )}

      {/* Content */}
      {!loading && !error && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <AlertCard message={ALERT_MESSAGE} theme={theme} />

          {/* FeaturedCard now gets data from API — only render when ready */}
          {featuredNews && (
            <FeaturedCard
              id={featuredNews.id}
              title={featuredNews.title}
              category={featuredNews.category}
              likes={featuredNews.likes}
              comments={featuredNews.comments}
              image={featuredNews.image}
            />
          )}

          {/* The rest of the news list (excluding featured) */}
          <NewsList news={filteredNews} theme={theme} />
        </ScrollView>
      )}
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
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});