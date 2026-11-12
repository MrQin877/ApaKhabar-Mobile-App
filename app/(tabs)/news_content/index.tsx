import { useAppTheme } from "@/hooks/useAppTheme";
import api from "@/services/api";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AlertCard, type BroadcastAnnouncement } from "../../../components/news/AlertCard";
import { CategoryPills } from "../../../components/news/CategoryPills";
import { FeaturedCard } from "../../../components/news/FeaturedCard";
import { NewsList } from "../../../components/news/NewsList";
import { SearchBar } from "../../../components/news/SearchBar";
import { Design } from "../../../constants/theme";
import { useColorScheme } from "../../../hooks/use-color-scheme";
import { useNews } from "../../../hooks/useNews";
import { readLatestBroadcast } from "@/utils/broadcasts";
import { matchesNewsDate } from "@/utils/newsFilters";
import type { NewsDateFilter } from "@/utils/newsFilters";
import { NewsFilterSheet } from "@/components/news/NewsFilterSheet";

const STALE_TIME = 5 * 60 * 1000;

export default function BeritaIndex() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = useAppTheme();

  const [broadcast, setBroadcast] = useState<BroadcastAnnouncement | null>(null);
  const [dateFilter, setDateFilter] = useState<NewsDateFilter>("all");
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [draftDate, setDraftDate] = useState<NewsDateFilter>("all");
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
      .get("/broadcasts/darurat", { timeout: 15000 })
      .then((r) => {
        setBroadcast(readLatestBroadcast(r.data));
      })
      .catch(() => setBroadcast(null));
  }, []);

  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (now - lastFetchRef.current > STALE_TIME) {
        fetchAlert();
        lastFetchRef.current = now;
      }
    }, [fetchAlert]),
  );

  const handleRefresh = useCallback(() => {
    refreshNews();
    fetchAlert();
    lastFetchRef.current = Date.now();
  }, [refreshNews, fetchAlert]);

  const dateFilteredList = listNews.filter((item) =>
    matchesNewsDate(item, dateFilter),
  );

  const showFeatured =
    !!featuredNews && matchesNewsDate(featuredNews, dateFilter);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[
        styles.container,
        { paddingTop: insets.top, backgroundColor: theme.background },
      ]}
    >
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
      />

      <SearchBar
        search={search}
        onSearchChange={setSearch}
        onFilterChange={setDateFilter}
        dateFilter={dateFilter}
        theme={theme}
        onSearchPress={() => router.push({ pathname: "/(tabs)/news_content/search", params: { q: search, category: activeCategory, date: dateFilter } })}
        onCalendarPress={() => { setDraftDate(dateFilter); setShowDateFilter(true); }}
      />

      <CategoryPills
        categories={categories}
        activeCategory={activeCategory}
        onCategoryPress={setActiveCategory}
        dateFilter={dateFilter}
        onClearDate={() => setDateFilter("all")}
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
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
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
          {broadcast && <AlertCard broadcast={broadcast} theme={theme} />}

          {showFeatured && (
            <FeaturedCard
              {...featuredNews!}
            />
          )}

          <View style={styles.latestHeader}>
            <Text accessibilityRole="header" style={{ color: theme.text, fontSize: 17, fontWeight: "700" }}>Terkini</Text>
            <Text accessibilityRole="link" onPress={() => router.push({ pathname: "/(tabs)/news_content/latest", params: { category: activeCategory, date: dateFilter } })} style={{ color: theme.primary, fontSize: 12, paddingVertical: 12 }}>Lihat semua</Text>
          </View>
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
      <NewsFilterSheet visible={showDateFilter} onClose={() => setShowDateFilter(false)}
        theme={theme} categories={categories} category={activeCategory} onCategory={setActiveCategory}
        dateOnly date={draftDate} onDate={setDraftDate}
        onApply={() => { setDateFilter(draftDate); setShowDateFilter(false); }}/>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  latestHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20, gap: 12, paddingBottom: 24, width: "100%", maxWidth: Design.contentWidth, alignSelf: "center", flexGrow: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { paddingVertical: 40, alignItems: "center" },
  emptyText: { fontSize: 13 },
});
