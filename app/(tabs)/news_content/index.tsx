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

export default function BeritaIndex() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  const [alertMessage, setAlertMessage] = useState<string | null>(null);
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

          {/* Featured only on "Semua" view */}
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

          {listNews.length > 0 ? (
            <NewsList news={listNews} theme={theme} />
          ) : (
            !featuredNews && (
              <View style={styles.empty}>
                <Text style={[styles.emptyText, { color: theme.secondary }]}>
                  Tiada berita untuk kategori ini
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
