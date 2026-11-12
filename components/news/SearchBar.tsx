import type { NewsDateFilter } from "@/utils/newsFilters";
import { BottomSheet } from "heroui-native/bottom-sheet";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Button } from "heroui-native/button";
import { SearchField } from "heroui-native/search-field";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Theme } from "../../constants/theme";
import { Ionicons } from "@expo/vector-icons";

interface SearchBarProps {
  search: string;
  onSearchChange: (text: string) => void;
  onFilterChange?: (filter: "all" | "today" | "week" | "month") => void;
  theme: Theme;
  onSearchPress?: () => void;
  onCalendarPress?: () => void;
  dateFilter?: NewsDateFilter;
}

export function SearchBar({
  search,
  onSearchChange,
  onFilterChange,
  theme,
  onSearchPress,
  onCalendarPress,
  dateFilter,
}: SearchBarProps) {
  const insets = useSafeAreaInsets();
  const [showSearch, setShowSearch] = useState(false);
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
        <View style={{ flex: 1 }}>
          <Text accessibilityRole="header" style={{ color: theme.text, fontSize: 28, fontWeight: "800", letterSpacing: -0.6 }}>Warta Kita</Text>
        </View>
        <Button variant="ghost" className="h-auto min-h-0 min-w-0 rounded-none p-0" accessibilityRole="button" accessibilityLabel="Cari berita" onPress={onSearchPress ?? (() => setShowSearch(!showSearch))} style={styles.filterBtn}><Ionicons name={showSearch ? "close-outline" : "search-outline"} size={22} color={theme.text}/></Button>
        <Button variant="ghost" className="h-auto min-h-0 min-w-0 rounded-none p-0" accessibilityRole="button" accessibilityLabel="Tapis mengikut tarikh" onPress={onCalendarPress ?? (() => setShowFilter(true))} style={styles.filterBtn}><Ionicons name="calendar-outline" size={22} color={(dateFilter ?? activeFilter) === "all" ? theme.text : theme.primary}/></Button>
      </View>
      {(showSearch || !!search) && <SearchField value={search} onChange={onSearchChange} style={{ paddingHorizontal: 16, paddingBottom: 8, backgroundColor: theme.card }}>
        <SearchField.Group><SearchField.SearchIcon iconProps={{ color: theme.primary }}/><SearchField.Input autoFocus={showSearch} accessibilityLabel="Cari berita" placeholder="Masukkan kata kunci" className="h-11 rounded-xl border-0 text-sm shadow-none"/><SearchField.ClearButton accessibilityLabel="Padam kata kunci"/></SearchField.Group>
      </SearchField>}

      <BottomSheet isOpen={showFilter} onOpenChange={setShowFilter}>
        <BottomSheet.Portal unstable_accessibilityContainerViewIsModal>
          <BottomSheet.Overlay accessibilityLabel="Tutup penapis" style={{ backgroundColor: theme.overlay }}/>
          <BottomSheet.Content snapPoints={['55%']} topInset={insets.top + 12}
            enableDynamicSizing={false} enableOverDrag={false} contentContainerClassName="h-full p-6"
            backgroundClassName="rounded-t-3xl bg-overlay shadow-none" handleIndicatorClassName="bg-separator">
            <BottomSheet.Title style={[styles.filterTitle, { color: theme.text }]}>Tapis Mengikut Tarikh</BottomSheet.Title>
            <BottomSheetScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 10, paddingBottom: Math.max(24, insets.bottom) }}>
            {filters.map((f) => (
              <Button variant="ghost" className="h-auto min-h-0 min-w-0 rounded-none p-0"
                key={f.value}
                style={[
                  styles.filterOption,
                  {
                    backgroundColor:
                      activeFilter === f.value
                        ? theme.communityBg
                        : "transparent",
                    borderColor:
                      activeFilter === f.value
                        ? theme.primary
                        : theme.border,
                  },
                ]}
                onPress={() => handleFilter(f.value)}
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
              </Button>
            ))}
            </BottomSheetScrollView>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
    gap: 10,
    borderBottomWidth: 0,
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
