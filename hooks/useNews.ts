import { useCallback, useEffect, useState } from "react";
import api from "../services/api";

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

export function useNews() {
  const [allNews, setAllNews] = useState<NewsItem[]>([]);
  const [featuredNews, setFeaturedNews] = useState<NewsItem | null>(null);
  const [categories, setCategories] = useState<string[]>(["Semua"]);
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await api.get("/news");
      const news: NewsItem[] = res.data?.data ?? res.data;

      if (news.length === 0) {
        setAllNews([]);
        setFeaturedNews(null);
        return;
      }

      const [latest, ...rest] = news;
      setFeaturedNews(latest);
      setAllNews(rest);

      const unique = Array.from(new Set(news.map((n) => n.category)));
      setCategories(["Semua", ...unique]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  // Pull-to-refresh handler
  const handleRefresh = useCallback(() => {
    fetchNews(true);
  }, [fetchNews]);

  const filteredNews = allNews.filter((item) => {
    const matchCategory =
      activeCategory === "Semua" || item.category === activeCategory;
    const matchSearch = item.title.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  return {
    featuredNews,
    filteredNews,
    categories,
    activeCategory,
    setActiveCategory,
    search,
    setSearch,
    loading,
    refreshing,
    error,
    handleRefresh,
  };
}
