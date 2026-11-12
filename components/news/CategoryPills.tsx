import { Chip } from "heroui-native/chip";
import { Ionicons } from "@expo/vector-icons";
import { newsDateLabel, type NewsDateFilter } from "@/utils/newsFilters";
import type { ScrollViewInstance } from "react-native";
import React, { useRef } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Theme } from "../../constants/theme";

interface CategoryPillsProps {
  categories: string[];
  activeCategory: string;
  onCategoryPress: (category: string) => void;
  theme: Theme;
  dateFilter?: NewsDateFilter;
  onClearDate?: () => void;
}

export function CategoryPills({
  categories,
  activeCategory,
  onCategoryPress,
  theme,
  dateFilter = "all",
  onClearDate,
}: CategoryPillsProps) {
  const scrollRef = useRef<ScrollViewInstance>(null);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      // Fix: these two props prevent the pill from "running off"
      keyboardShouldPersistTaps="handled"
      bounces={false}
      style={[
        styles.catScroll,
        { backgroundColor: theme.card, borderBottomColor: theme.border },
      ]}
      contentContainerStyle={styles.catContent}
    >
      {categories.map((cat) => {
        const isActive = activeCategory === cat;
        return (
          <React.Fragment key={cat}>
          <Chip size="sm" variant={isActive ? "primary" : "secondary"}
            key={cat === "Semua" ? "Utama" : cat}
            style={[
              styles.catPill,
              {
                backgroundColor: isActive ? theme.primary : theme.accent,
                borderColor: isActive ? theme.primary : theme.border,
              },
            ]}
            onPress={() => onCategoryPress(cat)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            <Chip.Label
              style={[
                styles.catText,
                {
                  color: isActive ? theme.background : theme.secondary,
                },
              ]}
            >
              {cat === "Semua" ? "Utama" : cat}
            </Chip.Label>
          </Chip>
          {isActive && dateFilter !== "all" && <Chip size="sm" variant="soft"
            accessibilityRole="button" accessibilityLabel="Buang penapis tarikh" onPress={onClearDate}
            style={[styles.catPill, { backgroundColor: theme.communityBg, flexDirection: "row", gap: 5 }]}>
            <Ionicons name="calendar-outline" size={13} color={theme.primary}/>
            <Chip.Label style={[styles.catText, { color: theme.primary }]}>
              {newsDateLabel(dateFilter)}
            </Chip.Label>
            <Ionicons name="close" size={14} color={theme.primary}/>
          </Chip>}
          </React.Fragment>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  catScroll: {
    borderBottomWidth: 1,
    flexGrow: 0,
    flexShrink: 0,
    height: 52,        // fixed height â€” never changes regardless of active pill
  },
  catContent: {
    paddingHorizontal: 16,
    paddingVertical: 0,
    flexDirection: "row",
    alignItems: "center",
    height: 52,        // match parent fixed height
  },
  catPill: {
    paddingHorizontal: 16,
    height: 32,            // fixed pill height â€” never changes
    borderRadius: 20,
    borderWidth: 0,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  catText: {
    fontSize: 12,
    fontWeight: "600",      // fixed weight â€” never changes, no layout shift
    textAlign: "center",
    includeFontPadding: false,
  },
});
