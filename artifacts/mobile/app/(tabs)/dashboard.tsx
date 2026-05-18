import { Feather } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BeltBadge } from "@/components/BeltBadge";
import { useAuth } from "@/context/AuthContext";
import { usePlayers } from "@/context/PlayersContext";
import { useColors } from "@/hooks/useColors";

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentProps<typeof Feather>["name"];
  accent: string;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.statCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={[styles.statIcon, { backgroundColor: accent + "18" }]}>
        <Feather name={icon} size={18} color={accent} />
      </View>
      <Text style={[styles.statValue, { color: colors.foreground }]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
    </View>
  );
}

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { players } = usePlayers();

  const stats = useMemo(() => {
    const total = players.length;
    const members = players.filter((p) => p.membership_status === "active_member").length;
    const nonMembers = players.filter((p) => p.membership_status === "active_nonmember").length;
    const inactive = players.filter((p) => p.membership_status === "inactive").length;
    const totalAchievements = players.reduce((acc, p) => acc + p.achievements.length, 0);
    const avgAge =
      total > 0
        ? Math.round(players.reduce((acc, p) => acc + p.age, 0) / total)
        : 0;
    const beltCounts: Record<string, number> = {};
    players.forEach((p) => {
      beltCounts[p.belt_rank] = (beltCounts[p.belt_rank] ?? 0) + 1;
    });
    const topBelt = Object.entries(beltCounts).sort((a, b) => b[1] - a[1])[0];
    return { total, members, nonMembers, inactive, totalAchievements, avgAge, topBelt };
  }, [players]);

  const beltBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    players.forEach((p) => {
      counts[p.belt_rank] = (counts[p.belt_rank] ?? 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [players]);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: colors.navBar, paddingTop: topPadding + 16 },
        ]}
      >
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Text style={styles.headerSub}>
          {user?.role === "sensei" ? "Sensei" : "Senpai"} {user?.name?.split(" ")[1] ?? ""}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Platform.OS === "web" ? 34 + 84 : insets.bottom + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsGrid}>
          <StatCard label="Total Athletes" value={stats.total} icon="users" accent={colors.primary} />
          <StatCard label="Active Members" value={stats.members} icon="check-circle" accent="#10B981" />
          <StatCard label="Non-Members" value={stats.nonMembers} icon="alert-circle" accent="#F59E0B" />
          <StatCard label="Achievements" value={stats.totalAchievements} icon="award" accent={colors.accent} />
          <StatCard label="Avg Age" value={stats.avgAge} icon="user" accent="#8B5CF6" />
          <StatCard label="Inactive" value={stats.inactive} icon="user-x" accent="#6B7280" />
        </View>

        {beltBreakdown.length > 0 && (
          <View
            style={[
              styles.section,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Belt Distribution
            </Text>
            {beltBreakdown.map(([belt, count]) => (
              <View key={belt} style={styles.beltRow}>
                <BeltBadge rank={belt} size="sm" />
                <View style={styles.beltBarWrap}>
                  <View
                    style={[
                      styles.beltBar,
                      {
                        backgroundColor: colors.primary,
                        width: `${Math.round((count / stats.total) * 100)}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.beltCount, { color: colors.mutedForeground }]}>
                  {count}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Top Achievers
          </Text>
          {players
            .filter((p) => p.achievements.length > 0)
            .sort((a, b) => b.achievements.length - a.achievements.length)
            .slice(0, 5)
            .map((p, i) => (
              <View key={p.id} style={styles.achieverRow}>
                <View style={[styles.rankCircle, { backgroundColor: i === 0 ? colors.primary : colors.border }]}>
                  <Text
                    style={[styles.rankNum, { color: i === 0 ? "#FFF" : colors.mutedForeground }]}
                  >
                    {i + 1}
                  </Text>
                </View>
                <Text style={[styles.achieverName, { color: colors.foreground }]} numberOfLines={1}>
                  {p.name}
                </Text>
                <View style={styles.achieverBadge}>
                  <Feather name="award" size={12} color={colors.accent} />
                  <Text style={[styles.achieverCount, { color: colors.accent }]}>
                    {p.achievements.length}
                  </Text>
                </View>
              </View>
            ))}
          {players.every((p) => p.achievements.length === 0) && (
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No achievements recorded yet.
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 4,
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
  },
  scroll: { flex: 1 },
  content: {
    padding: 16,
    gap: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statCard: {
    width: "47%",
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    lineHeight: 32,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  section: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  beltRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  beltBarWrap: {
    flex: 1,
    height: 6,
    backgroundColor: "#F3F4F6",
    borderRadius: 3,
    overflow: "hidden",
  },
  beltBar: {
    height: 6,
    borderRadius: 3,
  },
  beltCount: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    minWidth: 20,
    textAlign: "right",
  },
  achieverRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rankCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  rankNum: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
  achieverName: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  achieverBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  achieverCount: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingVertical: 8,
  },
});
