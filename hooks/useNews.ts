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
  const [categories, setCategories] = useState<string[]>(["Semua"]);
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await api.get("/news");
      const news: NewsItem[] = res.data?.data ?? res.data;

      setAllNews(news);

      const unique = Array.from(new Set(news.map((n) => n.category)));
      setCategories(["Semua", ...unique]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const handleRefresh = useCallback(() => fetchNews(true), [fetchNews]);

  const isFiltering = activeCategory !== "Semua" || search.trim() !== "";

  const filteredNews = allNews.filter((item) => {
    const matchCategory =
      activeCategory === "Semua" || item.category === activeCategory;
    const matchSearch = item.title.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  // "Semua" view: first item is featured, rest is list
  // Category/search view: no featured card, everything is a flat list
  const featuredNews =
    !isFiltering && filteredNews.length > 0 ? filteredNews[0] : null;
  const listNews = !isFiltering ? filteredNews.slice(1) : filteredNews;

  return {
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
    handleRefresh,
  };
}
