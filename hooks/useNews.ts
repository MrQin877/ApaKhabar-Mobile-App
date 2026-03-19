import { useMemo, useState } from "react";
import { CATEGORIES, NEWS } from "../constants/newsData";

export function useNews() {
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [search, setSearch] = useState("");

  const filteredNews = useMemo(() => {
    return NEWS.filter((n) => {
      const matchCat =
        activeCategory === "Semua" || n.category === activeCategory;
      const matchSearch = n.title.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [activeCategory, search]);

  return {
    activeCategory,
    setActiveCategory,
    search,
    setSearch,
    filteredNews,
    categories: CATEGORIES,
  };
}
