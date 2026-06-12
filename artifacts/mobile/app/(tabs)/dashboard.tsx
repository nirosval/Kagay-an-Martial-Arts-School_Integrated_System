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
import { useAttendance } from "@/context/AttendanceContext";
import { useAuth } from "@/context/AuthContext";
import { usePlayers } from "@/context/PlayersContext";
import { useColors } from "@/hooks/useColors";

function StatCard({ label, value, icon, accent }: {
  label: string; value: number | string;
  icon: React.ComponentProps<typeof Feather>["name"]; accent: string;
}) {
  const colors = useColors();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.statIcon, { backgroundColor: accent + "18" }]}>
        <Feather name={icon} size={18} color={accent} />
      </View>
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function formatTime(iso: string) {
  const d = new Date(iso);
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

function todayLabel() {
  return new Date().toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { players } = usePlayers();
  const { getTodayAll } = useAttendance();

  const todayRecords = getTodayAll();

  const stats = useMemo(() => {
    const total = players.length;
    const members = players.filter((p) => p.membership_status === "active_member").length;
    const nonMembers = players.filter((p) => p.membership_status === "active_nonmember").length;
    const inactive = players.filter((p) => p.membership_status === "inactive").length;
    const totalAchievements = players.reduce((acc, p) => acc + p.achievements.length, 0);
    return { total, members, nonMembers, inactive, totalAchievements };
  }, [players]);

  const attendanceStats = useMemo(() => {
    const presentIds = new Set(todayRecords.map((r) => r.playerId));
    const present = todayRecords.filter((r) => r.status === "present").length;
    const late = todayRecords.filter((r) => r.status === "late").length;
    const activePlayers = players.filter((p) => p.membership_status !== "inactive");
    const absent = activePlayers.filter((p) => !presentIds.has(p.id)).length;
    return { present, late, absent, total: activePlayers.length };
  }, [players, todayRecords]);

  const playerListToday = useMemo(() => {
    return players
      .filter((p) => p.membership_status !== "inactive")
      .map((p) => {
        const rec = todayRecords.find((r) => r.playerId === p.id);
        return {
          ...p,
          todayStatus: rec ? rec.status : "absent" as const,
          timeIn: rec?.time_in ?? null,
          timeOut: rec?.time_out ?? null,
        };
      })
      .sort((a, b) => {
        const order = { present: 0, late: 1, absent: 2 };
        return order[a.todayStatus] - order[b.todayStatus];
      });
  }, [players, todayRecords]);

  const beltBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    players.forEach((p) => { counts[p.belt_rank] = (counts[p.belt_rank] ?? 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [players]);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const statusColor = (s: string) => {
    if (s === "present") return "#10B981";
    if (s === "late") return "#F59E0B";
    return "#EF4444";
  };
  const statusLabel = (s: string) => {
    if (s === "present") return "Present";
    if (s === "late") return "Late";
    return "Absent";
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.navBar, paddingTop: topPadding + 16 }]}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Text style={styles.headerSub}>
          {user?.role === "sensei" ? "Sensei" : user?.role === "coach" ? "Coach" : "Senpai"} {user?.name?.split(" ")[1] ?? ""}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: Platform.OS === "web" ? 34 + 84 : insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Date */}
        <View style={[styles.dateRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="calendar" size={15} color={colors.mutedForeground} />
          <Text style={[styles.dateText, { color: colors.mutedForeground }]}>{todayLabel()}</Text>
        </View>

        {/* Player Stats */}
        <View style={styles.statsGrid}>
          <StatCard label="Total Athletes" value={stats.total} icon="users" accent={colors.primary} />
          <StatCard label="Active Members" value={stats.members} icon="check-circle" accent="#10B981" />
          <StatCard label="Non-Members" value={stats.nonMembers} icon="alert-circle" accent="#F59E0B" />
          <StatCard label="Achievements" value={stats.totalAchievements} icon="award" accent={colors.accent} />
        </View>

        {/* Status Overview */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Today's Attendance Status</Text>
          <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
            {attendanceStats.total} active players tracked
          </Text>

          <View style={styles.statusRow}>
            <StatusPill label="Present" count={attendanceStats.present} color="#10B981" colors={colors} />
            <StatusPill label="Absent" count={attendanceStats.absent} color="#EF4444" colors={colors} />
            <StatusPill label="Late" count={attendanceStats.late} color="#F59E0B" colors={colors} />
          </View>

          {/* Progress bar */}
          {attendanceStats.total > 0 && (
            <View style={{ gap: 4 }}>
              <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                {attendanceStats.present > 0 && (
                  <View style={[styles.progressFill, {
                    backgroundColor: "#10B981",
                    width: `${Math.round((attendanceStats.present / attendanceStats.total) * 100)}%`,
                  }]} />
                )}
                {attendanceStats.late > 0 && (
                  <View style={[styles.progressFill, {
                    backgroundColor: "#F59E0B",
                    width: `${Math.round((attendanceStats.late / attendanceStats.total) * 100)}%`,
                  }]} />
                )}
              </View>
              <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
                {attendanceStats.present + attendanceStats.late} of {attendanceStats.total} attended today
              </Text>
            </View>
          )}
        </View>

        {/* Player List Overview */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Player List Overview</Text>

          {playerListToday.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No active players.</Text>
          ) : (
            <>
              <View style={styles.tableHeader}>
                <Text style={[styles.thName, { color: colors.mutedForeground }]}>Name</Text>
                <Text style={[styles.thStatus, { color: colors.mutedForeground }]}>Status</Text>
                <Text style={[styles.thTime, { color: colors.mutedForeground }]}>Time In</Text>
              </View>
              {playerListToday.map((p, i) => (
                <View key={p.id}>
                  {i > 0 && <View style={[styles.rowSep, { backgroundColor: colors.border }]} />}
                  <View style={styles.tableRow}>
                    <Text style={[styles.tdName, { color: colors.foreground }]} numberOfLines={1}>{p.name}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor(p.todayStatus) + "18" }]}>
                      <Text style={[styles.statusBadgeText, { color: statusColor(p.todayStatus) }]}>
                        {statusLabel(p.todayStatus)}
                      </Text>
                    </View>
                    <Text style={[styles.tdTime, { color: colors.mutedForeground }]}>
                      {p.timeIn ? formatTime(p.timeIn) : "—"}
                    </Text>
                  </View>
                </View>
              ))}
            </>
          )}
        </View>

        {/* Belt Distribution */}
        {beltBreakdown.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Belt Distribution</Text>
            {beltBreakdown.map(([belt, count]) => (
              <View key={belt} style={styles.beltRow}>
                <BeltBadge rank={belt} size="sm" />
                <View style={styles.beltBarWrap}>
                  <View style={[styles.beltBar, { backgroundColor: colors.primary, width: `${Math.round((count / stats.total) * 100)}%` }]} />
                </View>
                <Text style={[styles.beltCount, { color: colors.mutedForeground }]}>{count}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Top Achievers */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Top Achievers</Text>
          {players
            .filter((p) => p.achievements.length > 0)
            .sort((a, b) => b.achievements.length - a.achievements.length)
            .slice(0, 5)
            .map((p, i) => (
              <View key={p.id} style={styles.achieverRow}>
                <View style={[styles.rankCircle, { backgroundColor: i === 0 ? colors.primary : colors.border }]}>
                  <Text style={[styles.rankNum, { color: i === 0 ? "#FFF" : colors.mutedForeground }]}>{i + 1}</Text>
                </View>
                <Text style={[styles.achieverName, { color: colors.foreground }]} numberOfLines={1}>{p.name}</Text>
                <View style={styles.achieverBadge}>
                  <Feather name="award" size={12} color={colors.accent} />
                  <Text style={[styles.achieverCount, { color: colors.accent }]}>{p.achievements.length}</Text>
                </View>
              </View>
            ))}
          {players.every((p) => p.achievements.length === 0) && (
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No achievements recorded yet.</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function StatusPill({ label, count, color, colors }: {
  label: string; count: number; color: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[styles.pill, { backgroundColor: color + "12", borderColor: color + "40" }]}>
      <View style={[styles.pillDot, { backgroundColor: color }]} />
      <View>
        <Text style={[styles.pillCount, { color }]}>{count}</Text>
        <Text style={[styles.pillLabel, { color: colors.mutedForeground }]}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 20, gap: 4 },
  headerTitle: { color: "#FFFFFF", fontSize: 28, fontFamily: "Inter_700Bold" },
  headerSub: { color: "#9CA3AF", fontSize: 13, fontFamily: "Inter_400Regular" },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 16 },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, borderWidth: 1, padding: 12 },
  dateText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: { width: "47%", borderRadius: 12, borderWidth: 1, padding: 16, gap: 8, elevation: 1 },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: 28, fontFamily: "Inter_700Bold", lineHeight: 32 },
  statLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  section: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 12, elevation: 1 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  sectionSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: -6 },
  statusRow: { flexDirection: "row", gap: 10 },
  pill: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, padding: 12 },
  pillDot: { width: 10, height: 10, borderRadius: 5 },
  pillCount: { fontSize: 22, fontFamily: "Inter_700Bold", lineHeight: 26 },
  pillLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  progressTrack: { height: 8, borderRadius: 4, flexDirection: "row", overflow: "hidden" },
  progressFill: { height: 8 },
  progressLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  tableHeader: { flexDirection: "row", alignItems: "center", paddingBottom: 8 },
  thName: { flex: 1, fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
  thStatus: { width: 72, fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5, textAlign: "center" },
  thTime: { width: 70, fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5, textAlign: "right" },
  rowSep: { height: 1 },
  tableRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  tdName: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium" },
  statusBadge: { width: 72, borderRadius: 6, paddingVertical: 3, alignItems: "center" },
  statusBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  tdTime: { width: 70, fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "right" },
  beltRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  beltBarWrap: { flex: 1, height: 6, backgroundColor: "#F3F4F6", borderRadius: 3, overflow: "hidden" },
  beltBar: { height: 6, borderRadius: 3 },
  beltCount: { fontSize: 13, fontFamily: "Inter_600SemiBold", minWidth: 20, textAlign: "right" },
  achieverRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  rankCircle: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  rankNum: { fontSize: 12, fontFamily: "Inter_700Bold" },
  achieverName: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  achieverBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  achieverCount: { fontSize: 13, fontFamily: "Inter_700Bold" },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", paddingVertical: 8 },
});
