import React, { useState, useEffect } from "react";
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
import { BASE_URL, useNews } from "../../../hooks/useNews";

const BULAN: Record<string, number> = {
  // English
  January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
  July: 6, August: 7, September: 8, October: 9, November: 10, December: 11,
  // Malay (only ones that differ from English)
  Januari: 0, Februari: 1, Mac: 2, Mei: 4, Jun: 5,
  Julai: 6, Ogos: 7, Oktober: 9, Disember: 11,
  // Indonesian (only ones that differ)
  Maret: 2, Juni: 5, Juli: 6, Agustus: 7,
};

function parseDate(dateStr: string): Date | null {
  const parts = dateStr.trim().split(" ");
  if (parts.length !== 3) return null;
  const day   = parseInt(parts[0], 10);
  const month = BULAN[parts[1]];
  const year  = parseInt(parts[2], 10);
  if (isNaN(day) || month === undefined || isNaN(year)) return null;
  return new Date(year, month, day);
}

function matchesFilter(
  dateStr: string,
  dateFilter: "all" | "today" | "week" | "month"
): boolean {
  if (dateFilter === "all") return true;
  const d = parseDate(dateStr ?? "");
  if (!d) return true;
  const now = new Date();
  if (dateFilter === "today") return d.toDateString() === now.toDateString();
  if (dateFilter === "week") {
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    return d >= weekAgo;
  }
  if (dateFilter === "month") {
    return d.getMonth() === now.getMonth() &&
           d.getFullYear() === now.getFullYear();
  }
  return true;
}

export default function BeritaIndex() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");

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

  const dateFilteredNews = filteredNews.filter((item) =>
    matchesFilter(item.date, dateFilter)
  );

  const showFeatured = featuredNews
    ? matchesFilter(featuredNews.date ?? "", dateFilter)
    : false;

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.accent }]}>
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        backgroundColor={theme.card}
      />

      <SearchBar
        search={search}
        onSearchChange={setSearch}
        onFilterChange={(filter) => setDateFilter(filter)}
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

          {showFeatured && featuredNews && (
            <FeaturedCard
              id={featuredNews.id}
              title={featuredNews.title}
              category={featuredNews.category}
              likes={featuredNews.likes}
              comments={featuredNews.comments}
              image={featuredNews.image}
            />
          )}

          <NewsList news={dateFilteredNews} theme={theme} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, gap: 14, paddingBottom: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});