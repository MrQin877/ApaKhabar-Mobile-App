import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getTheme } from "../../../constants/theme";
import { useColorScheme } from "../../../hooks/use-color-scheme";
import { BASE_URL } from "../../../hooks/useNews";
import { IconSymbol } from "../../../components/ui/icon-symbol";

const { width } = Dimensions.get("window");

interface NewsDetail {
  id: string;
  title: string;
  category: string;
  body: string;
  content?: string;
  image: string;
  date: string;
  views: number;
  likes: number;
  comments: number;
}

interface RelatedItem {
  id: string;
  title: string;
  category: string;
  image: string;
}

function resolveImage(image: string): string {
  if (!image) return "https://placehold.co/800x400";
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  return `${BASE_URL}/storage/${image}`;
}

export default function NewsDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);

  const [news, setNews] = useState<NewsDetail | null>(null);
  const [related, setRelated] = useState<RelatedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    Promise.all([
      fetch(`${BASE_URL}/api/news/${id}`).then((r) => {
        if (!r.ok) throw new Error("Berita tidak ditemukan.");
        return r.json();
      }),
      fetch(`${BASE_URL}/api/news/${id}/related`)
        .then((r) => (r.ok ? r.json() : { data: [] }))
        .catch(() => ({ data: [] })),
    ])
      .then(([detailJson, relatedJson]) => {
        setNews(detailJson.data ?? detailJson);
        setRelated(relatedJson.data ?? []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (error || !news) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: "red", marginBottom: 12 }}>
          {error ?? "Berita tidak ditemukan."}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backTextBtn, { borderColor: theme.primary }]}
        >
          <Text style={{ color: theme.primary }}>← Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Always show full body — no truncation ✅
  const bodyText = news.body ?? news.content ?? "";

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Hero Image ── */}
        <View style={styles.heroWrap}>
          <Image
            source={{ uri: resolveImage(news.image) }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <TouchableOpacity
            style={[styles.backBtn, { top: insets.top + 10 }]}
            onPress={() => router.back()}
          >
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
        </View>

        {/* ── Content card ── */}
        <View style={[styles.contentCard, { backgroundColor: theme.card }]}>

          {/* Category badge */}
          <View style={[styles.categoryBadge, { backgroundColor: theme.primary }]}>
            <Text style={styles.categoryBadgeText}>{news.category}</Text>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: theme.text }]}>
            {news.title}
          </Text>

          {/* Date */}
          <Text style={[styles.date, { color: theme.secondary }]}>
            {news.date}
          </Text>

          {/* Stats row — number on top, icon below, spread across ✅ */}
          <View style={[styles.statsRow, { borderColor: theme.border }]}>
            <StatBox value={news.views}    icon="eye.fill"          theme={theme} />
            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
            <StatBox value={news.likes}    icon="heart.fill"        theme={theme} />
            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
            <StatBox value={news.comments} icon="bubble.left.fill"  theme={theme} />
            </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* Body — full content, no truncation ✅ */}
          <Text style={[styles.body, { color: theme.text }]}>
            {bodyText}
          </Text>

        </View>

        {/* ── Related news ── */}
        {related.length > 0 && (
          <View style={styles.relatedWrap}>
            <Text style={[styles.relatedHeading, { color: theme.text }]}>
              Berita Lainnya
            </Text>

            {related.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.relatedCard, { backgroundColor: theme.card }]}
                onPress={() =>
                  router.push(`/(tabs)/news_content/${item.id}` as any)
                }
                activeOpacity={0.85}
              >
                <Image
                  source={{ uri: resolveImage(item.image) }}
                  style={styles.relatedImage}
                  resizeMode="cover"
                />
                <View style={styles.relatedInfo}>
                  <Text
                    style={[styles.relatedTitle, { color: theme.text }]}
                    numberOfLines={3}
                  >
                    {item.title}
                  </Text>
                  <View style={[styles.relatedBadge, { backgroundColor: theme.primary }]}>
                    <Text style={styles.relatedBadgeText}>{item.category}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: insets.bottom + 24 }} />
      </ScrollView>
    </View>
  );
}

// ─── Stat box — number on top, icon below ✅ ──────────────────────────────────
function StatBox({
  icon,
  value,
  theme,
}: {
  icon: string;
  value: number;
  theme: ReturnType<typeof getTheme>;
}) {
  return (
    <View style={styles.statBox}>
      <IconSymbol name={icon as any} size={20} color={theme.primary} />
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center:    { flex: 1, justifyContent: "center", alignItems: "center" },

  heroWrap:  { width, height: 260 },
  heroImage: { width: "100%", height: "100%" },
  backBtn: {
    position: "absolute",
    left: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  backArrow: { color: "#fff", fontSize: 26, lineHeight: 30, fontWeight: "300" },

  contentCard: {
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 16,
    padding: 18,
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 4,
  },

  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  categoryBadgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },

  title: { fontSize: 20, fontWeight: "700", lineHeight: 28 },
  date:  { fontSize: 13 },

  // Stats box — spread evenly with dividers ✅
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    marginVertical: 4,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 36,
  },
  statValue: { fontSize: 16, fontWeight: "700" },

  divider: { height: 1, marginVertical: 4 },

  body:     { fontSize: 14, lineHeight: 22 },

  relatedWrap:    { paddingHorizontal: 16, marginTop: 20, gap: 12 },
  relatedHeading: { fontSize: 16, fontWeight: "700" },
  relatedCard: {
    flexDirection: "row",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  relatedImage: { width: 110, height: 90 },
  relatedInfo:  { flex: 1, padding: 10, justifyContent: "space-between" },
  relatedTitle: { fontSize: 13, fontWeight: "600", lineHeight: 18 },
  relatedBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 4,
  },
  relatedBadgeText: { color: "#fff", fontSize: 11, fontWeight: "600" },

  backTextBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
});