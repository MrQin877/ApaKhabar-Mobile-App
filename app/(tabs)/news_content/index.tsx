import React, { useState, useEffect } from "react";  // ← add useState, useEffect
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
import { BASE_URL, useNews } from "../../../hooks/useNews";  // ← one import, both names

export default function BeritaIndex() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  // ← moved INSIDE the component
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${BASE_URL}/api/broadcasts/darurat`)
      .then((r) => r.json())
      .then((json) => setAlertMessage(json.message ?? null))
      .catch(() => setAlertMessage(null));
  }, []);

  const {
    featuredNews,
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

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      )}

      {error && !loading && (
        <View style={styles.center}>
          <Text style={{ color: "red" }}>{error}</Text>
        </View>
      )}

      {!loading && !error && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {alertMessage && (
            <AlertCard message={alertMessage} theme={theme} />
          )}

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

          <NewsList news={filteredNews} theme={theme} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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