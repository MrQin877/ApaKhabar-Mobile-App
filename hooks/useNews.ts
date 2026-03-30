import { useEffect, useState } from "react";

// ─── Change this to match your setup ─────────────────────────────────────────
// Android emulator  → http://10.0.2.2:8000
// iOS simulator     → http://localhost:8000
// Physical device   → http://192.168.x.x:8000  (your PC's local IP)
export const BASE_URL = "http://localhost:8000";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface NewsItem {
  id: string;
  title: string;
  category: string;
  image: string;
  likes: number;
  comments: number;
  views: number;
  date: string;
  body?: string;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useNews() {
  const [allNews, setAllNews] = useState<NewsItem[]>([]);
  const [featuredNews, setFeaturedNews] = useState<NewsItem | null>(null);
  const [categories, setCategories] = useState<string[]>(["Semua"]);
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch all news & latest featured ──────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`${BASE_URL}/api/news`)
      .then((res) => {
        if (!res.ok) throw new Error("Gagal memuat berita.");
        return res.json();
      })
      .then((json) => {
        // Expects: { data: NewsItem[] }
        // Adjust if your API returns a different shape
        const news: NewsItem[] = json.data ?? json;

        if (news.length === 0) {
          setAllNews([]);
          setFeaturedNews(null);
          return;
        }

        // The first item (most recent) becomes the featured card
        const [latest, ...rest] = news;
        setFeaturedNews(latest);
        setAllNews(rest); // rest shown in the list below featured

        // Build category pills from API data
        const unique = Array.from(new Set(news.map((n) => n.category)));
        setCategories(["Semua", ...unique]);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // ── Filter list news by category + search ─────────────────────────────────
  const filteredNews = allNews.filter((item) => {
    const matchCategory =
      activeCategory === "Semua" || item.category === activeCategory;
    const matchSearch = item.title
      .toLowerCase()
      .includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  return {
    featuredNews,       // ← latest news for FeaturedCard (replaces hardcoded FEATURED)
    filteredNews,       // ← filtered list for NewsList
    categories,
    activeCategory,
    setActiveCategory,
    search,
    setSearch,
    loading,
    error,
  };
}