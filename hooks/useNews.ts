import { useMemo, useState } from "react";
import { useNewsFeed } from "./useNewsFeed";
import { filterNews } from "@/utils/newsFilters";

export interface NewsItem {
  id: string;
  title: string;
  category: string;
  image: string;
  likes: number;
  likes_count?: number;
  liked_by_user?: boolean;
  is_liked?: boolean;
  liked?: boolean;
  comments: number;
  views: number;
  date: string;
  body?: string;
  description?: string;
  author?: string | { name?: string };
  time?: string;
  preview?: string;
  published_at?: string;
  created_at?: string;
  author_name?: string;
}

export function useNews() {
  const feed = useNewsFeed();
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [search, setSearch] = useState("");
  const categories = useMemo(() => ["Semua", ...Array.from(new Set([...feed.categories, ...feed.items.map(item => item.category)]))], [feed.categories, feed.items]);
  const filtered = useMemo(() => filterNews(feed.items, { query: search, category: activeCategory }), [feed.items, search, activeCategory]);
  const isFiltering = activeCategory !== "Semua" || !!search.trim();
  return {
    featuredNews: !isFiltering ? filtered[0] : null,
    listNews: !isFiltering ? filtered.slice(1) : filtered,
    categories, activeCategory, setActiveCategory, search, setSearch,
    loading: feed.loading, refreshing: feed.refreshing, error: feed.error, handleRefresh: feed.refresh,
  };
}
