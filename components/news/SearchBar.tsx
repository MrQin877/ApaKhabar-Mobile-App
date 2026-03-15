import React from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { Theme } from "../../constants/theme";
import { IconSymbol } from "../ui/icon-symbol";

interface SearchBarProps {
  search: string;
  onSearchChange: (text: string) => void;
  onMenuPress?: () => void;
  theme: Theme;
}

export function SearchBar({
  search,
  onSearchChange,
  onMenuPress,
  theme,
}: SearchBarProps) {
  return (
    <View
      style={[
        styles.searchRow,
        { backgroundColor: theme.card, borderBottomColor: theme.border },
      ]}
    >
      <TouchableOpacity style={styles.menuBtn} onPress={onMenuPress}>
        <IconSymbol name="line.horizontal.3" size={20} color={theme.text} />
      </TouchableOpacity>

      <View
        style={[
          styles.searchWrap,
          { backgroundColor: theme.accent, borderColor: theme.border },
        ]}
      >
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Masukkan kata kunci"
          placeholderTextColor={theme.secondary}
          value={search}
          onChangeText={onSearchChange}
        />
      </View>

      <TouchableOpacity style={styles.searchIconBtn}>
        <IconSymbol name="magnifyingglass" size={20} color={theme.secondary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
  },
  menuBtn: { padding: 4 },
  searchWrap: {
    flex: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  searchInput: {
    fontSize: 13,
    paddingVertical: 9,
  },
  searchIconBtn: { padding: 4 },
});
