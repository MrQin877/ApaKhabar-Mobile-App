import React, { useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Theme } from "../../constants/theme";
import { Ionicons } from "@expo/vector-icons";

interface SearchBarProps {
  search: string;
  onSearchChange: (text: string) => void;
  onFilterChange?: (filter: "all" | "today" | "week" | "month") => void;
  theme: Theme;
}

export function SearchBar({
  search,
  onSearchChange,
  onFilterChange,
  theme,
}: SearchBarProps) {
  const [showFilter, setShowFilter] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "today" | "week" | "month">("all");

  const filters: { label: string; value: "all" | "today" | "week" | "month" }[] = [
    { label: "Semua Tarikh", value: "all" },
    { label: "Hari Ini",     value: "today" },
    { label: "Minggu Ini",   value: "week" },
    { label: "Bulan Ini",    value: "month" },
  ];

  const handleFilter = (value: "all" | "today" | "week" | "month") => {
    setActiveFilter(value);
    onFilterChange?.(value);
    setShowFilter(false);
  };

  return (
    <>
      <View
        style={[
          styles.searchRow,
          { backgroundColor: theme.card, borderBottomColor: theme.border },
        ]}
      >
        {/* Filter icon — replaces hamburger */}
        <TouchableOpacity
          style={[
            styles.filterBtn,
            activeFilter !== "all" && { backgroundColor: theme.primary + "20" },
          ]}
          onPress={() => setShowFilter(true)}
        >
          <Ionicons
            name="filter"
            size={22}
            color={activeFilter !== "all" ? theme.primary : theme.text}
          />
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
          <Ionicons name="search" size={20} color={theme.secondary} />
        </TouchableOpacity>
      </View>

      {/* Filter modal */}
      <Modal
        visible={showFilter}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilter(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setShowFilter(false)}
        >
          <View style={[styles.filterSheet, { backgroundColor: theme.card }]}>
            <Text style={[styles.filterTitle, { color: theme.text }]}>
              Tapis Mengikut Tarikh
            </Text>
            {filters.map((f) => (
              <TouchableOpacity
                key={f.value}
                style={[
                  styles.filterOption,
                  {
                    backgroundColor:
                      activeFilter === f.value
                        ? theme.primary + "15"
                        : "transparent",
                    borderColor:
                      activeFilter === f.value
                        ? theme.primary
                        : theme.border,
                  },
                ]}
                onPress={() => handleFilter(f.value)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterOptionText,
                    {
                      color:
                        activeFilter === f.value ? theme.primary : theme.text,
                      fontWeight: activeFilter === f.value ? "700" : "500",
                    },
                  ]}
                >
                  {f.label}
                </Text>
                {activeFilter === f.value && (
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={theme.primary}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
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
  filterBtn: {
    padding: 6,
    borderRadius: 8,
  },
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

  // Modal
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  filterSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 10,
  },
  filterTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
  },
  filterOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  filterOptionText: {
    fontSize: 14,
  },
});