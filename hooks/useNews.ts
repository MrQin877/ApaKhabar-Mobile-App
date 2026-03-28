import { useEffect, useMemo, useState } from "react";
import { getNewsList } from "../services/newsService";
import { CATEGORIES } from "../constants/newsData";

export type NewsItem = {
  id: string;
  title: string;
  excerpt: string;
  image: string;
  date: string;
  category: string;
};

export function useNews() {
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [search, setSearch] = useState("");
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch news from Laravel API
  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getNewsList();
        setNews(data);
      } catch (err) {
        setError("Failed to load news");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  // Refetch when category changes
  useEffect(() => {
    const fetchByCategory = async () => {
      try {
        setLoading(true);
        setError(null);
        const category = activeCategory === "Semua" ? undefined : activeCategory;
        const data = await getNewsList(category);
        setNews(data);
      } catch (err) {
        setError("Failed to load news");
      } finally {
        setLoading(false);
      }
    };

    fetchByCategory();
  }, [activeCategory]);

  // Filter by search locally
  const filteredNews = useMemo(() => {
    return news.filter((n) =>
      n.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [news, search]);

  return {
    activeCategory,
    setActiveCategory,
    search,
    setSearch,
    filteredNews,
    categories: CATEGORIES,
    loading,
    error,
  };
}