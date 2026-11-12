import { useAppTheme } from "@/hooks/useAppTheme";
import { SearchField } from "heroui-native/search-field";
import { Button } from "heroui-native/button";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useDeferredValue, useMemo, useState } from "react";
import { ActivityIndicator, AppState, FlatList, RefreshControl, StatusBar, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Design } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useNewsFeed } from "@/hooks/useNewsFeed";
import type { NewsItem } from "@/hooks/useNews";
import { filterNews, type NewsDateFilter } from "@/utils/newsFilters";
import { CompactNewsCard } from "./CompactNewsCard";
import { NewsFilterChips } from "./NewsFilterChips";
import { NewsFilterSheet } from "./NewsFilterSheet";

export function NewsResultsScreen({ mode }: { mode: "latest" | "search" }) {
  const params = useLocalSearchParams<{ q?: string; query?: string; category?: string; date?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const theme = useAppTheme();
  const feed = useNewsFeed();
  const [query, setQuery] = useState(params.q || params.query || "");
  const [category, setCategory] = useState(params.category || "Semua");
  const [date, setDate] = useState<NewsDateFilter>(() => ["today", "week", "month"].includes(params.date || "") ? params.date as NewsDateFilter : "all");
  const [showFilters, setShowFilters] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const deferredQuery = useDeferredValue(query);
  const isSearch = mode === "search";

  useFocusEffect(useCallback(() => {
    const updateClock = () => setNow(Date.now());
    updateClock();
    const timer = setInterval(updateClock, 60_000);
    const subscription = AppState.addEventListener("change", state => {
      if (state === "active") updateClock();
    });
    return () => { clearInterval(timer); subscription.remove(); };
  }, []));

  const results = useMemo(() => filterNews(feed.items, { query: deferredQuery, category, date }, new Date(now)), [feed.items, deferredQuery, category, date, now]);
  const updateQuery = (value: string) => { setQuery(value); router.setParams({ q: value }); };
  const updateDate = (value: NewsDateFilter) => { setDate(value); router.setParams({ date: value }); };
  const updateCategory = (value: string) => { setCategory(value); router.setParams({ category: value }); };
  const clear = () => {
    setQuery(""); setDate("all"); setCategory("Semua");
    router.setParams({ q: "", query: "", date: "all", category: "Semua" });
  };
  const back = () => router.canGoBack() ? router.back() : router.replace("/(tabs)/news_content");
  const renderItem = useCallback(({ item }: { item: NewsItem }) => <CompactNewsCard item={item} theme={theme} now={now} showCounts={!isSearch}/>, [theme, now, isSearch]);
  const retry = <Button variant="ghost" className="h-auto min-h-0 min-w-0 rounded-none p-0" accessibilityRole="button" onPress={feed.refresh} style={styles.retry}><Text style={{ color: theme.primary, fontWeight: "600" }}>Cuba lagi</Text></Button>;

  return <View style={[styles.page, { paddingTop: insets.top, backgroundColor: theme.background }]}>
    <StatusBar barStyle={scheme === "dark" ? "light-content" : "dark-content"}/>
    <View style={styles.body}>
      <View style={styles.header}>
        {isSearch ? <Button variant="ghost" className="h-auto min-h-0 min-w-0 rounded-none p-0" accessibilityRole="button" accessibilityLabel="Kembali ke berita" onPress={back} style={styles.back}>
          <Ionicons name="chevron-back" size={21} color={theme.text}/>
          <Text accessibilityRole="header" style={[styles.heading, { color: theme.text }]}>Carian</Text>
        </Button> : <>
          <Text accessibilityRole="header" style={[styles.heading, { color: theme.text, flex: 1 }]}>Terkini</Text>
          <Button variant="ghost" className="h-auto min-h-0 min-w-0 rounded-none p-0" accessibilityRole="button" accessibilityLabel="Cari berita" onPress={() => router.push({ pathname: "/(tabs)/news_content/search", params: { q: query, category, date } })} style={styles.icon}>
            <Ionicons name="search-outline" size={22} color={theme.text}/>
          </Button>
          <Button variant="ghost" className="h-auto min-h-0 min-w-0 rounded-none p-0" accessibilityRole="button" accessibilityLabel="Tapis berita" onPress={() => setShowFilters(true)} style={styles.icon}>
            <Ionicons name="calendar-outline" size={22} color={date === "all" && category === "Semua" ? theme.text : theme.primary}/>
          </Button>
        </>}
      </View>
      {isSearch && <SearchField value={query} onChange={updateQuery} style={{ marginHorizontal: 20, marginBottom: 2 }}>
        <SearchField.Group>
          <SearchField.SearchIcon iconProps={{ size: 18, color: theme.primary }}/>
          <SearchField.Input accessibilityLabel="Cari berita mengikut kata kunci" placeholder="Cari berita" autoCorrect={false}
            className="h-11 rounded-xl border-0 text-sm shadow-none"/>
          <SearchField.ClearButton accessibilityLabel="Padam kata kunci" iconProps={{ size: 18, color: theme.secondary }}/>
        </SearchField.Group>
      </SearchField>}
      <NewsFilterChips theme={theme} date={date} category={category} onDateChange={updateDate}
        showCategory={isSearch} onCategoryPress={() => setShowFilters(true)} onRemoveCategory={() => updateCategory("Semua")}/>
      {isSearch && <View style={styles.resultHeading}>
        <Text accessibilityLiveRegion="polite" style={{ color: theme.text, fontSize: 12, fontWeight: "600" }}>{feed.loading ? "Mencari..." : `${results.length} hasil`}</Text>
        <Button variant="ghost" className="h-auto min-h-0 min-w-0 rounded-none p-0" accessibilityRole="button" accessibilityLabel="Kosongkan carian dan penapis" onPress={clear} style={styles.clear}><Text style={{ color: theme.primary, fontSize: 12, fontWeight: "600" }}>Kosongkan</Text></Button>
      </View>}
      {!!feed.error && feed.items.length > 0 && <View style={[styles.errorBanner, { backgroundColor: theme.warning }]}><Text accessibilityRole="alert" style={{ color: theme.error, flex: 1 }}>{feed.error}</Text>{retry}</View>}
      <FlatList data={feed.loading ? [] : results} keyExtractor={item => String(item.id)} renderItem={renderItem}
        keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.list, { paddingBottom: isSearch ? Math.max(24, insets.bottom + 16) : 24 }]}
        initialNumToRender={10} maxToRenderPerBatch={10} windowSize={7}
        refreshControl={<RefreshControl refreshing={feed.refreshing} onRefresh={feed.refresh} tintColor={theme.primary} colors={[theme.primary]}/>}
        ListEmptyComponent={<View style={styles.empty}>
          {feed.loading ? <><ActivityIndicator color={theme.primary}/><Text style={{ color: theme.secondary }}>Memuatkan berita...</Text></>
            : feed.error ? <><Ionicons name="cloud-offline-outline" size={30} color={theme.secondary}/><Text accessibilityRole="alert" style={[styles.emptyText, { color: theme.error }]}>{feed.error}</Text>{retry}</>
            : <><Ionicons name="newspaper-outline" size={32} color={theme.secondary}/><Text style={[styles.emptyText, { color: theme.text, fontWeight: "600" }]}>Tiada berita ditemui</Text><Text style={[styles.emptyText, { color: theme.secondary }]}>Cuba kata kunci atau penapis lain.</Text>{(query || date !== "all" || category !== "Semua") && <Button variant="ghost" className="h-auto min-h-0 min-w-0 rounded-none p-0" accessibilityRole="button" onPress={clear} style={styles.retry}><Text style={{ color: theme.primary }}>Kosongkan penapis</Text></Button>}</>}
        </View>}/>
    </View>
    <NewsFilterSheet visible={showFilters} onClose={() => setShowFilters(false)} theme={theme} categories={feed.categories}
      category={category} date={date} onCategory={updateCategory} onDate={updateDate}/>
  </View>;
}
const styles = StyleSheet.create({
  page: { flex: 1 }, body: { flex: 1, width: "100%", maxWidth: Design.contentWidth, alignSelf: "center" },
  header: { paddingHorizontal: 20, paddingTop: 10, minHeight: 62, flexDirection: "row", alignItems: "center" },
  heading: { fontSize: 27, fontWeight: "800", letterSpacing: -0.5 },
  back: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 44 }, icon: { width: 44, height: 44, justifyContent: "center", alignItems: "center" },
  search: { marginHorizontal: 20, flexDirection: "row", alignItems: "center", borderRadius: 12, paddingLeft: 12, marginBottom: 2 },
  input: { flex: 1, minWidth: 0, minHeight: 44, paddingHorizontal: 8, paddingVertical: 10, fontSize: 14 }, clearInput: { minWidth: 38, minHeight: 44, justifyContent: "center", alignItems: "center" },
  resultHeading: { paddingHorizontal: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6 },
  clear: { minHeight: 44, justifyContent: "center" }, list: { paddingHorizontal: 20, flexGrow: 1 },
  empty: { flex: 1, minHeight: 220, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 }, emptyText: { textAlign: "center", fontSize: 14, lineHeight: 21 },
  retry: { minHeight: 44, paddingHorizontal: 12, justifyContent: "center" }, errorBanner: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, marginHorizontal: 20, borderRadius: 10 },
});
