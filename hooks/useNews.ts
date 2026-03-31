<<<<<<< Updated upstream
import { useMemo, useState } from "react";
import { CATEGORIES, NEWS } from "../constants/newsData";

=======
import { useEffect, useState } from "react";
import api from "../services/api";

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
>>>>>>> Stashed changes
export function useNews() {
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [search, setSearch] = useState("");

<<<<<<< Updated upstream
  const filteredNews = useMemo(() => {
    return NEWS.filter((n) => {
      const matchCat =
        activeCategory === "Semua" || n.category === activeCategory;
      const matchSearch = n.title.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [activeCategory, search]);

  return {
=======
  useEffect(() => {
    setLoading(true);
    setError(null);

    api
      .get("/news")
      .then((res) => {
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
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

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
>>>>>>> Stashed changes
    activeCategory,
    setActiveCategory,
    search,
    setSearch,
    filteredNews,
    categories: CATEGORIES,
  };
}
