import api from "@/services/api";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
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

const STALE_TIME = 5 * 60 * 1000;

const BULAN: Record<string, number> = {
  January: 0,
  February: 1,
  March: 2,
  April: 3,
  May: 4,
  June: 5,
  July: 6,
  August: 7,
  September: 8,
  October: 9,
  November: 10,
  December: 11,
  Januari: 0,
  Februari: 1,
  Mac: 2,
  Mei: 4,
  Jun: 5,
  Julai: 6,
  Ogos: 7,
  Oktober: 9,
  Disember: 11,
};

function parseDate(dateStr: string): Date | null {
  const parts = dateStr.trim().split(" ");
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = BULAN[parts[1]];
  const year = parseInt(parts[2], 10);
  if (isNaN(day) || month === undefined || isNaN(year)) return null;
  return new Date(year, month, day);
}

function matchesDateFilter(
  dateStr: string,
  filter: "all" | "today" | "week" | "month",
): boolean {
  if (filter === "all") return true;
  const d = parseDate(dateStr ?? "");
  if (!d) return true;
  const now = new Date();
  if (filter === "today") return d.toDateString() === now.toDateString();
  if (filter === "week") {
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    return d >= weekAgo;
  }
  if (filter === "month") {
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  }
  return true;
}

export default function BeritaIndex() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<
    "all" | "today" | "week" | "month"
  >("all");
  const lastFetchRef = useRef<number>(0);

  const {
    featuredNews,
    listNews,
    categories,
    activeCategory,
    setActiveCategory,
    search,
    setSearch,
    loading,
    refreshing,
    error,
    handleRefresh: refreshNews,
  } = useNews();

  const fetchAlert = useCallback(() => {
    api
      .get("/broadcasts/darurat")
      .then((r) => setAlertMessage(r.data.message ?? null))
      .catch(() => setAlertMessage(null));
  }, []);

  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (now - lastFetchRef.current > STALE_TIME) {
        refreshNews();
        fetchAlert();
        lastFetchRef.current = now;
      }
    }, [refreshNews, fetchAlert]),
  );

  const handleRefresh = useCallback(() => {
    refreshNews();
    fetchAlert();
    lastFetchRef.current = Date.now();
  }, [refreshNews, fetchAlert]);

  const dateFilteredList = listNews.filter((item) =>
    matchesDateFilter(item.date, dateFilter),
  );

  const showFeatured =
    !!featuredNews && matchesDateFilter(featuredNews.date ?? "", dateFilter);

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
        onFilterChange={setDateFilter}
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
          <Text style={{ color: theme.error }}>{error}</Text>
        </View>
      )}

      {!loading && !error && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
        >
          {alertMessage && <AlertCard message={alertMessage} theme={theme} />}

          {showFeatured && (
            <FeaturedCard
              id={featuredNews!.id}
              title={featuredNews!.title}
              category={featuredNews!.category}
              likes={featuredNews!.likes}
              comments={featuredNews!.comments}
              image={featuredNews!.image}
            />
          )}

          {dateFilteredList.length > 0 ? (
            <NewsList news={dateFilteredList} theme={theme} />
          ) : (
            !showFeatured && (
              <View style={styles.empty}>
                <Text style={[styles.emptyText, { color: theme.secondary }]}>
                  Tiada berita untuk tarikh ini
                </Text>
              </View>
            )
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, gap: 14, paddingBottom: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { paddingVertical: 40, alignItems: "center" },
  emptyText: { fontSize: 13 },
});
