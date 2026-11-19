import { useNewsLike } from "@/hooks/useNewsLike";
import { publicationDateTime } from "@/utils/newsPublication";
import { useAppTheme } from "@/hooks/useAppTheme";
import { Button } from "heroui-native/button";
import type { ScrollViewInstance } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Image, ScrollView, Share, StatusBar, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArticleBody } from "@/components/news/ArticleBody";
import { newsImage } from "@/components/news/FeaturedCard";
import { NewsCard } from "@/components/news/NewsCard";
import { Design } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { NewsItem } from "@/hooks/useNews";
import { BACKEND_BASE_URL } from "@/services/apiConfig";
import { getNewsDetail, getNewsList } from "@/services/newsService";

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
  const likeState = useNewsLike(news ?? { id, likes: 0 });
  const [showComments, setShowComments] = useState(initialCommentsOpen);
  useFocusEffect(useCallback(() => { if (initialCommentsOpen) setShowComments(true); }, [initialCommentsOpen]));
  const closeComments = useCallback(() => setShowComments(false), []);
  const updateComments = useCallback((snapshot: NewsCommentsSnapshot) => {
    setNews(previous => previous ? { ...previous, comments: snapshot.total, comments_count: snapshot.total, comments_list: snapshot.comments } : previous);
  }, []);

  useFocusEffect(useCallback(() => {
    let active = true;
    scroll.current?.scrollTo({ y: 0, animated: false });
    getNewsDetail(id).then(payload => {
      if (active) { setNews(unwrap<Detail>(payload)); setError(""); setLoading(false); setActionError(""); }
    }).catch(() => { if (active) { setError("Berita tidak dapat dimuatkan."); setLoading(false); } });
    getNewsList().then(payload => {
      const list = unwrap<NewsItem[]>(payload);
      if (active) { setRelated(latestPosts(Array.isArray(list) ? list : [], id)); setRelatedError(false); }
    }).catch(() => { if (active) { setRelated([]); setRelatedError(true); } });
    return () => { active = false; };
  }, [id]));

  const ready = news && String(news.id) === String(id);
  const back = () => router.dismissTo("/(tabs)/news_content");
  const share = async () => {
    if (!ready) return;
    try { await Share.share({ message: `${news.title}\n${BACKEND_BASE_URL}/news/${id}` }); }
    catch { setActionError("Berita tidak dapat dikongsi. Cuba lagi."); }
  };
  const like = async () => {
    if (!ready) return;
    setActionError("");
    try {
      const result = await likeState.toggle();
      if (result === null) router.push({ pathname: "/(auth)/login", params: { returnTo: `/(tabs)/news_content/${id}` } });
    }
    catch { setActionError("Suka tidak dapat dikemas kini. Cuba lagi."); }
  };
  const body = news?.body || news?.content || "";
  const author = authorName(news?.author) || news?.author_name;


  return <View style={[styles.page, { backgroundColor: theme.background, paddingTop: insets.top }]}>
    <StatusBar barStyle={scheme === "dark" ? "light-content" : "dark-content"}/>
    <View style={[styles.header, { borderBottomColor: theme.border }]}>
      <Button variant="ghost" className="h-auto min-h-0 min-w-0 rounded-none p-0" accessibilityRole="button" accessibilityLabel="Kembali ke Berita" onPress={back} style={styles.back}><Ionicons name="chevron-back" size={21} color={theme.text}/><Text style={{ color: theme.text, fontSize: 14 }}>Kembali ke Berita</Text></Button>
    </View>
    {!ready ? <View style={styles.center}>{loading && !error ? <ActivityIndicator color={theme.primary}/> : <Text style={{ color: theme.error }}>{error || "Berita tidak ditemukan."}</Text>}</View> :
      <ScrollView ref={scroll} showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: Math.max(24, insets.bottom + 16) }]}>
        <Text style={[styles.category, { color: theme.primary }]}>{news.category?.toLocaleUpperCase("ms-MY")}</Text>
        <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>{news.title}</Text>
        <View style={styles.publication}>
          {!!author && <Text style={{ color: theme.text, fontWeight: "600", fontSize: 13 }}>{author}</Text>}
          <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={{ color: theme.secondary, fontSize: 13, lineHeight: 20 }}>{publicationDateTime(news)}</Text>
        </View>
        {!!news.image && <Image source={{ uri: newsImage(news.image) }} style={styles.cover} resizeMode="cover"/>}
        {!!news.caption && <Text style={{ color: theme.secondary, fontSize: 11, lineHeight: 16, marginTop: 8 }}>{news.caption}</Text>}
        <View style={{ marginTop: 20 }}><ArticleBody content={body} theme={theme}/></View>
        <View style={[styles.engagement, { borderColor: theme.border }]}>
          <Button variant="ghost" className="h-auto min-h-0 min-w-0 rounded-none p-0" accessibilityRole="button" accessibilityLabel="Suka berita" accessibilityState={{ busy: likeState.pending, selected: likeState.liked }} hitSlop={8} onPress={like} style={styles.action}><Ionicons name={likeState.liked ? "heart" : "heart-outline"} size={19} color={likeState.liked ? theme.primary : theme.secondary}/><Text style={{ color: theme.text, fontSize: 12 }}>Suka {likeState.count}</Text></Button>
          <Button variant="ghost" className="h-auto min-h-0 min-w-0 rounded-none p-0" accessibilityRole="button" accessibilityLabel="Buka komen" onPress={() => setShowComments(true)} style={styles.action}><Ionicons name="chatbubble-outline" size={18} color={theme.secondary}/><Text style={{ color: theme.text, fontSize: 12 }}>{commentCount(news)} komen</Text></Button>
          <Button variant="ghost" className="h-auto min-h-0 min-w-0 rounded-none p-0" accessibilityRole="button" accessibilityLabel="Kongsi berita" onPress={share} style={styles.action}><Ionicons name="share-outline" size={19} color={theme.secondary}/><Text style={{ color: theme.text, fontSize: 12 }}>Kongsi</Text></Button>
        </View>
        {!!actionError && <Text accessibilityRole="alert" style={{ color: theme.error, marginTop: 10 }}>{actionError}</Text>}
        <View style={{ marginTop: 32, gap: 14 }}><Text accessibilityRole="header" style={{ color: theme.text, fontWeight: "700", fontSize: 14 }}>Berita Lain</Text>{related.map(item => <NewsCard key={item.id} {...item} theme={theme} replaceRoute/>)}{relatedError && <Text style={{ color: theme.secondary }}>Berita lain tidak dapat dimuatkan.</Text>}{!relatedError && related.length === 0 && <Text style={{ color: theme.secondary }}>Tiada berita lain buat masa ini.</Text>}</View>
      </ScrollView>}
    {ready && <CommentsSheet newsId={id} visible={showComments} initialSnapshot={readNewsComments(news)} theme={theme} onClose={closeComments} onChange={updateComments}/>}

  </View>;
}
const styles = StyleSheet.create({
  page: { flex: 1 }, publication: { gap: 4, marginVertical: 16 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, minHeight: 58, borderBottomWidth: 1 },
  back: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 44, paddingRight: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  content: { width: "100%", maxWidth: Design.contentWidth, alignSelf: "center", paddingHorizontal: 20, paddingTop: 18 },
  category: { fontSize: 11, fontWeight: "700", letterSpacing: 0.6, marginBottom: 12 },
  title: { fontSize: 29, lineHeight: 33, fontWeight: "800", letterSpacing: -0.5 },
  cover: { width: "100%", aspectRatio: 1.85, borderRadius: Design.radius.image },
  engagement: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, marginTop: 20, paddingTop: 8, flexWrap: "wrap" },
  action: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44, paddingHorizontal: 4 },
});
