import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PlayerCard } from "@/components/PlayerCard";
import { usePlayers } from "@/context/PlayersContext";
import { useColors } from "@/hooks/useColors";
import { MembershipStatus } from "@/types";

const FILTERS: Array<{ label: string; value: MembershipStatus | "all" }> = [
  { label: "All", value: "all" },
  { label: "Member", value: "active_member" },
  { label: "Non-Member", value: "active_nonmember" },
  { label: "Inactive", value: "inactive" },
];

export default function PlayersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { players, isLoading } = usePlayers();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<MembershipStatus | "all">("all");

  const filtered = useMemo(() => {
    return players.filter((p) => {
      const matchName = p.name.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === "all" || p.membership_status === filter;
      return matchName && matchFilter;
    });
  }, [players, search, filter]);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: colors.navBar, paddingTop: topPadding + 16 },
        ]}
      >
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Players</Text>
          <Pressable
            onPress={() => router.push("/add-player")}
            style={({ pressed }) => [
              styles.addBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Feather name="plus" size={20} color="#FFF" />
          </Pressable>
        </View>
        <Text style={styles.headerSub}>{players.length} registered athletes</Text>
        <View style={styles.searchRow}>
          <Feather name="search" size={16} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search players..."
            placeholderTextColor="#6B7280"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Feather name="x" size={16} color="#9CA3AF" />
            </Pressable>
          )}
        </View>
        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <Pressable
              key={f.value}
              onPress={() => setFilter(f.value)}
              style={[
                styles.filterChip,
                filter === f.value
                  ? { backgroundColor: colors.primary }
                  : { backgroundColor: "rgba(255,255,255,0.1)" },
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: filter === f.value ? "#FFF" : "#9CA3AF" },
                ]}
              >
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PlayerCard player={item} />}
          contentContainerStyle={[
            styles.list,
            {
              paddingBottom:
                Platform.OS === "web" ? 34 + 84 : insets.bottom + 90,
            },
          ]}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="users" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {search ? "No players match your search" : "No players yet. Add your first athlete."}
              </Text>
            </View>
          }
          scrollEnabled={!!filtered.length}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  headerSub: {
    color: "#9CA3AF",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: -4,
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    paddingHorizontal: 12,
    gap: 8,
    height: 42,
  },
  searchIcon: {},
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    height: 42,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  filterText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  list: {
    paddingTop: 16,
  },
  empty: {
    alignItems: "center",
    marginTop: 60,
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
});
