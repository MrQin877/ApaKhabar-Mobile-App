import React from "react";
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
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
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
                  fontWeight: isActive ? "700" : "500",
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
  },
  catContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  catPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  catText: {
    fontSize: 13,
  },
});
