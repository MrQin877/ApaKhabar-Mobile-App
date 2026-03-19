import React, { useRef } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";
import { Theme } from "../../constants/theme";

interface CategoryPillsProps {
  categories: string[];
  activeCategory: string;
  onCategoryPress: (category: string) => void;
  theme: Theme;
}

export function CategoryPills({
  categories,
  activeCategory,
  onCategoryPress,
  theme,
}: CategoryPillsProps) {
  const scrollRef = useRef<ScrollView>(null);

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
          <TouchableOpacity
            key={cat}
            style={[
              styles.catPill,
              {
                backgroundColor: isActive ? theme.primary : theme.accent,
                borderColor: isActive ? theme.primary : theme.border,
              },
            ]}
            onPress={() => onCategoryPress(cat)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.catText,
                {
                  color: isActive ? "#fff" : theme.secondary,
                },
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
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
    height: 52,        // fixed height — never changes regardless of active pill
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
    height: 34,            // fixed pill height — never changes
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  catText: {
    fontSize: 13,
    fontWeight: "600",      // fixed weight — never changes, no layout shift
    textAlign: "center",
    includeFontPadding: false,
  },
});