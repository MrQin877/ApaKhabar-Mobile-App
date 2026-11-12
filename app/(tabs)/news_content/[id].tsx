import { useAppTheme } from "@/hooks/useAppTheme";
import { Button } from "heroui-native/button";
import type { ScrollViewInstance } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, ScrollView, Share, StatusBar, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArticleBody, plainArticle } from "@/components/news/ArticleBody";
import { newsImage } from "@/components/news/FeaturedCard";
import { NewsCard } from "@/components/news/NewsCard";
import { Design } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { NewsItem } from "@/hooks/useNews";
import { BACKEND_BASE_URL } from "@/services/apiConfig";
import { getNewsDetail, getNewsList, likeNews } from "@/services/newsService";

import { CommentsSheet } from "@/components/news/CommentsSheet";
import { readNewsComments, type NewsCommentsSnapshot, type PublicNewsComment as Comment } from "@/utils/newsComments";

type Detail = Omit<NewsItem, "comments" | "author"> & {
  content?: string; caption?: string; author?: string | { name?: string; avatar?: string }; author_name?: string; author_avatar?: string;
  published_at?: string; created_at?: string; reading_time?: number; is_liked?: boolean; liked?: boolean; liked_by_user?: boolean; likes_count?: number;
  comments: number | Comment[]; comments_count?: number; comments_list?: Comment[];
};
const unwrap = <T,>(payload: T | { data: T }): T => (payload && typeof payload === "object" && "data" in payload ? payload.data : payload) as T;
const commentCount = (article: Detail) => article.comments_count ?? (Array.isArray(article.comments) ? article.comments.length : Number(article.comments) || 0);
const authorName = (author: Comment["author"]) => typeof author === "string" ? author : author?.name;
function latestPosts(items: (NewsItem & { published_at?: string; created_at?: string })[], id: string) {
  const seen = new Set<string>([String(id)]);
  return items.filter(item => { const key = String(item.id); if (seen.has(key)) return false; seen.add(key); return true; })
    .map((item, index) => ({ item, index, date: Date.parse(item.published_at || item.created_at || item.date) }))
    .sort((a, b) => Number.isFinite(a.date) && Number.isFinite(b.date) ? b.date - a.date || a.index - b.index : a.index - b.index)
    .slice(0, 3).map(({ item }) => item);
}

export default function NewsDetailPage() {
  const { id, comments } = useLocalSearchParams<{ id: string; comments?: string }>();
  return <NewsArticle key={id} id={id} initialCommentsOpen={comments === "open"}/>;
}

function NewsArticle({ id, initialCommentsOpen }: { id: string; initialCommentsOpen: boolean }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const theme = useAppTheme();
  const scroll = useRef<ScrollViewInstance>(null);
  const [news, setNews] = useState<Detail | null>(null);
  const [related, setRelated] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [relatedError, setRelatedError] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [liking, setLiking] = useState(false);
  const [showComments, setShowComments] = useState(initialCommentsOpen);
  const closeComments = useCallback(() => setShowComments(false), []);
  const updateComments = useCallback((snapshot: NewsCommentsSnapshot) => {
    setNews(previous => previous ? { ...previous, comments: snapshot.total, comments_count: snapshot.total, comments_list: snapshot.comments } : previous);
  }, []);

  useEffect(() => {
    let active = true;
    scroll.current?.scrollTo({ y: 0, animated: false });
    getNewsDetail(id).then(payload => {
      if (active) { setNews(unwrap<Detail>(payload)); setError(""); setLoading(false); setActionError(""); }
    }).catch(() => { if (active) { setError("Berita tidak dapat dimuatkan."); setLoading(false); } });
    getNewsList().then(payload => {
      const list = unwrap<NewsItem[]>(payload);
      if (active) { setRelated(latestPosts(Array.isArray(list) ? list : [], id)); setRelatedError(false); }
    }).catch(() => { if (active) { setRelated([]); setRelatedError(true); } });
    AsyncStorage.getItem(`news-bookmark:${id}`).then(value => { if (active) setSaved(value === "true"); }).catch(() => { if (active) setSaved(false); });
    return () => { active = false; };
  }, [id]);

  const ready = news && String(news.id) === String(id);
  const back = () => router.canGoBack() ? router.back() : router.replace("/(tabs)/news_content");
  const share = async () => {
    if (!ready) return;
    try { await Share.share({ message: `${news.title}\n${BACKEND_BASE_URL}/news/${id}` }); }
    catch { setActionError("Berita tidak dapat dikongsi. Cuba lagi."); }
  };
  const bookmark = async () => {
    if (saving) return;
    setSaving(true);
    try { await AsyncStorage.setItem(`news-bookmark:${id}`, String(!saved)); setSaved(!saved); }
    catch { setActionError("Berita tidak dapat disimpan. Cuba lagi."); }
    finally { setSaving(false); }
  };
  const like = async () => {
    if (liking || !ready) return;
    setLiking(true); setActionError("");
    try {
      const result = await likeNews(id);
      // The POST response is authoritative for this user's action and the new count.
      setNews(previous => previous ? { ...previous,
        likes: result.likes_count ?? previous.likes,
        liked: result.liked, is_liked: result.liked, liked_by_user: result.liked,
      } : previous);
    } catch { setActionError("Suka tidak dapat dikemas kini. Cuba lagi."); }
    finally { setLiking(false); }
  };
  const body = news?.body || news?.content || "";
  const author = authorName(news?.author) || news?.author_name;
  const avatar = (typeof news?.author === "object" ? news.author.avatar : undefined) || news?.author_avatar;
  const iconButton = (name: React.ComponentProps<typeof Ionicons>["name"], label: string, onPress: () => void, disabled = false, active = false) => <Button variant="ghost" className="h-auto min-h-0 min-w-0 rounded-none p-0" accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled, selected: active }} isDisabled={disabled} onPress={onPress} style={styles.iconButton}><Ionicons name={name} size={22} color={active ? theme.primary : theme.text}/></Button>;

  return <View style={[styles.page, { backgroundColor: theme.background, paddingTop: insets.top }]}>
    <StatusBar barStyle={scheme === "dark" ? "light-content" : "dark-content"}/>
    <View style={[styles.header, { borderBottomColor: theme.border }]}>
      <Button variant="ghost" className="h-auto min-h-0 min-w-0 rounded-none p-0" accessibilityRole="button" accessibilityLabel="Kembali ke Berita" onPress={back} style={styles.back}><Ionicons name="chevron-back" size={21} color={theme.text}/><Text style={{ color: theme.text, fontSize: 14 }}>Berita</Text></Button>
      <View style={styles.row}>{iconButton(saved ? "bookmark" : "bookmark-outline", saved ? "Buang simpanan" : "Simpan berita", bookmark, !ready || saving, saved)}{iconButton("share-outline", "Kongsi berita", share, !ready)}</View>
    </View>
    {!ready ? <View style={styles.center}>{loading && !error ? <ActivityIndicator color={theme.primary}/> : <Text style={{ color: theme.error }}>{error || "Berita tidak ditemukan."}</Text>}</View> :
      <ScrollView ref={scroll} showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: Math.max(24, insets.bottom + 16) }]}>
        <Text style={[styles.category, { color: theme.primary }]}>{news.category?.toLocaleUpperCase("ms-MY")}</Text>
        <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>{news.title}</Text>
        <View style={[styles.row, { gap: 10, marginVertical: 16 }]}>
          {avatar ? <Image source={{ uri: newsImage(avatar) }} style={styles.avatar}/> : <View style={[styles.avatar, { backgroundColor: theme.accent, alignItems: "center", justifyContent: "center" }]}><Text style={{ color: theme.text, fontWeight: "700", fontSize: 11 }}>{author ? author.split(/\s+/).slice(0, 2).map(word => word[0]).join("") : ""}</Text></View>}
          <View style={{ flex: 1 }}>{!!author && <Text style={{ color: theme.text, fontWeight: "600", fontSize: 13 }}>{author}</Text>}<Text style={{ color: theme.secondary, fontSize: 11, lineHeight: 17 }}>{[news.date || news.published_at, news.time, `${news.reading_time || Math.max(1, Math.ceil(plainArticle(body).trim().split(/\s+/).length / 200))} min bacaan`].filter(Boolean).join(" \u00b7 ")}</Text></View>
        </View>
        {!!news.image && <Image source={{ uri: newsImage(news.image) }} style={styles.cover} resizeMode="cover"/>}
        {!!news.caption && <Text style={{ color: theme.secondary, fontSize: 11, lineHeight: 16, marginTop: 8 }}>{news.caption}</Text>}
        <View style={{ marginTop: 20 }}><ArticleBody content={body} theme={theme}/></View>
        <View style={[styles.engagement, { borderColor: theme.border }]}>
          <Button variant="ghost" className="h-auto min-h-0 min-w-0 rounded-none p-0" accessibilityRole="button" accessibilityLabel="Suka berita" accessibilityState={{ disabled: liking, selected: news.is_liked || news.liked || news.liked_by_user }} isDisabled={liking} onPress={like} style={styles.action}><Ionicons name={news.is_liked || news.liked || news.liked_by_user ? "heart" : "heart-outline"} size={19} color={news.is_liked || news.liked || news.liked_by_user ? theme.primary : theme.secondary}/><Text style={{ color: theme.text, fontSize: 12 }}>Suka {news.likes}</Text></Button>
          <Button variant="ghost" className="h-auto min-h-0 min-w-0 rounded-none p-0" accessibilityRole="button" accessibilityLabel="Buka komen" onPress={() => setShowComments(true)} style={styles.action}><Ionicons name="chatbubble-outline" size={18} color={theme.secondary}/><Text style={{ color: theme.text, fontSize: 12 }}>{commentCount(news)} komen</Text></Button>
          <Button variant="ghost" className="h-auto min-h-0 min-w-0 rounded-none p-0" accessibilityRole="button" accessibilityLabel="Kongsi berita" onPress={share} style={styles.action}><Ionicons name="share-outline" size={19} color={theme.secondary}/><Text style={{ color: theme.text, fontSize: 12 }}>Kongsi</Text></Button>
        </View>
        {!!actionError && <Text accessibilityRole="alert" style={{ color: theme.error, marginTop: 10 }}>{actionError}</Text>}
        <View style={{ marginTop: 32, gap: 14 }}><Text accessibilityRole="header" style={{ color: theme.text, fontWeight: "700", fontSize: 14 }}>Berita Lain</Text>{related.map(item => <NewsCard key={item.id} {...item} theme={theme}/>)}{relatedError && <Text style={{ color: theme.secondary }}>Berita lain tidak dapat dimuatkan.</Text>}{!relatedError && related.length === 0 && <Text style={{ color: theme.secondary }}>Tiada berita lain buat masa ini.</Text>}</View>
      </ScrollView>}
    {ready && <CommentsSheet newsId={id} visible={showComments} initialSnapshot={readNewsComments(news)} theme={theme} onClose={closeComments} onChange={updateComments}/>}

  </View>;
}
const styles = StyleSheet.create({
  page: { flex: 1 }, row: { flexDirection: "row", alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, minHeight: 58, borderBottomWidth: 1 },
  back: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 44, paddingRight: 16 }, iconButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  content: { width: "100%", maxWidth: Design.contentWidth, alignSelf: "center", paddingHorizontal: 20, paddingTop: 18 },
  category: { fontSize: 11, fontWeight: "700", letterSpacing: 0.6, marginBottom: 12 },
  title: { fontSize: 29, lineHeight: 33, fontWeight: "800", letterSpacing: -0.5 },
  avatar: { width: 34, height: 34, borderRadius: 9 }, cover: { width: "100%", aspectRatio: 1.85, borderRadius: Design.radius.image },
  engagement: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, marginTop: 20, paddingTop: 8, flexWrap: "wrap" },
  action: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44, paddingHorizontal: 4 },
});
