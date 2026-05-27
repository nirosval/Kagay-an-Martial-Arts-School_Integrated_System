import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BeltBadge } from "@/components/BeltBadge";
import { StatBlock } from "@/components/StatBlock";
import { StatusBadge } from "@/components/StatusBadge";
import { usePlayers } from "@/context/PlayersContext";
import { useColors } from "@/hooks/useColors";

export default function PlayerPortalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getPlayer } = usePlayers();
  const player = getPlayer(id ?? "");

  if (!player) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Feather name="user-x" size={48} color={colors.mutedForeground} />
        <Text style={[styles.notFoundText, { color: colors.mutedForeground }]}>
          Profile not found
        </Text>
        <Pressable onPress={() => router.replace("/login")}>
          <Text style={{ color: colors.accent, fontFamily: "Inter_500Medium" }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const yearsActive = new Date().getFullYear() - player.year_started;
  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: Platform.OS === "web" ? 40 : insets.bottom + 32,
        }}
      >
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: colors.navBar, paddingTop: topPadding + 12 }]}>
          <Pressable
            onPress={() => router.replace("/login")}
            style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Feather name="arrow-left" size={22} color="#FFF" />
            <Text style={styles.backLabel}>Portals</Text>
          </Pressable>

          <View style={styles.heroBody}>
            <View style={[styles.avatar, { borderColor: colors.primary }]}>
              <Text style={styles.avatarText}>
                {player.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </Text>
            </View>
            <View style={styles.heroInfo}>
              <Text style={styles.heroName}>{player.name}</Text>
              <View style={styles.badgeRow}>
                <BeltBadge rank={player.belt_rank} />
              </View>
              <View style={styles.badgeRow}>
                <StatusBadge status={player.membership_status} />
              </View>
            </View>
          </View>

          {/* ESPN stats strip */}
          <View style={[styles.statsStrip, { backgroundColor: "rgba(255,255,255,0.06)" }]}>
            <StatBlock label="Age" value={String(player.age)} unit=" yrs" />
            <View style={[styles.stripDiv, { backgroundColor: "rgba(255,255,255,0.15)" }]} />
            <StatBlock label="Height" value={String(player.height_cm)} unit=" cm" />
            <View style={[styles.stripDiv, { backgroundColor: "rgba(255,255,255,0.15)" }]} />
            <StatBlock label="Weight" value={String(player.weight_kg)} unit=" kg" />
            <View style={[styles.stripDiv, { backgroundColor: "rgba(255,255,255,0.15)" }]} />
            <StatBlock label="Years" value={String(yearsActive)} unit=" yr" />
          </View>
        </View>

        <View style={styles.body}>
          {/* Info card */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Profile Info</Text>
            <Row label="Birthdate" value={player.birthdate} colors={colors} />
            <View style={[styles.sep, { backgroundColor: colors.border }]} />
            <Row label="Year Started" value={String(player.year_started)} colors={colors} />
            <View style={[styles.sep, { backgroundColor: colors.border }]} />
            <Row label="Belt Rank" value={player.belt_rank} colors={colors} />
            <View style={[styles.sep, { backgroundColor: colors.border }]} />
            <View style={styles.rowWrap}>
              <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>Membership</Text>
              <StatusBadge status={player.membership_status} size="sm" />
            </View>
          </View>

          {/* Achievements card */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.achHeader}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Achievements</Text>
              <View style={[styles.achCountBadge, { backgroundColor: colors.accent + "18" }]}>
                <Feather name="award" size={13} color={colors.accent} />
                <Text style={[styles.achCountText, { color: colors.accent }]}>
                  {player.achievements.length}
                </Text>
              </View>
            </View>

            {player.achievements.length === 0 ? (
              <View style={styles.emptyAch}>
                <Feather name="award" size={32} color={colors.mutedForeground} />
                <Text style={[styles.emptyAchText, { color: colors.mutedForeground }]}>
                  No achievements recorded yet
                </Text>
              </View>
            ) : (
              player.achievements.map((ach, i) => (
                <View key={ach.id}>
                  {i > 0 && <View style={[styles.sep, { backgroundColor: colors.border }]} />}
                  <View style={styles.achItem}>
                    <View style={[styles.achDot, { backgroundColor: colors.accent }]} />
                    <View style={styles.achContent}>
                      <Text style={[styles.achTitle, { color: colors.foreground }]}>{ach.title}</Text>
                      <Text style={[styles.achDate, { color: colors.mutedForeground }]}>{ach.date}</Text>
                      {ach.description ? (
                        <Text style={[styles.achDesc, { color: colors.mutedForeground }]}>
                          {ach.description}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Footer note */}
          <View style={[styles.footerNote, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="info" size={14} color={colors.mutedForeground} />
            <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
              To update your profile or achievements, contact your Sensei or Senpai.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Row({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.rowWrap}>
      <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  notFoundText: { fontSize: 16, fontFamily: "Inter_500Medium" },
  hero: { paddingBottom: 0 },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingBottom: 12,
    alignSelf: "flex-start",
  },
  backLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  heroBody: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    backgroundColor: "#1F2937",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 26,
    fontFamily: "Inter_700Bold",
  },
  heroInfo: { flex: 1, gap: 6, paddingTop: 4 },
  heroName: {
    color: "#FFFFFF",
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    lineHeight: 26,
  },
  badgeRow: { flexDirection: "row" },
  statsStrip: {
    flexDirection: "row",
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginTop: 8,
  },
  stripDiv: { width: 1, marginVertical: 4 },
  body: { padding: 16, gap: 14 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  rowWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  rowValue: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  sep: { height: 1 },
  achHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  achCountBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  achCountText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  emptyAch: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 8,
  },
  emptyAchText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  achItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 6,
  },
  achDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  achContent: { flex: 1 },
  achTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  achDate: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  achDesc: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  footerNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  footerText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
});
